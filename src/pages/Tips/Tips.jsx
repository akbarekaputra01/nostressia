// src/pages/Tips/Tips.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lightbulb, Loader2 } from "lucide-react"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; 

// --- API URL ---
import { BASE_URL } from "../../api/config";

// --- COLOR CONFIGURATION ---
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

const bgStyle = {
  minHeight: "100vh",
  backgroundColor: bgCream,
  backgroundImage: `
    radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), 
    radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), 
    radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)
  `,
  backgroundSize: "200% 200%",
  animation: "gradient-bg 20s ease infinite",
  fontFamily: "'Manrope', sans-serif"
};

const INITIAL_CATEGORIES = [
  { id: 1, name: "Reading & Learning", emoji: "📚", colorClass: "from-blue-50 to-blue-100 text-blue-600 border-blue-100" },
  { id: 2, name: "Healthy Nutrition", emoji: "🥗", colorClass: "from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-100" },
  { id: 3, name: "Quality Sleep", emoji: "😴", colorClass: "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100" },
  { id: 4, name: "Meditation & Mindfulness", emoji: "🧘", colorClass: "from-teal-50 to-teal-100 text-teal-600 border-teal-100" },
  { id: 5, name: "Social Connection", emoji: "🗣️", colorClass: "from-orange-50 to-orange-100 text-orange-600 border-orange-100" },
  { id: 6, name: "Positive Mindset", emoji: "🧠", colorClass: "from-gray-50 to-gray-100 text-gray-600 border-gray-200" },
];

// --- ANIMATION VARIANTS FOR SMOOTH ENTRANCE ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const getCategoryEmoji = (name) => {
  const n = name?.toLowerCase() || "";
  if (n.includes("read")) return "📚";
  if (n.includes("nutrition")) return "🥗";
  if (n.includes("sleep")) return "😴";
  if (n.includes("meditation")) return "🧘";
  if (n.includes("social")) return "🗣️";
  if (n.includes("mindset")) return "🧠";
  return "💡"; 
};

const getCategoryColor = (name) => {
  const n = name?.toLowerCase() || "";
  if (n.includes("read")) return "from-blue-50 to-blue-100 text-blue-600 border-blue-100";
  if (n.includes("nutrition")) return "from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-100";
  if (n.includes("sleep")) return "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100";
  if (n.includes("meditation")) return "from-teal-50 to-teal-100 text-teal-600 border-teal-100";
  if (n.includes("social")) return "from-orange-50 to-orange-100 text-orange-600 border-orange-100";
  return "from-gray-50 to-gray-100 text-gray-600 border-gray-200";
};

export default function Tips() {
  const [categories, setCategories] = useState(() => 
    INITIAL_CATEGORIES.map(c => ({ ...c, tipsCount: null, preloadedTips: [] }))
  );
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tips, setTips] = useState([]);
  const [loadingTips, setLoadingTips] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  
  const headerRef = useRef(null);
  const { user } = useOutletContext() || { user: {} };

  const syncData = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/tips/categories`);
      if (!res.ok) return;
      const serverData = await res.json();
      const updatedCategories = serverData.map(item => ({
        id: item.tipCategoryID || item.id,
        name: item.categoryName || item.name || "",
        emoji: getCategoryEmoji(item.categoryName || item.name),
        colorClass: getCategoryColor(item.categoryName || item.name),
        tipsCount: null,
        preloadedTips: []
      }));
      setCategories(updatedCategories);
      updatedCategories.forEach(async (cat) => {
        try {
          const tipsRes = await fetch(`${BASE_URL}/tips/by-category/${cat.id}`);
          if (tipsRes.ok) {
            const tipsData = await tipsRes.json();
            setCategories(prev => prev.map(c => 
              c.id === cat.id ? { ...c, tipsCount: tipsData.length, preloadedTips: tipsData } : c
            ));
          }
        } catch (e) { console.warn(e); }
      });
    } catch (err) { console.error("Sync Error:", err); }
  }, []);

  useEffect(() => {
    syncData();
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [syncData]);

  const openCategory = async (cat) => {
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (cat.preloadedTips?.length > 0) {
      setTips(cat.preloadedTips.map(item => ({ id: item.tipID, text: item.detail })));
    } else {
      setLoadingTips(true);
      try {
        const res = await fetch(`${BASE_URL}/tips/by-category/${cat.id}`);
        const data = await res.json();
        setTips(data.map(item => ({ id: item.tipID, text: item.detail })));
      } catch { setTips([]); } finally { setLoadingTips(false); }
    }
  };

  const getVerticalOrderedTips = (items) => {
    if (items.length === 0) return [];
    const half = Math.ceil(items.length / 2);
    const leftColumn = items.slice(0, half);
    const rightColumn = items.slice(half);
    const ordered = [];
    for (let i = 0; i < half; i++) {
      if (leftColumn[i]) ordered.push({ ...leftColumn[i], displayIndex: i + 1 });
      if (rightColumn[i]) ordered.push({ ...rightColumn[i], displayIndex: half + i + 1 });
    }
    return ordered;
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen text-gray-800 flex flex-col" style={bgStyle}>
      <style>{`@keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
      
      <div className="fixed top-0 left-0 right-0 z-50 pt-4">
        <Navbar activeLink="Tips" user={user} />
      </div>

      <main className="w-full max-w-[1600px] mx-auto px-4 pb-20 pt-32 md:pt-40 flex-grow relative z-10">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div 
              key="list" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* --- HEADER TIPS --- */}
              <motion.div variants={itemVariants} className="mb-10 md:mb-14 text-center">
                <div className="flex items-center gap-3 mb-3 justify-center">
                  <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-[var(--brand-blue)] drop-shadow-lg" />
                  <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-blue-light)] bg-clip-text text-transparent drop-shadow-md">
                    Tips
                  </h1>
                </div>
                <p className="text-sm md:text-lg font-medium drop-shadow-sm px-4 text-[var(--text-secondary)]">
                  Choose a category to explore helpful tips for managing stress
                </p>
              </motion.div>

              {/* --- SEARCH BAR --- */}
              <motion.div variants={itemVariants} className="w-full mb-12">
                <div className="relative w-full">
                  <input 
                    type="text" 
                    placeholder="Find topics..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-14 pr-6 py-5 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 focus:bg-white outline-none font-medium text-lg transition-all"
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                    <svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" /></svg>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <motion.div 
                      key={cat.id} 
                      whileHover={{ y: -5, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openCategory(cat)} 
                      className={`group relative p-8 rounded-[32px] cursor-pointer bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:bg-white transition-all h-56 overflow-hidden ${cat.colorClass.split(" ").pop()}`}
                    >
                      <div className="flex justify-between items-start z-10 relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white/60 border border-white/50">{cat.emoji}</div>
                        <div className="bg-white/60 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/50 flex items-center gap-1.5 min-w-[75px] justify-center">
                          {cat.tipsCount !== null ? `${cat.tipsCount} Tips` : <><Loader2 size={10} className="animate-spin text-blue-500" /><span>Loading...</span></>}
                        </div>
                      </div>
                      <div className="mt-8 relative z-10">
                        <h3 className="text-2xl font-bold text-gray-800">{cat.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">Click to explore</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400 font-medium">No categories found.</div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="details" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-8 bg-white/90 backdrop-blur-xl px-6 py-5 rounded-[24px] shadow-lg border border-white/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedCategory(null)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-transform active:scale-90">
                    <ArrowLeft size={22}/>
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCategory.name}</h2>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white border border-gray-100 shadow-sm">{selectedCategory.emoji}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loadingTips ? (
                  [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/40 rounded-3xl animate-pulse"/>)
                ) : (
                  getVerticalOrderedTips(tips).map((tip, idx) => (
                    <motion.div 
                      key={tip.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/80 px-8 py-5 rounded-[28px] border border-white/60 shadow-sm relative group hover:bg-white transition-colors overflow-hidden flex items-center min-h-[90px]"
                    >
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl md:text-8xl font-extrabold text-gray-200/40 select-none pointer-events-none group-hover:text-blue-100/50 transition-colors z-0">
                        {tip.displayIndex}
                      </span>
                      <p className="text-lg md:text-xl font-medium text-gray-700 relative z-10 leading-relaxed pr-10">
                        {tip.text}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
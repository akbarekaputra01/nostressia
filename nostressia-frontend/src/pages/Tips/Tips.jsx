// src/pages/Tips/Tips.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom"; 
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Lightbulb, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; 

// --- API URL ---
import { getTipCategories, getTipsByCategory } from "../../services/tipsService";

// --- COLOR CONFIGURATION ---
const bgCream = "var(--bg-gradient-cream)";
const bgPink = "var(--bg-gradient-pink)";
const bgLavender = "var(--bg-gradient-lavender)";

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

const TIP_STYLE_PRESETS = [
  {
    emoji: "📚",
    colorClass: "from-blue-50 to-blue-100 text-blue-600 border-blue-100",
  },
  {
    emoji: "🥗",
    colorClass: "from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-100",
  },
  {
    emoji: "😴",
    colorClass: "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100",
  },
  {
    emoji: "🧘",
    colorClass: "from-teal-50 to-teal-100 text-teal-600 border-teal-100",
  },
  {
    emoji: "🗣️",
    colorClass: "from-orange-50 to-orange-100 text-orange-600 border-orange-100",
  },
  {
    emoji: "🧠",
    colorClass: "from-gray-50 to-gray-100 text-gray-600 border-gray-200",
  },
];

const DUMMY_TIP_CATEGORIES = [
  {
    id: "placeholder-focus",
    name: "Focus Boost",
    emoji: "📚",
    colorClass: "from-blue-50 to-blue-100 text-blue-600 border-blue-100",
    tips: [
      "Use a 25-minute focus sprint (Pomodoro), then take a 5-minute break.",
      "Write down the top 3 tasks you must finish today.",
      "Silence notifications for 30 minutes to reduce distractions.",
    ],
  },
  {
    id: "placeholder-balance",
    name: "Mind & Body",
    emoji: "🧘",
    colorClass: "from-teal-50 to-teal-100 text-teal-600 border-teal-100",
    tips: [
      "Try a 4-7-8 breathing cycle to lower stress quickly.",
      "Stretch for 3 minutes after long study sessions.",
      "Drink water before coffee to stay hydrated.",
    ],
  },
  {
    id: "placeholder-rest",
    name: "Sleep Reset",
    emoji: "😴",
    colorClass: "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100",
    tips: [
      "Stop screen time 30 minutes before bed.",
      "Keep your bedroom cool and dim for deeper sleep.",
      "Aim for consistent sleep and wake times daily.",
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Tips() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncStatus, setSyncStatus] = useState('updating'); 
  const [isMobile, setIsMobile] = useState(false);
  
  const { user } = useOutletContext() || { user: {} };

  // Deteksi ukuran layar untuk memperbaiki urutan nomor
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const syncData = useCallback(async () => {
    setSyncStatus('updating');
    try {
      const serverData = await getTipCategories();
      
      const updatedCategories = await Promise.all(serverData.map(async (item, index) => {
        const id = item.tipCategoryId || item.id;
        const tipsData = await getTipsByCategory(id);
        const preset = TIP_STYLE_PRESETS[index % TIP_STYLE_PRESETS.length];
        return {
          id: id,
          name: item.categoryName || item.name || "",
          emoji: preset?.emoji || "💡",
          colorClass: preset?.colorClass || "from-gray-50 to-gray-100 text-gray-600 border-gray-200",
          tipsCount: tipsData.length,
          tips: tipsData.map(t => t.detail)
        };
      }));

      setCategories(updatedCategories);
      setSyncStatus('updated');
    } catch {
      console.warn("Sync failed, no tips data loaded.");
      setCategories([]);
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [syncData]);

  useEffect(() => {
    if (syncStatus === "updated") {
      setSelectedCategory(null);
    }
  }, [syncStatus]);

  const openCategory = (cat) => {
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getVerticalOrderedTips = (items) => {
    if (!items || items.length === 0) return [];
    
    // Jika di Mobile, urutan normal 1, 2, 3...
    if (isMobile) {
      return items.map((text, i) => ({ text, displayIndex: i + 1 }));
    }

    // Jika di Desktop, urutan kolom 1-5, 2-6...
    const half = Math.ceil(items.length / 2);
    const leftColumn = items.slice(0, half);
    const rightColumn = items.slice(half);
    
    const ordered = [];
    for (let i = 0; i < half; i++) {
      if (leftColumn[i]) ordered.push({ text: leftColumn[i], displayIndex: i + 1 });
      if (rightColumn[i]) ordered.push({ text: rightColumn[i], displayIndex: half + i + 1 });
    }
    return ordered;
  };

  const fallbackCategories = useMemo(
    () =>
      DUMMY_TIP_CATEGORIES.map((item) => ({
        ...item,
        tipsCount: item.tips.length,
      })),
    []
  );

  const categorySource =
    syncStatus === "updated" ? categories : fallbackCategories;

  const filteredCategories = useMemo(() => {
    return categorySource.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categorySource, searchQuery]);

  return (
    <div className="min-h-screen text-gray-800 dark:text-slate-100 flex flex-col" style={bgStyle}>
      <style>{`@keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
      
      <div className="fixed top-0 left-0 right-0 z-50 pt-4">
        <Navbar activeLink="Tips" user={user} />
      </div>

      <main className="w-full max-w-[1400px] mx-auto px-4 pb-20 pt-32 md:pt-40 flex-grow relative z-10">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <Motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              
              <Motion.div variants={itemVariants} className="mb-8 md:mb-10 text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-[var(--brand-blue)] drop-shadow-lg" />
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-blue-light)] bg-clip-text text-transparent drop-shadow-md">
                    Tips
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-slate-300 mt-2 text-base md:text-lg font-medium">
                  Choose a category to explore helpful tips for managing stress
                </p>
              </Motion.div>

              <Motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-3 mb-10">
                <div className="relative flex-grow w-full">
                  <input 
                    type="text" 
                    placeholder="Find topics..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-11 pr-4 py-3 bg-white/80 text-gray-700 dark:bg-slate-900/70 dark:text-slate-100 backdrop-blur-md rounded-xl shadow-sm border border-white/70 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 outline-none font-medium text-base transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" /></svg>
                  </div>
                </div>

                <div 
                  className={`flex items-center gap-2 font-bold text-[10px] md:text-xs px-4 py-3 rounded-xl border backdrop-blur-md shadow-sm whitespace-nowrap transition-all duration-500 min-w-fit h-full ${
                    syncStatus === 'updating' 
                    ? "text-blue-600 bg-blue-50/90 border-blue-200 dark:text-blue-200 dark:bg-blue-500/20 dark:border-blue-400/40" 
                    : syncStatus === 'updated'
                    ? "text-emerald-600 bg-emerald-50/90 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-400/40"
                    : "text-rose-600 bg-rose-50/90 border-rose-200 dark:text-rose-200 dark:bg-rose-500/20 dark:border-rose-400/40"
                  }`}
                >
                  {syncStatus === 'updating' ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : syncStatus === 'updated' ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Data Updated</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} />
                      <span>Failed to load tips.</span>
                    </>
                  )}
                </div>
              </Motion.div>

              <Motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-white/80 dark:border-slate-700 bg-white/70 dark:bg-slate-900/70 p-6 text-center text-gray-500 dark:text-slate-300">
                    No tips available yet.
                  </div>
                ) : (
                  filteredCategories.map((cat) => (
                    <Motion.div 
                      key={cat.id} 
                      layoutId={`cat-${cat.id}`} 
                      onClick={() => openCategory(cat)} 
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`group relative p-8 rounded-[32px] cursor-pointer bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm border border-white/70 dark:border-slate-700 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-900 transition-all h-56 overflow-hidden ${cat.colorClass.split(" ").pop()}`}
                    >
                      <div className="flex justify-between items-start z-10 relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white/70 dark:bg-slate-800/70 border border-white/60 dark:border-slate-700">{cat.emoji}</div>
                        <div className="bg-white/70 dark:bg-slate-800/70 text-gray-600 dark:text-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/60 dark:border-slate-700 flex items-center justify-center">
                          {cat.tipsCount} Tips
                        </div>
                      </div>
                      <div className="mt-8 relative z-10">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-slate-100">{cat.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">Click to explore</p>
                      </div>
                    </Motion.div>
                  ))
                )}
              </Motion.div>
            </Motion.div>
          ) : (
            <Motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="mb-8 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-5 rounded-[24px] shadow-lg border border-white/50 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedCategory(null)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700 shadow-sm transition-transform active:scale-90">
                    <ArrowLeft size={22}/>
                  </button>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-slate-100">{selectedCategory.name}</h2>
                </div>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm">{selectedCategory.emoji}</div>
              </div>

              {/* Grid Responsif: md:grid-cols-2 untuk Desktop, grid-cols-1 untuk Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {getVerticalOrderedTips(selectedCategory.tips).map((tip, idx) => (
                  <Motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/80 dark:bg-slate-900/70 px-6 py-4 md:px-8 md:py-5 rounded-[24px] md:rounded-[28px] border border-white/60 dark:border-slate-700 shadow-sm relative group hover:bg-white dark:hover:bg-slate-900 transition-colors overflow-hidden flex items-center min-h-[80px] md:min-h-[90px]"
                  >
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl md:text-8xl font-extrabold text-gray-200/40 dark:text-slate-700/60 select-none pointer-events-none group-hover:text-blue-100/50 dark:group-hover:text-blue-900/40 transition-colors z-0">
                      {tip.displayIndex}
                    </span>
                    <p className="text-sm md:text-xl font-medium text-gray-700 dark:text-slate-200 relative z-10 leading-relaxed pr-10">
                      {tip.text}
                    </p>
                  </Motion.div>
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

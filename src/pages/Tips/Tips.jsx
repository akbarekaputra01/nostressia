// src/pages/Tips/Tips.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Zap, Sparkles 
} from "lucide-react"; 
import Navbar from "../../components/Navbar";

// --- API URL ---
const BASE_URL = "https://nostressia-backend.vercel.app/api/tips";

// --- COLOR CONFIGURATION ---
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

// --- BACKGROUND STYLE ---
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

// --- HELPER: EMOJI MAPPING ---
const getCategoryEmoji = (name) => {
  const n = name.toLowerCase();
  if (n.includes("sleep") || n.includes("tidur")) return "😴";
  if (n.includes("nutrition") || n.includes("makan") || n.includes("sehat")) return "🥗";
  if (n.includes("meditation") || n.includes("mind")) return "🧘";
  if (n.includes("social") || n.includes("teman")) return "🗣️";
  if (n.includes("physical") || n.includes("exercise") || n.includes("lari")) return "🏃";
  if (n.includes("creative") || n.includes("art")) return "🎨";
  if (n.includes("read") || n.includes("learn") || n.includes("study")) return "📚";
  if (n.includes("time")) return "⏰";
  if (n.includes("mindset")) return "🧠";
  return "💡"; 
};

// --- HELPER: WARNA KATEGORI ---
const getCategoryColor = (name) => {
  const n = name.toLowerCase();
  if (n.includes("sleep") || n.includes("tidur")) return "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100";
  if (n.includes("nutrition") || n.includes("makan")) return "from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-100";
  if (n.includes("meditation") || n.includes("mind")) return "from-teal-50 to-teal-100 text-teal-600 border-teal-100";
  if (n.includes("social")) return "from-orange-50 to-orange-100 text-orange-600 border-orange-100";
  if (n.includes("physical") || n.includes("exercise")) return "from-rose-50 to-rose-100 text-rose-600 border-rose-100";
  if (n.includes("creative")) return "from-pink-50 to-pink-100 text-pink-600 border-pink-100";
  if (n.includes("read") || n.includes("learn")) return "from-blue-50 to-blue-100 text-blue-600 border-blue-100";
  return "from-gray-50 to-gray-100 text-gray-600 border-gray-200";
};

export default function Tips() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tips, setTips] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${BASE_URL}/categories`);
        const data = await res.json();

        const mapped = data.map((item) => {
          const name = item.categoryName || item.name || "";
          const emoji = getCategoryEmoji(name);
          const colorClass = getCategoryColor(name);

          return {
            id: item.tipCategoryID || item.id,
            name: name,
            emoji: emoji,
            colorClass: colorClass,
            tipsCount: Math.floor(Math.random() * 8) + 3 
          };
        });
        setCategories(mapped);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // --- SCROLL LISTENER ---
  useEffect(() => {
    const handleScroll = () => {
      // Threshold 100px agar tidak terlalu sensitif di awal
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openCategory = async (cat) => {
    setSelectedCategory(cat);
    setLoadingTips(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    try {
      const res = await fetch(`${BASE_URL}/by-category/${cat.id}`);
      const data = await res.json();
      setTips(data.map(item => ({ id: item.tipID, text: item.detail })));
    } catch { setTips([]); } 
    finally { setLoadingTips(false); }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setTips([]);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen text-gray-800" style={bgStyle}>
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
      
      {/* 1. WRAPPER NAVBAR UTAMA 
          - duration: 0.8 -> Membuat animasi lebih lambat dan tenang.
          - ease: "easeInOut" -> Memastikan gerakan halus (slow start, slow end).
      */}
      <motion.div 
        className="fixed top-0 left-0 right-0 z-40 pt-4"
        initial={{ y: 0, opacity: 1 }}
        animate={{ 
          y: selectedCategory && isScrolled ? "-150%" : "0%", 
          opacity: selectedCategory && isScrolled ? 0 : 1 
        }}
        transition={{ 
          duration: 0.5,
          ease: "easeInOut" 
        }}
      >
        <Navbar />
      </motion.div>

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-6 pb-20 pt-28 md:pt-32">
        <AnimatePresence mode="wait">
          
          {/* === VIEW 1: HOME (HEADER + KATEGORI) === */}
          {!selectedCategory && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              
              {/* HEADER */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 mb-4 text-orange-600 font-bold text-sm tracking-wider uppercase bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/50">
                    <Zap size={16} fill="currentColor" /> Daily Growth
                  </div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight drop-shadow-sm">
                    Curated <span className="text-blue-600">Tips</span> <br className="hidden md:block"/>
                    for Better Life.
                  </h1>
                </div>
                
                <div className="relative w-full md:w-72">
                  
                  {/* --- INPUT --- */}
                  <input 
                    type="text" 
                    placeholder="Find topics..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-500 font-medium"
                  />

                  {/* SVG ICON (DI BAWAH INPUT DALAM KODE, AGAR RENDER DI ATAS) */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        fill="currentColor" 
                        viewBox="0 0 256 256"
                    >
                        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                    </svg>
                  </div>
                  
                </div>
              </div>

              {/* GRID KATEGORI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingCategories ? (
                   [...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white/40 rounded-3xl animate-pulse"/>)
                ) : filteredCategories.length > 0 ? (
                  filteredCategories.map((cat, i) => (
                    <motion.div
                      key={cat.id}
                      layoutId={`cat-${cat.id}`}
                      onClick={() => openCategory(cat)}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className={`
                        group relative p-6 rounded-[32px] cursor-pointer bg-white/80 backdrop-blur-sm border 
                        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] hover:bg-white
                        transition-all duration-300 flex flex-col justify-between h-52 overflow-hidden
                        ${cat.colorClass.split(" ").pop()}
                      `}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.colorClass} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                      
                      <div className="flex justify-between items-start z-10">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white/60 border border-white/50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {cat.emoji}
                        </div>
                        <span className="bg-white/60 text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-white/50 backdrop-blur-sm">
                          {cat.tipsCount} Tips
                        </span>
                      </div>

                      <div className="z-10 mt-4">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Click to explore</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400">No categories found.</div>
                )}
              </div>
            </motion.div>
          )}

          {/* === VIEW 2: DETAIL TIPS === */}
          {selectedCategory && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* 2. NAVBAR SEMENTARA (STICKY) */}
              <div className="sticky top-4 z-50 mb-8 transition-all duration-300">
                  <div className="bg-white/90 backdrop-blur-xl px-6 py-4 rounded-[20px] shadow-xl border border-white/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm border border-gray-100 cursor-pointer group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/>
                      </button>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Category</span>
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 leading-none truncate max-w-[200px] md:max-w-none">{selectedCategory.name}</h2>
                      </div>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-2xl md:text-3xl bg-white border border-gray-100 shadow-sm">
                        {selectedCategory.emoji}
                    </div>
                  </div>
              </div>

              {/* Tips Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loadingTips ? (
                   [...Array(4)].map((_,i) => <div key={i} className="h-32 bg-white/40 rounded-3xl animate-pulse"/>)
                ) : tips.length > 0 ? (
                  tips.map((tip, idx) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-[32px] border border-white/60 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300 group relative overflow-hidden"
                    >
                      {/* --- POSISI ANGKA: KANAN, TIPIS & HALUS --- */}
                      <span className="absolute -right-4 -top-4 text-9xl font-extrabold text-gray-200 opacity-50 select-none pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        {idx + 1}
                      </span>

                      <div className="relative z-10 flex items-start gap-4">
                        <div className="flex-1">
                          <p className="text-lg md:text-xl font-medium text-gray-700 leading-relaxed group-hover:text-gray-900">
                            {tip.text}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No tips yet for this category.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
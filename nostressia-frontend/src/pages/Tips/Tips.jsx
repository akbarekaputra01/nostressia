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
  { id: 1, name: "Reading & Learning", emoji: "📚", colorClass: "from-blue-50 to-blue-100 text-blue-600 border-blue-100", tipsCount: 7, tips: ["Read for 20-30 minutes before bed to calm your mind", "Join a book club to share insights with others", "Try audiobooks during commutes or workouts", "Explore different genres to broaden perspectives", "Choose books that inspire and motivate you", "Keep a reading journal to track your thoughts", "Set realistic reading goals to avoid pressure"] },
  { id: 2, name: "Healthy Nutrition", emoji: "🥗", colorClass: "from-emerald-50 to-emerald-100 text-emerald-600 border-emerald-100", tipsCount: 7, tips: ["Drink at least 8 glasses of water daily", "Include fruits and vegetables in every meal", "Limit caffeine intake, especially in the afternoon", "Practice mindful eating without distractions", "Choose whole grains over processed foods", "Prepare healthy snacks in advance", "Listen to your body's hunger and fullness cues"] },
  { id: 3, name: "Quality Sleep", emoji: "😴", colorClass: "from-indigo-50 to-indigo-100 text-indigo-600 border-indigo-100", tipsCount: 7, tips: ["Maintain a consistent sleep schedule", "Create a relaxing bedtime routine", "Keep your bedroom cool, dark, and quiet", "Avoid screens 1 hour before bedtime", "Limit naps to 20-30 minutes during the day", "Exercise regularly but not close to bedtime", "Use relaxation techniques like deep breathing"] },
  { id: 4, name: "Meditation & Mindfulness", emoji: "🧘", colorClass: "from-teal-50 to-teal-100 text-teal-600 border-teal-100", tipsCount: 7, tips: ["Start your day with 5 minutes of mindful breathing", "Practice daily gratitude by writing down 3 things", "Engage in body scan meditation to release tension", "Take mindful walks in nature regularly", "Use a meditation app for guided sessions", "Notice the present moment without judgment", "Take short breaks to breathe during the day"] },
  { id: 5, name: "Social Connection", emoji: "🗣️", colorClass: "from-orange-50 to-orange-100 text-orange-600 border-orange-100", tipsCount: 7, tips: ["Call or meet a friend you haven't talked to in a while", "Practice active listening during conversations", "Volunteer for a cause you care about", "Join a community group or hobby class", "Spend quality time with family without gadgets", "Say hello to your neighbors or coworkers", "Express appreciation to people in your life"] },
  { id: 6, name: "Positive Mindset", emoji: "🧠", colorClass: "from-gray-50 to-gray-100 text-gray-600 border-gray-200", tipsCount: 7, tips: ["Challenge negative thoughts with positive affirmations", "Focus on things you can control, not the ones you can't", "Celebrate small wins every day", "Surround yourself with positive and supportive people", "Practice self-compassion when things go wrong", "Visualize your success and goals regularly", "Limit exposure to negative news or social media"] },
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
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
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
      
      const updatedCategories = await Promise.all(serverData.map(async (item) => {
        const id = item.tipCategoryId || item.id;
        const tipsData = await getTipsByCategory(id);
        const existing = INITIAL_CATEGORIES.find(c => c.id === id);
        return {
          id: id,
          name: item.categoryName || item.name || "",
          emoji: existing?.emoji || "💡",
          colorClass: existing?.colorClass || "from-gray-50 to-gray-100 text-gray-600 border-gray-200",
          tipsCount: tipsData.length,
          tips: tipsData.map(t => t.detail)
        };
      }));

      setCategories(updatedCategories);
      setSyncStatus('updated');
    } catch {
      console.warn("Sync failed, using local/static data.");
      setSyncStatus('error');
    }
  }, []);

  useEffect(() => {
    syncData();
  }, [syncData]);

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
            <Motion.div key="list" variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
              
              <Motion.div variants={itemVariants} className="mb-8 md:mb-10 text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Lightbulb className="w-6 h-6 md:w-8 md:h-8 text-[var(--brand-blue)] drop-shadow-lg" />
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-blue-light)] bg-clip-text text-transparent drop-shadow-md">
                    Tips
                  </h1>
                </div>
                <p className="text-gray-600 mt-2 text-base md:text-lg font-medium">
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
                    className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-white/50 focus:bg-white outline-none font-medium text-base transition-all"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" /></svg>
                  </div>
                </div>

                <div 
                  className={`flex items-center gap-2 font-bold text-[10px] md:text-xs px-4 py-3 rounded-xl border backdrop-blur-md shadow-sm whitespace-nowrap transition-all duration-500 min-w-fit h-full ${
                    syncStatus === 'updating' 
                    ? "text-blue-600 bg-blue-50/90 border-blue-200" 
                    : syncStatus === 'updated'
                    ? "text-emerald-600 bg-emerald-50/90 border-emerald-200"
                    : "text-rose-600 bg-rose-50/90 border-rose-200"
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
                      <span>Failed to load tips. Using local data.</span>
                    </>
                  )}
                </div>
              </Motion.div>

              <Motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((cat) => (
                  <Motion.div 
                    key={cat.id} 
                    layoutId={`cat-${cat.id}`} 
                    onClick={() => openCategory(cat)} 
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`group relative p-8 rounded-[32px] cursor-pointer bg-white/80 backdrop-blur-sm border shadow-sm hover:shadow-md hover:bg-white transition-all h-56 overflow-hidden ${cat.colorClass.split(" ").pop()}`}
                  >
                    <div className="flex justify-between items-start z-10 relative">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-white/60 border border-white/50">{cat.emoji}</div>
                      <div className="bg-white/60 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/50 flex items-center justify-center">
                        {cat.tipsCount} Tips
                      </div>
                    </div>
                    <div className="mt-8 relative z-10">
                      <h3 className="text-2xl font-bold text-gray-800">{cat.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Click to explore</p>
                    </div>
                  </Motion.div>
                ))}
              </Motion.div>
            </Motion.div>
          ) : (
            <Motion.div key="details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="mb-8 bg-white/90 backdrop-blur-xl px-6 py-5 rounded-[24px] shadow-lg border border-white/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedCategory(null)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 border border-gray-100 shadow-sm transition-transform active:scale-90">
                    <ArrowLeft size={22}/>
                  </button>
                  <h2 className="text-lg md:text-2xl font-bold text-gray-800">{selectedCategory.name}</h2>
                </div>
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl bg-white border border-gray-100 shadow-sm">{selectedCategory.emoji}</div>
              </div>

              {/* Grid Responsif: md:grid-cols-2 untuk Desktop, grid-cols-1 untuk Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {getVerticalOrderedTips(selectedCategory.tips).map((tip, idx) => (
                  <Motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/80 px-6 py-4 md:px-8 md:py-5 rounded-[24px] md:rounded-[28px] border border-white/60 shadow-sm relative group hover:bg-white transition-colors overflow-hidden flex items-center min-h-[80px] md:min-h-[90px]"
                  >
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl md:text-8xl font-extrabold text-gray-200/40 select-none pointer-events-none group-hover:text-blue-100/50 transition-colors z-0">
                      {tip.displayIndex}
                    </span>
                    <p className="text-sm md:text-xl font-medium text-gray-700 relative z-10 leading-relaxed pr-10">
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

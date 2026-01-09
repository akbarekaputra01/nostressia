// src/pages/Diary/Diary.jsx
import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; 
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, X } from "lucide-react"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; 

// --- COLOR CONFIGURATION ---
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

export default function Diary() {
  // --- STATE ---
  const baseFont = "var(--font-base), 'Manrope', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState("😐");
  const [selectedFont, setSelectedFont] = useState(baseFont);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollRef = useRef(null);

  const { user } = useOutletContext() || { user: {} }; 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- CONFIG ---
  const fontOptions = [
    { name: "Default", value: baseFont, label: "Aa" },
    { name: "Handwriting", value: "'Patrick Hand', cursive", label: "✍️" },
    { name: "Cute", value: "'Fredoka', sans-serif", label: "🧸" },
  ];

  const moods = [
    { emoji: "😢", label: "Stressed" },
    { emoji: "😕", label: "Sad" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😊", label: "Happy" },
    { emoji: "😄", label: "Excited" },
  ];

  const colors = {
    brandBlue: "#3664BA",
    brandOrange: "#F2994A",
    brandBlueLight: "#2F80ED",
    textPrimary: "#333333",
    bgCream: "#FFF3E0",
    bgLavender: "#e3edff"
  };

  const handleSubmit = () => {
    if (!text.trim() || !title.trim()) return;
    const newEntry = {
      id: Date.now(), title: title, content: text, mood: selectedMood, font: selectedFont,
      date: new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", }),
    };
    setEntries([newEntry, ...entries]); setTitle(""); setText(""); setSelectedMood("😐"); setIsBookOpen(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef; const scrollAmount = 300;
      current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col font-sans transition-colors duration-500 custom-scrollbar"
      style={{
        backgroundColor: bgCream,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
        fontFamily: baseFont,
      }}
    >
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

        .notebook-lines {
            background-color: #fffaf5;
            background-image: linear-gradient(transparent 31px, #e2e8f0 31px);
            background-size: 100% 32px;
            background-attachment: local;
        }

        .spiral-spine {
            position: absolute;
            left: 12px;
            top: 16px;
            bottom: 16px;
            width: 30px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            z-index: 30;
        }
        .spiral-ring {
            width: 25px;
            height: 8px;
            background: linear-gradient(to bottom, #d1d5db, #9ca3af, #d1d5db);
            border-radius: 4px;
            box-shadow: 2px 1px 3px rgba(0,0,0,0.15);
            position: relative;
        }
        .spiral-hole {
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 8px;
            background: #475569;
            border-radius: 50%;
        }
      `}</style>
      
      {/* NAVBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-4">
        <Navbar activeLink="Diary" user={user} />
      </div>

      <div className="h-[100px] md:h-[110px]" />

      <main className="flex-grow flex flex-col items-center w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 z-10 pt-0">
        
        {/* --- HEADER SECTION --- */}
        <Motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="mb-3 w-full flex flex-col items-center text-center" // JARAK DIUBAH DARI mb-8 MENJADI mb-3
        >
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Heart className="w-9 h-9 text-yellow-400 drop-shadow-lg" strokeWidth={2.5} />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                Diary Nostressia
              </h1>
            </div>
            <p className="text-gray-600 mt-2 text-base md:text-lg font-medium w-full text-center">
              Write your story today.
            </p>
        </Motion.div>

        {/* 3D BOOK ENGINE */}
        {/* mt-0 memastikan tidak ada jarak tambahan di atas kontainer buku */}
        <div className="relative w-full max-w-[1000px] h-[520px] md:h-[600px] flex items-center justify-center perspective-[2000px] mt-0">
            <Motion.div className="relative w-[310px] sm:w-[360px] md:w-[380px] h-[480px] md:h-[520px] preserve-3d"
                animate={{ x: (isBookOpen && !isMobile) ? 190 : 0 }} 
                transition={{ duration: 0.8, type: "spring", stiffness: 40, damping: 15 }}
            >
                {/* --- LAYER 1: HALAMAN KANAN --- */}
                <div className="absolute inset-0 w-full h-full bg-[#fcf9f5] rounded-[16px] md:rounded-l-[4px] md:rounded-r-[16px] shadow-[10px_10px_30px_rgba(0,0,0,0.15)] z-0 flex flex-col overflow-hidden border border-slate-200">
                    <div className="flex-grow p-5 md:p-8 flex flex-col relative z-10">
                         <button onClick={() => setIsBookOpen(false)} className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-2 overflow-x-auto overflow-y-hidden no-scrollbar py-2 border-b border-slate-200">
                            {moods.map((m) => (
                                <button key={m.label} onClick={() => setSelectedMood(m.emoji)} className={`text-2xl hover:scale-110 transition-transform p-1 rounded-lg cursor-pointer ${selectedMood === m.emoji ? "bg-blue-50 scale-110" : "opacity-60 grayscale"}`}>{m.emoji}</button>
                            ))}
                        </div>

                        <div className="flex-grow relative w-full h-full flex flex-col overflow-hidden">
                            <div className="absolute inset-0 opacity-50 pointer-events-none" 
                                style={{ 
                                    backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px)", 
                                    backgroundSize: "100% 40px", 
                                    backgroundPosition: "0px 39px" 
                                }}>
                            </div>

                            <input
                                type="text"
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title..."
                                className="bg-transparent text-xl md:text-2xl font-bold placeholder:text-slate-300 focus:outline-none w-full h-[40px] leading-[40px] mb-0 relative z-10 overflow-hidden"
                                style={{ fontFamily: selectedFont || baseFont, color: colors.brandBlue }}
                            />

                            <textarea
                                value={text} onChange={(e) => setText(e.target.value)}
                                placeholder="Dear diary..."
                                className="flex-grow bg-transparent resize-none focus:outline-none text-slate-700 text-base md:text-lg leading-[40px] custom-scrollbar w-full relative z-10 pt-0"
                                style={{ fontFamily: selectedFont || baseFont }}
                            />
                        </div>

                        <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100">
                             <div className="flex gap-1">{fontOptions.map(f => (<button key={f.name} onClick={() => setSelectedFont(f.value)} className={`w-6 h-6 rounded-full border text-[10px] flex items-center justify-center transition-all cursor-pointer ${selectedFont === f.value ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}>{f.label}</button>))}</div>
                             <button onClick={handleSubmit} className="px-5 py-2 rounded-lg font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer" style={{ backgroundColor: colors.brandBlue }}>Save</button>
                        </div>
                    </div>
                </div>

                {/* --- LAYER 2: COVER DEPAN --- */}
                <Motion.div className="absolute inset-0 w-full h-full cursor-pointer preserve-3d origin-left z-20"
                    animate={{ rotateY: isBookOpen ? -180 : 0, opacity: (isBookOpen && isMobile) ? 0 : 1 }}
                    transition={{ duration: 0.8, type: "spring", stiffness: 40, damping: 15 }} 
                    onClick={() => !isBookOpen && setIsBookOpen(true)}
                    style={{ pointerEvents: (isBookOpen && isMobile) ? 'none' : 'auto' }}
                >
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-r-[16px] rounded-l-[4px] shadow-2xl flex flex-col items-center justify-center" style={{ backgroundColor: colors.brandBlue, borderLeft: `8px solid ${colors.brandBlueLight}` }}>
                        <div className="absolute top-4 bottom-4 left-6 right-4 border-2 rounded-r-lg opacity-80" style={{ borderColor: colors.brandOrange }}></div>
                        <div className="absolute top-6 bottom-6 left-8 right-6 border border-dashed rounded-r-md opacity-50" style={{ borderColor: colors.brandOrange }}></div>
                        <div className="z-10 text-center p-6 md:p-8 bg-black/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner" style={{ transform: isBookOpen ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.7s ease-in-out", transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}>
                            <span className="text-4xl filter drop-shadow-md">📘</span>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-4 tracking-widest font-serif">DIARY</h2>
                            <div className="w-16 h-1 mx-auto my-3 rounded-full" style={{ backgroundColor: colors.brandOrange }}></div>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.3em]">Nostressia</p>
                        </div>
                        {!isBookOpen && (<div className="absolute bottom-8 animate-bounce text-white/50 text-xs font-bold tracking-widest uppercase">Click to Open</div>)}
                    </div>
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-l-[16px] rounded-r-[4px] shadow-inner bg-[#fcf9f5] border-r border-slate-200" style={{ transform: "rotateY(180deg)" }}>
                         <div className="w-full h-full flex flex-col items-center justify-center p-10 opacity-60">
                            <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=${colors.brandOrange.replace('#','')}&color=fff`} alt="User" className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-serif italic text-slate-500 text-base md:text-lg">This diary belongs to:</h3>
                            <h2 className="text-xl font-bold text-slate-700 mt-1">{user?.name || "User"}</h2>
                            <div className="border-b-2 border-slate-300 w-full mt-2 mb-6"></div>
                            <p className="text-center text-xs text-slate-400 leading-loose italic font-serif">"Keep your face always toward the sunshine—and shadows will fall behind you."</p>
                         </div>
                    </div>
                </Motion.div>
            </Motion.div>
        </div>

        {/* --- 3. HISTORY SECTION --- */}
        <div className="w-full max-w-6xl mt-12 pb-20 px-0 md:px-4">
             {entries.length > 0 ? (
                <>
                <div className="flex items-center gap-2 mb-6 px-4 md:px-0"><div className="h-8 w-1 rounded-full" style={{ backgroundColor: colors.brandOrange }}></div><h3 className="font-bold text-xl" style={{ color: colors.textPrimary }}>Your Memories</h3></div>
                <div className="relative group px-4 md:px-0">
                    <button onClick={() => scroll("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex cursor-pointer">←</button>
                    <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                        <AnimatePresence mode="popLayout">
                            {entries.map(entry => (
                                <Motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex-shrink-0 snap-center relative group/card bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-6 w-[85vw] sm:w-[320px] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] h-[240px]" onClick={() => setSelectedEntry(entry)}>
                                    <div><div className="flex justify-between items-start mb-3"><span className="text-3xl filter drop-shadow-sm">{entry.mood}</span><button onClick={(e) => handleDelete(entry.id, e)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500 hover:text-white">✕</button></div><h4 className="font-bold text-lg mb-1 truncate leading-tight" style={{ color: colors.textPrimary, fontFamily: entry.font || baseFont }}>{entry.title}</h4><p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 text-slate-500">{entry.date}</p></div>
                                    <div className="relative overflow-hidden h-full"><p className="text-slate-500 text-sm leading-relaxed line-clamp-3" style={{ fontFamily: entry.font || baseFont }}>{entry.content}</p><div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div></div>
                                    <div className="mt-2 text-right"><span className="text-xs font-semibold text-blue-400 group-hover/card:underline">Read more →</span></div>
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <button onClick={() => scroll("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex cursor-pointer">→</button>
                </div>
                </>
             ) : ( <div className="flex flex-col items-center justify-center py-16 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl mx-4"><span className="text-4xl mb-2">📝</span><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No stories recorded yet</p></div> )}
        </div>
      </main>

      {/* --- MODAL DETAIL --- */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEntry(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <Motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} 
                className="relative bg-[#e2e8f0] w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col p-2"
            >
              <div className="relative flex-grow bg-[#fffaf5] rounded-xl overflow-hidden flex shadow-inner border border-slate-300">
                
                <div className="spiral-spine">
                  {[...Array(14)].map((_, i) => (
                    <div key={i} className="spiral-ring">
                      <div className="spiral-hole"></div>
                    </div>
                  ))}
                </div>

                <div className="flex-grow notebook-lines pl-16 pr-8 md:pl-24 md:pr-12 overflow-y-auto custom-scrollbar pt-[32px]">
                  <div className="pb-16">
                    <div className="flex items-start gap-6 mb-0">
                       <div className="w-16 h-[64px] bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-4xl shrink-0">
                         {selectedEntry.mood}
                       </div>
                       <div className="flex flex-col justify-end h-[64px]">
                          <div className="flex items-center gap-2 text-blue-600 h-[32px] border-b border-transparent">
                             <Calendar size={14} />
                             <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{selectedEntry.date}</span>
                          </div>
                          <h2 className="text-lg md:text-3xl font-extrabold text-slate-800 leading-[32px] h-[32px] truncate" 
                              style={{ fontFamily: selectedEntry.font || baseFont }}>
                              {selectedEntry.title}
                          </h2>
                       </div>
                    </div>

                    <div 
                        className="text-slate-700 text-sm md:text-xl whitespace-pre-wrap mt-0" 
                        style={{ 
                            fontFamily: selectedEntry.font || baseFont,
                            lineHeight: '32px', 
                        }}
                    >
                        {selectedEntry.content}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 flex justify-end items-center bg-white/50">
                 <button onClick={() => setSelectedEntry(null)} className="px-6 py-2 bg-[#1e293b] text-white rounded-lg font-bold text-sm shadow-md hover:bg-slate-700 transition-all active:scale-95">
                  Close Journal
                 </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}

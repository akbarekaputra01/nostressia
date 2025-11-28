// src/pages/Diary/Diary.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";

export default function Diary() {
  // --- STATE ---
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState("😐");
  const [selectedFont, setSelectedFont] = useState("'Manrope', sans-serif");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- CONFIG ---
  const fontOptions = [
    { name: "Default", value: "'Manrope', sans-serif", label: "Aa" },
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

  // --- PALETTE COLORS ---
  const colors = {
    brandBlue: "#3664BA",
    brandOrange: "#F2994A",
    brandBlueLight: "#2F80ED",
    textPrimary: "#333333",
    bgCream: "#FFF3E0",
    bgLavender: "#e3edff"
  };

  // --- HANDLERS ---
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
    <div className="h-screen relative overflow-y-auto overflow-x-hidden flex flex-col font-sans transition-colors duration-500 custom-scrollbar"
         style={{ background: `linear-gradient(135deg, ${colors.bgLavender} 0%, ${colors.bgCream} 100%)` }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Fredoka:wght@400;600&family=Manrope:wght@400;700;800&family=Patrick+Hand&display=swap');`}</style>
      <Navbar />

      <main className="flex-grow flex flex-col items-center w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-32 md:pt-8 z-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: colors.textPrimary }}>Diary <span style={{ color: "rgb(253, 92, 0)" }}>Nostressia</span></h1>
            <p className="font-medium mt-1 opacity-60 text-sm md:text-base" style={{ color: colors.textPrimary }}>Write your story today.</p>
        </motion.div>

        {/* 3D BOOK ENGINE */}
        <div className="relative w-full max-w-[1000px] h-[520px] md:h-[600px] flex items-center justify-center perspective-[2000px]">
            <motion.div className="relative w-[310px] sm:w-[360px] md:w-[380px] h-[480px] md:h-[520px] preserve-3d"
                animate={{ x: (isBookOpen && !isMobile) ? 190 : 0 }} 
                transition={{ duration: 0.8, type: "spring", stiffness: 40, damping: 15 }}
            >
                {/* --- LAYER 1: HALAMAN KANAN (KERTAS PUTIH / INPUT) --- */}
                <div className="absolute inset-0 w-full h-full bg-[#fcf9f5] rounded-[16px] md:rounded-l-[4px] md:rounded-r-[16px] shadow-[10px_10px_30px_rgba(0,0,0,0.15)] z-0 flex flex-col overflow-hidden border border-slate-200">
                    
                    <div className="flex-grow p-5 md:p-8 flex flex-col relative z-10">
                         {/* Close Button */}
                         <button onClick={() => setIsBookOpen(false)} className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>

                        {/* Mood Selector - Diberi padding bottom agar tidak menabrak baris */}
                        <div className="flex items-center gap-2 mb-2 overflow-x-auto scrollbar-hide py-2 border-b border-slate-200">
                            {moods.map((m) => (
                                <button key={m.label} onClick={() => setSelectedMood(m.emoji)} className={`text-2xl hover:scale-110 transition-transform p-1 rounded-lg cursor-pointer ${selectedMood === m.emoji ? "bg-blue-50 scale-110" : "opacity-60 grayscale"}`}>{m.emoji}</button>
                            ))}
                        </div>

                        {/* CONTAINER UNTUK TEXT & GARIS */}
                        {/* Kita bungkus area tulis dengan div relative agar background garis menempel pas disini */}
                        <div className="flex-grow relative w-full h-full flex flex-col">
                            
                            {/* BACKGROUND GARIS - POSISI DIATUR DISINI */}
                            {/* marginTop disesuaikan agar garis pertama pas dibawah Title */}
                            <div className="absolute inset-0 opacity-50 pointer-events-none" 
                                style={{ 
                                    backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px)", 
                                    backgroundSize: "100% 40px", 
                                    backgroundPosition: "0px 39px" // Mengatur offset garis agar pas di baseline teks
                                }}>
                            </div>

                            {/* Input Title */}
                            {/* h-[40px] dan leading-[40px] WAJIB SAMA dengan backgroundSize garis */}
                            <input 
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                placeholder="Title..."
                                className="bg-transparent text-xl md:text-2xl font-bold placeholder:text-slate-300 focus:outline-none w-full h-[40px] leading-[40px] mb-0 relative z-10"
                                style={{ fontFamily: selectedFont, color: colors.brandBlue }}
                            />

                            {/* Text Area */}
                            {/* leading-[40px] WAJIB SAMA dengan backgroundSize garis */}
                            <textarea 
                                value={text} onChange={(e) => setText(e.target.value)}
                                placeholder="Dear diary..."
                                className="flex-grow bg-transparent resize-none focus:outline-none text-slate-700 text-base md:text-lg leading-[40px] custom-scrollbar w-full relative z-10 pt-0"
                                style={{ fontFamily: selectedFont }}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100">
                             <div className="flex gap-1">{fontOptions.map(f => (<button key={f.name} onClick={() => setSelectedFont(f.value)} className={`w-6 h-6 rounded-full border text-[10px] flex items-center justify-center transition-all cursor-pointer ${selectedFont === f.value ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-100"}`}>{f.label}</button>))}</div>
                             <button onClick={handleSubmit} className="px-5 py-2 rounded-lg font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer" style={{ backgroundColor: colors.brandBlue }}>Save</button>
                        </div>
                    </div>
                </div>

                {/* --- LAYER 2: COVER DEPAN (FLIP) --- */}
                <motion.div className="absolute inset-0 w-full h-full cursor-pointer preserve-3d origin-left z-20"
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
                            <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden"><img src={`https://ui-avatars.com/api/?name=User&background=${colors.brandOrange.replace('#','')}&color=fff`} alt="User" /></div>
                            <h3 className="font-serif italic text-slate-500 text-base md:text-lg">This diary belongs to:</h3>
                            <div className="border-b-2 border-slate-300 w-full mt-2 mb-6"></div>
                            <p className="text-center text-xs text-slate-400 leading-loose italic font-serif">"Keep your face always toward the sunshine—and shadows will fall behind you."</p>
                         </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>

        {/* --- 3. HISTORY SECTION --- */}
        <div className="w-full max-w-6xl mt-12 pb-20 px-0 md:px-4">
             {entries.length > 0 ? (
                <>
                <div className="flex items-center gap-2 mb-6 px-4 md:px-0"><div className="h-8 w-1 rounded-full" style={{ backgroundColor: colors.brandOrange }}></div><h3 className="font-bold text-xl" style={{ color: colors.textPrimary }}>Your Memories</h3></div>
                <div className="relative group px-4 md:px-0">
                    <button onClick={() => scroll("left")} className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex cursor-pointer">←</button>
                    <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x snap-mandatory" style={{ scrollBehavior: 'smooth' }}>
                        <AnimatePresence mode="popLayout">
                            {entries.map(entry => (
                                <motion.div key={entry.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex-shrink-0 snap-center relative group/card bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-6 w-[85vw] sm:w-[320px] md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] h-[240px]" onClick={() => setSelectedEntry(entry)}>
                                    <div><div className="flex justify-between items-start mb-3"><span className="text-3xl filter drop-shadow-sm">{entry.mood}</span><button onClick={(e) => handleDelete(entry.id, e)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-400 opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500 hover:text-white">✕</button></div><h4 className="font-bold text-lg mb-1 truncate leading-tight" style={{ color: colors.textPrimary, fontFamily: entry.font }}>{entry.title}</h4><p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3 text-slate-500">{entry.date}</p></div>
                                    <div className="relative overflow-hidden h-full"><p className="text-slate-500 text-sm leading-relaxed line-clamp-3" style={{ fontFamily: entry.font }}>{entry.content}</p><div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div></div>
                                    <div className="mt-2 text-right"><span className="text-xs font-semibold text-blue-400 group-hover/card:underline">Read more →</span></div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    <button onClick={() => scroll("right")} className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex cursor-pointer">→</button>
                </div>
                </>
             ) : ( <div className="flex flex-col items-center justify-center py-16 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl mx-4"><span className="text-4xl mb-2">📝</span><p className="text-sm font-bold uppercase tracking-widest text-slate-400">No stories recorded yet</p></div> )}
        </div>
      </main>

      {/* --- 4. MODAL DETAIL --- */}
      <AnimatePresence>
        {selectedEntry && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}>
                <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", duration: 0.5, bounce: 0.3 }} className="bg-[#fffbf7] w-full max-w-4xl rounded-[24px] shadow-2xl overflow-hidden relative flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="h-3 w-full" style={{ backgroundColor: colors.brandBlue }}></div>
                    <button onClick={() => setSelectedEntry(null)} className="absolute top-5 right-5 text-slate-400 hover:text-red-500 transition-colors z-10 cursor-pointer"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                    <div className="p-6 md:p-10 flex flex-col h-full">
                        <div className="flex items-center gap-5 mb-6"><div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-orange-50 rounded-full text-4xl shadow-sm border border-orange-100">{selectedEntry.mood}</div><div className="flex flex-col"><h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">{selectedEntry.title}</h2><span className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: colors.brandBlue }}>{selectedEntry.date}</span></div></div>
                        <div className="w-full border-b border-slate-200 mb-6"></div>
                        <div className="overflow-y-auto custom-scrollbar pr-2 min-h-[200px] max-h-[50vh]"><p className="text-slate-700 text-lg md:text-xl whitespace-pre-wrap leading-loose" style={{ fontFamily: selectedEntry.font, backgroundImage: "repeating-linear-gradient(transparent, transparent 39px, #e5e7eb 40px)", backgroundAttachment: "local", lineHeight: "40px" }}>{selectedEntry.content}</p></div>
                        <div className="mt-6 pt-2 flex justify-between items-center text-slate-300 select-none"><div className="text-sm">◄</div><div className="flex-grow mx-4 h-1.5 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute left-0 top-0 bottom-0 w-1/3 bg-slate-300 rounded-full"></div></div><div className="text-sm">►</div></div>
                    </div>
                </motion.div>
             </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, X, Loader2, CheckCircle } from "lucide-react"; 
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; 

import axios from "axios";
import { BASE_URL } from "../../api/config"; 

// --- COLOR CONFIGURATION ---
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";
const colors = {
    brandBlue: "#3664BA",
    brandOrange: "#F2994A",
    brandBlueLight: "#2F80ED",
    textPrimary: "#333333",
    bgCream: "#FFF3E0",
    bgLavender: "#e3edff"
};

export default function Diary() {
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

  // --- STATE BARU UNTUK ANIMASI & FEEDBACK ---
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [showSuccessModal, setShowSuccessModal] = useState(false); 

  const { user } = useOutletContext() || { user: {} }; 

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

  // --- 2. LOGIKA FETCH DATA (GET) ---
  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        setIsLoading(true); 
        const token = localStorage.getItem("token");
        if (!token) {
            setIsLoading(false);
            return;
        }

        const response = await axios.get(`${BASE_URL}/diary/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const formattedEntries = response.data.map((item) => ({
          id: item.diaryId,       
          title: item.title,
          content: item.note,     
          mood: item.emoji,       
          font: item.font,
          date: new Date(item.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
        }));
        
        setEntries(formattedEntries);
      } catch (error) {
        console.error("Gagal mengambil diary:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchDiaries();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 3. LOGIKA SIMPAN DATA (POST) ---
  const handleSubmit = async () => {
    if (!text.trim() || !title.trim()) return;

    try {
      setIsSubmitting(true); 
      const token = localStorage.getItem("token");
      if (!token) {
          alert("Kamu belum login!");
          setIsSubmitting(false);
          return;
      }

      const payload = {
        title: title,
        note: text,            
        emoji: selectedMood,
        font: selectedFont,
        date: new Date().toISOString().split('T')[0]
      };

      const response = await axios.post(`${BASE_URL}/diary/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
      });

      const savedData = response.data;
      const newEntry = {
        id: savedData.diaryId,
        title: savedData.title,
        content: savedData.note, 
        mood: savedData.emoji, 
        font: savedData.font, 
        date: new Date(savedData.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", }),
      };

      setEntries([newEntry, ...entries]); 
      setTitle(""); 
      setText(""); 
      setSelectedMood("😐"); 
      setIsBookOpen(false);
      
      // TAMPILKAN MODAL SUKSES
      setShowSuccessModal(true);
      
      setTimeout(() => {
          setShowSuccessModal(false);
      }, 2500);

    } catch (error) {
      console.error("Gagal menyimpan diary:", error);
      alert("Gagal menyimpan diary.");
    } finally {
      setIsSubmitting(false); 
    }
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
      
      {/* --- FIXED NAVBAR WRAPPER (DIPERBAIKI) ---
          - pt-4 md:pt-6: Memberikan 'gap' di atas navbar agar tidak nempel langit-langit browser.
          - z-50: Tetap di atas konten.
      */}
      <div className="fixed top-0 left-0 w-full z-50 pt-4 md:pt-4 transition-all duration-300">
        <Navbar activeLink="Diary" user={user} />
      </div>

      {/* --- SPACER (DIPERBAIKI LAGI) ---
          - Ditambah tingginya untuk mengkompensasi padding-top pada navbar.
          - Mobile: 160px (biar aman dan judul turun).
          - Desktop: 130px (biar judul tidak ketabrak navbar yang sekarang agak turun).
      */}
      <div className="h-[160px] md:h-[162px]" />

      <main className="flex-grow flex flex-col items-center w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-10 z-10 pt-0">
        
        {/* --- HEADER SECTION --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="w-full flex flex-col items-center text-center mb-10 md:mb-10" 
        >
            <div className="flex items-center justify-center gap-3 md:gap-4 mb-2">
              <Heart 
                className="w-10 h-10 sm:w-12 md:w-14 lg:w-16 text-yellow-400 drop-shadow-lg flex-shrink-0" 
                strokeWidth={2.5} 
              />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                Diary Nostressia
              </h1>
            </div>
            <p className="text-gray-600 mt-2 text-base md:text-lg font-medium">
              Write your story today.
            </p>
        </motion.div>

        {/* 3D BOOK ENGINE */}
        <div className="relative w-full max-w-[1000px] h-[450px] sm:h-[500px] md:h-[600px] flex items-center justify-center perspective-[2000px] mt-0">
            <motion.div className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] h-full preserve-3d" animate={{ x: (isBookOpen && !isMobile) ? 190 : 0 }} transition={{ duration: 0.8, type: "spring", stiffness: 40, damping: 15 }}>
                
                {/* HALAMAN MENULIS */}
                <div className="absolute inset-0 w-full h-full bg-[#fcf9f5] rounded-[16px] md:rounded-l-[4px] md:rounded-r-[16px] shadow-xl z-0 flex flex-col overflow-hidden border border-slate-200">
                    <div className="flex-grow p-5 md:p-8 flex flex-col relative z-10">
                          <button onClick={() => setIsBookOpen(false)} className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={20} /></button>
                        <div className="flex items-center gap-2 mb-2 overflow-x-auto py-2 border-b border-slate-200 no-scrollbar">
                            {moods.map((m) => (
                                <button key={m.label} onClick={() => setSelectedMood(m.emoji)} className={`text-xl md:text-2xl hover:scale-110 transition-transform p-1 rounded-lg ${selectedMood === m.emoji ? "bg-blue-50 scale-110" : "opacity-60 grayscale"}`}>{m.emoji}</button>
                            ))}
                        </div>
                        <div className="flex-grow relative flex flex-col overflow-hidden">
                            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: "linear-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "100% 40px", backgroundPosition: "0px 39px" }}></div>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title..." className="bg-transparent text-lg md:text-2xl font-bold focus:outline-none w-full h-[40px] leading-[40px] relative z-10" style={{ fontFamily: selectedFont || baseFont, color: colors.brandBlue }} />
                            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Dear diary..." className="flex-grow bg-transparent resize-none focus:outline-none text-slate-700 text-sm md:text-lg leading-[40px] custom-scrollbar w-full relative z-10" style={{ fontFamily: selectedFont || baseFont }} />
                        </div>
                        <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-100">
                             <div className="flex gap-1">{fontOptions.map(f => (<button key={f.name} onClick={() => setSelectedFont(f.value)} className={`w-6 h-6 rounded-full border text-[10px] flex items-center justify-center transition-all ${selectedFont === f.value ? "bg-slate-800 text-white" : "bg-white text-slate-500"}`}>{f.label}</button>))}</div>
                             
                             {/* TOMBOL SAVE DENGAN LOADING STATE */}
                             <button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="px-5 py-2 rounded-lg font-bold text-white shadow-md active:scale-95 text-xs md:text-base flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
                                style={{ backgroundColor: colors.brandBlue }}
                             >
                                {isSubmitting ? (
                                    <>Saving <Loader2 className="animate-spin" size={16}/></>
                                ) : (
                                    "Save"
                                )}
                             </button>
                        </div>
                    </div>
                </div>

                {/* COVER DEPAN */}
                <motion.div className="absolute inset-0 w-full h-full cursor-pointer preserve-3d origin-left z-20" animate={{ rotateY: isBookOpen ? -180 : 0, opacity: (isBookOpen && isMobile) ? 0 : 1 }} transition={{ duration: 0.8 }} onClick={() => !isBookOpen && setIsBookOpen(true)} style={{ pointerEvents: (isBookOpen && isMobile) ? 'none' : 'auto' }}>
                    <div 
                      className="absolute inset-0 w-full h-full rounded-r-[16px] rounded-l-[4px] shadow-2xl flex flex-col items-center justify-center transition-all duration-500" 
                      style={{ 
                        backgroundColor: colors.brandBlue, 
                        borderLeft: `8px solid ${colors.brandBlueLight}`, 
                        backfaceVisibility: 'hidden' 
                      }}
                    >
                      {/* Border garis oranye */}
                      <div 
                        className={`absolute top-4 bottom-4 left-6 right-4 border-2 rounded-r-lg transition-opacity duration-700 ease-in-out ${
                          isBookOpen ? 'opacity-0' : 'opacity-80'
                        }`} 
                        style={{ borderColor: colors.brandOrange }}
                      ></div>

                      {/* Konten Utama */}
                      <div 
                        className={`z-10 text-center p-4 md:p-8 bg-black/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner transition-all duration-700 ease-in-out ${
                          isBookOpen 
                          ? 'opacity-0 invisible scale-95' 
                          : 'opacity-100 visible scale-100'
                        }`}
                      >
                        <span className="text-3xl md:text-4xl">📘</span>
                        <h2 className="text-xl md:text-3xl font-extrabold text-white mt-4 tracking-widest font-serif">
                          DIARY
                        </h2>
                        <div 
                          className="w-12 md:w-16 h-1 mx-auto my-3 rounded-full" 
                          style={{ backgroundColor: colors.brandOrange }}
                        ></div>
                        <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
                          Nostressia
                        </p>
                      </div>

                      {/* Tombol Klik */}
                      <div 
                        className={`absolute bottom-8 animate-bounce text-white/50 text-xs font-bold tracking-widest uppercase transition-opacity duration-500 ${
                          isBookOpen ? 'opacity-0 invisible' : 'opacity-100 visible'
                        }`}
                      >
                        click to open diary
                      </div>
                    </div>
                    <div className="absolute inset-0 w-full h-full rounded-l-[16px] rounded-r-[4px] shadow-inner bg-[#fcf9f5] border-r border-slate-200" style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden' }}>
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
                </motion.div>
            </motion.div>
        </div>

        {/* HISTORY SECTION (DENGAN LOADING & ANIMASI) */}
        <div className="w-full max-w-6xl mt-12 md:mt-16 pb-20 min-h-[300px]">
             {isLoading ? (
                // TAMPILAN SAAT LOADING DATA
                <div className="flex flex-col items-center justify-center py-20 opacity-70">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-400 mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading your memories...</p>
                </div>
             ) : (
                // TAMPILAN SETELAH DATA LOADED
                entries.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-1 rounded-full" style={{ backgroundColor: colors.brandOrange }}></div>
                            <h3 className="font-bold text-lg md:text-xl">Your Memories</h3>
                            <span className="text-xs font-normal text-gray-400 ml-2 bg-white px-2 py-1 rounded-full shadow-sm">Synced</span>
                        </div>
                        <div className="relative group">
                            <div ref={scrollRef} className="flex gap-4 md:gap-5 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x snap-mandatory">
                                <AnimatePresence mode="popLayout">
                                    {entries.map(entry => (
                                        <motion.div 
                                            key={entry.id} 
                                            layout 
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                                            exit={{ opacity: 0, scale: 0.5 }} 
                                            className="flex-shrink-0 snap-center group/card bg-white rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all p-5 md:p-6 w-[85vw] sm:w-[320px] h-[220px] md:h-[240px]" 
                                            onClick={() => setSelectedEntry(entry)}
                                        >
                                            <div className="flex justify-between mb-3"><span className="text-2xl md:text-3xl">{entry.mood}</span></div>
                                            <h4 className="font-bold text-base md:text-lg mb-1 truncate" style={{ fontFamily: entry.font || baseFont }}>{entry.title}</h4>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">{entry.date}</p>
                                            <p className="text-slate-500 text-xs md:text-sm line-clamp-3" style={{ fontFamily: entry.font || baseFont }}>{entry.content}</p>
                                            <div className="mt-2 text-right"><span className="text-xs font-semibold text-blue-400">Read more →</span></div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                ) : ( 
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 md:py-16 opacity-50 border-2 border-dashed border-slate-200 rounded-3xl w-full">
                        <span className="text-3xl md:text-4xl mb-2">📝</span>
                        <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400">No stories recorded yet</p>
                    </motion.div> 
                )
             )}
        </div>
      </main>

      {/* --- MODAL DETAIL --- */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEntry(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} 
                className="relative bg-[#e2e8f0] w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col p-2"
            >
              <div className="relative flex-grow bg-[#fffaf5] rounded-xl overflow-hidden flex shadow-inner border border-slate-300">
                <div className="spiral-spine">
                  {[...Array(14)].map((_, i) => (
                    <div key={i} className="spiral-ring"><div className="spiral-hole"></div></div>
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
                    <div className="text-slate-700 text-sm md:text-xl whitespace-pre-wrap mt-0" style={{ fontFamily: selectedEntry.font || baseFont, lineHeight: '32px' }}>
                        {selectedEntry.content}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end items-center bg-white/50">
                 <button onClick={() => setSelectedEntry(null)} className="px-6 py-2 bg-[#1e293b] text-white rounded-lg font-bold text-sm shadow-md hover:bg-slate-700 transition-all active:scale-95">Close Journal</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SUCCESS MODAL (NEW) --- */}
      <AnimatePresence>
        {showSuccessModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="bg-white/90 backdrop-blur-md border border-white/50 shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3 pointer-events-auto"
                >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1">
                        <CheckCircle size={32} strokeWidth={3} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Diary Saved!</h3>
                    <p className="text-gray-500 text-sm">Your memory has been safely recorded.</p>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      
      <Footer />
    </div>
  );
}
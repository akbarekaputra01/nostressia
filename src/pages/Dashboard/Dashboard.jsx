import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";

// Brand colors
const brandBlue = "#3664BA";
const brandOrange = "#F2994A";
const brandGreen = "#27AE60";
const brandRed = "#E53E3E";
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

const monthNames = [ "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember" ];
const moods = ['😢', '😕', '😐', '😊', '😄'];

// --- HELPER: FORMAT TANGGAL YYYY-MM-DD ---
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- HELPER: GENERATE DUMMY DATA S.D. HARI INI ---
function generateMockData() {
    const data = {};
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    for (let i = 1; i < date; i++) {
        const currentDate = new Date(year, month, i);
        const dateStr = formatDate(currentDate);
        
        const level = Math.floor(Math.random() * (80 - 20 + 1)) + 20; 
        const moodIdx = Math.floor(Math.random() * moods.length);
        const color = level > 60 ? brandRed : (level > 30 ? brandOrange : brandGreen);
        
        if (Math.random() > 0.15) { 
            data[dateStr] = {
                level: level,
                sleep: Math.floor(Math.random() * 5) + 4,
                study: Math.floor(Math.random() * 6) + 2,
                social: Math.floor(Math.random() * 4),
                mood: moods[moodIdx],
                color: color,
                isToday: false,
                isEmpty: false
            };
        }
    }

    const todayStr = formatDate(today);
    data[todayStr] = {
        level: 0, sleep: 0, study: 0, social: 0, mood: "😐", 
        color: "#ccc", isToday: true, isEmpty: true
    };

    return data;
}

// --- HELPER: GENERATE TREND 7 HARI TERAKHIR ---
function generateTrendData() {
    const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
    const trend = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        const dayName = days[d.getDay()];
        const isToday = i === 0;
        const level = isToday ? 0 : Math.floor(Math.random() * 60) + 20;

        trend.push({
            day: dayName,
            level: level,
            active: isToday
        });
    }
    return trend;
}

// Reusable Popup
function PopupModal({ visible, onClose, title, text, iconClass, success }) {
  useEffect(() => {
    if (!visible) return;
    let t; if (success) t = setTimeout(onClose, 1000);
    return () => clearTimeout(t);
  }, [visible, success, onClose]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-sm p-6 rounded-xl bg-white/75 border border-white/20 shadow-2xl" style={{ backdropFilter: "blur(8px)" }}>
        {success && <div className="absolute inset-0 rounded-xl" style={{ boxShadow: `0 0 0 4px ${brandOrange}`, opacity: 0.08 }} />}
        <button className="absolute right-3 top-3 text-gray-600" onClick={onClose}>✕</button>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="text-4xl" style={{ color: success ? brandGreen : brandBlue }}><i className={iconClass} /></div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{text}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // State Dinamis
  const [stressData, setStressData] = useState(generateMockData());
  const [trendData, setTrendData] = useState(generateTrendData());
  
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [stressScore, setStressScore] = useState(0);

  // Nama User
  const [userName, setUserName] = useState("Epin");

  // Modal State
  const [successModal, setSuccessModal] = useState({ visible: false, title: "", text: "" });
  const [dayDetail, setDayDetail] = useState(null);
  const [resourceModal, setResourceModal] = useState({ visible: false, title: "", text: "", icon: "" });

  // Form State
  const [gpa, setGpa] = useState(3.5);
  const [isEditingGpa, setIsEditingGpa] = useState(false);
  const [sleepHours, setSleepHours] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [socialHours, setSocialHours] = useState("");
  const [moodIndex, setMoodIndex] = useState(2);

  const [quote, setQuote] = useState("Setiap langkah kecil tetap berarti menuju ketenangan.");

  // Calendar State
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);

  const TODAY_KEY = formatDate(today);
  const progressRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!progressRef.current) return;
    progressRef.current.style.width = "0%";
    requestAnimationFrame(() => {
      if (progressRef.current) {
        progressRef.current.style.transition = "width 900ms ease-in-out";
        progressRef.current.style.width = stressScore > 0 ? `${stressScore}%` : "0%";
      }
    });
  }, [stressScore, isFlipped]);

  const month = calendarDate.getMonth();
  const year = calendarDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function resetFormToEmpty() {
    setSleepHours(""); setStudyHours(""); setSocialHours(""); setMoodIndex(2);
  }

  function handleOpenForm() {
    const todayData = stressData[TODAY_KEY];
    if (hasSubmittedToday && todayData && !todayData.isEmpty) {
        setSleepHours(todayData.sleep);
        setStudyHours(todayData.study);
        setSocialHours(todayData.social);
        const mIdx = moods.indexOf(todayData.mood);
        setMoodIndex(mIdx >= 0 ? mIdx : 2);
    } else {
        resetFormToEmpty();
    }
    setIsFlipped(true);
  }

  function handleSaveForm(e) {
    e.preventDefault();
    if (sleepHours === "" || sleepHours < 0 || sleepHours > 24) return alert("Isi jam tidur valid (0-24).");
    if (studyHours === "" || studyHours < 0 || studyHours > 24) return alert("Isi jam belajar valid (0-24).");
    if (socialHours === "" || socialHours < 0 || socialHours > 24) return alert("Isi jam sosial valid (0-24).");

    const successTitleText = hasSubmittedToday ? "Data Diperbarui!" : "Berhasil!";
    const successDescText = hasSubmittedToday ? "Perubahan data hari ini telah disimpan." : "Data telah disimpan.";
    setSuccessModal({ visible: true, title: successTitleText, text: successDescText });

    let calc = 50;
    calc += (7 - Number(sleepHours)) * 5; 
    calc += (Number(studyHours) * 2);     
    calc -= (Number(socialHours) * 3);    
    let finalScore = Math.max(0, Math.min(100, Math.round(calc)));
    const newColor = finalScore > 60 ? brandRed : (finalScore > 30 ? brandOrange : brandGreen);
    
    setStressScore(finalScore);
    setHasSubmittedToday(true);

    setStressData(prev => ({
        ...prev,
        [TODAY_KEY]: {
            level: finalScore,
            sleep: Number(sleepHours),
            study: Number(studyHours),
            social: Number(socialHours),
            mood: moods[moodIndex],
            color: newColor,
            isToday: true,
            isEmpty: false
        }
    }));

    setTrendData(prev => {
        const newData = [...prev];
        newData[6].level = finalScore; 
        return newData;
    });

    setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, visible: false }));
      setIsFlipped(false); 
    }, 2200);
  }

  function handleGpaSave(val) {
    const num = parseFloat(val);
    if (Number.isNaN(num) || num < 0 || num > 4) return alert("GPA harus 0 - 4");
    setGpa(num); setIsEditingGpa(false);
  }

  function changeMonth(delta) {
    setCalendarDate(new Date(year, month + delta, 1));
  }

  function handleDateClick(day) {
    const dateObj = new Date(year, month, day);
    setSelectedDate(dateObj);
    const ds = formatDate(dateObj);
    const data = stressData[ds];

    if (data && !data.isEmpty) {
        setDayDetail({ dateStr: `${day} ${monthNames[month]} ${year}`, ...data });
    } else {
        setDayDetail(null);
    }
  }

  function openResource(title, text, icon) {
    setResourceModal({ visible: true, title, text, icon });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: bgCream,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
      className="relative"
    >
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .pressable:active { transform: translateY(1px) scale(0.995); }
        @keyframes success-pop { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes card-enter { 0% { transform: translateY(20px) scale(0.9); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes circle-draw { 0% { stroke-dasharray: 0, 100; } 100% { stroke-dasharray: 100, 100; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDownFade { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-down { animation: slideDownFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-success-icon { animation: success-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-card-enter { animation: card-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
      `}</style>

      <Navbar activeLink="Dashboard" onPredictClick={handleOpenForm} />

      {/* {loading && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-28 h-28 rounded-full flex items-center justify-center bg-white/90 shadow-lg">
              <div className="animate-spin" style={{ width: 36, height: 36, border: "4px solid #ddd", borderTopColor: brandBlue, borderRadius: "50%" }} />
            </div>
            <div className="text-gray-700">Memuat Nostressia...</div>
          </div>
        </div>
      )} */}

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 pt-28">
        
        {/* --- SAPAAN USER --- */}
        <div className="mb-8 animate-slide-down">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 flex items-center gap-2">
                Halo, <span style={{ color: brandBlue }}>{userName}!</span> 👋
            </h1>
            <p className="text-gray-600 mt-2 text-lg font-medium">
                Siap menjalani hari ini dengan lebih tenang?
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* FLIP CARD (2 cols) */}
          <section className="col-span-1 md:col-span-2 relative" style={{ minHeight: 640 }}>
            <div style={{ perspective: 1500 }} className="w-full h-full">
              <div className={`absolute inset-0 transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                
                {/* FRONT CARD */}
                <div 
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden" 
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 0 : 10, pointerEvents: isFlipped ? 'none' : 'auto' }}
                >
                  {hasSubmittedToday && (
                      <div className="absolute -top-[4.5rem] -right-[4.5rem] text-[11rem] opacity-[0.08] pointer-events-none select-none grayscale filter" style={{ zIndex: 0 }}>
                        {moods[moodIndex]}
                      </div>
                  )}

                  <header className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">Prediksi Stres Hari Ini</h2>
                    <div className="text-2xl text-gray-500"><i className="ph ph-cloud-sun mr-2" /> <i className="ph ph-smiley" /></div>
                  </header>
                  
                  <div className="text-center my-4 flex-grow relative z-10">
                    {hasSubmittedToday ? (
                        <div style={{ display: "inline-block", backgroundColor: stressScore > 60 ? brandRed : (stressScore > 30 ? brandOrange : brandGreen), padding: "6px 10px", borderRadius: 999 }} className="font-semibold text-sm text-white">
                            {stressScore > 60 ? "High" : (stressScore > 30 ? "Moderate" : "Low")}
                        </div>
                    ) : (
                        <div style={{ display: "inline-block", backgroundColor: "#9ca3af", padding: "6px 10px", borderRadius: 999 }} className="font-semibold text-sm text-white">Belum Ada Data</div>
                    )}
                    
                    <h1 className="text-6xl md:text-7xl font-extrabold my-4" style={{ color: hasSubmittedToday ? brandBlue : "#9ca3af" }}>{stressScore}%</h1>
                    {hasSubmittedToday ? <p className="text-green-600 font-semibold">Berdasarkan data inputanmu</p> : <p className="text-gray-400 font-semibold">Silakan isi data untuk melihat prediksi</p>}
                    
                    <div className="mt-8 px-4">
                      <div className="flex justify-between mb-2 text-sm font-semibold text-gray-600">
                        <span>Level Stres</span>
                        <span style={{ color: brandOrange }}>{stressScore}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div ref={progressRef} className="h-full rounded-full" style={{ width: "0%", background: hasSubmittedToday ? brandOrange : "#d1d5db" }} />
                      </div>
                    </div>
                  </div>
                  
                  <hr className="border-t border-white/30 my-6 relative z-10" />
                  
                  <h4 className="text-base font-bold text-gray-800 mb-3 relative z-10">Tren 7 Hari Terakhir</h4>
                  <div className="flex justify-between items-end h-24 relative z-10">
                    {trendData.map((d, i) => {
                      const dotColor = d.active ? brandOrange : "#8b5cf6";
                      const bottom = `${(d.level / 100) * 56}px`;
                      return (
                        <div key={i} className="flex flex-col items-center w-1/7">
                          <div className="relative h-20 w-full flex justify-center">
                            <div className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md" style={{ background: dotColor, bottom }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-500 mt-1">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <hr className="border-t border-white/30 my-6 relative z-10" />
                  
                  <button className="w-full py-3 rounded-xl font-bold text-white shadow-md pressable transition-colors duration-300 relative z-10" onClick={handleOpenForm} style={{ backgroundColor: hasSubmittedToday ? brandOrange : brandBlue }}>
                    {hasSubmittedToday ? <><i className="ph ph-pencil-simple mr-2" /> Edit Data Prediksi</> : <><i className="ph ph-note-pencil mr-2" /> Isi Data Prediksi Stres</>}
                  </button>
                </div>

                {/* BACK CARD (FORM) */}
                <div 
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 rotate-y-180 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden" 
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 10 : 0, pointerEvents: isFlipped ? 'auto' : 'none' }}
                >
                  <header className="flex justify-between items-center mb-4 transition-opacity duration-300" style={{ opacity: successModal.visible ? 0 : 1 }}>
                    <h3 className="text-xl font-bold text-gray-800">{hasSubmittedToday ? "Edit Data Hari Ini" : "Catat Data Hari Ini"}</h3>
                    
                    {/* --- ICON CLOSE (SVG) SUDAH DIPERBAIKI --- */}
                    <button 
                        type="button" 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer" 
                        onClick={() => setIsFlipped(false)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                  </header>
                  
                  <form onSubmit={handleSaveForm} className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4 transition-all duration-500 custom-scroll" style={{ opacity: successModal.visible ? 0 : 1, transform: successModal.visible ? 'scale(0.95)' : 'scale(1)', pointerEvents: successModal.visible ? 'none' : 'auto' }}>
                    {/* GPA */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">GPA</label>
                        {!isEditingGpa ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold" style={{ color: brandOrange }}>{gpa.toFixed(2)}</span>
                                <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" onClick={() => setIsEditingGpa(true)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <input type="number" defaultValue={gpa.toFixed(2)} step="0.01" min="0" max="4" className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" id="gpaInput" style={{ color: '#333' }} />
                                <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition-colors" onClick={() => handleGpaSave(document.getElementById('gpaInput').value)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></button>
                                <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition-colors" onClick={() => setIsEditingGpa(false)}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                    </div>
                    {/* INPUTS */}
                    <div><label className="text-sm font-semibold text-gray-800 mb-2 block">Jam Tidur (per hari)</label><input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} min="0" max="24" step="0.5" placeholder="Misal: 7" className="w-full p-3 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400" /></div>
                    <div><label className="text-sm font-semibold text-gray-800 mb-2 block">Jam Belajar (per hari)</label><input type="number" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} min="0" max="24" step="0.5" placeholder="Misal: 4" className="w-full p-3 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400" /></div>
                    <div><label className="text-sm font-semibold text-gray-800 mb-2 block">Jam Sosial (per hari)</label><input type="number" value={socialHours} onChange={(e) => setSocialHours(e.target.value)} min="0" max="24" step="0.5" placeholder="Misal: 2" className="w-full p-3 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400" /></div>
                    <hr className="border-t border-white/20 my-2" />
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3 text-center">Bagaimana Perasaanmu Hari Ini?</label>
                      <div className="flex justify-around">
                        {moods.map((emo, idx) => (
                          <button key={idx} type="button" className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl transition-transform ${moodIndex === idx ? 'scale-110 shadow-lg' : 'hover:scale-105'}`} onClick={() => setMoodIndex(idx)} style={{ backgroundColor: moodIndex === idx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>{emo}</button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:brightness-110" style={{ backgroundColor: hasSubmittedToday ? brandOrange : brandBlue }}>{hasSubmittedToday ? <span className="flex items-center justify-center"><i className="ph ph-floppy-disk mr-2" /> Update Data</span> : <span className="flex items-center justify-center"><i className="ph ph-check-circle mr-2" /> Simpan Data</span>}</button>
                  </form>
                  {successModal.visible && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[20px]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-4 animate-success-icon" style={{ backgroundColor: '#fff', border: `4px solid ${brandGreen}` }}>
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={brandGreen} strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" style={{ animation: 'circle-draw 0.8s ease-out forwards 0.3s' }} /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards 0.5s' }}>{successModal.title}</h2>
                        <p className="text-gray-600 text-center px-8" style={{ opacity: 0, animation: 'fadeInUp 0.5s ease-out forwards 0.7s' }}>{successModal.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CALENDAR (2 cols) - KANAN */}
          <section className="col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden" style={{ minHeight: 640 }}>
            <header className="flex justify-between items-center mb-4">
              <button className="icon-btn text-gray-600 hover:text-gray-900 transition-colors" onClick={() => changeMonth(-1)}><i className="ph ph-arrow-left text-xl" /></button>
              <h3 className="text-xl font-bold text-gray-800">{monthNames[month]} {year}</h3>
              <button className="icon-btn text-gray-600 hover:text-gray-900 transition-colors" onClick={() => changeMonth(1)}><i className="ph ph-arrow-right text-xl" /></button>
            </header>
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (<div key={d} className="text-sm font-bold text-gray-500">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(firstDayOfMonth)].map((_, i) => <div key={`e-${i}`} className="h-12" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const ds = formatDate(d);
                const has = stressData[ds];
                const hasData = has && !has.isEmpty;
                const isSel = selectedDate.getDate() === day && selectedDate.getMonth() === month;
                return (
                  <div key={day} className={`flex items-center justify-center h-12 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 ${isSel ? 'scale-105 shadow-md' : 'hover:bg-white/50'}`} onClick={() => handleDateClick(day)} style={{ background: isSel ? brandBlue : 'transparent', color: isSel ? 'white' : '#333', border: hasData ? `2px solid ${has.color}40` : 'none' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <div>{day}</div>
                      {hasData && !isSel && <div style={{ height: 6, width: 6, background: has.color, borderRadius: 999, margin: '6px auto 0' }} />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DETAIL CARD OVERLAY */}
            {dayDetail && (
                <div 
                    className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-card-enter"
                    onClick={() => setDayDetail(null)}
                >
                    {/* CARD SOLID WHITE */}
                    <div 
                        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 overflow-hidden" 
                        style={{ backgroundColor: "#ffffff" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none grayscale">{dayDetail.mood}</div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div><h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Daily Recap</h4><h2 className="text-2xl font-extrabold text-gray-800">{dayDetail.dateStr}</h2></div>
                            <button 
                                onClick={() => setDayDetail(null)} 
                                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4" style={{ borderColor: dayDetail.color }}>
                                <div className="text-center"><div className="text-xs text-gray-500 font-bold">LEVEL</div><div className="text-xl font-black" style={{ color: dayDetail.color }}>{dayDetail.level}</div></div>
                            </div>
                            <div className="flex-1"><p className="text-sm font-semibold text-gray-600 italic">"{dayDetail.level > 60 ? "Istirahatlah, kamu butuh jeda." : "Hari yang cukup seimbang!"}"</p></div>
                        </div>
                        <div className="space-y-4">
                            <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-moon-stars text-purple-500"/> Tidur</span><span>{dayDetail.sleep} jam</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(dayDetail.sleep/10)*100}%` }} /></div></div>
                            <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-book-open text-blue-500"/> Belajar</span><span>{dayDetail.study} jam</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(dayDetail.study/12)*100}%` }} /></div></div>
                            <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-users text-orange-500"/> Sosial</span><span>{dayDetail.social} jam</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(dayDetail.social/8)*100}%` }} /></div></div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center"><span className="text-xs font-bold text-gray-500 uppercase">Mood Tercatat</span><span className="text-3xl animate-bounce">{dayDetail.mood}</span></div>
                    </div>
                </div>
            )}
          </section>
        </div>

        {/* MOTIVATION & FOOTER */}
        <div className="mt-8 grid grid-cols-1">
          <section className="col-span-4 flex flex-col md:flex-row items-center justify-between p-5 md:p-8 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl gap-4">
            <div className="flex items-center gap-3"><i className="ph ph-lightbulb-filament text-3xl" style={{ color: brandOrange }} /><p className="text-gray-700 italic">"{quote}"</p></div>
            <button className="py-2 px-4 rounded-xl font-bold transition flex items-center gap-2" onClick={() => { let n; do { n = quotes[Math.floor(Math.random()*quotes.length)]; } while (n===quote); setQuote(n); }} style={{ border: `2px solid ${brandOrange}`, color: brandOrange }}><i className="ph ph-arrows-clockwise" /> Kutipan Baru</button>
          </section>
          <div className="mt-6 flex flex-wrap justify-center gap-6">
            <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition" onClick={() => openResource('Tips Tidur Nyenyak', 'Cahaya biru dari HP dapat mengganggu produksi melatonin. Matikan perangkat 1 jam sebelum tidur.', 'ph ph-moon-stars')}><i className="ph ph-moon-stars text-4xl text-purple-600 mb-3" /><h3 className="text-lg font-bold">Drift off with sleep stories</h3><p className="text-sm text-gray-600 mt-1">Cerita dan musik untuk tidur lebih nyenyak.</p></div>
            <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition" onClick={() => openResource('Meditasi 1 Menit', 'Tarik napas 4 detik, tahan 4 detik, hembus 4 detik. Ulangi 5 kali.', 'ph ph-wind')}><i className="ph ph-timer text-4xl text-blue-600 mb-3" /><h3 className="text-lg font-bold">Learn to meditate</h3><p className="text-sm text-gray-600 mt-1">Teknik pernapasan mudah untuk mulai meditasi.</p></div>
            <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition" onClick={() => openResource('Membangun Kebiasaan', 'Mulai dari yang kecil. Rule of 2 Minutes: jika butuh <2 menit, lakukan sekarang.', 'ph ph-target')}><i className="ph ph-target text-4xl text-yellow-600 mb-3" /><h3 className="text-lg font-bold">Build healthy habits</h3><p className="text-sm text-gray-600 mt-1">Bangun rutinitas kecil yang konsisten.</p></div>
          </div>
        </div>
      </main>

      <footer className="mt-12 mx-4 lg:mx-6 py-6 border-t border-white/30 text-gray-600 text-center text-sm"><p>© 2025 Nostressia by Kelompok 4 PPTI BCA</p><p className="mt-1">Understand Yourself Better, One Day at a Time. 🧘</p></footer>
      {resourceModal.visible && (<PopupModal visible={resourceModal.visible} onClose={() => setResourceModal({ visible: false, title: "", text: "", icon: "" })} title={resourceModal.title} text={resourceModal.text} iconClass={resourceModal.icon} success={false} />)}
    </div>
  );
}

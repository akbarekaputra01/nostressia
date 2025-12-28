import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import { BASE_URL } from "../../api/config";
import Footer from "../../components/Footer";

// --- COLOR CONFIGURATION ---
const brandBlue = "#3664BA";
const brandOrange = "#F2994A";
const brandGreen = "#27AE60";
const brandRed = "#E53E3E";
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";

// TRANSLATED: Month Names
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const moods = ["😢", "😕", "😐", "😊", "😄"];

// TRANSLATED: Quotes
const quotesList = [
  { text: "Every small step counts towards peace.", author: "Daily Reminder" },
  { text: "Resting doesn't mean stopping, it means recharging.", author: "Mindfulness" },
  { text: "You don't have to be productive all the time. Just breathe.", author: "Self Care" },
  { text: "Focus on what you can control, let go of what you can't.", author: "Stoic Wisdom" },
  { text: "A bad day doesn't mean a bad life.", author: "Anonymous" },
  { text: "Peace begins when you stop expecting others to understand you.", author: "Inner Peace" },
  { text: "Flowers don't bloom simultaneously. Be patient with your process.", author: "Nature's Law" },
];

// --- UPDATED: DATA TIPS (BENTO STYLE) - WITH GLASSMOPRHISM BG ---
const resourcesList = [
  {
    id: 1,
    category: "Sleep Hygiene",
    emoji: "🌙",
    title: "Digital Sunset",
    desc: "Turn off gadgets 1 hour before sleep.",
    fullDetail: "The blue light from screens tricks your brain into thinking it's still daytime. Set a 'Digital Sunset' alarm for 9 PM. Replace scrolling with reading a physical book for better sleep.",
    // Styling Themes - UPDATED BG TO BE TRANSPARENT
    theme: {
      bg: "bg-blue-50/40", // Diubah jadi transparan
      text: "text-blue-900",
      subtext: "text-blue-700",
      accent: "bg-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700 text-white"
    }
  },
  {
    id: 2,
    category: "Focus Hack",
    emoji: "🍅",
    title: "Pomodoro",
    desc: "25 minutes focus, 5 minutes break.",
    fullDetail: "Your brain has a focus limit. Use a timer. When the bell rings, stand up and stretch. This method prevents burnout and keeps energy stable all day.",
    theme: {
      bg: "bg-orange-50/40", // Diubah jadi transparan
      text: "text-orange-900",
      subtext: "text-orange-700",
      accent: "bg-orange-200",
      btn: "bg-orange-500 hover:bg-orange-600 text-white"
    }
  },
  {
    id: 3,
    category: "Anxiety Relief",
    emoji: "🍃",
    title: "Grounding 5-4-3-2-1",
    desc: "Anxious? Use your 5 senses.",
    fullDetail: "Name: 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste. This technique forces your brain to switch from 'panic mode' to 'conscious mode' instantly.",
    theme: {
      bg: "bg-teal-50/40", // Diubah jadi transparan
      text: "text-teal-900",
      subtext: "text-teal-700",
      accent: "bg-teal-200",
      btn: "bg-teal-600 hover:bg-teal-700 text-white"
    }
  },
];

// --- HELPER FUNCTIONS ---
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapPredictionToUI(label) {
  if (label === "High") return { score: 85, color: brandRed };
  if (label === "Moderate") return { score: 50, color: brandOrange };
  return { score: 20, color: brandGreen };
}

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
    const color = level > 60 ? brandRed : level > 30 ? brandOrange : brandGreen;

    if (Math.random() > 0.15) {
      data[dateStr] = {
        level: level,
        sleep: Math.floor(Math.random() * 5) + 4,
        study: Math.floor(Math.random() * 6) + 2,
        extra: Math.floor(Math.random() * 4),
        social: Math.floor(Math.random() * 4),
        physical: Math.floor(Math.random() * 3),
        mood: moods[moodIdx],
        color: color,
        isToday: false,
        isEmpty: false,
      };
    }
  }

  const todayStr = formatDate(today);
  data[todayStr] = {
    level: 0,
    sleep: 0,
    study: 0,
    extra: 0,
    social: 0,
    physical: 0,
    mood: "😐",
    color: "#ccc",
    isToday: true,
    isEmpty: true,
  };

  return data;
}

function generateTrendData() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trend = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    trend.push({
      day: days[d.getDay()],
      level: i === 0 ? 0 : Math.floor(Math.random() * 60) + 20,
      active: i === 0,
    });
  }
  return trend;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  // State Data
  const [stressData, setStressData] = useState(generateMockData());
  const [trendData, setTrendData] = useState(generateTrendData());
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [stressScore, setStressScore] = useState(0);
  const [userName, setUserName] = useState("Epin");

  // Success Modal (Internal Card State)
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: "",
    text: "",
  });
  
  // Detail Hari Kalender
  const [dayDetail, setDayDetail] = useState(null);

  // Active Tip Modal
  const [activeTip, setActiveTip] = useState(null);

  // --- FORM STATE ---
  const [gpa, setGpa] = useState(3.5);
  const [isEditingGpa, setIsEditingGpa] = useState(false);
  const [studyHours, setStudyHours] = useState("");
  const [extraHours, setExtraHours] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [socialHours, setSocialHours] = useState("");
  const [physicalHours, setPhysicalHours] = useState("");
  const [moodIndex, setMoodIndex] = useState(2);

  // Quote State
  const [quoteData, setQuoteData] = useState(quotesList[0]);
  const [isQuoteAnimating, setIsQuoteAnimating] = useState(false);

  // Calendar State
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
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
        progressRef.current.style.width =
          stressScore > 0 ? `${stressScore}%` : "0%";
      }
    });
  }, [stressScore, isFlipped]);

  const month = calendarDate.getMonth();
  const year = calendarDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function handleNewQuote() {
    setIsQuoteAnimating(true);
    setTimeout(() => {
      let newQuote;
      do {
        newQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
      } while (newQuote.text === quoteData.text);
      setQuoteData(newQuote);
      setIsQuoteAnimating(false);
    }, 400);
  }

  function resetFormToEmpty() {
    setSleepHours("");
    setStudyHours("");
    setSocialHours("");
    setExtraHours("");
    setPhysicalHours("");
    setMoodIndex(2);
  }

  function handleOpenForm() {
    const todayData = stressData[TODAY_KEY];
    if (hasSubmittedToday && todayData && !todayData.isEmpty) {
      setSleepHours(todayData.sleep);
      setStudyHours(todayData.study);
      setExtraHours(todayData.extra);
      setSocialHours(todayData.social);
      setPhysicalHours(todayData.physical);
      const mIdx = moods.indexOf(todayData.mood);
      setMoodIndex(mIdx >= 0 ? mIdx : 2);
    } else {
      resetFormToEmpty();
    }
    setIsFlipped(true);
  }

  // --- HANDLE SAVE (UPDATED: SUCCESS INSIDE CARD) ---
  async function handleSaveForm(e) {
    e.preventDefault();

    if (sleepHours === "" || sleepHours < 0 || sleepHours > 24) return alert("Please enter valid sleep hours (0-24).");
    if (studyHours === "" || studyHours < 0 || studyHours > 24) return alert("Please enter valid study hours (0-24).");
    if (extraHours === "" || extraHours < 0 || extraHours > 24) return alert("Please enter valid extra hours (0-24).");
    if (socialHours === "" || socialHours < 0 || socialHours > 24) return alert("Please enter valid social hours (0-24).");
    if (physicalHours === "" || physicalHours < 0 || physicalHours > 24) return alert("Please enter valid physical activity hours (0-24).");

    try {
      const payload = {
        study_hours: Number(studyHours),
        extracurricular_hours: Number(extraHours),
        sleep_hours: Number(sleepHours),
        social_hours: Number(socialHours),
        physical_hours: Number(physicalHours),
        gpa: Number(gpa),
      };

      const response = await fetch(`${BASE_URL}/predict/current-stress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const apiData = await response.json();
      if (!response.ok) throw new Error(apiData.detail || "Error connecting to server.");

      console.log("🔥 AI Prediction Result:", apiData);

      const { score, color } = mapPredictionToUI(apiData.result);
      const successTitleText = hasSubmittedToday ? "Data Updated!" : "Analysis Complete!";
      
      // TRIGGER INTERNAL SUCCESS STATE
      setSuccessModal({
        visible: true,
        title: successTitleText,
        text: apiData.message,
      });

      setStressScore(score);
      setHasSubmittedToday(true);

      setStressData((prev) => ({
        ...prev,
        [TODAY_KEY]: {
          level: score,
          label: apiData.result,
          sleep: Number(sleepHours),
          study: Number(studyHours),
          extra: Number(extraHours),
          social: Number(socialHours),
          physical: Number(physicalHours),
          mood: moods[moodIndex],
          color: color,
          isToday: true,
          isEmpty: false,
        },
      }));

      setTrendData((prev) => {
        const newData = [...prev];
        newData[6].level = score;
        return newData;
      });

      setTimeout(() => {
        setSuccessModal((prev) => ({ ...prev, visible: false }));
        setIsFlipped(false);
      }, 2200);
    } catch (error) {
      console.error("❌ Gagal Konek:", error);
      let pesanError = `Gagal menghubungi server di: ${BASE_URL}\n`;
      if (BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1")) {
        pesanError += "👉 Cek terminal Backend, pastikan 'uvicorn' sudah jalan.";
      } else {
        pesanError += "👉 Kemungkinan server deploy belum update atau mati.";
      }
      alert(pesanError);
    }
  }

  function handleGpaSave(val) {
    const num = parseFloat(val);
    if (Number.isNaN(num) || num < 0 || num > 4) return alert("GPA must be between 0 - 4");
    setGpa(num);
    setIsEditingGpa(false);
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
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animate-slide-down { animation: slideDownFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-success-icon { animation: success-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-card-enter { animation: card-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        /* Animasi Baru Modal Tips */
        @keyframes modalSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-modal-slide { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
      `}</style>

      <Navbar activeLink="Dashboard" onPredictClick={handleOpenForm} />

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 pt-28">
        {/* --- USER GREETING --- */}
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 flex items-center gap-2">
            Hello, <span style={{ color: brandBlue }}>{userName}!</span> 👋
          </h1>
          <p className="text-gray-600 mt-2 text-lg font-medium">
            Ready to navigate the day with more calm?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* FLIP CARD SECTION */}
          <section className="col-span-1 md:col-span-2 relative" style={{ minHeight: 640 }}>
            <div style={{ perspective: 1500 }} className="w-full h-full">
              <div className={`absolute inset-0 transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                
                {/* FRONT CARD (PREDICTION) */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 0 : 10, pointerEvents: isFlipped ? "none" : "auto" }}
                >
                  {hasSubmittedToday && (
                    <div className="absolute -top-[4.5rem] -right-[4.5rem] text-[11rem] opacity-[0.08] pointer-events-none select-none grayscale filter" style={{ zIndex: 0 }}>
                      {moods[moodIndex]}
                    </div>
                  )}

                  <header className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">Today's Stress Prediction</h2>
                    <div className="text-2xl text-gray-500"><i className="ph ph-cloud-sun mr-2" /> <i className="ph ph-smiley" /></div>
                  </header>

                  <div className="text-center my-4 flex-grow relative z-10">
                    {hasSubmittedToday ? (
                      <div style={{ display: "inline-block", backgroundColor: stressScore > 60 ? brandRed : stressScore > 30 ? brandOrange : brandGreen, padding: "6px 10px", borderRadius: 999 }} className="font-semibold text-sm text-white">
                        {stressScore > 60 ? "High" : stressScore > 30 ? "Moderate" : "Low"}
                      </div>
                    ) : (
                      <div style={{ display: "inline-block", backgroundColor: "#9ca3af", padding: "6px 10px", borderRadius: 999 }} className="font-semibold text-sm text-white">No Data Yet</div>
                    )}

                    <h1 className="text-6xl md:text-7xl font-extrabold my-4" style={{ color: hasSubmittedToday ? brandBlue : "#9ca3af" }}>{stressScore}%</h1>
                    {hasSubmittedToday ? <p className="text-green-600 font-semibold">Based on AI Analysis</p> : <p className="text-gray-400 font-semibold">Please fill in data to see prediction</p>}

                    <div className="mt-8 px-4">
                      <div className="flex justify-between mb-2 text-sm font-semibold text-gray-600"><span>Stress Level</span><span style={{ color: brandOrange }}>{stressScore}%</span></div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div ref={progressRef} className="h-full rounded-full" style={{ width: "0%", background: hasSubmittedToday ? brandOrange : "#d1d5db" }} />
                      </div>
                    </div>
                  </div>

                  <hr className="border-t border-white/30 my-6 relative z-10" />
                  <h4 className="text-base font-bold text-gray-800 mb-3 relative z-10">Last 7 Days Trend</h4>
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
                  <button
                    className="w-full py-3 rounded-xl font-bold text-white shadow-md pressable transition-colors duration-300 relative z-10 cursor-pointer"
                    onClick={handleOpenForm}
                    style={{ backgroundColor: hasSubmittedToday ? brandOrange : brandBlue }}
                  >
                    {hasSubmittedToday ? <><i className="ph ph-pencil-simple mr-2" /> Edit Prediction Data</> : <><i className="ph ph-note-pencil mr-2" /> Fill Stress Prediction Data</>}
                  </button>
                </div>

                {/* BACK CARD (FORM) - SUKSES POPUP ADA DI SINI */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 rotate-y-180 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 10 : 0, pointerEvents: isFlipped ? "auto" : "none" }}
                >
                  <header className="flex justify-between items-center mb-4 transition-opacity duration-300" style={{ opacity: successModal.visible ? 0 : 1 }}>
                    <h3 className="text-xl font-bold text-gray-800">{hasSubmittedToday ? "Edit Today's Data" : "Log Today's Data"}</h3>
                    <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer" onClick={() => setIsFlipped(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </header>

                  <form
                    onSubmit={handleSaveForm}
                    className="flex-grow overflow-y-auto pr-2 flex flex-col gap-3 transition-all duration-500 custom-scroll"
                    style={{ opacity: successModal.visible ? 0 : 1, transform: successModal.visible ? "scale(0.95)" : "scale(1)", pointerEvents: successModal.visible ? "none" : "auto" }}
                  >
                    {/* GPA */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">GPA</label>
                      {!isEditingGpa ? (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold" style={{ color: brandOrange }}>{gpa.toFixed(2)}</span>
                          <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors cursor-pointer" onClick={() => setIsEditingGpa(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <input type="number" defaultValue={gpa.toFixed(2)} step="0.01" min="0" max="4" className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" id="gpaInput" style={{ color: "#333" }} />
                          <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition-colors cursor-pointer" onClick={() => handleGpaSave(document.getElementById("gpaInput").value)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                          </button>
                          <button type="button" className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer" onClick={() => setIsEditingGpa(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-sm font-semibold text-gray-800 mb-1 block">Study Hours <span className="text-gray-400 text-xs font-normal">(Hrs)</span></label><input type="number" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} min="0" max="24" step="0.5" placeholder="0" className="w-full p-2.5 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400"/></div>
                      <div><label className="text-sm font-semibold text-gray-800 mb-1 block">Extracurricular <span className="text-gray-400 text-xs font-normal">(Hrs)</span></label><input type="number" value={extraHours} onChange={(e) => setExtraHours(e.target.value)} min="0" max="24" step="0.5" placeholder="0" className="w-full p-2.5 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400"/></div>
                      <div><label className="text-sm font-semibold text-gray-800 mb-1 block">Sleep Hours <span className="text-gray-400 text-xs font-normal">(Hrs)</span></label><input type="number" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} min="0" max="24" step="0.5" placeholder="0" className="w-full p-2.5 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400"/></div>
                      <div><label className="text-sm font-semibold text-gray-800 mb-1 block">Social Hours <span className="text-gray-400 text-xs font-normal">(Hrs)</span></label><input type="number" value={socialHours} onChange={(e) => setSocialHours(e.target.value)} min="0" max="24" step="0.5" placeholder="0" className="w-full p-2.5 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400"/></div>
                      <div className="col-span-2"><label className="text-sm font-semibold text-gray-800 mb-1 block">Physical Activity <span className="text-gray-400 text-xs font-normal">(Exercise Hrs)</span></label><input type="number" value={physicalHours} onChange={(e) => setPhysicalHours(e.target.value)} min="0" max="24" step="0.5" placeholder="0" className="w-full p-2.5 border border-white/50 bg-white/50 rounded-lg focus:ring-2 focus:ring-blue-400 placeholder-gray-400"/></div>
                    </div>

                    <hr className="border-t border-white/20 my-2" />
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-3 text-center">How are you feeling today?</label>
                      <div className="flex justify-around">
                        {moods.map((emo, idx) => (
                          <button key={idx} type="button" className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-2xl md:text-3xl transition-transform cursor-pointer ${moodIndex === idx ? "scale-110 shadow-lg" : "hover:scale-105"}`} onClick={() => setMoodIndex(idx)} style={{ backgroundColor: moodIndex === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:brightness-110 mt-2 cursor-pointer" style={{ backgroundColor: hasSubmittedToday ? brandOrange : brandBlue }}>
                      {hasSubmittedToday ? <span className="flex items-center justify-center"><i className="ph ph-floppy-disk mr-2" /> Update Data</span> : <span className="flex items-center justify-center"><i className="ph ph-check-circle mr-2" /> Save Data</span>}
                    </button>
                  </form>

                  {/* INTERNAL SUCCESS OVERLAY (Tidak Global) */}
                  {successModal.visible && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[20px]" style={{ animation: "fadeIn 0.3s ease-out" }}>
                      <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-4 animate-success-icon" style={{ backgroundColor: "#fff", border: `4px solid ${brandGreen}` }}>
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={brandGreen} strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" style={{ animation: "circle-draw 0.8s ease-out forwards 0.3s" }} />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards 0.5s" }}>{successModal.title}</h2>
                      <p className="text-gray-600 text-center px-8" style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards 0.7s" }}>{successModal.text}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CALENDAR */}
          <section className="col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden" style={{ minHeight: 640 }}>
            <header className="flex justify-between items-center mb-4">
              <button className="icon-btn text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={() => changeMonth(-1)}><i className="ph ph-arrow-left text-xl" /></button>
              <h3 className="text-xl font-bold text-gray-800">{monthNames[month]} {year}</h3>
              <button className="icon-btn text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={() => changeMonth(1)}><i className="ph ph-arrow-right text-xl" /></button>
            </header>
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d} className="text-sm font-bold text-gray-500">{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(firstDayOfMonth)].map((_, i) => (<div key={`e-${i}`} className="h-12" />))}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const d = new Date(year, month, day);
                const ds = formatDate(d);
                const has = stressData[ds];
                const hasData = has && !has.isEmpty;
                const isSel = selectedDate.getDate() === day && selectedDate.getMonth() === month;
                return (
                  <div key={day} className={`flex items-center justify-center h-12 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 ${isSel ? "scale-105 shadow-md" : "hover:bg-white/50"}`} onClick={() => handleDateClick(day)} style={{ background: isSel ? brandBlue : "transparent", color: isSel ? "white" : "#333", border: hasData ? `2px solid ${has.color}40` : "none" }}>
                    <div style={{ width: "100%", textAlign: "center" }}>
                      <div>{day}</div>
                      {hasData && !isSel && (<div style={{ height: 6, width: 6, background: has.color, borderRadius: 999, margin: "6px auto 0" }} />)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DETAIL CARD OVERLAY */}
            {dayDetail && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-card-enter" onClick={() => setDayDetail(null)}>
                <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 overflow-hidden" style={{ backgroundColor: "#ffffff" }} onClick={(e) => e.stopPropagation()}>
                  <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none grayscale">{dayDetail.mood}</div>
                  <div className="flex justify-between items-start mb-6">
                    <div><h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Daily Recap</h4><h2 className="text-2xl font-extrabold text-gray-800">{dayDetail.dateStr}</h2></div>
                    <button onClick={() => setDayDetail(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-gray-600"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                  {/* ... (DETAIL STATS LAMA) ... */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-20 h-20 rounded-full flex items-center justify-center border-4" style={{ borderColor: dayDetail.color }}>
                      <div className="text-center"><div className="text-xs text-gray-500 font-bold">LEVEL</div><div className="text-xl font-black" style={{ color: dayDetail.color }}>{dayDetail.level}</div></div>
                    </div>
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-600 italic">"{dayDetail.level > 60 ? "Take a break, you need it." : "Keep it up and maintain balance!"}"</p></div>
                  </div>
                  <div className="space-y-3 custom-scroll" style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                    <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-moon-stars text-purple-500" /> Sleep</span><span>{dayDetail.sleep} hrs</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((dayDetail.sleep / 10) * 100, 100)}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-book-open text-blue-500" /> Study</span><span>{dayDetail.study} hrs</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((dayDetail.study / 12) * 100, 100)}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-medal text-pink-500" /> Extra</span><span>{dayDetail.extra || 0} hrs</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(((dayDetail.extra || 0) / 8) * 100, 100)}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-users text-orange-500" /> Social</span><span>{dayDetail.social} hrs</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((dayDetail.social / 8) * 100, 100)}%` }} /></div></div>
                    <div><div className="flex justify-between text-xs font-bold text-gray-600 mb-1"><span className="flex items-center gap-1"><i className="ph ph-sneaker text-teal-500" /> Exercise</span><span>{dayDetail.physical || 0} hrs</span></div><div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(((dayDetail.physical || 0) / 4) * 100, 100)}%` }} /></div></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center"><span className="text-xs font-bold text-gray-500 uppercase">Recorded Mood</span><span className="text-3xl animate-bounce">{dayDetail.mood}</span></div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* MOTIVATION */}
        <div className="mt-8 grid grid-cols-1">
          <section className="col-span-4 relative overflow-hidden rounded-[24px] shadow-2xl group transition-all duration-500 hover:shadow-orange-100">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border border-white/40 z-0"></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1">
                <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center shadow-lg text-white"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" className="w-8 h-8"><path d="M224,128a8,8,0,0,1-8,8c-30.85,0-57.5,12.72-76.32,34.4C120.86,192.11,128,218.85,128,248a8,8,0,0,1-16,0c0-29.15,7.14-55.89-11.68-77.6C81.5,148.72,54.85,136,24,136a8,8,0,0,1,0-16c30.85,0,57.5-12.72,76.32-34.4C119.14,63.89,112,37.15,112,8a8,8,0,0,1,16,0c0,29.15-7.14,55.89,11.68,77.6C158.5,107.28,185.15,120,216,120A8,8,0,0,1,224,128Z" /></svg></div>
                <div className="flex-1"><p className="text-xs font-bold tracking-widest text-orange-600 uppercase mb-2">Daily Wisdom</p><div className={`transition-all duration-500 ${isQuoteAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}><h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 leading-tight mb-2">"{quoteData.text}"</h3><p className="text-gray-500 font-medium italic">— {quoteData.author}</p></div></div>
              </div>
              <button onClick={handleNewQuote} disabled={isQuoteAnimating} className="flex-shrink-0 group relative px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold shadow-sm hover:shadow-md hover:border-orange-300 hover:text-orange-600 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"><span className="flex items-center gap-2"><i className={`ph ph-arrows-clockwise text-xl transition-transform duration-700 ${isQuoteAnimating ? "rotate-180" : ""}`}></i><span>New Quote</span></span></button>
            </div>
          </section>

          {/* --- NEW DESIGN: BENTO WIDGET TIPS (Warna-Warni + Glassmorphism) --- */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {resourcesList.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTip(item)}
                // UPDATE: Added backdrop-blur, border, and shadow for glass effect
                className={`relative overflow-hidden rounded-[30px] p-6 h-64 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] backdrop-blur-xl border border-white/40 shadow-lg ${item.theme.bg}`}
              >
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-50 blur-2xl ${item.theme.accent}`} />
                <div className={`absolute -left-6 -bottom-6 w-24 h-24 rounded-full opacity-50 blur-xl ${item.theme.accent}`} />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl filter drop-shadow-sm">{item.emoji}</span>
                    {/* BAGIAN LINGKARAN POJOK KANAN ATAS SUDAH DIHAPUS DI SINI */}
                  </div>
                  <div>
                    <h3 className={`text-2xl font-bold mb-1 ${item.theme.text}`}>{item.title}</h3>
                    <p className={`text-sm font-medium ${item.theme.subtext}`}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      

      {/* --- MODAL TIPS CANTIK (SHEET STYLE) --- */}
      {activeTip && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          {/* Area gelap bisa diklik untuk menutup modal */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setActiveTip(null)} 
          />
          
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-slide">
             {/* Header dengan Warna & Emoji */}
             <div className={`h-32 w-full ${activeTip.theme.bg} relative flex items-center justify-center`}>
                <div className="text-6xl animate-bounce">{activeTip.emoji}</div>
                {/* --- BAGIAN BULATAN (TOMBOL CLOSE) SUDAH DIHAPUS DI SINI --- */}
             </div>

             <div className="p-8 pt-10 relative">
               <div className="absolute -top-5 left-8 px-4 py-2 bg-white rounded-xl shadow-lg text-sm font-bold tracking-wide text-gray-800 uppercase">
                 {activeTip.category}
               </div>
               
               <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                 {activeTip.title}
               </h2>
               
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed text-sm">
                 {activeTip.fullDetail}
               </div>

               {/* Tombol Got It! (Cursor sudah jadi tangan) */}
               <button 
                 onClick={() => setActiveTip(null)} 
                 className={`w-full mt-6 py-3 rounded-xl font-bold shadow-lg shadow-gray-200 transition-transform active:scale-95 cursor-pointer ${activeTip.theme.btn}`}
               >
                 Got it!
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
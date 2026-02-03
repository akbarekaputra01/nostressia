import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Calendar, X, Loader2, CheckCircle } from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Toast from "../../components/Toast";
import PageMeta from "../../components/PageMeta";

import { createDiary, getMyDiaries, updateDiary } from "../../services/diaryService";
import { clearAuthToken, readAuthToken } from "../../utils/auth";
import { createLogger } from "../../utils/logger";

const logger = createLogger("DIARY");

// --- COLOR CONFIGURATION ---
const bgSun = "rgb(var(--bg-gradient-sun))";
const bgOrange = "rgb(var(--bg-gradient-orange))";
const bgSky = "rgb(var(--bg-gradient-sky))";
const colors = {
  brandBlue: "#0162F1",
  brandOrange: "#FF6700",
  brandBlueLight: "#00A4FF",
  textPrimary: "rgb(var(--text-primary))",
  bgCream: "rgb(var(--bg-gradient-sun))",
  bgLavender: "rgb(var(--bg-gradient-sky))",
};

export default function Diary() {
  const baseFont =
    "var(--font-base), 'Manrope', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState("😐");
  const [selectedFont, setSelectedFont] = useState(baseFont);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollRef = useRef(null);

  // --- State for animations and feedback ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useOutletContext() || { user: {} };

  const fontOptions = [
    { name: "Manrope", value: baseFont, label: "Aa" },
    { name: "Serif", value: "Georgia, 'Times New Roman', serif", label: "Bb" },
    {
      name: "Mono",
      value:
        "'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
      label: "Cc",
    },
  ];

  const moods = [
    { emoji: "😢", label: "Stressed" },
    { emoji: "😕", label: "Sad" },
    { emoji: "😐", label: "Neutral" },
    { emoji: "😊", label: "Happy" },
    { emoji: "😄", label: "Excited" },
  ];

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- 2. Fetch data logic (GET) ---
  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        setIsLoading(true);
        const token = readAuthToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        const data = await getMyDiaries();
        const formattedEntries = (data || []).map((item) => ({
          id: item.diaryId,
          title: item.title,
          content: item.note,
          mood: item.emoji,
          font: item.font,
          rawDate: item.date,
          date: new Date(item.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        }));

        setEntries(formattedEntries);
      } catch (error) {
        logger.error("Failed to fetch diary:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchDiaries();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 3. Save data logic (POST) ---
  const handleSubmit = async () => {
    if (!text.trim() || !title.trim()) return;

    try {
      setIsSubmitting(true);
      const token = readAuthToken();
      if (!token) {
        showToast("You are not logged in.", "warning");
        setIsSubmitting(false);
        return;
      }

      const entryToEdit = entries.find((entry) => entry.id === editingEntryId);
      const payload = {
        title: title,
        note: text,
        emoji: selectedMood,
        font: selectedFont,
        date: entryToEdit?.rawDate || new Date().toISOString().split("T")[0],
      };

      const savedData = editingEntryId
        ? await updateDiary(editingEntryId, payload)
        : await createDiary(payload);

      const updatedEntry = {
        id: savedData.diaryId,
        title: savedData.title,
        content: savedData.note,
        mood: savedData.emoji,
        font: savedData.font,
        rawDate: savedData.date,
        date: new Date(savedData.date).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };

      if (editingEntryId) {
        setEntries((prev) =>
          prev.map((entry) => (entry.id === editingEntryId ? updatedEntry : entry)),
        );
      } else {
        setEntries([updatedEntry, ...entries]);
      }
      setTitle("");
      setText("");
      setSelectedMood("😐");
      setIsBookOpen(false);
      setEditingEntryId(null);

      // Show success modal
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2500);
    } catch (error) {
      logger.error("Failed to save diary:", error);
      showToast("Failed to save diary.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleEditEntry = (entry) => {
    if (!entry) return;
    setTitle(entry.title);
    setText(entry.content);
    setSelectedMood(entry.mood);
    setSelectedFont(entry.font || baseFont);
    setEditingEntryId(entry.id);
    setIsBookOpen(true);
    setSelectedEntry(null);
  };

  const handleCloseEditor = () => {
    setIsBookOpen(false);
    setEditingEntryId(null);
    setTitle("");
    setText("");
    setSelectedMood("😐");
    setSelectedFont(baseFont);
  };

  const isEditing = Boolean(editingEntryId);

  return (
    <div
      className="min-h-screen relative overflow-x-hidden flex flex-col font-sans transition-colors duration-500 custom-scrollbar"
      style={{
        backgroundColor: bgSun,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgSun} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgOrange} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgSky} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
        fontFamily: baseFont,
      }}
    >
      <PageMeta
        title="Diary"
        description="Write a daily journal to reflect on yourself and track your emotional progress in Nostressia."
      />
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--neutral-300)); border-radius: 10px; }
        
        .notebook-lines {
            background-color: rgb(var(--journal-paper-muted));
            background-image: linear-gradient(transparent 31px, rgb(var(--journal-line)) 31px);
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
            background: linear-gradient(to bottom, rgb(var(--neutral-300)), rgb(var(--neutral-400)), rgb(var(--neutral-300)));
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
            background: rgb(var(--journal-line));
            border-radius: 50%;
        }
      `}</style>

      {/* --- FIXED NAVBAR WRAPPER (ADJUSTED) ---
          - pt-4 md:pt-6: Adds spacing above the navbar to avoid sticking to the top.
          - z-50: Keeps the navbar above the content.
      */}
      <div className="fixed top-0 left-0 w-full z-50 pt-4 md:pt-4 transition-all duration-300">
        <Navbar activeLink="Diary" user={user} />
      </div>

      {/* --- SPACER (ADJUSTED) ---
          - Increase height to compensate for the navbar padding.
          - Mobile: 160px (keeps the header from overlapping).
          - Desktop: 130px (prevents the title from being covered).
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
          <p className="text-text-secondary mt-2 text-base md:text-lg font-medium dark:text-text-muted">
            Write your story today.
          </p>
        </motion.div>

        {/* 3D BOOK ENGINE */}
        <div className="relative w-full max-w-[1000px] h-[450px] sm:h-[500px] md:h-[600px] flex items-center justify-center perspective-[2000px] mt-0">
          <motion.div
            className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] h-full preserve-3d"
            animate={{ x: isBookOpen && !isMobile ? 190 : 0 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 40, damping: 15 }}
          >
            {/* HALAMAN MENULIS */}
            <div
              className="absolute inset-0 w-full h-full rounded-[16px] md:rounded-l-[4px] md:rounded-r-[16px] shadow-xl z-0 flex flex-col overflow-hidden border border-border dark:border-border"
              style={{ backgroundColor: "rgb(var(--journal-paper))" }}
            >
              <div className="flex-grow p-5 md:p-8 flex flex-col relative z-10">
                <button
                  onClick={handleCloseEditor}
                  className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-2 mb-2 overflow-x-auto py-2 border-b border-border no-scrollbar">
                  {moods.map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setSelectedMood(m.emoji)}
                      className={`text-xl md:text-2xl hover:scale-110 transition-transform p-1 rounded-lg ${selectedMood === m.emoji ? "bg-blue-50 scale-110" : "opacity-60 grayscale"}`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
                <div className="flex-grow relative flex flex-col overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-50 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgb(var(--journal-line)) 1px, transparent 1px)",
                      backgroundSize: "100% 40px",
                      backgroundPosition: "0px 39px",
                    }}
                  ></div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title..."
                    className="bg-transparent text-lg md:text-2xl font-bold focus:outline-none w-full h-[40px] leading-[40px] relative z-10"
                    style={{ fontFamily: selectedFont || baseFont, color: colors.brandBlue }}
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Dear diary..."
                    className="flex-grow bg-transparent resize-none focus:outline-none text-sm md:text-lg leading-[40px] custom-scrollbar w-full relative z-10"
                    style={{
                      fontFamily: selectedFont || baseFont,
                      color: "rgb(var(--journal-ink))",
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between items-center pt-2 border-t border-border-subtle">
                  <div className="flex gap-1">
                    {fontOptions.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setSelectedFont(f.value)}
                        className={`w-6 h-6 rounded-full border text-[10px] flex items-center justify-center transition-all ${selectedFont === f.value ? "bg-surface-muted text-text-secondary border-border dark:bg-surface dark:text-white dark:border-border" : "bg-surface-elevated glass-panel text-text-muted dark:bg-surface dark:text-text-primary dark:border-border"}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Save button with loading state */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-lg font-bold text-white shadow-md active:scale-95 text-xs md:text-base flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    style={{ backgroundColor: colors.brandBlue }}
                  >
                    {isSubmitting ? (
                      <>
                        Saving <Loader2 className="animate-spin" size={16} />
                      </>
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* COVER DEPAN */}
            <motion.div
              className="absolute inset-0 w-full h-full cursor-pointer preserve-3d origin-left z-20"
              animate={{ rotateY: isBookOpen ? -180 : 0, opacity: isBookOpen && isMobile ? 0 : 1 }}
              transition={{ duration: 0.8 }}
              onClick={() => !isBookOpen && setIsBookOpen(true)}
              style={{ pointerEvents: isBookOpen && isMobile ? "none" : "auto" }}
            >
              <div
                className="absolute inset-0 w-full h-full rounded-r-[16px] rounded-l-[4px] shadow-2xl flex flex-col items-center justify-center transition-all duration-500"
                style={{
                  backgroundColor: colors.brandBlue,
                  borderLeft: `8px solid ${colors.brandBlueLight}`,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Border garis oranye */}
                <div
                  className={`absolute top-4 bottom-4 left-6 right-4 border-2 rounded-r-lg transition-opacity duration-700 ease-in-out ${
                    isBookOpen ? "opacity-0" : "opacity-80"
                  }`}
                  style={{ borderColor: colors.brandOrange }}
                ></div>

                {/* Konten Utama */}
                <div
                  className={`z-10 text-center p-4 md:p-8 bg-neutral-950/10 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner transition-all duration-700 ease-in-out ${
                    isBookOpen ? "opacity-0 invisible scale-95" : "opacity-100 visible scale-100"
                  }`}
                >
                  <span className="text-3xl md:text-4xl">📘</span>
                  <h2 className="text-xl md:text-3xl font-extrabold text-white mt-4 tracking-widest font-sans">
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

                {/* Clickable button */}
                <div
                  className={`absolute bottom-8 animate-bounce text-white/50 text-xs font-bold tracking-widest uppercase transition-opacity duration-500 ${
                    isBookOpen ? "opacity-0 invisible" : "opacity-100 visible"
                  }`}
                >
                  click to open diary
                </div>
              </div>
              <div
                className="absolute inset-0 w-full h-full rounded-l-[16px] rounded-r-[4px] shadow-inner border-r border-border dark:border-border"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                  backgroundColor: "rgb(var(--journal-paper))",
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-10 opacity-60">
                  <div className="w-24 h-24 rounded-full bg-surface-muted dark:bg-surface-muted mb-4 flex items-center justify-center border-4 border-white dark:border-border shadow-sm overflow-hidden">
                    <img
                      src={
                        user?.avatar ||
                        `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=${colors.brandOrange.replace("#", "")}&color=fff`
                      }
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-sans italic text-text-muted text-base md:text-lg dark:text-text-muted">
                    This diary belongs to:
                  </h3>
                  <h2 className="text-xl font-bold text-text-secondary mt-1 dark:text-text-primary">
                    {user?.name || "User"}
                  </h2>
                  <div className="border-b-2 border-border dark:border-border w-full mt-2 mb-6"></div>
                  <p className="text-center text-xs text-text-muted leading-loose italic font-sans dark:text-text-muted">
                    "Keep your face always toward the sunshine—and shadows will fall behind you."
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* History section with loading and animations */}
        <div className="w-full max-w-6xl mt-12 md:mt-16 pb-20 min-h-[300px]">
          {isLoading ? (
            // View while data is loading
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
            </div>
          ) : // View after data loads
          entries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="h-8 w-1 rounded-full"
                  style={{ backgroundColor: colors.brandOrange }}
                ></div>
                <h3 className="font-bold text-lg md:text-xl dark:text-text-primary">
                  Your Memories
                </h3>
                <span className="text-xs font-normal text-text-muted ml-2 bg-surface-elevated glass-panel px-2 py-1 rounded-full shadow-sm dark:bg-surface dark:text-text-muted">
                  Synced
                </span>
              </div>
              <div className="relative group">
                <div
                  ref={scrollRef}
                  className="flex gap-4 md:gap-5 overflow-x-auto pb-8 pt-2 no-scrollbar snap-x snap-mandatory"
                >
                  <AnimatePresence mode="popLayout">
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex-shrink-0 snap-center group/card bg-surface-elevated glass-panel rounded-2xl shadow-sm border border-border-subtle cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all p-5 md:p-6 w-[85vw] sm:w-[320px] h-[220px] md:h-[240px] dark:bg-surface/80 dark:border-border"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <div className="flex justify-between mb-3">
                          <span className="text-2xl md:text-3xl">{entry.mood}</span>
                        </div>
                        <h4
                          className="font-bold text-base md:text-lg mb-1 truncate leading-snug dark:text-text-primary"
                          style={{ fontFamily: entry.font || baseFont }}
                        >
                          {entry.title}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-3">
                          {entry.date}
                        </p>
                        <p
                          className="text-text-muted text-xs md:text-sm line-clamp-3 dark:text-text-muted"
                          style={{ fontFamily: entry.font || baseFont }}
                        >
                          {entry.content}
                        </p>
                        <div className="mt-2 text-right">
                          <span className="text-xs font-semibold text-blue-400">Read more →</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 md:py-16 opacity-50 border-2 border-dashed border-border rounded-3xl w-full dark:border-border"
            >
              <span className="text-3xl md:text-4xl mb-2">📝</span>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-text-muted">
                No stories recorded yet
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* --- MODAL DETAIL --- */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="absolute inset-0 bg-surface-muted/60 dark:bg-surface/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-4xl h-full max-h-[85vh] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col p-2"
              style={{ backgroundColor: "rgb(var(--surface-muted))" }}
            >
              <div
                className="relative flex-grow rounded-xl overflow-hidden flex shadow-inner border border-border dark:border-border"
                style={{ backgroundColor: "rgb(var(--journal-paper-muted))" }}
              >
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
                      <div className="w-16 h-[64px] bg-surface-elevated glass-panel dark:bg-surface rounded-xl shadow-sm border border-border dark:border-border flex items-center justify-center text-4xl shrink-0">
                        {selectedEntry.mood}
                      </div>
                      <div className="flex flex-col justify-end h-[64px]">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 h-[32px] border-b border-transparent">
                          <Calendar size={14} />
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            {selectedEntry.date}
                          </span>
                        </div>
                        <h2
                          className="text-lg md:text-3xl font-extrabold text-text-primary dark:text-text-primary leading-tight truncate pb-1"
                          style={{ fontFamily: selectedEntry.font || baseFont }}
                        >
                          {selectedEntry.title}
                        </h2>
                      </div>
                    </div>
                    <div
                      className="text-sm md:text-xl whitespace-pre-wrap mt-0"
                      style={{
                        fontFamily: selectedEntry.font || baseFont,
                        lineHeight: "32px",
                        color: "rgb(var(--journal-ink))",
                      }}
                    >
                      {selectedEntry.content}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 flex justify-end items-center gap-3 bg-surface-elevated/50 glass-panel dark:bg-surface/60">
                <button
                  onClick={() => handleEditEntry(selectedEntry)}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-orange-600 transition-all active:scale-95"
                >
                  Edit Entry
                </button>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="px-6 py-2 bg-brand-neutral dark:bg-blue-500 text-text-neutral text-white rounded-lg font-bold text-sm shadow-md hover:bg-neutral-800 dark:hover:bg-blue-600 transition-all active:scale-95"
                >
                  Close Journal
                </button>
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
              className="bg-surface-elevated/90 backdrop-blur-md border border-white/50 shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center gap-3 pointer-events-auto dark:bg-surface/90 dark:border-border"
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-1 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary">
                Diary Saved!
              </h3>
              <p className="text-text-muted dark:text-text-muted text-sm">
                Your memory has been safely recorded.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <Footer />
    </div>
  );
}

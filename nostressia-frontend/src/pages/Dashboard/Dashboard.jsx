// src/pages/Dashboard/Dashboard.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom"; 
import {
  addStressLog,
  getGlobalForecast,
  getMyStressLogs,
  getStressEligibility,
  predictCurrentStress,
  restoreStressLog,
} from "../../services/stressService";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

// --- COLOR CONFIGURATION ---
const brandBlue = "#3664BA";
const brandOrange = "#F2994A";
const brandGreen = "#27AE60";
const brandRed = "#E53E3E";
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";
const colorGray = "#D1D5DB";

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
];

// --- BENTO WIDGET TIPS ---
const resourcesList = [
  {
    id: 1,
    category: "Sleep Hygiene",
    emoji: "🌙",
    title: "Digital Sunset",
    desc: "Turn off gadgets 1 hour before sleep.",
    fullDetail: "The blue light from screens tricks your brain into thinking it's still daytime. Set a 'Digital Sunset' alarm for 9 PM. Replace scrolling with reading a physical book for better sleep.",
    theme: { bg: "bg-blue-50/40", text: "text-blue-900", subtext: "text-blue-700", accent: "bg-blue-200", btn: "bg-blue-600 hover:bg-blue-700 text-white" }
  },
  {
    id: 2,
    category: "Focus Hack",
    emoji: "🍅",
    title: "Pomodoro",
    desc: "25 minutes focus, 5 minutes break.",
    fullDetail: "Your brain has a focus limit. Use a timer. When the bell rings, stand up and stretch. This method prevents burnout and keeps energy stable all day.",
    theme: { bg: "bg-orange-50/40", text: "text-orange-900", subtext: "text-orange-700", accent: "bg-orange-200", btn: "bg-orange-500 hover:bg-orange-600 text-white" }
  },
  {
    id: 3,
    category: "Anxiety Relief",
    emoji: "🍃",
    title: "Grounding 5-4-3-2-1",
    desc: "Anxious? Use your 5 senses.",
    fullDetail: "Name: 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste. This technique forces your brain to switch from 'panic mode' to 'conscious mode' instantly.",
    theme: { bg: "bg-teal-50/40", text: "text-teal-900", subtext: "text-teal-700", accent: "bg-teal-200", btn: "bg-teal-600 hover:bg-teal-700 text-white" }
  },
];

// --- HELPER FUNCTIONS ---
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper status: 2 = High, 1 = Moderate, 0 = Low
function getStatusFromLevel(level) {
  if (level > 60) return 2;
  if (level > 30) return 1;
  return 0;
}

// Helper mapping API Result (0, 1, 2) ke UI
function mapPredictionToUI(label) {
  if (label === "High" || label === 2) return { score: 85, color: brandRed, status: 2 };
  if (label === "Moderate" || label === 1) return { score: 50, color: brandOrange, status: 1 };
  return { score: 20, color: brandGreen, status: 0 };
}

function createEmptyTodayData(todayKey) {
  return {
    [todayKey]: {
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
    },
  };
}

// --- VARIATION ADVICES LIST ---
const highStressAdvices = [
  "High stress likely. Try the 4-7-8 breathing technique: Inhale for 4s, hold for 7s, exhale for 8s.",
  "Your energy might be drained. Prioritize sleep tonight and limit screen time before bed.",
  "Don't overwhelm yourself. Pick just 3 major tasks for today and focus only on them.",
  "High pressure detected. Take a 10-minute walk outside to reset your cortisol levels.",
  "It's okay to say no. Delegate tasks where possible and focus on your mental well-being.",
  "Avoid excessive caffeine today; it might heighten anxiety. Opt for herbal tea or water."
];

const lowStressAdvices = [
  "Great energy ahead! Use this clarity to tackle your hardest subject or project.",
  "Low stress predicted. It's a perfect time to learn a new skill or hobby.",
  "You are in a good flow. Consider helping a friend or socializing to boost your mood further.",
  "Mental clarity is high. Plan your schedule for the upcoming busy week.",
  "Take advantage of this calm. Push your physical limits with a slightly more intense workout.",
  "Enjoy the balance. Treat yourself to a good book or a creative activity you love."
];

const moderateStressAdvices = [
  "Balance looks steady. Keep your routine consistent and avoid overcommitting.",
  "Stress is manageable. Schedule a short break to keep your energy stable.",
  "You're in the middle zone—prioritize the tasks that matter most today."
];

function resolveForecastStatus({ predictionLabel, predictionBinary, chancePercent, threshold }) {
  const normalized = String(predictionLabel || "").toLowerCase();
  if (normalized.includes("high")) return "High";
  if (normalized.includes("moderate")) return "Moderate";
  if (normalized.includes("low")) return "Low";
  if (typeof predictionBinary === "number") return predictionBinary === 1 ? "High" : "Low";
  if (typeof chancePercent === "number" && typeof threshold === "number") {
    return chancePercent >= threshold * 100 ? "High" : "Low";
  }
  return "Low";
}

function getForecastTheme(status) {
  if (status === "High") {
    return {
      color: brandRed,
      bg: "bg-red-50",
      panelTheme: "bg-gradient-to-b from-red-50 via-white to-white",
      border: "border-red-200",
      icon: "ph-warning"
    };
  }
  if (status === "Moderate") {
    return {
      color: brandOrange,
      bg: "bg-orange-50",
      panelTheme: "bg-gradient-to-b from-orange-50 via-white to-white",
      border: "border-orange-200",
      icon: "ph-activity"
    };
  }
  return {
    color: brandGreen,
    bg: "bg-green-50",
    panelTheme: "bg-gradient-to-b from-green-50 via-white to-white",
    border: "border-green-200",
    icon: "ph-plant"
  };
}

function buildForecastList(baseForecast) {
  if (!baseForecast) return [];

  const forecastArray =
    (Array.isArray(baseForecast) && baseForecast) ||
    baseForecast?.forecasts ||
    baseForecast?.forecastList ||
    baseForecast?.predictions ||
    baseForecast?.items;

  const getForecastDate = (entry) =>
    entry?.forecastDate ||
    entry?.forecast_date ||
    entry?.date ||
    entry?.predictionDate ||
    entry?.prediction_date;

  const resolveChancePercent = (entry, fallbackChance) => {
    const rawChance = entry?.chancePercent ?? entry?.probability ?? entry?.chance;
    const chance = Number.isFinite(Number(rawChance)) ? Number(rawChance) : fallbackChance;
    return Math.round(chance * 10) / 10;
  };

  const threshold = Number(baseForecast?.threshold ?? 0.5);
  const baseChance = Number(baseForecast?.chancePercent ?? baseForecast?.probability ?? 0);
  const baseProbability = Math.max(0, Math.min(baseChance, 100)) / 100;

  if (Array.isArray(forecastArray)) {
    return forecastArray.slice(0, 3).map((entry, idx) => {
      const entryDate = getForecastDate(entry) || getForecastDate(baseForecast);
      const resolvedDate = entryDate ? new Date(entryDate) : null;
      if (!resolvedDate || Number.isNaN(resolvedDate.getTime())) {
        return null;
      }
      const chancePercent = resolveChancePercent(entry, baseChance);
      const status = resolveForecastStatus({
        predictionLabel: entry?.predictionLabel ?? baseForecast?.predictionLabel,
        predictionBinary: entry?.predictionBinary ?? baseForecast?.predictionBinary,
        chancePercent,
        threshold
      });
      const adviceOptions =
        status === "High"
          ? highStressAdvices
          : status === "Moderate"
          ? moderateStressAdvices
          : lowStressAdvices;
      const adviceText =
        adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
      const theme = getForecastTheme(status);

      return {
        dateStr: resolvedDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        fullDate: resolvedDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }),
        status,
        probability: chancePercent,
        advice: adviceText,
        modelType: entry?.modelType ?? baseForecast?.modelType,
        threshold,
        ...theme
      };
    }).filter(Boolean);
  }

  const forecastDate = getForecastDate(baseForecast);
  if (!forecastDate) return [];
  const startDate = new Date(forecastDate);
  if (Number.isNaN(startDate.getTime())) return [];

  let nestedProbability = baseProbability;
  return Array.from({ length: 3 }, (_, idx) => {
    if (idx > 0) nestedProbability *= baseProbability;
    const chancePercent = Math.round(nestedProbability * 1000) / 10;
    const status = resolveForecastStatus({
      predictionLabel: baseForecast?.predictionLabel,
      predictionBinary: baseForecast?.predictionBinary,
      chancePercent,
      threshold
    });
    const adviceOptions =
      status === "High"
        ? highStressAdvices
        : status === "Moderate"
        ? moderateStressAdvices
        : lowStressAdvices;
    const adviceText =
      adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
    const iterDate = new Date(startDate);
    iterDate.setDate(startDate.getDate() + idx);
    const theme = getForecastTheme(status);

    return {
      dateStr: iterDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      fullDate: iterDate.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }),
      status,
      probability: chancePercent,
      advice: adviceText,
      modelType: baseForecast?.modelType,
      threshold,
      ...theme
    };
  });
}

function normalizeEligibility(payload) {
  const eligibility = payload?.eligibility ?? payload?.detail ?? payload;
  if (!eligibility) return null;

  const streak = Number(eligibility?.streak ?? eligibility?.streakCount ?? 0);
  const requiredStreak = Number(
    eligibility?.requiredStreak ?? eligibility?.required_streak ?? 7
  );
  const restoreUsed = Number(
    eligibility?.restoreUsed ?? eligibility?.restore_used ?? 0
  );
  const restoreLimit = Number(
    eligibility?.restoreLimit ?? eligibility?.restore_limit ?? 3
  );

  return {
    streak,
    requiredStreak,
    restoreUsed,
    restoreLimit,
    missing: eligibility?.missing,
    note: eligibility?.note,
  };
}

function buildForecastEligibilityMessage({
  reason,
  streakCount,
  restoreUsed,
  restoreRemaining,
  requiredStreak = 7,
  restoreLimit = 3
} = {}) {
  const safeStreak = Number.isFinite(Number(streakCount)) ? streakCount : "-";
  const safeUsed = Number.isFinite(Number(restoreUsed)) ? restoreUsed : "-";
  const safeRemaining = Number.isFinite(Number(restoreRemaining)) ? restoreRemaining : "-";

  return [
    "Forecast belum tersedia karena data belum memenuhi syarat.",
    reason ? `Alasan: ${reason}` : null,
    `Data terkumpul: ${safeStreak}/${requiredStreak}.`,
    `• Butuh ${requiredStreak} data (tidak harus berturut).`,
    `• Restore boleh dipakai (maks ${restoreLimit}/bulan).`,
    "• Minimal 4 data asli di window 7.",
    `Restore terpakai: ${safeUsed} • Sisa: ${safeRemaining}.`
  ]
    .filter(Boolean)
    .join("\n");
}

export default function Dashboard() {
  const { user } = useOutletContext() || { user: {} };
  const username = user?.name || "Friend";
  const navigate = useNavigate();

  const today = new Date();
  const TODAY_KEY = formatDate(today);

  const [isFlipped, setIsFlipped] = useState(false);
   
  // State Data Utama
  const [stressData, setStressData] = useState(() => createEmptyTodayData(TODAY_KEY));
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [stressScore, setStressScore] = useState(0);
  const [todayLogId, setTodayLogId] = useState(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Success Modal & Detail
  const [successModal, setSuccessModal] = useState({ visible: false, title: "", text: "" });
  const [dayDetail, setDayDetail] = useState(null);
  const [activeTip, setActiveTip] = useState(null);
  
  // Forecast State
  const [forecastDetail, setForecastDetail] = useState(null); 
  const [forecastList, setForecastList] = useState([]); 
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  // State khusus untuk animasi tutup panel
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState("");

  // --- FORM STATE ---
  const [gpa, setGpa] = useState(() => {
    const saved = localStorage.getItem("user_gpa");
    return saved ? Number(saved) : "";
  });
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
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeLogDate, setActiveLogDate] = useState(TODAY_KEY);
  const [isRestoreMode, setIsRestoreMode] = useState(false);

  const month = calendarDate.getMonth();
  const year = calendarDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selectedDateKey = formatDate(selectedDate);
  const selectedDayData = stressData[selectedDateKey];
  const selectedDayHasData = selectedDayData && !selectedDayData.isEmpty;
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedCalendarDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );
  const isSelectedPast = selectedCalendarDate < todayDate;
  const normalizedEligibility = useMemo(
    () => normalizeEligibility(eligibilityData),
    [eligibilityData]
  );
  const restoreUsed = normalizedEligibility?.restoreUsed ?? 0;
  const restoreLimit = normalizedEligibility?.restoreLimit ?? 3;
  const restoreRemaining = Math.max(restoreLimit - restoreUsed, 0);
  const canRestoreSelectedDay = isSelectedPast && !selectedDayHasData;
  const restoreHint = (() => {
    if (eligibilityLoading) return "Memuat eligibility restore...";
    if (eligibilityError) return "Gagal memuat eligibility restore.";
    if (restoreRemaining <= 0) return "Restore limit bulan ini sudah habis.";
    if (!isSelectedPast) return "Pilih tanggal sebelum hari ini untuk restore.";
    if (selectedDayHasData) return "Tanggal ini sudah terisi.";
    return "Tanggal kosong. Kamu bisa restore data.";
  })();

  // --- LOGIKA GRADIEN BACKGROUND ---
  let gradientBg = 'radial-gradient(circle at 50% 30%, rgba(156, 163, 175, 0.15), transparent 70%)'; 
  if (hasSubmittedToday) {
    if (stressScore > 60) gradientBg = `radial-gradient(circle at 50% 30%, ${brandRed}30, transparent 70%)`;
    else if (stressScore > 30) gradientBg = `radial-gradient(circle at 50% 30%, ${brandOrange}30, transparent 70%)`;
    else gradientBg = `radial-gradient(circle at 50% 30%, ${brandGreen}30, transparent 70%)`;
  }

  // --- MENGHITUNG TREND DOTS ---
  const trendDots = [];
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = formatDate(d);
    
    const dataOnDate = stressData[dateKey];
    let status = null; 

    if (dataOnDate && !dataOnDate.isEmpty) {
        status = getStatusFromLevel(dataOnDate.level);
    }
    
    if (i === 0 && hasSubmittedToday) {
        status = getStatusFromLevel(stressScore);
    }

    trendDots.push({
        day: daysShort[d.getDay()],
        status: status, 
        isToday: i === 0
    });
  }

  function handleNewQuote() {
    setIsQuoteAnimating(true);
    setTimeout(() => {
      let newQuote;
      do { newQuote = quotesList[Math.floor(Math.random() * quotesList.length)]; } while (newQuote.text === quoteData.text);
      setQuoteData(newQuote);
      setIsQuoteAnimating(false);
    }, 400);
  }

  function resetFormToEmpty() {
    setSleepHours(""); setStudyHours(""); setSocialHours(""); setExtraHours(""); setPhysicalHours(""); setMoodIndex(2);
  }

  // --- FUNGSI UNTUK MENUTUP FORECAST DENGAN ANIMASI ---
  function handleCloseForecast() {
    setIsClosingPanel(true); // Mulai animasi tutup (slide-down)
    setTimeout(() => {
      setForecastDetail(null); // Hapus data setelah animasi selesai
      setIsClosingPanel(false); // Reset status animasi
    }, 380); // Waktu sedikit kurang dari durasi animasi CSS (0.4s) agar mulus
  }

  const refreshEligibility = useCallback(
    async ({ signal } = {}) => {
      setEligibilityLoading(true);
      setEligibilityError("");
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setEligibilityData(null);
          return;
        }

        const data = await getStressEligibility();
        setEligibilityData(data);
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        const detail = error?.payload?.detail || error?.message;
        setEligibilityError(
          `Gagal memuat eligibility.${detail ? ` ${detail}` : ""}`
        );
      } finally {
        setEligibilityLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const controller = new AbortController();
    refreshEligibility({ signal: controller.signal });
    return () => controller.abort();
  }, [refreshEligibility]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      setLoadError("");
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setStressData(createEmptyTodayData(TODAY_KEY));
          setHasSubmittedToday(false);
          setStressScore(0);
          setTodayLogId(null);
          setIsLoadingLogs(false);
          return;
        }
        const logs = await getMyStressLogs();
        const logList = Array.isArray(logs) ? logs : [];

        const byDate = new Map();
        logList.forEach((log) => {
          const dt = log?.date ? new Date(log.date) : null;
          if (!dt || Number.isNaN(dt.getTime())) return;
          const dateKey = formatDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
          const prev = byDate.get(dateKey);
          const prevTs = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
          const curTs = log?.createdAt ? new Date(log.createdAt).getTime() : 0;
          if (!prev || curTs >= prevTs) byDate.set(dateKey, log);
        });

        const updatedData = {};
        byDate.forEach((log, dateKey) => {
          const { score, color } = mapPredictionToUI(log?.stressLevel);
          const moodIdx = Number(log?.emoji);
          updatedData[dateKey] = {
            level: score,
            sleep: Number(log?.sleepHourPerDay) || 0,
            study: Number(log?.studyHourPerDay) || 0,
            extra: Number(log?.extracurricularHourPerDay) || 0,
            social: Number(log?.socialHourPerDay) || 0,
            physical: Number(log?.physicalActivityHourPerDay) || 0,
            mood: moods[moodIdx] || "😐",
            color,
            isToday: dateKey === TODAY_KEY,
            isEmpty: false,
            isRestored: log?.isRestored ?? log?.is_restored ?? false,
            logId: log?.stressLevelId ?? log?.id ?? log?._id ?? null,
          };
        });

        if (!updatedData[TODAY_KEY]) {
          Object.assign(updatedData, createEmptyTodayData(TODAY_KEY));
        }

        setStressData(updatedData);

        const todayData = updatedData[TODAY_KEY];
        if (todayData && !todayData.isEmpty) {
          setHasSubmittedToday(true);
          setStressScore(todayData.level);
          setTodayLogId(todayData.logId ?? null);
          const moodIdx = moods.indexOf(todayData.mood);
          setMoodIndex(moodIdx >= 0 ? moodIdx : 2);
        } else {
          setHasSubmittedToday(false);
          setStressScore(0);
          setTodayLogId(null);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("Failed to fetch stress logs:", error);
        setStressData(createEmptyTodayData(TODAY_KEY));
        setHasSubmittedToday(false);
        setStressScore(0);
        setTodayLogId(null);
        setLoadError("Gagal memuat data dashboard. Silakan coba lagi.");
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchLogs();
    return () => controller.abort();
  }, [TODAY_KEY]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchForecast = async () => {
      setForecastLoading(true);
      setForecastError("");
      setForecastDetail(null);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setForecastList([]);
          setForecastError("Login untuk melihat forecast.");
          return;
        }

        let eligibilitySnapshot = normalizedEligibility;
        if (!eligibilitySnapshot) {
          const eligibilityRaw = await getStressEligibility();
          setEligibilityData(eligibilityRaw);
          eligibilitySnapshot = normalizeEligibility(eligibilityRaw);
        }

        const requiredStreak = eligibilitySnapshot?.requiredStreak ?? 7;
        const restoreLimit = eligibilitySnapshot?.restoreLimit ?? 3;
        const restoreRemainingCalc = Math.max(
          (eligibilitySnapshot?.restoreLimit ?? 3) -
            (eligibilitySnapshot?.restoreUsed ?? 0),
          0
        );

        if (!eligibilitySnapshot || eligibilitySnapshot.streak < requiredStreak) {
          setForecastList([]);
          setForecastError(
            buildForecastEligibilityMessage({
              reason: eligibilitySnapshot?.note,
              streakCount: eligibilitySnapshot?.streak,
              restoreUsed: eligibilitySnapshot?.restoreUsed,
              restoreRemaining: restoreRemainingCalc,
              requiredStreak,
              restoreLimit,
            })
          );
          return;
        }

        const data = await getGlobalForecast();

        const baseForecast =
          data?.forecast ?? data?.data ?? data?.forecastData ?? data;
        const list = buildForecastList(baseForecast);
        setForecastList(list);
        if (list.length === 0) {
          setForecastError("Forecast belum tersedia.");
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        const normalizedErrorEligibility = normalizeEligibility(
          error?.payload?.detail ?? error?.payload
        );
        if (normalizedErrorEligibility) {
          const restoreRemainingCalc = Math.max(
            (normalizedErrorEligibility.restoreLimit ?? 3) -
              (normalizedErrorEligibility.restoreUsed ?? 0),
            0
          );
          setForecastError(
            buildForecastEligibilityMessage({
              reason: normalizedErrorEligibility.note,
              streakCount: normalizedErrorEligibility.streak,
              restoreUsed: normalizedErrorEligibility.restoreUsed,
              restoreRemaining: restoreRemainingCalc,
              requiredStreak: normalizedErrorEligibility.requiredStreak,
              restoreLimit: normalizedErrorEligibility.restoreLimit,
            })
          );
          return;
        }
        if (error?.status === 400) {
          setForecastError("Histori belum cukup.");
          return;
        }
        const detail =
          error?.payload?.detail || error?.payload?.message || error?.message;
        setForecastError(
          `Gagal memuat forecast.${detail ? ` ${detail}` : ""}`
        );
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
    return () => controller.abort();
  }, [navigate, normalizedEligibility]);

  function handleOpenForm({ mode = "today", dateKey = TODAY_KEY } = {}) {
    if (mode === "restore") {
      setIsRestoreMode(true);
      setActiveLogDate(dateKey);
      resetFormToEmpty();
      setIsFlipped(true);
      return;
    }

    const todayData = stressData[TODAY_KEY];
    setIsRestoreMode(false);
    setActiveLogDate(TODAY_KEY);
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

  // LOGIKA SIMPAN GPA (LOKAL)
  function handleGpaSave(val) {
    if (val === "") return alert("GPA cannot be empty");
    const num = parseFloat(val);
    if (Number.isNaN(num) || num < 0 || num > 4) return alert("GPA must be between 0 - 4");
    
    setGpa(num);
    localStorage.setItem("user_gpa", num); // Simpan ke browser
    setIsEditingGpa(false);
  }

  async function saveStressLog(status, { dateKey, isRestore } = {}) {
    const token = localStorage.getItem("token");

    if (!token) return null;

    const logPayload = {
      date: dateKey,
      stressLevel: status,
      gpa: Number(gpa),
      extracurricularHourPerDay: Number(extraHours),
      physicalActivityHourPerDay: Number(physicalHours),
      sleepHourPerDay: Number(sleepHours),
      studyHourPerDay: Number(studyHours),
      socialHourPerDay: Number(socialHours),
      emoji: moodIndex,
    };
    try {
      const logData = await (isRestore ? restoreStressLog : addStressLog)(logPayload);
      return logData?.stressLevelId ?? logData?.id ?? logData?._id ?? null;
    } catch (error) {
      if (error?.status === 409) {
        alert("Data untuk tanggal ini sudah ada. Update belum tersedia.");
        return null;
      }
      if (error?.status === 403 && isRestore) {
        alert("Restore limit bulan ini sudah tercapai.");
        return null;
      }
      console.error("Failed to save stress log:", error);
      return null;
    }
  }

  async function handleSaveForm(e) {
    e.preventDefault();
    
    // VALIDASI: GPA WAJIB DIISI SEBELUM SUBMIT
    if (gpa === "" || gpa === null) {
      setIsEditingGpa(true); // Otomatis buka mode edit
      return alert("⚠️ Please set your GPA first before submitting data.");
    }

    if (sleepHours === "" || sleepHours < 0 || sleepHours > 24) return alert("Please enter valid sleep hours (0-24).");

    try {
      const targetDateKey = activeLogDate || TODAY_KEY;
      const isTargetToday = targetDateKey === TODAY_KEY;
      const payload = {
        studyHours: Number(studyHours),
        extracurricularHours: Number(extraHours),
        sleepHours: Number(sleepHours),
        socialHours: Number(socialHours),
        physicalHours: Number(physicalHours),
        gpa: Number(gpa),
      };

      const apiData = await predictCurrentStress(payload);

      const { score, color, status } = mapPredictionToUI(apiData.result);
      
      const savedLogId = await saveStressLog(status, {
        dateKey: targetDateKey,
        isRestore: isRestoreMode,
      });
      if (!savedLogId) return;
      setSuccessModal({ 
        visible: true, 
        title: isRestoreMode
          ? "Restore Complete!"
          : hasSubmittedToday
          ? "Data Updated!"
          : "Analysis Complete!",
        text: apiData.message // Menggunakan pesan dari Backend
      });

      if (isTargetToday) {
        setStressScore(score);
        setHasSubmittedToday(true);
      }
      const resolvedLogId = savedLogId ?? todayLogId ?? null;
      if (savedLogId && isTargetToday) setTodayLogId(savedLogId);

      setStressData((prev) => ({
        ...prev,
        [targetDateKey]: {
          level: score, label: apiData.result, 
          sleep: Number(sleepHours), study: Number(studyHours),
          extra: Number(extraHours), social: Number(socialHours), physical: Number(physicalHours),
          mood: moods[moodIndex],
          color: color,
          isToday: isTargetToday,
          isEmpty: false,
          isRestored: isRestoreMode,
          logId: resolvedLogId,
        },
      }));

      setTimeout(() => {
        setSuccessModal((prev) => ({ ...prev, visible: false }));
        setIsFlipped(false);
        setIsRestoreMode(false);
        setActiveLogDate(TODAY_KEY);
      }, 2500);

      if (savedLogId) {
        refreshEligibility();
      }

    } catch (error) {
      console.error("❌ Gagal Konek:", error);
      alert("Gagal menghubungi server.");
    }
  }

  // --- UPDATED CALENDAR LOGIC ---
  function changeMonth(offset) {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
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
        .animate-success-icon { animation: success-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-card-enter { animation: card-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-modal-slide { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-down { animation: slideDownFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        /* ANIMASI SLIDE UP (MUNCUL) */
        @keyframes slideUpPanel { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up-panel { animation: slideUpPanel 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        /* ANIMASI SLIDE DOWN (TUTUP) */
        @keyframes slideDownPanel { from { transform: translateY(0); } to { transform: translateY(100%); } }
        .animate-slide-down-panel { animation: slideDownPanel 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes heartbeat { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes glow-pulse { 0%, 100% { filter: drop-shadow(0 0 5px rgba(242, 153, 74, 0.3)); } 50% { filter: drop-shadow(0 0 15px rgba(242, 153, 74, 0.6)); } }
        .anim-float { animation: float-gentle 4s ease-in-out infinite; }
        .anim-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
        .anim-glow { animation: glow-pulse 3s infinite; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
        @keyframes circle-draw { 0% { stroke-dasharray: 0, 100; } 100% { stroke-dasharray: 100, 100; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer-slide { 100% { transform: translateX(100%); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-soft { 0%, 100% { opacity: 0.7; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
        .skeleton {
          position: relative;
          overflow: hidden;
          background-color: rgba(255,255,255,0.65);
        }
        .skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          animation: shimmer-slide 1.6s infinite;
        }
        .spin-slow { animation: spin 1.4s linear infinite; }
        .spin-reverse { animation: spin 2.1s linear infinite reverse; }
        .pulse-soft { animation: pulse-soft 1.8s ease-in-out infinite; }
      `}</style>

      {/* NAVBAR */}
      <Navbar activeLink="Dashboard" onPredictClick={handleOpenForm} user={user} />

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 pt-28">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 flex items-center gap-2">
            Hello, <span style={{ color: brandBlue }}>{username}!</span> 👋
          </h1>
          <p className="text-gray-600 mt-2 text-lg font-medium">Ready to navigate the day with more calm?</p>
        </div>
        {!isLoadingLogs && loadError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* FLIP CARD SECTION */}
          <section className="col-span-1 md:col-span-2 relative" style={{ minHeight: 640 }}>
            {isLoadingLogs && (
              <div className="absolute inset-0 z-20 rounded-[20px] bg-white/70 backdrop-blur-sm p-6 md:p-8">
                <div className="relative h-full w-full rounded-[16px] border border-white/40 bg-white/60 p-6 md:p-8 shadow-inner">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="skeleton h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <div className="skeleton h-4 w-40 rounded-full" />
                        <div className="skeleton h-3 w-28 rounded-full" />
                      </div>
                    </div>
                    <div className="skeleton h-8 w-20 rounded-full" />
                  </div>
                  <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
                    <div className="skeleton h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                      <div className="skeleton h-6 w-56 rounded-full mx-auto" />
                      <div className="skeleton h-4 w-40 rounded-full mx-auto" />
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="skeleton h-4 w-32 rounded-full" />
                    <div className="flex justify-between gap-2">
                      {Array.from({ length: 7 }).map((_, idx) => (
                        <div key={`trend-skel-${idx}`} className="flex flex-col items-center gap-2 flex-1">
                          <div className="skeleton h-4 w-4 rounded-full" />
                          <div className="skeleton h-3 w-6 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="skeleton h-12 w-full rounded-xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-4 border-blue-200 border-t-blue-500 spin-slow" />
                      <div className="absolute h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 spin-reverse" />
                    </div>
                    <p className="text-center text-sm font-semibold text-gray-500 pulse-soft">
                      Preparing your dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div style={{ perspective: 1500 }} className={`w-full h-full ${isLoadingLogs ? "opacity-0 pointer-events-none" : ""}`}>
              <div className={`absolute inset-0 transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                
                {/* FRONT CARD (PREDICTION) */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 0 : 10, pointerEvents: isFlipped ? "none" : "auto" }}
                >
                  <div className="absolute inset-0 transition-all duration-1000 ease-in-out" style={{ background: gradientBg, zIndex: -1, opacity: 0.8 }} />

                  {hasSubmittedToday && (
                    <div className="absolute -top-[4.5rem] -right-[4.5rem] text-[11rem] opacity-[0.08] pointer-events-none select-none grayscale filter" style={{ zIndex: 0 }}>
                      {moods[moodIndex]}
                    </div>
                  )}

                  <header className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">Today's Stress Prediction</h2>
                    <div className="text-2xl text-gray-500"><i className="ph ph-cloud-sun mr-2" /> <i className="ph ph-smiley" /></div>
                  </header>
                  <div className="flex-grow flex flex-col items-center justify-center text-center relative z-10">
                    {(() => {
                      let ui = { label: "NO DATA", sub: "Let's check your status", color: "#9ca3af", icon: "ph-question", anim: "" };
                      if (hasSubmittedToday) {
                        if (stressScore > 60) ui = { label: "HIGH LEVEL", sub: "Please take a break!", color: brandRed, icon: "ph-warning-octagon", anim: "anim-heartbeat" };
                        else if (stressScore > 30) ui = { label: "MODERATE", sub: "Keep it balanced.", color: brandOrange, icon: "ph-scales", anim: "anim-glow" };
                        else ui = { label: "LOW STRESS", sub: "You are doing great!", color: brandGreen, icon: "ph-plant", anim: "anim-float" };
                      }
                      return (
                        <div className="flex flex-col items-center gap-4">
                          <div className={`text-[8rem] leading-none ${ui.anim} drop-shadow-lg`} style={{ color: ui.color, transition: "color 0.5s" }}><i className={`ph ${ui.icon}`}></i></div>
                          <div><h2 className="text-4xl font-black tracking-wider uppercase mb-1" style={{ color: ui.color }}>{ui.label}</h2><p className="text-lg font-semibold text-gray-600">{ui.sub}</p></div>
                        </div>
                      );
                    })()}
                  </div>

                  <hr className="border-t border-white/30 my-6 relative z-10" />
                  
                  {/* TREND DOTS */}
                  <h4 className="text-base font-bold text-gray-800 mb-3 relative z-10">Last 7 Days Trend</h4>
                  <div className="flex justify-between items-end w-full relative z-10 h-16 px-2">
                    {trendDots.map((d, i) => {
                      const isToday = d.isToday;
                      let dotColor = colorGray; 
                      if (d.status === 0) dotColor = brandGreen;
                      if (d.status === 1) dotColor = brandOrange;
                      if (d.status === 2) dotColor = brandRed;
                      
                      const sizeClass = isToday ? "w-5 h-5" : "w-3 h-3";
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1">
                           <div 
                              className={`rounded-full transition-all duration-500 shadow-sm ${sizeClass} border-2 border-white/60`}
                              style={{ 
                                backgroundColor: dotColor,
                                boxShadow: (isToday && d.status !== null) ? `0 0 6px ${dotColor}` : 'none' 
                              }}
                           />
                           <span className="text-xs font-bold text-gray-500 opacity-80">{d.day}</span>
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

                {/* BACK CARD (FORM) */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 rotate-y-180 backface-hidden flex flex-col shadow-xl border border-white/20 overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.45)", zIndex: isFlipped ? 10 : 0, pointerEvents: isFlipped ? "auto" : "none" }}
                >
                  <header className="flex justify-between items-center mb-4 transition-opacity duration-300" style={{ opacity: successModal.visible ? 0 : 1 }}>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {isRestoreMode
                          ? "Restore Data"
                          : hasSubmittedToday
                          ? "Edit Today's Data"
                          : "Log Today's Data"}
                      </h3>
                      {isRestoreMode && (
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                          Target: {activeLogDate}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-black/5 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsFlipped(false);
                        setIsRestoreMode(false);
                        setActiveLogDate(TODAY_KEY);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </header>
                  <form
                    onSubmit={handleSaveForm}
                    className="flex-grow overflow-y-auto pr-2 flex flex-col gap-3 transition-all duration-500 custom-scroll"
                    style={{ opacity: successModal.visible ? 0 : 1, transform: successModal.visible ? "scale(0.95)" : "scale(1)", pointerEvents: successModal.visible ? "none" : "auto" }}
                  >
                    {/* GPA SECTION (UPDATED LOGIC) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">GPA <span className="text-red-500">*</span></label>
                      {!isEditingGpa ? (
                        <div className="flex items-center gap-3">
                          {/* Tampilan jika GPA kosong vs ada isinya */}
                          {gpa !== "" ? (
                             <span className="text-2xl font-bold" style={{ color: brandOrange }}>{Number(gpa).toFixed(2)}</span>
                          ) : (
                             <span className="text-lg font-bold text-gray-400 italic border-b-2 border-dashed border-gray-300">Set GPA</span>
                          )}
                          
                          <button type="button" className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${gpa === "" ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`} onClick={() => setIsEditingGpa(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            defaultValue={gpa === "" ? "" : gpa} 
                            placeholder="0.00"
                            step="0.01" min="0" max="4" 
                            className="w-24 p-2 border border-gray-300 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            id="gpaInput" 
                            style={{ color: "#333" }} 
                            autoFocus
                          />
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
                    <button type="submit" className="w-full py-3 rounded-xl font-bold text-white transition-all hover:brightness-110 mt-2 cursor-pointer" style={{ backgroundColor: isRestoreMode ? brandOrange : hasSubmittedToday ? brandOrange : brandBlue }}>
                      {isRestoreMode ? (
                        <span className="flex items-center justify-center">
                          <i className="ph ph-clock-counter-clockwise mr-2" /> Restore Data
                        </span>
                      ) : hasSubmittedToday ? (
                        <span className="flex items-center justify-center"><i className="ph ph-floppy-disk mr-2" /> Update Data</span>
                      ) : (
                        <span className="flex items-center justify-center"><i className="ph ph-check-circle mr-2" /> Save Data</span>
                      )}
                    </button>
                  </form>

                  {/* INTERNAL SUCCESS OVERLAY */}
                  {successModal.visible && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md rounded-[20px]" style={{ animation: "fadeIn 0.3s ease-out" }}>
                      
                      <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-4 animate-success-icon" style={{ backgroundColor: "#fff", border: `4px solid ${brandGreen}` }}>
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke={brandGreen} strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" style={{ animation: "circle-draw 0.8s ease-out forwards 0.3s" }} />
                        </svg>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards 0.5s" }}>
                        {successModal.title}
                      </h2>

                      <p className="text-gray-600 text-center px-8 mb-4" style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards 0.7s" }}>
                        {successModal.text}
                      </p>

                      <div className="px-6 border-t border-gray-200 pt-3 mt-1" style={{ opacity: 0, animation: "fadeInUp 0.5s ease-out forwards 0.9s" }}>
                        <p className="text-[10px] text-gray-400 font-medium text-center">
                           🤖 AI prediction only. Not a medical diagnosis.
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* CALENDAR SECTION (FIXED BUTTONS) */}
          <section className="col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden" style={{ minHeight: 640 }}>
            {isLoadingLogs && (
              <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm p-6 md:p-8">
                <div className="relative h-full w-full rounded-[16px] border border-white/40 bg-white/60 p-6 md:p-8 shadow-inner">
                   <div className="flex items-center justify-between mb-6">
                      <div className="skeleton h-8 w-8 rounded-full" />
                      <div className="skeleton h-5 w-40 rounded-full" />
                      <div className="skeleton h-8 w-8 rounded-full" />
                   </div>
                   <div className="grid grid-cols-7 gap-2 mb-4">
                      {Array.from({ length: 7 }).map((_, idx) => (
                        <div key={`weekday-skel-${idx}`} className="skeleton h-4 w-full rounded-full" />
                      ))}
                   </div>
                   <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }).map((_, idx) => (
                        <div key={`day-skel-${idx}`} className="skeleton aspect-square rounded-xl" />
                      ))}
                   </div>
                   <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="relative flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-500 spin-slow" />
                        <div className="absolute h-9 w-9 rounded-full border-4 border-orange-200 border-t-orange-500 spin-reverse" />
                      </div>
                      <p className="text-center text-sm font-semibold text-gray-500 pulse-soft">Loading Calendar...</p>
                   </div>
                </div>
              </div>
            )}

            <div className={`flex flex-col h-full ${isLoadingLogs ? "opacity-0 pointer-events-none" : ""}`}>
              <header className="flex justify-between items-center mb-6">
                {/* Tombol Back (Previous Month) - MENGGUNAKAN SVG AGAR PASTI MUNCUL */}
                <button 
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-600 hover:text-brandBlue shadow-sm transition-all cursor-pointer border border-white/20" 
                  onClick={() => changeMonth(-1)}
                  title="Previous Month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Judul Bulan & Tahun */}
                <div className="flex flex-col items-center">
                  <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">
                    {monthNames[month]} {year}
                  </h3>
                  {(month !== today.getMonth() || year !== today.getFullYear()) && (
                    <button 
                      onClick={() => setCalendarDate(new Date())}
                      className="text-xs text-blue-600 font-bold mt-1 hover:underline cursor-pointer"
                    >
                      Jump to Today
                    </button>
                  )}
                </div>

                {/* Tombol Next (Next Month) - MENGGUNAKAN SVG AGAR PASTI MUNCUL */}
                <button 
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white text-gray-600 hover:text-brandBlue shadow-sm transition-all cursor-pointer border border-white/20" 
                  onClick={() => changeMonth(1)}
                  title="Next Month"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </header>

              {/* Nama Hari */}
              <div className="grid grid-cols-7 gap-1 mb-3 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                ))}
              </div>

              {/* Grid Tanggal */}
              <div className="grid grid-cols-7 gap-2">
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${month}-${i}`} className="aspect-square" />
                ))}

                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const d = new Date(year, month, day); 
                  const ds = formatDate(d);
                  
                  const has = stressData[ds];
                  const hasData = has && !has.isEmpty;
                  
                  const isSel = selectedDate.getDate() === day && 
                                selectedDate.getMonth() === month && 
                                selectedDate.getFullYear() === year;

                  const isRealToday = day === today.getDate() && 
                                      month === today.getMonth() && 
                                      year === today.getFullYear();

                  return (
                    <div
                      key={`day-${month}-${day}`}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-2xl font-bold text-sm cursor-pointer transition-all duration-300 relative overflow-hidden group
                        ${isSel ? "text-white shadow-lg scale-105" : "text-gray-600 hover:bg-white/80 hover:shadow-md"}
                        ${!isSel && isRealToday ? "bg-blue-50 border-2 border-blue-200" : ""}
                      `}
                      style={{
                        background: isSel ? brandBlue : "transparent",
                        border: (!isSel && hasData) ? `2px solid ${has.color}40` : (!isSel && isRealToday) ? "2px solid #BFDBFE" : "none"
                      }}
                    >
                      <span className="relative z-10">{day}</span>
                      {hasData && (
                        <div 
                          className={`mt-1 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSel ? "bg-white" : ""}`} 
                          style={{ backgroundColor: isSel ? "white" : has.color }} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/40 bg-white/60 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <i className="ph ph-fire text-orange-500" />
                      Restore Streak
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Gunakan restore untuk mengisi tanggal yang terlewat. Maks{" "}
                      {restoreLimit} kali per bulan.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sisa restore bulan ini:{" "}
                      <span className="font-semibold text-gray-700">
                        {restoreRemaining}
                      </span>
                      /{restoreLimit}.
                    </p>
                    {eligibilityError && (
                      <p className="text-xs text-red-500 mt-1">
                        {eligibilityError}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenForm({ mode: "restore", dateKey: selectedDateKey })
                    }
                    disabled={
                      eligibilityLoading ||
                      restoreRemaining <= 0 ||
                      !canRestoreSelectedDay
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      eligibilityLoading ||
                      restoreRemaining <= 0 ||
                      !canRestoreSelectedDay
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    Restore {selectedDateKey}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">{restoreHint}</p>
              </div>

              {/* --- NEW SECTION: 3-DAY FORECAST --- */}
              <div className="mt-auto pt-6 pb-2">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>
                <div className="flex items-center justify-between mb-3">
                   <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <i className="ph ph-crystal-ball text-purple-500 text-lg"></i>
                      3-Day Forecast
                   </h4>
                   <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Beta</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                    {forecastLoading && (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={`forecast-loading-${idx}`}
                          className="relative rounded-xl p-3 flex flex-col items-center text-center border border-white/40 bg-white/50 animate-pulse"
                        >
                          <div className="h-3 w-12 bg-gray-200 rounded mb-3" />
                          <div className="h-6 w-6 bg-gray-200 rounded-full mb-2" />
                          <div className="h-4 w-14 bg-gray-200 rounded mb-2" />
                          <div className="h-3 w-16 bg-gray-200 rounded-full" />
                        </div>
                      ))
                    )}
                    {!forecastLoading && forecastError && (
                      <div className="col-span-3 text-center text-xs font-semibold text-gray-500 bg-white/60 border border-gray-200 rounded-xl px-3 py-4 whitespace-pre-line">
                        {forecastError}
                      </div>
                    )}
                    {!forecastLoading && !forecastError && forecastList.length === 0 && (
                      <div className="col-span-3 text-center text-xs font-semibold text-gray-500 bg-white/60 border border-gray-200 rounded-xl px-3 py-4">
                        Forecast belum tersedia.
                      </div>
                    )}
                    {!forecastLoading && !forecastError && forecastList.length > 0 && (
                      forecastList.map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setForecastDetail(item)}
                          className={`
                            relative rounded-xl p-3 flex flex-col items-center text-center cursor-pointer 
                            transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-black/5 active:scale-95
                            ${item.bg}
                          `}
                        >
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.dateStr}</span>
                           <div className="text-2xl mb-1" style={{ color: item.color }}>
                              <i className={`ph ${item.icon}`}></i>
                           </div>
                           <div className="font-extrabold text-sm uppercase" style={{ color: item.color }}>{item.status}</div>
                           <div className="text-[10px] font-medium text-gray-500 mt-1 flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
                              <i className="ph ph-trend-up"></i> {item.probability}%
                           </div>
                        </div>
                      ))
                    )}
                </div>
              </div>
              {/* --- END FORECAST SECTION --- */}
            </div>

            {/* DETAIL CARD OVERLAY (Calendar Day Click) */}
            {dayDetail && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-sm p-4 animate-card-enter" onClick={() => setDayDetail(null)}>
                <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
                  <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none grayscale">{dayDetail.mood}</div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                        <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Daily Recap</h4>
                        <h2 className="text-2xl font-extrabold text-gray-800">{dayDetail.dateStr}</h2>
                        {dayDetail.isRestored && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 mt-2">
                            <i className="ph ph-clock-counter-clockwise" />
                            Restored
                          </span>
                        )}
                    </div>
                    <button onClick={() => setDayDetail(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition cursor-pointer">
                        <i className="ph ph-x text-lg text-gray-600"></i>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center border-[5px]" style={{ borderColor: dayDetail.color }}>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</div>
                        <div className="text-lg font-black uppercase leading-none" style={{ color: dayDetail.color }}>
                           {getStatusFromLevel(dayDetail.level) === 2 ? "High" : getStatusFromLevel(dayDetail.level) === 1 ? "Mod" : "Low"}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-600 italic">"{dayDetail.level > 60 ? "Take a break, you need it." : "Keep it up and maintain balance!"}"</p></div>
                  </div>
                  
                  <div className="space-y-3 custom-scroll" style={{ maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
                    {[
                      { l: "Sleep", v: dayDetail.sleep, max: 10, c: "bg-purple-500", i: "ph-moon-stars" },
                      { l: "Study", v: dayDetail.study, max: 12, c: "bg-blue-500", i: "ph-book-open" },
                      { l: "Extra", v: dayDetail.extra || 0, max: 8, c: "bg-pink-500", i: "ph-medal" },
                      { l: "Social", v: dayDetail.social, max: 8, c: "bg-orange-500", i: "ph-users" },
                      { l: "Exercise", v: dayDetail.physical || 0, max: 4, c: "bg-teal-500", i: "ph-sneaker" },
                    ].map((s, idx) => (
                       <div key={idx}>
                         <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                            <span className="flex items-center gap-1"><i className={`ph ${s.i} text-${s.c.split('-')[1]}-500`} /> {s.l}</span>
                            <span>{s.v} hrs</span>
                         </div>
                         <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${s.c} rounded-full`} style={{ width: `${Math.min((s.v / s.max) * 100, 100)}%` }} />
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* --- SLIDE-UP PANEL (OPTION 1 - WITH SVG ICON & SOLID GRADIENT FIX) --- */}
            {forecastDetail && (
              <div 
                // Disini kita gunakan forecastDetail.panelTheme untuk warna container (tanpa opacity class)
                // Hapus bg-opacity-95 agar solid, tambahkan shadow-2xl agar lebih kontras dengan background
                className={`
                  absolute inset-x-0 bottom-0 z-30 rounded-t-[24px] shadow-2xl border-t border-gray-100 overflow-hidden
                  ${isClosingPanel ? "animate-slide-down-panel" : "animate-slide-up-panel"}
                  ${forecastDetail.panelTheme}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Handle Bar for aesthetics */}
                  <div className="w-full flex justify-center pt-3 pb-1" onClick={handleCloseForecast}>
                     <div className="w-12 h-1.5 bg-gray-400/30 rounded-full cursor-pointer hover:bg-gray-400/50 transition-colors" />
                  </div>

                  <div className="p-6 pt-2">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{forecastDetail.fullDate}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/60 border ${forecastDetail.border}`} style={{ color: forecastDetail.color }}>
                                 {forecastDetail.status} Risk
                              </span>
                           </div>
                           <h3 className="text-xl font-bold text-gray-800">Stress Forecast Advice</h3>
                        </div>
                        {/* TOMBOL X DIGANTI DENGAN SVG */}
                        <button 
                           onClick={handleCloseForecast} 
                           className="w-8 h-8 rounded-full bg-white/40 text-gray-600 hover:bg-white/60 hover:text-gray-900 flex items-center justify-center transition-all cursor-pointer"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                           </svg>
                        </button>
                     </div>

                     <div className={`p-4 rounded-xl border ${forecastDetail.border} bg-white/40 flex items-start gap-3`}>
                        <i className={`ph ${forecastDetail.icon} text-2xl mt-0.5`} style={{ color: forecastDetail.color }}></i>
                        <div>
                           <p className="text-sm text-gray-800 font-medium leading-relaxed">
                              {forecastDetail.advice}
                           </p>
                           <div className="mt-2 flex items-center gap-1 text-xs font-bold opacity-70" style={{ color: forecastDetail.color }}>
                              <i className="ph ph-lightning"></i> Confidence: {forecastDetail.probability}%
                           </div>
                           {(forecastDetail.modelType || typeof forecastDetail.threshold === "number") && (
                             <div className="mt-1 text-[11px] font-semibold text-gray-500">
                               {forecastDetail.modelType && (
                                 <span>Model: {forecastDetail.modelType}</span>
                               )}
                               {forecastDetail.modelType && typeof forecastDetail.threshold === "number" && (
                                 <span className="mx-1">·</span>
                               )}
                               {typeof forecastDetail.threshold === "number" && (
                                 <span>Threshold: {forecastDetail.threshold}</span>
                               )}
                             </div>
                           )}
                        </div>
                     </div>
                     
                     <button onClick={handleCloseForecast} className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-transform active:scale-95 cursor-pointer">
                        Got it!
                     </button>
                  </div>
              </div>
            )}
          </section>
        </div>

        {/* MOTIVATION & TIPS SECTIONS */}
        <div className="mt-8 grid grid-cols-1">
          {/* ... (Section motivasi tetap sama) ... */}
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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {resourcesList.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTip(item)}
                className={`relative overflow-hidden rounded-[30px] p-6 h-64 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] backdrop-blur-xl border border-white/40 shadow-lg ${item.theme.bg}`}
              >
                <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-50 blur-2xl ${item.theme.accent}`} />
                <div className={`absolute -left-6 -bottom-6 w-24 h-24 rounded-full opacity-50 blur-xl ${item.theme.accent}`} />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-4xl filter drop-shadow-sm">{item.emoji}</span>
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
       
      {/* MODAL TIPS */}
      {activeTip && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveTip(null)} />
           
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-modal-slide">
             <div className={`h-32 w-full ${activeTip.theme.bg} relative flex items-center justify-center`}>
                <div className="text-6xl animate-bounce">{activeTip.emoji}</div>
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

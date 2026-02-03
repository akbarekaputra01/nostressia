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
import { getMotivations } from "../../services/motivationService";
import { getTipCategories, getTipsByCategory } from "../../services/tipsService";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import Toast from "../../components/Toast";
import PageMeta from "../../components/PageMeta";
import { clearAuthToken, readAuthToken } from "../../utils/auth";
import { createLogger } from "../../utils/logger";
import { resolveLegacyValue, storage, STORAGE_KEYS } from "../../utils/storage";

const logger = createLogger("DASHBOARD");

// --- COLOR CONFIGURATION ---
const brandBlue = "#0162F1";
const brandOrange = "#FFBF00";
const brandGreen = "#00A4FF";
const brandRed = "#FF6700";

const bgSun = "rgb(var(--bg-gradient-sun))";
const bgOrange = "rgb(var(--bg-gradient-orange))";
const bgSky = "rgb(var(--bg-gradient-sky))";
const colorGray = "rgb(var(--neutral-300))";

// TRANSLATED: Month Names
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const moods = ["😢", "😕", "😐", "😊", "😄"];
const PERSONALIZED_STREAK_THRESHOLD = 60;

const tipThemePalette = [
  {
    emoji: "🌙",
    theme: {
      bg: "bg-blue-50/40",
      text: "text-blue-900",
      subtext: "text-blue-700",
      accent: "bg-blue-200",
      btn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  },
  {
    emoji: "🍅",
    theme: {
      bg: "bg-orange-50/40",
      text: "text-orange-900",
      subtext: "text-orange-700",
      accent: "bg-orange-200",
      btn: "bg-orange-500 hover:bg-orange-600 text-white",
    },
  },
  {
    emoji: "🍃",
    theme: {
      bg: "bg-teal-50/40",
      text: "text-teal-900",
      subtext: "text-teal-700",
      accent: "bg-teal-200",
      btn: "bg-teal-600 hover:bg-teal-700 text-white",
    },
  },
  {
    emoji: "📚",
    theme: {
      bg: "bg-indigo-50/40",
      text: "text-indigo-900",
      subtext: "text-indigo-700",
      accent: "bg-indigo-200",
      btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
    },
  },
  {
    emoji: "🥗",
    theme: {
      bg: "bg-emerald-50/40",
      text: "text-emerald-900",
      subtext: "text-emerald-700",
      accent: "bg-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
  },
  {
    emoji: "🧘",
    theme: {
      bg: "bg-purple-50/40",
      text: "text-purple-900",
      subtext: "text-purple-700",
      accent: "bg-purple-200",
      btn: "bg-purple-600 hover:bg-purple-700 text-white",
    },
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
      color: colorGray,
      isToday: true,
      isEmpty: true,
    },
  };
}

function getMissingDateKeys(lastLogDate, todayDate) {
  if (!lastLogDate) return [];
  const startDate = new Date(
    lastLogDate.getFullYear(),
    lastLogDate.getMonth(),
    lastLogDate.getDate(),
  );
  const endDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const missing = [];
  startDate.setDate(startDate.getDate() + 1);
  while (startDate < endDate) {
    missing.push(formatDate(startDate));
    startDate.setDate(startDate.getDate() + 1);
  }
  return missing;
}

function formatDisplayDate(dateKey) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return dateKey;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function parseDateKey(dateKey) {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

// --- VARIATION ADVICES LIST ---
const highStressAdvices = [
  "High stress likely. Try the 4-7-8 breathing technique: Inhale for 4s, hold for 7s, exhale for 8s.",
  "Your energy might be drained. Prioritize sleep tonight and limit screen time before bed.",
  "Don't overwhelm yourself. Pick just 3 major tasks for today and focus only on them.",
  "High pressure detected. Take a 10-minute walk outside to reset your cortisol levels.",
  "It's okay to say no. Delegate tasks where possible and focus on your mental well-being.",
  "Avoid excessive caffeine today; it might heighten anxiety. Opt for herbal tea or water.",
];

const lowStressAdvices = [
  "Great energy ahead! Use this clarity to tackle your hardest subject or project.",
  "Low stress predicted. It's a perfect time to learn a new skill or hobby.",
  "You are in a good flow. Consider helping a friend or socializing to boost your mood further.",
  "Mental clarity is high. Plan your schedule for the upcoming busy week.",
  "Take advantage of this calm. Push your physical limits with a slightly more intense workout.",
  "Enjoy the balance. Treat yourself to a good book or a creative activity you love.",
];

const moderateStressAdvices = [
  "Balance looks steady. Keep your routine consistent and avoid overcommitting.",
  "Stress is manageable. Schedule a short break to keep your energy stable.",
  "You're in the middle zone—prioritize the tasks that matter most today.",
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
      bg: "bg-brand-accent/10 dark:bg-brand-accent/25",
      panelTheme:
        "bg-gradient-to-b from-brand-accent/15 via-surface-elevated/90 to-surface-elevated/80 dark:from-brand-accent/20 dark:via-surface dark:to-surface",
      border: "border-brand-accent/30 dark:border-brand-accent/40",
      icon: "ph-warning",
    };
  }
  if (status === "Moderate") {
    return {
      color: brandOrange,
      bg: "bg-brand-warning/15 dark:bg-brand-warning/25",
      panelTheme:
        "bg-gradient-to-b from-brand-warning/20 via-surface-elevated/90 to-surface-elevated/80 dark:from-brand-warning/25 dark:via-surface dark:to-surface",
      border: "border-brand-warning/30 dark:border-brand-warning/40",
      icon: "ph-activity",
    };
  }
  return {
    color: brandGreen,
    bg: "bg-brand-info/10 dark:bg-brand-info/25",
    panelTheme:
      "bg-gradient-to-b from-brand-info/15 via-surface-elevated/90 to-surface-elevated/80 dark:from-brand-info/25 dark:via-surface dark:to-surface",
    border: "border-brand-info/30 dark:border-brand-info/40",
    icon: "ph-plant",
  };
}

function buildForecastList(forecast) {
  if (!forecast) return [];

  const startDate = new Date(forecast.forecastDate);
  if (Number.isNaN(startDate.getTime())) return [];

  const threshold = Number(forecast.threshold);
  const baseChance = Number(forecast.chancePercent);
  const baseProbability = Math.max(0, Math.min(baseChance, 100)) / 100;
  let nestedProbability = baseProbability;
  return Array.from({ length: 3 }, (_, idx) => {
    if (idx > 0) nestedProbability *= baseProbability;
    const chancePercent = Math.round(nestedProbability * 1000) / 10;
    const status = resolveForecastStatus({
      predictionLabel: forecast.predictionLabel,
      predictionBinary: forecast.predictionBinary,
      chancePercent,
      threshold,
    });
    const adviceOptions =
      status === "High"
        ? highStressAdvices
        : status === "Moderate"
          ? moderateStressAdvices
          : lowStressAdvices;
    const adviceText = adviceOptions[Math.floor(Math.random() * adviceOptions.length)];
    const iterDate = new Date(startDate);
    iterDate.setDate(startDate.getDate() + idx);
    const theme = getForecastTheme(status);

    return {
      dateStr: iterDate.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      }),
      fullDate: iterDate.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      status,
      probability: chancePercent,
      advice: adviceText,
      modelType: forecast.modelType,
      threshold,
      ...theme,
    };
  });
}

function isSameEligibility(left, right) {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return (
    left.streak === right.streak &&
    left.requiredStreak === right.requiredStreak &&
    left.restoreUsed === right.restoreUsed &&
    left.restoreLimit === right.restoreLimit &&
    left.missing === right.missing &&
    left.note === right.note
  );
}

function resolveForecastMode(eligibility) {
  if (!eligibility) return "global";
  return eligibility.streak >= PERSONALIZED_STREAK_THRESHOLD ? "personalized" : "global";
}

function buildForecastEligibilityMessage({
  reason,
  streakCount,
  restoreUsed,
  restoreRemaining,
  requiredStreak = 7,
  restoreLimit = 3,
} = {}) {
  const safeStreak = Number.isFinite(Number(streakCount)) ? streakCount : "-";
  const safeUsed = Number.isFinite(Number(restoreUsed)) ? restoreUsed : "-";
  const safeRemaining = Number.isFinite(Number(restoreRemaining)) ? restoreRemaining : "-";

  return [
    "Forecast is not available because your data does not meet the minimum requirement yet.",
    reason ? `Reason: ${reason}` : null,
    `Collected data: ${safeStreak}/${requiredStreak}.`,
    `• Requires ${requiredStreak} logs (not necessarily consecutive).`,
    `• Restore can be used (max ${restoreLimit}/month).`,
    "• Minimum 4 original logs within the 7-day window.",
    `Restore used: ${safeUsed} • Remaining: ${safeRemaining}.`,
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

  // Primary data state
  const [stressData, setStressData] = useState(() => createEmptyTodayData(TODAY_KEY));
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [stressScore, setStressScore] = useState(0);
  const [todayLogId, setTodayLogId] = useState(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Success Modal & Detail
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: "",
    text: "",
  });
  const [toast, setToast] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [activeTip, setActiveTip] = useState(null);
  const [tipCards, setTipCards] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [tipsError, setTipsError] = useState("");

  // Forecast State
  const [forecastDetail, setForecastDetail] = useState(null);
  const [forecastList, setForecastList] = useState([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState("");
  const [forecastMode, setForecastMode] = useState("global");
  // Dedicated state for the panel close animation.
  const [isClosingPanel, setIsClosingPanel] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilityError, setEligibilityError] = useState("");
  const [missingDateKeys, setMissingDateKeys] = useState([]);
  const [missingRestorePopup, setMissingRestorePopup] = useState(null);
  const [dismissedMissingPopup, setDismissedMissingPopup] = useState(false);
  const [pendingTodayReminder, setPendingTodayReminder] = useState(false);
  const [showTodayReminder, setShowTodayReminder] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // --- FORM STATE ---
  const [gpa, setGpa] = useState(() => {
    const saved = resolveLegacyValue({
      key: STORAGE_KEYS.USER_GPA,
      legacyKeys: ["user_gpa"],
    });
    return saved ? Number(saved) : "";
  });
  const [latestKnownGpa, setLatestKnownGpa] = useState(null);
  const [isEditingGpa, setIsEditingGpa] = useState(false);

  const [studyHours, setStudyHours] = useState("");
  const [extraHours, setExtraHours] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [socialHours, setSocialHours] = useState("");
  const [physicalHours, setPhysicalHours] = useState("");
  const [moodIndex, setMoodIndex] = useState(2);

  // Quote State
  const [quotePool, setQuotePool] = useState([]);
  const [quoteData, setQuoteData] = useState({ text: "", author: "" });
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState("");
  const [isQuoteAnimating, setIsQuoteAnimating] = useState(false);

  // Calendar State
  const [calendarDate, setCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeLogDate, setActiveLogDate] = useState(TODAY_KEY);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [restoreInputMode, setRestoreInputMode] = useState("manual");
  const [restoreImputeInfo, setRestoreImputeInfo] = useState("");

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
    selectedDate.getDate(),
  );
  const isSelectedPast = selectedCalendarDate < todayDate;
  const normalizedEligibility = eligibilityData;
  const restoreUsed = normalizedEligibility?.restoreUsed ?? 0;
  const restoreLimit = normalizedEligibility?.restoreLimit ?? 3;
  const restoreRemaining = normalizedEligibility?.restoreRemaining ?? 0;
  const canRestoreSelectedDay = isSelectedPast && !selectedDayHasData;
  const restoreHint = (() => {
    if (eligibilityLoading) return "Loading restore eligibility...";
    if (eligibilityError) return "Failed to load restore eligibility.";
    if (restoreRemaining <= 0) return "Your restore limit for this month is used up.";
    if (!isSelectedPast) return "Select a date before today to restore.";
    if (selectedDayHasData) return "This date already has data.";
    return "No data found for this date. You can restore it.";
  })();
  const forecastModeLabel = forecastMode === "personalized" ? "Personalized" : "Global";
  const forecastModeDescription =
    forecastMode === "personalized"
      ? "Personalized forecast is trained from your own stress history (60+ logs)."
      : "Global forecast uses aggregate patterns from all users' stress data.";

  useEffect(() => {
    if (missingDateKeys.length === 0) {
      setMissingRestorePopup(null);
      setDismissedMissingPopup(false);
      return;
    }

    const missingCount = missingDateKeys.length;
    const shouldPromptRestore =
      !dismissedMissingPopup &&
      missingCount > 0 &&
      missingCount <= restoreRemaining &&
      missingCount <= 3;

    if (shouldPromptRestore) {
      setMissingRestorePopup({ dates: missingDateKeys, count: missingCount });
    } else {
      setMissingRestorePopup(null);
    }
  }, [dismissedMissingPopup, missingDateKeys, restoreRemaining]);

  useEffect(() => {
    if (!missingRestorePopup && !forecastDetail && pendingTodayReminder) {
      setShowTodayReminder(true);
      setPendingTodayReminder(false);
    }
    if (forecastDetail) {
      setShowTodayReminder(false);
    }
  }, [missingRestorePopup, pendingTodayReminder, forecastDetail]);

  useEffect(() => {
    let mounted = true;
    const fetchQuotes = async () => {
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const data = await getMotivations();
        if (!mounted) return;

        const normalized = (Array.isArray(data) ? data : [])
          .map((item) => ({
            text: item?.quote ?? "",
            author: item?.authorName ?? "Anonymous",
          }))
          .filter((item) => item.text);

        setQuotePool(normalized);
        if (normalized.length > 0) {
          setQuoteData(normalized[0]);
        } else {
          setQuoteData({ text: "", author: "" });
        }
      } catch (error) {
        if (!mounted) return;
        setQuoteError(error?.message || "Failed to load daily wisdom.");
      } finally {
        if (mounted) setQuoteLoading(false);
      }
    };

    fetchQuotes();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchTips = async () => {
      setTipsLoading(true);
      setTipsError("");
      try {
        const categories = await getTipCategories();
        const normalizedCategories = Array.isArray(categories) ? categories : [];

        const entries = await Promise.all(
          normalizedCategories.map(async (category, index) => {
            const categoryId = category?.tipCategoryId;
            if (!categoryId) return null;
            const categoryName = category?.categoryName ?? "Tips";

            let tips = [];
            try {
              tips = await getTipsByCategory(categoryId);
            } catch (error) {
              logger.warn("Failed to load tips for category", categoryId, error);
              tips = [];
            }

            const primaryTip = (Array.isArray(tips) ? tips : [])[0];
            if (!primaryTip) return null;

            const detail = primaryTip?.detail ?? "";
            const words = detail.split(" ").filter(Boolean);
            const title =
              words.length > 0
                ? `${words.slice(0, 6).join(" ")}${words.length > 6 ? "..." : ""}`
                : categoryName;
            const desc = detail.length > 80 ? `${detail.slice(0, 77)}...` : detail;
            const palette = tipThemePalette[index % tipThemePalette.length];

            return {
              id: primaryTip?.tipId ?? `${categoryId}-${index}`,
              category: categoryName,
              emoji: palette?.emoji ?? "💡",
              title,
              desc: desc || "Tips available",
              fullDetail: detail || "Tips available",
              theme: palette?.theme ?? tipThemePalette[0].theme,
            };
          }),
        );

        if (!mounted) return;
        const normalizedTips = entries.filter(Boolean).slice(0, 3);
        setTipCards(normalizedTips);
      } catch (error) {
        if (!mounted) return;
        setTipsError(error?.message || "Failed to load tips.");
      } finally {
        if (mounted) setTipsLoading(false);
      }
    };

    fetchTips();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Background gradient logic ---
  let gradientBg = "radial-gradient(circle at 50% 30%, rgba(156, 163, 175, 0.15), transparent 70%)";
  if (hasSubmittedToday) {
    if (stressScore > 60)
      gradientBg = `radial-gradient(circle at 50% 30%, ${brandRed}30, transparent 70%)`;
    else if (stressScore > 30)
      gradientBg = `radial-gradient(circle at 50% 30%, ${brandOrange}30, transparent 70%)`;
    else gradientBg = `radial-gradient(circle at 50% 30%, ${brandGreen}30, transparent 70%)`;
  }

  // --- Compute trend dots ---
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
      isToday: i === 0,
    });
  }

  function handleNewQuote() {
    if (quotePool.length === 0) return;
    setIsQuoteAnimating(true);
    setTimeout(() => {
      let newQuote;
      do {
        newQuote = quotePool[Math.floor(Math.random() * quotePool.length)];
      } while (quotePool.length > 1 && newQuote.text === quoteData.text);
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

  function formatImputedValue(value, step = 0.5) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round(value / step) * step;
    return String(rounded).replace(/\.0$/, "");
  }

  function getImputedInputs(dateKey) {
    const targetDate = parseDateKey(dateKey);
    if (!targetDate) return null;

    const entries = Object.entries(stressData)
      .map(([key, value]) => ({
        key,
        value,
        date: parseDateKey(key),
      }))
      .filter(
        (entry) => entry.date && entry.key !== dateKey && entry.value && !entry.value.isEmpty,
      );

    if (entries.length === 0) return null;

    const pastEntries = entries
      .filter((entry) => entry.date < targetDate)
      .sort((a, b) => b.date - a.date);
    const futureEntries = entries
      .filter((entry) => entry.date > targetDate)
      .sort((a, b) => a.date - b.date);
    const samples = [...pastEntries, ...futureEntries].slice(0, 7);
    const sampleList = samples.length > 0 ? samples : entries;

    const average = (selector) => {
      const values = sampleList
        .map((entry) => Number(selector(entry.value)))
        .filter((val) => Number.isFinite(val));
      if (values.length === 0) return 0;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    const moodCounts = sampleList.reduce((acc, entry) => {
      const mood = entry.value?.mood;
      if (!mood) return acc;
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
    const mostFrequentMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      studyHours: average((value) => value.study),
      extracurricularHours: average((value) => value.extra),
      sleepHours: average((value) => value.sleep),
      socialHours: average((value) => value.social),
      physicalHours: average((value) => value.physical),
      mood: mostFrequentMood || "😐",
    };
  }

  function applyRestoreInputMode(mode, dateKey) {
    setRestoreInputMode(mode);

    if (mode === "auto") {
      const imputed = getImputedInputs(dateKey);
      if (!imputed) {
        resetFormToEmpty();
        setRestoreImputeInfo("No previous data found. Please fill it manually first.");
        return;
      }
      setStudyHours(formatImputedValue(imputed.studyHours));
      setExtraHours(formatImputedValue(imputed.extracurricularHours));
      setSleepHours(formatImputedValue(imputed.sleepHours));
      setSocialHours(formatImputedValue(imputed.socialHours));
      setPhysicalHours(formatImputedValue(imputed.physicalHours));
      const moodIdx = moods.indexOf(imputed.mood);
      setMoodIndex(moodIdx >= 0 ? moodIdx : 2);
      setRestoreImputeInfo(
        "Values are auto-filled based on nearby averages. You can still edit them.",
      );
      return;
    }

    resetFormToEmpty();
    setRestoreImputeInfo("");
  }

  // --- Close the forecast panel with an animation ---
  function handleCloseForecast() {
    setIsClosingPanel(true); // Start the slide-down animation.
    setTimeout(() => {
      setForecastDetail(null); // Clear data after the animation finishes.
      setIsClosingPanel(false); // Reset the animation state.
    }, 380); // Slightly shorter than the CSS duration (0.4s) for smoothness.
  }

  const refreshEligibility = useCallback(
    async ({ signal } = {}) => {
      setEligibilityLoading(true);
      setEligibilityError("");
      try {
        const token = readAuthToken();

        if (!token) {
          setEligibilityData(null);
          return;
        }

        const data = await getStressEligibility();
        setEligibilityData(data);
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          clearAuthToken();
          navigate("/login", { replace: true });
          return;
        }
        const detail = error?.payload?.detail || error?.message;
        setEligibilityError(`Failed to load eligibility.${detail ? ` ${detail}` : ""}`);
      } finally {
        setEligibilityLoading(false);
      }
    },
    [navigate],
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
        const token = readAuthToken();

        if (!token) {
          setStressData(createEmptyTodayData(TODAY_KEY));
          setHasSubmittedToday(false);
          setStressScore(0);
          setTodayLogId(null);
          storage.removeItem(STORAGE_KEYS.TODAY_LOG);
          setMissingDateKeys([]);
          setMissingRestorePopup(null);
          setDismissedMissingPopup(false);
          setPendingTodayReminder(false);
          setShowTodayReminder(false);
          setIsLoadingLogs(false);
          return;
        }
        const logs = await getMyStressLogs();
        const logList = Array.isArray(logs) ? logs : [];

        const latestGpaEntry = logList
          .map((log) => {
            const dt = log?.date ? new Date(log.date) : null;
            const createdAt = log?.createdAt ? new Date(log.createdAt) : null;
            const gpaValue = Number(log?.gpa);
            if (!Number.isFinite(gpaValue) || !dt || Number.isNaN(dt.getTime())) {
              return null;
            }
            return {
              gpa: gpaValue,
              date: dt.getTime(),
              createdAt: createdAt ? createdAt.getTime() : 0,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            if (a.date === b.date) {
              return b.createdAt - a.createdAt;
            }
            return b.date - a.date;
          })[0];

        const latestGpa = latestGpaEntry?.gpa ?? null;
        setLatestKnownGpa(latestGpa);
        if (latestGpa !== null) {
          setGpa((prev) => {
            if (prev === "" || prev === null || Number.isNaN(Number(prev))) {
              storage.setItem(STORAGE_KEYS.USER_GPA, String(latestGpa));
              storage.removeItem("user_gpa");
              return latestGpa;
            }
            return prev;
          });
        }

        const byDate = new Map();
        let latestLogDate = null;
        logList.forEach((log) => {
          const dt = log?.date ? new Date(log.date) : null;
          if (!dt || Number.isNaN(dt.getTime())) return;
          const dateKey = formatDate(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
          if (!latestLogDate || dt > latestLogDate) {
            latestLogDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          }
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
            isRestored: log?.isRestored ?? false,
            logId: log?.stressLevelId ?? null,
          };
        });

        if (!updatedData[TODAY_KEY]) {
          Object.assign(updatedData, createEmptyTodayData(TODAY_KEY));
        }

        setStressData(updatedData);
        setMissingDateKeys(getMissingDateKeys(latestLogDate, todayDate));
        setDismissedMissingPopup(false);

        const todayData = updatedData[TODAY_KEY];
        if (todayData && !todayData.isEmpty) {
          setHasSubmittedToday(true);
          setStressScore(todayData.level);
          setTodayLogId(todayData.logId ?? null);
          const moodIdx = moods.indexOf(todayData.mood);
          setMoodIndex(moodIdx >= 0 ? moodIdx : 2);
          setPendingTodayReminder(false);
          setShowTodayReminder(false);
          storage.setItem(STORAGE_KEYS.TODAY_LOG, TODAY_KEY);
        } else {
          setHasSubmittedToday(false);
          setStressScore(0);
          setTodayLogId(null);
          setPendingTodayReminder(true);
          storage.removeItem(STORAGE_KEYS.TODAY_LOG);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        logger.error("Failed to fetch stress logs:", error);
        setStressData(createEmptyTodayData(TODAY_KEY));
        setHasSubmittedToday(false);
        setStressScore(0);
        setTodayLogId(null);
        storage.removeItem(STORAGE_KEYS.TODAY_LOG);
        setMissingDateKeys([]);
        setMissingRestorePopup(null);
        setDismissedMissingPopup(false);
        setPendingTodayReminder(false);
        setShowTodayReminder(false);
        setLoadError("Failed to load dashboard data. Please try again.");
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
        const token = readAuthToken();

        if (!token) {
          setForecastList([]);
          setForecastError("Log in to view the forecast.");
          setForecastMode("global");
          return;
        }

        let eligibilitySnapshot = normalizedEligibility;
        if (!eligibilitySnapshot) {
          const eligibilityRaw = await getStressEligibility();
          setEligibilityData(eligibilityRaw);
          eligibilitySnapshot = eligibilityRaw;
        }

        const requiredStreak = eligibilitySnapshot?.requiredStreak ?? 7;
        const restoreLimit = eligibilitySnapshot?.restoreLimit ?? 3;
        const restoreRemainingCalc = eligibilitySnapshot?.restoreRemaining ?? 0;

        if (!eligibilitySnapshot || !eligibilitySnapshot.eligible) {
          setForecastMode(resolveForecastMode(eligibilitySnapshot));
          setForecastList([]);
          setForecastError(
            buildForecastEligibilityMessage({
              reason: eligibilitySnapshot?.note,
              streakCount: eligibilitySnapshot?.streak ?? user?.streak,
              restoreUsed: eligibilitySnapshot?.restoreUsed,
              restoreRemaining: restoreRemainingCalc,
              requiredStreak,
              restoreLimit,
            }),
          );
          return;
        }

        const data = await getGlobalForecast();

        const eligibilityFromForecast = data.eligibility;
        if (!isSameEligibility(eligibilityFromForecast, eligibilitySnapshot)) {
          setEligibilityData(eligibilityFromForecast);
        }
        setForecastMode(resolveForecastMode(eligibilityFromForecast));

        const resolvedMode = resolveForecastMode(eligibilityFromForecast);
        const list = buildForecastList(data.forecast).map((item) => ({
          ...item,
          forecastMode: resolvedMode,
        }));
        setForecastList(list);
        if (list.length === 0) {
          setForecastError("Forecast not available yet.");
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          clearAuthToken();
          navigate("/login", { replace: true });
          return;
        }
        const errorEligibility = error?.payload?.errors?.[0]?.eligibility;
        if (errorEligibility) {
          setForecastMode(resolveForecastMode(errorEligibility));
          const restoreRemainingCalc = errorEligibility.restoreRemaining ?? 0;
          setForecastError(
            buildForecastEligibilityMessage({
              reason: errorEligibility.note,
              streakCount: errorEligibility.streak ?? user?.streak,
              restoreUsed: errorEligibility.restoreUsed,
              restoreRemaining: restoreRemainingCalc,
              requiredStreak: errorEligibility.requiredStreak,
              restoreLimit: errorEligibility.restoreLimit,
            }),
          );
          return;
        }
        if (error?.status === 400) {
          setForecastError("Not enough history to generate a forecast.");
          return;
        }
        const detail = error?.payload?.message || error?.message;
        setForecastError(`Failed to load forecast.${detail ? ` ${detail}` : ""}`);
      } finally {
        setForecastLoading(false);
      }
    };

    fetchForecast();
    return () => controller.abort();
  }, [navigate, normalizedEligibility]);

  function handleOpenForm({ mode = "today", dateKey = TODAY_KEY, restoreMode = "manual" } = {}) {
    if (mode === "restore") {
      setIsRestoreMode(true);
      setActiveLogDate(dateKey);
      applyRestoreInputMode(restoreMode, dateKey);
      setIsFlipped(true);
      return;
    }

    const todayData = stressData[TODAY_KEY];
    setIsRestoreMode(false);
    setRestoreInputMode("manual");
    setRestoreImputeInfo("");
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

  function handleStartRestoreForMissing(mode = "manual") {
    const missingDates = missingRestorePopup?.dates || [];
    if (missingDates.length === 0) return;
    const [year, month, day] = missingDates[0].split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    setSelectedDate(targetDate);
    setCalendarDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));
    handleOpenForm({
      mode: "restore",
      dateKey: missingDates[0],
      restoreMode: mode,
    });
    setMissingRestorePopup(null);
    setDismissedMissingPopup(true);
  }

  function handleCloseMissingPopup() {
    setMissingRestorePopup(null);
    setDismissedMissingPopup(true);
  }

  function handleTodayReminderAction() {
    setShowTodayReminder(false);
    handleOpenForm({ mode: "today" });
  }

  const focusFirstEmptyField = (form) => {
    const requiredFields = Array.from(form.querySelectorAll("[data-required='true']"));
    const emptyField = requiredFields.find((field) => !field.value);
    if (emptyField) {
      emptyField.focus();
      return true;
    }
    return false;
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter") return;
    if (event.target?.tagName === "TEXTAREA") return;
    if (focusFirstEmptyField(event.currentTarget)) {
      event.preventDefault();
    }
  };

  // GPA persistence logic (local only)
  function handleGpaSave(val) {
    if (val === "") return showToast("GPA cannot be empty.", "warning");
    const num = parseFloat(val);
    if (Number.isNaN(num) || num < 0 || num > 4) {
      return showToast("GPA must be between 0 and 4.", "warning");
    }

    setGpa(num);
    storage.setItem(STORAGE_KEYS.USER_GPA, num); // Persist to browser storage.
    storage.removeItem("user_gpa");
    setIsEditingGpa(false);
  }

  const resolveGpaForSubmit = () => {
    if (gpa !== "" && gpa !== null && Number.isFinite(Number(gpa))) {
      return Number(gpa);
    }
    if (Number.isFinite(Number(latestKnownGpa))) {
      return Number(latestKnownGpa);
    }
    return null;
  };

  async function saveStressLog(status, { dateKey, isRestore, gpaValue } = {}) {
    const token = readAuthToken();

    if (!token) return null;

    const resolvedGpaValue = Number.isFinite(Number(gpaValue)) ? Number(gpaValue) : Number(gpa);
    const logPayload = {
      date: dateKey,
      stressLevel: status,
      gpa: resolvedGpaValue,
      extracurricularHourPerDay: Number(extraHours),
      physicalActivityHourPerDay: Number(physicalHours),
      sleepHourPerDay: Number(sleepHours),
      studyHourPerDay: Number(studyHours),
      socialHourPerDay: Number(socialHours),
      emoji: moodIndex,
    };
    try {
      const logData = await (isRestore ? restoreStressLog : addStressLog)(logPayload);
      return logData?.stressLevelId ?? null;
    } catch (error) {
      if (error?.status === 409) {
        showToast("Data already exists for this date. Updates are not available yet.", "info");
        return null;
      }
      if (error?.status === 403 && isRestore) {
        showToast("Your monthly restore limit has been reached.", "warning");
        return null;
      }
      logger.error("Failed to save stress log:", error);
      return null;
    }
  }

  async function handleSaveForm(e) {
    e.preventDefault();

    if (isSaving) return;

    // Validation: GPA must be provided before submit.
    const resolvedGpa = resolveGpaForSubmit();
    if (resolvedGpa === null) {
      setIsEditingGpa(true);
      return showToast("Please set your GPA before submitting the data.", "warning");
    }
    if (gpa === "" || gpa === null) {
      setGpa(resolvedGpa);
      storage.setItem(STORAGE_KEYS.USER_GPA, resolvedGpa);
      storage.removeItem("user_gpa");
    }

    if (sleepHours === "" || sleepHours < 0 || sleepHours > 24) {
      return showToast("Please enter valid sleep hours (0-24).", "warning");
    }

    try {
      setIsSaving(true);
      const targetDateKey = activeLogDate || TODAY_KEY;
      const isTargetToday = targetDateKey === TODAY_KEY;
      const payload = {
        studyHours: Number(studyHours),
        extracurricularHours: Number(extraHours),
        sleepHours: Number(sleepHours),
        socialHours: Number(socialHours),
        physicalHours: Number(physicalHours),
        gpa: resolvedGpa,
      };

      const apiData = await predictCurrentStress(payload);

      const { score, color, status } = mapPredictionToUI(apiData.result);

      const savedLogId = await saveStressLog(status, {
        dateKey: targetDateKey,
        isRestore: isRestoreMode,
        gpaValue: resolvedGpa,
      });
      if (!savedLogId) return;
      setSuccessModal({
        visible: true,
        title: isRestoreMode
          ? "Restore Complete!"
          : hasSubmittedToday
            ? "Data Updated!"
            : "Analysis Complete!",
        text: apiData.message,
      });

      if (isTargetToday) {
        setStressScore(score);
        setHasSubmittedToday(true);
        storage.setItem(STORAGE_KEYS.TODAY_LOG, TODAY_KEY);
      }
      const resolvedLogId = savedLogId ?? todayLogId ?? null;
      if (savedLogId && isTargetToday) setTodayLogId(savedLogId);

      setStressData((prev) => ({
        ...prev,
        [targetDateKey]: {
          level: score,
          label: apiData.result,
          sleep: Number(sleepHours),
          study: Number(studyHours),
          extra: Number(extraHours),
          social: Number(socialHours),
          physical: Number(physicalHours),
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
        setRestoreInputMode("manual");
        setRestoreImputeInfo("");
      }, 2500);

      if (savedLogId) {
        refreshEligibility();
        window.dispatchEvent(new Event("nostressia:user-update"));
      }
    } catch (error) {
      logger.error("Failed to connect:", error);
      showToast("Failed to reach the server.", "error");
    } finally {
      setIsSaving(false);
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
        backgroundColor: bgSun,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgSun} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgOrange} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgSky} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
      className="relative"
    >
      <PageMeta
        title="Dashboard"
        description="Track daily stress, mood predictions, and personal stats on the Nostressia dashboard."
      />
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
      `}</style>

      {/* NAVBAR */}
      <Navbar activeLink="Dashboard" onPredictClick={handleOpenForm} user={user} />

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 pt-28">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary flex items-center gap-2">
            Hello, <span style={{ color: brandBlue }}>{username}!</span> 👋
          </h1>
          <p className="text-text-secondary mt-2 text-lg font-medium">
            Ready to navigate the day with more calm?
          </p>
        </div>
        {!isLoadingLogs && loadError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* FLIP CARD SECTION */}
          <section
            className="col-span-1 md:col-span-2 relative overflow-visible"
            style={{ minHeight: 600 }}
          >
            {isLoadingLogs && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[20px] bg-surface-elevated/70 glass-panel backdrop-blur-sm">
                <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
              </div>
            )}
            <div
              style={{ perspective: 1500 }}
              className={`w-full h-full ${isLoadingLogs ? "opacity-0 pointer-events-none" : ""}`}
            >
              <div
                className={`absolute inset-0 transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? "rotate-y-180" : ""}`}
              >
                {/* FRONT CARD (PREDICTION) */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 backface-hidden flex flex-col border border-white/20 overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                  style={{
                    backgroundColor: "rgb(var(--glass-bg) / 0.7)",
                    zIndex: isFlipped ? 0 : 10,
                    pointerEvents: isFlipped ? "none" : "auto",
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[20px] transition-all duration-1000 ease-in-out"
                    style={{ background: gradientBg, zIndex: -1, opacity: 0.8 }}
                  />

                  {hasSubmittedToday && (
                    <div
                      className="absolute -top-18 -right-18 text-[11rem] opacity-[0.08] pointer-events-none select-none grayscale filter"
                      style={{ zIndex: 0 }}
                    >
                      {moods[moodIndex]}
                    </div>
                  )}

                  <header className="flex justify-between items-center mb-4 relative z-10">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                      Today's Stress Prediction
                    </h2>
                    <div className="text-2xl text-text-muted">
                      <i className="ph ph-cloud-sun mr-2" /> <i className="ph ph-smiley" />
                    </div>
                  </header>
                  <div className="grow flex flex-col items-center justify-center text-center relative z-10">
                    {(() => {
                      let ui = {
                        label: "NO DATA",
                        sub: "Let's check your status",
                        color: "rgb(var(--neutral-400))",
                        icon: "ph-question",
                        anim: "",
                      };
                      if (hasSubmittedToday) {
                        if (stressScore > 60)
                          ui = {
                            label: "HIGH LEVEL",
                            sub: "Please take a break!",
                            color: brandRed,
                            icon: "ph-warning-octagon",
                            anim: "anim-heartbeat",
                          };
                        else if (stressScore > 30)
                          ui = {
                            label: "MODERATE",
                            sub: "Keep it balanced.",
                            color: brandOrange,
                            icon: "ph-scales",
                            anim: "anim-glow",
                          };
                        else
                          ui = {
                            label: "LOW STRESS",
                            sub: "You are doing great!",
                            color: brandGreen,
                            icon: "ph-plant",
                            anim: "anim-float",
                          };
                      }
                      return (
                        <div className="flex flex-col items-center gap-4">
                          <div
                            className={`text-[8rem] leading-none ${ui.anim} drop-shadow-lg`}
                            style={{
                              color: ui.color,
                              transition: "color 0.5s",
                            }}
                          >
                            <i className={`ph ${ui.icon}`}></i>
                          </div>
                          <div>
                            <h2
                              className="text-4xl font-black tracking-wider uppercase mb-1"
                              style={{ color: ui.color }}
                            >
                              {ui.label}
                            </h2>
                            <p className="text-lg font-semibold text-text-secondary">{ui.sub}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <hr className="border-t border-white/30 my-6 relative z-10" />

                  {/* TREND DOTS */}
                  <h4 className="text-base font-bold text-text-primary mb-3 relative z-10">
                    Last 7 Days Trend
                  </h4>
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
                              boxShadow:
                                isToday && d.status !== null ? `0 0 6px ${dotColor}` : "none",
                            }}
                          />
                          <span className="text-xs font-bold text-text-muted opacity-80">
                            {d.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <hr className="border-t border-white/30 my-6 relative z-10" />
                  <button
                    className="w-full py-3 rounded-xl font-bold text-white shadow-md pressable transition-colors duration-300 relative z-10 cursor-pointer"
                    onClick={handleOpenForm}
                    style={{
                      backgroundColor: hasSubmittedToday ? brandOrange : brandBlue,
                    }}
                  >
                    {hasSubmittedToday ? (
                      <>
                        <i className="ph ph-pencil-simple mr-2" /> Edit Prediction Data
                      </>
                    ) : (
                      <>
                        <i className="ph ph-note-pencil mr-2" /> Fill Stress Prediction Data
                      </>
                    )}
                  </button>
                </div>

                {/* BACK CARD (FORM) */}
                <div
                  className="absolute inset-0 rounded-[20px] p-6 md:p-8 rotate-y-180 backface-hidden flex flex-col border border-white/20 overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                  style={{
                    backgroundColor: "rgb(var(--glass-bg) / 0.7)",
                    zIndex: isFlipped ? 10 : 0,
                    pointerEvents: isFlipped ? "auto" : "none",
                  }}
                >
                  <header
                    className="flex justify-between items-center mb-4 transition-opacity duration-300"
                    style={{ opacity: successModal.visible ? 0 : 1 }}
                  >
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">
                        {isRestoreMode
                          ? "Restore Data"
                          : hasSubmittedToday
                            ? "Edit Today's Data"
                            : "Log Today's Data"}
                      </h3>
                      {isRestoreMode && (
                        <p className="text-xs font-semibold text-text-muted mt-1">
                          Target: {activeLogDate}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-muted/60 transition-colors cursor-pointer"
                      onClick={() => {
                        setIsFlipped(false);
                        setIsRestoreMode(false);
                        setActiveLogDate(TODAY_KEY);
                        setRestoreInputMode("manual");
                        setRestoreImputeInfo("");
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </header>
                  <form
                    onSubmit={handleSaveForm}
                    onKeyDown={handleFormKeyDown}
                    className="flex h-full min-h-0 flex-col gap-3 transition-all duration-500"
                    style={{
                      opacity: successModal.visible ? 0 : 1,
                      transform: successModal.visible ? "scale(0.95)" : "scale(1)",
                      pointerEvents: successModal.visible || isSaving ? "none" : "auto",
                    }}
                  >
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2 custom-scroll pb-10">
                      {isRestoreMode && (
                        <div className="rounded-xl border border-white/40 bg-surface-elevated/60 p-3 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Restore input mode
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => applyRestoreInputMode("manual", activeLogDate)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                restoreInputMode === "manual"
                                  ? "bg-blue-600 text-white shadow-md"
                                  : "bg-surface-elevated/70 glass-panel text-text-secondary hover:bg-surface-elevated"
                              }`}
                            >
                              Manual entry
                            </button>
                            <button
                              type="button"
                              onClick={() => applyRestoreInputMode("auto", activeLogDate)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                restoreInputMode === "auto"
                                  ? "bg-emerald-600 text-white shadow-md"
                                  : "bg-surface-elevated/70 glass-panel text-text-secondary hover:bg-surface-elevated"
                              }`}
                            >
                              Auto fill (imputed)
                            </button>
                          </div>
                          {restoreImputeInfo && (
                            <p className="mt-2 text-[11px] font-medium text-text-muted">
                              {restoreImputeInfo}
                            </p>
                          )}
                        </div>
                      )}
                      {/* GPA SECTION (UPDATED LOGIC) */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          GPA <span className="text-red-500">*</span>
                        </label>
                        {!isEditingGpa ? (
                          <div className="flex items-center gap-3">
                            {/* Render when GPA is missing versus available */}
                            {gpa !== "" ? (
                              <span className="text-2xl font-bold" style={{ color: brandOrange }}>
                                {Number(gpa).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-lg font-bold text-text-muted italic border-b-2 border-dashed border-border">
                                Set GPA
                              </span>
                            )}

                            <button
                              type="button"
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${gpa === "" ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-100 text-blue-600 hover:bg-blue-200"}`}
                              onClick={() => setIsEditingGpa(true)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              defaultValue={gpa === "" ? "" : gpa}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              max="4"
                              className="w-24 p-2 border border-border rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                              id="gpaInput"
                              style={{ color: "rgb(var(--text-primary))" }}
                              autoFocus
                              data-required="true"
                            />
                            <button
                              type="button"
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-100 text-green-600 hover:bg-green-200 transition-colors cursor-pointer"
                              onClick={() =>
                                handleGpaSave(document.getElementById("gpaInput").value)
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                              onClick={() => setIsEditingGpa(false)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2.5"
                                stroke="currentColor"
                                className="w-5 h-5"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-sm font-semibold text-text-primary mb-1 block">
                            Study Hours{" "}
                            <span className="text-text-muted text-xs font-normal">(Hrs)</span>
                          </label>
                          <input
                            type="number"
                            value={studyHours}
                            onChange={(e) => setStudyHours(e.target.value)}
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0"
                            className="w-full p-2.5 border border-white/50 bg-surface-elevated/80 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-400 placeholder:text-text-muted"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-text-primary mb-1 block">
                            Extracurricular{" "}
                            <span className="text-text-muted text-xs font-normal">(Hrs)</span>
                          </label>
                          <input
                            type="number"
                            value={extraHours}
                            onChange={(e) => setExtraHours(e.target.value)}
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0"
                            className="w-full p-2.5 border border-white/50 bg-surface-elevated/80 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-400 placeholder:text-text-muted"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-text-primary mb-1 block">
                            Sleep Hours{" "}
                            <span className="text-text-muted text-xs font-normal">(Hrs)</span>
                          </label>
                          <input
                            type="number"
                            value={sleepHours}
                            onChange={(e) => setSleepHours(e.target.value)}
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0"
                            className="w-full p-2.5 border border-white/50 bg-surface-elevated/80 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-400 placeholder:text-text-muted"
                            data-required="true"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-text-primary mb-1 block">
                            Social Hours{" "}
                            <span className="text-text-muted text-xs font-normal">(Hrs)</span>
                          </label>
                          <input
                            type="number"
                            value={socialHours}
                            onChange={(e) => setSocialHours(e.target.value)}
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0"
                            className="w-full p-2.5 border border-white/50 bg-surface-elevated/80 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-400 placeholder:text-text-muted"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-text-primary mb-1 block">
                            Physical Activity{" "}
                            <span className="text-text-muted text-xs font-normal">
                              (Exercise Hrs)
                            </span>
                          </label>
                          <input
                            type="number"
                            value={physicalHours}
                            onChange={(e) => setPhysicalHours(e.target.value)}
                            min="0"
                            max="24"
                            step="0.5"
                            placeholder="0"
                            className="w-full p-2.5 border border-white/50 bg-surface-elevated/80 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-400 placeholder:text-text-muted"
                          />
                        </div>
                      </div>

                      <hr className="border-t border-white/20 my-1" />
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-3 text-center">
                          How are you feeling today?
                        </label>
                        <div className="flex justify-around">
                          {moods.map((emo, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-2xl md:text-3xl transition-transform cursor-pointer ${moodIndex === idx ? "scale-110 shadow-lg" : "hover:scale-105"}`}
                              onClick={() => setMoodIndex(idx)}
                              style={{
                                backgroundColor:
                                  moodIndex === idx
                                    ? "rgba(255,255,255,0.9)"
                                    : "rgba(255,255,255,0.45)",
                              }}
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:brightness-110 mt-2 cursor-pointer ${
                        isSaving ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      style={{
                        backgroundColor: isRestoreMode
                          ? brandOrange
                          : hasSubmittedToday
                            ? brandOrange
                            : brandBlue,
                      }}
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                          Saving data...
                        </span>
                      ) : isRestoreMode ? (
                        <span className="flex items-center justify-center">
                          <i className="ph ph-clock-counter-clockwise mr-2" /> Restore Data
                        </span>
                      ) : hasSubmittedToday ? (
                        <span className="flex items-center justify-center">
                          <i className="ph ph-floppy-disk mr-2" /> Update Data
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <i className="ph ph-check-circle mr-2" /> Save Data
                        </span>
                      )}
                    </button>
                  </form>

                  {isSaving && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[20px] bg-surface-elevated/70 glass-panel backdrop-blur-sm">
                      <div
                        className="flex items-center justify-center rounded-2xl bg-surface-elevated glass-panel px-4 py-3 shadow-lg"
                        aria-label="Processing entry"
                      >
                        <span className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      </div>
                    </div>
                  )}

                  {/* INTERNAL SUCCESS OVERLAY */}
                  {successModal.visible && (
                    <div
                      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface-elevated/90 dark:bg-surface/90 backdrop-blur-md rounded-[20px]"
                      style={{ animation: "fadeIn 0.3s ease-out" }}
                    >
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-4 animate-success-icon"
                        style={{
                          backgroundColor: "rgb(var(--surface-elevated))",
                          border: `4px solid ${brandGreen}`,
                        }}
                      >
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke={brandGreen}
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                            style={{
                              animation: "circle-draw 0.8s ease-out forwards 0.3s",
                            }}
                          />
                        </svg>
                      </div>

                      <h2
                        className="text-2xl font-bold text-text-primary mb-2"
                        style={{
                          opacity: 0,
                          animation: "fadeInUp 0.5s ease-out forwards 0.5s",
                        }}
                      >
                        {successModal.title}
                      </h2>

                      <p
                        className="text-text-secondary text-center px-8 mb-4"
                        style={{
                          opacity: 0,
                          animation: "fadeInUp 0.5s ease-out forwards 0.7s",
                        }}
                      >
                        {successModal.text}
                      </p>

                      <div
                        className="px-6 border-t border-border pt-3 mt-1"
                        style={{
                          opacity: 0,
                          animation: "fadeInUp 0.5s ease-out forwards 0.9s",
                        }}
                      >
                        <p className="text-[10px] text-text-muted font-medium text-center">
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
          <section
            className="col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] bg-surface-elevated/40 glass-panel backdrop-blur-md border border-white/20 shadow-xl relative overflow-hidden"
            style={{ minHeight: 600 }}
          >
            {isLoadingLogs && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface-elevated/70 glass-panel backdrop-blur-sm">
                <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
              </div>
            )}

            <div
              className={`flex flex-col h-full ${isLoadingLogs ? "opacity-0 pointer-events-none" : ""}`}
            >
              <header className="flex justify-between items-center mb-6">
                {/* Back button (previous month) using SVG for consistent rendering */}
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated/50 glass-panel hover:bg-surface-elevated glass-panel text-text-secondary hover:text-brandBlue shadow-sm transition-all cursor-pointer border border-white/20"
                  onClick={() => changeMonth(-1)}
                  title="Previous Month"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Month and year title */}
                <div className="flex flex-col items-center">
                  <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
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

                {/* Next button (next month) using SVG for consistent rendering */}
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-elevated/50 glass-panel hover:bg-surface-elevated glass-panel text-text-secondary hover:text-brandBlue shadow-sm transition-all cursor-pointer border border-white/20"
                  onClick={() => changeMonth(1)}
                  title="Next Month"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </header>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-3 text-center">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-xs font-bold text-text-muted uppercase tracking-wider"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
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

                  const isSel =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === month &&
                    selectedDate.getFullYear() === year;

                  const isRealToday =
                    day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear();

                  return (
                    <div
                      key={`day-${month}-${day}`}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-2xl font-bold text-sm cursor-pointer transition-all duration-300 relative overflow-hidden group
                        ${isSel ? "text-white shadow-lg scale-105" : "text-text-secondary hover:bg-surface-elevated/80 hover:shadow-md"}
                        ${!isSel && isRealToday ? "bg-blue-50 border-2 border-blue-200" : ""}
                      `}
                      style={{
                        background: isSel ? brandBlue : "transparent",
                        border:
                          !isSel && hasData
                            ? `2px solid ${has.color}40`
                            : !isSel && isRealToday
                              ? "2px solid rgba(1, 98, 241, 0.25)"
                              : "none",
                      }}
                    >
                      <span className="relative z-10">{day}</span>
                      {hasData && (
                        <div
                          className={`mt-1 w-1.5 h-1.5 rounded-full transition-all duration-300 ${isSel ? "bg-surface-elevated" : ""}`}
                          style={{
                            backgroundColor: isSel ? "white" : has.color,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/40 bg-surface-elevated/60 glass-panel p-4 shadow-sm dark:border-border/70 dark:bg-surface/70">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center dark:bg-orange-500/20 dark:text-orange-200">
                      <span className="text-lg">🔥</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary dark:text-text-primary">
                        Restore Streak
                      </h4>
                      <p className="text-xs text-text-muted dark:text-text-muted">
                        Remaining:{" "}
                        <span className="font-semibold text-text-secondary dark:text-text-primary">
                          {restoreRemaining}/{restoreLimit}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenForm({
                        mode: "restore",
                        dateKey: selectedDateKey,
                      })
                    }
                    disabled={eligibilityLoading || restoreRemaining <= 0 || !canRestoreSelectedDay}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      eligibilityLoading || restoreRemaining <= 0 || !canRestoreSelectedDay
                        ? "bg-surface-muted text-text-muted cursor-not-allowed dark:bg-surface dark:text-text-muted"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    Restore {selectedDateKey}
                  </button>
                </div>
                <p className="text-xs text-text-muted mt-2 dark:text-text-muted">{restoreHint}</p>
                {eligibilityError && (
                  <p className="text-xs text-red-500 mt-1">{eligibilityError}</p>
                )}
              </div>

              {/* --- NEW SECTION: 3-DAY FORECAST --- */}
              <div className="mt-auto pt-6 pb-2">
                <div className="w-full h-px bg-linear-to-r from-transparent via-border to-transparent mb-4 dark:via-border"></div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-text-secondary dark:text-text-primary flex items-center gap-2">
                    <i className="ph ph-crystal-ball text-brand-info text-lg"></i>
                    3-Day Forecast
                  </h4>
                  <div className="relative group">
                    <span
                      className="text-[10px] bg-brand-info/10 text-brand-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider cursor-help dark:bg-brand-info/20 dark:text-brand-info"
                      title={forecastModeDescription}
                    >
                      {forecastModeLabel}
                    </span>
                    <div className="pointer-events-none absolute right-0 bottom-full mb-2 w-52 max-w-[220px] rounded-lg border border-brand-info/20 bg-surface-elevated/95 p-2 text-[10px] text-brand-primary shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:border-brand-info/30 dark:bg-surface/95 dark:text-brand-info">
                      {forecastModeDescription}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {forecastLoading &&
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={`forecast-loading-${idx}`}
                        className="relative rounded-xl p-3 flex flex-col items-center text-center border border-white/40 bg-surface-elevated/50 glass-panel animate-pulse dark:border-border dark:bg-surface/60"
                      >
                        <div className="h-3 w-12 bg-surface-muted rounded mb-3 dark:bg-surface-muted" />
                        <div className="h-6 w-6 bg-surface-muted rounded-full mb-2 dark:bg-surface-muted" />
                        <div className="h-4 w-14 bg-surface-muted rounded mb-2 dark:bg-surface-muted" />
                        <div className="h-3 w-16 bg-surface-muted rounded-full dark:bg-surface-muted" />
                      </div>
                    ))}
                  {!forecastLoading && forecastError && (
                    <div className="col-span-3 text-center text-xs font-semibold text-text-muted bg-surface-elevated/60 glass-panel border border-border rounded-xl px-3 py-4 whitespace-pre-line dark:bg-surface/70 dark:border-border dark:text-text-muted">
                      {forecastError}
                    </div>
                  )}
                  {!forecastLoading && !forecastError && forecastList.length === 0 && (
                    <div className="col-span-3 text-center text-xs font-semibold text-text-muted bg-surface-elevated/60 glass-panel border border-border rounded-xl px-3 py-4 dark:bg-surface/70 dark:border-border dark:text-text-muted">
                      Forecast is not available yet.
                    </div>
                  )}
                  {!forecastLoading &&
                    !forecastError &&
                    forecastList.length > 0 &&
                    forecastList.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setForecastDetail(item)}
                        className={`
                            relative rounded-xl p-3 flex flex-col items-center text-center cursor-pointer 
                            transition-all duration-300 hover:scale-105 hover:shadow-md border border-transparent hover:border-border/60 active:scale-95
                            dark:hover:border-border/60
                            ${item.bg}
                          `}
                      >
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 dark:text-text-muted">
                          {item.dateStr}
                        </span>
                        <div className="text-2xl mb-1" style={{ color: item.color }}>
                          <i className={`ph ${item.icon}`}></i>
                        </div>
                        <div
                          className="font-extrabold text-sm uppercase"
                          style={{ color: item.color }}
                        >
                          {item.status}
                        </div>
                        <div className="text-[10px] font-medium text-text-muted mt-1 flex items-center gap-1 bg-surface-elevated/50 glass-panel px-2 py-0.5 rounded-full dark:bg-surface/70 dark:text-text-primary">
                          <i className="ph ph-trend-up"></i> {item.probability}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {/* --- END FORECAST SECTION --- */}
            </div>

            {/* DETAIL CARD OVERLAY (Calendar Day Click) */}
            {dayDetail && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-surface-elevated/10 backdrop-blur-sm p-4 animate-card-enter"
                onClick={() => setDayDetail(null)}
              >
                <div
                  className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border-subtle overflow-hidden bg-surface-elevated"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none grayscale">
                    {dayDetail.mood}
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">
                        Daily Recap
                      </h4>
                      <h2 className="text-2xl font-extrabold text-text-primary">
                        {dayDetail.dateStr}
                      </h2>
                      {dayDetail.isRestored && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5 mt-2">
                          <i className="ph ph-clock-counter-clockwise" />
                          Restored
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setDayDetail(null)}
                      className="p-2 bg-surface-muted rounded-full hover:bg-surface-muted transition cursor-pointer"
                    >
                      <i className="ph ph-x text-lg text-text-secondary"></i>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="relative w-24 h-24 rounded-full flex items-center justify-center border-[5px]"
                      style={{ borderColor: dayDetail.color }}
                    >
                      <div className="text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">
                          Status
                        </div>
                        <div
                          className="text-lg font-black uppercase leading-none"
                          style={{ color: dayDetail.color }}
                        >
                          {getStatusFromLevel(dayDetail.level) === 2
                            ? "High"
                            : getStatusFromLevel(dayDetail.level) === 1
                              ? "Mod"
                              : "Low"}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-secondary italic">
                        "
                        {dayDetail.level > 60
                          ? "Take a break, you need it."
                          : "Keep it up and maintain balance!"}
                        "
                      </p>
                    </div>
                  </div>

                  <div
                    className="space-y-3 custom-scroll"
                    style={{
                      maxHeight: "220px",
                      overflowY: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {[
                      {
                        l: "Sleep",
                        v: dayDetail.sleep,
                        max: 10,
                        c: "bg-purple-500",
                        i: "ph-moon-stars",
                      },
                      {
                        l: "Study",
                        v: dayDetail.study,
                        max: 12,
                        c: "bg-blue-500",
                        i: "ph-book-open",
                      },
                      {
                        l: "Extra",
                        v: dayDetail.extra || 0,
                        max: 8,
                        c: "bg-brand-warning",
                        i: "ph-medal",
                      },
                      {
                        l: "Social",
                        v: dayDetail.social,
                        max: 8,
                        c: "bg-orange-500",
                        i: "ph-users",
                      },
                      {
                        l: "Exercise",
                        v: dayDetail.physical || 0,
                        max: 4,
                        c: "bg-teal-500",
                        i: "ph-sneaker",
                      },
                    ].map((s, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-bold text-text-secondary mb-1">
                          <span className="flex items-center gap-1">
                            <i className={`ph ${s.i} text-${s.c.split("-")[1]}-500`} /> {s.l}
                          </span>
                          <span>{s.v} hrs</span>
                        </div>
                        <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${s.c} rounded-full`}
                            style={{
                              width: `${Math.min((s.v / s.max) * 100, 100)}%`,
                            }}
                          />
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
                className={`
                  absolute inset-x-0 bottom-0 z-30 rounded-t-3xl
                  shadow-2xl border-t border-border-subtle overflow-hidden dark:border-border
                  ${isClosingPanel ? "animate-slide-down-panel" : "animate-slide-up-panel"}
                  backdrop-blur-xl supports-backdrop-filter:backdrop-blur-xl
                  bg-white/10 dark:bg-black/20
                  ring-1 ring-white/10 dark:ring-white/10
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle Bar for aesthetics */}
                <div className="w-full flex justify-center pt-3 pb-1" onClick={handleCloseForecast}>
                  <div className="w-12 h-1.5 bg-surface-muted/60 rounded-full cursor-pointer hover:bg-surface-muted/80 transition-colors dark:bg-surface-muted/70 dark:hover:bg-surface-muted/90" />
                </div>

                <div className="p-6 pt-2">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-widest dark:text-text-muted">
                          {forecastDetail.fullDate}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface-elevated/60 glass-panel border ${forecastDetail.border}`}
                          style={{ color: forecastDetail.color }}
                        >
                          {forecastDetail.status} Risk
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-text-primary dark:text-text-primary">
                        Stress Forecast Advice
                      </h3>
                    </div>
                    {/* Close button rendered with SVG */}
                    <button
                      onClick={handleCloseForecast}
                      className="w-8 h-8 rounded-full bg-surface-elevated/40 glass-panel text-text-secondary hover:bg-surface-elevated/60 glass-panel hover:text-text-primary flex items-center justify-center transition-all cursor-pointer dark:bg-surface/60 dark:text-text-primary dark:hover:bg-surface"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={`p-4 rounded-xl border ${forecastDetail.border} bg-surface-elevated/40 glass-panel flex items-start gap-3 dark:bg-surface/60`}
                  >
                    <i
                      className={`ph ${forecastDetail.icon} text-2xl mt-0.5`}
                      style={{ color: forecastDetail.color }}
                    ></i>
                    <div>
                      <p className="text-sm text-text-primary font-medium leading-relaxed dark:text-text-primary">
                        {forecastDetail.advice}
                      </p>
                      <div
                        className="mt-2 flex items-center gap-1 text-xs font-bold opacity-70"
                        style={{ color: forecastDetail.color }}
                      >
                        <i className="ph ph-lightning"></i> Confidence: {forecastDetail.probability}
                        %
                      </div>
                      {(forecastDetail.forecastMode ||
                        forecastDetail.modelType ||
                        typeof forecastDetail.threshold === "number") && (
                        <div className="mt-1 text-[11px] font-semibold text-text-muted dark:text-text-muted">
                          {forecastDetail.forecastMode && (
                            <span>
                              Forecast:{" "}
                              {forecastDetail.forecastMode === "personalized"
                                ? "Personalized"
                                : "Global"}
                            </span>
                          )}
                          {forecastDetail.forecastMode &&
                            (forecastDetail.modelType ||
                              typeof forecastDetail.threshold === "number") && (
                              <span className="mx-1">·</span>
                            )}
                          {forecastDetail.modelType && (
                            <span>Model: {forecastDetail.modelType}</span>
                          )}
                          {forecastDetail.modelType &&
                            typeof forecastDetail.threshold === "number" && (
                              <span className="mx-1">·</span>
                            )}
                          {typeof forecastDetail.threshold === "number" && (
                            <span>Threshold: {forecastDetail.threshold}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleCloseForecast}
                    className="w-full mt-4 py-3 bg-surface-muted text-text-primary rounded-xl font-bold text-sm shadow-lg hover:bg-surface-elevated glass-panel transition-transform active:scale-95 cursor-pointer dark:bg-surface dark:text-text-primary dark:hover:bg-surface"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* MOTIVATION & TIPS SECTIONS */}
        <div className="mt-8 grid grid-cols-1">
          {/* ... (Motivation section remains unchanged) ... */}
          <section className="col-span-4 relative overflow-hidden rounded-3xl shadow-xl group transition-all duration-500 hover:shadow-orange-100">
            <div className="absolute inset-0 bg-surface-elevated/60 glass-panel backdrop-blur-xl border border-white/40 dark:bg-surface/80 dark:border-border/60 z-0"></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-orange-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left flex-1">
                <div className="w-16 h-16 shrink-0 rounded-2xl bg-linear-to-br from-orange-400 to-red-400 flex items-center justify-center shadow-lg text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    fill="currentColor"
                    className="w-8 h-8"
                  >
                    <path d="M224,128a8,8,0,0,1-8,8c-30.85,0-57.5,12.72-76.32,34.4C120.86,192.11,128,218.85,128,248a8,8,0,0,1-16,0c0-29.15,7.14-55.89-11.68-77.6C81.5,148.72,54.85,136,24,136a8,8,0,0,1,0-16c30.85,0,57.5-12.72,76.32-34.4C119.14,63.89,112,37.15,112,8a8,8,0,0,1,16,0c0,29.15-7.14,55.89,11.68,77.6C158.5,107.28,185.15,120,216,120A8,8,0,0,1,224,128Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-widest text-orange-600 dark:text-orange-600 uppercase mb-2">
                    Daily Wisdom
                  </p>
                  <div
                    className={`transition-all duration-500 ${isQuoteAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
                  >
                    {quoteLoading ? (
                      <p className="text-text-muted dark:text-text-muted font-medium">
                        Loading daily wisdom...
                      </p>
                    ) : quoteError ? (
                      <p className="text-rose-500 font-medium">{quoteError}</p>
                    ) : quoteData.text ? (
                      <>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-text-secondary to-text-muted dark:from-text-primary dark:to-text-secondary leading-tight mb-2">
                          "{quoteData.text}"
                        </h3>
                        <p className="text-text-muted dark:text-text-muted font-medium italic">
                          — {quoteData.author}
                        </p>
                      </>
                    ) : (
                      <p className="text-text-muted dark:text-text-muted font-medium">
                        No quotes available yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleNewQuote}
                disabled={isQuoteAnimating || quoteLoading || quotePool.length === 0}
                className="shrink-0 group relative px-6 py-3 rounded-xl bg-surface-elevated glass-panel border border-border text-text-secondary font-bold shadow-sm hover:shadow-md hover:border-orange-300 hover:text-orange-600 dark:bg-surface dark:border-border dark:text-text-primary dark:hover:text-orange-600 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <i
                    className={`ph ph-arrows-clockwise text-xl transition-transform duration-700 ${isQuoteAnimating ? "rotate-180" : ""}`}
                  ></i>
                  <span>New Quote</span>
                </span>
              </button>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {tipsLoading ? (
              <div className="col-span-full bg-surface-elevated/70 glass-panel border border-white/50 rounded-2xl p-6 text-center text-text-muted font-medium">
                Loading tips...
              </div>
            ) : tipsError ? (
              <div className="col-span-full bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-rose-600 font-medium">
                {tipsError}
              </div>
            ) : tipCards.length === 0 ? (
              <div className="col-span-full bg-surface-elevated/70 glass-panel border border-white/50 rounded-2xl p-6 text-center text-text-muted font-medium">
                No tips available yet.
              </div>
            ) : (
              tipCards.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveTip(item)}
                  className={`relative overflow-hidden rounded-[30px] p-6 h-64 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] backdrop-blur-xl border border-white/40 shadow-lg ${item.theme.bg}`}
                >
                  <div
                    className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-50 blur-2xl ${item.theme.accent}`}
                  />
                  <div
                    className={`absolute -left-6 -bottom-6 w-24 h-24 rounded-full opacity-50 blur-xl ${item.theme.accent}`}
                  />
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
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />

      {missingRestorePopup && (
        <div className="fixed inset-0 z-1090 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={handleCloseMissingPopup} />
          <div className="relative w-full max-w-md bg-surface-elevated glass-panel rounded-3xl shadow-2xl overflow-hidden animate-modal-slide">
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-xl font-extrabold text-text-primary">You have missed dates</h2>
                <button
                  type="button"
                  onClick={handleCloseMissingPopup}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                You have <span className="font-semibold">{missingRestorePopup.count}</span> missing
                dates. Use restore to fill these days:
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {missingRestorePopup.dates.map((dateKey) => (
                  <span
                    key={dateKey}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700"
                  >
                    {formatDisplayDate(dateKey)}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleStartRestoreForMissing("manual")}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer"
                >
                  Manual entry
                </button>
                <button
                  onClick={() => handleStartRestoreForMissing("auto")}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 cursor-pointer"
                >
                  Auto fill
                </button>
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Auto fill uses nearby averages. You can still edit the data afterward.
              </p>
            </div>
          </div>
        </div>
      )}

      {showTodayReminder && (
        <div className="fixed inset-0 z-1080 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm animate-fadeIn">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowTodayReminder(false)}
          />
          <div className="relative w-full max-w-md bg-surface-elevated glass-panel rounded-3xl shadow-2xl overflow-hidden animate-modal-slide">
            <div className="p-8">
              <h2 className="text-xl font-extrabold text-text-primary mb-2">Time to log today</h2>
              <p className="text-sm text-text-secondary mb-6">
                You have not logged today yet. Log now to keep your streak safe.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTodayReminderAction}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 cursor-pointer"
                >
                  Log now
                </button>
                <button
                  onClick={() => setShowTodayReminder(false)}
                  className="flex-1 py-3 bg-surface-muted text-text-secondary rounded-xl font-bold shadow-sm hover:bg-surface-muted transition-transform active:scale-95 cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TIPS */}
      {activeTip && (
        <div className="fixed inset-0 z-1100 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setActiveTip(null)} />

          <div className="relative w-full max-w-md bg-surface-elevated glass-panel rounded-3xl shadow-2xl overflow-hidden animate-modal-slide">
            <div
              className={`h-32 w-full ${activeTip.theme.bg} relative flex items-center justify-center`}
            >
              <div className="text-6xl animate-bounce">{activeTip.emoji}</div>
            </div>

            <div className="p-8 pt-10 relative">
              <div className="absolute -top-5 left-8 px-4 py-2 bg-surface-elevated glass-panel rounded-xl shadow-lg text-sm font-bold tracking-wide text-text-primary uppercase">
                {activeTip.category}
              </div>

              <h2 className="text-2xl font-extrabold text-text-primary mb-3">{activeTip.title}</h2>

              <div className="p-4 bg-surface-muted rounded-2xl border border-border-subtle text-text-secondary leading-relaxed text-sm">
                {activeTip.fullDetail}
              </div>

              <button
                onClick={() => setActiveTip(null)}
                className={`w-full mt-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 transition-transform active:scale-95 cursor-pointer ${activeTip.theme.btn}`}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  );
}

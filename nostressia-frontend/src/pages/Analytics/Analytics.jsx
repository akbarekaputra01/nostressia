import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PageMeta from "../../components/PageMeta";
import {
  Activity,
  BarChart3,
  BookOpen,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getAnalyticsSummary } from "../../services/analyticsService";
import { getMyStressLogs } from "../../services/stressService";
import { resolveDisplayedStreak } from "../../utils/streak";

// --- BACKGROUND CONFIGURATION (SAME AS DASHBOARD) ---
const bgSun = "rgb(var(--bg-gradient-sun))";
const bgOrange = "rgb(var(--bg-gradient-orange))";
const bgSky = "rgb(var(--bg-gradient-sky))";
const moodEmojis = ["😢", "😕", "😐", "😊", "😄"];
const stressLabels = ["Low", "Moderate", "High"];

// ===== Helpers =====
const clampNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeAnalyticsValue = (value, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(0, n) + 1);
};

const getStressLabel = (value) => {
  if (!value) return "-";
  const idx = Math.min(
    stressLabels.length - 1,
    Math.max(0, Math.round(value) - 1),
  );
  return stressLabels[idx];
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const toISODate = (d) => {
  // YYYY-MM-DD in local time (safe for grouping)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const weekdayShort = (d) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(d);

const getLogsInRange = (logs, viewMode) => {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(today.getDate() - (viewMode === "month" ? 27 : 6));

  return (logs || []).filter((it) => {
    const dt = it?.date ? startOfDay(new Date(it.date)) : null;
    if (!dt || Number.isNaN(dt.getTime())) return false;
    return dt >= start && dt <= today;
  });
};

// Build 7-day series ending today
const buildWeekSeries = (logs) => {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  // Map logs by YYYY-MM-DD (take latest log of that day if multiple)
  const byDate = new Map();
  (logs || []).forEach((it) => {
    const dt = it?.date ? new Date(it.date) : null;
    if (!dt || Number.isNaN(dt.getTime())) return;
    const key = toISODate(startOfDay(dt));
    const prev = byDate.get(key);
    if (!prev) byDate.set(key, it);
    else {
      const prevTs = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
      const curTs = it?.createdAt ? new Date(it.createdAt).getTime() : 0;
      if (curTs >= prevTs) byDate.set(key, it);
    }
  });

  return days.map((d) => {
    const key = toISODate(d);
    const row = byDate.get(key);
    return {
      day: weekdayShort(d),
      // stress: 1..3
      stress: row ? normalizeAnalyticsValue(row.stressLevel, 3) : null,
      // mood: from emoji (integer). If you store 1..5 this will work directly.
      mood: row ? normalizeAnalyticsValue(row.emoji, 5) : null,
      _date: key,
    };
  });
};

// Build 4-week series (last 28 days), grouped into W1..W4 (oldest -> newest)
const buildMonthSeries = (logs) => {
  const today = startOfDay(new Date());
  const start = new Date(today);
  start.setDate(today.getDate() - 27);

  const buckets = Array.from({ length: 4 }, () => ({
    stressSum: 0,
    moodSum: 0,
    count: 0,
  }));

  (logs || []).forEach((it) => {
    const dt = it?.date ? startOfDay(new Date(it.date)) : null;
    if (!dt || Number.isNaN(dt.getTime())) return;
    if (dt < start || dt > today) return;

    const diffDays = Math.floor((dt.getTime() - start.getTime()) / 86400000);
    const idx = Math.min(3, Math.max(0, Math.floor(diffDays / 7)));
    const stressValue = normalizeAnalyticsValue(it.stressLevel, 3);
    const moodValue = normalizeAnalyticsValue(it.emoji, 5);
    if (stressValue !== null) buckets[idx].stressSum += stressValue;
    if (moodValue !== null) buckets[idx].moodSum += moodValue;
    buckets[idx].count += 1;
  });

  return buckets.map((b, i) => ({
    week: `W${i + 1}`,
    // Use average so chart scale stays consistent with weekly view.
    stress: b.count ? Number((b.stressSum / b.count).toFixed(2)) : null,
    mood: b.count ? Number((b.moodSum / b.count).toFixed(2)) : null,
  }));
};

const calcMode = (values) => {
  const counts = new Map();
  values.forEach((v) => {
    const n = Math.round(clampNumber(v, 0));
    if (n <= 0) return;
    counts.set(n, (counts.get(n) || 0) + 1);
  });
  if (!counts.size) return 0;
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
};

const calcSummary = (logsInRange) => {
  const stressVals = (logsInRange || []).map((d) =>
    normalizeAnalyticsValue(d?.stressLevel, 3),
  );
  const moodVals = (logsInRange || []).map((d) =>
    normalizeAnalyticsValue(d?.emoji, 5),
  );

  const nonZeroStress = stressVals.filter(
    (value) => Number.isFinite(value) && value > 0,
  );

  const avgStress = nonZeroStress.length
    ? nonZeroStress.reduce((sum, v) => sum + v, 0) / nonZeroStress.length
    : 0;

  return {
    modeStress: calcMode(stressVals),
    modeMood: calcMode(moodVals),
    avgStress,
  };
};

const addGapSeries = (rows, key, gapKey) => {
  if (!Array.isArray(rows)) return [];
  const gapIndexes = new Set();
  let lastIndex = null;

  rows.forEach((row, idx) => {
    const value = row?.[key];
    if (value === null || value === undefined) return;
    if (lastIndex !== null && idx - lastIndex > 1) {
      gapIndexes.add(lastIndex);
      gapIndexes.add(idx);
    }
    lastIndex = idx;
  });

  return rows.map((row, idx) => ({
    ...row,
    [gapKey]: gapIndexes.has(idx) ? row?.[key] : null,
  }));
};

const buildTooltipLabel = (payload, mode) =>
  payload?.payload?.[mode === "week" ? "day" : "week"] || "";

const moodTooltipValue = (value) => {
  const rounded = Math.round(clampNumber(value, 0));
  return moodEmojis[rounded - 1] || value;
};

const renderMoodTooltip =
  (mode) =>
  ({ active, payload, label: chartLabel }) => {
    if (!active) return null;
    const base = payload?.[0]?.payload;
    const label = chartLabel || buildTooltipLabel(payload?.[0], mode);
    const value = base?.mood;
    const hasValue = Number.isFinite(value) && value > 0;

    return (
      <div className="rounded-xl border border-border bg-surface-elevated/90 px-3 py-2 text-sm shadow-lg dark:border-border dark:bg-surface/90">
        <div className="font-semibold text-text-secondary dark:text-text-primary">
          {label}
        </div>
        <div className="mt-1 text-text-secondary dark:text-text-muted">
          {hasValue
            ? `Mood: ${moodTooltipValue(value)}`
            : "No data available at this point."}
        </div>
      </div>
    );
  };

const renderStressTooltip =
  (mode) =>
  ({ active, payload, label: chartLabel }) => {
    if (!active) return null;
    const base = payload?.[0]?.payload;
    const label = chartLabel || buildTooltipLabel(payload?.[0], mode);
    const value = base?.stress;
    const hasValue = Number.isFinite(value) && value > 0;

    return (
      <div className="rounded-xl border border-border bg-surface-elevated/90 px-3 py-2 text-sm shadow-lg dark:border-border dark:bg-surface/90">
        <div className="font-semibold text-text-secondary dark:text-text-primary">
          {label}
        </div>
        <div className="mt-1 text-text-secondary dark:text-text-muted">
          {hasValue
            ? `Stress: ${getStressLabel(value)}`
            : "No data available at this point."}
        </div>
      </div>
    );
  };

export default function Analytics() {
  const [mode, setMode] = useState("week");
  const headerRef = useRef(null);

  // Get user from layout
  const { user } = useOutletContext() || {
    user: { name: "User", avatar: null },
  };

  // ===== API state =====
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!headerRef.current) return;
    headerRef.current.style.opacity = 1;
    headerRef.current.style.transform = "translateY(0)";
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const data = await getMyStressLogs();
      setLogs(Array.isArray(data) ? data : []);
      const summaryData = await getAnalyticsSummary();
      setSummary(summaryData);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setErrorMsg(err?.message || "Failed to fetch stress logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch logs (protected endpoint)
  useEffect(() => {
    fetchAnalytics();

    const handleRefresh = () => {
      fetchAnalytics();
    };

    window.addEventListener("nostressia:user-update", handleRefresh);
    return () => {
      window.removeEventListener("nostressia:user-update", handleRefresh);
    };
  }, [fetchAnalytics]);

  // ===== Derived chart data =====
  const weekData = useMemo(() => buildWeekSeries(logs), [logs]);
  const monthData = useMemo(() => buildMonthSeries(logs), [logs]);
  const data = mode === "week" ? weekData : monthData;
  const rangeLogs = useMemo(() => getLogsInRange(logs, mode), [logs, mode]);
  const stressChartData = useMemo(
    () => addGapSeries(data, "stress", "stressGap"),
    [data],
  );
  const moodChartData = useMemo(
    () => addGapSeries(data, "mood", "moodGap"),
    [data],
  );

  const { modeStress, modeMood, avgStress } = useMemo(
    () => calcSummary(rangeLogs),
    [rangeLogs],
  );

  const streakValue = resolveDisplayedStreak(user?.streak ?? summary?.streak ?? 0);
  const modeLabel = mode === "week" ? "Weekly" : "Monthly";

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{
        backgroundColor: bgSun,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgSun} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgOrange} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgSky} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
    >
      <PageMeta
        title="Analytics"
        description="Analyze stress trends and mental wellness progress with Nostressia statistics and charts."
      />
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmer-slide { 100% { transform: translateX(100%); } }
        .skeleton {
          position: relative;
          overflow: hidden;
          background-color: rgb(var(--skeleton-bg));
        }
        .skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgb(var(--skeleton-shine)), transparent);
          animation: shimmer-slide 1.6s infinite;
        }
      `}</style>

      <Navbar activeLink="Analytics" user={user} />

      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-28 md:pt-8 flex-grow">
        {/* HEADER */}
        <div
          ref={headerRef}
          className="opacity-0 translate-y-8 transition-all duration-700"
        >
          <div className="mb-10 md:mb-14 text-center">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-brand-primary drop-shadow-lg" />

              <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-brand-primary to-brand-info bg-clip-text text-transparent drop-shadow-md">
                Analytics
              </h1>
            </div>

            <p
              className="text-sm md:text-lg font-medium drop-shadow-sm px-4"
              style={{ color: "rgb(var(--text-secondary))" }}
            >
              Track your stress and mood patterns in weekly or monthly views.
            </p>
          </div>
        </div>

        {/* INFO STATE */}
        <div className="max-w-3xl mx-auto mb-6">
          {!loading && errorMsg && (
            <div className="bg-surface/60 border border-border/30 rounded-2xl p-4 text-center shadow-sm backdrop-blur">
              <p className="text-sm md:text-base font-medium text-red-600">
                {errorMsg}
              </p>
              <p
                className="text-xs md:text-sm mt-1"
                style={{ color: "rgb(var(--text-secondary))" }}
              >
                Endpoint:{" "}
                <span className="font-sans">/api/stress-levels/my-logs</span>
              </p>
            </div>
          )}

          {!loading && !errorMsg && logs?.length === 0 && (
            <div className="bg-surface/50 border border-border/30 rounded-2xl p-4 text-center shadow-sm backdrop-blur">
              <p
                className="text-sm md:text-base"
                style={{ color: "rgb(var(--text-secondary))" }}
              >
                No stress logs yet. Try running a prediction or saving a log 🙂
              </p>
            </div>
          )}
        </div>

        {/* TOGGLE BUTTONS */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className="bg-surface/40 backdrop-blur-lg p-1.5 md:p-2 rounded-full shadow-lg border border-border/30 flex gap-2">
            <button
              onClick={() => setMode("week")}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition cursor-pointer ${
                mode === "week"
                  ? "bg-brand-accent text-text-inverse shadow-md"
                  : "text-text-secondary hover:bg-surface/40"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setMode("month")}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition cursor-pointer ${
                mode === "month"
                  ? "bg-brand-accent text-text-inverse shadow-md"
                  : "text-text-secondary hover:bg-surface/40"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* ==== CHARTS ==== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
          {/* Stress Chart */}
          <div
            className="relative rounded-2xl p-4 md:p-6 border backdrop-blur-xl overflow-hidden"
            style={{
              background: "rgb(var(--glass-bg) / 0.7)",
              borderColor: "rgb(var(--glass-border) / 0.5)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-sm">
                <div className="h-12 w-12 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin" />
              </div>
            )}
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "rgb(var(--brand-primary))" }}
            >
              Stress Trend ({mode})
            </h2>

            <div
              className={`h-[200px] md:h-[260px] w-full ${
                loading ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stressChartData}>
                  <CartesianGrid
                    stroke="rgb(var(--neutral-200))"
                    strokeDasharray="5 5"
                  />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={70}
                    domain={[0, 3.5]}
                    ticks={[1, 2, 3]}
                    allowDecimals={false}
                    tickFormatter={(value) => getStressLabel(value)}
                    tickMargin={8}
                  />
                  <Tooltip
                    content={renderStressTooltip(mode)}
                    filterNull={false}
                  />
                  <Line
                    type="linear"
                    dataKey="stressGap"
                    stroke="rgb(var(--brand-primary))"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="stress"
                    stroke="rgb(var(--brand-primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Chart */}
          <div
            className="relative rounded-2xl p-4 md:p-6 border backdrop-blur-xl overflow-hidden"
            style={{
              background: "rgb(var(--glass-bg) / 0.7)",
              borderColor: "rgb(var(--glass-border) / 0.5)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-surface/70 backdrop-blur-sm">
                <div className="h-12 w-12 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin" />
              </div>
            )}
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "rgb(var(--brand-primary))" }}
            >
              Mood Trend · {modeLabel}
            </h2>

            <div
              className={`h-[200px] md:h-[260px] w-full ${
                loading ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={moodChartData}
                  margin={{ top: 0, right: 8, left: 12, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="rgb(var(--neutral-200))"
                    strokeDasharray="5 5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 16 }}
                    width={54}
                    domain={[0, 5.5]}
                    ticks={[1, 2, 3, 4, 5]}
                    interval={0}
                    allowDecimals={false}
                    tickFormatter={(value) => moodTooltipValue(value)}
                    tickMargin={10}
                    padding={{ top: 0, bottom: 0 }}
                  />
                  <Tooltip
                    content={renderMoodTooltip(mode)}
                    filterNull={false}
                  />
                  <Line
                    type="linear"
                    dataKey="mood"
                    stroke="rgb(var(--brand-info))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {summary && (
          <section className="mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  Analytics Highlights
                </h3>
                <p className="text-sm text-text-muted">
                  Real-time metrics based on your latest logs.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary bg-surface/70 border border-border/60 px-3 py-1.5 rounded-full">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                Live update
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: "Stress Logs",
                  value: summary.stressLogsCount ?? 0,
                  icon: Activity,
                  gradient:
                    "from-brand-primary/15 via-brand-primary/5 to-transparent",
                  accent: "text-brand-primary",
                },
                {
                  title: "Diary Entries",
                  value: summary.diaryCount ?? 0,
                  icon: BookOpen,
                  gradient:
                    "from-brand-info/15 via-brand-info/5 to-transparent",
                  accent: "text-brand-info",
                },
                {
                  title: "Current Streak",
                  value: streakValue,
                  icon: Flame,
                  gradient:
                    "from-brand-accent/20 via-brand-accent/5 to-transparent",
                  accent: "text-brand-accent",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="relative overflow-hidden rounded-2xl p-6 border backdrop-blur-xl text-center md:text-left"
                    style={{
                      background: "rgb(var(--glass-bg) / 0.7)",
                      borderColor: "rgb(var(--glass-border) / 0.5)",
                      boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
                    />
                    <div className="relative z-10 flex flex-col gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-surface-elevated/80 glass-panel flex items-center justify-center ${item.accent}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                          {item.title}
                        </h4>
                        <p className="text-3xl md:text-4xl font-bold text-text-primary mt-2">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==== INSIGHTS ==== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              title: "Most Common Stress",
              value: getStressLabel(modeStress),
              icon: TrendingUp,
            },
            {
              title: "Most Common Mood",
              value: modeMood ? moodEmojis[modeMood - 1] : "-",
              icon: Sparkles,
            },
            {
              title: "Average Stress Level",
              value: getStressLabel(avgStress),
              icon: BarChart3,
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-6 border backdrop-blur-xl flex flex-col items-center md:items-start text-center md:text-left"
                style={{
                  background: "rgb(var(--glass-bg) / 0.7)",
                  borderColor: "rgb(var(--glass-border) / 0.5)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  <Icon className="w-4 h-4 text-brand-primary" />
                  {item.title}
                </div>
                {loading ? (
                  <div className="w-full space-y-2 mt-3">
                    <div className="skeleton h-10 w-28 rounded-full" />
                    <div className="skeleton h-3 w-24 rounded-full" />
                  </div>
                ) : (
                  <p className="text-3xl md:text-4xl font-bold text-text-primary mt-4">
                    {item.value}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}

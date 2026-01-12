import { useState, useRef, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- BACKGROUND CONFIGURATION (SAME AS DASHBOARD) ---
const bgCream = "#FFF3E0";
const bgPink = "#eaf2ff";
const bgLavender = "#e3edff";
const moodEmojis = ["😢", "😕", "😐", "😊", "😄"];
const stressLabels = ["Low", "Moderate", "High"];

// ===== Helpers =====
const clampNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const getStressLabel = (value) => {
  if (!value) return "-";
  const idx = Math.min(
    stressLabels.length - 1,
    Math.max(0, Math.round(value) - 1)
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
      stress: row ? clampNumber(row.stressLevel, 0) : null,
      // mood: from emoji (integer). If you store 1..5 this will work directly.
      mood: row ? clampNumber(row.emoji, 0) : null,
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
    buckets[idx].stressSum += clampNumber(it.stressLevel, 0);
    buckets[idx].moodSum += clampNumber(it.emoji, 0);
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
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
};

const calcSummary = (logsInRange) => {
  const stressVals = (logsInRange || []).map((d) => d?.stressLevel);
  const moodVals = (logsInRange || []).map((d) => d?.emoji);

  const nonZeroStress = stressVals
    .map((v) => clampNumber(v, 0))
    .filter((x) => x > 0);

  const avgStress = nonZeroStress.length
    ? nonZeroStress.reduce((sum, v) => sum + v, 0) / nonZeroStress.length
    : 0;

  return {
    modeStress: calcMode(stressVals),
    modeMood: calcMode(moodVals),
    avgStress,
  };
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

  useEffect(() => {
    if (!headerRef.current) return;
    headerRef.current.style.opacity = 1;
    headerRef.current.style.transform = "translateY(0)";
  }, []);

  // Fetch logs (protected endpoint)
  useEffect(() => {
    const controller = new AbortController();

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const API_BASE = "https://akbarekaputra01-nostressia-backend.hf.space";
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt");

        const res = await fetch(`${API_BASE}/api/stress/my-logs`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          let detail = "";
          try {
            const j = await res.json();
            detail = j?.detail ? String(j.detail) : "";
          } catch {
            /* ignore */
          }

          if (res.status === 401) {
            throw new Error(
              detail || "Unauthorized (401). Please ensure your login token exists."
            );
          }
          throw new Error(detail || `Request failed (HTTP ${res.status}).`);
        }

        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err?.name === "AbortError") return;
        setErrorMsg(err?.message || "Failed to fetch stress logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    return () => controller.abort();
  }, []);

  // ===== Derived chart data =====
  const weekData = useMemo(() => buildWeekSeries(logs), [logs]);
  const monthData = useMemo(() => buildMonthSeries(logs), [logs]);
  const data = mode === "week" ? weekData : monthData;
  const rangeLogs = useMemo(() => getLogsInRange(logs, mode), [logs, mode]);

  const { modeStress, modeMood, avgStress } = useMemo(
    () => calcSummary(rangeLogs),
    [rangeLogs]
  );

  return (
    <div
      className="min-h-screen relative flex flex-col"
      style={{
        backgroundColor: bgCream,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
    >
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
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

      <Navbar activeLink="Analytics" user={user} />

      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-28 md:pt-8 flex-grow">
        {/* HEADER */}
        <div
          ref={headerRef}
          className="opacity-0 translate-y-8 transition-all duration-700"
        >
          <div className="mb-10 md:mb-14 text-center">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-[var(--brand-blue)] drop-shadow-lg" />

              <h1
                className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r
                from-[var(--brand-blue)]
                to-[var(--brand-blue-light)]
                bg-clip-text text-transparent drop-shadow-md"
              >
                Analytics
              </h1>
            </div>

            <p
              className="text-sm md:text-lg font-medium drop-shadow-sm px-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Track your stress and mood patterns in weekly or monthly views.
            </p>
          </div>
        </div>

        {/* INFO STATE */}
        <div className="max-w-3xl mx-auto mb-6">
          {!loading && errorMsg && (
            <div className="bg-white/60 border border-white/30 rounded-2xl p-4 text-center shadow-sm backdrop-blur">
              <p className="text-sm md:text-base font-medium text-red-600">
                {errorMsg}
              </p>
              <p
                className="text-xs md:text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Endpoint: <span className="font-mono">/api/stress/my-logs</span>
              </p>
            </div>
          )}

          {!loading && !errorMsg && logs?.length === 0 && (
            <div className="bg-white/50 border border-white/30 rounded-2xl p-4 text-center shadow-sm backdrop-blur">
              <p
                className="text-sm md:text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                No stress logs yet. Try running a prediction or saving a log 🙂
              </p>
            </div>
          )}
        </div>

        {/* TOGGLE BUTTONS */}
        <div className="flex justify-center mb-8 md:mb-10">
          <div className="bg-white/40 backdrop-blur-lg p-1.5 md:p-2 rounded-full shadow-lg border border-white/30 flex gap-2">
            <button
              onClick={() => setMode("week")}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition cursor-pointer ${
                mode === "week"
                  ? "bg-[var(--brand-orange)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:bg-white/30"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setMode("month")}
              className={`px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium transition cursor-pointer ${
                mode === "month"
                  ? "bg-[var(--brand-orange)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:bg-white/30"
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
            className="relative rounded-2xl p-4 md:p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white/70 backdrop-blur-sm p-4 md:p-6">
                <div className="relative h-full w-full rounded-2xl border border-white/40 bg-white/60 p-4 md:p-6 shadow-inner">
                  <div className="skeleton h-5 w-40 rounded-full mb-4" />
                  <div className="skeleton h-full w-full rounded-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-500 spin-slow" />
                      <div className="absolute h-9 w-9 rounded-full border-4 border-orange-200 border-t-orange-500 spin-reverse" />
                    </div>
                    <p className="text-center text-sm font-semibold text-gray-500 pulse-soft">
                      Loading stress analytics...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "var(--brand-blue)" }}
            >
              Stress Trend ({mode})
            </h2>

            <div
              className={`h-[200px] md:h-[260px] w-full ${
                loading ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={30}
                    domain={[0, 3]}
                    ticks={[1, 2, 3]}
                    allowDecimals={false}
                    tickFormatter={(value) => getStressLabel(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => getStressLabel(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="var(--brand-blue)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Chart */}
          <div
            className="relative rounded-2xl p-4 md:p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            {loading && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white/70 backdrop-blur-sm p-4 md:p-6">
                <div className="relative h-full w-full rounded-2xl border border-white/40 bg-white/60 p-4 md:p-6 shadow-inner">
                  <div className="skeleton h-5 w-40 rounded-full mb-4" />
                  <div className="skeleton h-full w-full rounded-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-500 spin-slow" />
                      <div className="absolute h-9 w-9 rounded-full border-4 border-orange-200 border-t-orange-500 spin-reverse" />
                    </div>
                    <p className="text-center text-sm font-semibold text-gray-500 pulse-soft">
                      Loading mood analytics...
                    </p>
                  </div>
                </div>
              </div>
            )}
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "var(--brand-blue)" }}
            >
              Mood Trend ({mode})
            </h2>

            <div
              className={`h-[200px] md:h-[260px] w-full ${
                loading ? "opacity-0 pointer-events-none" : ""
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 18 }}
                    width={36}
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    allowDecimals={false}
                    tickFormatter={(value) => moodEmojis[value - 1] || value}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value) => moodEmojis[value - 1] || value}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--brand-blue-light)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ==== SUMMARY CARDS ==== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { title: "Most Common Stress", value: getStressLabel(modeStress) },
            {
              title: "Most Common Mood",
              value: modeMood ? moodEmojis[modeMood - 1] : "-",
            },
            { title: "Average Stress Level", value: getStressLabel(avgStress) },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border backdrop-blur-xl flex flex-col items-center md:items-start text-center md:text-left"
              style={{
                background: "rgba(255,255,255,0.45)",
                borderColor: "var(--glass-border)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                className="text-sm md:text-md font-medium mb-2 uppercase tracking-wide opacity-80"
                style={{ color: "var(--brand-blue)" }}
              >
                {item.title}
              </h3>
              {loading ? (
                <div className="w-full space-y-2">
                  <div className="skeleton h-10 w-28 rounded-full" />
                  <div className="skeleton h-3 w-24 rounded-full" />
                </div>
              ) : (
                <p className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                  {item.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

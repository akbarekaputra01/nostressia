import { useState, useRef, useEffect } from "react";
import Navbar from "../../components/Navbar";
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

export default function Analytics() {
  const [mode, setMode] = useState("week");
  const headerRef = useRef(null);

  // Animation for header
  useEffect(() => {
    if (!headerRef.current) return;

    headerRef.current.style.opacity = 1;
    headerRef.current.style.transform = "translateY(0)";
  }, []);

  // Dummy data
  const weekData = [
    { day: "Mon", stress: 2, mood: 4 },
    { day: "Tue", stress: 3, mood: 3 },
    { day: "Wed", stress: 1, mood: 5 },
    { day: "Thu", stress: 2, mood: 4 },
    { day: "Fri", stress: 3, mood: 3 },
    { day: "Sat", stress: 1, mood: 4 },
    { day: "Sun", stress: 2, mood: 5 },
  ];

  const monthData = [
    { week: "W1", stress: 6, mood: 14 },
    { week: "W2", stress: 9, mood: 12 },
    { week: "W3", stress: 5, mood: 16 },
    { week: "W4", stress: 7, mood: 15 },
  ];

  const data = mode === "week" ? weekData : monthData;

  const avgStress = mode === "week" ? 2 : 7;
  const avgMood = mode === "week" ? 4 : 14;
  const highestStress = mode === "week" ? 3 : 9;

  return (
    <div
      className="min-h-screen"
      style={{
        background: `
          linear-gradient(
            135deg,
            var(--bg-gradient-cream),
            var(--bg-gradient-pink),
            var(--bg-gradient-lavender)
          )
        `,
      }}
    >
      <Navbar />

      {/* Container */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* HEADER */}
        <div
          ref={headerRef}
          className="opacity-0 translate-y-8 transition-all duration-700"
        >
          <div className="mb-14 text-center">
            <div className="flex items-center gap-3 mb-3 justify-center">
              <BarChart3 className="w-10 h-10 text-[var(--brand-blue)] drop-shadow-lg" />

              <h1
                className="text-5xl font-extrabold bg-gradient-to-r
                from-[var(--brand-blue)]
                to-[var(--brand-blue-light)]
                bg-clip-text text-transparent drop-shadow-md"
              >
                Analytics
              </h1>
            </div>

            <p
              className="text-lg font-medium drop-shadow-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Pantau pola stres & mood kamu dalam tampilan harian atau bulanan
            </p>
          </div>
        </div>

        {/* TOGGLE */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/40 backdrop-blur-lg p-2 rounded-full shadow-lg border border-white/30 flex gap-2">
            <button
              onClick={() => setMode("week")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                mode === "week"
                  ? "bg-[var(--brand-orange)] text-white shadow-md"
                  : "text-[var(--text-secondary)] hover:bg-white/30"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setMode("month")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Stress Chart */}
          <div
            className="rounded-2xl p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--brand-blue)" }}
            >
              Stress Trend ({mode})
            </h2>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                <XAxis dataKey={mode === "week" ? "day" : "week"} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="var(--brand-blue)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mood Chart */}
          <div
            className="rounded-2xl p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--brand-blue)" }}
            >
              Mood Trend ({mode})
            </h2>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                <XAxis dataKey={mode === "week" ? "day" : "week"} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--brand-blue-light)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==== SUMMARY CARDS ==== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Average Stress", value: avgStress },
            { title: "Average Mood", value: avgMood },
            { title: "Highest Stress", value: highestStress },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.45)",
                borderColor: "var(--glass-border)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.06)",
              }}
            >
              <h3
                className="text-md font-medium mb-2"
                style={{ color: "var(--brand-blue)" }}
              >
                {item.title}
              </h3>
              <p className="text-4xl font-bold text-[var(--text-primary)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

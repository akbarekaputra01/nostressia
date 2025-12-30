// src/pages/Analytics/Analytics.jsx
import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom"; // 1. Import Context
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; // 2. Import Footer
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

export default function Analytics() {
  const [mode, setMode] = useState("week");
  const headerRef = useRef(null);

  // 3. AMBIL DATA USER DARI LAYOUT (WRAPPER)
  // Ini otomatis berisi data user yang sudah di-fetch di MainLayout.jsx
  // Ambil context, tapi jika null (error), pakai object kosong default
  const { user } = useOutletContext() || { user: { name: "User", avatar: null } };
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
      className="min-h-screen relative flex flex-col" // Tambahkan flex-col agar footer turun ke bawah
      style={{
        backgroundColor: bgCream,
        backgroundImage: `radial-gradient(at 10% 10%, ${bgCream} 0%, transparent 50%), radial-gradient(at 90% 20%, ${bgPink} 0%, transparent 50%), radial-gradient(at 50% 80%, ${bgLavender} 0%, transparent 50%)`,
        backgroundSize: "200% 200%",
        animation: "gradient-bg 20s ease infinite",
      }}
    >
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>

      {/* 4. PASS DATA USER KE NAVBAR */}
      <Navbar activeLink="Analytics" user={user} />

      {/* --- MAIN CONTAINER --- 
          Tambahkan flex-grow agar konten mengisi ruang kosong sebelum footer
      */}
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
              Pantau pola stres & mood kamu dalam tampilan harian atau bulanan
            </p>
          </div>
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
            className="rounded-2xl p-4 md:p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "var(--brand-blue)" }}
            >
              Stress Trend ({mode})
            </h2>

            <div className="h-[200px] md:h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} width={30} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="var(--brand-blue)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Chart */}
          <div
            className="rounded-2xl p-4 md:p-6 border backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.45)",
              borderColor: "var(--glass-border)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.07)",
            }}
          >
            <h2
              className="text-lg md:text-xl font-semibold mb-4 text-center md:text-left"
              style={{ color: "var(--brand-blue)" }}
            >
              Mood Trend ({mode})
            </h2>

            <div className="h-[200px] md:h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                  <XAxis
                    dataKey={mode === "week" ? "day" : "week"}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} width={30} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--brand-blue-light)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ==== SUMMARY CARDS ==== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { title: "Average Stress", value: avgStress },
            { title: "Average Mood", value: avgMood },
            { title: "Highest Stress", value: highestStress },
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
              <p className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}
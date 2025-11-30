// src/pages/LandingPage/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Smile, BookOpen, ShieldCheck } from "lucide-react";
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";
// UBAH: Import Logo Kedip
import LogoKedip from "../../assets/images/Logo-Kedip.png"; 

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans relative overflow-x-hidden text-gray-800">
      
      {/* --- BACKGROUND GRADIENT --- */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
            backgroundColor: "#FFF3E0", // Bg Cream
            backgroundImage: `
                radial-gradient(at 10% 10%, #FFF3E0 0%, transparent 50%), 
                radial-gradient(at 90% 20%, #eaf2ff 0%, transparent 50%), 
                radial-gradient(at 50% 80%, #e3edff 0%, transparent 50%)
            `,
            backgroundSize: "200% 200%",
            animation: "gradient-bg 20s ease infinite",
        }}
      />
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-float-slow { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-30">
        <div className="flex items-center gap-2">
            <img src={LogoNostressia} alt="Logo" className="h-10 w-auto" />
            <span className="text-xl font-extrabold text-[#3664BA] hidden sm:block">Nostressia</span>
        </div>
        <div className="flex gap-4">
            <Link to="/login" className="px-5 py-2.5 font-bold text-gray-600 hover:text-[#3664BA] transition-colors">
                Sign In
            </Link>
            <Link to="/login" className="px-6 py-2.5 rounded-full bg-[#F2994A] hover:bg-[#e08e3d] text-white font-bold shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-0.5 active:scale-95">
                Get Started
            </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="max-w-7xl mx-auto px-6 pt-10 pb-24 md:pt-20 md:pb-32 flex flex-col md:flex-row items-center gap-12 text-center md:text-left relative z-20">
        
        {/* Kiri: Teks */}
        <div className="flex-1 space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/60 border border-white/40 text-[#3664BA] text-sm font-bold shadow-sm mb-2 backdrop-blur-sm">
                🚀 #1 Student Mental Health Companion
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                No Stress, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3664BA] to-[#2F80ED]">
                    More Success.
                </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto md:mx-0">
                Pahami dirimu lebih baik. Lacak mood, kelola stres akademik, dan temukan ketenangan di tengah kesibukan kuliahmu bersama Nostressia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Link to="/login" className="px-8 py-4 rounded-2xl bg-[#3664BA] hover:bg-[#2a529e] text-white text-lg font-bold shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group">
                    Mulai Sekarang <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/tips" className="px-8 py-4 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-400" /> Lihat Tips
                </Link>
            </div>

            <div className="pt-8 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                <div className="flex -space-x-2">
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/100?img=1" alt=""/>
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/100?img=2" alt=""/>
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/100?img=3" alt=""/>
                </div>
                <p>Bergabung dengan 1000+ Mahasiswa</p>
            </div>
        </div>

        {/* Kanan: Gambar Maskot (DIPERBAIKI) */}
        <div className="flex-1 relative w-full flex justify-center items-center">
            
            {/* 1. Dekorasi Blob Belakang (Layer Paling Bawah: z-0) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-200/40 rounded-full blur-3xl animate-pulse z-0"></div>
            
            {/* 2. Maskot Mengambang (Layer Paling Atas: z-20) - GUNAKAN LOGO KEDIP */}
            <img 
                src={LogoKedip} 
                alt="Nostressia Mascot Winking" 
                className="w-[85%] md:w-[95%] h-auto object-contain relative z-20 animate-float-slow drop-shadow-2xl"
            />

            {/* 3. Floating Cards Dekorasi (Layer Tengah: z-10) */}
            {/* Diposisikan agar muncul di belakang maskot */}
            <div className="absolute top-0 right-0 md:-right-4 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white/50 animate-bounce delay-700 hidden md:block z-10">
                <span className="text-3xl">😉</span>
            </div>
            <div className="absolute bottom-12 left-0 md:-left-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 animate-bounce delay-100 hidden md:block z-10 whitespace-nowrap">
                <span className="text-2xl mr-2">✨</span> <span className="text-sm font-bold text-orange-500">Feeling Good!</span>
            </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section className="py-20 bg-white/40 backdrop-blur-sm border-t border-white/50 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">Fitur Andalan Mahasiswa</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">Kami mengerti beratnya tugas dan skripsi. Nostressia hadir dengan fitur simpel untuk menjaga kewarasanmu.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Feature 1 */}
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-[#3664BA]">
                          <Activity className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">Stress Monitoring</h3>
                      <p className="text-gray-600 leading-relaxed">
                          Lacak tingkat stres harianmu berdasarkan aktivitas tidur, belajar, dan sosial. Dapatkan peringatan dini sebelum *burnout*.
                      </p>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-[#F2994A]">
                          <Smile className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">Mood Tracker</h3>
                      <p className="text-gray-600 leading-relaxed">
                          Catat bagaimana perasaanmu setiap hari. Kenali pola emosimu dan temukan apa yang membuatmu bahagia.
                      </p>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-[#27AE60]">
                          <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">Self-Care Tips</h3>
                      <p className="text-gray-600 leading-relaxed">
                          Akses ratusan tips praktis tentang tidur, nutrisi, dan manajemen waktu yang dikurasi khusus untuk mahasiswa.
                      </p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8 relative z-10">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                  <img src={LogoNostressia} alt="Logo" className="h-8 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                  <span className="text-lg font-bold text-gray-400">Nostressia</span>
              </div>
              <p className="text-gray-500 text-sm mb-8">
                  Dibuat dengan ❤️ oleh Kelompok 4 PPTI BCA untuk kesehatan mental mahasiswa Indonesia.
              </p>
              <div className="text-xs text-gray-400">
                  &copy; {new Date().getFullYear()} Nostressia. All rights reserved.
              </div>
          </div>
      </footer>

    </div>
  );
}
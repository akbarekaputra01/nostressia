// src/pages/Login/Login.jsx
import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";

import logoBuka from "../../assets/images/Logo-Buka.png";
import logoKedip from "../../assets/images/Logo-Kedip.png";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // State untuk kontrol mata
  // false = Mata Terbuka (Default), true = Sedang Kedip
  const [isWinking, setIsWinking] = useState(false);

  // --- EFEK OTOMATIS (AUTO BLINK) ---
  useEffect(() => {
    // Fungsi untuk memicu kedipan
    const triggerBlink = () => {
      setIsWinking(true); // Ganti ke gambar kedip
      
      // Tahan kedipan selama 200ms (sangat cepat seperti mata asli)
      setTimeout(() => {
        setIsWinking(false); // Balik ke mata terbuka
      }, 200); 
    };

    // Set interval: Jalankan triggerBlink setiap 3000ms (3 detik)
    const blinkInterval = setInterval(triggerBlink, 3000);

    // Bersihkan interval saat halaman ditutup agar tidak membebani memori
    return () => clearInterval(blinkInterval);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => window.location.href = "/profile", 1000);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">

      {/* --- BAGIAN KIRI (GAMBAR) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-[#f8fbff] items-center justify-center p-10 overflow-hidden">
        
        {/* Dekorasi Background */}
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000"></div>

        {/* CONTAINER LOGO */}
        <div className="relative z-10 w-full max-w-[480px] group">
            
            {/* Glow halus di belakang */}
            <div className="absolute inset-0 bg-blue-400/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* WRAPPER GAMBAR */}
            <div className="relative w-full aspect-[16/9] flex items-center justify-center">
                
                {/* GAMBAR 1: LOGO BUKA (DEFAULT / STANDBY)
                   Ini gambar utama yang selalu terlihat saat diam.
                   Akan hilang (opacity-0) HANYA saat isWinking = true.
                */}
                <img
                    src={logoBuka}
                    alt="Open"
                    className={`
                        absolute inset-0 w-full h-full object-contain
                        transition-opacity duration-150 ease-linear
                        ${isWinking ? 'opacity-0' : 'opacity-100'}
                    `}
                />

                {/* GAMBAR 2: LOGO KEDIP (ANIMASI)
                   Ini gambar kedip yang muncul sekilas.
                   Akan muncul (opacity-100) saat isWinking = true.
                */}
                <img
                    src={logoKedip}
                    alt="Wink"
                    className={`
                        absolute inset-0 w-full h-full object-contain
                        transition-opacity duration-150 ease-linear
                        ${isWinking ? 'opacity-100' : 'opacity-0'}
                    `}
                />
            </div>

            <p className="text-center text-gray-400/60 text-[10px] mt-8 font-medium tracking-widest uppercase animate-pulse">
                Your mindful companion
            </p>
        </div>
      </div>

      {/* --- BAGIAN KANAN (FORM LOGIN) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 relative bg-white">
         <div className="w-full max-w-md space-y-8 animate-fade-in-up">
            <div className="text-center lg:text-left">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="mt-3 text-lg text-gray-500">Sign in to continue your journey.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 mt-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="email"
                            placeholder="name@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                         <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                         <a href="#" className="text-sm font-bold text-blue-600 hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || isSuccess}
                    className={`
                        w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-blue-500/20 transition-all duration-300 transform 
                        flex items-center justify-center gap-2 cursor-pointer mt-6
                        ${isSuccess ? "bg-green-500 scale-95" : "bg-gray-900 hover:bg-black hover:scale-[1.02] active:scale-95"}
                    `}
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle className="w-6 h-6 animate-bounce" /> : <>Sign in <ArrowRight className="w-5 h-5" /></>}
                </button>

                <button type="button" className="w-full py-4 border border-gray-200 rounded-2xl font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 cursor-pointer mt-4">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                    <span>Sign in with Google</span>
                </button>
            </form>

            <p className="text-center text-gray-500 mt-8 font-medium">
                Don't have an account? <span className="text-blue-600 font-bold cursor-pointer hover:underline">Sign up free</span>
            </p>
         </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
}
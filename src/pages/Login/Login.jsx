// src/pages/Login/Login.jsx
import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, User } from "lucide-react";
import { motion } from "framer-motion";

import logoBuka from "../../assets/images/Logo-Buka.png";
import logoKedip from "../../assets/images/Logo-Kedip.png";

export default function Login() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // State Flip: false = Login, true = Sign Up
  const [isFlipped, setIsFlipped] = useState(false);

  // State untuk kontrol mata (Animasi Gambar Kiri)
  const [isWinking, setIsWinking] = useState(false);

  // --- EFEK OTOMATIS (AUTO BLINK) ---
  useEffect(() => {
    const triggerBlink = () => {
      setIsWinking(true); 
      setTimeout(() => { setIsWinking(false); }, 150); 
    };
    const blinkInterval = setInterval(triggerBlink, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Handler Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        // Redirect ke Dashboard setelah Login Berhasil
        setTimeout(() => window.location.href = "/", 1000); 
    }, 2000);
  };

  // Handler Sign Up (DIPERBARUI)
  const handleSignUp = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;
    setIsLoading(true);
    
    // Simulasi Proses Sign Up
    setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        
        // Setelah sukses sign up (1 detik kemudian):
        setTimeout(() => {
            setIsSuccess(false); // Matikan status sukses
            setIsFlipped(false); // FLIP BALIK KE LOGIN
            setFormData({ name: "", email: "", password: "" }); // KOSONGKAN FORM
            // Opsional: Anda bisa tambahkan alert atau toast disini: "Akun dibuat! Silakan login."
        }, 1000); 
    }, 2000);
  };

  // Reset form saat flip manual (tombol teks bawah)
  const toggleFlip = () => {
      setIsFlipped(!isFlipped);
      setFormData({ name: "", email: "", password: "" });
      setIsSuccess(false);
      setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">

      {/* --- BAGIAN KIRI (GAMBAR TETAP STATIS) --- */}
      <div className="hidden lg:flex w-1/2 relative bg-[#f8fbff] items-center justify-center p-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-[480px] group">
            <div className="absolute inset-0 bg-blue-400/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-full flex items-center justify-center">
                {/* LAYER 1: BASE (Mata Kedip - Di Bawah) */}
                <img src={logoKedip} alt="Nostressia Wink" className="w-full h-auto object-contain relative z-10" />
                {/* LAYER 2: OVERLAY (Mata Terbuka - Di Atas) */}
                <motion.img src={logoBuka} alt="Nostressia Open" className="absolute top-0 left-0 w-full h-full object-contain z-20" initial={{ opacity: 1 }} animate={{ opacity: isWinking ? 0 : 1 }} transition={{ duration: 0.1 }} />
            </div>
            <p className="text-center text-gray-400/60 text-[10px] mt-8 font-medium tracking-widest uppercase animate-pulse">No stress, More success</p>
        </div>
      </div>

      {/* --- BAGIAN KANAN (FORM FLIP) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-24 relative bg-white perspective-[1000px]">
         
         {/* CONTAINER FLIP */}
         <motion.div 
            className="relative w-full max-w-md h-[600px]" 
            animate={{ rotateY: isFlipped ? -180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
            style={{ transformStyle: "preserve-3d" }}
         >

            {/* ========================================================= */}
            {/* SIDE A: LOGIN FORM (DEPAN) */}
            {/* ========================================================= */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col justify-center"
                style={{ backfaceVisibility: "hidden" }} 
            >
                <div className="text-center lg:text-left">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                    <p className="mt-3 text-lg text-gray-500">Sign in to continue your journey.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 mt-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                            <input type="email" placeholder="name@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between"><label className="text-sm font-bold text-gray-700 ml-1">Password</label><a href="#" className="text-sm font-bold text-blue-600 hover:underline">Forgot password?</a></div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                            <input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading || isSuccess} className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-blue-500/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer mt-6 ${isSuccess ? "bg-green-500 scale-95" : "bg-gray-900 hover:bg-black hover:scale-[1.02] active:scale-95"}`}>
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle className="w-6 h-6 animate-bounce" /> : <>Sign in <ArrowRight className="w-5 h-5" /></>}
                    </button>

                    <button type="button" className="w-full py-4 border border-gray-200 rounded-2xl font-bold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 cursor-pointer mt-4">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
                        <span>Sign in with Google</span>
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-8 font-medium">
                    Don't have an account? <button onClick={toggleFlip} className="text-blue-600 font-bold cursor-pointer hover:underline ml-1">Sign up free</button>
                </p>
            </div>


            {/* ========================================================= */}
            {/* SIDE B: SIGN UP FORM (BELAKANG) */}
            {/* ========================================================= */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col justify-center"
                style={{ 
                    backfaceVisibility: "hidden", 
                    transform: "rotateY(180deg)" 
                }} 
            >
                <div className="text-center lg:text-left">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
                    <p className="mt-3 text-lg text-gray-500">Join Nostressia for a better life.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4 mt-8">
                    {/* Extra Field: Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div>
                            <input type="text" placeholder="Your Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div>
                            <input type="email" placeholder="name@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div>
                            <input type="password" placeholder="Create a password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading || isSuccess} className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-orange-500/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer mt-6 ${isSuccess ? "bg-green-500 scale-95" : "bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-95"}`}>
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle className="w-6 h-6 animate-bounce" /> : <>Sign Up Free <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>

                <p className="text-center text-gray-500 mt-8 font-medium">
                    Already have an account? <button onClick={toggleFlip} className="text-orange-500 font-bold cursor-pointer hover:underline ml-1">Sign in</button>
                </p>
            </div>

         </motion.div>
      </div>

      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
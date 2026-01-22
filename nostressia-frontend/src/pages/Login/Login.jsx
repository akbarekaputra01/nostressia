// src/pages/Login/Login.jsx
import React, { useState, useEffect, useRef } from "react"; 
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import { BASE_URL } from "../../api/config"; 
import { isAuthTokenValid, persistAuthToken } from "../../utils/auth";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, User, Calendar, AtSign, Users, Check, Eye, EyeOff, ShieldCheck, ArrowLeft, X, Clock } from "lucide-react"; 
import { motion as Motion, AnimatePresence } from "framer-motion";

import logoBuka from "../../assets/images/Logo-Buka.png";
import logoKedip from "../../assets/images/Logo-Kedip.png";

import avatar1 from "../../assets/images/avatar1.png";
import avatar2 from "../../assets/images/avatar2.png"; 
import avatar3 from "../../assets/images/avatar3.png"; 
import avatar4 from "../../assets/images/avatar4.png";
import avatar5 from "../../assets/images/avatar5.png";

const AVATAR_OPTIONS = [avatar1, avatar4, avatar3, avatar5, avatar2];

// STATE AWAL (KOSONG)
const INITIAL_FORM_DATA = { 
  name: "", username: "", email: "", password: "", confirmPassword: "", gender: "", dob: "", avatar: AVATAR_OPTIONS[0] 
};

export default function Login() {
  const navigate = useNavigate(); 
  
  // --- STATE UTAMA ---
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // --- STATE UI ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  
  // --- STATE & REF KHUSUS OTP REGISTER (6 Digit) ---
  const [otp, setOtp] = useState("");
  const otpInputRef = useRef(null);

  // --- STATE FORGOT PASSWORD ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [forgotEmail, setForgotEmail] = useState("");
  
  // OTP Forgot (6 Digit Array untuk Input Terpisah)
  const [forgotOtpValues, setForgotOtpValues] = useState(new Array(6).fill(""));
  const forgotOtpRefs = useRef([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingForgot, setLoadingForgot] = useState(false);

  // --- STATE COUNTDOWN ---
  const [countdown, setCountdown] = useState(0);

  // --- EFEK KEDIP ---
  useEffect(() => {
    const triggerBlink = () => { setIsWinking(true); setTimeout(() => { setIsWinking(false); }, 150); };
    const blinkInterval = setInterval(triggerBlink, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // --- EFEK COUNTDOWN TIMER ---
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // --- EFEK AUTO FOCUS INPUT OTP REGISTER ---
  useEffect(() => {
    if (showOTPForm && !isSuccess && otpInputRef.current) {
        setTimeout(() => {
            otpInputRef.current?.focus();
        }, 100);
    }
  }, [showOTPForm, isSuccess]);

  // --- EFEK AUTO FOCUS INPUT OTP FORGOT (Step 2) ---
  useEffect(() => {
    if (showForgotModal && forgotStep === 2) {
        setTimeout(() => {
            forgotOtpRefs.current[0]?.focus();
        }, 100);
    }
  }, [showForgotModal, forgotStep]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- 1. LOGIKA LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: formData.email, password: formData.password
        });
        const token =
          response?.data?.accessToken ||
          response?.data?.access_token ||
          response?.data?.token;
        if (!isAuthTokenValid(token)) {
          alert("Login berhasil, tetapi token tidak valid.");
          return;
        }
        persistAuthToken(token);
        setIsSuccess(true);
        setTimeout(() => navigate("/dashboard"), 1000); 
    } catch (error) {
        alert(error.response?.data?.detail || "Login Gagal.");
    } finally { setIsLoading(false); }
  };

  // --- 2. LOGIKA REGISTER ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.gender || !formData.dob) {
        alert("Mohon lengkapi semua data!"); return;
    }
    if (formData.password !== formData.confirmPassword) {
        alert("Password dan Konfirmasi Password tidak cocok!"); return;
    }
    if (!window.confirm(`Please confirm your details:\n\nName: ${formData.name}\nEmail: ${formData.email}\n\nCorrect?`)) return;
    
    setIsLoading(true);
    try {
        await axios.post(`${BASE_URL}/auth/register`, {
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            gender: formData.gender,
            userDob: formData.dob,
            avatar: formData.avatar
        });
        
        setOtp(""); 
        setShowOTPForm(true); 
        setCountdown(60);

    } catch (error) {
        alert(error.response?.data?.detail || "Registrasi Gagal.");
    } finally { setIsLoading(false); }
  };

  // --- 3. LOGIKA VERIFIKASI OTP REGISTER ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault(); 
    if (otp.length !== 6) return alert("Mohon masukkan 6 digit kode OTP!");
    
    setIsLoading(true);
    try {
        await axios.post(`${BASE_URL}/auth/verify-otp`, { email: formData.email, otpCode: otp });
        
        setIsSuccess(true); 
        setCountdown(0);
        
        setTimeout(() => {
            setIsSuccess(false); 
            setShowOTPForm(false); 
            setIsFlipped(false); 
            setOtp("");
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "" })); 
        }, 2000);

    } catch (error) {
        alert(error.response?.data?.detail || "Kode OTP Salah.");
    } finally { setIsLoading(false); }
  };

  // ==========================================
  // LOGIKA BARU FORGOT PASSWORD (STEPPER 3 DOTS)
  // ==========================================

  // Step 1: Request OTP
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if(!forgotEmail) return alert("Masukkan email Anda!");
    setLoadingForgot(true);
    try {
        await axios.post(`${BASE_URL}/auth/forgot-password`, { email: forgotEmail });
        
        setForgotStep(2); 
        setCountdown(60); 
        setForgotOtpValues(new Array(6).fill("")); // Reset field OTP
    } catch (error) {
        alert(error.response?.data?.detail || "Email tidak ditemukan.");
    } finally { setLoadingForgot(false); }
  };

  // Helper Input OTP
  const handleForgotOtpChange = (index, value) => {
    if (isNaN(value)) return; 
    const newOtp = [...forgotOtpValues];
    newOtp[index] = value;
    setForgotOtpValues(newOtp);

    if (value && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtpValues[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
        e.preventDefault(); // PENTING: Mencegah submit form default
        handleForgotVerifyStep(e);
    }
  };

  // Step 2: Verify OTP (FIXED VALIDATION)
  const handleForgotVerifyStep = async (e) => {
      if (e) e.preventDefault();
      
      const code = forgotOtpValues.join("");
      if (code.length !== 6) {
          alert("Mohon masukkan 6 digit kode OTP!");
          return;
      }
      
      setLoadingForgot(true);
      try {
          setForgotStep(3);
      } finally {
          setLoadingForgot(false);
      }
  };

  // Step 3: Reset Password
  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    if(!newPassword || !confirmNewPassword) return alert("Mohon isi password baru!");
    if(newPassword !== confirmNewPassword) return alert("Konfirmasi password tidak cocok!");

    const code = forgotOtpValues.join(""); 
    setLoadingForgot(true);
    try {
        await axios.post(`${BASE_URL}/auth/reset-password-confirm`, {
            email: forgotEmail, otpCode: code, newPassword
        });
        
        alert("Password berhasil diubah! Silakan login.");
        setCountdown(0);
        setShowForgotModal(false);
        setForgotStep(1);
        
        // Reset Form
        setForgotEmail(""); 
        setForgotOtpValues(new Array(6).fill("")); 
        setNewPassword(""); 
        setConfirmNewPassword("");
        
    } catch (error) {
        alert(error.response?.data?.detail || "Gagal mereset password.");
    } finally { setLoadingForgot(false); }
  };


  const toggleFlip = () => {
      setIsFlipped(!isFlipped);
      setFormData(INITIAL_FORM_DATA);
      setShowLoginPassword(false); 
      setShowSignUpPassword(false); 
      setIsSuccess(false); 
      setIsLoading(false); 
      setShowOTPForm(false); 
      setOtp("");
      setCountdown(0);
  };

  return (
    <div className="h-screen w-full flex font-sans bg-white overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-[#f8fbff] items-center justify-center p-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100/40 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000"></div>
        <div className="relative z-10 w-full max-w-[480px] group">
            <div className="absolute inset-0 bg-blue-400/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-full flex items-center justify-center">
                <img src={logoKedip} alt="Nostressia Wink" className="w-full h-auto object-contain relative z-10" />
                <Motion.img src={logoBuka} alt="Nostressia Open" className="absolute top-0 left-0 w-full h-full object-contain z-20" initial={{ opacity: 1 }} animate={{ opacity: isWinking ? 0 : 1 }} transition={{ duration: 0.1 }} />
            </div>
            <p className="text-center text-gray-400/60 text-[10px] mt-8 font-medium tracking-widest uppercase animate-pulse">No stress, More success</p>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 relative bg-white perspective-[1000px]">
         <Motion.div 
           className="relative w-full max-w-md h-[85vh] max-h-[850px] min-h-[600px]" 
           animate={{ rotateY: isFlipped ? -180 : 0 }}
           transition={{ duration: 0.6, type: "spring", stiffness: 50, damping: 15 }}
           style={{ transformStyle: "preserve-3d" }}
         >
            {/* FRONT: LOGIN */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col justify-center rounded-2xl" 
                style={{ backfaceVisibility: "hidden", zIndex: isFlipped ? 0 : 1 }}
            >
                <div className="text-center lg:text-left mb-6">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                    <p className="mt-3 text-lg text-gray-500">Sign in to continue your journey.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email or Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                            <input type="text" placeholder="Username or email@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between"><label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                        <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">Forgot password?</button>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" /></div>
                            <input type={showLoginPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-gray-400 hover:text-blue-600 transition-colors">{showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading || isSuccess} className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-blue-500/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer mt-6 ${isSuccess ? "bg-green-500 scale-95" : "bg-gray-900 hover:bg-black hover:scale-[1.02] active:scale-95"}`}>
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle className="w-6 h-6 animate-bounce" /> : <>Sign in <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>
                <p className="text-center text-gray-500 mt-8 font-medium">Don't have an account? <button onClick={toggleFlip} className="text-blue-600 font-bold cursor-pointer hover:underline ml-1">Sign up free</button></p>
            </div>

            {/* BACK: REGISTER / OTP / SUCCESS */}
            <div 
                className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col rounded-2xl" 
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", zIndex: isFlipped ? 1 : 0 }}
            >
                {showOTPForm ? (
                    // TAMPILAN SUKSES / VERIFIED REGISTER
                    isSuccess ? (
                        <div className="flex flex-col h-full justify-center items-center text-center p-6 animate-fade-in">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={3} />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Verified!</h2>
                            <p className="text-gray-500">Your account has been verified successfully.</p>
                            <p className="text-sm text-gray-400 mt-6 animate-pulse">Redirecting to login...</p>
                        </div>
                    ) : (
                        // TAMPILAN OTP REGISTER (6 DIGIT)
                        <div className="flex flex-col h-full justify-center items-center text-center p-4 animate-fade-in">
                            <div className="bg-orange-100 p-4 rounded-full mb-6 text-orange-600 animate-bounce"><ShieldCheck size={48} /></div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Verify Account</h2>
                            <p className="text-gray-500 mb-8 max-w-xs">We sent a code to <br/> <span className="font-bold text-gray-800">{formData.email}</span></p>
                            
                            <div className="w-full max-w-xs space-y-6">
                                <div className="relative w-full mb-6 cursor-text" onClick={() => otpInputRef.current?.focus()}>
                                    <input
                                        ref={otpInputRef}
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setOtp(val);
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOTP(e); }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[40px] tracking-[1em]"
                                        autoFocus
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                    />
                                    <div className="flex justify-center gap-3">
                                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                                            const digit = otp[idx];
                                            const isActive = idx === otp.length;
                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`w-10 h-12 flex items-center justify-center transition-all duration-200 border rounded-lg
                                                        ${isActive ? 'border-orange-500 ring-4 ring-orange-500/10 bg-orange-50' : 'border-gray-200 bg-white'}
                                                        ${digit ? 'border-gray-300 bg-gray-50' : ''}
                                                    `}
                                                >
                                                    {digit ? (
                                                        <span className="text-2xl font-bold text-gray-900 animate-popIn">{digit}</span>
                                                    ) : (
                                                        isActive ? (
                                                            <div className="w-0.5 h-6 bg-orange-500 animate-blink"></div>
                                                        ) : (
                                                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">Type the 6-digit code</p>
                                </div>

                                <button onClick={handleVerifyOTP} disabled={isLoading || otp.length < 6} className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 cursor-pointer transition-all ${otp.length < 6 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Verify Code"}
                                </button>
                                
                                <div className="text-center">
                                    {countdown > 0 ? (
                                        <p className="text-sm font-medium text-gray-400 flex items-center justify-center gap-1">
                                            <Clock size={14} className="animate-pulse" /> Resend in <span className="text-orange-600 font-bold">{formatTime(countdown)}</span>
                                        </p>
                                    ) : (
                                        <button type="button" onClick={() => { setCountdown(60); alert("Kode dikirim ulang!"); }} className="text-sm font-bold text-orange-600 hover:underline cursor-pointer">
                                            Resend Code
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setShowOTPForm(false)} className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><ArrowLeft size={16} /> Back to Register</button>
                        </div>
                    )
                ) : (
                    <>
                        <div className="flex-none pt-2 pb-4 text-center lg:text-left border-b border-gray-50 mb-2">
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
                            <p className="mt-1 text-sm text-gray-500">Join Nostressia for a better life.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleSignUp} className="space-y-4 pb-2">
                                {/* FORM REGISTER INPUTS (SAME AS BEFORE) */}
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Full Name</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Username</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><AtSign className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="text" placeholder="your_username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Email</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="email" placeholder="name@gmail.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-3">
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Password</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type={showSignUpPassword ? "text" : "password"} placeholder="••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Confirm Password</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><CheckCircle className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type={showSignUpPassword ? "text" : "password"} placeholder="••••••" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                    <div className="flex items-center gap-2 pl-1"><div className="relative flex items-center"><input type="checkbox" id="showPw" checked={showSignUpPassword} onChange={() => setShowSignUpPassword(!showSignUpPassword)} className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-orange-500 checked:border-orange-500 transition-all" /><Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} strokeWidth={4} /></div><label htmlFor="showPw" className="text-xs font-bold text-gray-600 cursor-pointer select-none">Show Password</label></div>
                                </div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Pick Your Avatar</label><div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-2">{AVATAR_OPTIONS.map((avatarUrl, index) => (<div key={index} onClick={() => setFormData({ ...formData, avatar: avatarUrl })} className={`relative cursor-pointer transition-all duration-300 rounded-full p-0.5 ${formData.avatar === avatarUrl ? 'ring-2 ring-orange-500 scale-110 shadow-sm' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}><img src={avatarUrl} alt={`Avatar ${index + 1}`} className="w-10 h-10 rounded-full object-cover bg-white" />{formData.avatar === avatarUrl && (<div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-0.5 border border-white"><Check size={8} strokeWidth={4} /></div>)}</div>))}</div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Gender</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Users className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium appearance-none cursor-pointer"><option value="" disabled>Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Prefer not say</option></select></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Date of Birth</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter') handleSignUp(e); }} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium cursor-pointer" /></div></div>
                            </form>
                        </div>
                        <div className="flex-none pt-4 pb-2 text-center bg-white border-t border-gray-50">
                            <button onClick={handleSignUp} disabled={isLoading} className={`w-full py-3.5 rounded-xl font-bold text-white text-base shadow-lg shadow-orange-500/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-95`}>
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign Up Free <ArrowRight className="w-4 h-4" /></>}
                            </button>
                            <p className="text-gray-500 mt-3 font-medium text-sm">Already have an account? <button onClick={toggleFlip} className="text-blue-600 font-bold cursor-pointer hover:underline ml-1">Sign in</button></p>
                        </div>
                    </>
                )}
            </div>
         </Motion.div>
      </div>

      {/* --- MODAL FORGOT PASSWORD (STEPPER) --- */}
      <AnimatePresence>
        {showForgotModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <Motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.95 }} 
                    className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6">
                        {/* HEADER: TITLE & CLOSE & STEPPER DOTS */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Forgot Password</h3>
                                <div className="flex gap-2 mt-2">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className={`h-2 rounded-full transition-all duration-300 ${forgotStep >= step ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => {setShowForgotModal(false); setForgotStep(1); setCountdown(0);}} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
                        </div>

                        {/* STEP 1: EMAIL INPUT */}
                        {forgotStep === 1 && (
                            <form onSubmit={handleForgotRequest} className="space-y-4 animate-fade-in">
                                <p className="text-sm text-gray-500">Enter your email address to receive a 6-digit verification code.</p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 ml-1">Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400 group-focus-within:text-blue-600" /></div>
                                        <input type="email" placeholder="name@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" required autoFocus />
                                    </div>
                                </div>
                                <button type="submit" disabled={loadingForgot} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-blue-600/20">
                                    {loadingForgot ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next <ArrowRight size={16} className="ml-2" /></>}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: OTP INPUT (6 DIGIT) */}
                        {forgotStep === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-4">Enter the 6-digit code sent to <br/><span className="font-bold text-gray-800">{forgotEmail}</span></p>
                                    {/* 6 Segmented Input */}
                                    <div className="flex justify-center gap-2 mb-2">
                                        {forgotOtpValues.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (forgotOtpRefs.current[index] = el)}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleForgotOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleForgotOtpKeyDown(index, e)}
                                                className={`w-10 h-12 border-2 rounded-lg text-center text-xl font-bold bg-gray-50 focus:bg-white outline-none transition-all
                                                    ${digit ? 'border-blue-500 text-gray-900' : 'border-gray-200 text-transparent'}
                                                    focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                                `}
                                                inputMode="numeric"
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center mt-4">
                                        {countdown > 0 ? (
                                            <p className="text-xs font-medium text-gray-400 flex items-center justify-center gap-1">
                                                <Clock size={12} className="animate-pulse" /> Resend in <span className="text-blue-600 font-bold">{formatTime(countdown)}</span>
                                            </p>
                                        ) : (
                                            <button type="button" onClick={() => { setCountdown(60); alert("Kode dikirim ulang!"); }} className="text-sm font-bold text-orange-600 hover:underline cursor-pointer">
                                                Resend Code
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* PENTING: type="button" untuk mencegah submit form default */}
                                <button type="button" onClick={handleForgotVerifyStep} disabled={loadingForgot || forgotOtpValues.some(v => !v)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loadingForgot ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Next"}
                                </button>
                            </div>
                        )}

                        {/* STEP 3: NEW PASSWORD */}
                        {forgotStep === 3 && (
                            <form onSubmit={handleForgotConfirm} className="space-y-4 animate-fade-in">
                                <p className="text-sm text-gray-500">Create a new password for your account.</p>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={16} className="text-gray-400 group-focus-within:text-blue-600" /></div>
                                            <input type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" required />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-700 ml-1">Confirm Password</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CheckCircle size={16} className="text-gray-400 group-focus-within:text-blue-600" /></div>
                                            <input type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" required />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-1">
                                        <input type="checkbox" id="showNewPw" checked={showNewPassword} onChange={() => setShowNewPassword(!showNewPassword)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                                        <label htmlFor="showNewPw" className="text-xs font-bold text-gray-600 cursor-pointer select-none">Show Password</label>
                                    </div>
                                </div>
                                <button type="submit" disabled={loadingForgot} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-green-600/20">
                                    {loadingForgot ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                </Motion.div>
            </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s step-end infinite; }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-popIn { animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
}

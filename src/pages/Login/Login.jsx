// src/pages/Login/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import { BASE_URL } from "../../api/config"; 
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, User, Calendar, AtSign, Users, Check, Eye, EyeOff, ShieldCheck, ArrowLeft, X } from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

import logoBuka from "../../assets/images/Logo-Buka.png";
import logoKedip from "../../assets/images/Logo-Kedip.png";

import avatar1 from "../../assets/images/avatar1.png";
import avatar2 from "../../assets/images/avatar2.png"; 
import avatar3 from "../../assets/images/avatar3.png"; 
import avatar4 from "../../assets/images/avatar4.png";
import avatar5 from "../../assets/images/avatar5.png";

const AVATAR_OPTIONS = [avatar1, avatar4, avatar3, avatar5, avatar2];

export default function Login() {
  const navigate = useNavigate(); 
  
  // --- STATE UTAMA ---
  const [formData, setFormData] = useState({ 
    name: "", username: "", email: "", password: "", confirmPassword: "", gender: "", dob: "", avatar: AVATAR_OPTIONS[0] 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // --- STATE UI ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otp, setOtp] = useState("");

  // --- STATE FORGOT PASSWORD ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loadingForgot, setLoadingForgot] = useState(false);

  // --- EFEK KEDIP ---
  useEffect(() => {
    const triggerBlink = () => { setIsWinking(true); setTimeout(() => { setIsWinking(false); }, 150); };
    const blinkInterval = setInterval(triggerBlink, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // --- 1. LOGIKA LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    try {
        const response = await axios.post(`${BASE_URL}/user/login`, {
            identifier: formData.email, password: formData.password
        });
        localStorage.setItem("token", response.data.access_token);
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
        await axios.post(`${BASE_URL}/user/register`, {
            name: formData.name, userName: formData.username, email: formData.email, password: formData.password, gender: formData.gender, dob: formData.dob, avatar: formData.avatar
        });
        setIsSuccess(true);
        setTimeout(() => { setIsSuccess(false); setShowOTPForm(true); }, 1500); 
    } catch (error) {
        alert(error.response?.data?.detail || "Registrasi Gagal.");
    } finally { setIsLoading(false); }
  };

  // --- 3. LOGIKA VERIFIKASI OTP REGISTER ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return alert("Masukkan kode OTP!");
    setIsLoading(true);
    try {
        await axios.post(`${BASE_URL}/user/verify-otp`, { email: formData.email, otp_code: otp });
        setIsSuccess(true);
        alert("Akun berhasil diverifikasi! Silakan Login.");
        setTimeout(() => {
            setIsSuccess(false); setShowOTPForm(false); setIsFlipped(false); setOtp("");
            setFormData({ ...formData, password: "", confirmPassword: "" }); 
        }, 1500);
    } catch (error) {
        alert(error.response?.data?.detail || "Kode OTP Salah.");
    } finally { setIsLoading(false); }
  };

  // --- 4. LOGIKA FORGOT PASSWORD ---
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if(!forgotEmail) return alert("Masukkan email Anda!");
    setLoadingForgot(true);
    try {
        await axios.post(`${BASE_URL}/user/forgot-password`, { email: forgotEmail });
        setForgotStep(2); // Pindah ke step input OTP
        alert("Kode OTP telah dikirim ke email Anda.");
    } catch (error) {
        alert(error.response?.data?.detail || "Email tidak ditemukan.");
    } finally { setLoadingForgot(false); }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    if(!forgotOtp || !newPassword) return alert("Lengkapi data!");
    setLoadingForgot(true);
    try {
        await axios.post(`${BASE_URL}/user/reset-password-confirm`, {
            email: forgotEmail, otp_code: forgotOtp, new_password: newPassword
        });
        alert("Password berhasil diubah! Silakan login.");
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail(""); setForgotOtp(""); setNewPassword("");
    } catch (error) {
        alert(error.response?.data?.detail || "Gagal mereset password.");
    } finally { setLoadingForgot(false); }
  };

  const toggleFlip = () => {
      setIsFlipped(!isFlipped);
      if(!isSuccess) setFormData({ ...formData, password: "", confirmPassword: "" });
      setShowLoginPassword(false); setShowSignUpPassword(false); setIsSuccess(false); setIsLoading(false); setShowOTPForm(false); setOtp("");
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
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col justify-center rounded-2xl" style={{ backfaceVisibility: "hidden" }}>
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
                        {/* BUTTON FORGOT PASSWORD */}
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

            {/* BACK: REGISTER / OTP */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white flex flex-col rounded-2xl" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {showOTPForm ? (
                    <div className="flex flex-col h-full justify-center items-center text-center p-4 animate-fade-in">
                        <div className="bg-orange-100 p-4 rounded-full mb-6 text-orange-600 animate-bounce"><ShieldCheck size={48} /></div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Verify Account</h2>
                        <p className="text-gray-500 mb-8 max-w-xs">We sent a code to <br/> <span className="font-bold text-gray-800">{formData.email}</span></p>
                        <form onSubmit={handleVerifyOTP} className="w-full max-w-xs space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-sm font-bold text-gray-700 ml-1">Enter OTP Code</label>
                                <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center tracking-[0.5em] text-2xl font-bold py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all" maxLength={6} />
                            </div>
                            <button type="submit" disabled={isLoading || isSuccess} className="w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 cursor-pointer">{isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Verify Code"}</button>
                        </form>
                        <button onClick={() => setShowOTPForm(false)} className="mt-8 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"><ArrowLeft size={16} /> Back to Register</button>
                    </div>
                ) : (
                    <>
                        <div className="flex-none pt-2 pb-4 text-center lg:text-left border-b border-gray-50 mb-2">
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
                            <p className="mt-1 text-sm text-gray-500">Join Nostressia for a better life.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <form onSubmit={handleSignUp} className="space-y-4 pb-2">
                                {/* FORM REGISTER INPUTS (SAMA SEPERTI SEBELUMNYA) */}
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Full Name</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="text" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Username</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><AtSign className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="text" placeholder="your_username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Email</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="email" placeholder="name@gmail.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                <div className="space-y-3">
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Password</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Lock className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type={showSignUpPassword ? "text" : "password"} placeholder="••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                    <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Confirm Password</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><CheckCircle className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type={showSignUpPassword ? "text" : "password"} placeholder="••••••" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium" /></div></div>
                                    <div className="flex items-center gap-2 pl-1"><div className="relative flex items-center"><input type="checkbox" id="showPw" checked={showSignUpPassword} onChange={() => setShowSignUpPassword(!showSignUpPassword)} className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:bg-orange-500 checked:border-orange-500 transition-all" /><Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} strokeWidth={4} /></div><label htmlFor="showPw" className="text-xs font-bold text-gray-600 cursor-pointer select-none">Show Password</label></div>
                                </div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Pick Your Avatar</label><div className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-2">{AVATAR_OPTIONS.map((avatarUrl, index) => (<div key={index} onClick={() => setFormData({ ...formData, avatar: avatarUrl })} className={`relative cursor-pointer transition-all duration-300 rounded-full p-0.5 ${formData.avatar === avatarUrl ? 'ring-2 ring-orange-500 scale-110 shadow-sm' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}><img src={avatarUrl} alt={`Avatar ${index + 1}`} className="w-10 h-10 rounded-full object-cover bg-white" />{formData.avatar === avatarUrl && (<div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-0.5 border border-white"><Check size={8} strokeWidth={4} /></div>)}</div>))}</div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Gender</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Users className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium appearance-none cursor-pointer"><option value="" disabled>Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Prefer not say</option></select></div></div>
                                <div className="space-y-1"><label className="text-xs font-bold text-gray-700 ml-1">Date of Birth</label><div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" /></div><input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} onKeyDown={(e) => { if (e.key === 'Enter') handleSignUp(e); }} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 outline-none transition-all font-medium cursor-pointer" /></div></div>
                            </form>
                        </div>
                        <div className="flex-none pt-4 pb-2 text-center bg-white border-t border-gray-50">
                            <button onClick={handleSignUp} disabled={isLoading || isSuccess} className={`w-full py-3.5 rounded-xl font-bold text-white text-base shadow-lg shadow-orange-500/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer ${isSuccess ? "bg-green-500 scale-95" : "bg-orange-500 hover:bg-orange-600 hover:scale-[1.02] active:scale-95"}`}>{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <CheckCircle className="w-5 h-5 animate-bounce" /> : <>Sign Up Free <ArrowRight className="w-4 h-4" /></>}</button>
                            <p className="text-gray-500 mt-3 font-medium text-sm">Already have an account? <button onClick={toggleFlip} className="text-orange-500 font-bold cursor-pointer hover:underline ml-1">Sign in</button></p>
                        </div>
                    </>
                )}
            </div>
         </Motion.div>
      </div>

      {/* --- MODAL FORGOT PASSWORD (NEW) --- */}
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
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{forgotStep === 1 ? "Reset Password" : "Confirm Reset"}</h3>
                            <button onClick={() => {setShowForgotModal(false); setForgotStep(1);}} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        {forgotStep === 1 ? (
                            <form onSubmit={handleForgotRequest} className="space-y-4">
                                <p className="text-sm text-gray-500">Enter your email address and we'll send you an OTP code to reset your password.</p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 ml-1">Email</label>
                                    <input type="email" placeholder="name@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none" required />
                                </div>
                                <button type="submit" disabled={loadingForgot} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center cursor-pointer">
                                    {loadingForgot ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleForgotConfirm} className="space-y-4">
                                <p className="text-sm text-gray-500">Enter the OTP code sent to <b>{forgotEmail}</b> and your new password.</p>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 ml-1">OTP Code</label>
                                    <input type="text" placeholder="123456" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center font-bold tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-700 ml-1">New Password</label>
                                    <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
                                </div>
                                <button type="submit" disabled={loadingForgot} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex justify-center items-center cursor-pointer">
                                    {loadingForgot ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
                                </button>
                            </form>
                        )}
                    </div>
                </Motion.div>
            </div>
        )}
      </AnimatePresence>

      <a href="/dashboard" className="fixed bottom-4 right-4 z-[9999] bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl transition-all opacity-60 hover:opacity-100 hover:scale-105 no-underline flex items-center gap-2 cursor-pointer" title="Klik untuk langsung masuk ke Dashboard (Mode Developer)"><span>🔓</span> Skip Login</a>
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
      `}</style>
    </div>
  );
}
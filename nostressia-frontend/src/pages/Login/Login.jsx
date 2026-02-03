// src/pages/Login/Login.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  forgotPassword,
  login,
  register,
  resetPasswordConfirm,
  verifyOtp,
  verifyResetPasswordOtp,
} from "../../services/authService";
import { isAuthTokenValid, persistAuthToken } from "../../utils/auth";
import { useTheme } from "../../theme/ThemeProvider"; // [CHECK] Pastikan path ini benar
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle,
  User,
  Calendar,
  AtSign,
  Users,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  X,
  Clock,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import Toast from "../../components/Toast";
import ConfirmModal from "../../components/ConfirmModal";
import PageMeta from "../../components/PageMeta";

// --- IMPORT LOGO (Light & Dark) ---
import logoBuka from "../../assets/images/Logo-Buka.png";
import logoBukaDark from "../../assets/images/Logo-Buka-Dark.png";
import logoKedip from "../../assets/images/Logo-Kedip.png";
import logoKedipDark from "../../assets/images/Logo-Kedip-Dark.png";

import avatar1 from "../../assets/images/avatar1.png";
import avatar2 from "../../assets/images/avatar2.png";
import avatar3 from "../../assets/images/avatar3.png";
import avatar4 from "../../assets/images/avatar4.png";
import avatar5 from "../../assets/images/avatar5.png";

const AVATAR_OPTIONS = [avatar1, avatar4, avatar3, avatar5, avatar2];

const INITIAL_FORM_DATA = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  gender: "",
  dob: "",
  avatar: AVATAR_OPTIONS[0],
};

export default function Login() {
  const navigate = useNavigate();
  
  // [PERBAIKAN] Mengambil resolvedTheme dari ThemeProvider
  // resolvedTheme nilainya otomatis 'light' atau 'dark' (sudah menghandle 'system')
  const { resolvedTheme } = useTheme(); 

  // --- Core state ---
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- UI state ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);

  // --- OTP register state & ref (6 digits) ---
  const [otp, setOtp] = useState("");
  const otpInputRef = useRef(null);

  // --- Forgot password state ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");

  const [forgotOtpValues, setForgotOtpValues] = useState(new Array(6).fill(""));
  const forgotOtpRefs = useRef([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);

  // --- Countdown state ---
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Yes",
    onConfirm: null,
  });

  // [PERBAIKAN] Gunakan resolvedTheme langsung
  const isDarkMode = resolvedTheme === "dark";

  // --- Blink effect ---
  useEffect(() => {
    const triggerBlink = () => {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 150);
    };
    const blinkInterval = setInterval(triggerBlink, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // --- Countdown timer effect ---
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // --- Auto-focus OTP register input ---
  useEffect(() => {
    if (showOTPForm && !isSuccess && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [showOTPForm, isSuccess]);

  // --- Auto-focus forgot OTP input (step 2) ---
  useEffect(() => {
    if (showForgotModal && forgotStep === 2) {
      setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
    }
  }, [showForgotModal, forgotStep]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openConfirm = (config) => {
    setConfirmState({
      isOpen: true,
      title: config.title || "Confirm action",
      message: config.message || "Are you sure?",
      confirmLabel: config.confirmLabel || "Yes",
      onConfirm: config.onConfirm || null,
    });
  };

  const handleConfirm = async () => {
    if (confirmState.onConfirm) {
      await confirmState.onConfirm();
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleCancelConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

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

  // --- 1. LOGIN FLOW ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    setIsLoading(true);
    try {
      const response = await login({
        identifier: formData.email,
        password: formData.password,
      });
      const token = response?.accessToken;
      if (!isAuthTokenValid(token)) {
        showToast("Login succeeded, but the token is invalid.", "error");
        return;
      }
      persistAuthToken(token);
      setIsSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      showToast(error?.message || "Login failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const submitSignUp = async () => {
    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        userDob: formData.dob,
        avatar: formData.avatar,
      });

      setOtp("");
      setShowOTPForm(true);
      setCountdown(60);
    } catch (error) {
      showToast(error?.message || "Registration failed.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. REGISTRATION FLOW ---
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.gender ||
      !formData.dob
    ) {
      showToast("Please complete all required fields.", "warning");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast("Password and confirmation do not match.", "error");
      return;
    }

    openConfirm({
      title: "Confirm registration",
      message: `Please confirm your details:\n\nName: ${formData.name}\nEmail: ${formData.email}\n\nCorrect?`,
      confirmLabel: "Confirm",
      onConfirm: submitSignUp,
    });
  };

  // --- 3. OTP verification for registration ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return showToast("Please enter the 6-digit OTP code.", "warning");

    setIsLoading(true);
    try {
      await verifyOtp({ email: formData.email, otpCode: otp });

      setIsSuccess(true);
      setCountdown(0);

      setTimeout(() => {
        setIsSuccess(false);
        setShowOTPForm(false);
        setIsFlipped(false);
        setOtp("");
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      }, 2000);
    } catch (error) {
      showToast(error?.message || "Invalid OTP code.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Forgot password flow ---
  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return showToast("Please enter your email.", "warning");
    setLoadingForgot(true);
    try {
      await forgotPassword({ email: forgotEmail });
      setForgotStep(2);
      setCountdown(60);
      setForgotOtpValues(new Array(6).fill(""));
      setForgotOtpVerified(false);
    } catch (error) {
      showToast(error?.message || "Email not found.", "error");
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleForgotOtpChange = (index, value) => {
    const sanitizedValue = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...forgotOtpValues];
    newOtp[index] = sanitizedValue;
    setForgotOtpValues(newOtp);
    if (sanitizedValue && index < 5) {
      forgotOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleForgotOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtpValues[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleForgotVerifyStep(e);
    }
  };

  const handleForgotVerifyStep = async (e) => {
    if (e) e.preventDefault();
    const code = forgotOtpValues.join("");
    if (code.length !== 6) {
      showToast("Please enter the 6-digit OTP code.", "warning");
      return;
    }
    setLoadingForgot(true);
    try {
      await verifyResetPasswordOtp({ email: forgotEmail, otpCode: code });
      setForgotOtpVerified(true);
      setForgotStep(3);
    } catch (error) {
      showToast(error?.message || "Invalid OTP code.", "error");
      setForgotOtpVerified(false);
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    if (!forgotOtpVerified) {
      showToast("Please verify your OTP first.", "warning");
      setForgotStep(2);
      return;
    }
    if (!newPassword || !confirmNewPassword)
      return showToast("Please enter a new password.", "warning");
    if (newPassword !== confirmNewPassword)
      return showToast("Password confirmation does not match.", "error");

    const code = forgotOtpValues.join("");
    setLoadingForgot(true);
    try {
      await resetPasswordConfirm({
        email: forgotEmail,
        otpCode: code,
        newPassword,
      });
      showToast("Password reset successfully. Please sign in.", "success");
      setCountdown(0);
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtpValues(new Array(6).fill(""));
      setNewPassword("");
      setConfirmNewPassword("");
      setForgotOtpVerified(false);
    } catch (error) {
      showToast(error?.message || "Failed to reset password.", "error");
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (!formData.email) {
      showToast("Please enter your email first.", "warning");
      return;
    }
    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        userDob: formData.dob,
        avatar: formData.avatar,
      });
      setCountdown(60);
      showToast("Code resent! Please check your email.", "success");
    } catch (error) {
      showToast(error?.message || "Failed to resend OTP.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    if (!forgotEmail) {
      showToast("Please enter your email.", "warning");
      return;
    }
    setLoadingForgot(true);
    try {
      await forgotPassword({ email: forgotEmail });
      setCountdown(60);
      setForgotOtpValues(new Array(6).fill(""));
      setForgotOtpVerified(false);
      showToast("Code resent! Please check your email.", "success");
    } catch (error) {
      showToast(error?.message || "Failed to resend OTP.", "error");
    } finally {
      setLoadingForgot(false);
    }
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
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
    <div className="h-screen w-full flex font-sans bg-surface dark:bg-transparent text-text-primary overflow-hidden">
      <PageMeta
        title="Login"
        description="Sign in to your Nostressia account to access the stress dashboard, daily journal, and mental wellness tips."
      />
      {/* BACKGROUND DECORATION */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-surface-muted dark:bg-surface items-center justify-center p-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-warning/20 rounded-full blur-[100px] animate-pulse-slow animation-delay-2000" />
        <div className="relative z-10 w-full max-w-[480px] group">
          <div className="absolute inset-0 bg-brand-info/10 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-full flex items-center justify-center">
            
            {/* LOGO BASE (KEDIP/WINK) */}
            <img
              src={isDarkMode ? logoKedipDark : logoKedip}
              alt="Nostressia Wink"
              className="w-full h-auto object-contain relative z-10"
            />

            {/* LOGO OVERLAY (BUKA/OPEN) */}
            <Motion.img
              src={isDarkMode ? logoBukaDark : logoBuka}
              alt="Nostressia Open"
              className="absolute top-0 left-0 w-full h-full object-contain z-20"
              initial={{ opacity: 1 }}
              animate={{ opacity: isWinking ? 0 : 1 }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-center text-text-muted/60 dark:text-text-muted text-[10px] mt-8 font-medium tracking-widest uppercase animate-pulse">
            No stress, More success
          </p>
        </div>
      </div>

      {/* FORM CONTAINER */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 relative bg-surface perspective-[1000px]">
        <Motion.div
          className="relative w-full max-w-md h-[85vh] max-h-[850px] min-h-[600px]"
          animate={{ rotateY: isFlipped ? -180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 50,
            damping: 15,
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT: LOGIN (SIDE A) */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden flex flex-col justify-center
              rounded-3xl px-7 sm:px-10 py-10
              bg-white/60 dark:bg-white/10 backdrop-blur-2xl
              border border-white/30 dark:border-white/10
              shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]
              overflow-hidden"
            style={{ backfaceVisibility: "hidden", zIndex: isFlipped ? 0 : 2 }}
          >
            {/* highlight glass */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/25 blur-3xl" />
              <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
            </div>

            <div className="relative">
              <div className="text-center lg:text-left mb-6">
                <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
                  Welcome Back
                </h1>
                <p className="mt-3 text-lg text-text-muted">Sign in to continue your journey.</p>
              </div>

              <form onSubmit={handleLogin} onKeyDown={handleFormKeyDown} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">
                    Email or Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-text-muted group-focus-within:text-brand-primary transition-colors z-2" />
                    </div>
                    <input
                      type="text"
                      placeholder="Username or email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 glass-input border border-border rounded-2xl text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 outline-none transition-all font-medium"
                      data-required="true"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold text-text-secondary ml-1">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm font-bold text-brand-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-text-muted group-focus-within:text-brand-primary transition-colors z-2" />
                    </div>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-4 glass-input border border-border rounded-2xl text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 outline-none transition-all font-medium"
                      data-required="true"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-text-muted hover:text-brand-primary transition-colors"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isSuccess || !formData.email || !formData.password}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg shadow-brand-primary/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isSuccess
                      ? "bg-brand-info text-text-inverse scale-95"
                      : "bg-brand-primary text-text-inverse hover:bg-brand-primary/90 hover:scale-[1.02] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-6 h-6 animate-bounce" />
                  ) : (
                    <>
                      Sign in <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-text-muted mt-8 font-medium">
                Don't have an account?{" "}
                <button
                  onClick={toggleFlip}
                  className="text-brand-primary font-bold cursor-pointer hover:underline ml-1"
                >
                  Sign up free
                </button>
              </p>
            </div>
          </div>

          {/* BACK: REGISTER/OTP (SIDE B) */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden bg-surface-elevated glass-panel-strong flex flex-col rounded-2xl overflow-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              zIndex: isFlipped ? 2 : 0,
            }}
          >
            {showOTPForm ? (
              // VERIFIED SUCCESS VIEW
              isSuccess ? (
                <div className="flex flex-col h-full justify-center items-center text-center p-6 animate-fade-in">
                  <div className="w-24 h-24 bg-brand-info/15 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-brand-info" strokeWidth={3} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-text-primary mb-2">Verified!</h2>
                  <p className="text-text-muted">Your account has been verified successfully.</p>
                  <p className="text-sm text-text-muted mt-6 animate-pulse">
                    Redirecting to login...
                  </p>
                </div>
              ) : (
                // OTP REGISTER VIEW
                <div className="flex flex-col h-full justify-center items-center text-center p-4 animate-fade-in">
                  <div className="bg-brand-warning/20 p-4 rounded-full mb-6 text-brand-warning animate-bounce">
                    <ShieldCheck size={48} />
                  </div>
                  <h2 className="text-3xl font-extrabold text-text-primary mb-2">Verify Account</h2>
                  <p className="text-text-muted mb-8 max-w-xs">
                    We sent a code to <br />{" "}
                    <span className="font-bold text-text-primary">{formData.email}</span>
                  </p>

                  <div className="w-full max-w-xs space-y-6">
                    <div
                      className="relative w-full mb-6 cursor-text"
                      onClick={() => otpInputRef.current?.focus()}
                    >
                      <input
                        ref={otpInputRef}
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          setOtp(val);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleVerifyOTP(e);
                        }}
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
                                ${
                                  isActive
                                    ? "border-brand-warning ring-4 ring-brand-warning/15 bg-brand-warning/10"
                                    : "border-border bg-surface-elevated"
                                }
                                ${digit ? "border-border bg-surface-muted" : ""}
                              `}
                            >
                              {digit ? (
                                <span className="text-2xl font-bold text-text-primary animate-popIn">
                                  {digit}
                                </span>
                              ) : isActive ? (
                                <div className="w-0.5 h-6 bg-brand-warning animate-blink" />
                              ) : (
                                <div className="w-2 h-2 bg-surface-muted rounded-full" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-text-muted mt-3">Type the 6-digit code</p>
                    </div>

                    <button
                      onClick={handleVerifyOTP}
                      disabled={isLoading || otp.length < 6}
                      className={`w-full py-4 rounded-2xl font-bold text-text-inverse text-lg shadow-lg shadow-brand-warning/20 bg-brand-warning hover:bg-brand-warning/90 cursor-pointer transition-all ${
                        otp.length < 6 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      ) : (
                        "Verify Code"
                      )}
                    </button>

                    <div className="text-center">
                      {countdown > 0 ? (
                        <p className="text-sm font-medium text-text-muted flex items-center justify-center gap-1">
                          <Clock size={14} className="animate-pulse" /> Resend in{" "}
                          <span className="text-brand-warning font-bold">
                            {formatTime(countdown)}
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendSignupOtp}
                          className="text-sm font-bold text-brand-warning hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowOTPForm(false)}
                    className="mt-8 flex items-center gap-2 text-sm font-bold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} /> Back to Register
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="flex-none pt-8 pb-4 text-center lg:text-left border-b border-border-subtle mb-2 px-7 sm:px-10">
                  <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
                    Create Account
                  </h1>
                  <p className="mt-1 text-sm text-text-muted">Join Nostressia for a better life.</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar px-7 sm:px-10">
                  <form
                    onSubmit={handleSignUp}
                    onKeyDown={handleFormKeyDown}
                    className="space-y-4 pb-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">
                        Full Name
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-2">
                          <User className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium"
                          data-required="true"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">Username</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <AtSign className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                        </div>
                        <input
                          type="text"
                          placeholder="your_username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium"
                          data-required="true"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">Email</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                        </div>
                        <input
                          type="email"
                          placeholder="name@gmail.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium"
                          data-required="true"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary ml-1">
                          Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                          </div>
                          <input
                            type={showSignUpPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium"
                            data-required="true"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary ml-1">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <CheckCircle className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                          </div>
                          <input
                            type={showSignUpPassword ? "text" : "password"}
                            placeholder="••••••"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium"
                            data-required="true"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-1">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            id="showPw"
                            checked={showSignUpPassword}
                            onChange={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-border shadow-sm checked:bg-brand-warning checked:border-brand-warning transition-all"
                          />
                          <Check
                            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-text-inverse opacity-0 peer-checked:opacity-100"
                            size={12}
                            strokeWidth={4}
                          />
                        </div>
                        <label
                          htmlFor="showPw"
                          className="text-xs font-bold text-text-secondary cursor-pointer select-none"
                        >
                          Show Password
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">
                        Pick Your Avatar
                      </label>
                      <div className="flex justify-between items-center glass-input border border-border rounded-xl p-2">
                        {AVATAR_OPTIONS.map((avatarUrl, index) => (
                          <div
                            key={index}
                            onClick={() => setFormData({ ...formData, avatar: avatarUrl })}
                            className={`relative cursor-pointer transition-all duration-300 rounded-full p-0.5 ${
                              formData.avatar === avatarUrl
                                ? "ring-2 ring-brand-warning scale-110 shadow-sm"
                                : "hover:scale-105 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={avatarUrl}
                              alt={`Avatar ${index + 1}`}
                              className="w-10 h-10 rounded-full object-cover bg-surface-elevated"
                            />
                            {formData.avatar === avatarUrl && (
                              <div className="absolute -bottom-1 -right-1 bg-brand-warning text-text-inverse rounded-full p-0.5 border border-surface">
                                <Check size={8} strokeWidth={4} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">Gender</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Users className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                        </div>
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gender: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium appearance-none cursor-pointer"
                          data-required="true"
                        >
                          <option value="" disabled>
                            Select Gender
                          </option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Prefer not say</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 pb-4">
                      <label
                        htmlFor="signup-dob"
                        className="text-xs font-bold text-text-secondary ml-1"
                      >
                        Date of Birth
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-4 w-4 text-text-muted group-focus-within:text-brand-warning transition-colors z-2" />
                        </div>
                        <input
                          id="signup-dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 glass-input border border-border rounded-xl text-sm text-text-primary focus:bg-surface-elevated glass-panel focus:border-brand-warning focus:ring-2 focus:ring-brand-warning/15 outline-none transition-all font-medium cursor-pointer"
                          data-required="true"
                        />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="flex-none pt-4 pb-2 text-center bg-surface-elevated glass-panel border-t border-border-subtle px-7 sm:px-10">
                  <button
                    onClick={handleSignUp}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-bold text-text-inverse text-base shadow-lg shadow-brand-warning/20 transition-all duration-300 transform flex items-center justify-center gap-2 cursor-pointer bg-brand-warning hover:bg-brand-warning/90 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Sign Up Free <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-text-muted mt-3 font-medium text-sm">
                    Already have an account?{" "}
                    <button
                      onClick={toggleFlip}
                      className="text-brand-primary font-bold cursor-pointer hover:underline ml-1"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </Motion.div>
      </div>

      {/* MODAL FORGOT PASSWORD (STEPPER) */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-sm">
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-elevated glass-panel-strong w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                {/* HEADER */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Forgot Password</h3>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            forgotStep >= step ? "w-8 bg-blue-600" : "w-2 bg-surface-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotStep(1);
                      setCountdown(0);
                      setForgotOtpVerified(false);
                    }}
                    className="text-text-muted hover:text-text-secondary p-1 rounded-full hover:bg-surface-muted"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* STEP 1 */}
                {forgotStep === 1 && (
                  <form
                    onSubmit={handleForgotRequest}
                    onKeyDown={handleFormKeyDown}
                    className="space-y-4 animate-fade-in"
                  >
                    <p className="text-sm text-text-muted">
                      Enter your email address to receive a 6-digit verification code.
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary ml-1">Email</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail
                            size={16}
                            className="text-text-muted group-focus-within:text-blue-600"
                          />
                        </div>
                        <input
                          type="email"
                          placeholder="name@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 bg-surface-muted border border-border rounded-xl text-sm focus:bg-surface-elevated glass-panel focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                          required
                          autoFocus
                          data-required="true"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loadingForgot}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-blue-600/20"
                    >
                      {loadingForgot ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Next <ArrowRight size={16} className="ml-2" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2 */}
                {forgotStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
                      <p className="text-sm text-text-muted mb-4">
                        Enter the 6-digit code sent to <br />
                        <span className="font-bold text-text-primary">{forgotEmail}</span>
                      </p>
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
                            className={`w-10 h-12 border-2 rounded-lg text-center text-xl font-bold bg-surface-muted focus:bg-surface-elevated glass-panel outline-none transition-all
                              ${
                                digit
                                  ? "border-blue-500 text-text-primary"
                                  : "border-border text-transparent"
                              }
                              focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                            `}
                            inputMode="numeric"
                          />
                        ))}
                      </div>

                      <div className="text-center mt-4">
                        {countdown > 0 ? (
                          <p className="text-xs font-medium text-text-muted flex items-center justify-center gap-1">
                            <Clock size={12} className="animate-pulse" /> Resend in{" "}
                            <span className="text-blue-600 font-bold">{formatTime(countdown)}</span>
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleForgotResendOtp}
                            className="text-sm font-bold text-orange-600 hover:underline cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleForgotVerifyStep}
                      disabled={loadingForgot || forgotOtpValues.some((v) => !v)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingForgot ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Verify & Next"
                      )}
                    </button>
                  </div>
                )}

                {/* STEP 3 */}
                {forgotStep === 3 && (
                  <form
                    onSubmit={handleForgotConfirm}
                    onKeyDown={handleFormKeyDown}
                    className="space-y-4 animate-fade-in"
                  >
                    <p className="text-sm text-text-muted">
                      Create a new password for your account.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary ml-1">
                          New Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock
                              size={16}
                              className="text-text-muted group-focus-within:text-blue-600"
                            />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-surface-muted border border-border rounded-xl text-sm focus:bg-surface-elevated glass-panel focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                            required
                            data-required="true"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary ml-1">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <CheckCircle
                              size={16}
                              className="text-text-muted group-focus-within:text-blue-600"
                            />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-surface-muted border border-border rounded-xl text-sm focus:bg-surface-elevated glass-panel focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                            required
                            data-required="true"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-1">
                        <input
                          type="checkbox"
                          id="showNewPw"
                          checked={showNewPassword}
                          onChange={() => setShowNewPassword(!showNewPassword)}
                          className="w-4 h-4 text-blue-600 rounded border-border focus:ring-blue-500 cursor-pointer"
                        />
                        <label
                          htmlFor="showNewPw"
                          className="text-xs font-bold text-text-secondary cursor-pointer select-none"
                        >
                          Show Password
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingForgot}
                      className="w-full py-3 bg-brand-primary text-text-inverse rounded-xl font-bold hover:bg-brand-primary/90 transition-all flex justify-center items-center cursor-pointer shadow-lg shadow-brand-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingForgot ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <style>{`
        @keyframes pulse-slow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--neutral-300)); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--neutral-300)); }
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

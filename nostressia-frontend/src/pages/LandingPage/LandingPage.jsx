// src/pages/LandingPage/LandingPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Star,
  Smile,
  CheckCircle,
  BarChart3,
  Zap,
  Quote,
  Book,
  Menu,
  X,
  Search,
  Bell,
} from "lucide-react";
import Footer from "../../components/Footer";
import PageMeta from "../../components/PageMeta";

// --- Assets ---
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";
import Avatar1 from "../../assets/images/avatar1.png";
// Replace "preview1.png" with the background image you want (e.g., a campus or student activity photo).
import CTABackground from "../../assets/images/preview2.png";

// --- COMPONENTS: UI MOCKUPS (TETAP SAMA) ---

// 1. Mockup Mood Tracker
const MoodCard = () => (
  <div className="bg-surface-elevated glass-panel p-5 md:p-6 rounded-3xl shadow-xl border border-border w-full max-w-[320px] md:max-w-sm -rotate-3 hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <span className="font-bold text-text-secondary text-sm md:text-base">How's your mood?</span>
      <span className="text-[10px] md:text-xs text-text-muted">Today</span>
    </div>
    <div className="flex justify-between gap-2 px-2">
      <div className="text-4xl grayscale-0 cursor-pointer transition-all scale-110 shadow-sm">
        😫
      </div>
      <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">
        😐
      </div>
      <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">
        😆
      </div>
    </div>
    <div className="mt-5 md:mt-6 pt-3 md:pt-4 border-t border-border-subtle">
      <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
        <div className="h-full w-[70%] bg-brand-primary"></div>
      </div>
      <p className="text-[10px] md:text-xs text-center text-text-muted mt-2">Stress: High</p>
    </div>
  </div>
);

// 2. Mockup Analytics
const AnalyticsCard = () => (
  <div className="bg-surface-elevated glass-panel p-5 md:p-6 rounded-3xl shadow-xl border border-border w-full max-w-[320px] md:max-w-sm rotate-2 hover:rotate-0 transition-transform duration-500 relative group z-10 mx-auto">
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <div>
        <span className="font-bold text-text-secondary block text-sm md:text-base">History</span>
        <span className="text-[10px] md:text-xs text-text-muted">Month</span>
      </div>
      <div className="bg-brand-primary/10 p-2 rounded-lg text-brand-primary">
        <BarChart3 size={18} className="md:w-5 md:h-5" />
      </div>
    </div>
    <div className="flex items-end justify-between gap-2 h-28 md:h-32 mb-2 px-1">
      {[40, 65, 30, 85, 50, 20, 60].map((h, i) => (
        <div
          key={i}
          className="w-full bg-surface-muted rounded-t-lg relative group-hover:bg-brand-primary/10 transition-colors h-full flex items-end"
        >
          <Motion.div
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
            className="w-full rounded-t-md bg-brand-primary"
          />
        </div>
      ))}
    </div>
    <div className="flex justify-between text-[10px] text-text-muted font-medium px-1">
      <span>M</span>
      <span>T</span>
      <span>W</span>
      <span>T</span>
      <span>F</span>
      <span>S</span>
      <span>S</span>
    </div>
  </div>
);

// 3. Mockup Motivation
const MotivationCard = () => (
  <div className="bg-surface-elevated glass-panel p-5 md:p-6 rounded-3xl shadow-xl border border-border w-full max-w-[320px] md:max-w-sm -rotate-1 hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
    <div className="flex justify-between items-center mb-4 md:mb-6">
      <div>
        <span className="font-bold text-text-secondary block text-sm md:text-base">Motivation</span>
        <span className="text-[10px] md:text-xs text-text-muted">Boost</span>
      </div>
      <div className="bg-brand-accent/10 p-2 rounded-lg text-brand-accent">
        <Zap size={18} className="md:w-5 md:h-5" fill="currentColor" />
      </div>
    </div>
    <div className="bg-linear-to-br from-brand-accent to-brand-warning rounded-2xl p-5 md:p-6 text-text-inverse relative overflow-hidden group-hover:shadow-lg transition-shadow">
      <Quote className="absolute top-3 left-3 text-white/20 w-5 h-5 md:w-6 md:h-6 rotate-180" />
      <p className="font-sans text-base md:text-lg leading-relaxed relative z-10 italic pt-2 text-white">
        "Believe you can."
      </p>
      <p className="text-[10px] md:text-xs text-text-inverse/80 mt-3 md:mt-4 font-medium text-right opacity-90">
        - T. Roosevelt
      </p>
    </div>
  </div>
);

// 4. Mockup Tips Page
const TipsPagePreview = () => (
  <div className="w-full max-w-[320px] md:max-w-sm bg-surface-elevated glass-panel rounded-3xl md:rounded-4xl shadow-2xl border border-border overflow-hidden relative group rotate-1 hover:rotate-0 transition-transform duration-500 mx-auto">
    <div className="bg-linear-to-br from-bg-sun via-bg-orange to-bg-sky p-5 md:p-6 pb-3 md:pb-4">
      <div className="mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl font-extrabold text-brand-primary tracking-wide">
          TIPS
        </h3>
      </div>
      <div className="bg-surface/80 rounded-xl p-2.5 md:p-3 flex items-center gap-2 shadow-sm mb-2 border border-border/60 cursor-pointer">
        <Search size={14} className="text-text-muted md:w-4 md:h-4" />
        <div className="h-2 w-20 md:w-24 bg-border rounded-full"></div>
      </div>
    </div>

    <div className="p-4 grid grid-cols-2 gap-3 bg-surface-elevated">
      <div className="bg-brand-info/10 p-3 md:p-4 rounded-2xl border border-brand-info/20">
        <div className="text-base md:text-lg shadow-sm mb-2">😴</div>
        <div className="h-2 w-10 md:w-12 bg-brand-info/30 rounded-full mb-1"></div>
      </div>
      <div className="bg-brand-warning/10 p-3 md:p-4 rounded-2xl border border-brand-warning/20">
        <div className="text-base md:text-lg shadow-sm mb-2">🥗</div>
        <div className="h-2 w-10 md:w-12 bg-brand-warning/30 rounded-full mb-1"></div>
      </div>
    </div>
  </div>
);

// 5. Mockup Diary
const DiaryBookPreview = () => (
  <div className="relative w-full max-w-[320px] md:max-w-sm aspect-4/3 bg-bg-sun dark:bg-surface-muted rounded-l-2xl rounded-r-2xl shadow-2xl border-l-4 border-r-4 border-border flex overflow-hidden -rotate-1 hover:rotate-0 transition-transform duration-500 group z-10 mx-auto">
    <div className="flex-1 border-r border-border p-4 relative flex flex-col">
      <h4 className="text-xs md:text-sm font-sans font-bold text-text-secondary mb-3 md:mb-4 opacity-70">
        Journal
      </h4>
      <div className="space-y-3 md:space-y-4">
        <div className="flex gap-2 items-start">
          <div className="w-6 md:w-8 text-[8px] md:text-[10px] text-text-muted font-bold text-right pt-1">
            OCT 12
          </div>
          <div className="flex-1 bg-brand-primary/10 p-1.5 md:p-2 rounded-lg">
            <div className="h-1.5 w-3/4 bg-border rounded-full mb-1"></div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex-1 p-4 relative bg-bg-sun dark:bg-surface-muted">
      <div className="flex justify-between items-center mb-2 md:mb-3">
        <span className="text-[8px] md:text-[10px] text-text-muted font-bold uppercase tracking-widest">
          Today
        </span>
        <div className="text-lg md:text-xl">😌</div>
      </div>
      <div className="space-y-2 md:space-y-3 pt-1">
        <div className="w-full h-px bg-brand-primary/20"></div>
        <div className="w-full h-px bg-brand-primary/20"></div>
      </div>
    </div>
  </div>
);

// --- COMPONENT: HERO APP PREVIEW ---
const HeroAppPreview = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.4 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 12 },
    },
  };

  return (
    <Motion.div
      animate={{ y: [0, -15, 0] }}
      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      className="relative w-full max-w-[360px] mx-auto z-10"
    >
      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-surface/80 backdrop-blur-xl border border-border/60 p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        {/* Fake Status Bar */}
        <Motion.div variants={itemVariants} className="flex justify-between items-center mb-6 px-1">
          <div className="flex items-center gap-3">
            <Motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              src={Avatar1}
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-brand-primary object-cover cursor-pointer"
            />
            <div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide">
                Good Morning,
              </p>
              <p className="text-sm font-bold text-text-primary dark:text-text-primary">
                PPTI Student
              </p>
            </div>
          </div>
          <Motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 4, duration: 1 }}
            className="p-2 bg-surface-elevated glass-panel rounded-full shadow-sm text-text-muted cursor-pointer hover:text-brand-accent"
          >
            <Bell size={16} />
          </Motion.div>
        </Motion.div>

        {/* Hero Widget: Daily Check-in */}
        <Motion.div
          variants={itemVariants}
          className="bg-brand-primary rounded-3xl p-5 text-text-inverse mb-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-text-inverse opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <p className="text-xs font-medium text-text-inverse/80 mb-1">Daily Check-in</p>
          <h3 className="text-lg font-bold mb-4">How are you feeling?</h3>
          <div className="flex justify-between items-center bg-text-inverse/20 backdrop-blur-sm rounded-xl p-2 px-4">
            {["😔", "😐", "😌", "🤩"].map((emoji, i) => (
              <Motion.span
                key={i}
                whileHover={{ scale: 1.4, rotate: [0, -10, 10, 0] }}
                whileTap={{ scale: 0.9 }}
                className={`text-2xl cursor-pointer transition-all ${i === 2 ? "scale-125 drop-shadow-md" : "opacity-80 hover:opacity-100"}`}
              >
                {emoji}
              </Motion.span>
            ))}
          </div>
        </Motion.div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <Motion.div
            variants={itemVariants}
            className="bg-brand-accent/10 p-4 rounded-3xl border border-brand-accent/20 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="p-1.5 bg-surface-elevated glass-panel rounded-lg text-brand-accent shadow-sm">
                <Zap size={14} fill="currentColor" />
              </div>
              <span className="text-[10px] font-bold text-brand-accent/70">Today</span>
            </div>
            <p className="text-xs font-medium text-text-secondary italic">
              "Keep pushing forward."
            </p>
          </Motion.div>

          <Motion.div
            variants={itemVariants}
            className="bg-surface-elevated glass-panel p-4 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-text-muted">Stress</span>
              <span className="text-xs font-bold text-brand-info bg-brand-info/10 px-2 py-0.5 rounded-full">
                Low
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
              <Motion.div
                initial={{ width: 0 }}
                animate={{ width: "30%" }}
                transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                className="h-full bg-brand-info"
              />
            </div>
          </Motion.div>
        </div>

        {/* Bottom Nav Simulation */}
        <Motion.div
          variants={itemVariants}
          className="mt-6 flex justify-around text-text-muted/70 border-t border-border-subtle pt-4"
        >
          <div className="text-brand-primary cursor-pointer hover:scale-110 transition-transform">
            <div className="w-5 h-5 bg-current rounded-full opacity-20 mx-auto mb-1"></div>
          </div>
          <div className="w-5 h-5 bg-border rounded-full mx-auto cursor-pointer hover:bg-border/80 transition-colors"></div>
          <div className="w-5 h-5 bg-border rounded-full mx-auto cursor-pointer hover:bg-border/80 transition-colors"></div>
        </Motion.div>
      </Motion.div>

      {/* Background Decor */}
      <Motion.div
        animate={{ y: [-15, 10, -15], rotate: [12, 15, 12] }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute top-20 -right-8 z-[-1] bg-surface-elevated glass-panel p-3 rounded-2xl shadow-xl border border-border-subtle hidden md:block"
      >
        <div className="flex items-center gap-2">
          <div className="bg-brand-warning/20 p-2 rounded-full text-brand-accent">
            <Book size={18} />
          </div>
          <div>
            <div className="h-2 w-12 bg-border rounded-full mb-1"></div>
            <div className="h-2 w-8 bg-border-subtle rounded-full"></div>
          </div>
        </div>
      </Motion.div>

      <Motion.div
        animate={{ y: [15, -10, 15], rotate: [-6, -3, -6] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        className="absolute bottom-32 -left-8 z-[-1] bg-surface-elevated glass-panel p-3 rounded-2xl shadow-xl border border-border-subtle hidden md:block"
      >
        <div className="flex items-center gap-2">
          <div className="bg-brand-info/20 p-2 rounded-full text-brand-info">
            <CheckCircle size={18} />
          </div>
          <span className="text-xs font-bold text-text-secondary">All Clear!</span>
        </div>
      </Motion.div>
    </Motion.div>
  );
};

// --- COMPONENT: HERO SIMPLE ---
const HeroSimple = () => {
  return (
    <header className="relative z-10 pt-20 pb-10 md:pt-28 md:pb-16 px-6 overflow-hidden flex flex-col md:justify-center md:min-h-[90vh]">
      {/* Background Blobs */}
      <Motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-primary opacity-5 blur-[100px] rounded-full pointer-events-none -z-10"
      ></Motion.div>
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-brand-accent opacity-10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* KOLOM KIRI */}
        <Motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center lg:text-left z-20 md:pl-10 lg:pl-16 flex flex-col items-center lg:items-start"
        >
          {/* Badge */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-md border border-border text-brand-accent text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
            </span>
            Available for PPTI Students
          </Motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-text-primary dark:text-text-primary leading-[0.95] mb-6">
            NO STRESS
            <br />
            {/* Gradient Text */}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-primary via-brand-accent to-brand-primary animate-gradient-x bg-[length:200%_auto] pr-2 pb-2">
              MORE SUCCESS
            </span>
          </h1>

          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-text-muted max-w-xl font-medium leading-relaxed mb-8"
          >
            Your personal academic companion. Track mood, manage stress, and survive college without
            losing your mind.
          </Motion.p>

          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            {/* LINK GET STARTED */}
            <Link
              to="/login"
              className="px-8 py-4 bg-surface-muted text-text-primary rounded-full font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group hover:bg-brand-accent hover:border-brand-accent cursor-pointer dark:bg-surface dark:text-text-primary dark:hover:bg-surface-muted"
            >
              Get Started Free{" "}
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            {/* BUTTON EXPLORE */}
            <button
              onClick={() =>
                document.getElementById("prediction").scrollIntoView({ behavior: "smooth" })
              }
              className="px-8 py-4 bg-surface-elevated glass-panel text-text-primary dark:text-text-primary border border-border dark:border-border rounded-full font-bold text-base shadow-sm hover:bg-surface-muted dark:bg-surface dark:hover:bg-surface-muted transition-all flex items-center justify-center cursor-pointer"
            >
              Explore Features
            </button>
          </Motion.div>
        </Motion.div>

        {/* KOLOM KANAN (Desktop) */}
        <div className="relative h-auto md:h-[500px] flex items-center justify-center lg:flex">
          <HeroAppPreview />
        </div>

        {/* KOLOM KANAN (Mobile - Large Preview) */}
        <div className="lg:hidden w-full flex justify-center mt-12 pb-8">
          <div className="w-full max-w-[380px]">
            <HeroAppPreview />
          </div>
        </div>
      </div>

      <style>{`
         @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
         }
         .animate-gradient-x {
            animation: gradient-x 8s ease infinite;
         }
      `}</style>
    </header>
  );
};

// --- COMPONENT: SPLIT FLOATING NAV ---

const SplitNav = ({ scrollToSection, setIsMobileMenuOpen }) => {
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.2 },
    },
  };

  return (
    <>
      {/* LEFT ISLAND: LOGO (UPDATED) */}
      <Motion.div
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-4 left-4 md:top-6 md:left-8 z-50"
      >
        {/* CLICK TO SCROLL TOP */}
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 bg-surface/70 backdrop-blur-xl border border-border/60 shadow-sm px-5 py-3 rounded-full hover:shadow-lg transition-all cursor-pointer group"
        >
          <img
            src={LogoNostressia}
            alt="Logo"
            className="h-8 w-auto md:h-9 object-contain group-hover:scale-110 transition-transform"
          />
          <span className="font-extrabold text-text-primary dark:text-text-primary text-lg tracking-tight group-hover:text-brand-primary transition-colors">
            Nostressia
          </span>
        </Link>
      </Motion.div>

      {/* RIGHT ISLAND: MENU (DESKTOP) */}
      <Motion.div
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex fixed top-6 right-8 z-50 items-center gap-3"
      >
        {/* Navigation Pill */}
        <div className="flex items-center gap-1 bg-surface/70 backdrop-blur-xl border border-border/60 shadow-sm px-2 py-1.5 rounded-full">
          {["Prediction", "Analytics", "Motivation", "Tips", "Diary"].map((item) => (
            <button
              key={item}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="px-4 py-2 text-sm font-semibold text-text-muted dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:bg-surface-elevated glass-panel dark:hover:bg-surface-muted rounded-full transition-all relative group cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Login Button Independent */}
        <Link
          to="/login"
          className="px-6 py-3 bg-surface-muted text-text-primary rounded-full font-bold text-sm shadow-xl hover:shadow-2xl hover:bg-brand-primary hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2 dark:bg-surface dark:text-text-primary dark:hover:bg-surface-muted"
        >
          Login <ArrowRight size={14} />
        </Link>
      </Motion.div>

      {/* RIGHT ISLAND: MENU (MOBILE) */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-3 bg-surface/80 backdrop-blur-md border border-border/60 rounded-full shadow-sm text-text-primary dark:text-text-primary cursor-pointer"
        >
          <Menu size={24} />
        </button>
      </div>
    </>
  );
};

// --- COMPONENT: MOBILE MENU FLOATING DROPDOWN (UPDATED) ---

const MobileMenuOverlay = ({ isOpen, setIsOpen, scrollToSection }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-55 bg-brand-neutral/10 backdrop-blur-[2px] md:hidden"
          />

          {/* FLOATING BOX MENU */}
          <Motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20, originY: 0, originX: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 right-4 z-60 w-64 bg-surface/95 dark:bg-surface/95 backdrop-blur-2xl border border-border/60 dark:border-border rounded-3xl shadow-2xl p-2 flex flex-col gap-1 md:hidden"
          >
            {/* Close Button Header */}
            <div className="flex justify-between items-center px-4 pt-2 pb-2">
              <span className="text-xs font-bold text-text-muted dark:text-text-muted uppercase tracking-wider">
                Menu
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 bg-surface-muted dark:bg-surface-muted rounded-full text-text-muted dark:text-text-secondary hover:bg-border-subtle dark:hover:bg-surface-elevated glass-panel transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Items */}
            {["Prediction", "Analytics", "Motivation", "Tips", "Diary"].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setIsOpen(false);
                  setTimeout(() => scrollToSection(item.toLowerCase()), 300);
                }}
                className="w-full text-left px-4 py-3 text-sm font-bold text-text-secondary dark:text-text-secondary hover:text-brand-primary dark:hover:text-brand-info hover:bg-surface-elevated glass-panel dark:hover:bg-surface-muted rounded-2xl transition-all active:scale-95"
              >
                {item}
              </button>
            ))}

            <div className="h-px bg-border-subtle dark:bg-border my-1 mx-2"></div>

            {/* Login Button */}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-text-primary bg-surface-muted hover:bg-brand-primary rounded-2xl transition-colors shadow-lg active:scale-95 mb-1 dark:bg-surface dark:text-text-primary dark:hover:bg-surface-muted"
            >
              Login App <ArrowRight size={14} />
            </Link>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen font-sans bg-surface dark:bg-transparent text-text-primary dark:text-text-primary overflow-x-hidden selection:bg-brand-accent selection:text-text-inverse">
      <PageMeta
        title="Landing Page"
        description="Discover Nostressia: track daily stress, reflective journaling, mental wellness tips, and motivation in one app."
      />
      {/* Background Pattern */}
      <div
        className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none dark:hidden"
        style={{
          backgroundImage: "radial-gradient(rgb(var(--neutral-200)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      {/* --- NEW SPLIT NAVIGATION (Fixed Logo) --- */}
      <SplitNav scrollToSection={scrollToSection} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        scrollToSection={scrollToSection}
      />

      {/* Hero Section Baru */}
      <HeroSimple />

      {/* Marquee */}
      <div className="bg-surface-muted dark:bg-surface py-4 md:py-6 border-y-4 border-brand-primary relative z-20 rotate-1 scale-105 shadow-2xl my-6 md:my-10 overflow-hidden">
        <div className="whitespace-nowrap flex animate-marquee">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center mx-4 md:mx-8">
              <span className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-text-inverse to-text-muted italic">
                NO STRESS • MORE SUCCESS
              </span>
              <Star className="text-brand-accent ml-4 md:ml-8 w-6 h-6 md:w-8 md:h-8 fill-current animate-spin-slow" />
            </div>
          ))}
        </div>
      </div>
      <style>{`
         @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-20%); } }
         .animate-marquee { animation: marquee 15s linear infinite; }
         .animate-spin-slow { animation: spin 8s linear infinite; }
         @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* --- FEATURE SHOWCASE (HYBRID LAYOUT) --- */}
      <section className="py-16 md:py-24 px-4 md:px-20 max-w-7xl mx-auto relative z-10 space-y-24 md:space-y-32 mb-20">
        {/* ITEM 1: MOOD TRACKER */}
        <div id="prediction" className="scroll-mt-32">
          {/* === MOBILE LAYOUT (1 ATAS 2 BAWAH) === */}
          <div className="md:hidden space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold mb-2">
                <Smile size={14} /> Mood Tracker
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary">
                Don't bottle it up.
                <br />
                Track it.
              </h2>
              <p className="text-base text-text-muted leading-relaxed px-2">
                Understand your emotional patterns. Our intuitive mood tracker helps you identify
                what makes you tick.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] mx-auto px-2">
                <MoodCard />
              </div>
              <div className="w-full px-4 text-center">
                <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                  {["Daily Check-in", "Visual Charts", "Trigger Analysis"].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm text-text-secondary font-medium bg-surface-elevated glass-panel px-3 py-2 rounded-lg shadow-sm border border-border justify-center ${i === 0 ? "col-span-2" : ""}`}
                    >
                      <CheckCircle size={16} className="text-brand-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT (Side by Side) === */}
          <div className="hidden md:flex flex-row items-center gap-24">
            <Motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative flex justify-center"
            >
              <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-[80px] opacity-40"></div>
              <MoodCard />
            </Motion.div>
            <div className="flex-1 space-y-6 text-left">
              <div className="w-12 h-12 bg-brand-accent/15 rounded-xl flex items-center justify-center text-brand-accent mb-4">
                <Smile size={24} />
              </div>
              <h2 className="text-5xl font-bold text-text-primary dark:text-text-primary">
                Don't bottle it up. <br />
                Track it.
              </h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Understand your emotional patterns. Our intuitive mood tracker helps you identify
                what makes you tick (or ticked off).
              </p>
              <ul className="space-y-3 mt-4 inline-block text-left">
                {["Daily Check-in", "Visual Charts", "Trigger Analysis"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                    <CheckCircle size={18} className="text-brand-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ITEM 2: ANALYTICS */}
        <div id="analytics" className="scroll-mt-32">
          {/* === MOBILE LAYOUT (UPDATED GRID: 1 ATAS 2 BAWAH) === */}
          <div className="md:hidden space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold mb-2">
                <BarChart3 size={14} /> Analytics
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary">
                See the big picture.
              </h2>
              <p className="text-base text-text-muted leading-relaxed px-2">
                Analyze your monthly progress. Spot patterns in your stress levels and check past
                records.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] mx-auto px-2">
                <AnalyticsCard />
              </div>
              <div className="w-full px-4 text-center">
                <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                  {["Monthly History", "Pattern Recognition", "Data Insights"].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm text-text-secondary font-medium bg-surface-elevated glass-panel px-3 py-2 rounded-lg shadow-sm border border-border justify-center ${i === 0 ? "col-span-2" : ""}`}
                    >
                      <CheckCircle size={16} className="text-brand-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT (Reverse) === */}
          <div className="hidden md:flex flex-row-reverse items-center gap-24">
            <Motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative flex justify-center"
            >
              <div className="absolute inset-0 bg-brand-info/20 rounded-full blur-[80px] opacity-40"></div>
              <AnalyticsCard />
            </Motion.div>
            <div className="flex-1 space-y-6 text-left">
              <div className="w-12 h-12 bg-brand-primary/15 rounded-xl flex items-center justify-center text-brand-primary mb-4">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-5xl font-bold text-text-primary dark:text-text-primary">
                See the big picture.
              </h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Don't just survive the day. Analyze your monthly progress. Spot patterns in your
                stress levels and check past records.
              </p>
              <ul className="space-y-3 mt-4 inline-block text-left">
                {["Monthly Stress History", "Pattern Recognition", "Data-Driven Insights"].map(
                  (item, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                      <CheckCircle size={18} className="text-brand-primary" /> {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* ITEM 3: MOTIVATION */}
        <div id="motivation" className="scroll-mt-32">
          {/* === MOBILE LAYOUT (UPDATED GRID: 1 ATAS 2 BAWAH) === */}
          <div className="md:hidden space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-warning/15 text-brand-warning text-xs font-bold mb-2">
                <Zap size={14} /> Motivation
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary">
                Find your spark.
              </h2>
              <p className="text-base text-text-muted leading-relaxed px-2">
                Get personalized motivational quotes to lift your spirits and keep you going.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] mx-auto px-2">
                <MotivationCard />
              </div>
              <div className="w-full px-4 text-center">
                <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                  {["Daily Quotes", "Positive Affirmations", "Mood Boosters"].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm text-text-secondary font-medium bg-surface-elevated glass-panel px-3 py-2 rounded-lg shadow-sm border border-border justify-center ${i === 0 ? "col-span-2" : ""}`}
                    >
                      <CheckCircle size={16} className="text-brand-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT === */}
          <div className="hidden md:flex flex-row items-center gap-24">
            <Motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative flex justify-center"
            >
              <div className="absolute inset-0 bg-brand-warning/20 rounded-full blur-[80px] opacity-40"></div>
              <MotivationCard />
            </Motion.div>
            <div className="flex-1 space-y-6 text-left">
              <div className="w-12 h-12 bg-brand-warning/20 rounded-xl flex items-center justify-center text-brand-warning mb-4">
                <Zap size={24} fill="currentColor" />
              </div>
              <h2 className="text-5xl font-bold text-text-primary dark:text-text-primary">
                Find your spark.
              </h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Feeling overwhelmed? Get personalized motivational quotes to lift your spirits and
                keep you going when things get tough.
              </p>
              <ul className="space-y-3 mt-4 inline-block text-left">
                {["Daily Quotes", "Positive Affirmations", "Mood Boosters"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                    <CheckCircle size={18} className="text-brand-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ITEM 4: TIPS */}
        <div id="tips" className="scroll-mt-32">
          {/* === MOBILE LAYOUT (UPDATED GRID: 1 ATAS 2 BAWAH) === */}
          <div className="md:hidden space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-info/15 text-brand-info text-xs font-bold mb-2">
                <Star size={14} /> Tips & Tricks
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary">
                Rest & Reset.
              </h2>
              <p className="text-base text-text-muted leading-relaxed px-2">
                Recharge your mind with daily curated tips. Simple actions for a calmer you.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] mx-auto px-2">
                <TipsPagePreview />
              </div>
              <div className="w-full px-4 text-center">
                <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                  {["Daily Curated Tips", "Breathing Exercises", "Sleep Hygiene"].map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm text-text-secondary font-medium bg-surface-elevated glass-panel px-3 py-2 rounded-lg shadow-sm border border-border justify-center ${i === 0 ? "col-span-2" : ""}`}
                    >
                      <CheckCircle size={16} className="text-brand-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT (Reverse) === */}
          <div className="hidden md:flex flex-row-reverse items-center gap-24">
            <Motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative flex justify-center"
            >
              <div className="absolute inset-0 bg-brand-info/20 rounded-full blur-[80px] opacity-40"></div>
              <TipsPagePreview />
            </Motion.div>
            <div className="flex-1 space-y-6 text-left">
              <div className="w-12 h-12 bg-brand-info/20 rounded-xl flex items-center justify-center text-brand-info mb-4">
                <Star size={24} />
              </div>
              <h2 className="text-5xl font-bold text-text-primary dark:text-text-primary">
                Rest & Reset.
              </h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Recharge your mind with daily curated tips. Simple actions for a calmer you, from
                breathing techniques to sleep hygiene.
              </p>

              <ul className="space-y-3 mt-4 inline-block text-left mb-4">
                {["Daily Curated Tips", "Breathing Exercises", "Sleep Hygiene"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                    <CheckCircle size={18} className="text-brand-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ITEM 5: DIARY */}
        <div id="diary" className="scroll-mt-32">
          {/* === MOBILE LAYOUT (UPDATED GRID: 1 ATAS 2 BAWAH) === */}
          <div className="md:hidden space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold mb-2">
                <Book size={14} /> Diary
              </div>
              <h2 className="text-3xl font-bold text-text-primary dark:text-text-primary">
                Dear Diary.
              </h2>
              <p className="text-base text-text-muted leading-relaxed px-2">
                Clear your mind by writing it down. A safe, private space to reflect.
              </p>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-[340px] mx-auto px-2">
                <DiaryBookPreview />
              </div>
              <div className="w-full px-4 text-center">
                <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                  {["Private & Secure", "Reflect on your day", "Gratitude Journaling"].map(
                    (item, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-2 text-sm text-text-secondary font-medium bg-surface-elevated glass-panel px-3 py-2 rounded-lg shadow-sm border border-border justify-center ${i === 0 ? "col-span-2" : ""}`}
                      >
                        <CheckCircle size={16} className="text-brand-primary shrink-0" />
                        <span>{item}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* === DESKTOP LAYOUT === */}
          <div className="hidden md:flex flex-row items-center gap-24">
            <Motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 relative flex justify-center"
            >
              <div className="absolute inset-0 bg-brand-accent/15 rounded-full blur-[80px] opacity-40"></div>
              <DiaryBookPreview />
            </Motion.div>
            <div className="flex-1 space-y-6 text-left">
              <div className="w-12 h-12 bg-brand-accent/15 rounded-xl flex items-center justify-center text-brand-accent mb-4">
                <Book size={24} />
              </div>
              <h2 className="text-5xl font-bold text-text-primary dark:text-text-primary">
                Dear Diary.
              </h2>
              <p className="text-lg text-text-muted leading-relaxed">
                Clear your mind by writing it down. A safe, private space to reflect on your day,
                gratitude, or anything that's on your mind.
              </p>

              <ul className="space-y-3 mt-4 inline-block text-left mb-4">
                {["Private & Secure", "Reflect on your day", "Gratitude Journaling"].map(
                  (item, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-secondary font-medium">
                      <CheckCircle size={18} className="text-brand-primary" /> {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom (UPDATED WITH BACKGROUND IMAGE) */}
      <section className="py-12 md:py-20 px-6">
        <div
          className="max-w-5xl mx-auto rounded-4xl md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl bg-cover bg-center group"
          style={{ backgroundImage: `url(${CTABackground})` }}
        >
          {/* Overlay Gelap (Agar teks terbaca jelas) */}
          <div className="absolute inset-0 bg-brand-neutral/70 group-hover:bg-brand-neutral/60 transition-colors duration-500 z-0"></div>

          {/* Content (z-10 agar di atas overlay) */}
          <div className="relative z-10 space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-6xl font-bold text-text-inverse tracking-tight dark:text-text-primary">
              Ready to upgrade your <br />
              <span className="text-brand-warning">College Life?</span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                to="/login"
                className="px-8 py-3 md:px-10 md:py-4 bg-surface-elevated text-text-primary dark:text-text-primary dark:bg-surface dark:hover:bg-brand-accent rounded-full font-bold text-base md:text-lg hover:bg-brand-primary hover:text-text-inverse transition-all shadow-lg transform hover:-translate-y-1 cursor-pointer"
              >
                Join Now - It's Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

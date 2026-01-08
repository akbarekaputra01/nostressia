// src/pages/LandingPage/LandingPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  motion as Motion, 
  AnimatePresence 
} from "framer-motion";
import { 
  ArrowRight, Star, Smile, CheckCircle, 
  BarChart3, Zap, Quote, Book, Menu, X, Search, Bell
} from "lucide-react";

// --- Assets ---
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";
import Avatar1 from "../../assets/images/avatar1.png"; 

// --- COMPONENTS: UI MOCKUPS ---

// 1. Mockup Mood Tracker
const MoodCard = () => (
   <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-[320px] md:max-w-sm rotate-[-3deg] hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
      <div className="flex justify-between items-center mb-4 md:mb-6">
         <span className="font-bold text-gray-700 text-sm md:text-base">How's your mood?</span>
         <span className="text-[10px] md:text-xs text-gray-400">Today</span>
      </div>
      <div className="flex justify-between gap-2 px-2">
         <div className="text-4xl grayscale-0 cursor-pointer transition-all scale-110 shadow-sm">😫</div>
         <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😐</div>
         <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😆</div>
      </div>
      <div className="mt-5 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
         <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full w-[70%] bg-[#3664BA]"></div>
         </div>
         <p className="text-[10px] md:text-xs text-center text-gray-400 mt-2">Stress: High</p>
      </div>
   </div>
);

// 2. Mockup Analytics
const AnalyticsCard = () => (
    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-[320px] md:max-w-sm rotate-2 hover:rotate-0 transition-transform duration-500 relative group z-10 mx-auto">
       <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
             <span className="font-bold text-gray-700 block text-sm md:text-base">History</span>
             <span className="text-[10px] md:text-xs text-gray-400">Month</span>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg text-[#3664BA]">
             <BarChart3 size={18} className="md:w-5 md:h-5" />
          </div>
       </div>
       <div className="flex items-end justify-between gap-2 h-28 md:h-32 mb-2 px-1">
          {[40, 65, 30, 85, 50, 20, 60].map((h, i) => (
             <div key={i} className="w-full bg-gray-50 rounded-t-lg relative group-hover:bg-blue-50 transition-colors h-full flex items-end">
                <Motion.div 
                   initial={{ height: 0 }}
                   whileInView={{ height: `${h}%` }}
                   viewport={{ once: true }}
                   transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                   className="w-full rounded-t-md bg-[#3664BA]"
                />
             </div>
          ))}
       </div>
       <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
       </div>
    </div>
);

// 3. Mockup Motivation
const MotivationCard = () => (
    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-[320px] md:max-w-sm rotate-[-1deg] hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
      <div className="flex justify-between items-center mb-4 md:mb-6">
         <div>
             <span className="font-bold text-gray-700 block text-sm md:text-base">Motivation</span>
             <span className="text-[10px] md:text-xs text-gray-400">Boost</span>
         </div>
         <div className="bg-orange-50 p-2 rounded-lg text-[#F2994A]">
             <Zap size={18} className="md:w-5 md:h-5" fill="currentColor" />
         </div>
      </div>
      <div className="bg-gradient-to-br from-[#F2994A] to-[#ffc68c] rounded-2xl p-5 md:p-6 text-white relative overflow-hidden group-hover:shadow-lg transition-shadow">
         <Quote className="absolute top-3 left-3 text-white/20 w-5 h-5 md:w-6 md:h-6 rotate-180" />
         <p className="font-serif text-base md:text-lg leading-relaxed relative z-10 italic pt-2 text-white">
             "Believe you can."
         </p>
         <p className="text-[10px] md:text-xs text-orange-50 mt-3 md:mt-4 font-medium text-right opacity-90">- T. Roosevelt</p>
      </div>
    </div>
);

// 4. Mockup Tips Page
const TipsPagePreview = () => (
    <div className="w-full max-w-[320px] md:max-w-sm bg-white rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-200 overflow-hidden relative group rotate-1 hover:rotate-0 transition-transform duration-500 mx-auto">
       <div className="bg-gradient-to-br from-[#FFF3E0] via-[#eaf2ff] to-[#e3edff] p-5 md:p-6 pb-3 md:pb-4">
             <div className="mb-4 md:mb-6">
                 <h3 className="text-xl md:text-2xl font-extrabold text-[#3664BA] tracking-wide">
                     TIPS
                 </h3>
             </div>
             <div className="bg-white/80 rounded-xl p-2.5 md:p-3 flex items-center gap-2 shadow-sm mb-2 border border-white/60 cursor-pointer">
                 <Search size={14} className="text-gray-400 md:w-4 md:h-4" />
                 <div className="h-2 w-20 md:w-24 bg-gray-200 rounded-full"></div>
             </div>
       </div>

       <div className="p-4 grid grid-cols-2 gap-3 bg-white">
             <div className="bg-indigo-50/50 p-3 md:p-4 rounded-2xl border border-indigo-100">
                 <div className="text-base md:text-lg shadow-sm mb-2">😴</div>
                 <div className="h-2 w-10 md:w-12 bg-indigo-200 rounded-full mb-1"></div>
             </div>
             <div className="bg-emerald-50/50 p-3 md:p-4 rounded-2xl border border-emerald-100">
                 <div className="text-base md:text-lg shadow-sm mb-2">🥗</div>
                 <div className="h-2 w-10 md:w-12 bg-emerald-200 rounded-full mb-1"></div>
             </div>
       </div>
    </div>
);

// 5. Mockup Diary
const DiaryBookPreview = () => (
    <div className="relative w-full max-w-[320px] md:max-w-sm aspect-[4/3] bg-[#fffdf5] rounded-l-2xl rounded-r-2xl shadow-2xl border-l-4 border-r-4 border-gray-300 flex overflow-hidden rotate-[-1deg] hover:rotate-0 transition-transform duration-500 group z-10 mx-auto">
       <div className="flex-1 border-r border-gray-200 p-4 relative flex flex-col">
           <h4 className="text-xs md:text-sm font-serif font-bold text-gray-700 mb-3 md:mb-4 opacity-70">Journal</h4>
           <div className="space-y-3 md:space-y-4">
               <div className="flex gap-2 items-start">
                   <div className="w-6 md:w-8 text-[8px] md:text-[10px] text-gray-400 font-bold text-right pt-1">OCT 12</div>
                   <div className="flex-1 bg-blue-50/50 p-1.5 md:p-2 rounded-lg">
                       <div className="h-1.5 w-3/4 bg-gray-300 rounded-full mb-1"></div>
                   </div>
               </div>
           </div>
       </div>
       <div className="flex-1 p-4 relative bg-[#fffdf5]">
           <div className="flex justify-between items-center mb-2 md:mb-3">
               <span className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Today</span>
               <div className="text-lg md:text-xl">😌</div>
           </div>
           <div className="space-y-2 md:space-y-3 pt-1">
               <div className="w-full h-[1px] bg-blue-100"></div>
               <div className="w-full h-[1px] bg-blue-100"></div>
           </div>
       </div>
    </div>
);

// --- COMPONENT: HERO APP PREVIEW ---
const HeroAppPreview = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.4 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } }
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
         className="bg-white/80 backdrop-blur-xl border border-white p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
         {/* Fake Status Bar */}
         <Motion.div variants={itemVariants} className="flex justify-between items-center mb-6 px-1">
            <div className="flex items-center gap-3">
               <Motion.img 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
                  src={Avatar1} alt="User" className="w-10 h-10 rounded-full border-2 border-[#3664BA] object-cover cursor-pointer" 
               />
               <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">Good Morning,</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">PPTI Student</p>
               </div>
            </div>
            <Motion.div 
               animate={{ rotate: [0, 15, -15, 0] }}
               transition={{ repeat: Infinity, repeatDelay: 4, duration: 1 }}
               className="p-2 bg-white rounded-full shadow-sm text-gray-400 cursor-pointer hover:text-[#F2994A]"
            >
               <Bell size={16} />
            </Motion.div>
         </Motion.div>

         {/* Hero Widget: Daily Check-in */}
         <Motion.div variants={itemVariants} className="bg-[#3664BA] rounded-[1.5rem] p-5 text-white mb-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
            <p className="text-xs font-medium text-blue-100 mb-1">Daily Check-in</p>
            <h3 className="text-lg font-bold mb-4">How are you feeling?</h3>
            <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm rounded-xl p-2 px-4">
               {['😔', '😐', '😌', '🤩'].map((emoji, i) => (
                  <Motion.span 
                     key={i}
                     whileHover={{ scale: 1.4, rotate: [0, -10, 10, 0] }}
                     whileTap={{ scale: 0.9 }}
                     className={`text-2xl cursor-pointer transition-all ${i === 2 ? 'scale-125 drop-shadow-md' : 'opacity-80 hover:opacity-100'}`}
                  >
                     {emoji}
                  </Motion.span>
               ))}
            </div>
         </Motion.div>

         {/* Shortcuts */}
         <div className="grid grid-cols-2 gap-3">
            <Motion.div variants={itemVariants} className="bg-orange-50 p-4 rounded-[1.5rem] border border-orange-100 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex justify-between items-start mb-2">
                  <div className="p-1.5 bg-white rounded-lg text-[#F2994A] shadow-sm">
                     <Zap size={14} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-bold text-orange-300">Today</span>
               </div>
               <p className="text-xs font-medium text-gray-600 italic">"Keep pushing forward."</p>
            </Motion.div>
            
            <Motion.div variants={itemVariants} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-gray-400">Stress</span>
                  <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Low</span>
               </div>
               <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <Motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: "30%" }}
                     transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                     className="h-full bg-green-500" 
                  />
               </div>
            </Motion.div>
         </div>

         {/* Bottom Nav Simulation */}
         <Motion.div variants={itemVariants} className="mt-6 flex justify-around text-gray-300 border-t border-gray-100 pt-4">
            <div className="text-[#3664BA] cursor-pointer hover:scale-110 transition-transform">
               <div className="w-5 h-5 bg-current rounded-full opacity-20 mx-auto mb-1"></div>
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto cursor-pointer hover:bg-gray-300 transition-colors"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full mx-auto cursor-pointer hover:bg-gray-300 transition-colors"></div>
         </Motion.div>
      </Motion.div>

      {/* Background Decor */}
      <Motion.div 
         animate={{ y: [-15, 10, -15], rotate: [12, 15, 12] }}
         transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.5 }}
         className="absolute top-20 -right-8 z-[-1] bg-white p-3 rounded-2xl shadow-xl border border-gray-50 hidden md:block"
      >
         <div className="flex items-center gap-2">
            <div className="bg-pink-100 p-2 rounded-full text-pink-500">
               <Book size={18} />
            </div>
            <div>
               <div className="h-2 w-12 bg-gray-200 rounded-full mb-1"></div>
               <div className="h-2 w-8 bg-gray-100 rounded-full"></div>
            </div>
         </div>
      </Motion.div>

      <Motion.div 
         animate={{ y: [15, -10, 15], rotate: [-6, -3, -6] }}
         transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
         className="absolute bottom-32 -left-8 z-[-1] bg-white p-3 rounded-2xl shadow-xl border border-gray-50 hidden md:block"
      >
         <div className="flex items-center gap-2">
            <div className="bg-green-100 p-2 rounded-full text-green-600">
               <CheckCircle size={18} />
            </div>
            <span className="text-xs font-bold text-gray-600">All Clear!</span>
         </div>
      </Motion.div>

   </Motion.div>
  );
};

// --- COMPONENT: HERO SIMPLE ---
const HeroSimple = () => {
  return (
    // UPDATE: 
    // - Desktop Padding: dikurangi drastis jadi md:pt-28 (sebelumnya 40)
    // - Desktop Min-Height: dikurangi jadi md:min-h-[80vh] (agar titik tengahnya naik)
    // - Mobile: pt-20 (agar pas)
    <header className="relative z-10 pt-20 pb-10 md:pt-28 md:pb-16 px-6 overflow-hidden flex flex-col md:justify-center md:min-h-[80vh]">
      
      {/* Background Blobs */}
      <Motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#3664BA] opacity-5 blur-[100px] rounded-full pointer-events-none -z-10"
      ></Motion.div>
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[#F2994A] opacity-10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[#F2994A] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-6 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F2994A]"></span>
            </span>
            Available for PPTI Students
          </Motion.div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-[#1A1A1A] leading-[0.95] mb-6">
            NO STRESS<br/>
            {/* Gradient Text */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3664BA] via-[#F2994A] to-[#3664BA] animate-gradient-x bg-[length:200%_auto] pr-2 pb-2">
              MORE SUCCESS
            </span>
          </h1>
          
          <Motion.p 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="text-lg md:text-xl text-gray-500 max-w-xl font-medium leading-relaxed mb-8"
          >
            Your personal academic companion. Track mood, manage stress, and survive college without losing your mind.
          </Motion.p>

          <Motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.6 }}
             className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            {/* LINK GET STARTED */}
            <Link to="/login" className="px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group hover:bg-[#F2994A] hover:border-[#F2994A] cursor-pointer">
              Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
             {/* BUTTON EXPLORE */}
             <button onClick={() => document.getElementById('prediction').scrollIntoView({ behavior: 'smooth'})} className="px-8 py-4 bg-white text-[#1A1A1A] border border-gray-200 rounded-full font-bold text-base shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center cursor-pointer">
              Explore Features
            </button>
          </Motion.div>
        </Motion.div>

        {/* KOLOM KANAN (Desktop) */}
        <div className="relative h-auto md:h-[500px] flex items-center justify-center hidden lg:flex">
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

// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    // 1. Tutup menu terlebih dahulu
    setIsMobileMenuOpen(false);

    // 2. Beri jeda sedikit (misal 100ms) agar React selesai memproses penutupan menu
    // baru kemudian lakukan scroll. Ini mencegah konflik event di mobile.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 100; 
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };
  
  return (
    <div className="min-h-screen font-sans bg-[#F8F9FA] text-[#1A1A1A] overflow-x-hidden selection:bg-[#F2994A] selection:text-white">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all">
         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative">
            <Link to="/" className="flex items-center gap-2 shrink-0 cursor-pointer">
                <img src={LogoNostressia} alt="Logo" className="h-7 md:h-8 w-auto" />
                <span className="font-bold text-[#3664BA] text-lg">Nostressia</span>
            </Link>

            <button 
              className="md:hidden p-2 text-gray-600 hover:text-[#F2994A] focus:outline-none cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden md:flex items-center gap-8">
               <div className="flex items-center gap-6">
                  {['Prediction', 'Analytics', 'Motivation', 'Tips', 'Diary'].map((item) => (
                     <button
                        key={item}
                        onClick={() => scrollToSection(item.toLowerCase())}
                        className="text-sm font-medium text-gray-600 hover:text-[#F2994A] transition-colors relative group cursor-pointer"
                     >
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F2994A] transition-all group-hover:w-full"></span>
                     </button>
                  ))}
               </div>
               <Link to="/login" className="shrink-0 px-6 py-2 bg-[#1A1A1A] hover:bg-[#3664BA] text-white rounded-full font-medium text-sm transition-colors shadow-lg cursor-pointer">
                  Login
               </Link>
            </div>
         </div>

         <AnimatePresence>
            {isMobileMenuOpen && (
               <Motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
               >
                  <div className="flex flex-col p-6 space-y-4">
                      {['Prediction', 'Analytics', 'Motivation', 'Tips', 'Diary'].map((item) => (
                         <button
                            key={item}
                            onClick={() => scrollToSection(item.toLowerCase())}
                            className="text-left text-base font-medium text-gray-600 hover:text-[#F2994A] py-2 cursor-pointer"
                         >
                            {item}
                         </button>
                      ))}
                      <hr className="border-gray-100" />
                      <Link 
                         to="/login" 
                         className="text-center w-full px-6 py-3 bg-[#1A1A1A] text-white rounded-full font-medium transition-colors shadow-lg hover:bg-[#F2994A] cursor-pointer"
                         onClick={() => setIsMobileMenuOpen(false)}
                      >
                         Login
                      </Link>
                  </div>
               </Motion.div>
            )}
         </AnimatePresence>
      </nav>

      {/* Hero Section Baru */}
      <HeroSimple />

      {/* Marquee */}
      <div className="bg-[#1A1A1A] py-4 md:py-6 border-y-4 border-[#3664BA] relative z-20 rotate-1 scale-105 shadow-2xl my-6 md:my-10 overflow-hidden">
         <div className="whitespace-nowrap flex animate-marquee">
            {[...Array(10)].map((_, i) => (
               <div key={i} className="flex items-center mx-4 md:mx-8">
                   <span className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 italic">
                      NO STRESS • MORE SUCCESS
                   </span>
                   <Star className="text-[#F2994A] ml-4 md:ml-8 w-6 h-6 md:w-8 md:h-8 fill-current animate-spin-slow" />
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
      <section className="py-16 md:py-24 px-4 md:px-20 max-w-7xl mx-auto relative z-10 space-y-24 md:space-y-32">
         
         {/* ITEM 1: MOOD TRACKER */}
         <div id="prediction" className="scroll-mt-32">
           
           {/* === MOBILE LAYOUT (1 ATAS 2 BAWAH) === */}
           <div className="md:hidden space-y-8">
              <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F2994A] text-xs font-bold mb-2">
                       <Smile size={14} /> Mood Tracker
                    </div>
                    <h2 className="text-3xl font-bold text-[#1A1A1A]">Don't bottle it up.<br/>Track it.</h2>
                    <p className="text-base text-gray-500 leading-relaxed px-2">
                       Understand your emotional patterns. Our intuitive mood tracker helps you identify what makes you tick.
                    </p>
              </div>
              <div className="flex flex-col items-center gap-6">
                  <div className="w-full max-w-[340px] mx-auto px-2">
                      <MoodCard />
                  </div>
                  <div className="w-full px-4 text-center">
                      <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                          {['Daily Check-in', 'Visual Charts', 'Trigger Analysis'].map((item, i) => (
                             <li key={i} className={`flex items-center gap-2 text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 justify-center ${i === 0 ? 'col-span-2' : ''}`}>
                                 <CheckCircle size={16} className="text-[#3664BA] shrink-0" /> 
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
                 <div className="absolute inset-0 bg-blue-200 rounded-full blur-[80px] opacity-40"></div>
                 <MoodCard />
              </Motion.div>
              <div className="flex-1 space-y-6 text-left">
                 <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-[#F2994A] mb-4">
                    <Smile size={24} />
                 </div>
                 <h2 className="text-5xl font-bold text-[#1A1A1A]">Don't bottle it up. <br/>Track it.</h2>
                 <p className="text-lg text-gray-500 leading-relaxed">
                    Understand your emotional patterns. Our intuitive mood tracker helps you identify what makes you tick (or ticked off).
                 </p>
                 <ul className="space-y-3 mt-4 inline-block text-left">
                    {['Daily Check-in', 'Visual Charts', 'Trigger Analysis'].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                          <CheckCircle size={18} className="text-[#3664BA]" /> {item}
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
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#3664BA] text-xs font-bold mb-2">
                        <BarChart3 size={14} /> Analytics
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">See the big picture.</h2>
                     <p className="text-base text-gray-500 leading-relaxed px-2">
                        Analyze your monthly progress. Spot patterns in your stress levels and check past records.
                     </p>
                </div>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-[340px] mx-auto px-2">
                        <AnalyticsCard />
                    </div>
                    <div className="w-full px-4 text-center">
                       <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                           {['Monthly History', 'Pattern Recognition', 'Data Insights'].map((item, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 justify-center ${i === 0 ? 'col-span-2' : ''}`}>
                                  <CheckCircle size={16} className="text-[#3664BA] shrink-0" /> 
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
                   <div className="absolute inset-0 bg-purple-200 rounded-full blur-[80px] opacity-40"></div>
                   <AnalyticsCard />
                </Motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#3664BA] mb-4">
                      <BarChart3 size={24} />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">See the big picture.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Don't just survive the day. Analyze your monthly progress. Spot patterns in your stress levels and check past records.
                   </p>
                   <ul className="space-y-3 mt-4 inline-block text-left">
                      {['Monthly Stress History', 'Pattern Recognition', 'Data-Driven Insights'].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                            <CheckCircle size={18} className="text-[#3664BA]" /> {item}
                         </li>
                      ))}
                   </ul>
                </div>
             </div>
         </div>

         {/* ITEM 3: MOTIVATION */}
         <div id="motivation" className="scroll-mt-32">
             
             {/* === MOBILE LAYOUT (UPDATED GRID: 1 ATAS 2 BAWAH) === */}
             <div className="md:hidden space-y-8">
                <div className="text-center space-y-3">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold mb-2">
                        <Zap size={14} /> Motivation
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Find your spark.</h2>
                     <p className="text-base text-gray-500 leading-relaxed px-2">
                        Get personalized motivational quotes to lift your spirits and keep you going.
                     </p>
                </div>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-[340px] mx-auto px-2">
                        <MotivationCard />
                    </div>
                    <div className="w-full px-4 text-center">
                       <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                           {['Daily Quotes', 'Positive Affirmations', 'Mood Boosters'].map((item, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 justify-center ${i === 0 ? 'col-span-2' : ''}`}>
                                  <CheckCircle size={16} className="text-[#3664BA] shrink-0" /> 
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
                   <div className="absolute inset-0 bg-yellow-200 rounded-full blur-[80px] opacity-40"></div>
                   <MotivationCard />
                </Motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
                      <Zap size={24} fill="currentColor" />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">Find your spark.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Feeling overwhelmed? Get personalized motivational quotes to lift your spirits and keep you going when things get tough.
                   </p>
                   <ul className="space-y-3 mt-4 inline-block text-left">
                      {['Daily Quotes', 'Positive Affirmations', 'Mood Boosters'].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                            <CheckCircle size={18} className="text-[#3664BA]" /> {item}
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
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold mb-2">
                        <Star size={14} /> Tips & Tricks
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Rest & Reset.</h2>
                     <p className="text-base text-gray-500 leading-relaxed px-2">
                        Recharge your mind with daily curated tips. Simple actions for a calmer you.
                     </p>
                </div>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-[340px] mx-auto px-2">
                        <TipsPagePreview />
                    </div>
                    <div className="w-full px-4 text-center">
                       <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                           {['Daily Curated Tips', 'Breathing Exercises', 'Sleep Hygiene'].map((item, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 justify-center ${i === 0 ? 'col-span-2' : ''}`}>
                                  <CheckCircle size={16} className="text-[#3664BA] shrink-0" /> 
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
                   <div className="absolute inset-0 bg-green-200 rounded-full blur-[80px] opacity-40"></div>
                   <TipsPagePreview />
                </Motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                      <Star size={24} />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">Rest & Reset.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Recharge your mind with daily curated tips. Simple actions for a calmer you, from breathing techniques to sleep hygiene.
                   </p>
                   
                   <ul className="space-y-3 mt-4 inline-block text-left mb-4">
                      {['Daily Curated Tips', 'Breathing Exercises', 'Sleep Hygiene'].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                            <CheckCircle size={18} className="text-[#3664BA]" /> {item}
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
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold mb-2">
                        <Book size={14} /> Diary
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Dear Diary.</h2>
                     <p className="text-base text-gray-500 leading-relaxed px-2">
                        Clear your mind by writing it down. A safe, private space to reflect.
                     </p>
                </div>
                <div className="flex flex-col items-center gap-6">
                    <div className="w-full max-w-[340px] mx-auto px-2">
                        <DiaryBookPreview />
                    </div>
                    <div className="w-full px-4 text-center">
                       <ul className="grid grid-cols-2 gap-3 mb-4 w-full px-2">
                           {['Private & Secure', 'Reflect on your day', 'Gratitude Journaling'].map((item, i) => (
                              <li key={i} className={`flex items-center gap-2 text-sm text-gray-700 font-medium bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 justify-center ${i === 0 ? 'col-span-2' : ''}`}>
                                  <CheckCircle size={16} className="text-[#3664BA] shrink-0" /> 
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
                   <div className="absolute inset-0 bg-pink-200 rounded-full blur-[80px] opacity-40"></div>
                   <DiaryBookPreview />
                </Motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4">
                      <Book size={24} />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">Dear Diary.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Clear your mind by writing it down. A safe, private space to reflect on your day, gratitude, or anything that's on your mind.
                   </p>

                   <ul className="space-y-3 mt-4 inline-block text-left mb-4">
                      {['Private & Secure', 'Reflect on your day', 'Gratitude Journaling'].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                            <CheckCircle size={18} className="text-[#3664BA]" /> {item}
                         </li>
                      ))}
                   </ul>
                </div>
             </div>
         </div>
         
      </section>

      {/* CTA Bottom */}
      <section className="py-12 md:py-20 px-6">
         <div className="max-w-5xl mx-auto bg-[#1A1A1A] rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-black to-black"></div>
            <div className="relative z-10 space-y-6 md:space-y-8">
               <h2 className="text-3xl md:text-6xl font-bold text-white tracking-tight">
                  Ready to upgrade your <br/>
                  <span className="text-[#F2994A]">College Life?</span>
               </h2>
               <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Link to="/login" className="px-8 py-3 md:px-10 md:py-4 bg-white text-[#1A1A1A] rounded-full font-bold text-base md:text-lg hover:bg-[#F2994A] hover:text-white transition-all shadow-lg transform hover:-translate-y-1 cursor-pointer">
                     Join Now - It's Free
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-[#F8F9FA] text-center border-t border-gray-200">
         <div className="flex justify-center items-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <img src={LogoNostressia} alt="Logo" className="h-5 md:h-6 w-auto" />
            <span className="font-bold text-gray-800 text-sm md:text-base">Nostressia</span>
         </div>
         <p className="text-gray-400 text-xs md:text-sm">© {new Date().getFullYear()} Team 4 PPTI BCA.</p>
      </footer>

    </div>
  );
}

// src/pages/LandingPage/LandingPage.jsx
import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  motion, 
  useScroll,
  AnimatePresence 
} from "framer-motion";
import { 
  ArrowRight, Star, Smile, CheckCircle, 
  BarChart3, Zap, Quote, Book, PenTool, Image as ImageIcon, Zap as ZapIcon,
  Search, Menu, X 
} from "lucide-react";

// --- Assets ---
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";

// --- COMPONENTS: UI MOCKUPS (FEATURES) ---

// 1. Mockup Mood Tracker
const MoodCard = () => (
   <div className="bg-white p-3 md:p-6 rounded-[16px] md:rounded-3xl shadow-xl border border-gray-100 w-full max-w-[280px] md:max-w-sm rotate-[-3deg] hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
      <div className="flex justify-between items-center mb-3 md:mb-6">
         <span className="font-bold text-gray-700 text-[10px] md:text-base">How's your mood?</span>
         <span className="text-[8px] md:text-xs text-gray-400">Today</span>
      </div>
      <div className="flex justify-between gap-1 md:gap-2">
         <div className="text-2xl md:text-4xl grayscale-0 cursor-pointer transition-all scale-110 shadow-sm">😫</div>
         <div className="text-2xl md:text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😐</div>
         <div className="text-2xl md:text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😆</div>
      </div>
      <div className="mt-3 md:mt-6 pt-2 md:pt-4 border-t border-gray-100">
         <div className="h-1.5 md:h-2 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full w-[70%] bg-[#3664BA]"></div>
         </div>
         <p className="text-[8px] md:text-xs text-center text-gray-400 mt-1 md:mt-2">Stress: High</p>
      </div>
   </div>
);

// 2. Mockup Analytics
const AnalyticsCard = () => (
    <div className="bg-white p-3 md:p-6 rounded-[16px] md:rounded-3xl shadow-xl border border-gray-100 w-full max-w-[280px] md:max-w-sm rotate-2 hover:rotate-0 transition-transform duration-500 relative group z-10 mx-auto">
       <div className="flex justify-between items-center mb-3 md:mb-6">
          <div>
             <span className="font-bold text-gray-700 block text-[10px] md:text-base">History</span>
             <span className="text-[8px] md:text-xs text-gray-400">Month</span>
          </div>
          <div className="bg-blue-50 p-1 md:p-2 rounded-lg text-[#3664BA]">
             <BarChart3 size={14} className="md:w-5 md:h-5" />
          </div>
       </div>
       <div className="flex items-end justify-between gap-1 md:gap-2 h-16 md:h-32 mb-2 px-1">
          {[40, 65, 30, 85, 50, 20, 60].map((h, i) => (
             <div key={i} className="w-full bg-gray-50 rounded-t-lg relative group-hover:bg-blue-50 transition-colors h-full flex items-end">
                <motion.div 
                   initial={{ height: 0 }}
                   whileInView={{ height: `${h}%` }}
                   viewport={{ once: true }}
                   transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                   className="w-full rounded-t-sm md:rounded-t-md bg-[#3664BA]"
                />
             </div>
          ))}
       </div>
       <div className="flex justify-between text-[8px] md:text-[10px] text-gray-400 font-medium px-1">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
       </div>
    </div>
);

// 3. Mockup Motivation
const MotivationCard = () => (
    <div className="bg-white p-3 md:p-6 rounded-[16px] md:rounded-3xl shadow-xl border border-gray-100 w-full max-w-[280px] md:max-w-sm rotate-[-1deg] hover:rotate-0 transition-transform duration-500 relative z-10 mx-auto">
      <div className="flex justify-between items-center mb-3 md:mb-6">
          <div>
              <span className="font-bold text-gray-700 block text-[10px] md:text-base">Motivation</span>
              <span className="text-[8px] md:text-xs text-gray-400">Boost</span>
          </div>
          <div className="bg-yellow-50 p-1 md:p-2 rounded-lg text-yellow-500">
              <Zap size={14} className="md:w-5 md:h-5" fill="currentColor" />
          </div>
      </div>
      <div className="bg-gradient-to-br from-[#3664BA] to-[#4a7ac7] rounded-xl md:rounded-2xl p-4 md:p-6 text-white relative overflow-hidden group-hover:shadow-lg transition-shadow">
          <Quote className="absolute top-2 left-2 md:top-3 md:left-3 text-white/20 w-4 h-4 md:w-6 md:h-6 rotate-180" />
          <p className="font-serif text-xs md:text-lg leading-relaxed relative z-10 italic pt-1 md:pt-2">
              "Believe you can."
          </p>
          <p className="text-[8px] md:text-xs text-blue-100 mt-2 md:mt-4 font-medium text-right opacity-80">- T. Roosevelt</p>
      </div>
    </div>
);

// 4. Mockup Tips Page
const TipsPagePreview = () => (
    <div className="w-full max-w-[280px] md:max-w-sm bg-white rounded-[16px] md:rounded-[32px] shadow-2xl border border-gray-200 overflow-hidden relative group rotate-1 hover:rotate-0 transition-transform duration-500 mx-auto">
        <div className="bg-gradient-to-br from-[#FFF3E0] via-[#eaf2ff] to-[#e3edff] p-4 md:p-6 pb-2 md:pb-4">
             <div className="mb-2 md:mb-6">
                 <h3 className="text-lg md:text-2xl font-extrabold text-[#3664BA] tracking-wide">
                     TIPS
                 </h3>
             </div>
             <div className="bg-white/80 rounded-md md:rounded-xl p-2 md:p-3 flex items-center gap-2 shadow-sm mb-1 md:mb-2 border border-white/60">
                 <Search size={12} className="text-gray-400 md:w-4 md:h-4" />
                 <div className="h-1.5 md:h-2 w-16 md:w-24 bg-gray-200 rounded-full"></div>
             </div>
        </div>

        <div className="p-3 md:p-4 grid grid-cols-2 gap-2 md:gap-3 bg-white">
             <div className="bg-indigo-50/50 p-2 md:p-4 rounded-lg md:rounded-2xl border border-indigo-100">
                 <div className="text-sm md:text-lg shadow-sm mb-1 md:mb-2">😴</div>
                 <div className="h-1.5 md:h-2 w-8 md:w-12 bg-indigo-200 rounded-full mb-1"></div>
             </div>
             <div className="bg-emerald-50/50 p-2 md:p-4 rounded-lg md:rounded-2xl border border-emerald-100">
                 <div className="text-sm md:text-lg shadow-sm mb-1 md:mb-2">🥗</div>
                 <div className="h-1.5 md:h-2 w-8 md:w-12 bg-emerald-200 rounded-full mb-1"></div>
             </div>
        </div>
    </div>
);

// 5. Mockup Diary
const DiaryBookPreview = () => (
    <div className="relative w-full max-w-[280px] md:max-w-sm aspect-[4/3] bg-[#fffdf5] rounded-l-xl md:rounded-l-2xl rounded-r-xl md:rounded-r-2xl shadow-2xl border-l-2 md:border-l-4 border-r-2 md:border-r-4 border-gray-300 flex overflow-hidden rotate-[-1deg] hover:rotate-0 transition-transform duration-500 group z-10 mx-auto">
        <div className="flex-1 border-r border-gray-200 p-2 md:p-4 relative flex flex-col">
            <h4 className="text-[8px] md:text-sm font-serif font-bold text-gray-700 mb-2 md:mb-4 opacity-70">Journal</h4>
            <div className="space-y-1 md:space-y-4">
                <div className="flex gap-1 md:gap-2 items-start">
                    <div className="w-5 md:w-8 text-[6px] md:text-[10px] text-gray-400 font-bold text-right pt-0.5 md:pt-1">OCT 12</div>
                    <div className="flex-1 bg-blue-50/50 p-1 md:p-2 rounded-md md:rounded-lg">
                        <div className="h-1 md:h-1.5 w-3/4 bg-gray-300 rounded-full mb-0.5 md:mb-1"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-1 p-2 md:p-4 relative bg-[#fffdf5]">
            <div className="flex justify-between items-center mb-1 md:mb-3">
                <span className="text-[6px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest">Today</span>
                <div className="text-sm md:text-xl">😌</div>
            </div>
            <div className="space-y-1 md:space-y-3 pt-1">
                <div className="w-full h-[1px] bg-blue-100"></div>
                <div className="w-full h-[1px] bg-blue-100"></div>
            </div>
        </div>
    </div>
);

// --- COMPONENT: HERO SIMPLE ---
const HeroSimple = () => {
  return (
    <header className="relative z-10 pt-28 pb-20 md:pb-32 px-6 flex flex-col items-center text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-[#3664BA] opacity-10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-5xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#3664BA] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3664BA]"></span>
          </span>
          Available for PPTI Students
        </div>

        <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[#1A1A1A] leading-[0.95] md:leading-[0.9] mb-8 md:mb-10">
          NO STRESS<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3664BA] via-[#5a8dee] to-[#3664BA] animate-gradient-x bg-[length:200%_auto]">
            MORE SUCCESS
          </span>
        </h1>
        
        <p className="text-lg md:text-2xl text-gray-500 max-w-xl md:max-w-3xl mx-auto font-medium leading-relaxed mb-10 md:mb-12 px-4">
          Your personal academic companion. Track mood, manage stress, and survive college without losing your mind.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-5 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/login" className="px-8 py-4 md:px-10 md:py-5 bg-[#1A1A1A] text-white rounded-full font-bold text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group w-full sm:w-auto">
            Get Started Free <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </Link>
        </div>
      </motion.div>

      <style>{`
         @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
         }
         .animate-gradient-x {
            animation: gradient-x 3s ease infinite;
         }
      `}</style>
    </header>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };
  
  return (
    <div className="min-h-screen font-sans bg-[#F8F9FA] text-[#1A1A1A] overflow-x-hidden selection:bg-[#3664BA] selection:text-white">
      
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 transition-all">
         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative">
            <Link to="/" className="flex items-center gap-2 shrink-0">
                <img src={LogoNostressia} alt="Logo" className="h-7 md:h-8 w-auto" />
                <span className="font-bold text-[#3664BA] text-lg">Nostressia</span>
            </Link>

            <button 
              className="md:hidden p-2 text-gray-600 hover:text-[#3664BA] focus:outline-none"
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
                        className="text-sm font-medium text-gray-600 hover:text-[#3664BA] transition-colors relative group"
                     >
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#3664BA] transition-all group-hover:w-full"></span>
                     </button>
                  ))}
               </div>
               <Link to="/login" className="shrink-0 px-6 py-2 bg-[#1A1A1A] hover:bg-[#3664BA] text-white rounded-full font-medium text-sm transition-colors shadow-lg">
                  Login
               </Link>
            </div>
         </div>

         <AnimatePresence>
            {isMobileMenuOpen && (
               <motion.div 
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
                           className="text-left text-base font-medium text-gray-600 hover:text-[#3664BA] py-2"
                        >
                           {item}
                        </button>
                     ))}
                     <hr className="border-gray-100" />
                     <Link 
                        to="/login" 
                        className="text-center w-full px-6 py-3 bg-[#1A1A1A] text-white rounded-full font-medium transition-colors shadow-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                     >
                        Login
                     </Link>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </nav>

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
            
            {/* === MOBILE LAYOUT (< md) === */}
            <div className="md:hidden space-y-8">
                {/* 1. Header (Title & Desc) */}
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F2994A] text-xs font-bold mb-2">
                        <Smile size={14} /> Mood Tracker
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Don't bottle it up. Track it.</h2>
                     <p className="text-sm text-gray-500 leading-relaxed px-2">
                        Understand your emotional patterns. Our intuitive mood tracker helps you identify what makes you tick.
                     </p>
                </div>
                {/* 2. Body (Row: Preview Left | Points Right) */}
                <div className="flex flex-row items-center gap-2">
                    <div className="w-[58%] flex justify-center">
                        <div className="scale-[0.85] origin-center w-full">
                            <MoodCard />
                        </div>
                    </div>
                    <div className="w-[42%]">
                        <ul className="space-y-3">
                            {['Daily Check-in', 'Visual Charts', 'Trigger Analysis'].map((item, i) => (
                               <li key={i} className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                                  <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                                  <span className="leading-tight">{item}</span>
                               </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* === DESKTOP LAYOUT (>= md) === */}
            <div className="hidden md:flex flex-row items-center gap-24">
                {/* Image Left */}
                <motion.div 
                   initial={{ opacity: 0, x: -50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex-1 relative flex justify-center"
                >
                   <div className="absolute inset-0 bg-blue-200 rounded-full blur-[80px] opacity-40"></div>
                   <MoodCard />
                </motion.div>
                {/* Text Right */}
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
             
             {/* === MOBILE LAYOUT === */}
             <div className="md:hidden space-y-8">
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#3664BA] text-xs font-bold mb-2">
                        <BarChart3 size={14} /> Analytics
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">See the big picture.</h2>
                     <p className="text-sm text-gray-500 leading-relaxed px-2">
                        Analyze your monthly progress. Spot patterns in your stress levels and check past records.
                     </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <div className="w-[58%] flex justify-center">
                        <div className="scale-[0.85] origin-center w-full">
                            <AnalyticsCard />
                        </div>
                    </div>
                    <div className="w-[42%]">
                        <ul className="space-y-3">
                            {['Monthly History', 'Pattern Recognition', 'Data Insights'].map((item, i) => (
                               <li key={i} className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                                  <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                                  <span className="leading-tight">{item}</span>
                               </li>
                            ))}
                        </ul>
                    </div>
                </div>
             </div>

             {/* === DESKTOP LAYOUT (Reverse) === */}
             <div className="hidden md:flex flex-row-reverse items-center gap-24">
                {/* Image Right */}
                <motion.div 
                   initial={{ opacity: 0, x: 50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex-1 relative flex justify-center"
                >
                   <div className="absolute inset-0 bg-purple-200 rounded-full blur-[80px] opacity-40"></div>
                   <AnalyticsCard />
                </motion.div>
                {/* Text Left */}
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
             
             {/* === MOBILE LAYOUT === */}
             <div className="md:hidden space-y-8">
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-xs font-bold mb-2">
                        <Zap size={14} /> Motivation
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Find your spark.</h2>
                     <p className="text-sm text-gray-500 leading-relaxed px-2">
                        Get personalized motivational quotes to lift your spirits and keep you going.
                     </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <div className="w-[58%] flex justify-center">
                        <div className="scale-[0.85] origin-center w-full">
                            <MotivationCard />
                        </div>
                    </div>
                    <div className="w-[42%]">
                        <ul className="space-y-3">
                            {['Daily Quotes', 'Positive Affirmations', 'Mood Boosters'].map((item, i) => (
                               <li key={i} className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                                  <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                                  <span className="leading-tight">{item}</span>
                               </li>
                            ))}
                        </ul>
                    </div>
                </div>
             </div>

             {/* === DESKTOP LAYOUT === */}
             <div className="hidden md:flex flex-row items-center gap-24">
                <motion.div 
                   initial={{ opacity: 0, x: -50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex-1 relative flex justify-center"
                >
                   <div className="absolute inset-0 bg-yellow-200 rounded-full blur-[80px] opacity-40"></div>
                   <MotivationCard />
                </motion.div>
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
             
             {/* === MOBILE LAYOUT === */}
             <div className="md:hidden space-y-8">
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold mb-2">
                        <Star size={14} /> Tips & Tricks
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Rest & Reset.</h2>
                     <p className="text-sm text-gray-500 leading-relaxed px-2">
                        Recharge your mind with daily curated tips. Simple actions for a calmer you.
                     </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <div className="w-[58%] flex justify-center">
                        <div className="scale-[0.85] origin-center w-full">
                            <TipsPagePreview />
                        </div>
                    </div>
                    <div className="w-[42%]">
                        <ul className="space-y-3">
                            <li className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                               <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                               <span className="leading-tight">Daily Curated Tips</span>
                            </li>
                            <li className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                               <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                               <span className="leading-tight">Breathing Exercises</span>
                            </li>
                            <li className="mt-2 block">
                               <Link to="/login" className="inline-flex items-center gap-1 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-0.5 hover:text-[#2a4e94] text-xs">
                                  Access Library <ArrowRight size={12} />
                               </Link>
                            </li>
                        </ul>
                    </div>
                </div>
             </div>

             {/* === DESKTOP LAYOUT (Reverse) === */}
             <div className="hidden md:flex flex-row-reverse items-center gap-24">
                <motion.div 
                   initial={{ opacity: 0, x: 50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex-1 relative flex justify-center"
                >
                   <div className="absolute inset-0 bg-green-200 rounded-full blur-[80px] opacity-40"></div>
                   <TipsPagePreview />
                </motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                      <Star size={24} />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">Rest & Reset.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Recharge your mind with daily curated tips. Simple actions for a calmer you, from breathing techniques to sleep hygiene.
                   </p>
                   <Link to="/login" className="inline-flex items-center gap-2 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-1 hover:text-[#2a4e94] transition-colors">
                      Login to Access Library <ArrowRight size={16} />
                   </Link>
                </div>
             </div>

         </div>

         {/* ITEM 5: DIARY */}
         <div id="diary" className="scroll-mt-32">
             
             {/* === MOBILE LAYOUT === */}
             <div className="md:hidden space-y-8">
                <div className="text-center space-y-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold mb-2">
                        <Book size={14} /> Diary
                     </div>
                     <h2 className="text-3xl font-bold text-[#1A1A1A]">Dear Diary.</h2>
                     <p className="text-sm text-gray-500 leading-relaxed px-2">
                        Clear your mind by writing it down. A safe, private space to reflect.
                     </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                    <div className="w-[58%] flex justify-center">
                        <div className="scale-[0.85] origin-center w-full">
                            <DiaryBookPreview />
                        </div>
                    </div>
                    <div className="w-[42%]">
                        <ul className="space-y-3">
                            <li className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                               <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                               <span className="leading-tight">Private & Secure</span>
                            </li>
                            <li className="flex flex-col items-start gap-1 text-xs text-gray-700 font-medium">
                               <CheckCircle size={14} className="text-[#3664BA] shrink-0" /> 
                               <span className="leading-tight">Reflect on your day</span>
                            </li>
                            <li className="mt-2 block">
                               <Link to="/login" className="inline-flex items-center gap-1 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-0.5 hover:text-[#2a4e94] text-xs">
                                  Start Journaling <ArrowRight size={12} />
                               </Link>
                            </li>
                        </ul>
                    </div>
                </div>
             </div>

             {/* === DESKTOP LAYOUT === */}
             <div className="hidden md:flex flex-row items-center gap-24">
                <motion.div 
                   initial={{ opacity: 0, x: -50 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="flex-1 relative flex justify-center"
                >
                   <div className="absolute inset-0 bg-pink-200 rounded-full blur-[80px] opacity-40"></div>
                   <DiaryBookPreview />
                </motion.div>
                <div className="flex-1 space-y-6 text-left">
                   <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4">
                      <Book size={24} />
                   </div>
                   <h2 className="text-5xl font-bold text-[#1A1A1A]">Dear Diary.</h2>
                   <p className="text-lg text-gray-500 leading-relaxed">
                      Clear your mind by writing it down. A safe, private space to reflect on your day, gratitude, or anything that's on your mind.
                   </p>
                   <Link to="/login" className="inline-flex items-center gap-2 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-1 hover:text-[#2a4e94] transition-colors">
                      Start Journaling <ArrowRight size={16} />
                   </Link>
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
                  <span className="text-[#3664BA]">College Life?</span>
               </h2>
               <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Link to="/login" className="px-8 py-3 md:px-10 md:py-4 bg-white text-[#1A1A1A] rounded-full font-bold text-base md:text-lg hover:bg-gray-200 transition-all shadow-lg transform hover:-translate-y-1">
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

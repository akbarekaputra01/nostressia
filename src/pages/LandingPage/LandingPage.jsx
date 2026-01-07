// src/pages/LandingPage/LandingPage.jsx
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ArrowRight, Star, Lock, Smile, CheckCircle, 
  BarChart3, Zap, Quote, Bookmark, Share2, Search, 
  Book, PenTool, Image as ImageIcon, Zap as ZapIcon
} from "lucide-react";

// --- Assets ---
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";
import PreviewDashboard from "../../assets/images/preview1.png"; 

// --- COMPONENTS: UI MOCKUPS ---

// 1. Mockup Dashboard Mini
const DashboardPreview = () => (
  <div className="w-full max-w-5xl mx-auto bg-white rounded-t-3xl shadow-2xl border border-gray-200 overflow-hidden relative group">
    <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2 z-20 relative">
      <div className="w-3 h-3 rounded-full bg-red-400"></div>
      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
      <div className="w-3 h-3 rounded-full bg-green-400"></div>
      <div className="ml-4 h-4 w-64 bg-gray-200 rounded-full text-[10px] flex items-center px-2 text-gray-400 font-mono">
         nostressia.app/dashboard
      </div>
    </div>
    <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
        <img 
            src={PreviewDashboard} 
            alt="Dashboard Preview" 
            className="w-full h-full object-cover object-top filter blur-[8px] group-hover:blur-[12px] transition-all duration-700 transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500"></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer">
       <Link to="/login" className="bg-[#1A1A1A]/90 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold shadow-2xl transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500 flex items-center gap-3 hover:bg-[#3664BA] border border-white/20">
          <Lock size={18} /> Login to View Full Dashboard
       </Link>
    </div>
  </div>
);

// 2. Mockup Mood Tracker
const MoodCard = () => (
   <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm rotate-[-3deg] hover:rotate-0 transition-transform duration-500 relative z-10">
      <div className="flex justify-between items-center mb-6">
         <span className="font-bold text-gray-700">How's your mood?</span>
         <span className="text-xs text-gray-400">Today</span>
      </div>
      <div className="flex justify-between gap-2">
         <div className="text-4xl grayscale-0 cursor-pointer transition-all scale-110 shadow-sm">😫</div>
         <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😐</div>
         <div className="text-4xl grayscale hover:grayscale-0 cursor-pointer transition-all hover:scale-125">😆</div>
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100">
         <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
             <div className="h-full w-[70%] bg-[#3664BA]"></div>
         </div>
         <p className="text-xs text-center text-gray-400 mt-2">Daily Stress Prediction: High</p>
      </div>
   </div>
);

// 3. Mockup Analytics
const AnalyticsCard = () => (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm rotate-3 hover:rotate-0 transition-transform duration-500 relative group z-10">
       <div className="flex justify-between items-center mb-6">
          <div>
             <span className="font-bold text-gray-700 block">Stress History</span>
             <span className="text-xs text-gray-400">This Month</span>
          </div>
          <div className="bg-blue-50 p-2 rounded-lg text-[#3664BA]">
             <BarChart3 size={20} />
          </div>
       </div>
       <div className="flex items-end justify-between gap-2 h-32 mb-2 px-1">
          {[40, 65, 30, 85, 50, 20, 60].map((h, i) => (
             <div key={i} className="w-full bg-gray-50 rounded-t-lg relative group-hover:bg-blue-50 transition-colors h-full flex items-end">
                <motion.div 
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
       <div className="absolute -left-6 top-1/2 bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 animate-bounce-slow">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div>
             <p className="text-[10px] text-gray-400 leading-none mb-0.5">Status</p>
             <p className="text-xs font-bold text-gray-800 leading-none">Improving</p>
          </div>
       </div>
    </div>
);

// 4. Mockup Motivation
const MotivationCard = () => (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 w-full max-w-sm rotate-[-2deg] hover:rotate-0 transition-transform duration-500 relative z-10">
      <div className="flex justify-between items-center mb-6">
          <div>
              <span className="font-bold text-gray-700 block">Daily Motivation</span>
              <span className="text-xs text-gray-400">Morning Boost</span>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg text-yellow-500">
              <Zap size={20} fill="currentColor" />
          </div>
      </div>
      <div className="bg-gradient-to-br from-[#3664BA] to-[#4a7ac7] rounded-2xl p-6 text-white relative overflow-hidden group-hover:shadow-lg transition-shadow">
          <Quote className="absolute top-4 left-4 text-white/20 w-8 h-8 rotate-180" />
          <p className="font-serif text-lg leading-relaxed relative z-10 italic pt-2">
              "Believe you can and you're halfway there."
          </p>
          <p className="text-xs text-blue-100 mt-4 font-medium text-right opacity-80">- Theodore Roosevelt</p>
          
          {/* Decorative Circles */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
      </div>
      <div className="flex gap-2 mt-5 justify-center opacity-50">
          <div className="h-1.5 w-6 bg-gray-300 rounded-full"></div>
          <div className="h-1.5 w-1.5 bg-gray-300 rounded-full"></div>
          <div className="h-1.5 w-1.5 bg-gray-300 rounded-full"></div>
      </div>
    </div>
);

// 5. Mockup Tips Page
const TipsPagePreview = () => (
    <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl border border-gray-200 overflow-hidden relative group rotate-2 hover:rotate-0 transition-transform duration-500">
        <div className="bg-gradient-to-br from-[#FFF3E0] via-[#eaf2ff] to-[#e3edff] p-6 pb-4">
             <div className="flex justify-between items-center mb-6 opacity-50">
                 <div className="w-6 h-6 rounded-full bg-gray-900/10"></div>
                 <div className="w-20 h-2 rounded-full bg-gray-900/10"></div>
             </div>
             
             <div className="mb-6">
                 <h3 className="text-2xl font-extrabold text-[#3664BA] tracking-wide">
                     TIPS
                 </h3>
             </div>

             <div className="bg-white/80 rounded-xl p-3 flex items-center gap-2 shadow-sm mb-2 border border-white/60">
                 <Search size={14} className="text-gray-400" />
                 <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
             </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 bg-white">
             <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 hover:scale-105 transition-transform">
                 <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-lg shadow-sm mb-2">😴</div>
                 <div className="h-2 w-12 bg-indigo-200 rounded-full mb-1"></div>
                 <div className="h-1.5 w-8 bg-indigo-100 rounded-full"></div>
             </div>
             <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 hover:scale-105 transition-transform">
                 <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-lg shadow-sm mb-2">🥗</div>
                 <div className="h-2 w-12 bg-emerald-200 rounded-full mb-1"></div>
                 <div className="h-1.5 w-8 bg-emerald-100 rounded-full"></div>
             </div>
             <div className="col-span-2 bg-teal-50/50 p-3 rounded-2xl border border-teal-100 flex items-center gap-3 hover:scale-102 transition-transform">
                 <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-lg shadow-sm">🧘</div>
                 <div className="flex-1">
                    <div className="h-2 w-20 bg-teal-200 rounded-full mb-1"></div>
                    <div className="h-1.5 w-32 bg-teal-100 rounded-full"></div>
                 </div>
             </div>
        </div>
    </div>
);

// 6. Mockup Diary (OPEN BOOK STYLE - BARU!)
const DiaryBookPreview = () => (
    <div className="relative w-full max-w-sm aspect-[4/3] bg-[#fffdf5] rounded-l-2xl rounded-r-2xl shadow-2xl border-l-4 border-r-4 border-gray-300 flex overflow-hidden rotate-[-2deg] hover:rotate-0 transition-transform duration-500 group z-10">
        {/* Cover Effect */}
        <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-gray-400 to-transparent z-20"></div>
        
        {/* Spine Shadow */}
        <div className="absolute top-0 bottom-0 left-1/2 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/5 to-transparent z-10 pointer-events-none"></div>

        {/* Left Page */}
        <div className="flex-1 border-r border-gray-200 p-4 relative flex flex-col">
            <h4 className="text-sm font-serif font-bold text-gray-700 mb-4 opacity-70">My Journal</h4>
            <div className="space-y-4">
                <div className="flex gap-2 items-start">
                    <div className="w-8 text-[10px] text-gray-400 font-bold text-right pt-1">OCT 12</div>
                    <div className="flex-1 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <div className="h-1.5 w-3/4 bg-gray-300 rounded-full mb-1"></div>
                        <div className="h-1.5 w-1/2 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
                <div className="flex gap-2 items-start">
                    <div className="w-8 text-[10px] text-gray-400 font-bold text-right pt-1">OCT 11</div>
                    <div className="flex-1 p-2">
                        <div className="h-1.5 w-full bg-gray-200 rounded-full mb-1"></div>
                        <div className="h-1.5 w-2/3 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
            {/* Sticker */}
            <div className="absolute bottom-4 left-4 rotate-12 opacity-80">
                <div className="bg-yellow-200 text-xs px-2 py-1 rounded-sm shadow-sm border border-yellow-300">Memories ✏️</div>
            </div>
        </div>

        {/* Right Page */}
        <div className="flex-1 p-4 relative bg-[#fffdf5]">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Today</span>
                <div className="text-xl">😌</div>
            </div>
            
            <div className="space-y-3 pt-1">
                <div className="w-full h-[1px] bg-blue-100 relative">
                    <p className="absolute -top-3 text-[10px] text-gray-600 font-serif italic">I felt really productive today!</p>
                </div>
                <div className="w-full h-[1px] bg-blue-100"></div>
                <div className="w-full h-[1px] bg-blue-100"></div>
                <div className="w-full h-[1px] bg-blue-100"></div>
            </div>

            <div className="mt-4 flex gap-2 justify-end opacity-50">
                <ImageIcon size={12} />
                <PenTool size={12} />
            </div>
        </div>
    </div>
);

export default function LandingPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  return (
    <div className="min-h-screen font-sans bg-[#F8F9FA] text-[#1A1A1A] overflow-x-hidden selection:bg-[#3664BA] selection:text-white">
      
      {/* --- GRID BACKGROUND --- */}
      <div className="fixed inset-0 z-0 opacity-[0.4] pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
         <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
                <img src={LogoNostressia} alt="Logo" className="h-8 w-auto" />
                <span className="font-bold text-[#3664BA] text-lg hidden sm:block">Nostressia</span>
            </Link>
            <Link to="/login" className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#3664BA] text-white rounded-full font-medium text-sm transition-colors shadow-lg">
                Login
            </Link>
         </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative z-10 pt-32 pb-16 px-6 flex flex-col items-center text-center overflow-hidden">
         <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="mb-10"
         >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[#1A1A1A] leading-none mb-6">
               NO STRESS<br/>
               <span className="text-[#3664BA]">MORE SUCCESS</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 font-medium">
               Your personal academic companion. Track mood, manage stress, and survive college without losing your mind.
            </p>
         </motion.div>

         <motion.div 
            initial={{ opacity: 0, rotateX: 20, y: 100 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="w-full px-2 perspective-1000"
            style={{ perspective: "1000px" }}
         >
            <DashboardPreview />
         </motion.div>
      </header>

      {/* --- RUNNING TEXT --- */}
      <div className="bg-[#1A1A1A] py-6 border-y-4 border-[#3664BA] relative z-20 rotate-1 scale-105 shadow-2xl my-10">
         <div className="whitespace-nowrap flex animate-marquee">
            {[...Array(10)].map((_, i) => (
               <div key={i} className="flex items-center mx-8">
                   <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 italic">
                      NO STRESS • MORE SUCCESS
                   </span>
                   <Star className="text-[#F2994A] ml-8 w-8 h-8 fill-current animate-spin-slow" />
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

      {/* --- FEATURE SHOWCASE --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 space-y-32">
         
         {/* 1. MOOD TRACKER (Left) */}
         <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 relative w-full flex justify-center"
            >
               <div className="absolute inset-0 bg-blue-200 rounded-full blur-[80px] opacity-40"></div>
               <MoodCard />
            </motion.div>
            
            <div className="flex-1 space-y-6 text-center md:text-left">
               <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-[#F2994A] mb-4 mx-auto md:mx-0">
                  <Smile size={24} />
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">Don't bottle it up. <br/>Track it.</h2>
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

         {/* 2. ANALYTICS (Right) */}
         <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 relative w-full flex justify-center"
            >
               <div className="absolute inset-0 bg-purple-200 rounded-full blur-[80px] opacity-40"></div>
               <AnalyticsCard />
            </motion.div>
            
            <div className="flex-1 space-y-6 text-center md:text-left">
               <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#3664BA] mb-4 mx-auto md:mx-0">
                  <BarChart3 size={24} />
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">See the big picture.</h2>
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

         {/* 3. MOTIVATION (Left) */}
         <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 relative flex justify-center w-full"
            >
               <div className="absolute inset-0 bg-yellow-200 rounded-full blur-[80px] opacity-40"></div>
               <MotivationCard />
            </motion.div>
            
            <div className="flex-1 space-y-6 text-center md:text-left">
               <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 mb-4 mx-auto md:mx-0">
                  <Zap size={24} fill="currentColor" />
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">Find your spark.</h2>
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

         {/* 4. TIPS (Right) */}
         <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <motion.div 
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 relative flex justify-center w-full"
            >
               <div className="absolute inset-0 bg-green-200 rounded-full blur-[80px] opacity-40"></div>
               <TipsPagePreview />
            </motion.div>
            
            <div className="flex-1 space-y-6 text-center md:text-left">
               <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 mx-auto md:mx-0">
                  <Star size={24} />
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">Rest & Reset.</h2>
               <p className="text-lg text-gray-500 leading-relaxed">
                  Recharge your mind with daily curated tips. Simple actions for a calmer you, from breathing techniques to sleep hygiene.
               </p>
               <Link to="/login" className="inline-flex items-center gap-2 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-1 hover:text-[#2a4e94] transition-colors">
                  Login to Access Library <ArrowRight size={16} />
               </Link>
            </div>
         </div>

         {/* 5. DIARY (Left - NEW!) */}
         <div className="flex flex-col md:flex-row items-center gap-16">
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1 relative flex justify-center w-full"
            >
               <div className="absolute inset-0 bg-pink-200 rounded-full blur-[80px] opacity-40"></div>
               <DiaryBookPreview />
            </motion.div>
            
            <div className="flex-1 space-y-6 text-center md:text-left">
               <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4 mx-auto md:mx-0">
                  <Book size={24} />
               </div>
               <h2 className="text-4xl md:text-5xl font-bold text-[#1A1A1A]">Dear Diary.</h2>
               <p className="text-lg text-gray-500 leading-relaxed">
                  Clear your mind by writing it down. A safe, private space to reflect on your day, gratitude, or anything that's on your mind.
               </p>
               <Link to="/login" className="inline-flex items-center gap-2 text-[#3664BA] font-bold border-b-2 border-[#3664BA] pb-1 hover:text-[#2a4e94] transition-colors">
                  Start Journaling <ArrowRight size={16} />
               </Link>
            </div>
         </div>
         
      </section>

      {/* --- CTA BOTTOM --- */}
      <section className="py-20 px-6">
         <div className="max-w-5xl mx-auto bg-[#1A1A1A] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-700 via-black to-black"></div>
            
            <div className="relative z-10 space-y-8">
               <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                  Ready to upgrade your <br/>
                  <span className="text-[#3664BA]">College Life?</span>
               </h2>
               <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Link to="/login" className="px-10 py-4 bg-white text-[#1A1A1A] rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-lg transform hover:-translate-y-1">
                     Join Now - It's Free
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER SIMPLE --- */}
      <footer className="py-12 bg-[#F8F9FA] text-center border-t border-gray-200">
         <div className="flex justify-center items-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
            <img src={LogoNostressia} alt="Logo" className="h-6 w-auto" />
            <span className="font-bold text-gray-800">Nostressia</span>
         </div>
         <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Team 4 PPTI BCA.</p>
      </footer>

    </div>
  );
}
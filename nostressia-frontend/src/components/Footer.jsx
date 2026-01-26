// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail, Heart } from "lucide-react";
import LogoNostressia from "../assets/images/Logo-Nostressia.png"; 

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-30 mt-6 border-t border-white/40 bg-white/40 backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="max-w-[1400px] mx-auto px-6 pt-6 pb-3 md:pt-8 md:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          
          {/* KOLOM 1: Brand & Deskripsi */}
          <div className="md:col-span-5 flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <img 
                src={LogoNostressia} 
                alt="Nostressia Logo" 
                className="h-8 w-auto" 
              />
              <span className="text-xl font-extrabold text-gray-800 tracking-tight dark:text-slate-100">
                Nostressia
              </span>
            </Link>
            <p className="text-gray-600 leading-relaxed text-xs md:text-sm pr-10 dark:text-slate-300">
              Your daily companion for mental wellness. We help you track your mood and find motivation.
            </p>
          </div>

          {/* KOLOM 2: Quick Links */}
          <div className="md:col-span-3">
            <h3 className="text-gray-900 text-sm font-bold mb-2 dark:text-slate-100">Explore</h3>
            <ul className="space-y-1.5">
              <li><Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium dark:text-slate-300 dark:hover:text-blue-300">Dashboard</Link></li>
              <li><Link to="/tips" className="text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium dark:text-slate-300 dark:hover:text-blue-300">Daily Tips</Link></li>
              <li><Link to="/motivation" className="text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium dark:text-slate-300 dark:hover:text-blue-300">Motivation</Link></li>
              <li><Link to="/diary" className="text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium dark:text-slate-300 dark:hover:text-blue-300">My Diary</Link></li>
            </ul>
          </div>

          {/* KOLOM 3: Contact Us [DIPERBARUI] */}
          <div className="md:col-span-4">
            <h3 className="text-gray-900 text-sm font-bold mb-2 dark:text-slate-100">Contact Us</h3>
            <p className="text-gray-600 text-xs mb-3 dark:text-slate-300">
              Have questions? Reach out to us directly via email.
            </p>
            
            {/* Tombol Contact Us yang lebih jelas */}
            <div className="flex flex-col gap-3">
              <a 
                href="https://mail.google.com/mail/?view=cm&fs=1&to=nostressia.official@gmail.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-fit px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm transition-all group dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:text-orange-300"
              >
                <Mail size={16} className="text-gray-500 group-hover:text-orange-500 dark:text-slate-300" />
                <span className="text-xs font-semibold">Contact Support</span>
              </a>

              {/* Social Media Icons (Optional, tetap dipertahankan untuk koneksi lain) */}
              <div className="flex items-center gap-3 mt-1">
                <a 
                  href="https://www.instagram.com/nostressia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-white/50 text-gray-500 hover:text-pink-600 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-pink-300"
                >
                  <Instagram size={16} />
                </a>

                <a 
                  href="https://x.com/nostressia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-white/50 text-gray-500 hover:text-blue-400 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-blue-300"
                >
                  <Twitter size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* COPYRIGHT SECTION */}
        <div className="mt-6 pt-3 border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 font-medium dark:border-slate-700/60 dark:text-slate-400">
          <p>© {currentYear} Nostressia. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart size={10} className="text-red-400 fill-red-400" />
            <span>for better life.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

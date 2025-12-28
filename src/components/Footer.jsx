// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Mail, Heart } from "lucide-react";
import LogoNostressia from "../assets/images/Logo-Nostressia.png"; // Pastikan path ini benar

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-30 mt-20 border-t border-white/40 bg-white/40 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          
          {/* KOLOM 1: Brand & Deskripsi (Lebar 5 kolom) */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2 w-fit">
              <img 
                src={LogoNostressia} 
                alt="Nostressia Logo" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">
                Nostressia
              </span>
            </Link>
            <p className="text-gray-600 leading-relaxed text-sm md:text-base pr-4">
              Your daily companion for mental wellness. We help you track your mood, find motivation, and discover tips for a balanced life.
            </p>
          </div>

          {/* KOLOM 2: Quick Links (Lebar 3 kolom) */}
          <div className="md:col-span-3">
            <h3 className="text-gray-900 font-bold mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Dashboard</Link>
              </li>
              <li>
                <Link to="/tips" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Daily Tips</Link>
              </li>
              <li>
                <Link to="/motivation" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">Motivation</Link>
              </li>
              <li>
                <Link to="/diary" className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">My Diary</Link>
              </li>
            </ul>
          </div>

          {/* KOLOM 3: Connect / Socials (Lebar 4 kolom) */}
          <div className="md:col-span-4">
            <h3 className="text-gray-900 font-bold mb-4">Stay Connected</h3>
            <p className="text-gray-600 text-sm mb-4">
              Have questions or suggestions? Reach out to us.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-white/50 text-gray-500 hover:text-pink-600 hover:scale-110 hover:shadow-md transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-white/50 text-gray-500 hover:text-blue-400 hover:scale-110 hover:shadow-md transition-all">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-white/50 text-gray-500 hover:text-orange-500 hover:scale-110 hover:shadow-md transition-all">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT SECTION */}
        <div className="mt-12 pt-8 border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {currentYear} Nostressia. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" />
            <span>for better life.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoImage from "../assets/images/Logo-Nostressia.png"; 
import { DEFAULT_AVATAR, resolveAvatarUrl } from "../utils/avatar";
import { Flame } from "lucide-react"; 

// --- Data Menu Navigasi ---
const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
  { name: "Motivation", href: "/motivation" },
  { name: "Tips", href: "/tips" },
  { name: "Diary", href: "/diary" },
];

const TODAY_LOG_STORAGE_KEY = "nostressia_today_log";

// --- TERIMA PROPS 'user' DI SINI ---
const Navbar = ({ user }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navbarRef = useRef(null);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fallbackAvatar = DEFAULT_AVATAR;
  const avatarSrc = resolveAvatarUrl(user?.avatar) || fallbackAvatar;

  // --- LOGIKA WARNA API BERDASARKAN STREAK ---
  const getFlameColor = (streakCount, hasLoggedToday) => {
    const count = streakCount || 0;
    if (!hasLoggedToday) {
      return "text-gray-400 fill-gray-300/40";
    }
    if (count >= 60) {
      return "text-purple-600 fill-purple-600/20";
    }
    if (count >= 7) {
      return "text-orange-500 fill-orange-500/20";
    }
    return "text-yellow-500 fill-yellow-400/30";
  };

  const streakVal = user?.streak || 0;
  const todayKey =
    typeof window !== "undefined"
      ? new Date().toISOString().slice(0, 10)
      : "";
  const hasLoggedToday =
    typeof window !== "undefined" &&
    localStorage.getItem(TODAY_LOG_STORAGE_KEY) === todayKey;
  const flameClass = getFlameColor(streakVal, hasLoggedToday);

  return (
    <header
      ref={navbarRef}
      className="
                fixed md:sticky top-4 
                mx-4 lg:mx-6 p-4 
                z-50 w-[calc(100%-32px)] md:w-[calc(100%-48px)]
                flex flex-wrap justify-between items-center 
                rounded-[20px] 
                bg-white/60 backdrop-blur-md 
                border border-white/20 
                shadow-xl 
                transition-all duration-300 
                dark:bg-slate-900/70 dark:border-slate-700/60
            "
    >
      <div className="flex justify-between items-center w-full">
        {/* LOGO */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center cursor-pointer">
            <img
              src={LogoImage}
              alt="Nostressia Logo"
              className="h-[50px] md:h-[65px] w-auto"
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex">
            <ul className="flex gap-6 list-none">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="
                                group relative 
                                text-gray-600 font-semibold text-[0.95rem]
                                py-2 px-1 
                                transition-all duration-200 
                                hover:text-gray-900
                                dark:text-slate-200 dark:hover:text-white
                            "
                  >
                    {link.name}
                    <span
                      className={`
                                        absolute left-0 -bottom-1 h-[3px] rounded-full
                                        transition-all duration-300 
                                        ${
                                          isActive(link.href)
                                            ? "w-full bg-[#3664BA]"
                                            : "w-0 bg-transparent group-hover:w-full group-hover:bg-gray-500"
                                        }
                                    `}
                    ></span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* KANAN: STREAK & PROFIL */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* [FINAL] STREAK PILL - API BERUBAH WARNA */}
          <Link 
            to="/profile"
            className="
              flex items-center gap-2 
              px-3 py-1.5 md:px-4 md:py-2 
              text-gray-600 font-semibold text-xs md:text-sm 
              rounded-full 
              border border-gray-200/60
              hover:bg-gray-50 hover:border-gray-300
              transition-all duration-300
              cursor-pointer
              dark:text-slate-200 dark:border-slate-600/80 dark:hover:bg-slate-800 dark:hover:border-slate-500
            "
            title={`Current Streak: ${streakVal} days`}
          >
            {/* Ikon Flame berubah warna sesuai logika di atas */}
            <Flame className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-500 ${flameClass}`} />
            
            {/* Angka tetap abu-abu netral */}
            <span>{streakVal}</span>
          </Link>

          {/* FOTO PROFIL (DESKTOP) */}
          <Link to="/profile" className="hidden lg:block">
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 object-cover cursor-pointer hover:border-blue-400 transition-colors dark:border-slate-600"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
          </Link>

          {/* HAMBURGER MENU */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-black/5 rounded-xl transition-all ml-1 cursor-pointer dark:text-slate-200 dark:hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div
        className={`
                    w-full lg:hidden flex flex-col items-center gap-4 
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${
                      isMobileMenuOpen
                        ? "max-h-[400px] mt-4 pt-4 border-t border-gray-200 opacity-100 dark:border-slate-700"
                        : "max-h-0 opacity-0"
                    }
                `}
      >
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`
                        text-base font-semibold py-2 px-4 rounded-lg w-full text-center transition-colors
                        ${
                          isActive(link.href)
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                        }
                    `}
          >
            {link.name}
          </Link>
        ))}

        <div className="w-full border-t border-gray-100 mt-2 pt-3 flex flex-col items-center dark:border-slate-700">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer w-full justify-center dark:hover:bg-slate-800"
          >
            {/* FOTO PROFIL (MOBILE) */}
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-9 h-9 rounded-full border border-gray-300 object-cover dark:border-slate-600"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
            <span className="text-gray-700 font-semibold dark:text-slate-200">My Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

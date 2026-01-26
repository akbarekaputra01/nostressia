// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoImage from "../assets/images/Logo-Nostressia.png"; 
import { resolveAvatarUrl } from "../utils/avatar";
import { Flame } from "lucide-react"; 

// --- Data Menu Navigasi ---
const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
  { name: "Motivation", href: "/motivation" },
  { name: "Tips", href: "/tips" },
  { name: "Diary", href: "/diary" },
];

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

  const fallbackAvatar = "https://i.pravatar.cc/40?img=12";
  const avatarSrc = resolveAvatarUrl(user?.avatar) || fallbackAvatar;

  // --- LOGIKA WARNA API BERDASARKAN STREAK ---
  const getFlameColor = (streakCount) => {
    const count = streakCount || 0;
    if (count >= 60) {
      // Level Tinggi (60+): Api 2
      return "text-purple-600 fill-purple-600/20";
    }
    // Level Awal (0-59): Api 1
    return "text-orange-500 fill-orange-500/20";
  };

  const streakVal = user?.streak || 0;
  const flameClass = getFlameColor(streakVal);

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
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 object-cover cursor-pointer hover:border-blue-400 transition-colors"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
          </Link>

          {/* HAMBURGER MENU */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-black/5 rounded-xl transition-all ml-1 cursor-pointer"
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
                        ? "max-h-[400px] mt-4 pt-4 border-t border-gray-200 opacity-100"
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
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                    `}
          >
            {link.name}
          </Link>
        ))}

        <div className="w-full border-t border-gray-100 mt-2 pt-3 flex flex-col items-center">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer w-full justify-center"
          >
            {/* FOTO PROFIL (MOBILE) */}
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-9 h-9 rounded-full border border-gray-300 object-cover"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
            <span className="text-gray-700 font-semibold">My Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

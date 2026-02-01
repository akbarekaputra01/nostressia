// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoImage from "../assets/images/Logo-Nostressia.png";
import { DEFAULT_AVATAR, resolveAvatarUrl } from "../utils/avatar";
import { Flame } from "lucide-react";
import { hasLoggedToday as resolveHasLoggedToday, resolveDisplayedStreak } from "../utils/streak";

// --- Navigation menu data ---
const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
  { name: "Motivation", href: "/motivation" },
  { name: "Tips", href: "/tips" },
  { name: "Diary", href: "/diary" },
];

// --- Receive the 'user' prop here ---
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

  // --- Flame color logic based on the current streak ---
  const getFlameColor = (streakCount, hasLoggedToday) => {
    const count = streakCount || 0;

    // If the user has not logged today or streak is <= 0, keep the flame muted.
    if (!hasLoggedToday || count <= 0) {
      return "text-text-muted fill-text-muted/40";
    }

    // >=60 -> info
    if (count >= 60) {
      return "text-brand-info fill-brand-info/30";
    }

    // >=7 -> warning
    if (count >= 7) {
      return "text-brand-warning fill-brand-warning/30";
    }

    // >=1 -> accent
    if (count >= 1) {
      return "text-brand-accent fill-brand-accent/30";
    }

    return "text-text-muted fill-text-muted/40";
  };

  const streakVal = user?.streak || 0;
  const hasLoggedToday = resolveHasLoggedToday();
  const displayStreak = resolveDisplayedStreak(streakVal);
  const flameClass = getFlameColor(displayStreak, hasLoggedToday);

  return (
    <header
      ref={navbarRef}
      className="
                fixed md:sticky top-4 
                mx-4 lg:mx-6 p-4 
                z-50 w-[calc(100%-32px)] md:w-[calc(100%-48px)]
                flex flex-wrap justify-between items-center 
                rounded-[20px] 
                bg-surface/70 backdrop-blur-md 
                border border-border/50 
                shadow-xl 
                transition-all duration-300 
                dark:bg-surface/80 dark:border-border/60
            glass-panel
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
                                text-text-secondary font-semibold text-[0.95rem]
                                py-2 px-1 
                                transition-all duration-200 
                                hover:text-text-primary
                                dark:text-text-secondary dark:hover:text-text-primary
                            "
                  >
                    {link.name}
                    <span
                      className={`
                                        absolute left-0 -bottom-1 h-[3px] rounded-full
                                        transition-all duration-300 
                                        ${
                                          isActive(link.href)
                                            ? "w-full bg-brand-primary"
                                            : "w-0 bg-transparent group-hover:w-full group-hover:bg-text-muted"
                                        }
                                    `}
                    ></span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Right: Streak & profile */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Streak pill with API-driven color */}
          <Link
            to="/profile"
            className="
              flex items-center gap-2 
              px-3 py-1.5 md:px-4 md:py-2 
              text-text-secondary font-semibold text-xs md:text-sm 
              rounded-full 
              border border-border/70
              hover:bg-surface-muted hover:border-border
              transition-all duration-300
              cursor-pointer
              dark:text-text-secondary dark:border-border/70 dark:hover:bg-surface-muted dark:hover:border-border
            "
            title={`Current Streak: ${displayStreak} days`}
          >
            {/* The flame icon changes color based on the logic above */}
            <Flame
              className={`w-4 h-4 md:w-5 md:h-5 transition-colors duration-500 ${flameClass}`}
            />

            {/* Keep the number neutral gray */}
            <span>{displayStreak}</span>
          </Link>

          {/* Profile photo (desktop) */}
          <Link to="/profile" className="hidden lg:block">
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-border/60 object-cover cursor-pointer hover:border-brand-info transition-colors dark:border-border/70"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
          </Link>

          {/* Hamburger menu */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:bg-brand-primary/5 rounded-xl transition-all ml-1 cursor-pointer dark:text-text-secondary dark:hover:bg-surface/60"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
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
                        ? "max-h-[400px] mt-4 pt-4 border-t border-border opacity-100 dark:border-border"
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
                            ? "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-info"
                            : "text-text-secondary hover:bg-surface-muted hover:text-text-primary dark:text-text-secondary dark:hover:bg-surface-muted dark:hover:text-text-primary"
                        }
                    `}
          >
            {link.name}
          </Link>
        ))}

        <div className="w-full border-t border-border-subtle mt-2 pt-3 flex flex-col items-center dark:border-border">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-muted transition-colors cursor-pointer w-full justify-center dark:hover:bg-surface-muted"
          >
            {/* FOTO PROFIL (MOBILE) */}
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-9 h-9 rounded-full border border-border object-cover dark:border-border"
              onError={(event) => {
                event.currentTarget.src = fallbackAvatar;
              }}
            />
            <span className="text-text-secondary font-semibold dark:text-text-secondary">
              My Profile
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

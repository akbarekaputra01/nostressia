// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LogoImage from "../assets/images/Logo-Nostressia.png";

// --- Data Menu Navigasi ---
const navLinks = [
  { name: "Dashboard", href: "/" },
  { name: "Analytics", href: "/analytics" },
  { name: "Motivation", href: "/motivation" },
  { name: "Tips", href: "/tips" },
  { name: "Diary", href: "/diary" },
];

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
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
      {/* BAGIAN ATAS: Logo + Nav Desktop + Tombol Kanan */}
      <div className="flex justify-between items-center w-full">
        {/* 1. BAGIAN KIRI: Logo + Menu Desktop */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center cursor-pointer">
            <img
              src={LogoImage}
              alt="Nostressia Logo"
              className="h-[50px] md:h-[65px] w-auto"
            />
          </Link>

          {/* Navigasi Desktop (Hanya muncul di Layar Besar/LG) */}
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
                    {/* Garis Bawah Animasi */}
                    <span
                      className={`
                                                absolute left-0 -bottom-1 h-[3px] rounded-full
                                                transition-all duration-300 
                                                ${
                                                  location.pathname ===
                                                  link.href
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

        {/* 2. BAGIAN KANAN: Notifikasi & Profil & Hamburger */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Tombol Notifikasi (Lonceng) */}
          <button className="relative p-2 rounded-xl text-gray-600 hover:bg-black/5 transition-all cursor-pointer">
            {/* Ikon Lonceng SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-600 border-2 border-white/40 rounded-full"></span>
          </button>

          {/* Foto Profil - HANYA MUNCUL DI DESKTOP (lg:block) */}
          {/* 👇 BUNGKUS DENGAN LINK KE /PROFILE */}
          <Link to="/profile" className="hidden lg:block">
            <img
              src="https://i.pravatar.cc/40?img=12"
              alt="Profile"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 object-cover cursor-pointer hover:border-blue-400 transition-colors"
            />
          </Link>

          {/* 3. TOMBOL HAMBURGER (Hanya muncul di Mobile) */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-black/5 rounded-xl transition-all ml-1 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              // Ikon X (Close) SVG
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
              // Ikon Hamburger (Menu) SVG
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

      {/* 4. MOBILE MENU DROPDOWN */}
      <div
        className={`
                    w-full lg:hidden flex flex-col items-center gap-4 
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${
                      isMobileMenuOpen
                        ? "max-h-[400px] mt-4 pt-4 border-t border-gray-200"
                        : "max-h-0 opacity-0"
                    }
                `}
      >
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            onClick={() => setIsMobileMenuOpen(false)} // Tutup menu saat diklik
            className={`
                            text-base font-semibold py-2 px-4 rounded-lg w-full text-center transition-colors
                            ${
                              location.pathname === link.href
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }
                        `}
          >
            {link.name}
          </Link>
        ))}

        {/* --- BAGIAN PROFILE DI MENU MOBILE --- */}
        {/* 👇 PROFILE DI MENU BAWAH JUGA DIBUNGKUS LINK */}
        <div className="w-full border-t border-gray-100 mt-2 pt-3 flex flex-col items-center">
          <Link
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)} // Tutup menu saat diklik
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer w-full justify-center"
          >
            <img
              src="https://i.pravatar.cc/40?img=12"
              alt="Profile"
              className="w-9 h-9 rounded-full border border-gray-300 object-cover"
            />
            <span className="text-gray-700 font-semibold">My Profile</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

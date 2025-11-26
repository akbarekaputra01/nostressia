// src/components/Navbar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
// Pastikan path gambar ini sesuai dengan folder kamu
import LogoImage from "../assets/images/Logo-Nostressia.png"; 

// --- Data Menu Navigasi ---
const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Analytics", href: "/analytics" },
    { name: "Motivation", href: "/motivation" },
    { name: "Tips", href: "/tips" },
    { name: "Diary", href: "/diary" },
];

// --- Komponen Navbar Utama ---
const Navbar = ({ onPredictClick }) => {
    const location = useLocation();

    // Warna Brand
    const brandOrange = "#F2994A";
    const darkOrangeHover = "#e6893e";

    return (
        <header
            className="
                fixed md:sticky top-4 
                mx-4 lg:mx-6 p-4 
                z-50 w-[calc(100%-32px)] md:w-[calc(100%-48px)]
                flex justify-between items-center 
                rounded-[20px] 
                bg-white/40 backdrop-blur-md 
                border border-white/20 
                shadow-xl 
                transition-all duration-300 
                sm:flex-wrap sm:gap-3
            "
        >
            {/* BAGIAN KIRI: Logo + Menu */}
            <div className="flex items-center gap-8 sm:w-full lg:w-auto">
                {/* Logo */}
                <Link to="/" className="flex items-center cursor-pointer">
                    <img
                        src={LogoImage}
                        alt="Nostressia Logo"
                        className="h-[65px] w-auto"
                    />
                </Link>

                {/* Navigasi Desktop */}
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
                                        cursor-pointer
                                    "
                                >
                                    {link.name}
                                    {/* Animasi Garis Bawah */}
                                    <span
                                        className={`
                                            absolute left-0 -bottom-1 h-[3px] rounded-full
                                            transition-all duration-300 
                                            ${location.pathname === link.href
                                                ? "w-full bg-[#3664BA]"
                                                : "w-0 bg-transparent group-hover:w-full group-hover:bg-gray-500"}
                                        `}
                                    ></span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* BAGIAN KANAN: Tombol & Profil */}
            <div className="flex items-center gap-4 sm:w-full sm:justify-between lg:w-auto">
                
                {/* Notifikasi */}
                <button className="relative p-2 rounded-xl text-gray-600 hover:bg-black/5 hover:text-gray-900 transition-all duration-200 cursor-pointer">
                    <i className="ph ph-bell-simple text-xl"></i>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 border-2 border-white/40 rounded-full"></span>
                </button>

                {/* Tombol Predict */}
                <button
                    className="
                        flex items-center gap-2 text-sm md:text-[0.9rem] 
                        text-white font-bold 
                        py-2.5 px-4 rounded-xl 
                        transition-all duration-200 
                        shadow-md hover:shadow-lg hover:-translate-y-0.5
                        cursor-pointer
                    "
                    style={{ backgroundColor: brandOrange }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkOrangeHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = brandOrange)}
                    onClick={onPredictClick}
                >
                    <i className="ph ph-magic-wand"></i>
                    Predict
                </button>

                {/* Foto Profil */}
                <img
                    src="https://i.pravatar.cc/40?img=12"
                    alt="Profile Picture"
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover ml-2 cursor-pointer"
                />
            </div>
        </header>
    );
};

export default Navbar;
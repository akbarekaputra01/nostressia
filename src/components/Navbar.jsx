import React from 'react';
// Import logo dari path yang Anda sebutkan
import LogoImage from '../assets/images/Logo-Nostressia.png'; 

// Data navigasi
const navLinks = [
    { name: 'Dashboard', href: '#', isActive: true },
    { name: 'Analytics', href: '#', isActive: false },
    { name: 'Motivasi', href: '#', isActive: false },
    { name: 'Tips', href: '#', isActive: false },
    { name: 'Diary', href: '#', isActive: false },
];

/**
 * Komponen Navbar dengan styling Glassmorphism menggunakan Pure Tailwind CSS.
 * Warna disinkronkan dengan skema warna Brand Blue (#3664BA) dan Brand Orange (#F2994A).
 * * * Catatan: Pastikan Phosphor Icons dimuat di project Anda agar ikon muncul.
 * @param {string} props.activeLink - Nama tautan yang sedang aktif (default: 'Dashboard').
 * @param {function} props.onPredictClick - Handler saat tombol Predict diklik.
 */
const Navbar = ({ activeLink = 'Dashboard', onPredictClick }) => {
    
    // Warna Kustom (Menggunakan hex codes asli yang sesuai dengan file style.css)
    const brandBlue = '#3664BA';    // Sesuai dengan var(--brand-blue)
    const brandOrange = '#F2994A';  // Sesuai dengan var(--brand-orange)
    
    // Warna Hover untuk Tombol Predict
    const darkOrangeHover = '#e6893e'; 

    return (
        // Header Utama: Glassmorphism (fixed/sticky position)
        <header 
            className="
                fixed md:sticky top-4 
                mx-4 lg:mx-6 p-4 md:p-5 lg:p-4 
                z-50 w-[calc(100%-32px)] md:w-[calc(100%-48px)] lg:w-[calc(100%-48px)]
                
                flex justify-between items-center 
                rounded-[20px] 
                bg-white/40 backdrop-blur-md 
                border border-white/20 
                shadow-xl 
                transition-all duration-300 
                sm:flex-wrap sm:gap-3
            "
        >
            
            <div className="flex items-center gap-8 sm:w-full lg:w-auto">
                {/* Logo */}
                <a href="#" className="flex items-center">
                    <img 
                        src={LogoImage} 
                        alt="Nostressia Logo" 
                        className="h-[65px] w-auto"
                    />
                </a>

                {/* Navigasi Utama: hidden di bawah lg */}
                <nav className="hidden lg:flex">
                    <ul className="flex gap-6 list-none">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a 
                                    href={link.href} 
                                    className={`
                                        text-gray-600 font-semibold text-[0.95rem] 
                                        py-2 px-1 relative transition-colors duration-200 
                                        hover:text-gray-900
                                        ${link.name === activeLink ? 
                                            // Tautan Aktif: Teks Biru & Border Bawah 4px
                                            `text-[${brandBlue}] font-bold border-b-4 border-[${brandBlue}]` : 
                                            // Tautan Non-Aktif: Border Bawah transparan agar tinggi sama
                                            'border-b-4 border-transparent'
                                        }
                                    `}
                                >
                                    {link.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            <div className="flex items-center gap-4 sm:w-full sm:justify-between lg:w-auto">
                {/* Notifikasi (Icon Button) */}
                <button className="relative p-2 rounded-xl text-gray-600 hover:bg-black/5 hover:text-gray-900 transition-all duration-200">
                    <i className="ph ph-bell-simple text-xl"></i>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 border-2 border-white/40 rounded-full"></span>
                </button>

                {/* Tombol Predict (Warna Brand Orange) */}
                <button 
                    className={`
                        flex items-center gap-2 text-sm md:text-[0.9rem] 
                        bg-[${brandOrange}] hover:bg-[${darkOrangeHover}] 
                        text-white font-bold 
                        py-2.5 px-4 rounded-xl 
                        transition-all duration-200 
                        shadow-md hover:shadow-lg hover:-translate-y-0.5
                    `}
                    onClick={onPredictClick} 
                >
                    <i className="ph ph-magic-wand"></i>
                    Predict
                </button>

                {/* Tombol Forecast (Disabled) */}
                <a href="#" className="p-2 rounded-xl text-gray-400 cursor-not-allowed">
                    <i className="ph ph-trend-up text-xl"></i>
                </a>

                {/* Foto Profil */}
                <img 
                    src="https://i.pravatar.cc/40?img=12" 
                    alt="Foto Profil" 
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover ml-2"
                />
            </div>

        </header>
    );
}

export default Navbar;
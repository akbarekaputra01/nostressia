import React, { useState } from 'react';
import Navbar from "../../components/Navbar";

// --- Warna Kustom (Hex codes dari style.css) ---
const brandBlue = '#3664BA';    
const brandOrange = '#F2994A';

// Warna Background Gradient (dari style.css)
const BG_CREAM = '#FFF3E0'; 
const BG_PINK = '#eaf2ff'; 
const BG_LAVENDER = '#e3edff'; 

// --- Data Dummy ---
const trendData = [
    { day: 'Rab', level: 40 },
    { day: 'Kam', level: 60 },
    { day: 'Jum', level: 50 },
    { day: 'Sab', level: 30 },
    { day: 'Min', level: 55, active: true },
    { day: 'Sen', level: 75 },
    { day: 'Sel', level: 65 },
];

const mockStressData = {
    "2025-11-05": { level: 45, dotColor: brandOrange },
    "2025-11-10": { level: 70, dotColor: '#E53E3E' },
    "2025-11-15": { level: 20, dotColor: '#27AE60' },
    "2025-11-21": { level: 55, dotColor: brandOrange, isToday: true },
};

// --- Helper untuk Kalender ---
const renderCalendarDay = (day, currentMonth, currentYear, brandBlue) => {
    const dateString = `2025-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const data = mockStressData[dateString];
    const hasData = !!data;
    const isSelected = day === 21; 
    
    return (
        <div 
            key={day}
            className={`
                flex items-center justify-center h-12 rounded-xl font-semibold text-sm 
                cursor-pointer transition-all duration-200 relative
                text-gray-800
                ${(day < 1 || day > 30) ? 'text-gray-400 pointer-events-none' : ''}
                ${isSelected ? `bg-[${brandBlue}] text-white shadow-lg border-white/50` : ''}
                ${!isSelected && hasData ? 'hover:bg-white/50' : ''}
            `}
            style={{
                borderBottom: hasData && !isSelected ? `4px solid ${data.dotColor}` : 'none',
                background: isSelected ? brandBlue : 'transparent',
                color: isSelected ? 'white' : '#333333'
            }}
        >
            {day > 0 && day <= 30 ? day : ''}
        </div>
    );
};


// --- Komponen Utama Dashboard ---
export default function Dashboard() {
    
    // HILANGKAN STATE isFlipped
    // const [isFlipped, setIsFlipped] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date(2025, 10, 1)); 
    
    // Warna untuk Arbitrary Value
    const brandBlue = '#3664BA';    
    const brandOrange = '#F2994A';
    
    // HILANGKAN FUNGSI FLIP

    // Style Background
    const backgroundStyle = {
        minHeight: '100vh',
        backgroundColor: BG_CREAM,
        backgroundImage: `
            radial-gradient(at 10% 10%, ${BG_CREAM} 0%, transparent 50%),
            radial-gradient(at 90% 20%, ${BG_PINK} 0%, transparent 50%),
            radial-gradient(at 50% 80%, ${BG_LAVENDER} 0%, transparent 50%)
        `,
        backgroundSize: '200% 200%',
        // animation: 'gradient-bg 20s ease infinite',
    };
    
    // Data Kalender (November 2025)
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = calendarDate.getMonth();
    const year = calendarDate.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <div style={backgroundStyle} className="relative"> 

            {/* Navbar: Menggunakan placeholder function untuk onPredictClick */}
            <Navbar activeLink="Dashboard" onPredictClick={() => alert('Fungsionalitas Flip Dinonaktifkan Sementara')} />
            
            <main className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 pt-28">
                
                {/* Dashboard Grid Container */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                    {/* === KARTU PREDIKSI (GRID COL SPAN 2) - SEKARANG STATIS === */}
                    <section 
                        className="
                            col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] 
                            bg-white/40 backdrop-blur-md border border-white/20 shadow-xl
                        "
                        style={{ minHeight: '640px' }} 
                    >
                        {/* === KONTEN DEPAN SAJA === */}
                        <header className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                Prediksi Stres Hari Ini
                            </h2>
                            <div className="text-2xl text-gray-500">
                                <i className="ph ph-cloud-sun mr-2"></i> <i className="ph ph-smiley"></i>
                            </div>
                        </header>

                        <div className="text-center my-6">
                            <span 
                                className="inline-block px-3 py-1 rounded-full font-bold text-sm text-gray-900" 
                                style={{ backgroundColor: brandOrange }}
                            >
                                Moderate
                            </span>
                            <h1 className="text-7xl font-extrabold my-3" style={{ color: brandBlue }}>
                                55%
                            </h1>
                            <p className="text-green-600 font-semibold text-base">
                                -10% dari kemarin
                            </p>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="my-8">
                            <div className="flex justify-between mb-2 text-sm font-semibold text-gray-600">
                                <span>Progress hari ini</span>
                                <span style={{ color: brandOrange }}>55%</span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: '55%', background: brandOrange }}></div>
                            </div>
                        </div>

                        <hr className="border-t border-white/30 my-6" />

                        {/* Tren 7 Hari Terakhir */}
                        <h4 className="text-base font-bold text-gray-800 mb-5">Tren 7 Hari Terakhir</h4>
                        <div className="flex justify-between items-end h-24">
                            {trendData.map((data, index) => (
                                <div key={index} className="flex flex-col items-center w-1/7">
                                    <div className="relative h-20 w-full flex justify-center">
                                        <div 
                                            className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md ${data.active ? `bg-[${brandOrange}] scale-110` : 'bg-purple-600'}`}
                                            style={{ bottom: `${data.level / 1.2}px` }} 
                                        ></div>
                                    </div>
                                    <span className={`text-sm font-semibold text-gray-500 mt-1`}>
                                        {data.day}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <hr className="border-t border-white/30 my-6" />
                        
                        {/* Tombol Aksi Bawah */}
                        <button 
                            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-md bg-[${brandBlue}] hover:bg-[#0052cc] flex items-center justify-center mt-auto`}
                            onClick={() => alert('Fungsionalitas Flip Dinonaktifkan Sementara')}
                        >
                            <i className="ph ph-note-pencil mr-2"></i> Isi Data Prediksi Stres
                        </button>
                        <p className="text-center text-xs text-gray-500 mt-2">
                            Catat aktivitas harian Anda untuk prediksi yang lebih akurat.
                        </p>
                    </section>


                    {/* === BAGIAN KANAN: CALENDAR CARD (GRID COL SPAN 2) === */}
                    <section 
                        className="
                            col-span-1 md:col-span-2 p-6 md:p-8 rounded-[20px] 
                            bg-white/40 backdrop-blur-md border border-white/20 shadow-xl
                        "
                        style={{ minHeight: '640px' }} 
                    >
                        <header className="flex justify-between items-center mb-6">
                            <button className="icon-btn text-gray-600 hover:text-gray-900"><i className="ph ph-arrow-left text-xl"></i></button>
                            <h3 className="text-xl font-bold text-gray-800">
                                {monthNames[month]} {year}
                            </h3>
                            <button className="icon-btn text-gray-600 hover:text-gray-900"><i className="ph ph-arrow-right text-xl"></i></button>
                        </header>

                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                <span key={day} className="text-center text-sm font-bold text-gray-500">{day}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {[...Array(firstDayOfMonth)].map((_, i) => <div key={`empty-${i}`} className="h-12"></div>)} 
                            
                            {[...Array(daysInMonth)].map((_, i) => {
                                const day = i + 1;
                                return renderCalendarDay(day, month, year, brandBlue);
                            })}
                        </div>
                    </section>
                </div>
                
                {/* === BAGIAN BAWAH: MOTIVATION & FEATURE CARDS === */}
                <div className="mt-8 grid grid-cols-1">
                    {/* Motivation Card */}
                    <section 
                        className="col-span-4 flex flex-col md:flex-row items-center justify-between p-5 md:p-8 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl gap-4"
                    >
                        <i className="ph ph-lightbulb-filament text-4xl" style={{ color: brandOrange }}></i>
                        <p className="motivation-quote text-center text-gray-700 italic flex-grow mx-4">
                            "Setiap langkah kecil tetap berarti menuju ketenangan."
                        </p>
                        <button 
                            className={`py-2 px-4 rounded-xl font-bold transition border-2 text-sm border-[${brandOrange}] text-[${brandOrange}] hover:bg-[${brandOrange}] hover:text-white flex items-center justify-center`}
                        >
                            <i className="ph ph-arrows-clockwise mr-2"></i> Kutipan Baru
                        </button>
                    </section>

                    {/* Feature Cards Wrapper */}
                    <div className="mt-6 flex flex-wrap justify-center gap-6">
                        {/* Feature Cards 1-3 */}
                        <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
                            <i className="ph ph-moon-stars text-4xl text-purple-600 mb-3"></i>
                            <h3 className="text-lg font-bold">Drift off with sleep stories and music</h3>
                            <p className="text-sm text-gray-600 mt-1">Cerita tidur dan musik untuk tidur lebih nyenyak.</p>
                        </div>
                        <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
                            <i className="ph ph-timer text-4xl text-blue-600 mb-3"></i>
                            <h3 className="text-lg font-bold">Learn to meditate in just minutes a day</h3>
                            <p className="text-sm text-gray-600 mt-1">Belajar meditasi dalam hitungan menit setiap hari.</p>
                        </div>
                        <div className="flex-1 min-w-[280px] max-w-[360px] p-6 rounded-[20px] bg-white/40 backdrop-blur-md border border-white/20 shadow-xl">
                            <i className="ph ph-target text-4xl text-yellow-600 mb-3"></i>
                            <h3 className="text-lg font-bold">Build healthy habits and routines</h3>
                            <p className="text-sm text-gray-600 mt-1">Bangun kebiasaan sehat untuk hidup lebih baik.</p>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="mt-12 mx-4 lg:mx-6 py-6 border-t border-white/30 text-gray-600 text-center text-sm">
                <p>© 2025 Nostressia by Kelompok 4 PPTI BCA</p>
                <p className="mt-1">Understand Yourself Better, One Day at a Time. 🧘</p>
            </footer>
        </div>
    );
}
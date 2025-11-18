// --- 1. Logika Loading Screen (dari File 2) ---
// Dijalankan saat semua aset (gambar, css) selesai dimuat
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.add('visible');
        
        // Panggil animasi statistik SETELAH app terlihat
        setTimeout(() => {
            animateStress();
        }, 400); // Delay sedikit agar transisi mulus
    }, 1500); // Waktu loading screen (bisa diatur)
});


// --- 2. Fungsi Animasi Statistik (dari File 2, diadaptasi) ---
function animateStress() {
    const targetStress = 55; // Target stres (dari data asli File 1)
    let current = 0;
    const increment = targetStress / 60; // 60 frame
    
    // Ambil elemen dari File 1
    const percentageEl = document.getElementById('stressPercentage');
    const progressFillEl = document.getElementById('progressFill');

    if (!percentageEl || !progressFillEl) return; // Cek jika elemen ada

    const interval = setInterval(() => {
        current += increment;
        if (current >= targetStress) {
            current = targetStress;
            clearInterval(interval);
        }
        percentageEl.textContent = Math.round(current) + '%';
        progressFillEl.style.width = current + '%';
    }, 20); // Kecepatan animasi
}


// --- 3. Logika Utama Aplikasi (dari File 1 + File 2) ---

// Variabel popup (global)
let popupTimeout;
const popupOverlay = document.getElementById('popupOverlay');
const closePopupBtn = document.getElementById('closePopupBtn');


document.addEventListener('DOMContentLoaded', () => {
    
    // --- Fitur Flip 3D (dari File 1) ---
    const predictionCard = document.getElementById('prediction-card');
    const cardInner = document.querySelector('.flip-card-inner');
    const cardFront = document.querySelector('.flip-card-front');
    const closeBtn = document.getElementById('close-form-btn');
    
    if (predictionCard && cardInner && cardFront && closeBtn) {
        
        const onFlipEnd = () => {
            predictionCard.classList.remove('is-flipping');
        };

        cardInner.addEventListener('transitionend', onFlipEnd);

        // Modifikasi: Hanya flip jika area non-interaktif diklik
        cardFront.addEventListener('click', (e) => {
            // Cek apakah target klik BUKAN tombol mood
            if (!e.target.closest('.mood-btn')) {
                 predictionCard.classList.add('is-flipping'); 
                 predictionCard.classList.add('is-flipped');
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            predictionCard.classList.add('is-flipping');
            predictionCard.classList.remove('is-flipped');
        });
    }

    // --- Fitur Ganti Quote (dari File 1) ---
    // Logika ini sekarang berfungsi karena HTML-nya ada
    const quoteEl = document.getElementById('motivation-quote');
    const quoteBtn = document.getElementById('new-quote-btn');
    
    const quotes = [
        "Setiap langkah kecil tetap berarti menuju ketenangan.",
        "Bernapaslah. Anda sudah melakukan yang terbaik hari ini.",
        "Ketenangan dimulai saat Anda memilih untuk tidak bereaksi.",
        "Hari ini adalah awal yang baru, manfaatkan sebaik-baiknya.",
        "Tidak apa-apa untuk tidak baik-baik saja."
    ];

    if (quoteEl && quoteBtn) {
        quoteBtn.addEventListener('click', () => {
             let newQuote = quotes[Math.floor(Math.random() * quotes.length)];
            // Anti duplikat
            while (newQuote === quoteEl.textContent.replace(/"/g, '')) {
                newQuote = quotes[Math.floor(Math.random() * quotes.length)];
            }
            // Tambahkan petik
            quoteEl.textContent = `"${newQuote}"`;
        });
    }

    // --- LOGIKA BARU: MOOD TRACKER ---
    const moodTracker = document.getElementById('moodTracker');
    if (moodTracker) {
        const moodButtons = moodTracker.querySelectorAll('.mood-btn');
        moodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Hentikan flip kartu saat klik emoji
                
                // Hapus aktif dari tombol lain
                moodButtons.forEach(btn => btn.classList.remove('active'));
                
                // Tambahkan aktif ke tombol yang diklik
                button.classList.add('active');
            });
        });
    }

    // --- LOGIKA BARU: Event Listener Popup ---
    if (popupOverlay && closePopupBtn) {
        // Klik tombol X
        closePopupBtn.addEventListener('click', hidePopup);
        // Klik di luar modal
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                hidePopup();
            }
        });
    }

    // --- 4. Logika Form GPA (dari File 2) ---
    // Logika ini masih ada di JS, tapi elemennya sudah dihapus dari HTML.
    // (Tidak masalah, ini hanya memastikan tidak ada error)
    
    let gpaEditMode = false;
    let originalGPA = 3.50;

    // Fungsi-fungsi ini sekarang global karena dipanggil dari onclick di HTML
    // Jika ingin lebih rapi, bisa dipindahkan ke luar DOMContentLoaded
    // dan hapus deklarasi 'let' agar jadi global.
});

// Fungsi-fungsi form (ditempatkan di scope global agar 'onclick' berfungsi)
let gpaEditMode = false;
let originalGPA = 3.50;

function editGPA() {
    document.getElementById('gpaDisplay').style.display = 'none';
    document.getElementById('gpaEdit').style.display = 'flex';
    document.getElementById('gpaInput').focus();
    gpaEditMode = true;
}

function saveGPA() {
    const gpaInput = document.getElementById('gpaInput');
    const newGPA = parseFloat(gpaInput.value);
    
    if (newGPA >= 0 && newGPA <= 4) {
        document.getElementById('gpaValue').textContent = newGPA.toFixed(2);
        originalGPA = newGPA;
        cancelGPA(); // Panggil cancel untuk menyembunyikan form edit
    } else {
        alert('GPA harus antara 0.00 - 4.00');
    }
}

function cancelGPA() {
    document.getElementById('gpaInput').value = originalGPA.toFixed(2);
    document.getElementById('gpaDisplay').style.display = 'flex';
    document.getElementById('gpaEdit').style.display = 'none';
    gpaEditMode = false;
}

function handleSubmit(event) {
    event.preventDefault();
    
    const formData = {
        gpa: parseFloat(document.getElementById('gpaValue').textContent),
        sleepHours: parseFloat(document.getElementById('sleepHours').value),
        studyHours: parseFloat(document.getElementById('studyHours').value),
        socialHours: parseFloat(document.getElementById('socialHours').value)
    };

    console.log('Form Data:', formData);
    
    // --- GANTI ALERT DENGAN POPUP ---
    // alert('✅ Data berhasil disimpan!...''); // Dihapus
    showPopup(); // Panggil popup baru
    
    // Reset form
    document.getElementById('stressForm').reset();
    document.getElementById('gpaInput').value = originalGPA.toFixed(2); // Reset GPA input juga
    
    // Tutup kartu flip (panggil fungsi flip dari File 1 secara manual)
    const predictionCard = document.getElementById('prediction-card');
    if (predictionCard) {
        predictionCard.classList.add('is-flipping');
        predictionCard.classList.remove('is-flipped');
    }
}

// --- FUNGSI BARU: POPUP ---
function showPopup() {
    if (!popupOverlay) return;
    
    // Reset animasi timer jika ada
    const timerStroke = document.querySelector('.popup-timer-stroke');
    if (timerStroke) {
        // Trik 'reflow' untuk me-restart animasi CSS
        timerStroke.style.animation = 'none';
        timerStroke.offsetHeight; /* memicu reflow */
        timerStroke.style.animation = 'draw-timer 3s linear forwards';
    }

    popupOverlay.classList.add('visible');
    
    // Hapus timer lama jika ada
    clearTimeout(popupTimeout);
    
    // Set timer baru untuk auto-close
    popupTimeout = setTimeout(hidePopup, 3000); // 3 detik
}

function hidePopup() {
    if (!popupOverlay) return;
    
    popupOverlay.classList.remove('visible');
    // Hentikan timer jika ditutup manual
    clearTimeout(popupTimeout);
}

// --- FUNGSI BARU: RENDER KALENDER ---

// Panggil fungsi render kalender saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    // (Kode DOMContentLoaded Anda yang lain ada di sini...)
    
    // Panggil fungsi kalender
    renderCalendar(new Date()); 
});

// Fungsi utama untuk render kalender
function renderCalendar(date) {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearEl = document.getElementById('calendarMonthYear');
    
    if (!calendarGrid || !monthYearEl) return; // Keluar jika elemen tidak ada

    calendarGrid.innerHTML = ''; // Kosongkan grid

    const month = date.getMonth();
    const year = date.getFullYear();

    // Setel Header
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Logika cari hari pertama dan terakhir
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Minggu, 1=Senin
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().getDate();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Tambahkan hari 'kosong' dari bulan sebelumnya
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'other-month');
        calendarGrid.appendChild(emptyDay);
    }

    // 2. Tambahkan hari-hari di bulan ini
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day');
        dayEl.textContent = day;

        // Tandai hari ini
        if (day === today && month === currentMonth && year === currentYear) {
            dayEl.classList.add('today');
        }

        // --- CONTOH PENANDA DATA ---
        // (Ini hanya contoh, Anda bisa ganti dengan data asli nanti)
        // Kita tandai hari-hari kelipatan 5
        if (day % 5 === 0 && day <= 20) {
            const dataDot = document.createElement('span');
            dataDot.classList.add('data-dot');
            dayEl.appendChild(dataDot);
        }

        calendarGrid.appendChild(dayEl);
    }
}
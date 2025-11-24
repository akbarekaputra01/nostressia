import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  RefreshCw,
  Heart,
  Share2,
  Sparkles,
  TrendingUp,
  Star,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Logo from "../../assets/images/Logo-Nostressia.png";

// Warna background
const BG_CREAM = "#FFF7ED";
const BG_PINK = "#FFD1DC";
const BG_LAVENDER = "#E3D5FF";

// Background style
const backgroundStyle = {
  minHeight: "100vh",
  backgroundColor: BG_CREAM,
  backgroundImage: `
    radial-gradient(at 10% 10%, ${BG_CREAM} 0%, transparent 50%),
    radial-gradient(at 90% 20%, ${BG_PINK} 0%, transparent 50%),
    radial-gradient(at 50% 80%, ${BG_LAVENDER} 0%, transparent 50%)
  `,
  backgroundSize: "200% 200%",
  animation: "none",
};

// Index khusus untuk card besar
const HERO_INDEX = "hero";

// List khusus hero quote agar tidak sama dengan card kecil
const heroQuoteList = [
  {
    text: "Setiap hari adalah kesempatan baru untuk memperbaiki diri.",
    category: "Pengembangan Diri",
  },
  {
    text: "Langkah kecil hari ini bisa menjadi perubahan besar di masa depan.",
    category: "Progres",
  },
  {
    text: "Fokus pada proses, bukan hasil. Hasil akan mengikuti.",
    category: "Mindset",
  },
  {
    text: "Motivasi mungkin memulai kamu, tapi disiplin yang membuatmu bertahan.",
    category: "Disiplin",
  },
  {
    text: "Hidup bukan menunggu badai berlalu, tapi belajar menari di tengah hujan.",
    category: "Ketangguhan",
  },
  {
    text: "Jika kamu ingin melihat perubahan, mulailah dari dirimu dulu.",
    category: "Transformasi",
  },
  {
    text: "Jangan bandingkan perjalananmu dengan orang lain. Fokuslah pada jalanmu sendiri.",
    category: "Percaya Diri",
  },
  {
    text: "Ketika lelah, istirahatlah. Jangan berhenti.",
    category: "Keberlanjutan",
  },
  {
    text: "Keajaiban terjadi ketika kamu tidak menyerah.",
    category: "Harapan",
  },
  {
    text: "Konsistensi kecil setiap hari lebih kuat daripada motivasi yang datang sesekali.",
    category: "Konsistensi",
  },
];

export default function Motivation() {
  // likedIndex: only one liked at a time (either HERO_INDEX or numeric index)
  const [likedIndex, setLikedIndex] = useState(null);

  // heroQuote state: random initial chosen
  const [heroQuote, setHeroQuote] = useState(() => {
    const i = Math.floor(Math.random() * heroQuoteList.length);
    return heroQuoteList[i];
  });

  // modal state for sharing
  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState(""); // quote text to show in modal

  // refs for capturing and animation
  const cardsRef = useRef([]);
  const heroRef = useRef(null);
  const headerRef = useRef(null);
  const shareCardRef = useRef(null);

  // Intersection Observer for slide-up animation (as before)
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    if (headerRef.current) io.observe(headerRef.current);
    if (heroRef.current) io.observe(heroRef.current);
    cardsRef.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const motivationalQuotes = [
    {
      text: "Kesuksesan dimulai dari langkah kecil yang konsisten setiap hari.",
      category: "Produktivitas",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      text: "Jangan takut gagal, takutlah tidak pernah mencoba.",
      category: "Keberanian",
      icon: <Star className="w-4 h-4" />,
    },
    {
      text: "Setiap ahli pernah menjadi pemula. Yang penting adalah terus belajar.",
      category: "Pembelajaran",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      text: "Masa depanmu diciptakan oleh apa yang kamu lakukan hari ini.",
      category: "Visi",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      text: "Ketika kamu merasa ingin menyerah, ingatlah mengapa kamu memulai.",
      category: "Persistensi",
      icon: <Heart className="w-4 h-4" />,
    },
    {
      text: "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas.",
      category: "Resiliensi",
      icon: <RefreshCw className="w-4 h-4" />,
    },
  ];

  // toggle like (only one at time)
  const toggleLike = (index) => {
    setLikedIndex((prev) => (prev === index ? null : index));
  };

  // get random hero quote not needed to exclude small-card quotes
  // (we assume heroQuoteList is already different)
  const getRandomHeroQuote = () => {
    const randomIndex = Math.floor(Math.random() * heroQuoteList.length);
    return heroQuoteList[randomIndex];
  };

  // open share modal for a given text
  const openShare = (text) => {
    setShareText(text);
    setShareOpen(true);
  };

  // close modal
  const closeShare = () => setShareOpen(false);

  // download share card as PNG
  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    try {
      // set higher scale for nicer image
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "motivasi.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      <div className="pt-5 pb-20" style={backgroundStyle}>
        <Navbar />
        <div className="p-6 max-w-6xl mx-auto">
          {/* HEADER */}
          <div ref={headerRef} className="opacity-0 translate-y-6">
            <div className="mb-14 text-center">
              <div className="flex items-center gap-3 mb-2 justify-center">
                <Sparkles className="w-9 h-9 text-yellow-500 drop-shadow-lg" />
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                  Motivation
                </h1>
              </div>
              <p className="text-gray-700 text-lg font-medium drop-shadow-sm">
                Temukan inspirasi serta semangat untuk hari yang lebih produktif
              </p>
            </div>
          </div>

          {/* HERO CARD */}
          <div
            ref={heroRef}
            className="opacity-0 translate-y-6 mt-10 rounded-3xl p-10 border backdrop-blur-3xl relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.35)",
              borderColor: "rgba(255,255,255,0.35)",
              boxShadow:
                "0 8px 32px rgba(31, 38, 135, 0.12), inset 0 0 30px rgba(255,255,255,0.4)",
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-300 to-pink-300 rounded-full opacity-30 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-52 h-52 bg-gradient-to-tr from-blue-300 to-purple-300 rounded-full opacity-25 blur-3xl" />

            <div className="relative z-10">
              <div className="px-4 py-1.5 mb-4 inline-flex rounded-full bg-white/40 border border-white/30 backdrop-blur-xl text-orange-700 text-sm font-medium shadow-md">
                ✨ Quote Hari Ini
              </div>

              <h2 className="text-3xl font-bold mb-3 text-gray-800 drop-shadow">
                Motivasi Istimewa
              </h2>

              <p className="text-xl italic text-gray-700 max-w-3xl drop-shadow-sm">
                "{heroQuote.text}"
              </p>

              {/* BUTTONS */}
              <div className="flex gap-4 mt-8 flex-wrap justify-end">
                <button
                  onClick={() => setHeroQuote(getRandomHeroQuote())}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium flex items-center gap-3 shadow-lg hover:scale-105 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Quote Baru
                </button>

                {/* Like (hero) */}
                <button
                  onClick={() => toggleLike(HERO_INDEX)}
                  className="px-6 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-xl font-medium flex items-center gap-3 shadow-lg hover:scale-105 transition-all"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      likedIndex === HERO_INDEX
                        ? "fill-red-500 text-red-500 drop-shadow"
                        : "text-gray-500"
                    }`}
                  />
                  {likedIndex === HERO_INDEX ? "Tersimpan" : "Simpan"}
                </button>

                {/* Share hero */}
                <button
                  onClick={() => openShare(heroQuote.text)}
                  className="px-6 py-3 rounded-xl bg-white/40 border border-white/30 backdrop-blur-xl flex items-center gap-3 text-gray-700 shadow-lg hover:scale-105 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                  Bagikan
                </button>
              </div>
            </div>
          </div>

          {/* SECTION TITLE */}
          <div className="mt-14 mb-6">
            <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Star className="w-7 h-7 text-yellow-500 drop-shadow" />
              Koleksi Motivasi Pilihan
            </h3>
            <p className="text-gray-600 mt-1">Inspirasi untuk setiap momenmu</p>
          </div>

          {/* GRID LIST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {motivationalQuotes.map((quote, index) => (
              <div
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                className="opacity-0 translate-y-6 rounded-2xl p-6 border backdrop-blur-3xl relative transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.45)",
                  borderColor: "rgba(255,255,255,0.35)",
                  boxShadow:
                    "0 4px 30px rgba(0,0,0,0.08), inset 0 0 18px rgba(255,255,255,0.28)",
                }}
              >
                <p className="text-md italic text-gray-700 min-h-[90px]">
                  "{quote.text}"
                </p>

                {/* BOTTOM BUTTONS */}
                <div className="mt-4 pt-4 border-t border-white/40 flex justify-end gap-3 items-center">
                  <button onClick={() => toggleLike(index)} aria-label="like">
                    <Heart
                      className={`w-6 h-6 ${
                        likedIndex === index
                          ? "fill-red-500 text-red-500 drop-shadow"
                          : "text-gray-400 hover:text-red-400"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => openShare(quote.text)}
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                    aria-label="share"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeShare}
          />

          {/* modal content */}
          <div className="relative z-60 max-w-lg w-full px-6">
            <div className="bg-transparent p-4 rounded-xl flex justify-end">
              <button
                onClick={closeShare}
                className="px-3 py-1 rounded-md bg-white/30 backdrop-blur text-sm"
              >
                Close
              </button>
            </div>

            {/* Card preview to capture */}
            <div
              ref={shareCardRef}
              className="mx-auto rounded-2xl p-8 w-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.75) 100%)",
                boxShadow:
                  "0 12px 30px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* visual header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      overflow: "hidden", // agar logo rapi dan tidak keluar kotak
                      // background: "linear-gradient(135deg, #FFFFFF, #FFFFFF)",
                      boxShadow: "0 6px 18px rgba(255,122,122,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={Logo}
                      alt="Logo Nostressia"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover", // cover biar penuh rapi
                      }}
                    />
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#ff7a59",
                        fontWeight: 700,
                      }}
                    >
                      Motivation
                    </div>
                    <div style={{ fontSize: 12, color: "#7b7b7b" }}>
                      Share card
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#9b9b9b" }}>Nostressia</div>
              </div>

              {/* Quote area */}
              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: "linear-gradient(180deg,#ffffff,#fff6f2)",
                }}
              >
                <p
                  style={{
                    fontSize: 18,
                    color: "#333",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  "{shareText}"
                </p>
              </div>

              {/* Footer small */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#777" }}>— Motivation</div>
                <div style={{ fontSize: 12, color: "#777" }}>
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={downloadShareCard}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:scale-105 transition-all"
              >
                Download PNG
              </button>
              <button
                onClick={() => {
                  // quick copy text to clipboard
                  navigator.clipboard?.writeText(shareText).catch(() => {});
                }}
                className="px-6 py-3 bg-white border rounded-xl"
              >
                Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION STYLES */}
      <style jsx>{`
        .animate-slide-up {
          opacity: 1 !important;
          transform: translateY(0) !important;
          transition: transform 1500ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 1500ms ease;
        }
        .translate-y-6 {
          transform: translateY(1.5rem);
        }
        .opacity-0 {
          opacity: 0;
        }
      `}</style>
    </>
  );
}

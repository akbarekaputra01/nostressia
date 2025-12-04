// src/pages/Motivation/Motivation.jsx
import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  RefreshCw,
  Bookmark,
  Share2,
  Sparkles,
  TrendingUp,
  Star,
  X 
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Logo from "../../assets/images/Logo-Nostressia.png";

// --- COLOR CONFIGURATION (MATCHING DASHBOARD) ---
const BG_CREAM = "#FFF3E0";
const BG_PINK = "#eaf2ff";
const BG_LAVENDER = "#e3edff";

// Style Background dengan Animasi
const backgroundStyle = {
  minHeight: "100vh",
  backgroundColor: BG_CREAM,
  backgroundImage: `
    radial-gradient(at 10% 10%, ${BG_CREAM} 0%, transparent 50%),
    radial-gradient(at 90% 20%, ${BG_PINK} 0%, transparent 50%),
    radial-gradient(at 50% 80%, ${BG_LAVENDER} 0%, transparent 50%)
  `,
  backgroundSize: "200% 200%",
  animation: "gradient-bg 20s ease infinite",
};

const HERO_INDEX = "hero";

const heroQuoteList = [
  { text: "Every day is a new opportunity to improve yourself.", category: "Self-Development" },
  { text: "Small steps today can lead to big changes tomorrow.", category: "Progress" },
  { text: "Focus on the process, not the result — results will follow.", category: "Mindset" },
  { text: "Motivation starts you, but discipline keeps you going.", category: "Discipline" },
  { text: "Life isn't about waiting for the storm to pass — learn to dance in the rain.", category: "Resilience" },
  { text: "If you want change, start with yourself.", category: "Transformation" },
  { text: "Don't compare your journey to others. Walk your own path.", category: "Confidence" },
  { text: "When you're tired, rest — don't quit.", category: "Sustainability" },
  { text: "Miracles happen when you refuse to give up.", category: "Hope" },
  { text: "Small consistent actions every day beat occasional bursts of motivation.", category: "Consistency" },
];

const TEMPLATES = [
  { id: "pastel-cream", name: "Cream", color: BG_CREAM},
  { id: "pastel-pink", name: "Pink", color: BG_PINK },
  { id: "pastel-lavender", name: "Lavender", color: BG_LAVENDER },
  { id: "pastel-gradient", name: "Peach", color: "linear-gradient(135deg,#FFE2D1,#FFD1C8)"},
];

const EXPORT_SIZES = [
  { id: "original", name: "Original", w: 464, h: 264 },
];

export default function Motivation() {
  const [likedIndex, setLikedIndex] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const ITEMS_PER_PAGE = 6;

  const [heroQuote, setHeroQuote] = useState(() => {
    const i = Math.floor(Math.random() * heroQuoteList.length);
    return { text: heroQuoteList[i].text };
  });

  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [previewDims, setPreviewDims] = useState({ w: 520, h: 300 });

  const cardsRef = useRef([]);
  const heroRef = useRef(null);
  const headerRef = useRef(null);
  const shareCardRef = useRef(null);
  const prevBodyOverflow = useRef(null);
  const initialScrollResetDone = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      try { window.history.scrollRestoration = "manual"; } catch (e) {}
    }
    if (!initialScrollResetDone.current) {
      initialScrollResetDone.current = true;
      setTimeout(() => { window.scrollTo && window.scrollTo(0,0); }, 50);
    }

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
  }, [motivations, visibleCount]);

  useEffect(() => {
    let mounted = true;
    const fetchMotivations = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("https://nostressia-backend.vercel.app/api/motivations/");
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (!mounted) return;
        
        const normalized = data.map((d) => ({
          motivationID: d.motivationID ?? d.id ?? d.motivation_id ?? null,
          quote: d.quote ?? d.quotes ?? d.text ?? "",
          authorName: d.authorName ?? "Anonymous",
        }));

        // TAMBAHKAN .reverse() DI SINI UNTUK MEMBALIK URUTAN
        setMotivations(normalized.reverse());
        
        if (normalized.length > 0) {
          setHeroQuote({
            text: normalized[0].quote,
            motivationID: normalized[0].motivationID,
            authorName: normalized[0].authorName,
          });
        }
      } catch (err) {
        console.error("Failed fetching motivations:", err);
        setError("Failed to load motivations. Using local data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMotivations();
    return () => { mounted = false; };
  }, []);

  const fallbackMotivationalQuotes = [
    {
      motivationID: "f-1",
      quote: "Success starts with small consistent steps every day.",
      category: "Productivity",
      icon: <TrendingUp className="w-4 h-4" />,
      authorName: "Anonymous",
    },
    {
      motivationID: "f-2",
      quote: "Don't fear failure — fear never trying.",
      category: "Courage",
      icon: <Star className="w-4 h-4" />,
      authorName: "Anonymous",
    },
    {
      motivationID: "f-3",
      quote: "Every expert was once a beginner. Keep learning.",
      category: "Learning",
      icon: <Sparkles className="w-4 h-4" />,
      authorName: "Anonymous",
    },
  ];

  const toggleLike = (id) => {
    setLikedIndex((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getRandomHeroQuote = () => {
    if (motivations && motivations.length > 0) {
      const randomIndex = Math.floor(Math.random() * motivations.length);
      const m = motivations[randomIndex];
      return { text: m.quote, motivationID: m.motivationID, authorName: m.authorName };
    } else {
      const randomIndex = Math.floor(Math.random() * heroQuoteList.length);
      return { text: heroQuoteList[randomIndex].text };
    }
  };

  const openShare = (text) => {
    setShareText(text);
    setShareOpen(true);
    prevBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  };

  const closeShare = () => {
    setShareOpen(false);
    document.body.style.overflow = prevBodyOverflow.current || "";
  };

  // --- KODE LOGIKA DOWNLOAD KEMBALI KE ASAL (DIJAMIN BEKERJA) ---
  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    try {
      const el = shareCardRef.current;
      const selectedSize = EXPORT_SIZES[0];

      const clone = el.cloneNode(true);
      clone.style.width = `${selectedSize.w}px`;
      clone.style.height = `${selectedSize.h}px`;
      clone.style.transform = "none";
      clone.style.boxShadow = "none";
      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: null });
      document.body.removeChild(clone);

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "motivation.png";
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast("Download complete 🎉");
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Download failed.");
    }
  };

  const copyText = () => {
    navigator.clipboard
      .writeText(shareText)
      .then(() => showToast("Copied to clipboard ✨"))
      .catch(() => showToast("Copy failed."));
  };

  const SharePreview = ({ text, templateBg }) => {
    return (
      <div
        className="rounded-2xl overflow-hidden relative w-full h-full flex items-center justify-center"
        style={{
          background: templateBg,
          borderRadius: 16,
          boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        <div style={{
          width: "82%", maxWidth: 900, background: "#fff", padding: 20,
          borderRadius: 12, textAlign: "center", boxShadow: "0 6px 18px rgba(0,0,0,0.06)", zIndex:2
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, justifyContent:"center", marginBottom:8}}>
            <img src={Logo} alt="logo" style={{ width:40, height:40, borderRadius:8, objectFit:"cover"}}/>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontSize:13, color:"#ff7a59", fontWeight:700}}>Motivation</div>
              <div style={{ fontSize:11, color:"#7b7b7b"}}>Share Card</div>
            </div>
          </div>
          <p style={{ fontSize:18, color:"#333", fontStyle:"italic", margin:"6px 0 12px"}}>"{text}"</p>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#777", marginTop:8}}>
            <span>— Nostressia</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const itemsToRender = motivations && motivations.length > 0 ? motivations : fallbackMotivationalQuotes;
  const currentItems = itemsToRender.slice(0, visibleCount);
  const hasMore = visibleCount < itemsToRender.length;

  const loadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <div style={backgroundStyle} className="min-h-screen">
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>

      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg">{toastMessage}</div>
      )}
      <Navbar />
      
      {/* CONTAINER UTAMA */}
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-28 md:pt-8 pb-20">
        
        {/* HEADER */}
        <div ref={headerRef} className="opacity-0 translate-y-6">
          <div className="mb-10 text-center">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Sparkles className="w-9 h-9 text-yellow-500 drop-shadow-lg" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                Motivation Hub
              </h1>
            </div>
            <p className="text-gray-600 mt-2 text-base md:text-lg font-medium">
              Find inspiration and a boost to make your day more productive
            </p>
          </div>
        </div>

        {/* HERO */}
        <div
          ref={heroRef}
          className="opacity-0 translate-y-6 mt-6 md:mt-8 rounded-2xl p-6 md:p-10 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.25)",
            border: "1px solid rgba(255,255,255,0.3)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          <div className="relative z-10">
            <div className="inline-flex rounded-full bg-white border text-orange-700 text-sm font-medium shadow-sm px-3 py-1 mb-4 cursor-default">
              ✨ Today's Quote
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800">Featured Motivation</h2>
            <p className="text-lg md:text-xl italic text-gray-700 max-w-3xl">"{heroQuote.text}"</p>
            <div className="flex gap-3 mt-6 flex-wrap justify-end">
              <button
                onClick={() => setHeroQuote(getRandomHeroQuote())}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium flex items-center gap-2 shadow hover:scale-105 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                New Quote
              </button>
              <button
                onClick={() => toggleLike(HERO_INDEX)}
                className="px-4 py-2 rounded-lg bg-white border font-medium flex items-center gap-2 shadow hover:scale-105 transition cursor-pointer"
                aria-label="bookmark-hero"
              >
                <Bookmark
                  className={`w-4 h-4 ${likedIndex.includes(HERO_INDEX) ? "fill-orange-500 text-orange-600" : "text-gray-500"}`}
                />
                <span className="hidden sm:inline">{likedIndex.includes(HERO_INDEX) ? "Saved" : "Save"}</span>
              </button>
              <button
                onClick={() => openShare(heroQuote.text)}
                className="px-4 py-2 rounded-lg bg-white border flex items-center gap-2 text-gray-700 shadow hover:scale-105 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collection */}
        <div className="mt-8 md:mt-10 mb-6 flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-500" />
            Motivation Collection
          </h3>
          <p className="text-gray-600 text-sm">
            {loading ? "Loading..." : error ? error : "Inspiration for every moment"}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {currentItems.map((quoteObj, idx) => {
            const id = quoteObj.motivationID ?? `fallback-${idx}`;
            return (
              <div
                key={id}
                ref={(el) => (cardsRef.current[idx] = el)}
                className="opacity-0 translate-y-6 rounded-2xl p-5 md:p-6 relative transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
                }}
              >
                <p className="text-md md:text-lg italic text-gray-700 min-h-[72px] md:min-h-[90px]">"{quoteObj.quote}"</p>
                <div className="text-xs text-gray-500 mt-2">Author: {quoteObj.authorName ?? "-"}</div>
                <div className="mt-4 pt-4 border-t border-black/5 flex justify-end gap-3 items-center">
                  <button
                    onClick={() => toggleLike(id)}
                    aria-label={`bookmark-${id}`}
                    className="cursor-pointer"
                  >
                    <Bookmark
                      className={`w-6 h-6 ${likedIndex.includes(id) ? "fill-orange-500 text-orange-600" : "text-gray-400 hover:text-orange-400"}`}
                    />
                  </button>
                  <button
                    onClick={() => openShare(quoteObj.quote)}
                    className="text-xs sm:text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 cursor-pointer"
                    aria-label={`share-${id}`}
                  >
                    <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* See More Button */}
        {hasMore && (
          <div className="mt-8 flex items-center justify-end">
            <button
              onClick={loadMore}
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              -See More-
            </button>
          </div>
        )}
      </div>

      {/* SHARE MODAL - PERBAIKAN RESPONSIVE DI SINI */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={closeShare} />
          <div className="relative z-60 max-w-4xl w-full mx-auto" style={{ animation: "fade-in 240ms ease" }}>
            <div className="bg-transparent p-4 rounded-xl">
              <div className="flex justify-end mb-2">
                <button
                  onClick={closeShare}
                  className="px-3 py-1 rounded-md bg-white/30 backdrop-blur text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
              
              {/* Flex Container: flex-col di mobile, flex-row di desktop */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                
                {/* Bagian Kiri (Preview Card) */}
                <div className="flex-1 flex items-center justify-center w-full">
                  <div
                    ref={shareCardRef}
                    // DISINI UBAHANNYA: w-full dan maxWidth, serta aspectRatio agar proporsional
                    className="w-full max-w-[520px] md:max-w-none"
                    style={{ 
                        width: "100%", 
                        maxWidth: "520px",
                        // aspectRatio: "520/300", // DIHAPUS agar tinggi menyesuaikan
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        borderRadius: 16, 
                        transformOrigin: "top center" 
                    }}
                  >
                    <SharePreview
                      text={shareText}
                      templateBg={TEMPLATES.find((t) => t.id === selectedTemplate)?.color || TEMPLATES[0].color}
                    />
                  </div>
                </div>

                {/* Bagian Kanan (Controls) */}
                {/* UBAHANNYA: w-full di mobile, fixed width di desktop */}
                <div className="w-full md:w-[360px] space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-white md:text-gray-800">Choose template</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`p-2 rounded-lg border ${selectedTemplate === t.id ? "ring-2 ring-orange-400" : "border-black/5"} cursor-pointer`}
                          style={{ background: t.color }}
                        >
                          <div style={{ background: "#fff", padding: 6, borderRadius: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#ff7a59" }}>{t.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <button onClick={downloadShareCard} className="px-4 py-3 bg-orange-500 text-white rounded-xl cursor-pointer shadow">
                      Download PNG
                    </button>
                    <button onClick={copyText} className="px-4 py-3 bg-white border rounded-xl cursor-pointer">
                      Copy Text
                    </button>
                    <div className="text-xs text-black mt-2">
                      Tip: center white card keeps text readable while outer background
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-up {
          opacity: 1 !important;
          transform: translateY(0) !important;
          transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1), opacity 600ms ease;
        }
        .translate-y-6 {
          transform: translateY(1.5rem);
        }
        .opacity-0 {
          opacity: 0;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
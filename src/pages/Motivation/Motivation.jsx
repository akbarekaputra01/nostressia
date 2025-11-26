import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import {
  RefreshCw,
  Bookmark,
  Share2,
  Sparkles,
  TrendingUp,
  Star,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Logo from "../../assets/images/Logo-Nostressia.png";

// Colors
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

// Templates (outer background color; center white area stays white)
const TEMPLATES = [
  { id: "pastel-cream", name: "Cream", color: BG_CREAM},
  { id: "pastel-pink", name: "Pink", color: BG_PINK },
  { id: "pastel-lavender", name: "Lavender", color: BG_LAVENDER },
  { id: "pastel-gradient", name: "Peach", color: "linear-gradient(135deg,#FFE2D1,#FFD1C8)"},
];

// Export sizes
const EXPORT_SIZES = [
  { id: "original", name: "Original", w: 464, h: 264 },
];

export default function Motivation() {
  const [likedIndex, setLikedIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const [heroQuote, setHeroQuote] = useState(() => {
    const i = Math.floor(Math.random() * heroQuoteList.length);
    return heroQuoteList[i];
  });

  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  const PREVIEW_BASE_HEIGHT = 480;

  const cardsRef = useRef([]);
  const heroRef = useRef(null);
  const headerRef = useRef(null);
  const shareCardRef = useRef(null);
  const prevBodyOverflow = useRef(null);

  // Intersection observer for slide-up animation
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
      text: "Success starts with small consistent steps every day.",
      category: "Productivity",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      text: "Don't fear failure — fear never trying.",
      category: "Courage",
      icon: <Star className="w-4 h-4" />,
    },
    {
      text: "Every expert was once a beginner. Keep learning.",
      category: "Learning",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      text: "Your future is created by what you do today.",
      category: "Vision",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      text: "When you feel like giving up, remember why you started.",
      category: "Persistence",
      icon: <Bookmark className="w-4 h-4" />,
    },
    {
      text: "Failure is a chance to start again smarter.",
      category: "Resilience",
      icon: <RefreshCw className="w-4 h-4" />,
    },
  ];

  const toggleLike = (index) => {
    setLikedIndex((prev) => (prev === index ? null : index));
  };

  const getRandomHeroQuote = () => {
    const randomIndex = Math.floor(Math.random() * heroQuoteList.length);
    return heroQuoteList[randomIndex];
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

  const downloadShareCard = async () => {
    if (!shareCardRef.current) return;
    try {
        const el = shareCardRef.current;
        const selectedSize = EXPORT_SIZES[0]; // original

        const clone = el.cloneNode(true);
        clone.style.width = `${selectedSize.w}px`;
        clone.style.height = `${selectedSize.h}px`;
        clone.style.transform = "none";
        clone.style.boxShadow = "none";
        clone.style.position = "fixed";
        clone.style.top = "-9999px";
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });

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
      .then(() => {
        showToast("Copied to clipboard ✨");
      })
      .catch(() => showToast("Copy failed."));
  };

  const SharePreview = ({ text, templateBg, previewWidth, previewHeight }) => {
    return (
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          width: previewWidth,
          height: previewHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: templateBg,
          borderRadius: 16,
          boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "82%",
            maxWidth: 900,
            background: "#ffffff",
            padding: 28,
            borderRadius: 12,
            textAlign: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 8 }}>
            <img src={Logo} alt="logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, color: "#ff7a59", fontWeight: 700 }}>Motivation</div>
              <div style={{ fontSize: 11, color: "#7b7b7b" }}>Share Card</div>
            </div>
          </div>
          <p style={{ fontSize: 20, color: "#333", fontStyle: "italic", margin: "8px 0 14px" }}>"{text}"</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#777", marginTop: 10 }}>
            <span>— Nostressia</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const previewDims = (() => {
    const width = 520;
    const height = Math.round((EXPORT_SIZES[0].h / EXPORT_SIZES[0].w) * width);
    const maxH = Math.min(height, Math.round(window.innerHeight * 0.78 || 520));
    return { w: width, h: maxH };
  })();

  return (
    <>
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="pt-5 pb-20" style={backgroundStyle}>
        <Navbar />
        <div className="p-6 max-w-7xl mx-auto">
          {/* header */}
          <div ref={headerRef} className="opacity-0 translate-y-6">
            <div className="mb-14 text-center">
              <div className="flex items-center gap-3 mb-2 justify-center">
                <Sparkles className="w-9 h-9 text-yellow-500 drop-shadow-lg" />
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                  Motivation Hub
                </h1>
              </div>
              <p className="text-gray-600 mt-2 text-lg font-medium">
                Find inspiration and a boost to make your day more productive
              </p>
            </div>
          </div>

          {/* HERO */}
          <div
            ref={heroRef}
            className="opacity-0 translate-y-6 mt-10 rounded-3xl p-10 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
            }}
          >
            <div className="relative z-10">
              <div className="px-4 py-1.5 mb-4 inline-flex rounded-full bg-white border text-orange-700 text-sm font-medium shadow-sm cursor-default">
                ✨ Today's Quote
              </div>

              <h2 className="text-3xl font-bold mb-3 text-gray-800">Featured Motivation</h2>

              <p className="text-xl italic text-gray-700 max-w-3xl">"{heroQuote.text}"</p>

              <div className="flex gap-4 mt-8 flex-wrap justify-end">
                <button
                  onClick={() => setHeroQuote(getRandomHeroQuote())}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium flex items-center gap-3 shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5" />
                  New Quote
                </button>

                <button
                  onClick={() => toggleLike(HERO_INDEX)}
                  className="px-6 py-3 rounded-xl bg-white border font-medium flex items-center gap-3 shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <Bookmark
                    className={`w-5 h-5 ${likedIndex === HERO_INDEX ? "fill-orange-500 text-orange-600 drop-shadow" : "text-gray-500"}`}
                  />
                  {likedIndex === HERO_INDEX ? "Saved" : "Save"}
                </button>

                <button
                  onClick={() => openShare(heroQuote.text)}
                  className="px-6 py-3 rounded-xl bg-white border flex items-center gap-3 text-gray-700 shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* collection title */}
          <div className="mt-10 mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500" />
              Motivation Collection
            </h3>
            <p className="text-gray-600">Inspiration for every moment</p>
          </div>

          {/* grid of cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {motivationalQuotes.map((quote, index) => (
              <div
                key={index}
                ref={(el) => (cardsRef.current[index] = el)}
                className="opacity-0 translate-y-6 rounded-2xl p-6 relative transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
                }}
              >
                <p className="text-md italic text-gray-700 min-h-[90px]">"{quote.text}"</p>
                <div className="mt-4 pt-4 border-t border-black/5 flex justify-end gap-3 items-center">
                  <button onClick={() => toggleLike(index)} aria-label="bookmark" className="cursor-pointer">
                    <Bookmark className={`w-6 h-6 ${likedIndex === index ? "fill-orange-500 text-orange-600" : "text-gray-400 hover:text-orange-400"}`} />
                  </button>
                  <button onClick={() => openShare(quote.text)} className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 cursor-pointer" aria-label="share">
                    <Share2 className="w-5 h-5" /> Share
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
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={closeShare}
          />

          <div
            className="relative z-60 max-w-5xl w-full mx-4 md:mx-auto p-4"
            style={{ animation: "fade-in 240ms ease" }}
          >
            <div className="bg-transparent p-4 rounded-xl">
              <div className="flex justify-end mb-2">
                <button onClick={closeShare} className="px-3 py-1 rounded-md bg-white/30 backdrop-blur text-sm cursor-pointer">
                  Close
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 flex items-center justify-center">
                  <div
                    ref={shareCardRef}
                    style={{
                      width: previewDims.w,
                      height: previewDims.h,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 16,
                      background: TEMPLATES.find((t) => t.id === selectedTemplate)?.color || TEMPLATES[0].color,
                      transformOrigin: "top center",
                    }}
                  >
                    <SharePreview
                      text={shareText}
                      templateBg={TEMPLATES.find((t) => t.id === selectedTemplate)?.color || TEMPLATES[0].color}
                      previewWidth={"100%"}
                      previewHeight={"100%"}
                    />
                  </div>
                </div>

                <div style={{ width: 360 }} className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Choose template</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`p-2 rounded-lg border ${selectedTemplate === t.id ? "ring-2 ring-orange-400" : "border-black/5"} cursor-pointer`}
                          style={{ background: t.color }}
                        >
                          <div style={{ background: "#fff", padding: 6, borderRadius: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 700,                            color: "#ff7a59" }}>{t.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={downloadShareCard}
                      className="px-4 py-3 bg-orange-500 text-white rounded-xl cursor-pointer shadow"
                    >
                      Download PNG
                    </button>

                    <button
                      onClick={copyText}
                      className="px-4 py-3 bg-white border rounded-xl cursor-pointer"
                    >
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
    </>
  );
}


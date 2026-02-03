// src/pages/Motivation/Motivation.jsx
import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import html2canvas from "html2canvas";
import {
  addBookmark,
  deleteBookmark,
  getMyBookmarks,
} from "../../services/bookmarkService";
import {
  RefreshCw,
  Bookmark,
  Share2,
  Sparkles,
  TrendingUp,
  Star,
  X,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PageMeta from "../../components/PageMeta";
import Logo from "../../assets/images/Logo-Nostressia.png";
import { getMotivations } from "../../services/motivationService";
import { readAuthToken } from "../../utils/auth";
import { createLogger } from "../../utils/logger";

const logger = createLogger("MOTIVATION");

// --- COLOR CONFIGURATION (MATCHING DASHBOARD) ---
const BG_SUN = "rgb(var(--bg-gradient-sun))";
const BG_ORANGE = "rgb(var(--bg-gradient-orange))";
const BG_SKY = "rgb(var(--bg-gradient-sky))";
const BG_OCEAN = "rgb(var(--bg-gradient-ocean))";
const BG_INK = "rgb(var(--bg-gradient-ink))";

// Background style with animation
const backgroundStyle = {
  minHeight: "100vh",
  backgroundColor: BG_SUN,
  backgroundImage: `
    radial-gradient(at 10% 10%, ${BG_SUN} 0%, transparent 50%),
    radial-gradient(at 90% 20%, ${BG_ORANGE} 0%, transparent 50%),
    radial-gradient(at 50% 80%, ${BG_SKY} 0%, transparent 50%)
  `,
  backgroundSize: "200% 200%",
  animation: "gradient-bg 20s ease infinite",
};

const HERO_INDEX = "hero";

const TEMPLATES = [
  { id: "sun", name: "Sun", color: BG_SUN },
  { id: "orange", name: "Orange", color: BG_ORANGE },
  { id: "sky", name: "Sky", color: BG_SKY },
  {
    id: "ocean",
    name: "Ocean",
    color: `linear-gradient(135deg, ${BG_OCEAN}, ${BG_SKY})`,
  },
  {
    id: "ink",
    name: "Ink",
    color: `linear-gradient(135deg, ${BG_INK}, ${BG_OCEAN})`,
  },
];

const EXPORT_SIZES = [{ id: "original", name: "Original", w: 464, h: 264 }];

export default function Motivation() {
  const [likedIndex, setLikedIndex] = useState([]);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch the user context from MainLayout.
  const { user } = useOutletContext() || { user: {} };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2000);
  };

  const [motivations, setMotivations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const ITEMS_PER_PAGE = 6;

  // Ensure the hero quote keeps a null ID for consistency.
  const [heroQuote, setHeroQuote] = useState({
    text: "",
    motivationId: null,
    authorName: "",
  });

  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);

  const cardsRef = useRef([]);
  const heroRef = useRef(null);
  const headerRef = useRef(null);
  const shareCardRef = useRef(null);
  const prevBodyOverflow = useRef(null);
  const initialScrollResetDone = useRef(false);

  // --- Fetch bookmarks from the API on load ---
  useEffect(() => {
    const fetchBookmarks = async () => {
      const token = readAuthToken();
      if (!token) return;
      try {
        const data = await getMyBookmarks();
        const ids = (data || []).map((item) => item.motivationId);
        setLikedIndex(ids);
      } catch (e) {
        logger.error("Bookmark sync error:", e);
      }
    };
    fetchBookmarks();
  }, []);
  // -------------------------------------------------------

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch (error) {
        logger.warn("Scroll restoration update failed", error);
      }
    }
    if (!initialScrollResetDone.current) {
      initialScrollResetDone.current = true;
      setTimeout(() => {
        window.scrollTo && window.scrollTo(0, 0);
      }, 50);
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
      { threshold: 0.18 },
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
        const data = await getMotivations();

        if (!mounted) return;

        const normalized = data.map((d) => ({
          motivationId: d.motivationId ?? null,
          quote: d.quote ?? "",
          authorName: d.authorName ?? "Anonymous",
        }));

        setMotivations(normalized.reverse());

        if (normalized.length > 0) {
          setHeroQuote({
            text: normalized[0].quote,
            motivationId: normalized[0].motivationId,
            authorName: normalized[0].authorName,
          });
        } else {
          setHeroQuote({
            text: "",
            motivationId: null,
            authorName: "",
          });
        }
      } catch (err) {
        logger.error("Failed fetching motivations:", err);
        setError("Failed to load motivations. Using local data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMotivations();
    return () => {
      mounted = false;
    };
  }, []);

  const fallbackMotivationalQuotes = [
    {
      motivationId: "f-1",
      quote: "Success starts with small consistent steps every day.",
      category: "Productivity",
      icon: <TrendingUp className="w-4 h-4" />,
      authorName: "Anonymous",
    },
    {
      motivationId: "f-2",
      quote: "Don't fear failure — fear never trying.",
      category: "Courage",
      icon: <Star className="w-4 h-4" />,
      authorName: "Anonymous",
    },
    {
      motivationId: "f-3",
      quote: "Every expert was once a beginner. Keep learning.",
      category: "Learning",
      icon: <Sparkles className="w-4 h-4" />,
      authorName: "Anonymous",
    },
  ];

  // --- Toggle like hook wired to the API ---
  const toggleLike = async (id) => {
    const token = readAuthToken();
    if (!token) {
      showToast("Please login first! 🔒");
      return;
    }

    // Skip bookmarks for the static hero quote that does not have an ID yet.
    if (!id || id === HERO_INDEX) {
      showToast("Cannot bookmark this yet.");
      return;
    }

    const isLiked = likedIndex.includes(id);

    // Optimistic Update (Update UI dulu)
    setLikedIndex((prev) =>
      isLiked ? prev.filter((i) => i !== id) : [...prev, id],
    );

    try {
      if (isLiked) {
        // Remove the bookmark.
        await deleteBookmark(id);
        showToast("Bookmark removed 🗑️");
      } else {
        // Add bookmark
        await addBookmark(id);
        showToast("Saved to profile ❤️");
      }
    } catch (err) {
      logger.error("Bookmark API Error:", err);
      showToast("Failed to bookmark.");
      // Roll back local state if the API request fails.
      setLikedIndex((prev) =>
        isLiked ? [...prev, id] : prev.filter((i) => i !== id),
      );
    }
  };
  // ----------------------------------------------------

  const getRandomHeroQuote = () => {
    if (motivations && motivations.length > 0) {
      const randomIndex = Math.floor(Math.random() * motivations.length);
      const m = motivations[randomIndex];
      return {
        text: m.quote,
        motivationId: m.motivationId,
        authorName: m.authorName,
      };
    }
    return { text: "", motivationId: null, authorName: "" };
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

  const hasHeroQuote = Boolean(heroQuote.text);

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
      logger.error("Download failed:", err);
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
          boxShadow: "0 14px 32px rgba(0,0,0,0.16)",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "82%",
            maxWidth: 900,
            background: "rgb(var(--surface-elevated) / 0.82)",
            border: "1px solid rgb(var(--glass-border) / 0.7)",
            backdropFilter: "blur(12px)",
            padding: 20,
            borderRadius: 12,
            textAlign: "center",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "center",
              marginBottom: 8,
            }}
          >
            <img
              src={Logo}
              alt="logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                objectFit: "cover",
              }}
            />
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: 13,
                  color: "rgb(var(--brand-primary))",
                  fontWeight: 700,
                }}
              >
                Motivation
              </div>
              <div style={{ fontSize: 11, color: "rgb(var(--text-muted))" }}>
                Share Card
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 18,
              color: "rgb(var(--text-primary))",
              fontStyle: "italic",
              margin: "6px 0 12px",
            }}
          >
            "{text}"
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "rgb(var(--text-muted))",
              marginTop: 8,
            }}
          >
            <span>— Nostressia</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const itemsToRender =
    motivations && motivations.length > 0
      ? motivations
      : fallbackMotivationalQuotes;
  const currentItems = itemsToRender.slice(0, visibleCount);
  const hasMore = visibleCount < itemsToRender.length;

  const loadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    // Tambahkan flex-col agar footer turun ke bawah
    <div style={backgroundStyle} className="min-h-screen flex flex-col">
      <PageMeta
        title="Motivation"
        description="Get daily motivational quotes and save your favorites to stay inspired."
      />
      <style>{`
        @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>

      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] bg-brand-accent/90 text-text-inverse glass-panel px-4 py-2 rounded-xl shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* 4. PASS USER KE NAVBAR */}
      <Navbar activeLink="Motivation" user={user} />

      {/* CONTAINER UTAMA (Tambahkan flex-grow) */}
      <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10 pt-28 md:pt-8 pb-20 flex-grow">
        {/* HEADER */}
        <div ref={headerRef} className="opacity-0 translate-y-6">
          <div className="mb-10 text-center">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <Sparkles className="w-9 h-9 text-yellow-500 drop-shadow-lg" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent drop-shadow-md">
                Motivation Hub
              </h1>
            </div>
            <p className="text-text-secondary mt-2 text-base md:text-lg font-medium dark:text-text-muted">
              Find inspiration and a boost to make your day more productive
            </p>
          </div>
        </div>

        {/* HERO */}
        <div
          ref={heroRef}
          className="opacity-0 translate-y-6 mt-6 md:mt-8 rounded-2xl p-6 md:p-10 relative overflow-hidden"
          style={{
            background: "rgb(var(--glass-bg) / 0.7)",
            border: "1px solid rgb(var(--glass-border) / 0.5)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgb(var(--shadow-color) / 0.12)",
          }}
        >
          <div className="relative z-10">
            <div className="inline-flex rounded-full bg-surface-elevated glass-panel border text-orange-700 text-sm font-medium shadow-sm px-3 py-1 mb-4 cursor-default dark:bg-surface dark:border-border dark:text-orange-600">
              ✨ Today's Quote
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-text-primary dark:text-text-primary">
              Featured Motivation
            </h2>
            <p className="text-lg md:text-xl italic text-text-secondary max-w-3xl dark:text-text-primary">
              {hasHeroQuote
                ? `"${heroQuote.text}"`
                : "No motivations available yet."}
            </p>
            <div className="flex gap-3 mt-6 flex-wrap justify-end">
              <button
                onClick={() => setHeroQuote(getRandomHeroQuote())}
                disabled={!hasHeroQuote}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium flex items-center gap-2 shadow hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                New Quote
              </button>

              {/* Pass the correct ID to toggleLike */}
              <button
                onClick={() => toggleLike(heroQuote.motivationId)}
                disabled={!hasHeroQuote}
                className="px-4 py-2 rounded-lg bg-surface-elevated glass-panel border font-medium flex items-center gap-2 shadow hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-surface dark:border-border dark:text-text-primary"
                aria-label="bookmark-hero"
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    likedIndex.includes(heroQuote.motivationId)
                      ? "fill-orange-500 text-orange-600"
                      : "text-text-muted"
                  }`}
                />
                <span className="hidden sm:inline">
                  {likedIndex.includes(heroQuote.motivationId)
                    ? "Saved"
                    : "Save"}
                </span>
              </button>

              <button
                onClick={() => openShare(heroQuote.text)}
                disabled={!hasHeroQuote}
                className="px-4 py-2 rounded-lg bg-surface-elevated glass-panel border flex items-center gap-2 text-text-secondary shadow hover:scale-105 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-surface dark:border-border dark:text-text-primary"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Collection */}
        <div className="mt-8 md:mt-10 mb-6 flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-3 dark:text-text-primary">
            <Star className="w-5 h-5 text-yellow-500" />
            Motivation Collection
          </h3>
          <p className="text-text-secondary text-sm dark:text-text-muted">
            {loading
              ? "Loading..."
              : error
                ? error
                : "Inspiration for every moment"}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {currentItems.map((quoteObj, idx) => {
            const id = quoteObj.motivationId ?? `fallback-${idx}`;
            return (
              <div
                key={id}
                ref={(el) => (cardsRef.current[idx] = el)}
                className="opacity-0 translate-y-6 rounded-2xl p-5 md:p-6 relative transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: "rgb(var(--glass-bg) / 0.7)",
                  border: "1px solid rgb(var(--glass-border) / 0.5)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 4px 18px rgb(var(--shadow-color) / 0.1)",
                }}
              >
                <p className="text-md md:text-lg italic text-text-secondary min-h-[72px] md:min-h-[90px] dark:text-text-primary">
                  "{quoteObj.quote}"
                </p>
                <div className="text-xs text-text-muted mt-2 dark:text-text-muted">
                  Author: {quoteObj.authorName ?? "-"}
                </div>
                <div className="mt-4 pt-4 border-t border-border/60 flex justify-end gap-3 items-center">
                  {/* Bookmark button for list items */}
                  <button
                    onClick={() => toggleLike(id)}
                    aria-label={`bookmark-${id}`}
                    className="cursor-pointer"
                  >
                    <Bookmark
                      className={`w-6 h-6 ${
                        likedIndex.includes(id)
                          ? "fill-orange-500 text-orange-600"
                          : "text-text-muted hover:text-orange-400"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => openShare(quoteObj.quote)}
                    className="text-xs sm:text-sm text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1 cursor-pointer"
                    aria-label={`share-${id}`}
                  >
                    <Share2 className="w-4 h-4" />{" "}
                    <span className="hidden sm:inline">Share</span>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-neutral-950/30 backdrop-blur-sm transition-opacity"
            onClick={closeShare}
          />
          <div
            className="relative z-60 max-w-4xl w-full mx-auto"
            style={{ animation: "fade-in 240ms ease" }}
          >
            <div className="bg-transparent p-4 rounded-xl">
              <div className="flex justify-end mb-2">
                <button
                  onClick={closeShare}
                  className="px-3 py-1 rounded-md bg-surface-elevated/30 glass-chip text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Flex Container: flex-col di mobile, flex-row di desktop */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Bagian Kiri (Preview Card) */}
                <div className="flex-1 flex items-center justify-center w-full">
                  {/* WRAPPER FOR SCALING to ensure WYSIWYG */}
                  <div className="transform scale-[0.75] sm:scale-[0.9] md:scale-100 transition-transform origin-center">
                    <div
                      ref={shareCardRef}
                      // Match width/height to EXPORT_SIZES (464x264).
                      style={{
                        width: "464px",
                        height: "264px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 16,
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <SharePreview
                        text={shareText}
                        templateBg={
                          TEMPLATES.find((t) => t.id === selectedTemplate)
                            ?.color || TEMPLATES[0].color
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan (Controls) */}
                {/* Use full width on mobile and fixed width on desktop */}
                <div className="w-full md:w-[360px] space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-text-primary">
                      Choose template
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`p-2 rounded-lg border ${
                            selectedTemplate === t.id
                              ? "ring-2 ring-brand-primary"
                              : "border-border"
                          } cursor-pointer`}
                          style={{ background: t.color }}
                        >
                          <div
                            style={{
                              background: "rgb(var(--surface-elevated) / 0.85)",
                              padding: 6,
                              borderRadius: 8,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "rgb(var(--brand-primary))",
                              }}
                            >
                              {t.name}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <button
                      onClick={downloadShareCard}
                      className="px-4 py-3 bg-brand-primary text-text-inverse rounded-xl cursor-pointer shadow"
                    >
                      Download PNG
                    </button>
                    <button
                      onClick={copyText}
                      className="px-4 py-3 bg-surface-elevated glass-panel border rounded-xl cursor-pointer"
                    >
                      Copy Text
                    </button>
                    <div className="text-xs text-text-primary mt-2">
                      Tip: center white card keeps text readable while outer
                      background
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
          transition:
            transform 900ms cubic-bezier(0.16, 1, 0.3, 1),
            opacity 600ms ease;
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

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
}

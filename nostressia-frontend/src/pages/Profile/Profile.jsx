// src/pages/Profile/Profile.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Navbar from "../../components/Navbar";
import PageMeta from "../../components/PageMeta";
import { changePassword, updateProfile, verifyCurrentPassword } from "../../services/authService";
import { deleteBookmark, getMyBookmarks } from "../../services/bookmarkService";
import {
  User,
  Mail,
  Heart,
  Settings,
  LogOut,
  Edit3,
  Flame,
  BookOpen, // Flame replaces Trophy for streak stats.
  ChevronRight,
  Bell,
  CheckCircle,
  X,
  Cake,
  Smile,
  Activity,
  Lock,
  Key,
  Clock,
  Smartphone,
  Bookmark,
  Plus,
  Loader2,
  AtSign,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { DEFAULT_AVATAR, resolveAvatarUrl } from "../../utils/avatar";
import { clearAuthToken, readAuthToken } from "../../utils/auth";
import { createLogger } from "../../utils/logger";
import { resolveLegacyValue, storage, STORAGE_KEYS } from "../../utils/storage";
import { resolveDisplayedStreak } from "../../utils/streak";
import {
  saveProfilePictureUrl,
  uploadToAzure,
  validateProfilePictureFile,
} from "../../api/profilePicture";
import {
  getSavedNotificationSettings,
  saveNotificationSettings,
  subscribeDailyReminder,
  unsubscribeDailyReminder,
} from "../../utils/notificationService";
import { useTheme } from "../../theme/ThemeProvider";
import { getMyStressLogs } from "../../services/stressService";
import ConfirmModal from "../../components/ConfirmModal";

// --- AVATAR ASSETS ---
import avatar1 from "../../assets/images/avatar1.png";
import avatar2 from "../../assets/images/avatar2.png";
import avatar3 from "../../assets/images/avatar3.png";
import avatar4 from "../../assets/images/avatar4.png";
import avatar5 from "../../assets/images/avatar5.png";

const logger = createLogger("PROFILE");

const AVATAR_OPTIONS = [avatar1, avatar4, avatar3, avatar5, avatar2];

// --- COMPONENT: AVATAR SELECTION MODAL ---
const AvatarSelectionModal = ({ onClose, onSelect, onUpload, currentAvatar, uploading }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-elevated glass-panel rounded-[24px] p-6 w-full max-w-lg shadow-2xl border border-white/50 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-secondary transition-colors"
        >
          <X size={24} />
        </button>
        <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Pick Your Avatar</h3>
        <div className="flex justify-center items-center gap-3 md:gap-4 flex-wrap bg-surface-muted border border-border rounded-2xl p-4">
          {AVATAR_OPTIONS.map((avatarImg, index) => {
            const isSelected = currentAvatar === avatarImg;
            return (
              <div
                key={index}
                onClick={() => onSelect(avatarImg)}
                className={`relative cursor-pointer transition-all duration-300 rounded-full p-1 ${isSelected ? "scale-110 ring-4 ring-orange-500 shadow-lg bg-surface-elevated" : "hover:scale-105 opacity-70 hover:opacity-100"}`}
              >
                <img
                  src={avatarImg}
                  alt={`Avatar ${index}`}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover bg-surface-elevated glass-panel border border-border"
                />
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                    <Check size={10} strokeWidth={4} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-col items-center gap-3">
          <label className="w-full cursor-pointer rounded-2xl border border-dashed border-border bg-surface-elevated glass-panel px-4 py-3 text-center text-xs font-semibold text-text-muted transition hover:border-orange-400 hover:text-orange-500">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onUpload(event.target.files?.[0])}
              disabled={uploading}
            />
            {uploading ? "Uploading..." : "Upload your own photo"}
          </label>
          <p className="text-center text-xs text-text-muted">
            *Select an avatar or upload a custom photo (max 2MB).
          </p>
        </div>
      </div>
    </div>
  );
};

// --- GAME COMPONENT (FULL ORIGINAL) ---
const FishGameModal = ({ onClose }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let player,
      worms,
      powerUps,
      score,
      gameOver,
      timeLeft,
      keys,
      spawnInterval,
      timer,
      frame,
      explosions;
    const storedHighScore = resolveLegacyValue({
      key: STORAGE_KEYS.FISH_WORM_HIGH_SCORE,
      legacyKeys: ["fishWormHighScore"],
    });
    let highScore = parseInt(storedHighScore || "0", 10) || 0;
    let lives;
    let audioCtx = null;
    let animationFrameId;

    const playSound = (freq, type, duration = 0.1) => {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {
        logger.error("Failed to fetch profile data.", e);
      }
    };

    const updateScore = (val) => {
      const el = document.getElementById("game-score");
      if (el) el.innerText = val;
    };
    const updateTime = (val) => {
      const el = document.getElementById("game-time");
      if (el) el.innerText = val;
    };
    const updateLives = (val) => {
      const el = document.getElementById("game-lives");
      if (el) el.innerText = "❤️".repeat(Math.max(0, val)) + "🤍".repeat(Math.max(0, 3 - val));
    };
    const updateStatus = (msg) => {
      const el = document.getElementById("game-status");
      if (el) el.innerText = msg;
    };
    const showRestart = (show) => {
      const el = document.getElementById("game-restart");
      if (el) el.style.display = show ? "block" : "none";
    };

    function drawFish(x, y, size, polarity, dir) {
      const color = polarity === "N" ? "#0162F1" : "#FF6700";
      const glowColor = polarity === "N" ? "#00A4FF" : "#FFBF00";
      ctx.save();
      ctx.translate(x, y);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      if (dir === "left") ctx.rotate(Math.PI);
      else if (dir === "up") ctx.rotate(-Math.PI / 2);
      else if (dir === "down") ctx.rotate(Math.PI / 2);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, polarity === "N" ? "#0149B3" : "#CC5200");
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      const tailSwing = Math.sin(frame * 0.2) * size * 0.4;
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.lineTo(-size - size * 0.8, -size * 0.5 + tailSwing);
      ctx.lineTo(-size - size * 0.8, size * 0.5 + tailSwing);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(size * 0.6, -size * 0.1, size * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.65, -size * 0.1, size * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = "#141313";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.62, -size * 0.12, size * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(polarity, 0, 0);
      ctx.restore();
    }
    function drawWorm(w) {
      const segCount = 5;
      const baseColor = w.polarity === "N" ? "#0162F1" : "#FF6700";
      for (let i = 0; i < segCount; i++) {
        let offset = Math.sin(frame * 0.2 + w.phase + i * 0.5) * 4;
        let alpha = 1 - i * 0.1;
        ctx.save();
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(w.x + offset, w.y - i * 8, w.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(w.polarity, w.x, w.y - 25);
    }
    function drawPowerUp(p) {
      ctx.save();
      const pulse = Math.sin(frame * 0.3) * 0.2 + 1;
      ctx.translate(p.x, p.y);
      ctx.scale(pulse, pulse);
      let color, glowColor, icon;
      if (p.type === "speed") {
        color = "#FFBF00";
        glowColor = "#FFD34D";
        icon = "⚡";
      } else if (p.type === "size") {
        color = "#00A4FF";
        glowColor = "#66C7FF";
        icon = "🍀";
      } else if (p.type === "poison") {
        color = "#0162F1";
        glowColor = "#4D8CFF";
        icon = "☠";
      } else {
        color = "#FF6700";
        glowColor = "#FF9A4D";
        icon = "💣";
      }
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#141313";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, 0, 1);
      ctx.restore();
    }
    function drawExplosion(ex) {
      ctx.save();
      ctx.globalAlpha = ex.alpha;
      const explosionColors = [
        "rgba(255, 103, 0, 0.8)",
        "rgba(255, 191, 0, 0.7)",
        "rgba(1, 98, 241, 0.6)",
      ];
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius - i * 10, 0, Math.PI * 2);
        ctx.fillStyle = explosionColors[i];
        ctx.fill();
      }
      ctx.restore();
    }
    function initGame() {
      player = {
        x: 250,
        y: 200,
        size: 22,
        polarity: "N",
        dir: "right",
        speed: 4,
      };
      worms = [];
      powerUps = [];
      explosions = [];
      score = 0;
      gameOver = false;
      timeLeft = 30;
      frame = 0;
      keys = {};
      lives = 3;
      updateScore(score);
      updateTime(timeLeft);
      updateLives(lives);
      updateStatus("");
      showRestart(false);
      clearInterval(spawnInterval);
      clearInterval(timer);
      spawnInterval = setInterval(() => {
        if (!gameOver) {
          const polarity = Math.random() < 0.5 ? "N" : "S";
          worms.push({
            x: Math.random() * 460 + 20,
            y: -20,
            size: 14,
            polarity,
            speed: 2,
            phase: Math.random() * Math.PI * 2,
          });
          if (Math.random() < 0.25) {
            const types = ["speed", "size", "poison", "bomb"];
            powerUps.push({
              x: Math.random() * 460 + 20,
              y: -20,
              size: 12,
              type: types[Math.floor(Math.random() * types.length)],
              speed: 2.5,
            });
          }
        }
      }, 1500);
      timer = setInterval(() => {
        if (gameOver) {
          clearInterval(timer);
          return;
        }
        timeLeft--;
        updateTime(timeLeft);
        if (timeLeft <= 0) {
          endGame("⏰ Time's up!");
        }
      }, 1000);
      loop();
    }
    function endGame(msg) {
      gameOver = true;
      playSound(150, "sawtooth", 0.5);
      if (score > highScore) {
        highScore = score;
        storage.setItem(STORAGE_KEYS.FISH_WORM_HIGH_SCORE, String(highScore));
        storage.removeItem("fishWormHighScore");
        msg += " 🏆 New Record!";
      }
      updateStatus(`${msg} Score: ${score}`);
      showRestart(true);
    }
    function loop() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!gameOver) {
        if (keys["ArrowUp"]) {
          player.y -= player.speed;
          player.dir = "up";
        }
        if (keys["ArrowDown"]) {
          player.y += player.speed;
          player.dir = "down";
        }
        if (keys["ArrowLeft"]) {
          player.x -= player.speed;
          player.dir = "left";
        }
        if (keys["ArrowRight"]) {
          player.x += player.speed;
          player.dir = "right";
        }
        if (player.x < -player.size) player.x = canvas.width + player.size;
        if (player.x > canvas.width + player.size) player.x = -player.size;
        if (player.y < -player.size) player.y = canvas.height + player.size;
        if (player.y > canvas.height + player.size) player.y = -player.size;
        drawFish(player.x, player.y, player.size, player.polarity, player.dir);
        for (let i = worms.length - 1; i >= 0; i--) {
          let w = worms[i];
          w.y += w.speed;
          drawWorm(w);
          let dx = player.x - w.x,
            dy = player.y - w.y;
          if (Math.sqrt(dx * dx + dy * dy) < player.size + w.size / 2) {
            if (w.polarity !== player.polarity) {
              score++;
              updateScore(score);
              playSound(440, "sine");
              timeLeft = Math.min(timeLeft + 1, 60);
              updateTime(timeLeft);
              if (player.size < 60) player.size += 1;
            } else {
              lives--;
              updateLives(lives);
              playSound(100, "square");
              if (lives <= 0) endGame("❌ No lives!");
            }
            worms.splice(i, 1);
          } else if (w.y > canvas.height + 20) worms.splice(i, 1);
        }
        for (let i = powerUps.length - 1; i >= 0; i--) {
          let p = powerUps[i];
          p.y += p.speed;
          drawPowerUp(p);
          let dx = player.x - p.x,
            dy = player.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < player.size + p.size) {
            playSound(600, "triangle");
            if (p.type === "speed") {
              player.speed = 7;
              setTimeout(() => (player.speed = 4), 5000);
            }
            if (p.type === "size") {
              player.size = Math.max(15, player.size - 5);
            }
            if (p.type === "poison") {
              player.speed = 2;
              setTimeout(() => (player.speed = 4), 4000);
            }
            if (p.type === "bomb") {
              explosions.push({
                x: player.x,
                y: player.y,
                radius: 20,
                alpha: 1,
              });
              lives--;
              updateLives(lives);
              playSound(100, "sawtooth");
              if (lives <= 0) endGame("💥 Boom!");
            }
            powerUps.splice(i, 1);
          } else if (p.y > canvas.height + 20) powerUps.splice(i, 1);
        }
        for (let i = explosions.length - 1; i >= 0; i--) {
          let ex = explosions[i];
          drawExplosion(ex);
          ex.radius += 3;
          ex.alpha -= 0.03;
          if (ex.alpha <= 0) explosions.splice(i, 1);
        }
      }
      animationFrameId = requestAnimationFrame(loop);
    }
    const handleKey = (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
        e.preventDefault();
      if (e.type === "keydown") {
        keys[e.key] = true;
        if (e.code === "Space" && !gameOver) {
          player.polarity = player.polarity === "N" ? "S" : "N";
          playSound(300, "sine");
        }
      } else {
        keys[e.key] = false;
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    initGame();
    const restartBtn = document.getElementById("game-restart");
    if (restartBtn) restartBtn.addEventListener("click", initGame);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
      if (restartBtn) restartBtn.removeEventListener("click", initGame);
      cancelAnimationFrame(animationFrameId);
      clearInterval(spawnInterval);
      clearInterval(timer);
      if (audioCtx) audioCtx.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-brand-neutral/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-surface border-2 border-brand-info rounded-2xl p-6 text-text-primary font-sans flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-info hover:text-text-inverse cursor-pointer"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-info to-brand-warning bg-clip-text text-transparent mb-1">
          🐟 Fish & Worm Polarity
        </h2>
        <p className="text-xs text-brand-info/80 mb-4">
          Space: Switch Polarity | Arrows: Move | Goal: Eat Opposite Polarity
        </p>
        <div className="flex justify-between w-full max-w-[500px] mb-4 text-sm font-bold">
          <div className="text-brand-accent">
            Lives: <span id="game-lives">❤️❤️❤️</span>
          </div>
          <div className="text-brand-info">
            Score: <span id="game-score">0</span>
          </div>
          <div className="text-brand-warning">
            Time: <span id="game-time">30</span>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="w-full max-w-[500px] h-auto bg-brand-neutral border-2 border-brand-info rounded-xl shadow-[0_0_20px_rgba(0,164,255,0.3)] cursor-crosshair"
        ></canvas>
        <div id="game-status" className="mt-4 text-brand-warning font-bold text-lg h-6"></div>
        <button
          id="game-restart"
          className="mt-4 px-6 py-2 bg-gradient-to-r from-brand-info to-brand-primary text-text-inverse font-bold rounded-full hover:scale-105 transition-transform hidden cursor-pointer"
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};

// --- MAIN PROFILE COMPONENT ---
export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const [notification, setNotification] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Yes",
    onConfirm: null,
  });

  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isVerifyingCurrentPassword, setIsVerifyingCurrentPassword] = useState(false);
  const [isCurrentPasswordVerified, setIsCurrentPasswordVerified] = useState(false);

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPasswords, setShowNewPasswords] = useState(false);

  // Bookmark state
  const [bookmarks, setBookmarks] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [stressSummary, setStressSummary] = useState({
    label: "-",
    textColor: "text-text-muted",
    bgColor: "bg-surface-muted",
  });

  // Lock/unlock fields for inline edits
  const [editableFields, setEditableFields] = useState({
    username: false,
    fullName: false,
    email: false,
    birthday: false,
    gender: false,
  });

  const { user: contextUser } = useOutletContext() || { user: {} };

  const getDisplayUsername = (u) => {
    if (u?.username && u.username !== "user") return u.username;
    if (u?.email) return u.email.split("@")[0];
    return "";
  };

  const normalizeGender = (value) => {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
  };

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    avatar: null,
    birthday: "",
    gender: "",
  });
  const [shouldClearProfilePicture, setShouldClearProfilePicture] = useState(false);
  const fallbackAvatar = DEFAULT_AVATAR;
  const [localAvatarPreview, setLocalAvatarPreview] = useState(null);
  const displayAvatar = resolveAvatarUrl(localAvatarPreview || formData.avatar) || fallbackAvatar;

  // --- Sync user info into the form ---
  useEffect(() => {
    if (contextUser) {
      setFormData({
        username: contextUser.username || getDisplayUsername(contextUser),
        fullName: contextUser.name || contextUser.fullName || "",
        email: contextUser.email || "",
        avatar: contextUser.avatar || AVATAR_OPTIONS[0],
        birthday: contextUser.userDob || contextUser.birthday || "",
        gender: normalizeGender(contextUser.gender || contextUser.sex || ""),
      });
      setLocalAvatarPreview(null);
      setShouldClearProfilePicture(false);
    }
  }, [contextUser]);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const openConfirm = useCallback((config) => {
    setConfirmState({
      isOpen: true,
      title: config.title || "Confirm action",
      message: config.message || "Are you sure?",
      confirmLabel: config.confirmLabel || "Yes",
      onConfirm: config.onConfirm || null,
    });
  }, []);

  const handleConfirm = async () => {
    if (confirmState.onConfirm) {
      await confirmState.onConfirm();
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleCancelConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const fetchBookmarks = useCallback(async () => {
    setLoadingBookmarks(true);
    const token = readAuthToken();
    if (!token) {
      setLoadingBookmarks(false);
      return;
    }
    try {
      const data = await getMyBookmarks();
      const normalizedBookmarks = (data || []).map((item) => ({
        ...item,
        bookmarkId: item.bookmarkId,
        motivationId: item.motivationId,
      }));
      setBookmarks(normalizedBookmarks);
    } catch (err) {
      logger.error("Failed to load bookmarks", err);
      showNotification("Failed to load bookmarks", "error");
    } finally {
      setLoadingBookmarks(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (activeTab === "bookmark") {
      fetchBookmarks();
    }
  }, [activeTab, fetchBookmarks]);

  const { preference: themePreference, resolvedTheme, setPreference } = useTheme();
  const getSystemTheme = () => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const handleUnsave = async (motivationId) => {
    try {
      await deleteBookmark(motivationId);
      setBookmarks((prev) => prev.filter((b) => b.motivationId !== motivationId));
      showNotification("Bookmark removed", "info");
    } catch {
      showNotification("Failed to remove bookmark", "error");
    }
  };

  const handleThemeSelect = (nextTheme) => {
    setPreference(nextTheme);
    const label = nextTheme === "system" ? "system" : nextTheme === "dark" ? "dark" : "light";
    showNotification(`Theme set to ${label}`);
  };

  const [notifSettings, setNotifSettings] = useState(() => {
    return (
      getSavedNotificationSettings() || {
        dailyReminder: true,
        reminderTime: "08:00",
        emailUpdates: false,
      }
    );
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStep, setPasswordStep] = useState(1);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", handleChange);
    } else {
      mediaQueryList.addListener(handleChange);
    }
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, []);

  const systemLabel = systemTheme === "dark" ? "Always dark" : "Always light";
  const themeLabels = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };
  const themeOptions = [
    {
      value: "light",
      label: "Light",
      description: "Always light",
      icon: Sun,
    },
    {
      value: "dark",
      label: "Dark",
      description: "Always dark",
      icon: Moon,
    },
    {
      value: "system",
      label: "System",
      description: systemLabel,
      icon: Monitor,
    },
  ];
  useEffect(() => {
    if (!localAvatarPreview) return;
    return () => URL.revokeObjectURL(localAvatarPreview);
  }, [localAvatarPreview]);

  // Dynamic stats and streak color logic
  const getStreakStyle = (streak) => {
    const s = streak || 0;
    if (s >= 60) return { iconColor: "text-brand-info", bgColor: "bg-brand-info/15" };
    if (s >= 7)
      return {
        iconColor: "text-brand-warning",
        bgColor: "bg-brand-warning/15",
      };
    if (s >= 2)
      return {
        iconColor: "text-brand-primary",
        bgColor: "bg-brand-primary/15",
      };
    return { iconColor: "text-text-muted", bgColor: "bg-surface-muted" };
  };

  const streakVal = resolveDisplayedStreak(contextUser?.streak || 0);
  const streakStyle = getStreakStyle(streakVal);

  const resolveStressLabel = (value) => {
    if (value === "High" || value === "high" || Number(value) >= 2) return "High";
    if (value === "Moderate" || value === "moderate" || Number(value) === 1) return "Moderate";
    return "Low";
  };

  const resolveStressStyle = (label) => {
    if (label === "High") return { textColor: "text-brand-accent", bgColor: "bg-brand-accent/15" };
    if (label === "Moderate")
      return {
        textColor: "text-brand-warning",
        bgColor: "bg-brand-warning/15",
      };
    return { textColor: "text-brand-info", bgColor: "bg-brand-info/15" };
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStressSummary = async () => {
      try {
        const logs = await getMyStressLogs();
        const entries = Array.isArray(logs) ? logs : [];
        if (entries.length === 0) {
          if (isMounted) {
            setStressSummary({
              label: "-",
              textColor: "text-text-muted",
              bgColor: "bg-surface-muted",
            });
          }
          return;
        }

        const counts = entries.reduce(
          (acc, log) => {
            const label = resolveStressLabel(log?.stressLevel);
            acc[label] += 1;
            return acc;
          },
          { Low: 0, Moderate: 0, High: 0 },
        );

        const priority = ["High", "Moderate", "Low"];
        const topLabel = priority.reduce((top, label) => {
          if (counts[label] > counts[top]) return label;
          if (counts[label] === counts[top]) {
            return priority.indexOf(label) < priority.indexOf(top) ? label : top;
          }
          return top;
        }, "Low");

        const style = resolveStressStyle(topLabel);
        if (isMounted) {
          setStressSummary({
            label: topLabel,
            textColor: style.textColor,
            bgColor: style.bgColor,
          });
        }
      } catch (error) {
        logger.warn("Failed to load stress summary:", error);
      }
    };

    fetchStressSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Streak",
      value: `${streakVal} Days`,
      // Use the Flame icon with the same color logic.
      icon: <Flame className={`w-5 h-5 ${streakStyle.iconColor}`} />,
      bg: streakStyle.bgColor,
    },
    {
      label: "Entries",
      value: `${contextUser?.diaryCount ?? 0} Notes`,
      icon: <BookOpen className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-100",
    },
    {
      label: "Stress",
      value: stressSummary.label,
      icon: <Activity className={`w-5 h-5 ${stressSummary.textColor}`} />,
      bg: stressSummary.bgColor,
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const focusFirstEmptyField = (form) => {
    const requiredFields = Array.from(form.querySelectorAll("[data-required='true']"));
    const emptyField = requiredFields.find((field) => !field.value);
    if (emptyField) {
      emptyField.focus();
      return true;
    }
    return false;
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter") return;
    if (event.target?.tagName === "TEXTAREA") return;
    if (focusFirstEmptyField(event.currentTarget)) {
      event.preventDefault();
    }
  };

  const handleSaveProfile = async () => {
    setIsLoadingSave(true);
    try {
      const token = readAuthToken();
      if (!token) {
        showNotification("You are logged out", "error");
        return;
      }

      if (formData.birthday) {
        const birthDate = new Date(formData.birthday);
        const now = new Date();
        if (birthDate > now) {
          showNotification("Birthday cannot be in the future.", "error");
          return;
        }
      }

      if (formData.gender && !["male", "female", "other"].includes(formData.gender)) {
        showNotification("Please select a valid gender option.", "error");
        return;
      }

      if (shouldClearProfilePicture) {
        await saveProfilePictureUrl(null);
      }

      const payload = {
        username: formData.username,
        name: formData.fullName,
        email: formData.email,
        avatar: formData.avatar,
        gender: formData.gender || null,
        userDob: formData.birthday || null,
      };

      const updatedProfile = await updateProfile(payload);
      const cachedUser = storage.getJson(STORAGE_KEYS.CACHE_USER_DATA, contextUser || {});
      const normalizedDob =
        updatedProfile?.userDob ||
        updatedProfile?.user_dob ||
        updatedProfile?.birthday ||
        updatedProfile?.dob ||
        payload.userDob ||
        cachedUser?.userDob ||
        cachedUser?.birthday ||
        "";
      const normalizedGender = normalizeGender(
        updatedProfile?.gender ?? payload.gender ?? cachedUser?.gender ?? "",
      );

      const nextUser = {
        ...cachedUser,
        ...updatedProfile,
        name:
          updatedProfile?.name ||
          updatedProfile?.fullName ||
          cachedUser?.name ||
          formData.fullName,
        username: updatedProfile?.username || cachedUser?.username || formData.username,
        email: updatedProfile?.email || cachedUser?.email || formData.email,
        avatar: updatedProfile?.avatar || cachedUser?.avatar || formData.avatar,
        gender: normalizedGender,
        birthday: normalizedDob,
        userDob: normalizedDob,
      };

      storage.setJson(STORAGE_KEYS.CACHE_USER_DATA, nextUser);
      setFormData((prev) => ({
        ...prev,
        username: nextUser.username || "",
        fullName: nextUser.name || "",
        email: nextUser.email || "",
        avatar: nextUser.avatar || prev.avatar,
        birthday: normalizedDob,
        gender: normalizedGender,
      }));
      showNotification("Profile updated successfully!");
      setEditableFields({
        username: false,
        fullName: false,
        email: false,
        birthday: false,
        gender: false,
      });
      setShouldClearProfilePicture(false);
      window.dispatchEvent(new Event("nostressia:user-update"));
    } catch (error) {
      showNotification(error?.message || "Failed to update profile", "error");
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleAvatarSelect = (url) => {
    setLocalAvatarPreview(null);
    setShouldClearProfilePicture(true);
    setFormData((prev) => ({ ...prev, avatar: url }));
    setShowAvatarModal(false);
    showNotification("Avatar selected. Click Save Changes to apply.");
  };

  const handleAvatarUpload = async (file) => {
    const validation = validateProfilePictureFile(file);
    if (!validation.ok) {
      showNotification(validation.message, "error");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarPreview(previewUrl);
    setShouldClearProfilePicture(false);
    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadToAzure(file, "profile-pictures");
      if (!uploadedUrl) {
        throw new Error("The upload URL is not available.");
      }

      const updatedUser = await saveProfilePictureUrl(uploadedUrl);

      setFormData((prev) => ({
        ...prev,
        avatar: updatedUser?.avatar || uploadedUrl,
      }));
      setLocalAvatarPreview(null);
      showNotification("Profile photo uploaded successfully.", "success");
      setShowAvatarModal(false);
      window.dispatchEvent(new Event("nostressia:user-update"));
    } catch (error) {
      showNotification(error?.message || "Failed to upload the profile photo.", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleEdit = (field) => {
    setEditableFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleLogout = () => {
    openConfirm({
      title: "Log out",
      message: "Are you sure you want to log out?",
      confirmLabel: "Log out",
      onConfirm: async () => {
        clearAuthToken();
        storage.removeItem(STORAGE_KEYS.CACHE_USER_DATA);
        window.location.href = "/";
      },
    });
  };

  const getNotificationPermissionStatus = () => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    return Notification.permission;
  };

  const handleNotifChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : value;
    setNotifSettings((prev) => ({ ...prev, [name]: nextValue }));
    if (name === "reminderTime" && value === "04:04") {
      setShowGameModal(true);
    }
    if (
      name === "dailyReminder" &&
      nextValue &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      const status = getNotificationPermissionStatus();
      if (status && status !== "granted") {
        setPermissionStatus(status);
        setShowPermissionPrompt(true);
      }
    }
  };
  const saveNotifSettings = async () => {
    saveNotificationSettings(notifSettings);
    setShowNotifModal(false);

    if (notifSettings.dailyReminder) {
      const permissionState = getNotificationPermissionStatus();

      if (permissionState && permissionState !== "granted") {
        setPermissionStatus(permissionState);
        setShowPermissionPrompt(true);
        return;
      }
      try {
        const result = await subscribeDailyReminder(notifSettings.reminderTime);
        if (!result.ok) {
          const disabledSettings = { ...notifSettings, dailyReminder: false };
          setNotifSettings(disabledSettings);
          saveNotificationSettings(disabledSettings);
          showNotification(result.message || "Failed to schedule reminders.", "error");
          return;
        }
        showNotification(result.message || "Notification preferences saved!", "success");
      } catch (error) {
        showNotification(error?.message || "Failed to schedule reminders.", "error");
      }
      return;
    }

    await unsubscribeDailyReminder();
    showNotification("Notification preferences saved!", "success");
  };

  const handlePermissionAllow = async () => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "denied"
    ) {
      setPermissionStatus("denied");
      setShowPermissionPrompt(true);
      showNotification(
        "Notifications are blocked. Enable permission in your browser settings.",
        "error"
      );
      return;
    }

    setShowPermissionPrompt(false);
    setPermissionStatus(null);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permissionResult = await Notification.requestPermission();
        if (permissionResult !== "granted") {
          const disabledSettings = { ...notifSettings, dailyReminder: false };
          setNotifSettings(disabledSettings);
          saveNotificationSettings(disabledSettings);
          setPermissionStatus(permissionResult);
          setShowPermissionPrompt(true);
          showNotification(
            permissionResult === "default"
              ? "Notification permission request was dismissed."
              : "Notification permission was denied.",
            "error"
          );
          return;
        }
      }
      saveNotificationSettings(notifSettings);
      const result = await subscribeDailyReminder(notifSettings.reminderTime, {
        skipPermissionPrompt: true,
      });
      if (!result.ok) {
        const disabledSettings = { ...notifSettings, dailyReminder: false };
        setNotifSettings(disabledSettings);
        saveNotificationSettings(disabledSettings);
        if (result.reason === "denied") {
          setPermissionStatus("denied");
          setShowPermissionPrompt(true);
        }
        showNotification(result.message || "Failed to schedule reminders.", "error");
        return;
      }
      showNotification(result.message || "Notification preferences saved!", "success");
    } catch (error) {
      showNotification(error?.message || "Failed to schedule reminders.", "error");
    }
  };

  const handlePermissionDismiss = async () => {
    setShowPermissionPrompt(false);
    setPermissionStatus(null);
    const disabledSettings = { ...notifSettings, dailyReminder: false };
    setNotifSettings(disabledSettings);
    saveNotificationSettings(disabledSettings);
    await unsubscribeDailyReminder();
    showNotification("Notification permission is required to enable reminders.", "info");
  };

  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
    if (name === "currentPassword") {
      setIsCurrentPasswordVerified(false);
    }
  };

  const handlePasswordStepNext = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      showNotification("Please enter your current password.", "error");
      return;
    }
    if (isCurrentPasswordVerified) {
      setPasswordStep(2);
      return;
    }

    setIsVerifyingCurrentPassword(true);
    try {
      await verifyCurrentPassword({
        currentPassword: passwordForm.currentPassword,
      });
      setIsCurrentPasswordVerified(true);
      setPasswordStep(2);
      showNotification("Current password verified.", "success");
    } catch (error) {
      setIsCurrentPasswordVerified(false);
      showNotification(error?.message || "Unable to verify the current password.", "error");
    } finally {
      setIsVerifyingCurrentPassword(false);
    }
  };

  const handlePasswordStepBack = () => {
    setPasswordStep(1);
    setIsCurrentPasswordVerified(false);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setShowCurrentPassword(false);
    setShowNewPasswords(false);
    setIsCurrentPasswordVerified(false);
    setIsVerifyingCurrentPassword(false);
    setPasswordStep(1);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    if (!isCurrentPasswordVerified) {
      showNotification("Please verify your current password first.", "error");
      setPasswordStep(1);
      return;
    }
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      showNotification("Please fill in all fields", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification("New passwords do not match!", "error");
      return;
    }

    setIsLoadingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      showNotification("Password changed successfully!", "success");
      handleClosePasswordModal();
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      showNotification(error?.message || "Failed to change password", "error");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div
      className="min-h-screen pb-24 md:pb-10"
      style={{
        background:
          "linear-gradient(135deg, rgb(var(--bg-gradient-sun)) 0%, rgb(var(--bg-gradient-orange)) 50%, rgb(var(--bg-gradient-sky)) 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <PageMeta
        title="Profile"
        description="Manage your Nostressia profile, preferences, notifications, and account security."
      />
      <Navbar user={contextUser} />
      {showGameModal && <FishGameModal onClose={() => setShowGameModal(false)} />}
      {showAvatarModal && (
        <AvatarSelectionModal
          onClose={() => setShowAvatarModal(false)}
          onSelect={handleAvatarSelect}
          onUpload={handleAvatarUpload}
          currentAvatar={formData.avatar}
          uploading={isUploadingAvatar}
        />
      )}
      {showPermissionPrompt && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-elevated glass-panel dark:bg-surface rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-white/60 dark:border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300 p-2 rounded-full">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text-primary dark:text-text-primary">
                Allow notifications?
              </h3>
            </div>
            <p className="text-sm text-text-secondary dark:text-text-muted mb-6">
              Nostressia needs permission to send daily reminders.
              {permissionStatus === "denied" && (
                <span className="mt-2 block text-xs text-orange-500 dark:text-orange-300">
                  Notifications are blocked. Enable them in your browser settings to continue.
                </span>
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePermissionAllow}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200/80 dark:shadow-orange-500/20 transition-all cursor-pointer"
              >
                Allow
              </button>
              <button
                onClick={handlePermissionDismiss}
                className="flex-1 py-2.5 bg-surface-muted hover:bg-surface-elevated text-text-primary dark:bg-surface dark:hover:bg-surface-muted dark:text-text-primary font-bold rounded-xl border border-border/60 shadow-sm transition-all cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {notification && (
        <div className="fixed top-24 right-4 z-[300] animate-bounce-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
              notification.type === "success"
                ? "bg-surface-elevated glass-panel text-brand-info border-brand-info/20 dark:bg-surface dark:text-brand-info dark:border-brand-info/30"
                : notification.type === "error"
                  ? "bg-surface-elevated glass-panel text-brand-accent border-brand-accent/20 dark:bg-surface dark:text-brand-accent dark:border-brand-accent/30"
                  : "bg-surface-elevated glass-panel text-brand-primary border-brand-primary/20 dark:bg-surface dark:text-brand-primary dark:border-brand-primary/30"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : notification.type === "error" ? (
              <X className="w-5 h-5" />
            ) : (
              <Heart className="w-5 h-5" />
            )}
            <span className="font-bold">{notification.message}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

      {/* SETTINGS MODAL */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-elevated glass-panel dark:bg-surface rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50 dark:border-border">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-text-primary dark:text-text-primary flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" /> Notifications
              </h3>
              <button
                onClick={() => setShowNotifModal(false)}
                className="text-text-muted hover:text-text-secondary dark:text-text-muted dark:hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 p-2 rounded-full">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary dark:text-text-primary">
                      Daily Reminder
                    </p>
                    <p className="text-xs text-text-muted dark:text-text-muted">
                      Remind me to check-in
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="dailyReminder"
                    checked={notifSettings.dailyReminder}
                    onChange={handleNotifChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-muted dark:bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-elevated glass-panel after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
              </div>
              {notifSettings.dailyReminder && (
                <div className="space-y-3">
                  <div className="bg-surface-muted dark:bg-surface p-4 rounded-xl flex items-center justify-between border border-border-subtle dark:border-border">
                    <div className="flex items-center gap-2 text-text-secondary dark:text-text-muted">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">Time</span>
                    </div>
                    <input
                      type="time"
                      name="reminderTime"
                      value={notifSettings.reminderTime}
                      onChange={handleNotifChange}
                      className="bg-surface-elevated glass-panel dark:bg-surface border border-border dark:border-border text-text-primary dark:text-text-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    />
                  </div>
                  <p className="text-[11px] text-text-muted dark:text-text-muted">
                    You will receive a reminder at your scheduled time.
                  </p>
                </div>
              )}
              <div className="h-px bg-surface-muted dark:bg-surface-muted"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 p-2 rounded-full">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary dark:text-text-primary">
                      Weekly Report
                    </p>
                    <p className="text-xs text-text-muted dark:text-text-muted">
                      Receive summary via email
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="emailUpdates"
                    checked={notifSettings.emailUpdates}
                    onChange={handleNotifChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-muted dark:bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-elevated glass-panel after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-info"></div>
                </label>
              </div>
              <button
                onClick={saveNotifSettings}
                className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200/80 dark:shadow-orange-500/20 transition-all cursor-pointer transform active:scale-95"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-elevated glass-panel rounded-[24px] p-8 w-full max-w-md shadow-2xl border border-white/50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-500" /> Change Password
                </h3>
                <div className="flex gap-2 mt-2">
                  {[1, 2].map((step) => (
                    <div
                      key={step}
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStep >= step ? "w-8 bg-blue-600" : "w-2 bg-surface-muted"}`}
                    ></div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleClosePasswordModal}
                className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form
              onSubmit={passwordStep === 1 ? handlePasswordStepNext : handleSubmitPasswordChange}
              onKeyDown={handleFormKeyDown}
              className="space-y-4"
            >
              {passwordStep === 1 ? (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-sm text-text-muted">
                    Enter your current password before setting a new one.
                  </p>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-current-password"
                      className="text-sm font-bold text-text-secondary ml-1"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        id="profile-current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="Enter current password"
                        className="w-full pl-12 pr-12 py-3 rounded-xl bg-surface-muted border border-border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                        data-required="true"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isVerifyingCurrentPassword}
                    className={`w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer transform active:scale-95 ${isVerifyingCurrentPassword ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {isVerifyingCurrentPassword ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                      </span>
                    ) : (
                      "Continue"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-sm text-text-muted">Create a new password for your account.</p>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-new-password"
                      className="text-sm font-bold text-text-secondary ml-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        id="profile-new-password"
                        type={showNewPasswords ? "text" : "password"}
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="Enter new password"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                        data-required="true"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-confirm-password"
                      className="text-sm font-bold text-text-secondary ml-1"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        id="profile-confirm-password"
                        type={showNewPasswords ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChangeInput}
                        placeholder="Re-enter new password"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-muted border border-border focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                        data-required="true"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-2 ml-1">
                      <input
                        type="checkbox"
                        id="showNewPass"
                        checked={showNewPasswords}
                        onChange={(e) => setShowNewPasswords(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="showNewPass"
                        className="text-sm text-text-secondary cursor-pointer select-none"
                      >
                        Show New Passwords
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePasswordStepBack}
                      className="flex-1 py-3 bg-surface-muted text-text-secondary font-bold rounded-xl shadow-sm hover:bg-surface-muted transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoadingPassword}
                      className={`flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer transform active:scale-95 flex justify-center items-center gap-2 ${isLoadingPassword ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {isLoadingPassword ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 pt-24 md:pt-28">
        <div className="relative bg-surface-elevated/60 glass-panel backdrop-blur-xl border border-white/40 rounded-[30px] p-6 md:p-10 shadow-xl overflow-hidden mb-8 max-w-4xl mx-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-info/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-warning/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-surface-elevated">
                <img
                  src={displayAvatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = fallbackAvatar;
                  }}
                />
              </div>
              {/* Avatar edit button (opens modal) */}
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full shadow-md hover:bg-blue-700 transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-extrabold text-text-primary">
                {formData.fullName || "Your Name"}
              </h1>
              <p className="text-text-muted font-medium mb-1">@{formData.username || "username"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-border/60">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-2">
                <div
                  className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center mb-2`}
                >
                  {stat.icon}
                </div>
                <span className="text-lg font-bold text-text-primary">{stat.value}</span>
                <span className="text-xs text-text-muted uppercase tracking-wide">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-surface-elevated/40 glass-panel backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/30 shadow-sm overflow-x-auto">
            {[
              {
                id: "personal",
                label: "Personal",
                icon: <User className="w-4 h-4" />,
              },
              {
                id: "bookmark",
                label: "Bookmark",
                icon: <Bookmark className="w-4 h-4" />,
              },
              {
                id: "settings",
                label: "Settings",
                icon: <Settings className="w-4 h-4" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.id ? "bg-surface-elevated glass-panel text-blue-600 shadow-md scale-105" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated/30"}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up pb-20">
          {activeTab === "personal" && (
            <div className="bg-surface-elevated/60 glass-panel backdrop-blur-md border border-white/40 rounded-[24px] p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" /> Personal Details
              </h3>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {/* USERNAME (Editable) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">Username</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 z-2 -translate-y-1/2 text-text-muted font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={!editableFields.username}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface-elevated glass-panel border ${editableFields.username ? "border-blue-400 ring-2 ring-blue-100" : "border-border bg-surface-muted text-text-muted"} focus:outline-none transition-all`}
                      />
                    </div>
                    <button
                      onClick={() => toggleEdit("username")}
                      className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {editableFields.username ? "Lock" : "Change"}
                    </button>
                  </div>
                </div>

                {/* FULL NAME (Editable) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">Full Name</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-4 top-1/2 z-2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!editableFields.fullName}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated glass-panel border ${editableFields.fullName ? "border-blue-400 ring-2 ring-blue-100" : "border-border bg-surface-muted text-text-muted"} focus:outline-none transition-all`}
                      />
                    </div>
                    <button
                      onClick={() => toggleEdit("fullName")}
                      className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {editableFields.fullName ? "Lock" : "Change"}
                    </button>
                  </div>
                </div>

                {/* EMAIL (Editable) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-secondary ml-1">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 z-2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editableFields.email}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated glass-panel border ${editableFields.email ? "border-blue-400 ring-2 ring-blue-100" : "border-border bg-surface-muted text-text-muted"} focus:outline-none transition-all`}
                      />
                    </div>
                    <button
                      onClick={() => toggleEdit("email")}
                      className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {editableFields.email ? "Lock" : "Change"}
                    </button>
                  </div>
                </div>

                {/* BIRTHDAY & GENDER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-birthday"
                      className="text-sm font-bold text-text-secondary ml-1"
                    >
                      Birthday
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Cake className="absolute left-4 top-1/2 z-2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                          id="profile-birthday"
                          name="birthday"
                          type="date"
                          value={formData.birthday}
                          onChange={handleInputChange}
                          disabled={!editableFields.birthday}
                          className={`w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated glass-panel border ${editableFields.birthday ? "border-blue-400 ring-2 ring-blue-100" : "border-border bg-surface-muted text-text-muted"} focus:outline-none transition-all`}
                        />
                      </div>
                      <button
                        onClick={() => toggleEdit("birthday")}
                        className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {editableFields.birthday ? "Lock" : "Change"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="profile-gender"
                      className="text-sm font-bold text-text-secondary ml-1"
                    >
                      Gender
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Smile className="absolute left-4 top-1/2 z-2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <select
                          id="profile-gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          disabled={!editableFields.gender}
                          className={`w-full pl-12 pr-4 py-3 rounded-xl bg-surface-elevated glass-panel border text-text-primary dark:text-text-primary ${editableFields.gender ? "border-blue-400 ring-2 ring-blue-100" : "border-border bg-surface-muted text-text-secondary"} focus:outline-none transition-all appearance-none disabled:text-text-muted disabled:opacity-100`}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Prefer not to say</option>
                        </select>
                      </div>
                      <button
                        onClick={() => toggleEdit("gender")}
                        className="px-4 py-3 rounded-xl border border-blue-200 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {editableFields.gender ? "Lock" : "Change"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoadingSave}
                    className={`px-8 py-3 bg-brand-accent hover:bg-brand-accent/90 text-text-inverse font-bold rounded-xl shadow-lg hover:shadow-brand-accent/30 transition-all cursor-pointer transform active:scale-95 ${isLoadingSave ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoadingSave ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "bookmark" && (
            <div>
              {loadingBookmarks ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : bookmarks.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  <p>No bookmarks yet.</p>
                  <Link to="/motivation" className="text-orange-500 font-bold hover:underline">
                    Go to Motivation Page
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.bookmarkId}
                      className="bg-surface-elevated/70 glass-panel backdrop-blur-sm p-6 rounded-[24px] border border-white/50 shadow-sm hover:shadow-md transition-all relative group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                          Motivation
                        </span>
                        <button
                          onClick={() => handleUnsave(bm.motivationId)}
                          className="text-orange-500 hover:scale-110 transition-transform cursor-pointer bg-surface-elevated glass-panel rounded-full p-1 shadow-sm"
                          title="Remove Bookmark"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <p className="text-text-primary font-medium italic text-lg mb-2">
                        "{bm.motivation?.quote}"
                      </p>
                      <p className="text-xs text-text-muted text-right">
                        - {bm.motivation?.authorName || "Anonymous"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center">
                <Link
                  to="/motivation"
                  className="px-6 py-3 rounded-xl border-2 border-dashed border-orange-300 text-orange-600 font-bold hover:bg-orange-50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add More
                </Link>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="bg-surface-elevated/60 glass-panel backdrop-blur-md border border-white/40 rounded-[24px] overflow-hidden shadow-lg p-2">
                <button
                  onClick={() => setShowNotifModal(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated/50 glass-panel rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-text-primary">Notifications</h4>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </button>
                <div className="h-px bg-surface-muted mx-4"></div>
                <div className="w-full p-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
                      {resolvedTheme === "dark" ? (
                        <Moon className="w-5 h-5" />
                      ) : (
                        <Sun className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-text-primary">Theme</h4>
                      <p className="text-xs text-text-muted">
                        Current: {themeLabels[themePreference] || "System"} ({systemLabel} when
                        system)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {themeOptions.map((option) => {
                      const isActive = themePreference === option.value;
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleThemeSelect(option.value)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all ${
                            isActive
                              ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-border bg-surface-elevated glass-panel hover:border-blue-200 hover:bg-blue-50/60"
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${
                              isActive
                                ? "bg-blue-100 text-blue-600"
                                : "bg-surface-muted text-text-secondary"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs font-medium text-text-muted">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-px bg-surface-muted mx-4"></div>
                <button
                  onClick={() => {
                    setPasswordStep(1);
                    setShowPasswordModal(true);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated/50 glass-panel rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-text-primary">Change Password</h4>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-surface-elevated/80 glass-panel border border-red-100 p-4 rounded-[24px] flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-5 h-5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

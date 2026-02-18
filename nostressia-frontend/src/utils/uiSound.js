import { storage } from "./storage";

const UI_SOUND_KEY = "nostressia_ui_sound_enabled";
let audioCtx = null;

const SOUND_MAP = {
  success: { frequency: 740, type: "triangle", duration: 0.09, gain: 0.07 },
  error: { frequency: 180, type: "sawtooth", duration: 0.14, gain: 0.08 },
  warning: { frequency: 260, type: "square", duration: 0.1, gain: 0.06 },
  click: { frequency: 420, type: "sine", duration: 0.045, gain: 0.045 },
};

const resolveAudioContext = () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
};

export const isUiSoundEnabled = () => {
  const stored = storage.getItem(UI_SOUND_KEY);
  if (stored == null) return true;
  return stored !== "false";
};

export const setUiSoundEnabled = (enabled) => {
  storage.setItem(UI_SOUND_KEY, enabled ? "true" : "false");
};

export const playUiSound = (kind = "click") => {
  if (!isUiSoundEnabled()) return;
  const config = SOUND_MAP[kind] || SOUND_MAP.click;
  const ctx = resolveAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + config.duration);
  } catch {
    // Ignore audio failures (autoplay policy / unsupported browser)
  }
};

export const soundTypeFromToast = (toastType) => {
  if (toastType === "success") return "success";
  if (toastType === "error") return "error";
  if (toastType === "warning") return "warning";
  return "click";
};

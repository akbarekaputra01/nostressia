export const STORAGE_KEYS = {
  THEME_PREFERENCE: "nostressia_theme",
  CACHE_USER_DATA: "nostressia_cache_user_data",
  TODAY_LOG: "nostressia_today_log",
  USER_GPA: "nostressia_user_gpa",
  FISH_WORM_HIGH_SCORE: "nostressia_fish_worm_high_score",
  NOTIFICATION_SETTINGS: "nostressia_notification_settings",
};

const getStorage = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage || null;
};

export const storage = {
  getItem(key) {
    try {
      return getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      getStorage()?.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem(key) {
    try {
      getStorage()?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  clear() {
    try {
      getStorage()?.clear();
      return true;
    } catch {
      return false;
    }
  },
  getJson(key, fallback = null) {
    const stored = storage.getItem(key);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored);
    } catch {
      return fallback;
    }
  },
  setJson(key, value) {
    try {
      const payload = JSON.stringify(value);
      return storage.setItem(key, payload);
    } catch {
      return false;
    }
  },
};

export const resolveLegacyValue = ({ key, legacyKeys = [], parser = (value) => value }) => {
  const currentValue = storage.getItem(key);
  if (currentValue != null) {
    legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
    return parser(currentValue);
  }

  const legacyValue = legacyKeys.map((legacyKey) => storage.getItem(legacyKey)).find(Boolean);
  if (legacyValue != null) {
    storage.setItem(key, legacyValue);
    legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
    return parser(legacyValue);
  }

  legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
  return null;
};

export const resolveLegacyJson = ({ key, legacyKeys = [], fallback = null }) => {
  const parseJson = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };
  const currentValue = storage.getItem(key);
  if (currentValue != null) {
    legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
    return parseJson(currentValue);
  }

  const legacyValue = legacyKeys.map((legacyKey) => storage.getItem(legacyKey)).find(Boolean);
  if (legacyValue != null) {
    storage.setItem(key, legacyValue);
    legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
    return parseJson(legacyValue);
  }

  legacyKeys.forEach((legacyKey) => storage.removeItem(legacyKey));
  return fallback;
};

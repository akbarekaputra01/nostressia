// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { getProfile } from "../services/authService";
import { getStressEligibility } from "../services/stressService";
import { clearAuthToken, readAuthToken } from "../utils/auth";
import { restoreDailyReminderSubscription } from "../utils/notificationService";
import { createLogger } from "../utils/logger";
import { resolveLegacyJson, storage, STORAGE_KEYS } from "../utils/storage";

const logger = createLogger("LAYOUT");

const normalizeGender = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export default function MainLayout() {
  // 1. Load initial data from cache.
  // If a complete JSON payload exists, use it; otherwise fall back to defaults.
  const [user, setUser] = useState(() => {
    const savedData = resolveLegacyJson({
      key: STORAGE_KEYS.CACHE_USER_DATA,
      legacyKeys: ["cache_userData"],
      fallback: null,
    });
    return savedData || { name: "User", avatar: null };
  });

  const fetchUserData = useCallback(async () => {
    try {
      const token = readAuthToken();
      if (!token) return;

      const backendData = await getProfile();

      const normalizedDob = backendData.userDob || "";

      const completeUserData = {
        ...backendData,
        name: backendData.name || "User",
        username: backendData.username || "user",
        email: backendData.email || "",
        avatar: backendData.avatar || null,
        birthday: normalizedDob,
        userDob: normalizedDob,
        gender: normalizeGender(backendData.gender || ""),
        diaryCount: backendData.diaryCount ?? 0,
      };

      let streakCount = backendData.streak ?? null;
      try {
        const eligibilityData = await getStressEligibility();
        streakCount = eligibilityData?.streak ?? streakCount;
      } catch (error) {
        logger.warn("Failed to fetch eligibility data:", error);
      }

      const enrichedUserData = {
        ...completeUserData,
        streak: streakCount ?? completeUserData.streak ?? 0,
      };

      setUser(enrichedUserData);
      storage.setJson(STORAGE_KEYS.CACHE_USER_DATA, enrichedUserData);
    } catch (error) {
      logger.error("Failed to refresh user data in layout:", error);
      if ([401, 403].includes(error?.status)) {
        clearAuthToken();
        storage.removeItem(STORAGE_KEYS.CACHE_USER_DATA);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    restoreDailyReminderSubscription();

    const handleRefresh = () => {
      fetchUserData();
    };

    window.addEventListener("nostressia:user-update", handleRefresh);
    return () => {
      window.removeEventListener("nostressia:user-update", handleRefresh);
    };
  }, [fetchUserData]);

  return <Outlet context={{ user }} />;
}

// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getProfile } from "../services/authService";
import { getStressEligibility } from "../services/stressService";
import { clearAuthToken, readAuthToken } from "../utils/auth";
import { restoreDailyReminderSubscription } from "../utils/notificationService";
import { createLogger } from "../utils/logger";
import { resolveLegacyJson, storage, STORAGE_KEYS } from "../utils/storage";

const logger = createLogger("LAYOUT");

const resolveStreakCount = (payload) => {
  const candidates = [
    payload?.streakCount,
    payload?.streak,
    payload?.data?.streakCount,
    payload?.data?.streak,
    payload?.meta?.streakCount,
    payload?.meta?.streak,
  ];

  const value = candidates.find((candidate) => Number.isFinite(Number(candidate)));
  return Number.isFinite(Number(value)) ? Number(value) : null;
};

export default function MainLayout() {
  const navigate = useNavigate();
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

      const completeUserData = {
        ...backendData,
        name: backendData.name || backendData.fullName || "User",
        username: backendData.username || "user",
        email: backendData.email || "",
        avatar: backendData.avatar || backendData.profilePicture || null,
        birthday: backendData.birthday || backendData.dob || "",
        gender: backendData.gender || backendData.sex || "",
        diaryCount:
          backendData.diaryCount ??
          backendData.diary_count ??
          backendData.diariesCount ??
          backendData.diaries_count ??
          0,
      };

      let streakCount = resolveStreakCount(backendData);
      try {
        const eligibilityData = await getStressEligibility();
        streakCount = resolveStreakCount(eligibilityData) ?? streakCount;
      } catch (error) {
        const fallbackPayload = error?.payload?.detail ?? error?.payload;
        streakCount = resolveStreakCount(fallbackPayload) ?? streakCount;
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
        navigate("/login", { replace: true });
      }
    }
  }, [navigate]);

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

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

const normalizeGender = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export default function MainLayout() {
  const navigate = useNavigate();
  
  // 1. Load initial data from cache or use Default/Guest data
  const [user, setUser] = useState(() => {
    const savedData = resolveLegacyJson({
      key: STORAGE_KEYS.CACHE_USER_DATA,
      legacyKeys: ["cache_userData"],
      fallback: null,
    });
    // Default fallback ke Guest User agar UI tidak error
    return savedData || { name: "Guest User", avatar: null, streak: 0 };
  });

  const fetchUserData = useCallback(async () => {
    try {
      const token = readAuthToken();
      
      // PERUBAHAN: Jika tidak ada token, jangan return saja, tapi set sebagai Guest
      if (!token) {
        setUser({ name: "Guest User", email: "guest@nostressia.com", avatar: null, streak: 0 });
        return;
      }

      const backendData = await getProfile();

      const normalizedDob =
        backendData.userDob || backendData.user_dob || backendData.birthday || backendData.dob || "";

      const completeUserData = {
        ...backendData,
        name: backendData.name || backendData.fullName || "User",
        username: backendData.username || "user",
        email: backendData.email || "",
        avatar: backendData.avatar || backendData.profilePicture || null,
        birthday: normalizedDob,
        userDob: normalizedDob,
        gender: normalizeGender(backendData.gender || backendData.sex || ""),
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
      
      // PERUBAHAN: Logika redirect dimatikan. 
      // Jika token expired atau error 401, kita biarkan user tetap di halaman sebagai Guest.
      /*
      if ([401, 403].includes(error?.status)) {
        clearAuthToken();
        storage.removeItem(STORAGE_KEYS.CACHE_USER_DATA);
        navigate("/login", { replace: true });
      }
      */
      
      // Fallback ke guest jika terjadi error fetch
      setUser((prev) => prev || { name: "Guest User", avatar: null, streak: 0 });
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
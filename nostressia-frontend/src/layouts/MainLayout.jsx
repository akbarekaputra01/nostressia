// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getProfile } from "../services/authService";
import { getStressEligibility } from "../services/stressService";
import { clearAuthToken, readAuthToken } from "../utils/auth";
import { restoreDailyReminderSubscription } from "../utils/notificationService";

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
    const savedData = localStorage.getItem("cache_userData");
    return savedData ? JSON.parse(savedData) : { name: "User", avatar: null };
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
      localStorage.setItem("cache_userData", JSON.stringify(enrichedUserData));
    } catch (error) {
      console.error("Failed to refresh user data in layout:", error);
      if ([401, 403].includes(error?.status)) {
        clearAuthToken();
        localStorage.removeItem("cache_userData");
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

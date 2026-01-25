// src/layouts/MainLayout.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getProfile } from "../services/authService";
import { getStressEligibility } from "../services/stressService";
import { readAuthToken } from "../utils/auth";

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
  // 1. Ambil data awal dari Cache. 
  // Jika ada data lengkap tersimpan (JSON), pakai itu. Jika tidak, pakai default.
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
        localStorage.removeItem("token");
        localStorage.removeItem("cache_userData");
        navigate("/login", { replace: true });
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();

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

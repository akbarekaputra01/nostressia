// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";
import { fetchGlobalForecast } from "../api/forecastApi";
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = readAuthToken();
        if (!token) return;

        const response = await axios.get(`${BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 2. Data dari Backend
        const backendData = response.data;

        // 3. Normalisasi Data (Jaga-jaga nama field beda)
        const completeUserData = {
          ...backendData,
          // Pastikan field utama selalu ada:
          name:
            backendData.name ||
            backendData.fullName ||
            "User",
          username:
            backendData.username ||
            "user",
          email: backendData.email || "",
          avatar: backendData.avatar || backendData.profilePicture || null,
          birthday:
            backendData.birthday ||
            backendData.dob ||
            "",
          gender: backendData.gender || backendData.sex || "",
        };

        let streakCount = resolveStreakCount(backendData);
        if (streakCount === null) {
          try {
            const forecastData = await fetchGlobalForecast({ token });
            streakCount = resolveStreakCount(forecastData);
          } catch (error) {
            streakCount = resolveStreakCount(error?.payload);
          }
        }

        const enrichedUserData = {
          ...completeUserData,
          streak: streakCount ?? completeUserData.streak ?? 0,
        };

        // 4. Update State & SIMPAN SEMUA KE CACHE (JSON)
        setUser(enrichedUserData);
        localStorage.setItem("cache_userData", JSON.stringify(enrichedUserData));

      } catch (error) {
        console.error("Gagal update user data di layout:", error);
        if ([401, 403].includes(error?.response?.status)) {
          localStorage.removeItem("token");
          localStorage.removeItem("cache_userData");
          navigate("/login", { replace: true });
        }
      }
    };

    fetchUserData();
  }, []);

  return <Outlet context={{ user }} />;
}

// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../api/config";

export default function MainLayout() {
  // 1. Ambil data awal dari Cache. 
  // Jika ada data lengkap tersimpan (JSON), pakai itu. Jika tidak, pakai default.
  const [user, setUser] = useState(() => {
    const savedData = localStorage.getItem("cache_userData");
    return savedData ? JSON.parse(savedData) : { name: "User", avatar: null };
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
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

        // 4. Update State & SIMPAN SEMUA KE CACHE (JSON)
        setUser(completeUserData);
        localStorage.setItem("cache_userData", JSON.stringify(completeUserData));

      } catch (error) {
        console.error("Gagal update user data di layout:", error);
      }
    };

    fetchUserData();
  }, []);

  return <Outlet context={{ user }} />;
}

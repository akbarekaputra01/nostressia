// src/router/index.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { readAuthToken } from "../utils/auth";

// 1. IMPORT LAYOUT (Pastikan path-nya sesuai dengan lokasi file MainLayout Anda)
import MainLayout from "../layouts/MainLayout"; 

// Import User Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Tips from "../pages/Tips/Tips";
import Motivation from "../pages/Motivation/Motivation";
import Diary from "../pages/Diary/Diary";
import Analytics from "../pages/Analytics/Analytics";
import Profile from "../pages/Profile/Profile"; 
import Login from "../pages/Login/Login"; 
import LandingPage from "../pages/LandingPage/LandingPage";

// Import Admin Pages
import AdminPage from "../pages/Admin/AdminPage";
import AdminLogin from "../pages/Admin/AdminLogin";

// Kode AdminRoute (Biarkan tetap seperti ini)
const AdminRoute = () => {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

const ProtectedRoute = () => {
  const token = readAuthToken();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- 1. ROUTE PUBLIK (Tanpa Navbar User) --- */}
        {/* Route redirect lama dihapus agar "/" tidak melempar ke login */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} /> 

        {/* --- 2. ROUTE USER (DILINDUNGI MAINLAYOUT) --- */}
        {/* Semua halaman di dalam sini akan punya Navbar & Data User otomatis */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/motivation" element={<Motivation />} />
              <Route path="/diary" element={<Diary />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} /> 
          </Route>
        </Route>

        {/* --- 3. ROUTE ADMIN (Terpisah) --- */}
        <Route path="/adm1n" element={<AdminPage skipAuth={true} />} /> 
        <Route path="/admin/login" element={<AdminLogin />} /> 

        <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
        </Route>
      
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

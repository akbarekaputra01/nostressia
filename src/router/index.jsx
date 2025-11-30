// src/router/index.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Tips from "../pages/Tips/Tips";
import Motivation from "../pages/Motivation/Motivation";
import Diary from "../pages/Diary/Diary";
import Analytics from "../pages/Analytics/Analytics";
import Profile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";

// Import Admin Pages
import AdminPage from "../pages/Admin/AdminPage";
import AdminLogin from "../pages/Admin/AdminLogin";

// --- 1. KOMPONEN PENJAGA PINTU (PROTECTED ROUTE) ---
const AdminRoute = () => {
  const isAuthenticated = !!localStorage.getItem("adminToken");
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTE UTAMA KEMBALI KE DASHBOARD --- */}
        <Route path="/" element={<Dashboard />} />

        {/* Rute Halaman Lain */}
        <Route path="/tips" element={<Tips />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />

        {/* --- RUTE ADMIN --- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

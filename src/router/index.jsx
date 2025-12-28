// src/router/index.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"; // Tambah Navigate
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

// ... (Kode AdminRoute tetap sama) ...
const AdminRoute = () => {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- PENGATURAN UTAMA --- */}
        {/* 1. Jika buka link utama '/', otomatis lempar ke '/login' */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 2. Halaman Login di '/login' */}
        <Route path="/login" element={<Login />} /> 

        {/* 3. Dashboard dipindah ke '/dashboard' */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* --- RUTE USER LAINNYA --- */}
        <Route path="/tips" element={<Tips />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/diary" element={<Diary />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} /> 
        
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
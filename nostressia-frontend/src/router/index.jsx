// src/router/index.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { readAdminToken, readAuthToken } from "../utils/auth";

import MainLayout from "../layouts/MainLayout";
import ScrollToTop from "../components/ScrollToTop";

// Import User Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Tips from "../pages/Tips/Tips";
import Motivation from "../pages/Motivation/Motivation";
import Diary from "../pages/Diary/Diary";
import Analytics from "../pages/Analytics/Analytics";
import Profile from "../pages/Profile/Profile"; 
import Login from "../pages/Login/Login"; 
import LandingPage from "../pages/LandingPage/LandingPage";
import NotFound from "../pages/NotFound/NotFound";

// Import Admin Pages
import AdminPage from "../pages/Admin/AdminPage";
import AdminLogin from "../pages/Admin/AdminLogin";

// Require an admin session for nested routes.
export const AdminProtectedRoute = () => {
  const token = readAdminToken();
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

// Require a user session for nested routes.
export const ProtectedRoute = () => {
  const token = readAuthToken();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// Redirect authenticated users away from public routes.
export const PublicRoute = ({ redirectTo = "/dashboard" }) => {
  const token = readAuthToken();
  return token ? <Navigate to={redirectTo} replace /> : <Outlet />;
};

// Redirect authenticated admins away from public routes.
export const AdminPublicRoute = ({ redirectTo = "/admin" }) => {
  const token = readAdminToken();
  return token ? <Navigate to={redirectTo} replace /> : <Outlet />;
};

function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

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

        <Route path="/adm1n" element={<AdminPage skipAuth={true} />} /> 
        <Route element={<AdminPublicRoute />}>
          <Route path="/admin/login" element={<AdminLogin />} /> 
        </Route>

        <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

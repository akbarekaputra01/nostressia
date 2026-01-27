import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft } from "lucide-react";
import { adminLogin } from "../../services/authService";
// Import Logo Nostressia
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const focusFirstEmptyField = (form) => {
    const requiredFields = Array.from(
      form.querySelectorAll("[data-required='true']")
    );
    const emptyField = requiredFields.find((field) => !field.value);
    if (emptyField) {
      emptyField.focus();
      return true;
    }
    return false;
  };

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter") return;
    if (focusFirstEmptyField(event.currentTarget)) {
      event.preventDefault();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // --- coba login via API ---
      const data = await adminLogin(formData);

      // Jika berhasil login via API, simpan token & data
      localStorage.setItem("adminToken", data.accessToken || data.access_token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));
      localStorage.setItem("adminAuth", "true");

      navigate("/admin");
    } 
    catch (err) {
      console.error("Login API error:", err);

      // ✅ Hanya jika API mati, baru cek username/password offline
      if (
        err.message.includes("Failed to fetch") ||  // fetch gagal
        err.message.includes("NetworkError") ||     // network error
        err.message.includes("timeout")             // atau timeout
      ) {
        if (formData.username === "admin" && formData.password === "admin123") {
          const offlineAdmin = {
            id: 0,
            name: "Offline Admin",
            username: "admin",
            email: "admin@offline.local"
          };

          localStorage.setItem("adminToken", "offline-token");
          localStorage.setItem("adminData", JSON.stringify(offlineAdmin));
          localStorage.setItem("adminAuth", "true");

          console.warn("⚠️ API mati — menggunakan mode offline admin.");
          navigate("/admin");
          return;
        }
      }

      // Jika bukan login offline, tampilkan error biasa
      setError(err.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 font-sans text-text-primary">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
        
        {/* Header dengan Gradient Pastel Oren-Biru */}
        <div className="bg-gradient-to-br from-orange-200 via-orange-100 to-blue-200 dark:from-orange-900/40 dark:via-slate-900 dark:to-blue-900/40 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/40 dark:bg-slate-900/40 opacity-50 transform -rotate-6 scale-125"></div>
            <div className="relative z-10 flex flex-col items-center">
                <img 
                    src={LogoNostressia} 
                    alt="Nostressia Logo" 
                    className="h-24 w-auto object-contain mb-2 drop-shadow-sm hover:scale-105 transition-transform duration-300" 
                />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Admin Portal</h2>
                <p className="text-gray-600 dark:text-slate-300 text-sm mt-1 font-medium">Nostressia Management System</p>
            </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} onKeyDown={handleFormKeyDown} className="space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-200 text-sm p-3 rounded-lg border border-red-100 dark:border-red-500/30 text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-4">
                {/* Username Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-300 uppercase mb-1 ml-1">Username</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Enter admin username"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900 dark:text-slate-100"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            data-required="true"
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-300 uppercase mb-1 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-gray-900 dark:text-slate-100"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            data-required="true"
                        />
                    </div>
                </div>
            </div>

            {/* Tombol dengan Gradasi Biru-Oren */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition-all transform flex justify-center items-center ${
                  isLoading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-500 to-orange-400 hover:from-blue-600 hover:to-orange-500 hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                  "Enter Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
                <ArrowLeft size={16} /> Back to User Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

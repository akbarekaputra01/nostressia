import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft } from "lucide-react";

// Import Logo Nostressia
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // Jika fetch tidak bisa terhubung → otomatis lompat ke catch
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Username atau Password salah!");
      }

      // 🔐 Simpan token hasil dari server
      localStorage.setItem("adminToken", data.access_token);
      localStorage.setItem("adminData", JSON.stringify(data.admin));
      localStorage.setItem("adminAuth", "true");

      navigate("/admin");
    } 
    catch (err) {

      // === Fallback jika API mati ===
      if (
        formData.username === "admin" &&
        formData.password === "admin123"
      ) {
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

      // Jika bukan admin offline → error biasa
      setError(err.message || "Gagal login, coba lagi.");
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header dengan Gradient Pastel Oren-Biru */}
        <div className="bg-gradient-to-br from-orange-200 via-orange-100 to-blue-200 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/40 opacity-50 transform -rotate-6 scale-125"></div>
            <div className="relative z-10 flex flex-col items-center">
                <img 
                    src={LogoNostressia} 
                    alt="Nostressia Logo" 
                    className="h-24 w-auto object-contain mb-2 drop-shadow-sm hover:scale-105 transition-transform duration-300" 
                />
                <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
                <p className="text-gray-600 text-sm mt-1 font-medium">Nostressia Management System</p>
            </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-4">
                {/* Username Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Username</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Masukan username admin"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  "Masuk Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft size={16} /> Kembali ke Beranda User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

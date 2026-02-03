import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft } from "lucide-react";
import { adminLogin } from "../../services/authService";
import {
  hasAdminSession,
  isAuthTokenValid,
  persistAdminProfile,
  persistAdminToken,
} from "../../utils/auth";
import { createLogger } from "../../utils/logger";
import PageMeta from "../../components/PageMeta";
// Nostressia logo asset.
import LogoNostressia from "../../assets/images/Logo-Nostressia.png";

const logger = createLogger("ADMIN_LOGIN");

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hasAdminSession()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const focusFirstEmptyField = (form) => {
    const requiredFields = Array.from(form.querySelectorAll("[data-required='true']"));
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
      // Attempt the primary admin login flow.
      const data = await adminLogin(formData);

      // Persist the admin session using canonical storage keys.
      const token = data?.accessToken;
      if (!isAuthTokenValid(token)) {
        setError("Login succeeded, but the token is invalid.");
        setIsLoading(false);
        return;
      }
      persistAdminToken(token);
      persistAdminProfile(data.admin);

      navigate("/admin");
    } catch (err) {
      logger.error("Admin login API error:", err);

      // Provide a clearer message when the API is unreachable.
      if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("timeout")
      ) {
        setError("Unable to reach the admin service. Please check your connection and try again.");
        setIsLoading(false);
        return;
      }

      setError(err.message || "Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 font-sans text-text-primary">
      <PageMeta
        title="Admin Login"
        description="Access the Nostressia admin portal to manage users, tips, and motivations."
        noindex
      />
      <div className="max-w-md w-full bg-surface-elevated glass-panel dark:bg-surface rounded-2xl shadow-xl overflow-hidden border border-border-subtle dark:border-border glass-panel-strong">
        {/* Header with a pastel orange-blue gradient */}
        <div className="bg-linear-to-br from-brand-warning/20 via-brand-warning/10 to-brand-primary/20 dark:from-brand-warning/20 dark:via-surface/80 dark:to-brand-primary/20 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-surface-elevated/40 glass-panel dark:bg-surface/40 opacity-50 transform -rotate-6 scale-125"></div>
          <div className="relative z-10 flex flex-col items-center">
            <img
              src={LogoNostressia}
              alt="Nostressia Logo"
              className="h-24 w-auto object-contain mb-2 drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
            <h2 className="text-2xl font-bold text-text-primary dark:text-text-primary">
              Admin Portal
            </h2>
            <p className="text-text-secondary dark:text-text-muted text-sm mt-1 font-medium">
              Nostressia Management System
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} onKeyDown={handleFormKeyDown} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-brand-accent/10 dark:bg-brand-accent/20 text-brand-accent dark:text-brand-accent text-sm p-3 rounded-lg border border-brand-accent/20 dark:border-brand-accent/30 text-center animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-text-muted uppercase mb-1 ml-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 z-2 -translate-y-1/2 text-text-muted dark:text-text-muted w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Enter admin username"
                    className="w-full pl-12 pr-4 py-3 glass-input border border-border rounded-xl focus:bg-surface-elevated glass-panel focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-text-primary"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    data-required="true"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-text-muted uppercase mb-1 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 z-2 -translate-y-1/2 text-text-muted dark:text-text-muted w-5 h-5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 glass-input border border-border rounded-xl focus:bg-surface-elevated glass-panel focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all text-text-primary"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    data-required="true"
                  />
                </div>
              </div>
            </div>

            {/* Button with a blue-orange gradient */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition-all transform flex justify-center items-center ${
                isLoading
                  ? "bg-surface-muted text-text-muted cursor-not-allowed"
                  : "bg-linear-to-r from-brand-primary to-brand-accent hover:from-brand-primary/90 hover:to-brand-accent/90 hover:-translate-y-0.5"
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Enter Dashboard"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-text-muted dark:text-text-muted hover:text-text-secondary dark:hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={16} /> Back to User Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Router from "./router";
import { applyTheme, getStoredTheme } from "./utils/theme";

function App() {
  const authKey = "nostressia_internal_access";
  const [isAuthorized, setIsAuthorized] = useState(
    () => localStorage.getItem(authKey) === "granted"
  );
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      localStorage.setItem(authKey, "granted");
    }
  }, [isAuthorized]);

  useEffect(() => {
    applyTheme(getStoredTheme());

    const handleThemeChange = (event) => {
      const theme = event?.detail?.theme || getStoredTheme();
      applyTheme(theme);
    };

    window.addEventListener("nostressia:theme-change", handleThemeChange);
    return () => window.removeEventListener("nostressia:theme-change", handleThemeChange);
  }, []);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");

    const internalUser = import.meta.env.VITE_INTERNAL_USER ?? "nostressia";
    const internalPass = import.meta.env.VITE_INTERNAL_PASS ?? "nostressia";
    const { username, password } = credentials;

    if (username === internalUser && password === internalPass) {
      localStorage.setItem(authKey, "granted");
      setIsAuthorized(true);
      return;
    }

    setErrorMessage("Access denied. Please check the internal credentials.");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-primary)] px-6 text-[var(--text-primary)]">
        <div className="w-full max-w-sm text-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg">
          <div className="mb-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-slate-200">
            Internal access required. Please enter the credentials to continue.
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Internal Access</h1>
          <p className="text-sm text-gray-500 dark:text-slate-300 mt-2">
            This environment is restricted to internal users only.
          </p>
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            className="mt-6 space-y-3 text-left"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Username</label>
              <input
                type="text"
                value={credentials.username}
                data-required="true"
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:border-gray-400 dark:focus:border-slate-500 focus:outline-none"
                placeholder="Enter internal username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Password</label>
              <input
                type="password"
                value={credentials.password}
                data-required="true"
                onChange={(event) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:border-gray-400 dark:focus:border-slate-500 focus:outline-none"
                placeholder="Enter internal password"
              />
            </div>
            {errorMessage && (
              <p className="text-xs font-semibold text-red-500">{errorMessage}</p>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Router />
  );
}

export default App;

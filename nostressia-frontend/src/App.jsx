import React, { useEffect, useState } from "react";
import Router from "./router";

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
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center bg-white p-6">
          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
            Internal access required. Please enter the credentials to continue.
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Internal Access</h1>
          <p className="text-sm text-gray-500 mt-2">
            This environment is restricted to internal users only.
          </p>
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            className="mt-6 space-y-3 text-left"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Username</label>
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="Enter internal username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Password</label>
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
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="Enter internal password"
              />
            </div>
            {errorMessage && (
              <p className="text-xs font-semibold text-red-500">{errorMessage}</p>
            )}
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
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

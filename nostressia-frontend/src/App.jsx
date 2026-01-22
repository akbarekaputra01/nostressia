import React, { useEffect, useState } from "react";
import Router from "./router";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const internalUser = import.meta.env.VITE_INTERNAL_USER ?? "nostressia";
    const internalPass = import.meta.env.VITE_INTERNAL_PASS ?? "nostressia";
    const username = window.prompt("Masukkan username untuk akses internal:");
    const password = window.prompt("Masukkan password untuk akses internal:");

    if (username === internalUser && password === internalPass) {
      setIsAuthorized(true);
      return;
    }

    alert("Akses ditolak. Project ini hanya untuk internal.");
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-gray-800">Akses Internal</h1>
          <p className="text-sm text-gray-500 mt-2">
            Project ini dibatasi untuk internal. Silakan hubungi tim terkait untuk akses.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center justify-center px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router />
  );
}

export default App;

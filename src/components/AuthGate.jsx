import React, { useMemo, useState } from "react";

const STORAGE_KEY = "nostressia.basicAuth";

const AuthGate = ({ children }) => {
  const gateEnabledRaw = import.meta.env.VITE_GATE_ENABLED ?? "true";
  const gateEnabled = gateEnabledRaw.toLowerCase() !== "false";
  const expectedUsername = import.meta.env.VITE_GATE_USERNAME ?? "";
  const expectedPassword = import.meta.env.VITE_GATE_PASSWORD ?? "";
  const hasCredentials = Boolean(expectedUsername || expectedPassword);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const helperText = useMemo(() => {
    if (!hasCredentials) {
      return "Env VITE_GATE_USERNAME dan VITE_GATE_PASSWORD belum diset.";
    }
    return "Masukkan username dan password untuk melanjutkan.";
  }, [hasCredentials]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!hasCredentials) {
      setError("Konfigurasi env belum tersedia.");
      return;
    }

    if (username === expectedUsername && password === expectedPassword) {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsAuthenticated(true);
      setError("");
      return;
    }

    setError("Username atau password salah.");
  };

  if (!gateEnabled || isAuthenticated) {
    return children;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "16px", fontSize: "24px", color: "#111827" }}>
          Protected Access
        </h1>
        <p style={{ marginBottom: "24px", color: "#6b7280" }}>{helperText}</p>
        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: "12px", textAlign: "left" }}
        >
          <label style={{ display: "grid", gap: "6px", color: "#111827" }}>
            Username
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              autoComplete="username"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "6px", color: "#111827" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            />
          </label>
          {error ? (
            <span style={{ color: "#dc2626", fontSize: "14px" }}>{error}</span>
          ) : null}
          <button
            type="submit"
            style={{
              marginTop: "8px",
              backgroundColor: "#111827",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthGate;

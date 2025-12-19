// export const BASE_URL = "https://nostressia-backend.vercel.app/api";
// export const BASE_URL = "http://127.0.0.1:8000/api";
// Pilih environment: 'local' atau 'deploy'
const ENV = "deploy"; // ganti ke 'local' kalau mau pakai backend lokal

export const BASE_URL =
  ENV === "local"
    ? "http://127.0.0.1:8000/api"
    : "https://nostressia-backend.vercel.app/api";

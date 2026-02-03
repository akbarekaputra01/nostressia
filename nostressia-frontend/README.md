# Nostressia Frontend

## Overview
Nostressia Frontend adalah aplikasi React + Vite yang menyediakan pengalaman pengguna (dashboard stres, jurnal harian, tips kesehatan mental, motivasi) dan admin panel. Fokus utama frontend adalah pengalaman yang responsif, aman, serta konsisten dengan kontrak API backend.

## Tech Stack
- React 19 + React Router
- Vite
- Tailwind CSS
- Axios
- Vitest + React Testing Library

## Project Structure
```
src/
  api/           # Axios client + helpers API
  components/    # Reusable UI components
  layouts/       # Layout wrappers (auth-aware)
  pages/         # Route-level UI
  router/        # Routing configuration + guards
  services/      # Service layer (API wrappers)
  theme/         # Theme provider + toggles
  utils/         # Helpers (auth, storage, notifications, logger)
  __tests__/     # Vitest test suites
public/
  sitemap.xml    # Sitemap static
  robots.txt     # Robots policy
```

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```

## Environment Variables
| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL backend API (contoh: `https://api.example.com`). |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key untuk push notifications. |
| `VITE_LOG_LEVEL` | Level logging (`debug`, `info`, `warn`, `error`). |

## Backend Healthcheck
Pastikan backend hidup sebelum menjalankan UI:
```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

## Available Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server. |
| `npm run build` | Build production bundle. |
| `npm run preview` | Preview production build. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Run Vitest with coverage. |

## Testing Guide
- Semua test berada di `src/__tests__/`.
- Jalankan seluruh test:
  ```bash
  npm run test
  ```
- Coverage report:
  ```bash
  npm run test:coverage
  ```

## Build & Deploy
1. Build bundle:
   ```bash
   npm run build
   ```
2. Preview lokal:
   ```bash
   npm run preview
   ```
3. Deploy:
   - Pastikan `public/sitemap.xml` dan `public/robots.txt` sudah disesuaikan dengan domain produksi.
   - Update environment variables sesuai environment target.

## Troubleshooting
- **Blank page saat login**: pastikan `VITE_API_BASE_URL` mengarah ke backend yang aktif.
- **Push notification gagal**: pastikan `VITE_VAPID_PUBLIC_KEY` terisi dan domain berjalan di HTTPS.
- **Admin login loop**: bersihkan storage browser dan cek token admin di backend.

## Notes
- Semua akses storage diatur melalui `src/utils/storage.js` agar konsisten dan aman.
- Metadata SEO diatur per halaman melalui `src/components/PageMeta.jsx`.

# Nostressia Frontend

Frontend web **Nostressia** dibangun menggunakan **React + Vite** untuk menghadirkan pengalaman pengguna dalam memantau kondisi stres, mengisi diary, melihat insight, dan menerima notifikasi.

## Fitur Utama

- Single Page Application berbasis React.
- Routing halaman menggunakan `react-router-dom`.
- Manajemen state client dengan `zustand`.
- Integrasi API backend melalui Axios.
- Form handling + validasi (`react-hook-form`, `zod`).
- Visualisasi data (Recharts) dan animasi UI.
- Dukungan web push notification.

## Teknologi

- Node.js 18+ (disarankan LTS)
- React 19
- Vite
- Tailwind CSS
- Vitest + Testing Library
- ESLint + Prettier

Catatan konsistensi environment repo: backend dan machine learning menggunakan Python **3.10.19** pada Linux/macOS/Windows.

## Struktur Direktori (Ringkas)

```text
nostressia-frontend/
├── public/            # Asset statis dan service worker notification
├── src/
│   ├── api/           # Konfigurasi request + endpoint API
│   ├── components/    # Komponen UI reusable
│   ├── layouts/       # Layout halaman
│   ├── pages/         # Halaman utama aplikasi
│   ├── router/        # Definisi routing
│   ├── store/         # State management
│   ├── theme/         # Theme provider
│   └── utils/         # Helper utilities
├── package.json
└── vite.config.js
```

## Setup Lokal

1. Masuk ke folder frontend:

   ```bash
   cd nostressia-frontend
   ```

2. Install dependency (pilih sesuai package manager):

   ```bash
   # npm
   npm install

   # atau yarn
   yarn install

   # atau pnpm
   pnpm install
   ```

3. Salin file env:

   ```bash
   # Linux/macOS
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env

   # Windows CMD
   copy .env.example .env
   ```

4. Sesuaikan variabel pada `.env`:
   - `VITE_API_BASE_URL` → URL backend
   - `VITE_VAPID_PUBLIC_KEY` → public key notifikasi web
   - `VITE_LOG_LEVEL` → level logging client

## Menjalankan Aplikasi

Mode development:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview hasil build:

```bash
npm run preview
```

## Testing & Quality Check

Sebelum menjalankan test/lint/format, pastikan dependency sudah di-install:

```bash
# pilih salah satu
npm install
# atau yarn install
# atau pnpm install
```

Jalankan semua test:

```bash
npm run test
```

Unit test:

```bash
npm run test:unit
```

Integration test:

```bash
npm run test:integration
```

Linting:

```bash
npm run lint
```

Cek format:

```bash
npm run format
```

## Deployment

Berkas deploy yang tersedia:

- `netlify.toml`
- `vercel.json`

Pastikan environment variable production sudah diset dengan benar sebelum deploy.

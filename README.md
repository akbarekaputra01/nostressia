---
title: nostressia
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Nostressia

Nostressia adalah platform pemantauan stres harian yang menggabungkan aplikasi web (frontend), API backend, dan model machine learning untuk prediksi stres. Repo ini berisi tiga proyek utama yang saling terhubung dan siap dipakai untuk kebutuhan akademik maupun demo end-to-end.

## Struktur Repo

- `nostressia-frontend/` — Aplikasi web (Vite + React).
- `nostressia-backend/` — API FastAPI + layanan notifikasi & integrasi ML.
- `nostressia-machine-learning/` — Eksperimen data, model, dan pipeline ML.
- `docs/` — Dokumentasi teknis (arsitektur, API spec, DB, logging, testing).

## Frontend (React + Vite)

**Lokasi:** `nostressia-frontend/`

**Teknologi:** React, Vite, TailwindCSS, Zustand, React Router, Vitest.

**Halaman utama:**
- Dashboard: ringkasan stres, tips, dan motivasi.
- Profile: profil pengguna, ringkasan stres, dan preferensi.
- Diary: jurnal harian.
- Tips & Motivation: konten edukasi dan motivasi.
- Admin: manajemen user, diary, tips, dan motivation.

**Entry point:** `index.html` dan `src/main.jsx`.

## Backend (FastAPI)

**Lokasi:** `nostressia-backend/`

**Teknologi:** FastAPI, SQLAlchemy, MySQL, APScheduler, JWT.

**Fitur utama:**
- Autentikasi & profile user.
- CRUD diary dan tips.
- Integrasi prediksi ML.
- Push notification scheduler.

**Dokumentasi API:**
- `/docs` → Swagger UI
- `/openapi.json`

## Machine Learning

**Lokasi:** `nostressia-machine-learning/`

**Teknologi:** pandas, scikit-learn, joblib.

**Fokus:**
- Imputasi data, validasi schema, dan forecasting stres.
- Artifacts model disimpan via `.joblib`.

## Setup Singkat

### Frontend

```bash
cd nostressia-frontend
npm install
npm run dev
```

### Backend

```bash
cd nostressia-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Machine Learning

```bash
cd nostressia-machine-learning
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment Variables

> Gunakan contoh `.env.example` sebagai acuan.

### Frontend (`nostressia-frontend/.env`)
```
VITE_API_BASE_URL=
VITE_INTERNAL_USER=
VITE_INTERNAL_PASS=
VITE_VAPID_PUBLIC_KEY=
VITE_AZURE_BLOB_SAS_URL=
VITE_AZURE_BLOB_CONTAINER=
VITE_LOG_LEVEL=
```

### Backend (`nostressia-backend/.env`)
```
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=
DATABASE_URL=
BREVO_API_KEY=
JWT_SECRET=
JWT_ALGORITHM=
ACCESS_TOKEN_EXPIRE_MINUTES=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_ACCOUNT_NAME=
AZURE_STORAGE_CONTAINER_NAME=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Testing

```bash
cd nostressia-frontend && npm run test
cd ../nostressia-backend && pytest
cd ../nostressia-machine-learning && pytest
```

## Dokumentasi Teknis
- Arsitektur: `docs/architecture.md`
- API Spec: `docs/api-spec.md`
- Database: `docs/database.md`
- Logging Guidelines: `docs/logging-guidelines.md`
- Testing Strategy: `docs/testing-strategy.md`

## Deployment Notes (Ringkas)
- Pastikan konfigurasi environment tersedia di platform target (Vercel/Docker/VM).
- Update `public/sitemap.xml` dan `public/robots.txt` pada frontend sesuai domain produksi.
- Jalankan test suite sebelum rilis.

## Troubleshooting
- **Frontend gagal fetch**: cek `VITE_API_BASE_URL` dan pastikan backend berjalan.
- **Backend startup gagal**: pastikan variabel `DB_*`, `JWT_SECRET`, dan `BREVO_API_KEY` terisi.
- **ML artifacts tidak terbaca**: pastikan file `.joblib` tersedia sesuai path di repo.

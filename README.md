---
title: nostressia
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Nostressia

Nostressia adalah platform pemantauan stres harian yang menggabungkan aplikasi web (frontend), API backend, dan model machine learning untuk prediksi stres. Repo ini berisi tiga proyek utama yang saling terhubung.

## Struktur Repo

- `nostressia-frontend/` — Aplikasi web (Vite + React).
- `nostressia-backend/` — API FastAPI + layanan notifikasi & integrasi ML.
- `nostressia-machine-learning/` — Eksperimen data, model, dan pipeline ML.

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

## Testing

```bash
cd nostressia-frontend && npm run test
cd ../nostressia-backend && pytest
cd ../nostressia-machine-learning && pytest
```

## Environment Variables (Backend)

Set di `.env` atau environment sistem:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `HF_HOME` (opsional)
- Lainnya sesuai konfigurasi di backend.

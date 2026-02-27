---
title: Nostressia Backend
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
sdk_version: "latest"
python_version: "3.10"
app_file: main.py
pinned: false
---

# Nostressia Backend

Backend untuk aplikasi **Nostressia** dibangun dengan **FastAPI** dan berfungsi sebagai pusat API, autentikasi, pengelolaan data stres/diary, notifikasi, serta integrasi model machine learning.

## Fitur Utama

- REST API berbasis FastAPI.
- Autentikasi pengguna dan admin (JWT).
- CRUD data stres, diary, profil, motivasi, tips, bookmark, dan analytics.
- Integrasi model ML (`current_stress`, `global_forecast`, `personalized_forecast`).
- Dukungan push notification dan penyimpanan blob Azure.
- Endpoint observability/metrics.

## Teknologi

- Python 3.10.19 (gunakan versi yang sama pada Linux/macOS/Windows)
- FastAPI + Uvicorn
- SQLAlchemy + MySQL
- Scikit-learn/Joblib (inference model)
- APScheduler, pywebpush, Azure Blob SDK

## Struktur Direktori (Ringkas)

```text
nostressia-backend/
├── app/
│   ├── api/           # Router utama API
│   ├── core/          # Konfigurasi, database, logging
│   ├── models/        # SQLAlchemy models
│   ├── routes/        # Endpoint per domain
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   └── utils/         # Helper (JWT, hashing, response, dsb.)
├── tests/             # Unit tests
├── main.py            # Entry point Uvicorn
└── requirements*.txt
```

## Setup Lokal

1. Masuk ke folder backend:

   ```bash
   cd nostressia-backend
   ```

2. Buat virtual environment dan aktifkan (pilih sesuai terminal):

   ```bash
   # Linux/macOS (bash/zsh)
   python3.10 -m venv .venv
   source .venv/bin/activate

   # Windows Git Bash
   py -3.10 -m venv .venv
   source .venv/Scripts/activate

   # Windows PowerShell
   py -3.10 -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Windows Command Prompt (CMD)
   py -3.10 -m venv .venv
   .venv\Scripts\activate.bat
   ```

3. Install dependency:

   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

4. Salin konfigurasi environment:

   ```bash
   # Linux/macOS
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env

   # Windows CMD
   copy .env.example .env
   ```

5. Isi variabel penting di `.env`:
   - `DATABASE_URL` atau `DB_*`
   - `JWT_SECRET`
   - `BREVO_API_KEY` (jika email dipakai)
   - kredensial Azure (`AZURE_STORAGE_*`)
   - VAPID key (`VAPID_*`) untuk web push

## Menjalankan Aplikasi

```bash
python main.py
```

Server default berjalan di `http://127.0.0.1:8000` (tanpa auto-reload).

Opsional (mode development dengan auto-reload):

```bash
# Linux/macOS
UVICORN_RELOAD=true python main.py

# Windows PowerShell
$env:UVICORN_RELOAD="true"; python main.py

# Windows CMD
set UVICORN_RELOAD=true && python main.py
```

## Menjalankan Test

Pastikan virtual environment aktif dan dependency terpasang sebelum test:

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

```bash
pytest
```

Opsional dengan coverage:

```bash
pytest --cov=app --cov-report=term-missing
```

## Linting & Formatting

```bash
ruff check .
black .
isort .
```

## Dokumen API

- OpenAPI JSON tersedia pada file `openapi.json`.
- Saat server aktif, dokumentasi interaktif FastAPI umumnya ada di:
  - `/docs`
  - `/redoc`

## Deployment

Repository ini sudah menyediakan beberapa berkas deployment:

- `Dockerfile`
- `vercel.json`

Silakan sesuaikan env production (database, secret, storage, notification key) sebelum deploy.

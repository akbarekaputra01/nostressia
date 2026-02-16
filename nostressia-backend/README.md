---
title: nostressia-backend
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Nostressia Backend (FastAPI)

## Overview
Nostressia Backend adalah layanan FastAPI yang menangani autentikasi pengguna/admin, diary, motivasi, tips kesehatan mental, stress tracking + insight, serta integrasi notifikasi push dan Azure Blob Storage untuk upload avatar. Backend ini mengikuti kontrak frontend, memiliki error response konsisten, dan menggunakan pendekatan fail-fast untuk validasi environment.

## Arsitektur & Struktur Folder
```
nostressia-backend/
├── app/
│   ├── api/              # API router utama
│   ├── core/             # konfigurasi & database
│   ├── models/           # SQLAlchemy models
│   ├── routes/           # endpoint FastAPI
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # service layer
│   └── utils/            # helper (JWT, hashing, response, azure sas)
├── tests/                # unit + route tests
├── main.py               # entrypoint
└── .env.example          # contoh konfigurasi environment
```

## Setup Environment
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Salin file environment:
   ```bash
   cp .env.example .env
   ```
3. Isi `.env` dengan kredensial yang sesuai.

**Python requirement:** gunakan Python 3.10 agar kompatibel dengan dependency backend dan pipeline ML.

### Environment Variables (ringkas)
**Wajib (aplikasi akan fail-fast jika tidak ada):**
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` (wajib jika `DATABASE_URL` tidak diisi)
- `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` (`JWT_SECRET` minimal 8 chars dan bukan placeholder default)
- `LOG_LEVEL` (opsional, default `INFO`)

**Opsional (fitur terkait hanya aktif jika ada):**
- `BREVO_API_KEY` (opsional; endpoint email OTP/reset tetap mengembalikan error terkontrol jika key tidak diisi)
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_CONTAINER`, `AZURE_STORAGE_CONTAINER_NAME`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `INTERNAL_TOKEN` (untuk endpoint training data internal)
- `DATABASE_URL` (override konfigurasi DB terpisah; jika diisi maka `DB_*` tidak wajib)

## Menjalankan Server
```bash
uvicorn app.main:app --reload
```

### Logging
Gunakan `LOG_LEVEL` untuk mengatur tingkat log (`DEBUG`, `INFO`, `WARNING`, `ERROR`). Log akan diformat konsisten agar mudah ditelusuri tanpa terlalu noisy.

## Endpoint Utama (contoh)
> Semua endpoint bisnis memakai prefix `/api`.

### Root & Health Endpoints
Endpoint ini **tanpa prefix `/api`** untuk kebutuhan monitoring/healthcheck.

- `GET /`
  ```bash
  curl http://localhost:8000/
  ```
- `GET /health`
  ```bash
  curl http://localhost:8000/health
  ```

### Auth & User
- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/login`
- `POST /api/auth/token`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `POST /api/auth/verify-current-password`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password-verify`
- `POST /api/auth/reset-password-confirm`

### Admin
- `POST /api/auth/admin/login`
- `GET /api/admin/users/`
- `GET /api/admin/users/{user_id}`
- `PUT /api/admin/users/{user_id}`
- `DELETE /api/admin/users/{user_id}`
- `GET /api/admin/diaries/`
- `DELETE /api/admin/diaries/{diary_id}`

### Diary & Motivasi
- `POST /api/diary/`
- `GET /api/diary/`
- `GET /api/diary/{id}`
- `PUT /api/diary/{id}`
- `GET /api/motivations/`
- `POST /api/motivations/`
- `DELETE /api/motivations/{id}`

### Stress Insight & Log
- `POST /api/stress/current`
- `GET /api/stress/forecast`
- `POST /api/stress-levels/`
- `POST /api/stress-levels/restore`
- `GET /api/stress-levels/my-logs`
- `GET /api/stress-levels/eligibility`

### Tips & Bookmark
- `GET /api/tips/categories`
- `POST /api/tips/categories`
- `DELETE /api/tips/categories/{id}`
- `GET /api/tips/`
- `GET /api/tips/by-category/{id}`
- `POST /api/tips/`
- `PUT /api/tips/{id}`
- `DELETE /api/tips/{id}`
- `POST /api/bookmarks/{motivation_id}`
- `GET /api/bookmarks/me`
- `DELETE /api/bookmarks/{motivation_id}`

### Notifications
- `POST /api/notifications/subscribe`
- `DELETE /api/notifications/unsubscribe`
- `GET /api/notifications/status`
- `POST /api/notifications/test-send`

### Storage (SAS Upload)
- `POST /api/storage/sas/upload`

### ML Training Data (Internal)
- `GET /api/ml/training-data/global`
- `GET /api/ml/training-data/personalized`

## Standar Error Response
Backend memakai format error konsisten untuk `HTTPException` dan `RequestValidationError`:

```json
{
  "success": false,
  "message": "Validation error",
  "data": null,
  "errors": [
    {
      "loc": ["body", "field"],
      "msg": "Field required",
      "type": "missing"
    }
  ],
  "meta": null
}
```

Untuk error non-validasi, `message` berisi pesan singkat. Jika `detail` bukan string, maka nilainya akan muncul di `errors` dalam format list.

## Testing
Backend menggunakan pytest + TestClient dengan SQLite in-memory untuk isolasi.

```bash
pytest
```

### Strategi Database Test
- SQLite in-memory (`sqlite+pysqlite:///:memory:`)
- Fixture `db_session` melakukan rollback setiap test
- Dependency `get_db` di-override agar endpoint test menggunakan DB test

## Troubleshooting
- **Startup gagal**: pastikan `JWT_SECRET` dan konfigurasi database (`DATABASE_URL` atau `DB_*`) terisi benar.
- **`/api/stress/forecast` mengembalikan 503**: artifact forecast belum tersedia atau gagal dimuat. Pastikan file `app/models_ml/global_forecast.joblib` dan `app/models_ml/personalized_forecast.joblib` ada dan valid.
- **Forecast error 400**: pastikan tabel `stress_levels` terisi cukup riwayat harian untuk membentuk fitur forecast.
- **`/api/stress/current` mengembalikan 503**: artifact `app/models_ml/current_stress.joblib` belum tersedia atau gagal dimuat.
- **`/api/stress/current` mengembalikan 422**: payload numerik untuk fitur stress tidak valid (mis. `NaN`/tipe non-numerik).
- **Avatar upload gagal**: pastikan `AZURE_STORAGE_CONNECTION_STRING` tersedia (atau gunakan fallback lokal).
- **Push notification gagal**: pastikan `VAPID_PRIVATE_KEY` terisi.

## Technical Specs
- **Framework:** FastAPI
- **Database:** SQLAlchemy (MySQL di production, SQLite untuk testing)
- **Auth:** JWT Bearer
- **Storage:** Azure Blob Storage
- **Notifications:** Web Push (VAPID)

## Catatan
- ML model hanya dipakai untuk inference (tidak training ulang di backend).
- Jalankan `pytest` sebelum rilis untuk memastikan coverage endpoint lengkap.

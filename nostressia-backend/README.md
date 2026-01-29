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
Nostressia Backend adalah layanan FastAPI yang menyediakan autentikasi, diary, motivasi, tips kesehatan mental, stress tracking + insight, serta fitur admin moderation. Backend ini juga terhubung dengan model ML untuk prediksi stress dan menyediakan integrasi push notification + Azure Blob Storage untuk upload avatar. Layanan dibuat agar konsisten dengan kontrak frontend dan aman untuk production. 

## Arsitektur Folder
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
2. Siapkan environment:
   ```bash
   cp .env.example .env
   ```
3. Isi `.env` dengan kredensial yang sesuai.

### Environment Variables (ringkas)
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
- `JWT_SECRET`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `BREVO_API_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_ACCOUNT_NAME`
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Menjalankan Server
```bash
uvicorn app.main:app --reload
```

## Endpoint Utama (contoh)
> Semua endpoint memakai prefix `/api`.

### Auth & User
- `POST /api/auth/register`
  ```bash
  curl -X POST http://localhost:8000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"User","username":"user1","email":"user@example.com","password":"StrongPass123!","gender":"female","userDob":"2000-01-01"}'
  ```
- `POST /api/auth/login`
  ```bash
  curl -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"identifier":"user@example.com","password":"StrongPass123!"}'
  ```
- `GET /api/auth/me`
  ```bash
  curl -H "Authorization: Bearer <accessToken>" http://localhost:8000/api/auth/me
  ```

### Diary
- `POST /api/diary/`
  ```bash
  curl -X POST http://localhost:8000/api/diary/ \
    -H "Authorization: Bearer <accessToken>" \
    -H "Content-Type: application/json" \
    -d '{"title":"Hari Ini","note":"Merasa lebih baik","date":"2024-01-01","emoji":"😊","font":"sans-serif"}'
  ```

### Stress Insight
- `POST /api/stress/current`
  ```bash
  curl -X POST http://localhost:8000/api/stress/current \
    -H "Content-Type: application/json" \
    -d '{"studyHours":4,"extracurricularHours":1,"sleepHours":7,"socialHours":2,"physicalHours":1,"gpa":3.5}'
  ```

### Notifications
- `POST /api/notifications/subscribe`
  ```bash
  curl -X POST http://localhost:8000/api/notifications/subscribe \
    -H "Authorization: Bearer <accessToken>" \
    -H "Content-Type: application/json" \
    -d '{"subscription":{"endpoint":"https://example.com","keys":{"p256dh":"key","auth":"auth"}},"reminderTime":"08:00","timezone":"Asia/Jakarta"}'
  ```

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
- **Startup gagal**: pastikan `JWT_SECRET`, `DB_*`, dan `BREVO_API_KEY` tersedia.
- **Avatar upload gagal**: pastikan `AZURE_STORAGE_CONNECTION_STRING` tersedia.
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

# Arsitektur Nostressia

Dokumen ini menjelaskan arsitektur end-to-end Nostressia (Frontend, Backend, dan Machine Learning) beserta alur data utama.

## Komponen Utama

1. **Frontend (Vite + React)**
   - Menyediakan UI untuk pengguna (dashboard, diary, tips, motivasi, profil) dan admin.
   - Mengelola autentikasi berbasis JWT dan penyimpanan token secara aman melalui helper `src/utils/storage.js`.
   - Menyiapkan metadata SEO per halaman melalui komponen `PageMeta`.

2. **Backend (FastAPI)**
   - Menyediakan REST API dengan prefix `/api`.
   - Menangani autentikasi, CRUD diary, tips, motivasi, analytics, bookmarks, push notifications, dan integrasi ML.
   - Menggunakan SQLAlchemy untuk akses database.

3. **Machine Learning (Notebook + Artefak .joblib)**
   - Menyediakan pipeline prediksi stress (current) dan forecast.
   - Backend melakukan load artefak ML dan memanggil helper inference, tanpa retraining di runtime.

## Alur Data Utama

### 1) Autentikasi & Session
1. User melakukan login di frontend.
2. Frontend memanggil `POST /api/auth/login`.
3. Backend mengembalikan JWT access token (bersama profil ringkas).
4. Frontend menyimpan token di storage dan mengaktifkan guard route.

### 2) Diary & Stress Tracking
1. User membuat diary via `POST /api/diary/`.
2. Backend menyimpan diary dan mengembalikan respons standar `APIResponse`.
3. Frontend menampilkan diary list terbaru dan menampilkan empty state jika kosong.

### 3) Stress Prediction
1. User mengisi form prediksi di dashboard.
2. Frontend mengirim ke `POST /api/stress/current`.
3. Backend memanggil ML service untuk memproses input dan mengembalikan hasil prediksi.

### 4) Forecast Global
1. Frontend memanggil `GET /api/stress/global-forecast`.
2. Backend memuat artefak forecast dan mengembalikan dataset ringkas untuk chart.

## Standar Response API
Semua response sukses menggunakan schema:

```json
{ "success": true, "message": "OK", "data": { } }
```

Error validation (422) dan HTTPException menggunakan:

```json
{ "success": false, "message": "Validation error", "data": [ ... ] }
```

## Diagram (Ringkas)

```
[Frontend] -> /api/* -> [FastAPI Backend] -> [DB]
                           |
                           v
                       [ML Artifacts]
```

## Praktik Integrasi
- Frontend menggunakan konfigurasi `VITE_API_BASE_URL` dengan fallback `/api` untuk proxy dev.
- Backend mengaktifkan CORS untuk domain frontend (lokal & produksi).
- Semua service layer backend menyiapkan error handling yang konsisten untuk dikonsumsi frontend.

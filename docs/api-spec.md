# API Specification (Ringkas)

Semua endpoint bisnis menggunakan prefix `/api` dan response dibungkus dalam format `APIResponse`.
Endpoint root & health disediakan tanpa prefix untuk kebutuhan monitoring/healthcheck.

## Format Response Umum

### Sukses
```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "errors": null,
  "meta": null
}
```

### Error
```json
{
  "success": false,
  "message": "Request failed",
  "data": null,
  "errors": [ { "code": "...", "detail": "..." } ],
  "meta": null
}
```

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation error",
  "data": null,
  "errors": [ { "loc": [], "msg": "...", "type": "..." } ],
  "meta": null
}
```

## Auth

### Register
`POST /api/auth/register`

**Request**
```json
{
  "name": "User",
  "username": "user1",
  "email": "user@example.com",
  "password": "StrongPass123!",
  "gender": "female",
  "userDob": "2000-01-01"
}
```

### Login
`POST /api/auth/login`

**Request**
```json
{ "identifier": "user@example.com", "password": "StrongPass123!" }
```

**Response (data)**
```json
{ "accessToken": "<jwt>", "user": { "id": 1, "name": "User" } }
```

### Profile
`GET /api/auth/me`

**Response (data)**
```json
{ "id": 1, "email": "user@example.com", "name": "User" }
```

## Diary

### Create Diary
`POST /api/diary/`

**Request**
```json
{ "title": "Hari Ini", "note": "Merasa lebih baik", "date": "2024-01-01", "emoji": "😊", "font": "sans-serif" }
```

### Update Diary
`PUT /api/diary/{id}`

## Stress Insight

### Current Stress Prediction
`POST /api/stress/current`

**Request**
```json
{
  "studyHours": 4,
  "extracurricularHours": 1,
  "sleepHours": 7,
  "socialHours": 2,
  "physicalHours": 1,
  "gpa": 3.5
}
```

**Response (data)**
```json
{ "result": "Low", "message": "Your stress level is detected as: Low" }
```

### Forecast
`GET /api/stress/forecast`

**Response (data)**
```json
{
  "forecast": {
    "userId": 1,
    "forecastDate": "2024-01-01",
    "probability": 0.6,
    "chancePercent": 60,
    "threshold": 0.5,
    "predictionBinary": 1,
    "predictionLabel": "High",
    "modelType": "global_markov"
  },
  "eligibility": {
    "eligible": true,
    "streak": 7,
    "requiredStreak": 7,
    "restoreUsed": 0,
    "restoreRemaining": 3,
    "restoreLimit": 3,
    "missing": 0,
    "note": "Eligible for global forecast."
  }
}
```

## Tips & Motivation

### Tips
- `GET /api/tips/`
- `POST /api/tips/`
- `PUT /api/tips/{id}`
- `DELETE /api/tips/{id}`

### Motivation
- `GET /api/motivations/`
- `POST /api/motivations/`
- `DELETE /api/motivations/{id}`

## Analytics

### Weekly Report Email
`POST /api/analytics/weekly-report`

**Response (data)**
```json
{
  "email": "user@example.com",
  "report": {
    "date_range": "2026-02-10 - 2026-02-16",
    "stress_logs": 7,
    "diary_entries": 4,
    "dominant_stress_level": "Moderate",
    "streak": 87
  }
}
```

## Notifications

### Subscribe
`POST /api/notifications/subscribe`

**Request**
```json
{ "subscription": { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } }, "reminderTime": "08:00", "timezone": "Asia/Jakarta" }
```

## Admin (Protected)
- `GET /api/admin/users/`
- `GET /api/admin/diaries/`
- `DELETE /api/admin/diaries/{id}`

## Catatan
- Semua endpoint privat memerlukan header `Authorization: Bearer <token>`.
- Endpoint forecast hanya akan berhasil jika user sudah memenuhi eligibility backend.
- Detail lengkap tersedia via Swagger UI `/docs` saat server berjalan.

## Root & Health Endpoints
Endpoint ini **tanpa prefix `/api`** agar healthcheck/monitoring bisa langsung mengakses root tanpa 404.

### Root
`GET /`

**Response 200**
```json
{ "status": "ok", "message": "Nostressia API is running" }
```

### Health
`GET /health`

**Response 200**
```json
{ "status": "ok" }
```

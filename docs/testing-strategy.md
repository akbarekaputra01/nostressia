# Testing Strategy

Dokumen ini merangkum strategi testing untuk frontend, backend, dan ML.

## Frontend (Vitest + RTL)
- Semua test disimpan di `nostressia-frontend/src/__tests__`.
- Fokus:
  - Unit test utils & API client.
  - Integration test hooks, form, dan flow auth.
  - Negative tests untuk API error/empty state.

**Command:**
```bash
cd nostressia-frontend
npm run test
```

## Backend (pytest + FastAPI TestClient)
- Test berada di `nostressia-backend/tests`.
- Coverage mencakup endpoint utama, error handling, dan service/util helpers.
- Database test menggunakan SQLite in-memory agar aman.

**Command:**
```bash
cd nostressia-backend
pytest
```

## Machine Learning (pytest)
- Test berada di `nostressia-machine-learning/tests`.
- Fokus pada validasi schema data, artifact loading, dan helper preprocessing.

**Command:**
```bash
cd nostressia-machine-learning
pytest
```

## Checklist Kualitas
- Semua test wajib hijau sebelum deployment.
- Tambahkan test untuk bugfix baru sebelum merge.
- Hindari flaky tests dengan mock I/O dan seed random jika perlu.

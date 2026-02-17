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


### Pemisahan Unit vs Integration (Frontend)
- Integration test difokuskan ke flow UI lintas komponen (auth/profile/router guard/core pages).
- Selain itu dijalankan sebagai unit/komponen test reguler.

**Command:**
```bash
cd nostressia-frontend
npm run test:unit
npm run test:integration
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


### Pemisahan Unit vs Integration (Backend)
- `tests/unit` otomatis diberi marker `unit`.
- `tests/routes` dan `tests/security` otomatis diberi marker `integration`.

**Command:**
```bash
cd nostressia-backend
pytest -m unit
pytest -m integration
```

## Machine Learning (pytest)
- Test berada di `nostressia-machine-learning/tests`.
- Fokus pada validasi schema data, artifact loading, dan helper preprocessing.

**Command:**
```bash
cd nostressia-machine-learning
pytest
```


### Pemisahan Unit vs Integration (Machine Learning)
- Integration test difokuskan pada artifact loading, inference contract, dan notebook execution checks.
- Test schema/preprocessing/helper lainnya dijalankan sebagai unit suite.

**Command:**
```bash
cd nostressia-machine-learning
pytest -m unit
pytest -m integration
```

## Checklist Kualitas
- Semua test wajib hijau sebelum deployment.
- Tambahkan test untuk bugfix baru sebelum merge.
- Hindari flaky tests dengan mock I/O dan seed random jika perlu.
- Pastikan inventory fungsi (FE/BE/ML) selalu dipetakan ke test yang mengeksekusi flow kritikalnya.

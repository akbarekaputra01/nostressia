---
title: nostressia
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Nostressia

Nostressia adalah platform pemantauan stres harian dengan tiga komponen utama: frontend (React), backend (FastAPI), dan pipeline machine learning untuk prediksi/forecast stres.

## Struktur Repo
- `nostressia-frontend/` — React + Vite.
- `nostressia-backend/` — FastAPI API + integrasi ML inference.
- `nostressia-machine-learning/` — training scripts berbasis eksekusi notebook + MLflow.
- `docs/` — dokumentasi arsitektur, API, DB, logging, testing, MLflow.

## Quickstart

### 1) Backend
```bash
cd nostressia-backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2) Frontend
```bash
cd nostressia-frontend
npm install
npm run dev
```

### 3) Machine Learning (opsional training)
```bash
cd nostressia-machine-learning
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python Stress-Forecast/scripts/refresh_dataset.py
python Stress-Forecast/scripts/train_global.py
python Stress-Forecast/scripts/train_personalized.py
```

## Environment Variables
Gunakan file contoh pada masing-masing proyek:
- `nostressia-frontend/.env.example`
- `nostressia-backend/.env.example`

## Testing
```bash
cd nostressia-frontend && npm run test && npm run build
cd ../nostressia-backend && pytest -q
cd ../nostressia-machine-learning && pytest -q
```

## MLflow
Tracking lokal disimpan di `mlruns/`.
```bash
mlflow ui
```
Buka `http://127.0.0.1:5000`.

## Dokumentasi Teknis
- `docs/architecture.md`
- `docs/api-spec.md`
- `docs/database.md`
- `docs/logging-guidelines.md`
- `docs/testing-strategy.md`
- `docs/ml-training.md`
- `docs/mlflow-guide.md`

## Troubleshooting Singkat
- FE gagal request API: cek `VITE_API_BASE_URL`.
- BE gagal startup: cek env wajib (`DB_*` atau `DATABASE_URL`, `JWT_SECRET`, `BREVO_API_KEY`).
- Forecast/current stress gagal: pastikan artifact model tersedia di `nostressia-backend/app/models_ml/`.

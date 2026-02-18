# ML Training Flow

Dokumen ini menjelaskan alur training model yang dipakai saat ini di repository Nostressia.

## Business Logic

### Interval Retraining
- **Global Forecast**: Retrain setiap 60 hari
- **Personalized Forecast**: Retrain ketika user mencapai milestone 60, 120, 180, ... hari

### User Access Rules
- **Streak >= 7 hari**: User dapat menggunakan **Global Forecast**
- **Streak >= 60 hari**: User dapat menggunakan **Personalized Forecast** (model khusus untuk user tersebut)

## Komponen
- Folder kerja: `nostressia-machine-learning/`
- Training current stress: `Current-Stress/scripts/train_current_stress.py`
- Training global forecast: `Stress-Forecast/scripts/train_global.py`
- Training personalized forecast: `Stress-Forecast/scripts/train_personalized.py`
- State gating: `.ml_state.json`
- Output inference backend: `nostressia-backend/app/models_ml/*.joblib` dan `*.meta.json`

## Alur Forecast
1. Refresh dataset forecast ke `Stress-Forecast/datasets/stress_forecast.csv`.
2. Jalankan training global/personalized melalui script.
3. Script mengeksekusi notebook (`nbconvert` / `ExecutePreprocessor`).
4. Artifact model (`.joblib`) dan metadata (`.meta.json`) ditulis ke backend models directory.
5. Informasi gating retrain disimpan di `.ml_state.json`.

## Otomatisasi (Production Environment)

Sistem menggunakan **GitHub Actions** sebagai runner untuk "Offline Training".
1.  **Global Forecast**: `global-training-worker.yml` (Daily Check).
2.  **Personalized Forecast**: `personalized-training-worker.yml` (Daily Check).

Backend tidak melakukan training. Backend hanya memuat artifact (`.joblib`) yang dihasilkan oleh workflow ini.

## Command Manual (Untuk Development & Testing)
Gunakan command ini hanya untuk testing lokal atau debugging.
Dari root repo:

```bash
python nostressia-machine-learning/Stress-Forecast/scripts/refresh_dataset.py
python nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py
python nostressia-machine-learning/Stress-Forecast/scripts/train_global.py
python nostressia-machine-learning/Stress-Forecast/scripts/train_personalized.py
```

## Catatan Operasional
- `train_global.py` memakai gate interval retrain (default 60 hari, bisa `--force`).
- `train_personalized.py` hanya melatih user yang mencapai milestone 60 hari atau kelipatannya (60, 120, 180, ...). Gunakan `--force-user-id` untuk manual test.
- Personalized menggunakan **model merging** (bukan stacking) untuk menggabungkan model multi-user.
- Backend tidak melakukan training; backend hanya load artifact untuk inference.

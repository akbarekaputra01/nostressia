# ML Training Flow

Dokumen ini menjelaskan alur training model yang dipakai saat ini di repository Nostressia.

## Komponen
- Folder kerja: `nostressia-machine-learning/`
- Training global forecast: `Stress-Forecast/scripts/train_global.py`
- Training personalized forecast: `Stress-Forecast/scripts/train_personalized.py`
- Training current stress: `Current-Stress/scripts/train_current_stress.py`
- State gating: `.ml_state.json`
- Output inference backend: `nostressia-backend/app/models_ml/*.joblib` dan `*.meta.json`

## Alur Forecast
1. Refresh dataset forecast ke `Stress-Forecast/datasets/stress_forecast.csv`.
2. Jalankan training global/personalized melalui script.
3. Script mengeksekusi notebook (`nbconvert` / `ExecutePreprocessor`).
4. Artifact model (`.joblib`) dan metadata (`.meta.json`) ditulis ke backend models directory.
5. Informasi gating retrain disimpan di `.ml_state.json`.

## Command Utama
Dari root repo:

```bash
python nostressia-machine-learning/Stress-Forecast/scripts/refresh_dataset.py
python nostressia-machine-learning/Stress-Forecast/scripts/train_global.py
python nostressia-machine-learning/Stress-Forecast/scripts/train_personalized.py
python nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py
```

## Catatan Operasional
- `train_global.py` memakai gate interval retrain (default 60 hari, bisa `--force`).
- `train_personalized.py` hanya melatih user yang eligible milestone, atau gunakan `--force-user-id` untuk manual test.
- Backend tidak melakukan training; backend hanya load artifact untuk inference.

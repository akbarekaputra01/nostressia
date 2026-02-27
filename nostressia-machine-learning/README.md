# Nostressia Machine Learning

Repositori ini berisi pipeline machine learning untuk fitur prediksi stres pada ekosistem **Nostressia**, meliputi:

1. **Current Stress** → klasifikasi tingkat stres saat ini.
2. **Stress Forecast** → prediksi tingkat stres ke depan (global & personalized).

## Komponen Utama

- Notebook eksperimen dan training.
- Script utilitas untuk EDA/evaluasi.
- Model artifact (`.joblib`) + metadata.
- Test untuk kontrak data, artifact, inference, dan notebook execution.

## Struktur Direktori (Ringkas)

```text
nostressia-machine-learning/
├── Current-Stress/            # Dataset/eksperimen model current stress
├── Stress-Forecast/           # Dataset, notebook, model forecast
│   ├── datasets/
│   ├── notebooks/
│   ├── scripts/
│   └── models/
├── runner/train_models.py     # Runner training notebook-driven
├── tests/                     # Pengujian pipeline/artifact
├── scripts/                   # Utility script visualisasi
└── requirements.txt
```

## Prasyarat

- Python 3.10.19 (gunakan versi yang sama pada Linux/macOS/Windows)
- Koneksi database MySQL (untuk training yang menarik data dari tabel `stress_levels`)

## Setup Lokal

1. Masuk ke folder:

   ```bash
   cd nostressia-machine-learning
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

   # Windows CMD
   py -3.10 -m venv .venv
   .venv\Scripts\activate.bat
   ```

3. Install dependency:

   ```bash
   pip install -r requirements.txt
   ```

4. Salin env template:

   ```bash
   # Linux/macOS
   cp .env.example .env

   # Windows PowerShell
   Copy-Item .env.example .env

   # Windows CMD
   copy .env.example .env
   ```

## Environment Variable

Contoh variabel sudah tersedia di `nostressia-machine-learning/.env.example`.

`runner/train_models.py` membaca koneksi database dari:

- `DATABASE_URL` (prioritas utama), atau
- kombinasi `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.

## Menjalankan Training via Runner

### Global forecast

```bash
python runner/train_models.py --mode global --output-path Stress-Forecast/models/global_forecast.joblib
```

### Personalized forecast

```bash
python runner/train_models.py --mode personalized --user-id <USER_ID> --milestone <JUMLAH_HARI_BERURUTAN> --output-path Stress-Forecast/models/personalized_forecast.joblib
```

Catatan personalized:

- Data user harus memenuhi jumlah minimum sesuai `--milestone`.
- Data harus berurutan harian dan berakhir pada tanggal hari ini.

## Menjalankan Test

Pastikan virtual environment aktif dan dependency sudah terpasang sebelum test:

```bash
pip install -r requirements.txt
```

```bash
pytest
```

## Referensi Tambahan

- Dokumentasi dataset **Current Stress**: `Current-Stress/README.md`
- Dokumentasi dataset **Stress Forecast**: `Stress-Forecast/README.md`

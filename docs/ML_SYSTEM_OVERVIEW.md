# Overview Sistem Machine Learning Nostressia

Dokumen ini menjelaskan secara detail arsitektur, model, dan pipeline Machine Learning yang ada dalam proyek Nostressia.

## 1. Ringkasan Arsitektur

Sistem ML Nostressia menggunakan pendekatan **Asynchronous (Background) Training, Online Inference**.

- **Training (Background)**: Training **TIDAK** terjadi saat user menekan tombol di aplikasi. Training dilakukan secara terpisah di background (**GitHub Actions**) secara terjadwal. Ini yang dimaksud dengan "Offline" dari perspektif API (tidak memblokir request user).
- **Inference (Online)**: Prediksi terjadi secara **real-time**. Backend FastAPI memuat file `.joblib` yang sudah dihasilkan oleh GitHub Actions tadi, dan langsung memberikan hasil saat user meminta.

Diagram Alur:
```mermaid
graph LR
    User[User Request] -->|Real-time| API[FastAPI Backend]
    API -->|Load| Artifacts[Model Artifacts (.joblib)]
    
    subgraph "Background Training (GitHub Actions)"
        Cron[Schedule/Trigger] -->|Starts| Workflow[GitHub Actions Runner]
        Workflow -->|Executes| Script[Training Scripts]
        Script -->|Saves| Artifacts
    end
```

## 2. Komponen Model

Terdapat 3 model utama dalam sistem ini:

### A. Current Stress (Deteksi Stres Saat Ini)
Model ini memprediksi tingkat stres pengguna *saat ini* berdasarkan input gaya hidup harian.

- **Lokasi Code**:
  - Training: `nostressia-machine-learning/Current-Stress/scripts/train_current_stress.py`
  - Service: `nostressia-backend/app/services/ml_service.py`
  - Notebook: `current_stress.ipynb`
- **Input Features**:
  - `study_hours`, `extracurricular_hours`, `sleep_hours`, `social_hours`, `physical_hours` (Durasi dalam jam)
  - `gpa` (Indeks Prestasi Kumulatif)
- **Output**: Kategori Stres ("Low", "Moderate", "High").
- **Algoritma**: Logistic Regression (Multiclass).
- **Automated**: **Tidak** (Manual Run via script).
- **Proses**: Input user dikonversi menjadi DataFrame, kemudian diproses melalui Pipeline Scikit-Learn (Scaling -> Model).

### B. Global Stress Forecast (Prediksi Stres Besok - Umum)
Model ini memprediksi *risiko stres untuk keesokan harinya* (High Risk / Low Risk) untuk pengguna baru atau yang belum memiliki cukup data historis yang konsisten.

- **Lokasi Code**:
  - Training: `nostressia-machine-learning/Stress-Forecast/scripts/train_global.py`
  - Service: `nostressia-backend/app/services/global_forecast_service.py`
  - Notebook: `global_forecast.ipynb`
- **Dataset**: `stress_forecast.csv` (Data Time-Series historis).
- **Window**: Menggunakan data 7 hari ke belakang.
- **Features Engineering**:
  - **Lag Features**: Level stres t-1, t-2, ... t-7.
  - **Rolling Stats**: Rata-rata, Standar deviasi, Min, Max stres dalam 7 hari.
  - **Behavior Lags**: Tidur, belajar, dll pada t-1.
  - **Streak & Transitions**: Berapa hari berturut-turut stres tinggi, jumlah perubahan level.
  - **Calendar**: Hari dalam minggu (0-6), Apakah akhir pekan (0/1).
- **Algoritma**: Model ini bisa berupa:
  1. **Global Markov**: Probabilitas transisi antar state (misal: probabilitas besok Stres Tinggi jika hari ini Stres Rendah).
  2. **Global ML**: Model Scikit-Learn (misal: Gradient Boosting).
  3. **Blend**: Gabungan keduanya.
- **Pemicu Training**: Otomatis dijalankan setiap 60 hari (via pengecekan `_is_due`).

### C. Personalized Stress Forecast (Prediksi Stres Besok - Personal)
Model ini khusus untuk pengguna yang konsisten mencatat data (memiliki "Streak"). Model dilatih *khusus* menggunakan data satu pengguna tersebut.

- **Lokasi Code**:
  - Training: `nostressia-machine-learning/Stress-Forecast/scripts/train_personalized.py`
  - Service: `nostressia-backend/app/services/personalized_forecast_service.py`
  - Notebook: `personalized_forecast.ipynb`
- **Syarat (Gating)**: User harus memiliki streak pengisian data (misal: 60, 120, 180 hari).
- **Algoritma**:
  - **Markov User**: Model Markov khusus untuk pola pengguna tersebut.
  - **Personalized Sklearn**: Model ML yang dilatih hanya dengan data pengguna tersebut.
- **Kelebihan**: Lebih akurat untuk pola individu yang spesifik dibandingkan model Global.

## 3. Otomatisasi Training (GitHub Actions)

Benar, sistem ini menggunakan **GitHub Actions** untuk melakukan *Continuous Training* secara otomatis tanpa intervensi manual.

| Workflow File | Jadwal | Deskripsi |
|---------------|--------|-----------|
| `.github/workflows/global-training-worker.yml` | Setiap hari 00:00 UTC | Mengecek apakah model Global perlu di-retrain (setiap 60 hari). Jika ya, jalankan training dan commit hasilnya. |
| `.github/workflows/personalized-training-worker.yml` | Setiap hari 00:00 UTC | Mengecek apakah ada user yang mencapai milestone streak baru (60, 120 hari, dst). Jika ya, latih model personal mereka dan update artefak. |

**Alur Kerja Otomatis:**
1. **Trigger**: Cron job berjalan setiap hari.
2. **Refresh Data**: Script `refresh_dataset.py` menarik data terbaru dari Database Prod ke CSV.
3. **Training**: Script python (misal `train_global.py`) dijalankan. Script ini mengecek apakah training diperlukan (berdasarkan interval waktu atau milestone user).
4. **Commit Back**: Jika ada model baru yang dihasilkan, Workflow akan otomatis melakukan `git commit` dan `git push` ke repository. 
   - Ini menyebabkan backend mendapatkan model terbaru saat deployment berikutnya, atau jika backend melakukan *hot-reload* artifact.

## 4. Pipeline Training & MLflow

Sistem ini menggunakan **MLflow** untuk eksperimentasi dan tracking yang sangat detail.

1. **Notebook Execution**: Script training tidak menulis ulang logika training, melainkan *menjalankan* Jupyter Notebook menggunakan `nbconvert`. Ini memastikan dokumentasi (EDA, grafik) selalu sinkron dengan kode yang dijalankan.
2. **Metrics Injection**: Script secara otomatis menyuntikkan kode ke dalam notebook untuk mengukur **latensi prediksi** (p50, p99) guna memastikan model tidak hanya akurat tapi juga cepat.
3. **Artifact Logging**:
   - Notebook yang tereksekusi (dengan output grafik) disimpan ke MLflow.
   - Dataset training dan evaluasi dilog.
   - Model final disimpan dengan signature input/output yang jelas.

## 4. Lokasi File Penting

| Komponen | Path | Deskripsi |
|----------|------|-----------|
| **Backend Artifacts** | `nostressia-backend/app/models_ml/*.joblib` | File model siap pakai untuk API. |
| **Training Scripts** | `nostressia-machine-learning/*/scripts/*.py` | Script orkestrasi training. |
| **Inference Services** | `nostressia-backend/app/services/*.py` | Logika bisnis pemanggilan model di backend. |
| **Datasets** | `nostressia-machine-learning/*/datasets/` | File CSV sumber data training. |

## 5. Cara Kerja Inference (Prediksi)

1. **Frontend** mengirim data atau request (misal: Submit Diary hari ini).
2. **Backend**:
   - Mengambil data historis user dari database (PostgreSQL).
   - Membentuk fitur-fitur yang dibutuhkan (menghitung rata-rata 7 hari, streak, dll) persis sama dengan cara training.
   - Memanggil `model.predict()` atau `model.predict_proba()` dari objek yang sudah di-load.
   - Mengembalikan hasil (HighRisk/LowRisk atau Level Stres) ke user.

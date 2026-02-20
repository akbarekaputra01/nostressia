## Gambaran Umum Dataset Gaya Hidup Mahasiswa dan Tingkat Stres 📊

### Tujuan 🎯

Dataset ini bertujuan untuk menganalisis bagaimana pola aktivitas harian mahasiswa memengaruhi tingkat stres dan performa akademik mereka. Data mencakup kebiasaan belajar, waktu tidur, aktivitas fisik, interaksi sosial, keterlibatan dalam kegiatan ekstrakurikuler, serta nilai gpa, yang secara keseluruhan berkontribusi terhadap kondisi stres mahasiswa.

---

### Fitur Utama 🔑

#### Ukuran dan Struktur Dataset 📏

- Jumlah data: **2.000 entri**
- Jumlah atribut: **8 kolom**
- Terdiri dari data **numerik** dan **kategorikal**

---

### Atribut Dataset 📋

#### Daftar Kolom (8)

- **student_id**
- **study_hour_per_day**
- **extracurricular_hour_per_day**
- **sleep_hour_per_day**
- **social_hour_per_day**
- **physical_activity_hour_per_day**
- **gpa**
- **stress_level**

#### Identitas

- 🆔 **student_id:** ID unik mahasiswa

#### Kebiasaan Gaya Hidup

- ⏱ **study_hour_per_day:** Total waktu yang digunakan mahasiswa untuk belajar setiap hari
- 🛌 **sleep_hour_per_day:** Lama waktu tidur per hari
- 🤸 **physical_activity_hour_per_day:** Durasi olahraga atau aktivitas fisik
- 🗨️ **social_hour_per_day:** Waktu yang dihabiskan untuk berinteraksi dengan teman
- 🎨 **extracurricular_hour_per_day:** Waktu yang dialokasikan untuk organisasi, klub, atau kegiatan non-akademik

#### Performa Akademik

- 🎓 **gpa:** Indikator pencapaian akademik mahasiswa secara keseluruhan

#### Tingkat Stres

- ⚡ **stress_level:** Diklasifikasikan menjadi **Rendah**, **Sedang**, dan **Tinggi** untuk menggambarkan intensitas stres

---

### Fitur Kategorikal 🏷️

- ⚡ **stress_level** dikonversi menjadi **stress_level_encoded** agar dapat digunakan dalam proses pemodelan
- 🎓 **Performa Akademik** dikelompokkan menjadi **Excellent**, **Good**, **Fair**, dan **Poor** berdasarkan gpa, lalu dilakukan encoding ke **academic_performance_encoded**

---

### Variabel Target 🎯

- Target utama dari dataset ini adalah **memprediksi stress_level mahasiswa**

---

### Insight dari Data 📊

#### Hubungan Stres dan Gaya Hidup 🧠

- 🔥 Mahasiswa dengan **stres tinggi** cenderung memiliki **study_hour_per_day** yang lebih lama namun **sleep_hour_per_day** yang lebih sedikit
- ⚖️ **Stres sedang** mencerminkan keseimbangan antara aktivitas akademik dan kehidupan pribadi
- 🌿 Mahasiswa dengan **stres rendah** umumnya aktif secara fisik dan memiliki interaksi sosial yang baik

#### Fitur Paling Berpengaruh 🔍

- ⏱ **study_hour_per_day** dan 🛌 **sleep_hour_per_day** merupakan faktor paling dominan dalam menentukan tingkat stres

#### Distribusi Kelas

- Sebagian besar mahasiswa berada pada kategori **stres sedang** dan **stres tinggi**, sementara jumlah mahasiswa dengan **stres rendah** relatif lebih sedikit

---

## Current-Stress Experiment Pipeline (MLflow)

Gunakan script berikut untuk menjalankan seluruh eksperimen Current-Stress dengan style pipeline yang konsisten:

```bash
python nostressia-machine-learning/Current-Stress/scripts/run_current_stress_experiments.py
```

Perbaikan utama yang sudah dicakup:
- Semua model didaftarkan ke MLflow Model Registry (otomatis membuat version).
- Dataset selalu dilog sebagai `mlflow.log_input(...)` agar kolom Dataset tidak `-`.
- Metrik diperluas (accuracy, precision/recall/f1 macro-micro-weighted, balanced accuracy, ROC-AUC, log loss, MCC, Cohen Kappa, dan per-class metrics).
- Description run ditulis ke `mlflow.note.content` + tag deskripsi run.
- Struktur training seragam dan rapi dengan pendekatan pipeline profesional.

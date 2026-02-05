## Gambaran Umum Dataset Forecast Tingkat Stres 📈

### Tujuan 🎯

Dataset ini digunakan untuk melakukan peramalan (forecast) tingkat stres berdasarkan riwayat aktivitas harian. Data disusun per pengguna dan per tanggal, sehingga dapat dipakai untuk pemodelan global maupun personalized.

---

### Fitur Utama 🔑

#### Ukuran dan Struktur Dataset 📏

- Jumlah atribut: **13 kolom**
- Terdiri dari data **numerik**, **kategorikal**, dan **tanggal/waktu**

---

### Atribut Dataset 📋

#### Daftar Kolom (13)

- **stress_level_id**
- **user_id**
- **date**
- **stress_level**
- **gpa**
- **extracurricular_hour_per_day**
- **physical_activity_hour_per_day**
- **sleep_hour_per_day**
- **study_hour_per_day**
- **social_hour_per_day**
- **emoji**
- **is_restored**
- **created_at**

#### Identitas & Waktu

- 🆔 **stress_level_id:** ID unik untuk setiap catatan stres
- 👤 **user_id:** ID pengguna
- 📅 **date:** Tanggal log stres
- 🕒 **created_at:** Waktu pembuatan data

#### Kebiasaan Gaya Hidup

- ⏱ **study_hour_per_day:** Total waktu belajar per hari
- 🛌 **sleep_hour_per_day:** Lama waktu tidur per hari
- 🤸 **physical_activity_hour_per_day:** Durasi aktivitas fisik per hari
- 🗨️ **social_hour_per_day:** Waktu untuk interaksi sosial per hari
- 🎨 **extracurricular_hour_per_day:** Waktu kegiatan ekstrakurikuler per hari

#### Performa Akademik

- 🎓 **gpa:** Indikator performa akademik

#### Tingkat Stres & Konteks

- ⚡ **stress_level:** Kategori tingkat stres
- 🙂 **emoji:** Representasi emosi yang dicatat pengguna
- 🔁 **is_restored:** Penanda apakah data dipulihkan (restored)

---

### Variabel Target 🎯

- Target utama adalah **stress_level** untuk melakukan peramalan tingkat stres berdasarkan riwayat aktivitas dan konteks pengguna.

---

### Ruang Lingkup Forecast 📌

#### Global Forecast

- Menggunakan data **semua pengguna** untuk mempelajari pola umum perubahan **stress_level** dari waktu ke waktu.
- Cocok untuk baseline sistem dan prediksi agregat karena mempertimbangkan variasi perilaku lintas pengguna.

#### Personalized Forecast

- Menggunakan data **per pengguna** untuk menangkap pola individual.
- Cocok untuk rekomendasi yang lebih spesifik karena mempertimbangkan rutinitas dan pola harian pengguna tersebut.

---

### Insight Umum dari Data 📊

- Data bersifat **time-series per pengguna**, sehingga memungkinkan pembuatan fitur historis (misalnya lag) untuk meningkatkan kualitas forecast.
- Kombinasi **study_hour_per_day**, **sleep_hour_per_day**, dan **physical_activity_hour_per_day** penting untuk menangkap keseimbangan gaya hidup.
- **emoji** dapat dipakai sebagai sinyal tambahan untuk kondisi emosional harian.

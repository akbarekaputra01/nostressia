## Gambaran Umum Dataset Gaya Hidup Mahasiswa dan Tingkat Stres 📊

### Tujuan 🎯

Dataset ini bertujuan untuk menganalisis bagaimana pola aktivitas harian mahasiswa memengaruhi tingkat stres dan performa akademik mereka. Data mencakup kebiasaan belajar, waktu tidur, aktivitas fisik, interaksi sosial, keterlibatan dalam kegiatan ekstrakurikuler, serta nilai IPK (GPA), yang secara keseluruhan berkontribusi terhadap kondisi stres mahasiswa.

---

### Fitur Utama 🔑

#### Ukuran dan Struktur Dataset 📏

- Jumlah data: **2.000 entri**
- Jumlah atribut: **8 kolom**
- Terdiri dari data **numerik** dan **kategorikal**

---

### Atribut Dataset 📋

#### Kebiasaan Gaya Hidup

- ⏱ **Jam Belajar Harian:** Total waktu yang digunakan mahasiswa untuk belajar setiap hari
- 🛌 **Jam Tidur Harian:** Lama waktu tidur per hari
- 🤸 **Aktivitas Fisik Harian:** Durasi olahraga atau aktivitas fisik
- 🗨️ **Jam Sosial Harian:** Waktu yang dihabiskan untuk berinteraksi dengan teman
- 🎨 **Jam Ekstrakurikuler:** Waktu yang dialokasikan untuk organisasi, klub, atau kegiatan non-akademik

#### Performa Akademik

- 🎓 **GPA (IPK):** Indikator pencapaian akademik mahasiswa secara keseluruhan

#### Tingkat Stres

- ⚡ **Stress Level:** Diklasifikasikan menjadi **Rendah**, **Sedang**, dan **Tinggi** untuk menggambarkan intensitas stres

---

### Fitur Kategorikal 🏷️

- ⚡ **Stress_Level** dikonversi menjadi **Stress_Level_Encoded** agar dapat digunakan dalam proses pemodelan
- 🎓 **Performa Akademik** dikelompokkan menjadi **Excellent**, **Good**, **Fair**, dan **Poor** berdasarkan GPA, lalu dilakukan encoding

---

### Variabel Target 🎯

- Target utama dari dataset ini adalah **memprediksi tingkat stres mahasiswa**

---

### Insight dari Data 📊

#### Hubungan Stres dan Gaya Hidup 🧠

- 🔥 Mahasiswa dengan **stres tinggi** cenderung memiliki jam belajar yang lebih lama namun waktu tidur yang lebih sedikit
- ⚖️ **Stres sedang** mencerminkan keseimbangan antara aktivitas akademik dan kehidupan pribadi
- 🌿 Mahasiswa dengan **stres rendah** umumnya aktif secara fisik dan memiliki interaksi sosial yang baik

#### Fitur Paling Berpengaruh 🔍

- ⏱ **Jam Belajar Harian** dan 🛌 **Jam Tidur Harian** merupakan faktor paling dominan dalam menentukan tingkat stres

#### Distribusi Kelas

- Sebagian besar mahasiswa berada pada kategori **stres sedang** dan **stres tinggi**, sementara jumlah mahasiswa dengan **stres rendah** relatif lebih sedikit

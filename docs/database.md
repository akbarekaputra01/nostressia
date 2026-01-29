# Database Schema (Ringkas)

Backend menggunakan SQLAlchemy dengan target MySQL (production) dan SQLite in-memory untuk test. Berikut ringkasan tabel utama yang dipakai oleh fitur end-to-end.

## Tabel Utama

### `users`
Menyimpan profil user, status verifikasi, dan metadata login.

**Kolom penting:**
- `user_id` (PK)
- `username`, `email`, `password`
- `name`, `gender`, `user_dob`, `user_gpa`
- `avatar`, `streak`, `last_login`
- `is_verified`, `otp_code`, `otp_created_at`
- `created_at`

### `admins`
Akun admin untuk moderasi aplikasi.

### `diaries`
Jurnal harian user.

**Kolom penting:**
- `id` (PK), `user_id` (FK -> users)
- `title`, `note`, `date`, `emoji`, `font`
- `created_at`

### `stress_logs`
Log stres harian untuk analitik & forecast.

**Kolom penting:**
- `stress_level_id` (PK)
- `user_id` (FK -> users)
- `stress_level`, `gpa`, `study_hour_per_day`, `sleep_hour_per_day`, dll
- `date`, `is_restored`, `created_at`

### `tips` & `tips_categories`
Konten tips kesehatan mental dan kategorinya.

### `motivations`
Konten motivasi yang dapat di-bookmark.

### `bookmarks`
Relasi user -> motivasi.

### `push_subscriptions`
Subscription web push untuk reminder.

### `push_delivery_logs`
Log pengiriman notifikasi untuk deduplikasi.

## Relasi Penting
- `users` -> `diaries` (1:N)
- `users` -> `stress_logs` (1:N)
- `users` -> `bookmarks` (1:N) -> `motivations`
- `users` -> `push_subscriptions` (1:N)

## Catatan
- Model dan schema lengkap berada di `nostressia-backend/app/models`.
- Testing memakai SQLite in-memory agar tidak mengubah data produksi.

# Logging Guidelines

Panduan ini memastikan logging rapi, aman, dan tidak bocor data sensitif.

## Frontend
- Gunakan `src/utils/logger.js` sebagai wrapper, bukan `console.log` langsung.
- Logging default **non-aktif** di production. Aktif hanya saat `import.meta.env.DEV` atau `VITE_LOG_LEVEL` diset.
- Jangan log token, password, OTP, atau payload sensitif.
- Gunakan level yang sesuai:
  - `debug`: dev-only, investigasi lokal.
  - `info`: status flow non-sensitif.
  - `warn`: fallback/penanganan non-fatal.
  - `error`: error critical yang perlu ditampilkan ke monitoring.

## Backend
- Gunakan modul `logging` standar Python.
- Hindari `print()` di kode production; gunakan logger (`logger.info`, `logger.warning`, dll).
- Jangan log secret (JWT secret, API key, password) atau data pribadi (email/user_id) tanpa masking.
- Pastikan error dengan exception handling ter-log menggunakan `logger.exception`.

## Format & Observability
- Pastikan format log konsisten dengan prefix modul (`__name__`).
- Di environment production, arahkan log ke stdout/stderr agar dapat ditangkap platform (Docker/Vercel).

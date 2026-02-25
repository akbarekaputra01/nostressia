# Nostressia Monorepo

Repositori ini adalah **monorepo** untuk ekosistem Nostressia, yang terdiri dari:

- `nostressia-frontend` → aplikasi web (React + Vite).
- `nostressia-backend` → API server (FastAPI).
- `nostressia-machine-learning` → pipeline model machine learning (current stress & stress forecast).
- `observability` → konfigurasi monitoring/observability.

## Struktur Proyek

```text
nostressia/
├── nostressia-frontend/          # Frontend React + Vite
├── nostressia-backend/           # Backend FastAPI
├── nostressia-machine-learning/  # Pipeline training/inference ML
├── observability/                # Observability stack/config
├── Jenkinsfile
├── sonar-project.properties
└── LICENSE
```

## Prasyarat Umum

- **Node.js 18+** (disarankan LTS) untuk frontend.
- **Python 3.10+** untuk backend dan machine learning.
- **MySQL** untuk data aplikasi/training.

## Dokumentasi per Modul

- Backend: `nostressia-backend/README.md`
- Frontend: `nostressia-frontend/README.md`
- Machine Learning: `nostressia-machine-learning/README.md`

Gunakan README di masing-masing modul untuk instruksi detail setup, env, testing, dan deployment.

## Quick Start (Development)

### 1) Clone & masuk repo

```bash
git clone <repo-url>
cd nostressia
```

### 2) Setup Backend

```bash
cd nostressia-backend
# Linux/macOS
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
# Windows CMD: copy .env.example .env

python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
# CMD: .venv\Scripts\activate.bat

pip install -r requirements.txt
pip install -r requirements-dev.txt
python main.py
```

Backend default: `http://localhost:8000`

### 3) Setup Frontend

Buka terminal baru:

```bash
cd nostressia-frontend
# Linux/macOS
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
# Windows CMD: copy .env.example .env

npm install
npm run dev
```

Frontend default: `http://localhost:5173`

### 4) Setup Machine Learning (opsional saat development aplikasi)

```bash
cd nostressia-machine-learning
# Linux/macOS
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
# Windows CMD: copy .env.example .env

python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
# CMD: .venv\Scripts\activate.bat

pip install -r requirements.txt
pytest
```

## Menjalankan Test

Gunakan urutan berikut sebelum menjalankan test di modul mana pun:

1. Masuk ke direktori modul yang akan dites.
2. Install dependency modul tersebut.
   - Frontend: `npm install`
   - Backend: `pip install -r requirements.txt && pip install -r requirements-dev.txt`
   - Machine Learning: `pip install -r requirements.txt`
3. Jika modul Python, aktifkan virtual environment terlebih dahulu.
4. Jalankan command test modul.

### Backend

```bash
cd nostressia-backend
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
# CMD: .venv\Scripts\activate.bat
pip install -r requirements.txt
pip install -r requirements-dev.txt
pytest
```

### Frontend

```bash
cd nostressia-frontend
npm install
npm run test
```

### Machine Learning

```bash
cd nostressia-machine-learning
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# PowerShell: .\.venv\Scripts\Activate.ps1
# CMD: .venv\Scripts\activate.bat
pip install -r requirements.txt
pytest
```

## CI/CD & Quality

- `Jenkinsfile` dipakai untuk pipeline CI.
- `sonar-project.properties` dipakai untuk analisis kualitas kode (Sonar).

## Catatan Environment

Agar tidak terjadi error setup:

1. Selalu copy dari `.env.example` masing-masing modul.
2. Jangan mencampur env frontend/backend/ML dalam satu file tanpa kebutuhan yang jelas.
3. Lengkapi secret penting sebelum deploy (mis. JWT secret, API key, storage credential, VAPID key).

## Lisensi

Lihat file `LICENSE` untuk informasi lisensi proyek.

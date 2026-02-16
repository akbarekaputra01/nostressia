pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    // Biar output Python tidak nge-buffer dan log jelas
    PYTHONUNBUFFERED = "1"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        bat 'git --version'
        bat 'python --version'
        bat 'node --version'
        bat 'npm --version'
      }
    }

    // =========================
    // BACKEND (FastAPI / Python)
    // =========================
    stage('Backend: Install deps') {
      steps {
        dir('nostressia-backend') {
          bat 'python -m pip install --upgrade pip'
          // kalau kamu pakai requirements.txt
          bat 'if exist requirements.txt (pip install -r requirements.txt) else (echo requirements.txt not found & exit /b 1)'
          // opsional: tools test/lint (kalau belum ada di requirements)
          bat 'pip install pytest'
        }
      }
    }

    stage('Backend: Test') {
      steps {
        dir('nostressia-backend') {
          // kalau repo kamu belum punya test, ini akan gagal
          // kalau belum ada test, bilang ya—nanti aku ubah jadi smoke test import + lint
          bat 'pytest -q'
        }
      }
    }

    // =========================
    // FRONTEND (React/Vite)
    // =========================
    stage('Frontend: Install deps') {
      steps {
        dir('nostressia-frontend') {
          // npm ci lebih stabil untuk CI karena pakai package-lock.json
          bat 'npm ci'
        }
      }
    }

    stage('Frontend: Build') {
      steps {
        dir('nostressia-frontend') {
          bat 'npm run build'
        }
      }
    }

    // =========================
    // ML (optional sanity check)
    // =========================
    stage('ML: Sanity (optional)') {
      steps {
        dir('nostressia-machine-learning') {
          // Kalau ada requirements/pyproject untuk ML, sesuaikan.
          // Ini cuma cek folder ada dan python bisa jalan.
          bat 'python -c "print(\\"ML folder OK\\")"'
        }
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
  }
}

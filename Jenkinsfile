pipeline {
  agent any
  options { timestamps() }

  environment {
    PY310 = 'C:\\Users\\akbar\\AppData\\Local\\Programs\\Python\\Python310\\python.exe'
    PYTHONUNBUFFERED = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        bat 'git --version'
        bat "\"%PY310%\" --version"
        bat 'node --version'
        bat 'npm --version'
      }
    }

    // =========================
    // BACKEND (Python/FastAPI)
    // =========================
    stage('Backend: Setup venv + install deps (Py3.10)') {
      steps {
        dir('nostressia-backend') {
          bat "\"%PY310%\" -m venv .venv"
          bat ".venv\\Scripts\\python -m pip install --upgrade pip"
          bat "if exist requirements.txt ( .venv\\Scripts\\pip install -r requirements.txt ) else ( echo requirements.txt not found & exit /b 1 )"
          // sanity check: pastikan sklearn bisa diimport
          bat ".venv\\Scripts\\python -c \"import sklearn; print('sklearn=', sklearn.__version__)\""
        }
      }
    }

    stage('Backend: Test') {
      steps {
        dir('nostressia-backend') {
          // Kalau belum ada test, ini akan fail.
          // Kalau fail karena no tests, bilang ya—aku ubah jadi smoke test.
          bat ".venv\\Scripts\\pytest -q"
        }
      }
    }

    // =========================
    // FRONTEND (React/Vite)
    // =========================
    stage('Frontend: Install deps') {
      steps {
        dir('nostressia-frontend') {
          bat "npm ci"
        }
      }
    }

    stage('Frontend: Build') {
      steps {
        dir('nostressia-frontend') {
          bat "npm run build"
        }
      }
    }

    // =========================
    // ML (optional sanity check)
    // =========================
    stage('ML: Sanity (optional)') {
      steps {
        dir('nostressia-machine-learning') {
          bat "\"%PY310%\" -c \"print('ML folder OK')\""
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

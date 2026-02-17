pipeline {
  agent any
  options { timestamps() }

  environment {
    PYTHONUNBUFFERED = '1'
    PIP_DISABLE_PIP_VERSION_CHECK = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git --version'
        sh 'python --version || true'
        sh 'python3 --version || true'
        sh 'node --version || true'
        sh 'npm --version || true'
      }
    }

    stage('ML: Setup venv + install deps') {
      steps {
        dir('nostressia-machine-learning') {
          sh '''
            set -eux
            python -m venv .venv
            . .venv/bin/activate
            python -m pip install --upgrade pip
            test -f requirements.txt
            pip install -r requirements.txt
          '''
        }
      }
    }

    stage('ML: Unit Test') {
      steps {
        dir('nostressia-machine-learning') {
          sh '''
            set -eux
            . .venv/bin/activate
            pytest -q -m unit
          '''
        }
      }
    }

    stage('ML: Integration Test') {
      steps {
        dir('nostressia-machine-learning') {
          sh '''
            set -eux
            . .venv/bin/activate
            pytest -q -m integration
          '''
        }
      }
    }

    stage('Backend: Setup venv + install deps') {
      steps {
        dir('nostressia-backend') {
          sh '''
            set -eux
            python -m venv .venv
            . .venv/bin/activate
            python -m pip install --upgrade pip
            test -f requirements.txt
            pip install -r requirements.txt
            python -c "import sklearn; print('sklearn=', sklearn.__version__)"
          '''
        }
      }
    }

    stage('Backend: Unit Test') {
      steps {
        dir('nostressia-backend') {
          sh '''
            set -eux
            . .venv/bin/activate
            pytest -q -m unit
          '''
        }
      }
    }

    stage('Backend: Integration Test') {
      steps {
        dir('nostressia-backend') {
          sh '''
            set -eux
            . .venv/bin/activate
            pytest -q -m integration
          '''
        }
      }
    }

    stage('Frontend: Install deps') {
      steps {
        dir('nostressia-frontend') {
          sh '''
            set -eux
            npm ci
          '''
        }
      }
    }

    stage('Frontend: Unit Test') {
      steps {
        dir('nostressia-frontend') {
          sh '''
            set -eux
            npm run test:unit
          '''
        }
      }
    }

    stage('Frontend: Integration Test') {
      steps {
        dir('nostressia-frontend') {
          sh '''
            set -eux
            npm run test:integration
          '''
        }
      }
    }

    stage('Frontend: Build') {
      steps {
        dir('nostressia-frontend') {
          sh '''
            set -eux
            npm run build
          '''
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

pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 60, unit: 'MINUTES')
  }

  environment {
    PYTHONUNBUFFERED = '1'
    PIP_DISABLE_PIP_VERSION_CHECK = '1'
    CI = 'true'
  }

  stages {
    stage('Checkout + Tooling Info') {
      steps {
        checkout scm
        sh '''
          set -eux
          git --version
          python --version || true
          python3 --version || true
          node --version || true
          npm --version || true
          sonar-scanner --version || true
        '''
      }
    }

    stage('Backend: Setup + Quality + Test') {
      steps {
        dir('nostressia-backend') {
          sh '''
            set -eux
            PYTHON_BIN="$(command -v python3 || command -v python)"
            "$PYTHON_BIN" -m venv .venv
            . .venv/bin/activate
            python -m pip install --upgrade pip
            test -f requirements.txt
            pip install -r requirements.txt
            if [ -f requirements-dev.txt ]; then
              pip install -r requirements-dev.txt
            fi

            # Quality checks (gunakan yang sudah ada di repo)
            ruff check .
            black --check .
            isort --check-only .

            # Test + coverage + junit
            pytest -q --maxfail=1 --disable-warnings \
              --junitxml=pytest-report.xml \
              --cov=app --cov-report=term-missing --cov-report=xml:coverage.xml
          '''
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'nostressia-backend/pytest-report.xml'
          archiveArtifacts allowEmptyArchive: true, artifacts: 'nostressia-backend/coverage.xml'
        }
      }
    }

    stage('Frontend: Install + Lint + Test + Build') {
      steps {
        dir('nostressia-frontend') {
          sh '''
            set -eux
            npm ci
            npm run lint
            npm run test
            npm run build
          '''
        }
      }
    }

    stage('ML: Setup + Test') {
      when {
        expression { fileExists('nostressia-machine-learning/requirements.txt') }
      }
      steps {
        dir('nostressia-machine-learning') {
          sh '''
            set -eux
            PYTHON_BIN="$(command -v python3 || command -v python)"
            "$PYTHON_BIN" -m venv .venv
            . .venv/bin/activate
            pip install --upgrade pip
            pip install -r requirements.txt
            pytest -q --maxfail=1 --disable-warnings --junitxml=pytest-report.xml
          '''
        }
      }
      post {
        always {
          junit allowEmptyResults: true, testResults: 'nostressia-machine-learning/pytest-report.xml'
        }
      }
    }

    stage('SonarQube: Scan') {
      when {
        allOf {
          expression { fileExists('sonar-project.properties') }
          expression { env.SONAR_TOKEN?.trim() }
        }
      }
      steps {
        sh '''
          set -eux
          sonar-scanner \
            -Dsonar.token="$SONAR_TOKEN"
        '''
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
    success {
      echo 'All checks passed: Backend, Frontend, and ML.'
    }
    failure {
      echo 'Pipeline failed. Please inspect stage logs and test reports.'
    }
  }
}

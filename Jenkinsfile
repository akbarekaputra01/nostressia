pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 60, unit: 'MINUTES')
    skipDefaultCheckout(true)
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

    stage('Backend: Setup') {
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
          '''
        }
      }
    }

    stage('Backend: Quality (Advisory)') {
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          dir('nostressia-backend') {
            sh '''
              set -eux
              . .venv/bin/activate
              ruff check .
              black --check .
              isort --check-only .
            '''
          }
        }
      }
    }

    stage('Backend: Test + Coverage') {
      steps {
        dir('nostressia-backend') {
          sh '''
            set -eux
            . .venv/bin/activate
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
        dir('nostressia-machine-learning') {
          sh '''
            set -eux
            npm ci
            npm run lint
            npm run test
            npm run build
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
      echo 'All checks passed: ML, Backend, and Frontend.'
    }
    unstable {
      echo 'Pipeline unstable: at least one advisory quality check failed.'
    }
    failure {
      echo 'Pipeline failed. Please inspect stage logs and test reports.'
    }
  }
}

---
title: Nostressia Backend API
emoji: 🧠
colorFrom: indigo
colorTo: pink
sdk: docker
pinned: false
app_port: 7860
---

# 🚀 Nostressia Backend API

FastAPI service that powers the **Nostressia** application. This backend handles authentication, motivation/tips management, and features an **AI-driven Stress Detection System** using Machine Learning.

The project follows strict architectural patterns with a clear separation between configuration, database, routers, and ML services.

## 🔗 Live Documentation

Explore the API endpoints via Swagger UI:
👉 **[Open Live API Docs](https://akbarekaputra01-nsbe2.hf.space/docs)**

---

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **Language:** Python 3.9 (Strictly pinned for compatibility)
- **Database:** MySQL (via SQLAlchemy)
- **Machine Learning:** Scikit-Learn, Pandas, Joblib (Logistic Regression Model)
- **Deployment:** Docker container on Hugging Face Spaces
- **CI/CD:** GitHub Actions (Auto-sync to Hugging Face)

## 📋 Requirements

- Python 3.9 (Recommended to avoid syntax errors)
- MySQL database (network-accessible)

## ⚙️ Local Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/akbarekaputra01/Nostressia-Backend.git](https://github.com/akbarekaputra01/Nostressia-Backend.git)
    cd Nostressia-Backend
    ```

2.  **Create a virtual environment:**

    ```bash
    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # Mac/Linux:
    source .venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the project root.

    ```env
    # Database Configuration
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=your_db_host
    DB_PORT=3306
    DB_NAME=your_db_name

    # Security
    SECRET_KEY=your_super_secret_key
    ALGORITHM=HS256

    # ML Model Config (Optional)
    PYTHON_VERSION=3.9.18
    ```

5.  **Run Locally:**
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://127.0.0.1:8000`.

## 🚀 Deployment Workflow (GitHub + Hugging Face)

This project uses **Docker** for deployment to ensure the Machine Learning environment works consistently.

### How it works:

1.  **Development:** Code is pushed to the `main` branch on GitHub.
2.  **CI/CD:** A GitHub Action (`.github/workflows/sync-to-hf.yml`) automatically triggers.
3.  **Sync:** The action pushes the code to the Hugging Face Space.
4.  **Build:** Hugging Face builds the Docker container based on the `Dockerfile`.
5.  **Live:** The API restarts automatically at the remote URL.

### Dockerfile Details

The project runs on `python:3.9` image to support specific ML libraries and syntax compatibility. It exposes port `7860` (Hugging Face standard).

## 📂 Project Layout

- `main.py`: Entry point for the application.
- `Dockerfile`: Configuration for building the Docker image.
- `.github/workflows`: CI/CD scripts for syncing with Hugging Face.
- `app/`:
  - `core/`: Configuration (`config.py`) and Database setup.
  - `routes/`: API endpoints (Auth, Motivation, Predict, etc.).
  - `services/`: Logic layer, including `ml_service.py` for loading the model.
  - `models_ml/`: Stores the pre-trained `.joblib` models.
  - `schemas/`: Pydantic models for request/response validation.

## 🔑 Admin Management

To generate a hash for a new admin password:

```bash
python app/utils/generate_admin_hash.py
```

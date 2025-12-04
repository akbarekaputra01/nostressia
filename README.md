# Nostressia Backend

FastAPI service that powers Nostressia authentication, motivation, and tips APIs. The app connects to a MySQL database via SQLAlchemy and creates required tables on startup. The project follows the ["Structuring a FastAPI Project" best practices](https://dev.to/mohammad222pr/structuring-a-fastapi-project-best-practices-53l6) with a clear separation between configuration, database, routers, and utilities.

## Requirements
- Python 3.10+
- MySQL database (network-accessible to the API process)

## Setup
1. **Create a virtual environment (recommended):**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. **Install dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. **Configure environment variables:** Create a `.env` file in the project root or export variables directly. Example matching the shared credentials:
   ```bash
   DB_USER=Nostressia_nationalas
   DB_PASSWORD=2f5d922599f787ad53a4a1c7a243e24be84a5be7
   DB_HOST=mfv81z.h.filess.io
   DB_PORT=3306
   DB_NAME=Nostressia_nationalas
   ```
   > Update these values if you use a different database instance.

## Running the API locally
Start the FastAPI server with Uvicorn:
```bash
uvicorn main:app --reload
```
The app will create tables on startup and serve endpoints at `http://127.0.0.1:8000`. Key routes:
- `POST /api/auth/admin/login` – admin login
- `GET /api/motivation` and `POST /api/motivation` – motivation CRUD
- `GET /api/tips`, `POST /api/tips`, etc. – tips CRUD

## Managing admin passwords
To generate a bcrypt hash for a new admin password, run:
```bash
python app/utils/generate_admin_hash.py
```
Insert the resulting hash into the `admin` table (e.g., via SQL client) for the desired user record.

## Project layout
- `main.py`: Entry point that exposes the FastAPI `app` instance for local runs and deployment.
- `app/main.py`: Application factory that wires middleware, startup events, and routers.
- `app/core/`: Shared configuration (`config.py`) and database session/engine (`database.py`).
- `app/api/`: Router aggregator that combines feature routers under a single API prefix.
- `app/routes/`, `app/models/`, `app/schemas/`, `app/services/`, `app/utils/`: Feature-level logic, data models, and helpers.

## Vercel deployment
For Vercel or similar serverless deployments, ensure the same environment variables are configured in the hosting environment. The included `vercel.json` exposes the FastAPI app with the same entrypoint.

---
title: nostressia-backend
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Nostressia Backend (FastAPI)

## Model Details
The Nostressia backend is a FastAPI service that provides authentication, stress insights, diary management, motivations, and administrative moderation features. It supports machine-learning-driven forecasts via stored model artifacts and maintains a consistent authentication contract with the frontend.

## Intended Use
This API is intended for the Nostressia web application and internal tooling. It provides user-facing endpoints for stress tracking and admin-only endpoints for moderation.

## Limitations
- The backend serves predictions from pre-trained artifacts and does not retrain models in production.
- Forecast accuracy depends on the quality and completeness of user-provided logs.
- Reminder delivery depends on the client maintaining an active push subscription.

## How to Get Started with the Model
Even though this is an API, the service is packaged for Hugging Face Spaces using the Docker SDK.

### Local Development
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```

### Useful Endpoints
- `GET /docs` — Swagger UI
- `GET /openapi.json` — OpenAPI specification

## Training Data
Training data for machine learning artifacts lives in the `/nostressia-machine-learning` folder. This backend consumes pre-generated artifacts and does not train models directly.

## Evaluation
Model evaluation is performed in the machine learning notebooks. See `/nostressia-machine-learning` for the evaluation workflow and metrics.

## Environmental Impact
Not applicable. The backend consumes pre-trained artifacts rather than training models in production.

## Technical Specifications
- **Framework:** FastAPI
- **Database:** SQLAlchemy (MySQL in production; SQLite overrides supported for testing)
- **Auth:** JWT-based access tokens (Authorization: Bearer \<accessToken\>)
- **ML Artifacts:** Joblib models for current stress and forecasts
- **Storage:** Azure Blob Storage for profile photos
- **Push Notifications:** VAPID + web push
- **Code Quality:** Ruff + Black + isort (see `requirements-dev.txt`)

## Testing
### Run the test suite
```bash
pytest
```

### Test Structure
- `tests/routes/` for API route coverage
- `tests/unit/` for helper/service unit tests
- `tests/integration/` for workflow tests
- `tests/security/` for authentication and authorization checks

## Citation
```
@misc{nostressia-backend,
  title = {Nostressia Backend API},
  author = {Nostressia Team},
  year = {2025},
  howpublished = {\url{https://github.com/nostressia/nostressia}}
}
```

### Notes
- Tests use an in-memory SQLite database and override dependencies for isolation.
- Ensure environment variables in `.env.example` are available in your shell if needed.

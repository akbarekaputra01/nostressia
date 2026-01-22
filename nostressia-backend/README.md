---
title: nostressia-backend
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# nostressia-backend (FastAPI)

Backend API untuk project **Nostressia**.

## Tech Stack

- FastAPI
- Uvicorn
- MySQL (SQLAlchemy)
- Machine Learning model (`.joblib` via Git LFS)

## Hugging Face Spaces Notes

Space ini menggunakan **Docker SDK**, sehingga backend FastAPI bisa berjalan normal tanpa Gradio/Streamlit.

Endpoint utama:

- `/docs` → Swagger UI
- `/openapi.json`

## Environment Variables

Set di **Spaces → Settings → Variables**:

- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `HF_HOME` (opsional)
- env lain sesuai `.env` backend kamu

## Model Files

Model ML disimpan di:

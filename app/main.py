from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine

# Import Models
from app.models.user_model import User
from app.models.diary_model import Diary
from app.models.stress_log_model import StressLevel
from app.models.bookmark_model import Bookmark
from app.models.tips_model import Tips, TipsCategory
from app.models.motivation_model import Motivation
from app.models.admin_model import Admin

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    # --- ✅ PERBAIKAN CORS (Hapus Bintang, Masukkan Domain Asli) ---
    origins = [
        "http://localhost:5173",            # Untuk Localhost
        "http://127.0.0.1:5173",            # Variasi Localhost
        "https://nostressia-frontend-develop.vercel.app", # Domain Vercel Kamu
        "https://nostressia-frontend-develop.vercel.app/" # Domain Vercel dengan slash
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  # 👈 Pakai list origins yang spesifik
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router, prefix=settings.api_prefix)

    return app

app = create_app()
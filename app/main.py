from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine

# --- PENTING: Kita Pakai Versi HEAD (Lengkap) ---
# Import semua Model di sini biar Tabel Otomatis Dibuat saat startup
# Terutama 'User' yang dibutuhkan untuk fitur Register
from app.models.user_model import User
from app.models.diary_model import Diary
from app.models.stress_log_model import StressLevel
from app.models.bookmark_model import Bookmark
from app.models.tips_model import Tips, TipsCategory
from app.models.motivation_model import Motivation
from app.models.admin_model import Admin
# ---------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    # --- PENTING: Kita Pakai Versi HEAD (Aman) ---
    # Memperbaiki CORS agar mengizinkan semua akses
    # Jangan pakai settings.allowed_origins dulu biar gak error di Hugging Face
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Mengizinkan semua origin
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
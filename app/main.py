from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine

# --- PENTING: Import semua Model di sini biar Tabel Otomatis Dibuat ---
# Kalau baris ini dihapus, tabel di database gak bakal muncul!
from app.models.user_model import User
from app.models.diary_model import Diary
from app.models.stress_log_model import StressLevel  # Ingat, class-nya namanya StressLevel
from app.models.bookmark_model import Bookmark
from app.models.tips_model import Tips, TipsCategory
from app.models.motivation_model import Motivation
from app.models.admin_model import Admin
# ---------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        # Fungsi ini yang bikin tabel di MySQL berdasarkan import di atas
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router, prefix=settings.api_prefix)

    return app

app = create_app()
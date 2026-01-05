from fastapi import APIRouter

# 1. Import route lama & ML (Punya Kamu - HEAD)
from app.routes.auth_route import router as auth_router
from app.routes.motivation_route import router as motivation_router
from app.routes.tips_route import router as tips_router
from app.routes.predict_route import router as predict_router  # <-- PENTING: ML jangan sampai hilang

# 2. Import route User Auth (Punya Teman - Incoming)
from app.routes.user_auth_route import router as user_auth_router

api_router = APIRouter()

# 3. Masukkan semua route ke router utama
api_router.include_router(auth_router)          # Admin Auth
api_router.include_router(motivation_router)    # Motivation
api_router.include_router(tips_router)          # Tips
api_router.include_router(predict_router)       # Predict Stress (ML) - WAJIB ADA
api_router.include_router(user_auth_router)     # User Auth (Register/Login) - FITUR BARU
from fastapi import APIRouter

# Import route lama & ML
from app.routes.auth_route import router as auth_router
from app.routes.motivation_route import router as motivation_router
from app.routes.tips_route import router as tips_router
from app.routes.predict_route import router as predict_router
from app.routes.user_auth_route import router as user_auth_router
from app.routes.bookmark_route import router as bookmark_router

# --- TAMBAHKAN INI ---
from app.routes.stress_route import router as stress_router 

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(motivation_router)
api_router.include_router(tips_router)
api_router.include_router(predict_router)
api_router.include_router(user_auth_router)
api_router.include_router(bookmark_router)

# --- DAN INI ---
api_router.include_router(stress_router)
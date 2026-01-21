from fastapi import APIRouter

# Import route lama & ML
from app.routes.auth_route import router as auth_router
from app.routes.motivation_route import router as motivation_router
from app.routes.tips_route import router as tips_router
from app.routes.predict_route import router as predict_router
from app.routes.predict_forecast_route import router as predict_forecast_router
from app.routes.forecast_route import router as forecast_router
from app.routes.user_auth_route import router as user_auth_router
from app.routes.bookmark_route import router as bookmark_router
from app.routes.diary_route import router as diary_router
from app.routes.stress_route import router as stress_router
from app.routes.admin_diary_route import router as admin_diary_router # 👈 Import baru


# --- 1. IMPORT ROUTE BARU ---
from app.routes.admin_user_route import router as admin_user_router 

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(motivation_router)
api_router.include_router(tips_router)
api_router.include_router(predict_router)
api_router.include_router(predict_forecast_router)
api_router.include_router(forecast_router)
api_router.include_router(user_auth_router)
api_router.include_router(bookmark_router)
api_router.include_router(stress_router)
api_router.include_router(diary_router)
api_router.include_router(admin_user_router)# ... import lainnya ...
api_router.include_router(admin_diary_router) # 👈 Daftarkan

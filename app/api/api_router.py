from fastapi import APIRouter

from app.routes.auth_route import router as auth_router
from app.routes.motivation_route import router as motivation_router
from app.routes.tips_route import router as tips_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(motivation_router)
api_router.include_router(tips_router)

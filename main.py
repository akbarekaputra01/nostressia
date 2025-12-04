from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routes.motivation_route import router as motivation_router
from app.routes.auth_route import router as auth_router
from app.routes.tips_route import router as tips_router   # <-- tambahkan ini

app = FastAPI(title="Nostressia API")

# Create tables if not exist
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(auth_router, prefix="/api")           # login admin
app.include_router(motivation_router, prefix="/api")     # motivation CRUD
app.include_router(tips_router, prefix="/api")           # <-- tips CRUD

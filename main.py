from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.routes.motivation_route import router as motivation_router
from app.routes.auth_route import router as auth_router  # tambah router auth

app = FastAPI(title="Nostressia API")

# Buat tabel jika belum ada
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routes
app.include_router(auth_router, prefix="/api")        # prefix /api untuk login
app.include_router(motivation_router, prefix="/api")  # prefix /api untuk motivation

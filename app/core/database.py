# app/core/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

# URL koneksi MySQL
DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Engine & Session
engine = create_engine(
    DATABASE_URL,
    echo=False,          # Matikan echo biar lebih ringan
    pool_size=2,         # Maks 2 koneksi
    max_overflow=0,      # Tidak boleh buka koneksi tambahan
    pool_recycle=1800,   # Tutup koneksi idle setelah 30 menit
    pool_pre_ping=True,  # Cek koneksi sebelum dipakai
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Fungsi dependency untuk route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

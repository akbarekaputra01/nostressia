import sys
import os
import logging
from sqlalchemy import create_engine, text

# 1. SETUP PATH
# Menambahkan folder saat ini ke path agar bisa import model dari folder 'app'
sys.path.append(os.getcwd())

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# 2. CONFIG DATABASE (via environment variables)
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

def require_env(value, name):
    if not value:
        logger.error("❌ Missing required environment variable: %s", name)
        sys.exit(1)
    return value


DB_USER = require_env(DB_USER, "DB_USER")
DB_PASSWORD = require_env(DB_PASSWORD, "DB_PASSWORD")
DB_HOST = require_env(DB_HOST, "DB_HOST")
DB_NAME = require_env(DB_NAME, "DB_NAME")

# String koneksi manual
SQLALCHEMY_DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# 3. BUAT KONEKSI (ENGINE) SENDIRI
# echo=True supaya kamu bisa liat log SQL yang jalan di terminal
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# 4. IMPORT MODEL UNTUK SCHEMA
# Kita butuh 'Base' dan 'User' dari kodinganmu untuk tau struktur tabel baru (yg ada avatarnya)
try:
    from app.core.database import Base
    from app.models.user_model import User
    # Import model lain jika perlu direfresh juga
    from app.models.diary_model import Diary
    from app.models.stress_log_model import StressLevel
    from app.models.motivation_model import Motivation
    from app.models.tips_model import Tips
    from app.models.bookmark_model import Bookmark
    logger.info("✅ Berhasil memuat Model dari aplikasi.")
except ImportError as e:
    logger.error("❌ Gagal import model: %s", e)
    logger.error(
        "Pastikan kamu menjalankan script ini dari folder root project (sejajar dengan folder 'app')."
    )
    sys.exit(1)

def reset_database():
    logger.info("\n🔌 Menghubungkan ke Database: %s...", DB_HOST)
    
    with engine.connect() as connection:
        logger.info("🛡️  Matikan Foreign Key Checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # --- HAPUS TABEL LAMA ---
        logger.info("🗑️  DROP TABLE users...")
        connection.execute(text("DROP TABLE IF EXISTS users;"))
        
        # Opsional: Uncomment jika ingin reset tabel lain juga
        # connection.execute(text("DROP TABLE IF EXISTS diaries;"))
        # connection.execute(text("DROP TABLE IF EXISTS stress_levels;"))

        logger.info("🛡️  Hidupkan Foreign Key Checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        connection.commit()
        logger.info("✅ Tabel lama berhasil dihapus.")

    # --- BUAT TABEL BARU ---
    logger.info("\n✨ Membuat ulang tabel berdasarkan kodingan Python terbaru...")
    # Ini akan membaca file user_model.py kamu dan bikin tabel sesuai isinya (termasuk avatar)
    Base.metadata.create_all(bind=engine)
    logger.info("🚀 SUKSES! Database sudah di-reset.")

if __name__ == "__main__":
    logger.warning("⚠️  PERINGATAN: Script ini akan menghapus data di tabel USERS!")
    logger.warning("Target Database: %s di %s", DB_NAME, DB_HOST)
    
    confirm = input("\nKetik 'gas' untuk lanjut reset: ")
    if confirm.lower() == 'gas':
        try:
            reset_database()
        except Exception as e:
            logger.error("\n❌ Terjadi Error Koneksi: %s", e)
            logger.error("Cek kembali koneksi internet atau kredensial database.")
    else:
        logger.info("Batal.")

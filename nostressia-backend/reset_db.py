import sys
import os
from sqlalchemy import create_engine, text

# 1. SETUP PATH
# Menambahkan folder saat ini ke path agar bisa import model dari folder 'app'
sys.path.append(os.getcwd())

# 2. CONFIG DATABASE (Hardcoded sesuai request)
DB_USER = "Nostressia_nationalas"
DB_PASSWORD = "2f5d922599f787ad53a4a1c7a243e24be84a5be7"
DB_HOST = "mfv81z.h.filess.io"
DB_PORT = "3306"
DB_NAME = "Nostressia_nationalas"

# String koneksi manual
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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
    print("✅ Berhasil memuat Model dari aplikasi.")
except ImportError as e:
    print(f"❌ Gagal import model: {e}")
    print("Pastikan kamu menjalankan script ini dari folder root project (sejajar dengan folder 'app').")
    sys.exit(1)

def reset_database():
    print(f"\n🔌 Menghubungkan ke Database: {DB_HOST}...")
    
    with engine.connect() as connection:
        print("🛡️  Matikan Foreign Key Checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # --- HAPUS TABEL LAMA ---
        print("🗑️  DROP TABLE users...")
        connection.execute(text("DROP TABLE IF EXISTS users;"))
        
        # Opsional: Uncomment jika ingin reset tabel lain juga
        # connection.execute(text("DROP TABLE IF EXISTS diaries;"))
        # connection.execute(text("DROP TABLE IF EXISTS stress_levels;"))

        print("🛡️  Hidupkan Foreign Key Checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        connection.commit()
        print("✅ Tabel lama berhasil dihapus.")

    # --- BUAT TABEL BARU ---
    print("\n✨ Membuat ulang tabel berdasarkan kodingan Python terbaru...")
    # Ini akan membaca file user_model.py kamu dan bikin tabel sesuai isinya (termasuk avatar)
    Base.metadata.create_all(bind=engine)
    print("🚀 SUKSES! Database sudah di-reset.")

if __name__ == "__main__":
    print("⚠️  PERINGATAN: Script ini akan menghapus data di tabel USERS!")
    print(f"Target Database: {DB_NAME} di {DB_HOST}")
    
    confirm = input("\nKetik 'gas' untuk lanjut reset: ")
    if confirm.lower() == 'gas':
        try:
            reset_database()
        except Exception as e:
            print(f"\n❌ Terjadi Error Koneksi: {e}")
            print("Cek kembali koneksi internet atau kredensial database.")
    else:
        print("Batal.")
import sys
import os
import logging
from sqlalchemy import create_engine, text

# 1. SETUP PATH
# Add the current folder to the path so we can import models from the "app" folder.
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

# Manual connection string
SQLALCHEMY_DATABASE_URL = (
    f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

# 3. CREATE A DEDICATED ENGINE
# echo=True so you can see the SQL logs in the terminal.
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# 4. IMPORT MODELS FOR SCHEMA
# We need "Base" and "User" from the app to get the latest table structures (including avatar).
try:
    from app.core.database import Base
    from app.models.user_model import User
    # Import other models if they also need to be refreshed.
    from app.models.diary_model import Diary
    from app.models.stress_log_model import StressLevel
    from app.models.motivation_model import Motivation
    from app.models.tips_model import Tips
    from app.models.bookmark_model import Bookmark
    logger.info("✅ Successfully loaded models from the application.")
except ImportError as e:
    logger.error("❌ Failed to import models: %s", e)
    logger.error(
        "Make sure you run this script from the project root (next to the 'app' folder)."
    )
    sys.exit(1)

def reset_database():
    logger.info("\n🔌 Connecting to database: %s...", DB_HOST)
    
    with engine.connect() as connection:
        logger.info("🛡️  Disabling foreign key checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        
        # --- DROP LEGACY TABLES ---
        logger.info("🗑️  Dropping users table...")
        connection.execute(text("DROP TABLE IF EXISTS users;"))
        
        # Optional: Uncomment if you want to reset other tables too.
        # connection.execute(text("DROP TABLE IF EXISTS diaries;"))
        # connection.execute(text("DROP TABLE IF EXISTS stress_levels;"))

        logger.info("🛡️  Enabling foreign key checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        connection.commit()
        logger.info("✅ Legacy tables removed.")

    # --- CREATE NEW TABLES ---
    logger.info("\n✨ Rebuilding tables from the latest Python models...")
    # This reads user_model.py and builds tables based on the latest definitions (including avatar).
    Base.metadata.create_all(bind=engine)
    logger.info("🚀 Success! The database has been reset.")

if __name__ == "__main__":
    logger.warning("⚠️  WARNING: This script will delete data from the USERS table!")
    logger.warning("Target database: %s on %s", DB_NAME, DB_HOST)
    
    confirm = input("\nType 'reset' to continue: ")
    if confirm.lower() == "reset":
        try:
            reset_database()
        except Exception as e:
            logger.error("\n❌ Connection error: %s", e)
            logger.error("Please recheck your network connection or database credentials.")
    else:
        logger.info("Cancelled.")

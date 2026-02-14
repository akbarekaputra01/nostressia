import sys
import os
import logging
from sqlalchemy import create_engine, text

# Add current folder to path for imports
sys.path.append(os.getcwd())

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

# Database configuration from environment variables
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

# Create database engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)

# Import models for schema creation
try:
    from app.core.database import Base
    from app.models.user_model import User
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
        
        # Drop legacy tables
        logger.info("🗑️  Dropping users table...")
        connection.execute(text("DROP TABLE IF EXISTS users;"))

        logger.info("🛡️  Enabling foreign key checks...")
        connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        connection.commit()
        logger.info("✅ Legacy tables removed.")

    # Create new tables from models
    logger.info("\n✨ Rebuilding tables from the latest Python models...")
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

import logging
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


if __name__ == "__main__":
    plain = input("Enter the new admin password: ")
    hashed = hash_password(plain)
    logger.info("\n=== PASSWORD HASHED ===")
    logger.info(hashed)

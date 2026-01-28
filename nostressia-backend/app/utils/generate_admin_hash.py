from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


if __name__ == "__main__":
    plain = input("Enter the new admin password: ")
    hashed = hash_password(plain)
    print("\n=== PASSWORD HASHED ===")
    print(hashed)

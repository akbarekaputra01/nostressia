from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, decode_access_token


def test_password_hashing_roundtrip():
    hashed = hash_password("SecurePassword123!")
    assert verify_password("SecurePassword123!", hashed)
    assert not verify_password("WrongPassword", hashed)


def test_jwt_token_roundtrip():
    token = create_access_token({"sub": "user@example.com"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"

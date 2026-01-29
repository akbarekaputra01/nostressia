import re

from app.utils.hashing import hash_password, verify_password
from app.utils.jwt_handler import create_access_token, decode_access_token
from app.utils.otp_generator import generate_otp
from app.utils.response import success_response


def test_password_hashing_roundtrip():
    hashed = hash_password("SecurePassword123!")
    assert verify_password("SecurePassword123!", hashed)
    assert not verify_password("WrongPassword", hashed)


def test_jwt_token_roundtrip():
    token = create_access_token({"sub": "user@example.com"})
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"


def test_generate_otp_length_and_digits():
    otp = generate_otp(6)
    assert len(otp) == 6
    assert re.fullmatch(r"\d{6}", otp)


def test_success_response_wrapper():
    payload = success_response(data={"ok": True}, message="Done")
    assert payload.success is True
    assert payload.message == "Done"
    assert payload.data == {"ok": True}

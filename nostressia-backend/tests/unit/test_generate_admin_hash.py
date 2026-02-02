from app.utils.generate_admin_hash import hash_password


def test_generate_admin_hash():
    hashed = hash_password("Password123!")
    assert hashed.startswith("$2")

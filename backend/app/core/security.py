# backend/app/core/security.py
from passlib.context import CryptContext

# Dùng PBKDF2-SHA256 cho ổn định, không cần bcrypt
_pwd_ctx = CryptContext(
    schemes=["pbkdf2_sha256"],  # <- đổi từ bcrypt/bcrypt_sha256 sang pbkdf2_sha256
    deprecated="auto"
)

def hash_password(plain: str) -> str:
    return _pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_ctx.verify(plain, hashed)

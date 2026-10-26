import bcrypt

# Standard bcrypt cost factor balancing security and clinical response latency
BCRYPT_ROUNDS = 12


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt (12 rounds). Truncates at 72 bytes per bcrypt standard."""
    if not plain_password:
        raise ValueError("Password cannot be empty.")
    pwd_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.
    Safely handles string types, null inputs, and truncates input at 72 bytes.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback to passlib if an older legacy hash scheme was somehow used
        try:
            from passlib.context import CryptContext
            ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            return ctx.verify(plain_password, hashed_password)
        except Exception:
            return False

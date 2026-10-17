from __future__ import annotations

import logging
import os
import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path

from jose import JWTError, jwt
from passlib.context import CryptContext

logger = logging.getLogger("phishguard.auth")

SECRET_KEY_FILE = Path(__file__).resolve().parent / ".secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _load_secret_key() -> str:
    env_key = os.getenv("PHISHGUARD_SECRET_KEY")
    if env_key:
        return env_key

    if SECRET_KEY_FILE.exists():
        existing = SECRET_KEY_FILE.read_text(encoding="utf-8").strip()
        if existing:
            return existing

    generated = secrets.token_urlsafe(48)
    try:
        SECRET_KEY_FILE.write_text(generated, encoding="utf-8")
        try:
            os.chmod(SECRET_KEY_FILE, 0o600)
        except OSError:
            pass
        logger.warning(
            "PHISHGUARD_SECRET_KEY was not set. Generated a local key at %s and "
            "will reuse it. Set the environment variable in production.",
            SECRET_KEY_FILE,
        )
    except OSError as exc:
        logger.warning(
            "PHISHGUARD_SECRET_KEY was not set and a local key could not be "
            "written (%s). Using an ephemeral key; tokens will not survive a "
            "restart. Set PHISHGUARD_SECRET_KEY in production.",
            exc,
        )
    return generated


SECRET_KEY = _load_secret_key()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

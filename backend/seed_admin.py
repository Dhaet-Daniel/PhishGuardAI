from __future__ import annotations

import argparse
import os
import sys

try:
    from backend.auth import pwd_context
    from backend.models import SessionLocal, User, UserRole, init_db
except ModuleNotFoundError:
    from auth import pwd_context
    from models import SessionLocal, User, UserRole, init_db

DEFAULT_ADMIN_EMAIL = "admin@phishguard.ai"


def _resolve_credentials(
    cli_email: str | None, cli_password: str | None
) -> tuple[str, str]:
    email = cli_email or os.getenv("PHISHGUARD_ADMIN_EMAIL") or DEFAULT_ADMIN_EMAIL
    password = cli_password or os.getenv("PHISHGUARD_ADMIN_PASSWORD")

    if not password:
        print(
            "Error: no admin password provided.\n"
            "Pass --password, or set the PHISHGUARD_ADMIN_PASSWORD environment variable.",
            file=sys.stderr,
        )
        raise SystemExit(2)

    if len(password) < 8:
        print(
            "Error: admin password must be at least 8 characters long.", file=sys.stderr
        )
        raise SystemExit(2)

    return email.strip().lower(), password


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create the initial PhishGuardAI admin user."
    )
    parser.add_argument("--email", help=f"Admin email (default: {DEFAULT_ADMIN_EMAIL})")
    parser.add_argument(
        "--password", help="Admin password (or set PHISHGUARD_ADMIN_PASSWORD)"
    )
    args = parser.parse_args()

    email, password = _resolve_credentials(args.email, args.password)

    init_db()
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == email).first()
        if existing_admin:
            print(f"Admin user {email} already exists.")
            return

        admin = User(
            email=email,
            hashed_password=pwd_context.hash(password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user {email} created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()

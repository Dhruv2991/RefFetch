"""
Verifies Supabase-issued JWTs sent by the frontend as a Bearer token.
Supabase signs access tokens with a project-specific secret (HS256) — we
verify against that same secret rather than calling out to Supabase on
every request, which keeps this fast and avoids a network dependency.
"""

import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or malformed Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired — please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Token missing user id")

    return user_id

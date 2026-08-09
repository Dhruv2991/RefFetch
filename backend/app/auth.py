"""
Verifies Supabase-issued JWTs sent by the frontend as a Bearer token.

Newer Supabase projects sign user session tokens with an asymmetric key
(ES256), not the legacy shared HS256 secret — the legacy secret only
still applies to older anon/service_role API keys, not actual user
sessions. So instead of verifying against a static secret, we fetch
Supabase's public JWKS (JSON Web Key Set) and verify against that, which
works correctly regardless of which signing method the project uses.
"""

import os
from functools import lru_cache

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException
from jwt import PyJWKClient

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")  # e.g. https://xxxx.supabase.co
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else None


@lru_cache(maxsize=1)
def _jwk_client() -> PyJWKClient:
    if not JWKS_URL:
        raise HTTPException(500, "Backend misconfigured: SUPABASE_URL is not set")
    return PyJWKClient(JWKS_URL)


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing or malformed Authorization header")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired — please sign in again")
    except jwt.PyJWKClientError:
        raise HTTPException(401, "Could not verify token signature")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Token missing user id")

    return user_id
# Bug Report — claude-code-tracker

## Executive Summary

Reviewed `app/`, `auth.py`, and `main.py` (9 files). Found 8 issues: 1 critical, 3 high, 3 medium, 1 low. Most serious: CORS is misconfigured to allow credentials from any origin, and the default JWT secret key is a hardcoded string that will silently be used in production if the env var isn't set. No SQL injection or ORM misuse found — all queries use SQLAlchemy's parameterized query builder.

## Critical

1. **main.py:22-28** — `CORSMiddleware` sets `allow_origins=["*"]` together with `allow_credentials=True`. This combination lets any website read authenticated responses (cookies/auth headers) from this API in browsers that don't enforce the spec strictly, and defeats CORS protection entirely. **Fix:** set `allow_origins` to an explicit allowlist from config/env, not `"*"`, when `allow_credentials=True`.

## High

2. **app/config.py:5** — `SECRET_KEY` falls back to the hardcoded string `"ccm-tracker-dev-secret-change-me"` when `TRACKER_SECRET_KEY` isn't set. If the env var is forgotten in a real deployment, JWTs are signed with a secret that's publicly visible in the repo, letting an attacker forge valid access tokens. **Fix:** raise at startup if `TRACKER_SECRET_KEY` is unset (or only allow the dev fallback in an explicit `ENV=dev` mode).

3. **auth.py:60** — In `get_current_user`, the `try/except JWTError` block ends at line 57 (`user_id = payload.get("sub")` is the last statement inside it), but `int(user_id)` is called later at line 60, outside that block. If `sub` in the token payload is non-numeric, `int()` raises an uncaught `ValueError`, producing a 500 error instead of the intended 401. **Fix:** move the `int(user_id)` cast inside the `try` block (or wrap it in its own try/except that raises `credentials_exception`).

4. **auth.py / app/routers/auth.py** — No rate limiting or lockout on `/auth/login` or `/auth/register`. This allows unlimited password-guessing and account-enumeration attempts (register returns different errors for "username taken" vs "email taken", confirming which exists). **Fix:** add per-IP/per-account rate limiting on these endpoints; consider a generic error message for registration conflicts.

## Medium

5. **auth.py:32-37** — Refresh tokens are minted (`create_refresh_token`) with a unique `jti`, but there is no `/auth/refresh` endpoint to redeem them and no server-side store to check or revoke a `jti`. The refresh token is effectively a second long-lived (7-day) bearer credential with no revocation mechanism — if leaked, it can't be invalidated before expiry. **Fix:** either implement the refresh endpoint with a persisted/revocable `jti` allowlist or drop refresh-token issuance until that's built.

6. **app/routers/projects.py:42-52, app/routers/sessions.py:59-68** — `list_projects` and `list_sessions` have no pagination (`limit`/`offset`), so a user with many rows gets the entire table back in one response. Not exploitable today, but the growth path here is unbounded response size and DB load. **Fix:** add `limit`/`offset` query params.

7. **auth.py:61** — `models.User.is_active == True` should be `models.User.is_active.is_(True)` per SQLAlchemy style; harmless today but a lint/quality issue that some SQLAlchemy configurations flag or handle unexpectedly with certain dialects.

## Low

8. **app/costing.py:14** — `model.lower()` will raise `AttributeError` if `model` is ever `None`. Currently `SessionIn.model` is a required `str` field so Pydantic prevents this, but `estimate_cost_usd` has no guard if called from elsewhere in the future. **Fix:** not urgent; note as a fragility if the function is reused outside the current call site.

## Notes

- No use of raw SQL string formatting anywhere — SQLAlchemy's query builder is used consistently, so no SQL injection surface was found.
- Password hashing (`bcrypt` via `passlib`) and access-token expiry are implemented correctly.
- All `/projects` and `/sessions` endpoints correctly scope queries by `current_user.id`, so no cross-user IDOR was found in the reviewed files.

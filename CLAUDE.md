# Claude Code Session Tracker

Teaching FastAPI app for Claude Code Masterclass.

Track Claude Code sessions, projects, token usage, and estimated cost.

## Stack

- FastAPI + SQLAlchemy + SQLite
- JWT auth (`auth.py` helpers + `/auth` routes)
- pytest

## Commands

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest -q
```

Health check: `GET /health` → `{"status":"ok"}`

Docs: http://127.0.0.1:8000/docs

## Key files

- `main.py` — app entry
- `auth.py` — password hashing + JWT
- `app/costing.py` — teaching cost formula (not Anthropic billing)
- `app/routers/` — auth, projects, sessions, analytics

## Workflows

1. Small change → hit `/docs` → run `pytest -q`
2. Do not invent extra features during a lesson
3. No secrets in git — `TRACKER_SECRET_KEY` via env

## Subagents

Project agents live in `.claude/agents/`.

- `usage-scout` — read-only. Finds where sessions and cost are calculated. Use when locating usage/cost code.
- `auth-guard` — read-only. Reviews JWT and password helpers. Use when checking auth.py or `/auth` routes.

Do not ask these agents to edit files. They cannot write.

Built-in Explore is enough for a one-off search. Use a custom subagent when the same job repeats with the same instructions.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

The only quality gate is `pytest -q`.

Do not mark a change done until that command passes locally.

Do not remove tests to make CI green.

## MCP

Project server: `claude-code-docs` in `.mcp.json`.

Use it for Claude Code product questions (timeouts, hooks, MCP itself).

Do not grep this repo for Anthropic product docs. They are not here.

Do not add servers that need secrets without putting the token in the environment, not in git.

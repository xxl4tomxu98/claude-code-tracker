# Claude Code Tracker

**A teaching app for [Claude Code Masterclass](https://claudecodemasterclass.com)** — track Claude Code sessions, projects, token usage, and cost so you can see how real agent work behaves in production-shaped code.

Built and evolved **with Claude Code**. Students use this repo to practice shipping a small FastAPI product: auth, CRUD, analytics, and tests.

---

## Product

| Goal | What you learn |
|------|----------------|
| Product thinking | Turn “I want cost visibility” into routes, models, and UX |
| Claude Code workflows | Scaffold, iterate, and verify with the agent in a real codebase |
| Backend fundamentals | FastAPI, JWT auth, SQLAlchemy, pytest |
| Cost awareness | Sessions → tokens → dollars — the feedback loop every serious user needs |

This is **not** a replacement for Anthropic’s billing UI. It is a **course project** you can run, break, and extend.

---

## How it Works

Claude Code Session Tracker is a small API and browser dashboard for:

- **Auth** — register / login with JWT access + refresh tokens  
- **Projects** — group related Claude Code work  
- **Sessions** — record session runs against a project  
- **Analytics** — summarize usage and estimated cost by model / project  

Interactive API docs ship with the app:

| URL | Purpose |
|-----|---------|
| `/` | Tracker dashboard |
| `/docs` | Swagger UI |
| `/redoc` | ReDoc |
| `/health` | Health check |

---

## Stack

- **Python 3.10+**
- **[FastAPI](https://fastapi.tiangolo.com/)** — HTTP API  
- **SQLAlchemy** — persistence  
- **JWT** (`python-jose`) + **passlib/bcrypt** — auth  
- **pytest** + **TestClient** — API tests  

---

## Layout

```text
claude-code-tracker/
├── main.py                 # FastAPI app entry
├── auth.py                 # Password hashing + JWT helpers (lesson artifact)
├── conftest.py             # pytest fixtures (TestClient, auth headers)
├── app/
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── costing.py
│   └── routers/
│       ├── auth.py
│       ├── projects.py
│       ├── sessions.py
│       └── analytics.py
├── frontend/               # Vanilla HTML, CSS, and JavaScript dashboard
├── requirements.txt
└── README.md
```

The `app/` package is present. Run the quick start below, then `pytest -q`.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/Njengah/claude-code-tracker.git
cd claude-code-tracker

# 2. Virtualenv
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install
pip install -r requirements.txt

# 4. Run
uvicorn main:app --reload --port 8000
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) for the dashboard or
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for the API.

### Dashboard flow

1. Create an account or sign in.
2. Create a project to group related Claude Code work.
3. Log a session with its model and input/output token counts.
4. Review the live session, token, and estimated-cost summary.

The dashboard stores the access token in browser `localStorage`. Its usage data
comes from the authenticated API; the cost is the teaching estimate defined in
`app/costing.py`, not an Anthropic billing total.

### Smoke test

```bash
curl http://127.0.0.1:8000/health
# → {"status":"ok"}
```

### Run tests

```bash
pytest -q
```

---

## Using this in Claude Code Masterclass

1. Clone the repo into a clean folder.  
2. Open it in your editor and start Claude Code in that directory.  
3. Follow the CCM lesson for that week (auth → projects → sessions → analytics).  
4. Prefer **small verified steps**: implement → hit `/docs` → run `pytest`.  
5. Stretch goals (after the base API works): simple dashboard, CSV export, or import from local Claude Code logs.

**Course site:** [claudecodemasterclass.com](https://claudecodemasterclass.com)  
**Members area:** [claudecodemasterclass.com/members](https://claudecodemasterclass.com/members/)

---

## API surface (overview)

| Area | Router | Responsibility |
|------|--------|----------------|
| Auth | `/auth/*` | Register, login, tokens |
| Projects | `/projects/*` | Create and list projects |
| Sessions | `/sessions/*` | Attach session data to projects |
| Analytics | `/analytics/*` | Aggregates and cost views |

Exact paths and payloads are defined in OpenAPI at `/docs` once the app is running.

---

## Status

| Item | State |
|------|--------|
| Teaching purpose | Active — CCM curriculum project |
| FastAPI entry (`main.py`) | In repo |
| Auth helpers + pytest fixtures | In repo |
| Full `app/` package | Present (auth, projects, sessions, analytics) |
| Production hosting | Out of scope for v1 (local learning tool) |

---

## Contributing

This is a **teaching repository**. Prefer:

- Clear commits tied to a lesson or feature (`feat: project create endpoint`)  
- Tests for new routes  
- No secrets in the repo — use env vars for `SECRET_KEY` and DB URLs  

Issues and PRs from students are welcome when they improve clarity for the next cohort.

---

## License

Educational use for Claude Code Masterclass students unless otherwise noted. Ask before republishing the full curriculum walkthrough as your own course.

---

## Let's Connect

 [Claude Code Masterclass](https://claudecodemasterclass.com) · [GitHub @Njengah](https://github.com/Njengah)

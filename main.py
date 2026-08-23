from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import auth, projects, sessions, analytics

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Claude Code Session Tracker",
    description="Track and analyze your Claude Code sessions, costs, and model performance",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sessions.router)
app.include_router(analytics.router)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/", include_in_schema=False)
def root():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

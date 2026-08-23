import os


class Settings:
    SECRET_KEY: str = os.getenv("TRACKER_SECRET_KEY", "ccm-tracker-dev-secret-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = os.getenv("TRACKER_DATABASE_URL", "sqlite:///./tracker.db")


settings = Settings()

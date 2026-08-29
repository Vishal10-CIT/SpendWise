from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import os


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "SpendWise — Smart College Student Finance Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"

    # Database Configuration (SQLite default for zero-setup local dev, PostgreSQL for production/docker)
    DATABASE_URL: str = "sqlite:///./spendwise.db"

    @field_validator("DATABASE_URL", mode="before")
    def format_postgres_url(cls, v):
        if isinstance(v, str):
            # If standard postgresql:// is provided, convert to postgresql+psycopg:// for SQLAlchemy 2.0
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+psycopg://", 1)
            elif v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg://", 1)
        return v

    # JWT Authentication
    JWT_SECRET_KEY: str = "spendwise_secret_jwt_key_secure_change_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://localhost:80",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        return []


settings = Settings()

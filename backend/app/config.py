from pydantic_settings import BaseSettings
import os
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Transaction Limits (in INR)
    MAX_TRANSACTION_AMOUNT: float = 100000.00
    MAX_DAILY_TRANSACTION_AMOUNT: float = 500000.00

    # CORS
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()

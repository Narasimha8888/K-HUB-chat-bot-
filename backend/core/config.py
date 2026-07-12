import os
from pydantic_settings import BaseSettings
from functools import lru_cache

# Disable ChromaDB telemetry to prevent PostHog errors
os.environ["ANONYMIZED_TELEMETRY"] = "False"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Studymode AI Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./studymode.db"
    DEBUG: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

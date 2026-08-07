from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    """
    Application Settings configuration utilizing Pydantic Settings.
    Environment variables are automatically loaded from a .env file if it exists.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/fit_chart_gen",
        description="PostgreSQL connection string"
    )

    # Security
    JWT_SECRET_KEY: str = Field(
        default="super_secret_key_change_me_in_production",
        description="Key used to sign authentication JWT tokens"
    )
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="Signing algorithm for JWT tokens"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=1440,
        description="Expiration time for access tokens in minutes"
    )

    # AI & Services
    GEMINI_API_KEY: str = Field(
        default="",
        description="API key for Google Gemini Generative AI services"
    )

# Singleton settings instance
settings = Settings()

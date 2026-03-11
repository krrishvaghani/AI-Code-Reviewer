from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Gemini API key — loaded from .env file
    gemini_api_key: str = ""

    # Model to use for code review
    gemini_model: str = "gemini-2.0-flash"

    # Controls whether to use the real Gemini API or the mock service
    use_mock: bool = False

    # CORS — comma-separated origins allowed to call the API
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()

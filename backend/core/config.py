from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -----------------------------------------------------------------------
    # AI Provider selection: "openai" | "gemini"
    # -----------------------------------------------------------------------
    ai_provider: str = "gemini"

    # -----------------------------------------------------------------------
    # OpenAI settings
    # -----------------------------------------------------------------------
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # -----------------------------------------------------------------------
    # Gemini settings
    # -----------------------------------------------------------------------
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # -----------------------------------------------------------------------
    # Dev / testing toggle
    # Set USE_MOCK=true to skip the real API and return mock responses
    # -----------------------------------------------------------------------
    use_mock: bool = False

    # -----------------------------------------------------------------------
    # CORS — comma-separated origins allowed to call the API
    # -----------------------------------------------------------------------
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

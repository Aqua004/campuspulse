from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CampusPulse API"
    database_url: str = "sqlite:///./campuspulse.db"
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = "change-this-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    initial_admin_name: str = "Campus Admin"
    initial_admin_email: str = "admin@campuspulse.example"
    initial_admin_password: str = "change-admin-password"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]


settings = Settings()

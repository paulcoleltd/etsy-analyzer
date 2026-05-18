from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8004
    database_url: str = "postgresql://postgres:password@localhost:5432/etsy_analyzer"
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str = ""

    # Grade thresholds
    grade_a: float = 85.0
    grade_b: float = 70.0
    grade_c: float = 55.0
    grade_d: float = 40.0

    # Bulk job settings
    bulk_batch_size: int = 10
    bulk_max_listings: int = 500


settings = Settings()

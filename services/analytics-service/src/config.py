from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8001
    database_url: str = "postgresql://postgres:password@localhost:5432/etsy_analyzer"
    redis_url: str = "redis://localhost:6379"

    etsy_api_key: str = ""
    token_encryption_key: str = ""   # 32-byte hex key

    etsy_api_base: str = "https://openapi.etsy.com/v3"

    # Cache TTLs
    cache_ttl_overview: int = 600       # 10 min
    cache_ttl_listings: int = 600
    cache_ttl_revenue: int = 1800       # 30 min


settings = Settings()

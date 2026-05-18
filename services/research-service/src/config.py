from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8002
    database_url: str = "postgresql://postgres:password@localhost:5432/etsy_analyzer"
    redis_url: str = "redis://localhost:6379"
    elasticsearch_url: str = "http://localhost:9200"

    # Cache TTLs (seconds)
    cache_ttl_search: int = 3600 * 6     # 6 h
    cache_ttl_niche: int = 3600 * 6      # 6 h
    cache_ttl_listing: int = 3600 * 2    # 2 h
    cache_ttl_trending: int = 3600 * 12  # 12 h


settings = Settings()

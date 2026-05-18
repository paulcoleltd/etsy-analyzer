from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8003
    elasticsearch_url: str = "http://localhost:9200"
    redis_url: str = "redis://localhost:6379"
    anthropic_api_key: str = ""

    cache_ttl_keyword: int = 3600 * 24    # 24 h
    cache_ttl_cluster: int = 3600 * 12    # 12 h
    cache_ttl_suggest: int = 3600 * 6     # 6 h


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:password@localhost:5432/etsy_analyzer"
    redis_url: str = "redis://localhost:6379"
    elasticsearch_url: str = "http://localhost:9200"

    brightdata_username: str = ""
    brightdata_password: str = ""
    brightdata_host: str = "brd.superproxy.io"
    brightdata_port: int = 22225

    enable_scraping: bool = True

    # Anti-detection
    min_delay_seconds: float = 1.5
    max_delay_seconds: float = 4.5
    rotate_proxy_every_n: int = 10

    # ML model paths
    revenue_model_path: str = "models/revenue_model.joblib"


settings = Settings()

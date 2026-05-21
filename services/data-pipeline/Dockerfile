FROM python:3.12-slim
WORKDIR /app

# System deps for Playwright + Postgres + ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl wget gnupg \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

COPY services/data-pipeline/pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        playwright==1.45.0 \
        httpx==0.27.0 \
        pydantic==2.8.2 \
        pydantic-settings==2.3.4 \
        asyncpg==0.29.0 \
        psycopg2-binary==2.9.9 \
        "elasticsearch[async]==8.14.0" \
        redis==5.0.7 \
        bullmq==0.3.0 \
        "scikit-learn==1.5.1" \
        xgboost==2.1.0 \
        numpy==1.26.4 \
        pandas==2.2.2 \
        joblib==1.4.2 \
        python-dotenv==1.0.1 \
        structlog==24.4.0 \
        tenacity==8.5.0 \
        fake-useragent==1.5.1

# Install Playwright browsers
RUN playwright install --with-deps chromium

COPY services/data-pipeline/src/ ./src/
# models/ placeholder — ML models loaded at runtime or mounted via volume
RUN mkdir -p ./models

# Default mode: worker (can be overridden via DATA_PIPELINE_MODE env var)
ENV DATA_PIPELINE_MODE=worker
CMD ["python", "-m", "src.main"]

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/analytics-service/pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        fastapi==0.111.1 \
        "uvicorn[standard]==0.30.3" \
        httpx==0.27.0 \
        pydantic==2.8.2 \
        pydantic-settings==2.3.4 \
        asyncpg==0.29.0 \
        "redis[hiredis]==5.0.7" \
        structlog==24.4.0 \
        python-dotenv==1.0.1 \
        tenacity==8.5.0 \
        cryptography==42.0.8

COPY services/analytics-service/src/ ./src/

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

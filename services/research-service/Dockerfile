FROM python:3.12-slim
WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps from pyproject.toml
COPY services/research-service/pyproject.toml ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        fastapi==0.111.1 \
        "uvicorn[standard]==0.30.3" \
        httpx==0.27.0 \
        pydantic==2.8.2 \
        pydantic-settings==2.3.4 \
        "elasticsearch[async]==8.14.0" \
        "redis[hiredis]==5.0.7" \
        asyncpg==0.29.0 \
        numpy==1.26.4 \
        scikit-learn==1.5.1 \
        joblib==1.4.2 \
        structlog==24.4.0 \
        python-dotenv==1.0.1

COPY services/research-service/src/ ./src/

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

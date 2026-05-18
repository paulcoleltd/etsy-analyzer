FROM python:3.12-slim

WORKDIR /app

# System deps for Playwright + Postgres client
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget ca-certificates gnupg \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY services/data-pipeline/pyproject.toml .
RUN pip install --no-cache-dir hatch && \
    pip install --no-cache-dir -e ".[dev]"

# Install Playwright browsers
RUN playwright install chromium && playwright install-deps chromium

# Copy source
COPY services/data-pipeline/src ./src

ENV DATA_PIPELINE_MODE=worker
ENV PYTHONPATH=/app

CMD ["python", "-m", "src.main"]

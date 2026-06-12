# syntax=docker/dockerfile:1
# ---- Backend (FastAPI) image ----
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=utf-8 \
    PYTHONUTF8=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build deps kept minimal: wheels exist for psycopg2-binary / pyswisseph / cryptography.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install the pinned lock first (best layer caching + reproducible builds).
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Then copy the source and install the package itself without re-resolving deps.
COPY pyproject.toml README.md ./
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./alembic.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN pip install --no-deps . \
    && chmod +x /usr/local/bin/entrypoint.sh

# Run as an unprivileged user.
RUN useradd --create-home --uid 10001 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# tini reaps zombies; entrypoint runs migrations then launches uvicorn.
ENTRYPOINT ["tini", "--", "/usr/local/bin/entrypoint.sh"]

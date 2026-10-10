# syntax=docker/dockerfile:1
# ---- Backend (FastAPI) image ----
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONIOENCODING=utf-8 \
    PYTHONUTF8=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---- wheels: compile anything without a usable wheel, in a throwaway stage ----
#
# THE COMMENT THAT USED TO SIT HERE WAS WRONG, and it was load-bearing: "Build
# deps kept minimal: wheels exist for psycopg2-binary / pyswisseph /
# cryptography." pyswisseph publishes wheels for cp36–cp311 only — there is no
# cp312 wheel in ANY of its releases, on any platform — and this image is
# python:3.12-slim. pip therefore fell back to the sdist and died on
# `[Errno 2] No such file or directory: 'gcc'`.
#
# So the api image could not be built, at all, from any machine. What hid it:
#
#   - no CI job builds this file. `web-image` builds web/Dockerfile; nothing
#     builds this one, which is exactly how web/Dockerfile came to be broken in
#     three ways at once while every other gate stayed green (P0-5);
#   - the backend test job DOES run Python 3.12 and installs the same
#     requirements.txt successfully, because ubuntu-latest ships gcc and
#     compiles the sdist. A green CI install therefore said nothing about this
#     image.
#
# Compiling in a separate stage rather than adding gcc to the runtime keeps the
# toolchain out of the image that serves public traffic. Keeping Python 3.12 and
# pyswisseph — rather than moving to 3.14 and the swisseph-ffi branch — keeps
# production on the backend CI actually tests; docs/vinaadi-fix-spec.md requires
# every ephemeris change to be verified on both bindings, and swapping the
# production binding is not a deployment detail.
FROM base AS wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential python3-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
# Wheels for everything, so the runtime install needs no index and no compiler.
RUN pip wheel --wheel-dir=/wheels -r requirements.txt

# ---- runtime ----
FROM base AS runtime

# Install the pinned lock first (best layer caching + reproducible builds).
# --no-index: the wheelhouse is the only source, so a runtime build cannot
# silently reach the network and resolve something the wheels stage did not see.
COPY requirements.txt ./
COPY --from=wheels /wheels /wheels
RUN pip install --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Then copy the source and install the package itself without re-resolving deps.
COPY pyproject.toml README.md ./
COPY app ./app
# Swiss Ephemeris data files (owner ruling 2026-10-01). Without them every
# calculation silently falls back to the Moshier analytic ephemeris.
COPY ephe ./ephe
ENV JOTHIDAM_SWISSEPH_PATH=/app/ephe
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

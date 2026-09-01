# syntax=docker/dockerfile:1
# ---- Web (Next.js) image, using Next "standalone" output ----
#
# THE BUILD CONTEXT IS THE REPO ROOT, NOT web/.
#
# This is a pnpm workspace. web/package.json depends on @vinaadi/shared and
# @vinaadi/design-tokens as `workspace:*`, which can only resolve when
# pnpm-lock.yaml, pnpm-workspace.yaml and packages/ are all inside the build
# context. Building with `web/` as the context — as this file used to assume —
# cannot work, with any package manager.
#
#   docker build -f web/Dockerfile -t vinaadi-web .
#
# docker-compose.app.yml passes exactly that. The context is scoped by
# `web/Dockerfile.dockerignore`, which BuildKit prefers over the root
# `.dockerignore` for this Dockerfile — the root one is tuned for the API image
# and excludes web/ entirely.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm version comes from the root package.json `packageManager` field, so the
# image, CI and a developer's machine cannot drift apart. That pin is pnpm 11.8.0,
# whose engines require Node >=22.13 — node:20-slim fails at install with
# ERR_UNKNOWN_BUILTIN_MODULE, which is what this image used to be built on.
RUN corepack enable
WORKDIR /repo

# ---- deps: manifests + lockfile only, so a source edit does not reinstall ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY web/package.json web/
COPY packages/shared/package.json packages/shared/
COPY packages/design-tokens/package.json packages/design-tokens/
# mobile is not built here, but pnpm validates the lockfile against every
# workspace manifest — a missing one is reported as a stale lockfile.
COPY mobile/package.json mobile/
# The store cache survives between builds, so a retry does not re-download 1442
# packages. The raised timeout is for pnpm 11's supply-chain policy pass, which
# makes one registry request per lockfile entry and trips the 60s default on a
# cold store.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter jothidam-ai-web... \
      --config.store-dir=/pnpm/store \
      --config.fetch-timeout=300000 \
      --config.fetch-retries=5

# ---- builder ----
FROM base AS builder
# Turns on `output: "standalone"` in next.config.mjs. It is opt-in because the
# standalone bundle is assembled from symlinks, which a non-elevated Windows
# shell cannot create — always-on broke `next build` for developers on Windows.
# Inside this Linux image it is exactly what we want.
ENV NEXT_OUTPUT_STANDALONE=1
ENV NEXT_TELEMETRY_DISABLED=1
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
# node_modules first (symlinks into the .pnpm store are preserved by COPY
# --from), then the sources over the top. node_modules is excluded from the
# build context, so the second COPY cannot clobber the first.
COPY --from=deps /repo ./
COPY . .
RUN pnpm --filter jothidam-ai-web build
RUN if [ -n "$SENTRY_AUTH_TOKEN" ] && [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ]; then \
      cd web && \
      pnpm exec sentry-cli sourcemaps inject .next && \
      pnpm exec sentry-cli sourcemaps upload .next --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"; \
    else \
      echo "Skipping Sentry sourcemap upload; Sentry build args are not set."; \
    fi

# ---- runner ----
FROM node:22-slim AS runner
WORKDIR /app
# HOSTNAME: Docker sets it to the container id, and Next's standalone server
# binds to $HOSTNAME. Without this it tries to bind to a name that does not
# resolve inside the container, and never accepts a connection.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN useradd --create-home --uid 10001 nextjs
# Standalone output mirrors the tracing root, so the server lands at web/server.js
# with the traced node_modules beside it. Static assets and public/ are not traced
# and must be copied in alongside, at the paths the server expects.
COPY --from=builder /repo/web/.next/standalone ./
COPY --from=builder /repo/web/.next/static ./web/.next/static
COPY --from=builder /repo/web/public ./web/public
USER nextjs
EXPOSE 3000
CMD ["node", "web/server.js"]

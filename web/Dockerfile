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
# @vinaadi/design-tokens declares `prepare: node build.js`, and pnpm runs a
# workspace project's prepare script as part of install. Its manifest alone is
# not enough: the script and the token source it reads have to be present, or
# the deps stage dies with MODULE_NOT_FOUND *after* all 855 packages have
# already been downloaded. build.js reads only tokens.json, so these two files
# are the whole input.
COPY packages/design-tokens/build.js packages/design-tokens/tokens.json packages/design-tokens/
# This install used to hang forever, and the two reasons are worth recording
# because neither is what the previous diagnosis assumed (bandwidth: "ten minutes
# on a normal connection"). The symptom was always identical — it prints
# `resolved 855, reused 0, downloaded 0` and then transfers nothing at all, for
# 240s locally and for 4h47m on a GitHub-hosted runner, with an empty store to
# show for it. Measured, not guessed: a host NIC counter validated against a
# known 28MB container pull showed 0.0MB moving during those stalls.
#
# 1. --network-concurrency=4. At pnpm's default of 16 the install stalls inside
#    buildkit. /proc showed pnpm holding 18 threads and ~14 sockets open to :443
#    with nothing flowing. The identical command under `docker run` finishes in
#    ~90s and fills an 800MB store, so it is neither the registry nor the link —
#    buildkit's network namespace does not survive that fan-out. Capped at 4,
#    downloads begin within 5 seconds. A single sequential request always
#    succeeded, which is why a naive connectivity check proves nothing here.
#
# 2. No --mount=type=cache for the store. The mount was an optimisation ("a retry
#    does not re-download 1442 packages"), but with it present the install stalls
#    even at concurrency 4, and the mount itself stays 4.0K across nine builds —
#    nothing was ever cached by it. It also buys nothing in CI, where cache
#    mounts are runner-local and every run starts fresh; layer caching is already
#    handled by cache-from/cache-to type=gha in the workflow.
#
# Mind the flag spelling. `--network-concurrency=4` is a real CLI option;
# `--config.network-concurrency=4` passes the value as a *string* and pnpm
# rejects it outright ("Expected `concurrency` to be a number from 1 and up,
# got `4` (string)"). The `--config.` forms below are strings for the same
# reason — they are tolerated, but do not assume they take effect.
RUN pnpm install --frozen-lockfile --filter jothidam-ai-web... \
      --network-concurrency=4 \
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

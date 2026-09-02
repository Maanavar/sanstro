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
# This install stalls. The stall is real and environment-independent — the
# symptom is byte-identical on a development machine and on a GitHub-hosted
# runner, which sat at
#
#   Progress: resolved 855, reused 0, downloaded 0, added 0
#
# for 4h47m. Measured, not guessed: a host NIC counter, validated first against a
# known ~28MB container pull, showed 0.0MB moving during the stall. It is not
# slow. It transfers nothing. The identical command under `docker run` finishes
# in ~90s and fills an 800MB store, so it is neither the registry nor the link.
# That also retires the earlier bandwidth explanation ("ten minutes on a normal
# connection"), which was testable and is false.
#
# WHAT CAUSES IT IS NOT ESTABLISHED. The two flags below correlate with one good
# run each; they are mitigations under test, not a diagnosis. Read them that way
# before building anything on top of them.
#
# 1. --network-concurrency=4. /proc showed pnpm holding 18 threads and ~14
#    sockets open to :443 with nothing flowing, and capping the fan-out started
#    downloads within 5 seconds — in an isolated repro twice, and in one full
#    build. It has not reproduced since: a later build with the cap in place
#    stalled anyway. One good run, not a controlled result.
#
# 2. No --mount=type=cache for the store. What is proven about the mount is only
#    that it cached nothing — 4.0K and zero entries after nine builds. It is
#    dropped on that, and because cache mounts are runner-local so it buys
#    nothing in CI where layer caching is already cache-from/cache-to type=gha.
#    It is NOT dropped on the claim that it caused the stall: a build with no
#    mount and the cap in place still stalled 7 minutes at `downloaded 0` after
#    a full cache prune.
#
# Disproven, recorded so nobody spends a day re-deriving it: MTU. A smaller MTU
# inside buildkit than on the working `docker run` path would have explained
# small metadata fetches succeeding while large tarballs hang at zero bytes, in
# both environments at once. Probed directly — a buildkit RUN step and
# `docker run` both report 1500. Not the cause.
#
# So the install is made SURVIVABLE rather than understood: three attempts, each
# with its own timeout. A working install is 90s to a few minutes, so 8 minutes
# is roughly ten times the margin it needs; past that it is a hang, and a hung
# attempt now dies, says so, and hands over to a fresh process instead of
# holding the build open until the job's 30-minute cap. TERM before KILL
# (--kill-after) so pnpm can drop its store lock — a KILLed attempt leaves one
# behind and blocks the retry. This is control flow, not network behaviour, so
# it cannot confound the two mitigations above, and the log names the attempt
# that won: if attempt 1 stalls and attempt 2 succeeds on identical inputs,
# non-determinism is the finding.
#
# --reporter=append-only because pnpm's default reporter rewrites one line in
# place and prints nothing at all while stalled, which is the single reason this
# read as "slow network" for months rather than as a hang.
#
# Mind the flag spelling. `--network-concurrency=4` is a real CLI option;
# `--config.network-concurrency=4` passes the value as a *string* and pnpm
# rejects it outright ("Expected `concurrency` to be a number from 1 and up,
# got `4` (string)"). The `--config.` forms below are strings for the same
# reason — they are tolerated, but do not assume they take effect.
RUN set -eu; \
    for attempt in 1 2 3; do \
      echo "==> pnpm install, attempt ${attempt}/3"; \
      if timeout --kill-after=30 480 pnpm install --frozen-lockfile --filter jothidam-ai-web... \
            --network-concurrency=4 \
            --reporter=append-only \
            --config.fetch-timeout=300000 \
            --config.fetch-retries=5; then \
        echo "==> pnpm install succeeded on attempt ${attempt}"; \
        exit 0; \
      fi; \
      echo "==> attempt ${attempt} failed or exceeded 480s; retrying"; \
    done; \
    echo "==> pnpm install did not complete in 3 attempts"; \
    exit 1

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

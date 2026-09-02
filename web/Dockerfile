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
# THE STALL WAS SELF-INFLICTED. Root cause, finally, from CI run 33663590784:
#
#   TypeError [ERR_INVALID_ARG_TYPE]: The "delay" argument must be of type
#   number. Received type string ('300000')
#       at AbortSignal.timeout (node:internal/abort_controller:240:5)
#       at fetch (pnpm.mjs:32177:18)
#
# `--config.fetch-timeout=300000` passed the value as a **string**. pnpm handed
# it straight to AbortSignal.timeout(), which throws for a non-number, and it
# throws on EVERY tarball fetch — before a socket is ever opened. 201 of those
# exceptions in one run, and not a single successful download.
#
# That accounts for the entire symptom, exactly, and for why every earlier theory
# failed to:
#
#   - `resolved 855` in one second, then `downloaded 0` forever. Metadata
#     resolution does not take that code path; every tarball does.
#   - 0.0MB on a host NIC counter validated against a known ~28MB pull. Nothing
#     was ever requested, so there was nothing to measure. Not slow — never sent.
#   - `docker run` with the "identical" command finishing in ~90s. It was not
#     identical. It did not carry this flag. That confound is what kept pointing
#     the investigation at buildkit.
#
# Every previous diagnosis is therefore wrong, and each is recorded here because
# each cost real time and would otherwise be re-derived:
#
#   BANDWIDTH ("ten minutes on a normal connection") — false. A GitHub-hosted
#     runner on a fast link stalled 4h47m on the byte-identical line.
#   NETWORK-CONCURRENCY 16 vs 4 — false. Three fresh attempts with the cap at 4,
#     on a clean runner, all stalled identically. The one "good run" that made
#     this look right was a run without the broken flag.
#   THE --mount=type=cache STORE — false as a cause. Dropping it changed nothing;
#     a clean build with no mount still stalled. (Still dropped, on its own
#     merits: it measured 4.0K with zero entries after nine builds, and cache
#     mounts are runner-local so they buy nothing in CI, where layer caching is
#     already cache-from/cache-to type=gha.)
#   MTU — false. A smaller MTU inside buildkit would have explained small
#     metadata fetches succeeding while large tarballs hang at zero. Probed: a
#     buildkit RUN step and `docker run` both report 1500.
#
# The lesson worth keeping: the comment that used to sit here said these
# `--config.` flags "are tolerated, but do not assume they take effect." That was
# half-right in the worst way. They are not tolerated — they are the bug — and
# the note recording the doubt sat directly above the line causing the outage for
# the entire investigation. A flag you are unsure about is a suspect, not a
# footnote.
#
# Both --config. flags are simply gone. They were also redundant: the repo
# `.npmrc` already sets fetch-timeout and fetch-retries, in a file pnpm parses
# with real types. If these ever need setting here, set them there.
#
# --network-concurrency=4 is KEPT for now, and it is NOT a fix — it was never
# shown to do anything. It stays only so this build changes one variable at a
# time against a run we can compare to. Once the image is green, remove it; it
# is a leftover of a wrong diagnosis, not a requirement.
#
# The retry loop stays as insurance, and it is what produced this diagnosis:
# three bounded attempts instead of one unbounded hang turned a 4h47m
# cancellation into a 24-minute failure with a readable stack trace. A working
# install is 90s to a few minutes, so 8 minutes is ~10x margin. TERM before KILL
# (--kill-after) so pnpm drops its store lock and the next attempt is not blocked
# by the previous corpse.
#
# --reporter=append-only is why the stack trace was visible at all: pnpm's
# default reporter rewrites one line in place, and CI captures that as silence.
# It is the single reason this read as "slow network" for months, and the reason
# it read as a TypeError within one run of turning it on.
RUN set -eu; \
    for attempt in 1 2 3; do \
      echo "==> pnpm install, attempt ${attempt}/3"; \
      if timeout --kill-after=30 480 pnpm install --frozen-lockfile --filter jothidam-ai-web... \
            --network-concurrency=4 \
            --reporter=append-only; then \
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

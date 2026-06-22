# syntax=docker/dockerfile:1
# ---- Web (Next.js) image, using Next "standalone" output ----
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN if [ -n "$SENTRY_AUTH_TOKEN" ] && [ -n "$SENTRY_ORG" ] && [ -n "$SENTRY_PROJECT" ]; then \
      npx @sentry/cli sourcemaps inject .next && \
      npx @sentry/cli sourcemaps upload .next --org "$SENTRY_ORG" --project "$SENTRY_PROJECT"; \
    else \
      echo "Skipping Sentry sourcemap upload; Sentry build args are not set."; \
    fi

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
RUN useradd --create-home --uid 10001 nextjs
# Standalone output bundles the minimal server + node_modules; static assets and
# public/ must be copied alongside it.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

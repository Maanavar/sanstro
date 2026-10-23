/**
 * The one place that resolves the server-to-server backend base URL.
 *
 * A01: `docker-compose.app.yml` supplied the web service `API_BASE_URL` while
 * every reader in `web/` read `BACKEND_URL`, whose fallback is
 * `http://127.0.0.1:8000` — loopback *inside the web container*. The stack came
 * up, the homepage returned 200, and every proxied call failed. Seven files read
 * the variable with their own inline `?? "http://127.0.0.1:8000"`, so there was
 * no single place where that could have been noticed, validated, or aliased.
 *
 * This is server-only. Next→FastAPI traffic never touches the browser, so there
 * is no `NEXT_PUBLIC_*` form of this setting and there should not be one: a
 * public variable is inlined into the client bundle at build time and would
 * publish the internal address.
 *
 * BUILD TIME vs RUN TIME. `next build` prerenders the marketing pages, which
 * fetch from this URL. Nothing here throws on a *missing* value by default, and
 * nothing here runs at module scope, precisely so that building static assets
 * does not require a configured — let alone reachable — production API. The
 * "must be configured" rule is opt-in via `requireBackendUrl()`, used by the
 * request-time proxy, which is never prerendered.
 */

export const CANONICAL_BACKEND_URL_VAR = "BACKEND_URL";

/**
 * The old compose name, accepted while a deployed `.env` may still carry it.
 *
 * Transitional, and narrow on purpose: it is the name the *mobile* app uses for
 * its own base URL (mobile/app.config.ts, mobile/eas.json), so it is read here
 * only when the canonical variable is absent, and never without saying so.
 */
export const ALIAS_BACKEND_URL_VAR = "API_BASE_URL";

/** The `next dev` convenience default: a uvicorn on the developer's own machine. */
export const DEVELOPMENT_DEFAULT = "http://127.0.0.1:8000";

export class BackendUrlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendUrlConfigError";
  }
}

export type BackendUrlSource = typeof CANONICAL_BACKEND_URL_VAR | typeof ALIAS_BACKEND_URL_VAR | "default";

export interface BackendUrlResolution {
  /** Origin only, no trailing slash — callers append `/${path}`. */
  url: string;
  source: BackendUrlSource;
  /** Operator-facing configuration problems that are not fatal. */
  warnings: string[];
}

export interface ResolveOptions {
  /**
   * Fail instead of returning {@link DEVELOPMENT_DEFAULT} when `NODE_ENV` is
   * `production` and no variable is set. For request-time code only.
   */
  requireExplicit?: boolean;
}

type Env = Record<string, string | undefined>;

/**
 * Validate and normalise one configured value.
 *
 * Returns the origin, so `http://api:8000/` and `http://API:8000` both become
 * `http://api:8000`. The proxy builds `${base}/${path.join("/")}`; a trailing
 * slash there yields `http://api:8000//health/ready`, which is a different URL,
 * and a base carrying a path prefix silently doubles it.
 */
function normalise(raw: string, varName: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new BackendUrlConfigError(
      `${varName} must be an absolute URL such as http://api:8000; got ${JSON.stringify(raw)}.`,
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BackendUrlConfigError(
      `${varName} must use http or https; got ${JSON.stringify(parsed.protocol)}.`,
    );
  }
  if (!parsed.hostname) {
    throw new BackendUrlConfigError(`${varName} has no host; got ${JSON.stringify(raw)}.`);
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new BackendUrlConfigError(
      `${varName} must be an origin with no path — callers append the path themselves. ` +
        `Got ${JSON.stringify(raw)}; use ${JSON.stringify(parsed.origin)}.`,
    );
  }
  if (parsed.search || parsed.hash) {
    throw new BackendUrlConfigError(
      `${varName} must not carry a query string or fragment; got ${JSON.stringify(raw)}.`,
    );
  }

  return parsed.origin;
}

function read(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function resolveBackendUrl(env: Env = process.env, options: ResolveOptions = {}): BackendUrlResolution {
  const canonical = read(env, CANONICAL_BACKEND_URL_VAR);
  const alias = read(env, ALIAS_BACKEND_URL_VAR);
  const warnings: string[] = [];

  if (canonical !== undefined) {
    const url = normalise(canonical, CANONICAL_BACKEND_URL_VAR);
    if (alias !== undefined && normalise(alias, ALIAS_BACKEND_URL_VAR) !== url) {
      warnings.push(
        `${CANONICAL_BACKEND_URL_VAR} and ${ALIAS_BACKEND_URL_VAR} disagree; ` +
          `using ${CANONICAL_BACKEND_URL_VAR}=${url}. Remove ${ALIAS_BACKEND_URL_VAR} from the web environment.`,
      );
    }
    return { url, source: CANONICAL_BACKEND_URL_VAR, warnings };
  }

  if (alias !== undefined) {
    warnings.push(
      `${ALIAS_BACKEND_URL_VAR} is a transitional alias; rename it to ${CANONICAL_BACKEND_URL_VAR} ` +
        `in the web service environment.`,
    );
    return { url: normalise(alias, ALIAS_BACKEND_URL_VAR), source: ALIAS_BACKEND_URL_VAR, warnings };
  }

  if (options.requireExplicit && env.NODE_ENV === "production") {
    throw new BackendUrlConfigError(
      `${CANONICAL_BACKEND_URL_VAR} is not set. In production it must name the API service ` +
        `(for the supplied Compose stack, http://api:8000). Refusing to fall back to ` +
        `${DEVELOPMENT_DEFAULT}, which is loopback inside this container.`,
    );
  }

  return { url: DEVELOPMENT_DEFAULT, source: "default", warnings };
}

/** Warn once per process rather than once per request. */
const reported = new Set<string>();

function reportOnce(warnings: string[]): void {
  for (const warning of warnings) {
    if (reported.has(warning)) continue;
    reported.add(warning);
    console.warn(`[backend-url] ${warning}`);
  }
}

/**
 * Build/prerender-safe accessor: resolves, reports configuration warnings once,
 * and returns the development default when nothing is configured.
 *
 * For server pages that already render a degraded state when the backend does
 * not answer. It does not hide a missing variable — the warning names it — but
 * it does not turn one into a failed build either.
 */
export function backendUrl(env: Env = process.env): string {
  const resolution = resolveBackendUrl(env);
  reportOnce(resolution.warnings);
  return resolution.url;
}

/**
 * Request-time accessor that refuses the development default in production.
 *
 * Throws {@link BackendUrlConfigError}. Call it inside a request handler, never
 * at module scope: a module-scope throw in a route file turns a misconfigured
 * deployment into a failed `next build`, and this is the variable most likely to
 * be absent during a build.
 */
export function requireBackendUrl(env: Env = process.env): string {
  const resolution = resolveBackendUrl(env, { requireExplicit: true });
  reportOnce(resolution.warnings);
  return resolution.url;
}

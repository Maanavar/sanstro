/**
 * A01 — the web container must be told the backend URL under the name the web
 * server actually reads.
 *
 * `docker-compose.app.yml` supplied the web service `API_BASE_URL`. Every
 * server-side reader in `web/` reads `BACKEND_URL`, whose fallback is
 * `http://127.0.0.1:8000` — localhost *inside the web container*, where no
 * FastAPI is listening. The supplied production stack therefore starts, serves
 * the homepage with HTTP 200, and fails every proxied call: login, dashboard
 * data, and the server-rendered public pages.
 *
 * Two names, no mapping between them, and nothing that could notice. The
 * existing `web-image` CI job builds the image and curls `/` — a page that
 * needs no backend at all — so a complete wiring failure passes it.
 *
 * WHAT THIS GATE CANNOT SEE, and why the Compose smoke
 * (`scripts/compose-proxy-smoke.ps1`) exists beside it:
 *
 *  - it does not resolve `api` or open a socket, so it cannot prove the
 *    hostname in the compose default is reachable from the web container;
 *  - it does not run Next, so it cannot prove the proxy forwards method, body,
 *    query or headers correctly;
 *  - it reads the compose file in the repo, not whatever `-f` file or
 *    `environment:`/`env_file` overlay an operator actually deploys with.
 *
 * It catches exactly one thing, which is the thing that was wrong: the two
 * halves of the configuration naming the same variable.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  BackendUrlConfigError,
  CANONICAL_BACKEND_URL_VAR,
  resolveBackendUrl,
} from "./backend-url";

const REPO_ROOT = path.resolve(process.cwd(), "..");
const COMPOSE_FILE = path.join(REPO_ROOT, "docker-compose.app.yml");

/**
 * The `environment:` keys a compose service declares.
 *
 * Deliberately a line scanner and not a YAML parse: `yaml` is in the pnpm store
 * as a transitive dependency but is not a dependency of `web`, and pnpm does not
 * hoist, so importing it here would be a resolve that works on one machine and
 * not another. The file is ours, it is 250 lines, and its indentation is uniform
 * (services at 2, keys at 4, entries at 6).
 */
function serviceEnvKeys(compose: string, service: string): string[] {
  const lines = compose.split(/\r?\n/);
  const serviceAt = lines.findIndex((line) => line === `  ${service}:`);
  if (serviceAt < 0) throw new Error(`service "${service}" not found in docker-compose.app.yml`);

  let inEnvironment = false;
  const keys: string[] = [];

  for (const line of lines.slice(serviceAt + 1)) {
    // Next service at the same indent ends this one.
    if (/^ {2}\S/.test(line)) break;
    if (/^ {4}environment:\s*$/.test(line)) {
      inEnvironment = true;
      continue;
    }
    // Any other 4-space key ends the environment block.
    if (/^ {4}\S/.test(line)) {
      inEnvironment = false;
      continue;
    }
    if (!inEnvironment) continue;

    const entry = /^ {6}([A-Za-z_][A-Za-z0-9_]*):/.exec(line);
    if (entry) keys.push(entry[1]);
  }

  return keys;
}

describe("A01: compose supplies the backend URL under the name web reads", () => {
  const compose = readFileSync(COMPOSE_FILE, "utf8");

  it("declares the canonical variable on the web service", () => {
    expect(serviceEnvKeys(compose, "web")).toContain(CANONICAL_BACKEND_URL_VAR);
  });

  it("does not declare API_BASE_URL on the web service", () => {
    // `API_BASE_URL` is the *mobile* app's variable name (mobile/app.config.ts,
    // mobile/eas.json). Supplying it to the web container reads as configured
    // and routes nowhere, which is how this survived review.
    expect(serviceEnvKeys(compose, "web")).not.toContain("API_BASE_URL");
  });

  it("defaults to the api service, not loopback", () => {
    // Loopback inside the web container is the web container. Whatever the
    // default is, it must not be one.
    const webEnv = compose.slice(compose.indexOf("\n  web:"));
    const declaration = new RegExp(`^ {6}${CANONICAL_BACKEND_URL_VAR}:\\s*(.+)$`, "m").exec(webEnv);
    expect(declaration).not.toBeNull();
    expect(declaration![1]).not.toMatch(/127\.0\.0\.1|localhost/);
  });
});

describe("A01: no web source reads the backend URL variable directly", () => {
  /**
   * Two directions, as with lib/field-style-guard.test.ts: a new direct
   * `process.env.BACKEND_URL` read fails until it is declared here with a
   * reason, and a declared entry that no longer exists ALSO fails, so the list
   * cannot quietly become a record of a past that is already cleaned up.
   *
   * The point of routing every reader through one module is that the alias
   * handling, the format validation and the "do not silently use the
   * development default in production" rule apply to all of them. A fresh
   * `process.env.BACKEND_URL ?? "http://127.0.0.1:8000"` in a new server page
   * opts that page out of all three without looking like it opted out of
   * anything.
   *
   * The list is empty, including for the resolver: `lib/backend-url.ts` takes
   * `process.env` as a default *parameter* and indexes it by a named constant,
   * so it never spells `process.env.BACKEND_URL` either.
   *
   * BLIND SPOT: this is a source match for the two spellings below. A reader
   * that builds the key at runtime, destructures `process.env`, or goes through
   * its own indirection is invisible to it. It stops the copy-paste that
   * produced seven of these, not every possible route around the resolver.
   */
  const DECLARED: Record<string, string> = {};

  const SOURCE_DIRS = ["app", "lib", "components", "hooks"];
  const SKIP_DIRS = new Set(["node_modules", ".next", "e2e", "test-results"]);

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
    }
    return out;
  }

  const WEB_ROOT = process.cwd();
  const offenders = SOURCE_DIRS.flatMap((dir) => walk(path.join(WEB_ROOT, dir)))
    .filter((file) =>
      /process\.env(\.(BACKEND_URL|API_BASE_URL)\b|\[\s*["'](BACKEND_URL|API_BASE_URL)["']\s*\])/.test(
        readFileSync(file, "utf8"),
      ),
    )
    .map((file) => path.relative(WEB_ROOT, file).split(path.sep).join("/"))
    .sort();

  it("every direct reader is declared", () => {
    expect(offenders).toEqual(Object.keys(DECLARED).sort());
  });

  it("every declared reader still exists", () => {
    for (const declared of Object.keys(DECLARED)) {
      expect(offenders, `${declared}: ${DECLARED[declared]}`).toContain(declared);
    }
  });

  it("the scan reaches the files it is supposed to", () => {
    // A guard whose file list is empty passes for the wrong reason, which is
    // how `\bWord\b` over textContent gates have failed here before. Pin the
    // walk itself: these two were among the seven original offenders.
    const scanned = SOURCE_DIRS.flatMap((dir) => walk(path.join(WEB_ROOT, dir))).map((file) =>
      path.relative(WEB_ROOT, file).split(path.sep).join("/"),
    );
    expect(scanned).toContain("app/api/backend/[...path]/route.ts");
    expect(scanned).toContain("app/admin/page.tsx");
    expect(scanned.length).toBeGreaterThan(200);
  });
});

describe("resolveBackendUrl", () => {
  it("reads the canonical variable", () => {
    const resolved = resolveBackendUrl({ BACKEND_URL: "http://api:8000" });
    expect(resolved.url).toBe("http://api:8000");
    expect(resolved.source).toBe("BACKEND_URL");
    expect(resolved.warnings).toEqual([]);
  });

  it("falls back to the development default when nothing is set", () => {
    const resolved = resolveBackendUrl({});
    expect(resolved.url).toBe("http://127.0.0.1:8000");
    expect(resolved.source).toBe("default");
  });

  it("accepts API_BASE_URL as a transitional alias, and says so", () => {
    // An operator whose .env still carries the old name gets a working stack
    // and a message telling them to rename it — not a silent loopback.
    const resolved = resolveBackendUrl({ API_BASE_URL: "http://api:8000" });
    expect(resolved.url).toBe("http://api:8000");
    expect(resolved.source).toBe("API_BASE_URL");
    expect(resolved.warnings.join(" ")).toMatch(/API_BASE_URL/);
  });

  it("prefers the canonical variable and warns when the two disagree", () => {
    const resolved = resolveBackendUrl({
      BACKEND_URL: "http://api:8000",
      API_BASE_URL: "http://elsewhere:8000",
    });
    expect(resolved.url).toBe("http://api:8000");
    expect(resolved.warnings.join(" ")).toMatch(/disagree|conflict/i);
  });

  it("is quiet when the two agree", () => {
    const resolved = resolveBackendUrl({
      BACKEND_URL: "http://api:8000",
      API_BASE_URL: "http://api:8000",
    });
    expect(resolved.warnings).toEqual([]);
  });

  it("strips a trailing slash", () => {
    // The proxy builds `${base}/${path.join("/")}`. A trailing slash makes that
    // `http://api:8000//health/ready`, which is a different URL.
    expect(resolveBackendUrl({ BACKEND_URL: "http://api:8000/" }).url).toBe("http://api:8000");
  });

  it("rejects a value that is not an absolute http(s) URL", () => {
    expect(() => resolveBackendUrl({ BACKEND_URL: "api:8000" })).toThrow(BackendUrlConfigError);
    expect(() => resolveBackendUrl({ BACKEND_URL: "ftp://api:8000" })).toThrow(BackendUrlConfigError);
    expect(() => resolveBackendUrl({ BACKEND_URL: "" })).not.toThrow();
  });

  it("rejects a value carrying a path, which the proxy would mangle", () => {
    expect(() => resolveBackendUrl({ BACKEND_URL: "http://api:8000/api/v1" })).toThrow(
      BackendUrlConfigError,
    );
  });

  it("refuses the development default in production", () => {
    // Step 3 of A01: production must not silently substitute a development
    // default for a missing required setting. Format checks still run first.
    expect(() => resolveBackendUrl({ NODE_ENV: "production" }, { requireExplicit: true })).toThrow(
      BackendUrlConfigError,
    );
    expect(() =>
      resolveBackendUrl({ NODE_ENV: "production", BACKEND_URL: "http://api:8000" }, { requireExplicit: true }),
    ).not.toThrow();
    // Outside production the default is the point — `next dev` against a local
    // uvicorn needs no configuration at all.
    expect(() => resolveBackendUrl({}, { requireExplicit: true })).not.toThrow();
  });
});

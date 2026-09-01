import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The backend proxy used to copy every inbound header to FastAPI verbatim,
 * `x-forwarded-for` included. The backend trusts the rightmost
 * `trusted_proxy_count` entries of that header to decide who a request came
 * from, and that setting is 0 today — so nothing was exploitable, and nothing
 * looked wrong.
 *
 * The failure mode is that it only becomes live later: the first person to put
 * a real edge in front of the API and set the count to 1 hands every caller the
 * ability to name their own IP, and with it a way around every IP-keyed rate
 * limit. There is no error and no log at the moment it starts working. So what
 * is pinned here is that the header cannot survive the hop, regardless of
 * configuration.
 */

const REQUEST_URL = "http://web.test/api/backend/api/v1/panchangam/daily";

type Captured = { url: string; headers: Headers };

function loadRoute(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return import("./[...path]/route");
}

function captureFetch(): Captured[] {
  const calls: Captured[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((target: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(target), headers: new Headers(init?.headers) });
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    }),
  );
  return calls;
}

function get(headers: Record<string, string>) {
  return new Request(REQUEST_URL, { method: "GET", headers });
}

const context = { params: Promise.resolve({ path: ["api", "v1", "panchangam", "daily"] }) };

beforeEach(() => {
  delete process.env.TRUSTED_PROXY_HOPS_BEFORE_WEB;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TRUSTED_PROXY_HOPS_BEFORE_WEB;
});

describe("backend proxy — client-supplied forwarding headers", () => {
  it("does not pass a forged x-forwarded-for through to the backend", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute();

    await GET(get({ "x-forwarded-for": "1.2.3.4" }) as never, context as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].headers.get("x-forwarded-for")).toBeNull();
  });

  it("drops the whole family, not just x-forwarded-for", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute();

    await GET(
      get({
        "x-forwarded-for": "1.2.3.4",
        "x-real-ip": "1.2.3.4",
        "x-forwarded-host": "evil.test",
        "x-forwarded-proto": "http",
        "x-forwarded-port": "80",
        forwarded: 'for="1.2.3.4"',
      }) as never,
      context as never,
    );

    for (const header of [
      "x-forwarded-for",
      "x-real-ip",
      "x-forwarded-host",
      "x-forwarded-proto",
      "x-forwarded-port",
      "forwarded",
    ]) {
      expect(calls[0].headers.get(header), `${header} survived the hop`).toBeNull();
    }
  });

  it("still forwards the headers the backend legitimately needs", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute();

    await GET(
      get({ "x-forwarded-for": "1.2.3.4", "x-request-id": "abc-123", cookie: "session=x" }) as never,
      context as never,
    );

    expect(calls[0].headers.get("x-request-id")).toBe("abc-123");
    expect(calls[0].headers.get("cookie")).toBe("session=x");
  });
});

describe("backend proxy — with a real edge in front of Next", () => {
  it("forwards only the hops a trusted proxy actually observed", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute({ TRUSTED_PROXY_HOPS_BEFORE_WEB: "1" });

    // The caller typed the first two entries; only the last was written by our
    // own edge. Forwarding the caller's half is the whole vulnerability.
    await GET(
      get({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 203.0.113.5" }) as never,
      context as never,
    );

    expect(calls[0].headers.get("x-forwarded-for")).toBe("203.0.113.5");
  });

  it("keeps two hops when two are declared", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute({ TRUSTED_PROXY_HOPS_BEFORE_WEB: "2" });

    await GET(
      get({ "x-forwarded-for": "9.9.9.9, 8.8.8.8, 203.0.113.5" }) as never,
      context as never,
    );

    expect(calls[0].headers.get("x-forwarded-for")).toBe("8.8.8.8, 203.0.113.5");
  });

  it("sends nothing rather than a short chain the caller could have written", async () => {
    const calls = captureFetch();
    const { GET } = await loadRoute({ TRUSTED_PROXY_HOPS_BEFORE_WEB: "1" });

    await GET(get({}) as never, context as never);

    expect(calls[0].headers.get("x-forwarded-for")).toBeNull();
  });
});

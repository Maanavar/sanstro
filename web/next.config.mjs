import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {

  // The Docker image runs `node server.js` out of `.next/standalone`. Without
  // standalone output that directory is never produced and the container has
  // nothing to start — the image had a CMD pointing at a file the build did
  // not emit.
  //
  // Opt-in rather than always-on, because standalone assembles its bundle out
  // of symlinks, and creating a symlink on Windows needs Developer Mode or an
  // elevated shell. Turning it on unconditionally made `next build` fail here
  // with EPERM before it finished — i.e. it would have broken every local
  // build on Windows to serve an image nobody builds locally. The Dockerfile
  // sets this; developers do not have to.
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,

  // Trace from the repo root, not from web/. This is a pnpm workspace: web
  // depends on @vinaadi/shared and @vinaadi/design-tokens via `workspace:*`,
  // which resolve through symlinks into the root node_modules/.pnpm store.
  // Tracing from web/ alone would follow those links out of the traced tree and
  // ship a standalone bundle that is missing them.
  outputFileTracingRoot: path.join(import.meta.dirname, ".."),

  // Linting runs as its own CI step (`pnpm --filter jothidam-ai-web lint`); keep
  // it out of the build so a lint warning never blocks producing a deployable
  // artifact.
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * Parent URLs that had no page.
   *
   * Truncating a URL to look for the section above it is ordinary navigation,
   * and five parents answered it with a 404: `/panchangam`, `/trust`,
   * `/tools`, `/learn` and `/features`. Two of those have one obvious
   * destination and are redirected here. The other three need a real hub page
   * listing their children — a redirect would have to pick one of ten tools or
   * six articles arbitrarily — so they fall through to `app/not-found.tsx`,
   * which now names the sections instead of showing Next's blank default.
   *
   * Permanent (308): these parents have never served anything else, so there
   * is no cached 200 to worry about and the target is not going to move.
   * `lib/seo-metadata.test.ts` cannot see any of this — it walks `page.tsx`
   * files, so a route that exists only as a redirect, and a parent that exists
   * as nothing at all, are both outside what it checks.
   */
  async redirects() {
    return [
      { source: "/panchangam", destination: "/panchangam/today", permanent: true },
      { source: "/trust", destination: "/trust/about-vinaadi", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // `nosniff` is the one security header that belongs here rather than in
        // middleware: it matters most on the static assets the middleware
        // matcher deliberately skips, and it needs no per-request value.
        //
        // The rest — CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy,
        // COOP, HSTS — live in middleware.ts, because the CSP carries a
        // per-request nonce and the widget needs a different frame-ancestors
        // from every other route. The widget's `frame-ancestors *` used to be
        // declared here; it moved for a concrete reason. Two
        // Content-Security-Policy headers on one response are enforced as their
        // *intersection*, so leaving this rule in place while middleware also
        // set a policy would have resolved `*` against `'none'` and silently
        // blocked the embed this rule exists to allow.
        source: "/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;

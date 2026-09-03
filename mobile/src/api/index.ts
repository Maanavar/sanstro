// mobile/src/api — Architecture note
//
// WHY two API directories exist
// ──────────────────────────────
// packages/shared/src/api/*.ts  — authoritative domain functions, platform-agnostic.
//                                  They call through getApiClient() from the shared client.
// mobile/src/api/*.ts           — thin mobile-specific layer on top of shared:
//   1. Provides the @/api/* path alias so screens import `@/api/panchangam` instead
//      of the long `@vinaadi/shared/api/panchangam`.
//   2. Allows mobile-specific overrides where needed (e.g. auth.ts stores tokens in
//      SecureStore after login; `client.ts` registers the mobile HTTP client with
//      initApiClient() to handle Bearer auth + token refresh).
//
// Most files are one-liner re-exports. Only auth.ts and client.ts add mobile logic.
//
// ADDING A NEW ENDPOINT
// ─────────────────────
// 1. Add the function to packages/shared/src/api/<domain>.ts
// 2. Add a matching re-export in mobile/src/api/<domain>.ts
// 3. Never call @vinaadi/shared/api/* directly from mobile screens — always go via @/api/*
//    so overrides are applied consistently.

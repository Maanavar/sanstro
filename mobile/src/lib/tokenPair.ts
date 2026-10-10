/**
 * Two non-empty token strings — what every server auth response must carry
 * before anything is written to SecureStore (A14 step 8). Pure, so the
 * refresh path and the storage sink share one definition and a test that
 * mocks the storage module still gets the real check.
 */
export function isTokenPair(value: unknown): value is { accessToken: string; refreshToken: string } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const { accessToken, refreshToken } = value as Record<string, unknown>;
  return (
    typeof accessToken === "string" && accessToken.length > 0 &&
    typeof refreshToken === "string" && refreshToken.length > 0
  );
}

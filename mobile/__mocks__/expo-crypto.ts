/** Deterministic test replacement for Expo's native cryptographic module. */
export const getRandomBytesAsync = jest.fn(async (byteCount: number) =>
  Uint8Array.from({ length: byteCount }, (_, index) => (index * 17 + 11) % 256),
);

export const randomUUID = jest.fn(() => "00000000-0000-4000-8000-000000000001");

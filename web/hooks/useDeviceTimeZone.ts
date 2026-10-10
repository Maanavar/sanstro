"use client";

import { useEffect, useState } from "react";

import { readDeviceTimeZone } from "@/lib/tz";

/**
 * The device's IANA zone, adopted after mount.
 *
 * Null on the server and on the first client render on purpose: the zone is a
 * device-specific string, so reading it during render would bake one machine's
 * answer into the SSR HTML and trip a hydration mismatch. Null also reads as
 * "no mismatch" downstream (`isLocationMismatch`), which is the right default
 * — an unknown device zone must never provoke the §2 prompt.
 */
export function useDeviceTimeZone(): string | null {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => {
    setZone(readDeviceTimeZone());
  }, []);
  return zone;
}

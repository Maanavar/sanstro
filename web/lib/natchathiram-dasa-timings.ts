import {
  NATCHATHIRAM_DASA_TIMINGS,
  type NakshatraDasaTimings,
} from "@/lib/generated/natchathiram-dasa-timings";

/**
 * One star's engine timings, for a nakshatra page to pass to its client
 * component. Call it from the server page so the client bundle carries one
 * star's numbers rather than the whole generated table.
 */
export function dasaTimingsFor(nakshatra: number): NakshatraDasaTimings {
  const timings = NATCHATHIRAM_DASA_TIMINGS[nakshatra - 1];
  if (!timings || timings.nakshatra !== nakshatra) {
    throw new RangeError(`no dasa timings for nakshatra ${nakshatra}`);
  }
  return timings;
}

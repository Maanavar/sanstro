import { getApiClient } from "./client";

/** Mirrors `app/api/places.py`'s `PlaceResult` — a GeoNames-derived bundled
 * place, not a user-entered one. `admin1Name` is nullable (small countries /
 * territories GeoNames doesn't subdivide). */
export interface PlaceSearchResult {
  geonameId: number;
  name: string;
  admin1Name: string | null;
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface PlaceSearchResponse {
  success: boolean;
  data: PlaceSearchResult[];
}

/**
 * Offline birthplace search against the bundled GeoNames dataset — no
 * third-party network call. `query` below 2 characters returns no results
 * (enforced server-side too; the caller doesn't need its own length guard).
 */
export function searchPlaces(query: string, limit?: number): Promise<PlaceSearchResponse> {
  return getApiClient().get("/places/search", { q: query, limit }) as Promise<PlaceSearchResponse>;
}

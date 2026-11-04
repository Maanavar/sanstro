import { useEffect, useRef, useState } from "react";

import { searchPlaces, type PlaceSearchResult } from "@/api/places";

/**
 * Offline place lookup against the bundled GeoNames dataset, debounced.
 *
 * Extracted from `(onboarding)/birth-details.tsx`, which grew it first and
 * still owns the online-geocode fallback (owner ruling B-006: never automatic).
 * This is the plain path — type, pick a suggestion — which the family member
 * screen needed too.
 */

// Mirrors `app/api/places.py`'s `_MIN_QUERY_LENGTH`: below this the backend
// returns nothing, so there is no point firing a request.
export const PLACE_MIN_QUERY_LENGTH = 2;
export const PLACE_DEBOUNCE_MS = 200;

export function formatPlaceLabel(place: PlaceSearchResult): string {
  const region = place.admin1Name ? `${place.admin1Name}, ` : "";
  return `${place.name}, ${region}${place.countryName}`;
}

export interface PlaceSuggestions {
  suggestions: PlaceSearchResult[];
  loading: boolean;
  /** Drop the list — after a pick, or when the field is closed. */
  clear: () => void;
}

/**
 * `enabled: false` stops the search without unmounting the caller (a screen
 * still loading its record, a field the user has not opened). A late reply from
 * a superseded keystroke is discarded by sequence number, not by cancellation:
 * the last keystroke's answer is the only one that may win.
 */
export function usePlaceSuggestions(query: string, enabled = true): PlaceSuggestions {
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const seqRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < PLACE_MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const seq = ++seqRef.current;
    const timer = setTimeout(() => {
      searchPlaces(trimmed, 20)
        .then((res) => {
          if (seqRef.current !== seq) return;
          setSuggestions(res.data);
          setLoading(false);
        })
        .catch(() => {
          if (seqRef.current !== seq) return;
          setSuggestions([]);
          setLoading(false);
        });
    }, PLACE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, enabled]);

  return {
    suggestions,
    loading,
    clear: () => {
      // Advances the sequence too: a request already in flight must not repaint
      // the list the caller just cleared.
      seqRef.current += 1;
      setSuggestions([]);
      setLoading(false);
    },
  };
}

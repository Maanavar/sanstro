type PlaceSelection = { lat: string; lng: string; timezone: string } | null;

export function useBirthProfileForm() {
  function nextBirthDateOrCurrent(current: string, candidate: string): string {
    void current;
    return candidate;
  }

  function applyPlaceSelection<T extends { birthPlace: string; birthLatitude: string; birthLongitude: string; birthTimezone: string }>(
    current: T,
    place: PlaceSelection,
    raw: string,
  ): T {
    if (!place) return { ...current, birthPlace: raw };
    return {
      ...current,
      birthPlace: raw,
      birthLatitude: place.lat,
      birthLongitude: place.lng,
      birthTimezone: place.timezone,
    };
  }

  return {
    nextBirthDateOrCurrent,
    applyPlaceSelection,
  };
}

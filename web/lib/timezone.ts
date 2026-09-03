// Converts a wall-clock time expressed in one IANA timezone into the
// equivalent wall-clock time in another. Used for cross-country muhurta
// coordination (#97) — display only, does not affect the underlying
// panchangam/muhurta calculation, which stays anchored to the chart
// owner's own location.

export interface ConvertedZonedTime {
  time12h: string; // e.g. "11:45 pm", matching formatClockLabel's style
  tzAbbr: string; // e.g. "IST"
  dayOffset: -1 | 0 | 1; // relative to the source date
}

function getUtcOffsetMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instantMs));
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;
  const asUtc = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second),
  );
  return asUtc - instantMs;
}

function zonedWallTimeToInstant(dateIso: string, timeHHMM: string, timeZone: string): number {
  const [y, mo, d] = dateIso.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  const wanted = Date.UTC(y, mo - 1, d, hh, mm);
  const firstPassOffset = getUtcOffsetMs(wanted, timeZone);
  const refined = wanted - firstPassOffset;
  // second pass corrects the rare case where the first guess landed on the
  // other side of a DST transition
  const secondPassOffset = getUtcOffsetMs(refined, timeZone);
  return wanted - secondPassOffset;
}

export function convertMuhurtaTime(
  dateIso: string,
  timeHHMM: string,
  sourceTz: string,
  targetTz: string,
): ConvertedZonedTime {
  const instant = zonedWallTimeToInstant(dateIso, timeHHMM, sourceTz);
  const instantDate = new Date(instant);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz,
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(instantDate);
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;

  const h24 = Number(map.hour);
  const period = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 || 12;
  const time12h = `${h12}:${map.minute} ${period}`;

  const tzParts = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTz, timeZoneName: "short", hour: "2-digit",
  }).formatToParts(instantDate);
  const tzAbbr = tzParts.find((p) => p.type === "timeZoneName")?.value ?? targetTz;

  const targetDateIso = `${map.year}-${map.month}-${map.day}`;
  const dayOffsetRaw = Math.round(
    (Date.parse(`${targetDateIso}T00:00:00Z`) - Date.parse(`${dateIso}T00:00:00Z`)) / 86_400_000,
  );
  const dayOffset = Math.max(-1, Math.min(1, dayOffsetRaw)) as -1 | 0 | 1;

  return { time12h, tzAbbr, dayOffset };
}

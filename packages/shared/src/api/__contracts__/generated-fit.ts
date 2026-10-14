/**
 * A14 — the wrapper types ARE the server's types.
 *
 * Since A14 step 7 (2026-10-08) each wrapper below exports an alias of the type
 * GENERATED from the backend's OpenAPI schema (`../../generated/api-types.ts`),
 * so web and mobile read exactly what the response model declares, and a
 * backend change reaches them through `tsc`. This file pins that: each line
 * requires the exported wrapper type and the generated one to be mutually
 * assignable. Re-introduce a hand-written interface that drifts from the server
 * — a field typed `string` that the server sends as a number, a `| null` the
 * server never sends, a field the server does not have — and this stops
 * compiling. The shared package's `tsc --noEmit` runs in mobile CI.
 *
 * Before step 7 this asked only whether the server's type was assignable to the
 * hand-written one (one direction); that check found the `lagnaRasi` and
 * `caution_ta/en` drift.
 *
 * `tests/test_api_wrapper_field_contract.py` still checks field names for every
 * wrapper, including the ones not generated yet.
 *
 * Nothing imports this file; it exists to be type-checked.
 */
import type * as Server from "../../generated/api-types";
import type { AshtottariDashaApplicability, AshtottariDashaData, AshtottariDashaPeriod } from "../ashtottariDasha";
import type { AskVinaadiDailyStatus } from "../askVinaadi";
import type { CharaDashaData, CharaKarakaMap, CharaPeriod } from "../charaDasha";
import type {
  ConditionalDashaApplicabilityResult,
  ConditionalDashaPeriod,
  ConditionalDashaSystem,
  ConditionalDashasData,
} from "../conditionalDashas";
import type { KalachakraDashaData, KalachakraDashaPeriod } from "../kalachakraDasha";
import type { PlanetShadbala, ShadbalaData } from "../shadbala";
import type { RemedyDisclaimer, RemedyItem, RemedyPlanData } from "../tools";
import type { VarshaphalaAreaOutlook, VarshaphalaData } from "../varshaphala";
import type { YoginiDashaData, YoginiDashaPeriod } from "../yoginiDasha";
// The same server shapes under their `src/types` names, which web's grandfathered
// direct `apiFetchJson` calls cast to (family-charts hybrid's chara fetch, the
// workspace's varshaphala fetch). They are aliases too; these lines keep a
// re-hand-written copy from drifting where the wrapper lines cannot see it.
import type * as Types from "../../types";
// The chart numerology GETs. Unlike the groups above these stay hand-written —
// numerology.ts carries the doctrine notes on each field (D3, D6, the review
// gate), which an alias would discard — so mutual assignability is what keeps
// them honest. The muhurta slot inside lucky/marriage dates is the shared
// `src/types` MuhurtaSlot, pinned here for the same reason.
import type * as Numerology from "../numerology";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;

export type GeneratedFit = [
  Assert<Same<Server.AshtottariDashaData, AshtottariDashaData>>,
  Assert<Same<Server.LordDashaPeriod, AshtottariDashaPeriod>>,
  Assert<Same<Server.AshtottariApplicabilityData, AshtottariDashaApplicability>>,
  Assert<Same<Server.AskVinaadiDailyStatus, AskVinaadiDailyStatus>>,
  Assert<Same<Server.CharaDashaData, CharaDashaData>>,
  Assert<Same<Server.CharaDashaPeriod, CharaPeriod>>,
  Assert<Same<Server.CharaKarakas, CharaKarakaMap>>,
  Assert<Same<Server.ConditionalDashasData, ConditionalDashasData>>,
  Assert<Same<Server.ConditionalDashaTimelineData, ConditionalDashaSystem>>,
  Assert<Same<Server.LordDashaPeriod, ConditionalDashaPeriod>>,
  Assert<Same<Server.ConditionalDashaApplicabilityResult, ConditionalDashaApplicabilityResult>>,
  Assert<Same<Server.KalachakraDashaData, KalachakraDashaData>>,
  Assert<Same<Server.KalachakraDashaPeriod, KalachakraDashaPeriod>>,
  Assert<Same<Server.RemedyPlanData, RemedyPlanData>>,
  Assert<Same<Server.RemedyPlanItem, RemedyItem>>,
  Assert<Same<Server.RemedyDisclaimer, RemedyDisclaimer>>,
  Assert<Same<Server.ShadbalaData, ShadbalaData>>,
  Assert<Same<Server.ShadbalaPlanet, PlanetShadbala>>,
  Assert<Same<Server.VarshaphalaData, VarshaphalaData>>,
  Assert<Same<Server.VarshaphalaAreaOutlook, VarshaphalaAreaOutlook>>,
  Assert<Same<Server.YoginiDashaData, YoginiDashaData>>,
  Assert<Same<Server.YoginiDashaPeriod, YoginiDashaPeriod>>,
  Assert<Same<Server.CharaDashaData, Types.CharaDashaData>>,
  Assert<Same<Server.CharaDashaPeriod, Types.CharaDashaPeriod>>,
  Assert<Same<Server.CharaKarakas, Types.CharaKarakaMap>>,
  Assert<Same<Server.VarshaphalaData, Types.VarshaphalaData>>,
  Assert<Same<Server.VarshaphalaAreaOutlook, Types.VarshaphalaAreaOutlook>>,
  Assert<Same<Server.TajakaPlanetPosition, Types.TajakaPlanetPosition>>,
  Assert<Same<Server.TajakaAspect, Types.TajakaAspect>>,
  Assert<Same<Server.BabyNamesResponse, Numerology.BabyNamesResponse>>,
  Assert<Same<Server.BabyNameCandidateOut, Numerology.BabyNameCandidate>>,
  Assert<Same<Server.FavourableNumbersResponse, Numerology.FavourableNumbersResponse>>,
  Assert<Same<Server.LuckyDatesResponse, Numerology.LuckyDatesResponse>>,
  Assert<Same<Server.MarriageDatesResponse, Numerology.MarriageDatesResponse>>,
  Assert<Same<Server.MuhurthamNaalReading, Numerology.MuhurthamNaalReading>>,
  Assert<Same<Server.NallaNeramWindow, Numerology.NallaNeramWindow>>,
  Assert<Same<Server.NameSessionsResponse, Numerology.NameSessionsResponse>>,
  Assert<Same<Server.NumberReadingWithMeaning, Numerology.NumberReadingWithMeaning>>,
  Assert<Same<Server.PersonalCycleResponse, Numerology.PersonalCycleResponse>>,
  Assert<Same<Server.NumberReadingOut, Numerology.NumberReading>>,
  Assert<Same<Server.NumberAlignmentOut, Numerology.NumberAlignment>>,
  Assert<Same<Server.MuhurtaSlot, Types.MuhurtaSlot>>,
  Assert<Same<Server.MuhurtaFactor, Types.MuhurtaFactor>>,
];

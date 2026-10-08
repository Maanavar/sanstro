/**
 * A14 — does what the server sends fit what the wrapper claims?
 *
 * Each line asks `tsc` whether the type GENERATED from the backend's OpenAPI
 * schema (`../../generated/api-types.ts`, the server's claim) is assignable to
 * the hand-written type the wrapper casts to (what web and mobile code reads).
 * If the server can send `null` where the wrapper promises `string`, or a
 * number where it promises a string, this file stops compiling — and the shared
 * package's `tsc --noEmit` runs in mobile CI.
 *
 * `tests/test_api_wrapper_field_contract.py` only checks that field *names*
 * exist; this checks value types and nullability, in one direction: a field
 * the wrapper declares but the server never sends is still the field guard's
 * job, and an extra server field the wrapper ignores is allowed.
 *
 * Compared at the `data` level: the envelope's `success` has a model default,
 * which OpenAPI renders optional although FastAPI always sends it.
 *
 * Nothing imports this file; it exists to be type-checked.
 */
import type * as Server from "../../generated/api-types";
import type { AshtottariDashaData } from "../ashtottariDasha";
import type { AskVinaadiDailyStatus } from "../askVinaadi";
import type { CharaDashaData } from "../charaDasha";
import type { ConditionalDashasData } from "../conditionalDashas";
import type { KalachakraDashaData } from "../kalachakraDasha";
import type { ShadbalaData } from "../shadbala";
import type { RemedyPlanData } from "../tools";
import type { VarshaphalaData } from "../varshaphala";
import type { YoginiDashaData } from "../yoginiDasha";

type Fits<ServerSends, ClientReads> = [ServerSends] extends [ClientReads] ? true : false;
type Assert<T extends true> = T;

export type GeneratedFit = [
  Assert<Fits<Server.AshtottariDashaData, AshtottariDashaData>>,
  Assert<Fits<Server.AskVinaadiDailyStatus, AskVinaadiDailyStatus>>,
  Assert<Fits<Server.CharaDashaData, CharaDashaData>>,
  Assert<Fits<Server.ConditionalDashasData, ConditionalDashasData>>,
  Assert<Fits<Server.KalachakraDashaData, KalachakraDashaData>>,
  Assert<Fits<Server.RemedyPlanData, RemedyPlanData>>,
  Assert<Fits<Server.ShadbalaData, ShadbalaData>>,
  Assert<Fits<Server.VarshaphalaData, VarshaphalaData>>,
  Assert<Fits<Server.YoginiDashaData, YoginiDashaData>>,
];

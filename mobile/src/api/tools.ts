export type {
  NatchathiramData,
  DoshamFlag,
  YogamEntry,
  PariharamEntry,
  PrashanData,
  MuhurtaPayload,
} from "@vinaadi/shared/api/tools";
export {
  getNatchathiram,
  getDosham,
  getYogam,
  getPariharam,
  getPrashan,
  getMuhurta,
} from "@vinaadi/shared/api/tools";

// getPorutham is now canonical in @vinaadi/shared/api/porutham
export type { PoruthamPayload } from "@vinaadi/shared/api/porutham";
export { getPorutham } from "@vinaadi/shared/api/porutham";

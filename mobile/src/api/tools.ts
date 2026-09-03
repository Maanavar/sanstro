export type {
  NakshatraCard,
  NakshatraBiText,
  NakshatraCompatGroup,
  RemedyItem,
  RemedyPlanData,
  RemedyDisclaimer,
  PrasnaPayload,
  PrasnaResponse,
  PrasnaOutlook,
  PrasnaQuestionArea,
  MuhurtaPayload,
} from "@vinaadi/shared/api/tools";
export {
  PRASNA_QUESTION_AREAS,
  getNatchathiram,
  getDosham,
  getYogam,
  getPariharam,
  askPrasna,
  getMuhurta,
} from "@vinaadi/shared/api/tools";

// getPorutham is now canonical in @vinaadi/shared/api/porutham
export type { PoruthamPayload } from "@vinaadi/shared/api/porutham";
export { getPorutham } from "@vinaadi/shared/api/porutham";

/**
 * The consent wording lives in `@vinaadi/shared/consentCopy` so web and mobile
 * read one table (admin spec L2, D-10). Re-exported so web call sites keep
 * their import path.
 */
export {
  ADULT_DECLARATION,
  CHANGE_LATER,
  HELD_DATA_NOTICE,
  NO_OPTIONAL_CONSENTS,
  OPTIONAL_PURPOSES,
  SERVICE_PURPOSE,
} from "@vinaadi/shared/consentCopy";

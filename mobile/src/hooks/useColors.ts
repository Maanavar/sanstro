import { C } from "@/theme/colors";

// Returns the active color palette.
// TODO(dark-mode): Replace with a useColorScheme()-aware implementation in Phase 4.
// Until then this is a stable re-export so all screens import via this hook
// rather than directly from "@/theme/colors", making the dark-mode migration a
// single-file change.
export function useColors() {
  return C;
}

export function biText(
  value: { ta?: string; en?: string } | null | undefined,
  isTamil: boolean,
  fallback = ""
): string {
  return (isTamil ? value?.ta : value?.en) || value?.en || value?.ta || fallback;
}

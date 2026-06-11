import { SCORE_HIGH, SCORE_MID } from "@/lib/format";

export function BoltGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d="M13 2L5 14h6l-1 8 9-13h-6l0-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width={size} height={size} fill="none">
      <path d="M5 12.5L10 17L19 8" stroke={SCORE_HIGH} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WarningGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}>
      <path d="M12 3l9 17H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function AlertGlyph({ color = SCORE_MID, size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L21 20H3L12 3Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9V13.8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="1.2" fill={color} />
    </svg>
  );
}

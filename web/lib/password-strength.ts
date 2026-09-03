// UXD-22 — entropy-aware password strength.
//
// The old meter scored on length alone, so "aaaaaaaaaaaaaaaa" rated "Strong".
// This estimator rewards length AND character-class diversity, and penalises
// low-entropy inputs (few unique characters, repeated units, common passwords)
// so a long-but-trivial password can never rate above "Weak". It also returns
// the individual requirements so the form can show them up front, as the user
// types, instead of only as a post-submit error.

export type PasswordScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  score: PasswordScore;
  /** "" for empty input, else Weak/Fair/Good/Strong (localized). */
  label: string;
  requirements: PasswordRequirement[];
}

const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty", "qwertyui", "qwerty123", "111111", "abc12345", "letmein",
  "iloveyou", "admin123", "welcome1", "monkey123", "football", "sunshine",
]);

function isWeakPattern(pw: string): boolean {
  const lower = pw.toLowerCase();
  if (COMMON.has(lower)) return true;
  if (/^(.)\1+$/.test(pw)) return true;        // a single character repeated
  if (/^(..)\1{2,}$/.test(pw)) return true;    // a two-character unit repeated
  if (/^0?123456/.test(lower)) return true;    // ascending digit run
  if (/^abcdef/.test(lower)) return true;      // ascending letter run
  return false;
}

export function estimatePasswordStrength(pw: string, lang: "en" | "ta" = "en"): PasswordStrength {
  const len = pw.length;
  const unique = new Set(pw).size;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  const weak = len > 0 && (isWeakPattern(pw) || unique <= 2 || unique / len < 0.3);

  const requirements: PasswordRequirement[] = [
    { label: lang === "ta" ? "குறைந்தது 8 எழுத்துகள்" : "At least 8 characters", met: len >= 8 },
    { label: lang === "ta" ? "பெரிய & சிறிய எழுத்துகள்" : "Upper & lowercase letters", met: hasLower && hasUpper },
    { label: lang === "ta" ? "எண் அல்லது சிறப்பு எழுத்து" : "A number or symbol", met: hasDigit || hasSymbol },
    { label: lang === "ta" ? "மீண்டும்/பொதுவான கடவுச்சொல் அல்ல" : "Not a repeated or common password", met: len > 0 && !weak },
  ];

  const labels = lang === "ta"
    ? ["", "பலவீனம்", "சராசரி", "நல்லது", "வலிமை"]
    : ["", "Weak", "Fair", "Good", "Strong"];

  if (len === 0) return { score: 0, label: "", requirements };

  let raw = 0;
  if (len >= 8) raw++;
  if (len >= 12) raw++;
  if (classes >= 2) raw++;
  if (classes >= 3 && len >= 10) raw++;
  if (weak) raw = Math.min(raw, 1);

  const score = Math.max(1, Math.min(4, raw)) as PasswordScore;
  return { score, label: labels[score], requirements };
}

import type { KutaGrade } from "@vinaadi/shared";

/**
 * The three-fold porutham grade — உத்தமம் / மத்யமம் / அதமம் — as it is allowed
 * to appear on screen. Astrologer ruling 2026-08-31.
 *
 * **One verdict per row.** A row that says FAIL on one side and Madhyama on the
 * other reads as the system contradicting itself. The band is not a competing
 * second opinion; it is the same judgement at finer resolution, so wherever a
 * porutham is MADHYAMA the grade word *replaces* the coarse pass/fail word
 * rather than sitting beside it. UTTAMA and ADHAMA keep whatever pass/fail
 * wording the surface already uses — only the middle state needs naming.
 *
 * **Never render ADHAMA-as-Sanskrit to a family.** "Adhama" is the internal
 * grade; on screen a failing porutham keeps the surface's plain word. Madhyama
 * is the one grade that has to be named, because there is no plain word for it.
 *
 * Five surfaces import this. Before it existed, the same two Tamil words were
 * hand-typed on two of them and had already drifted in spelling
 * (மத்தியமம் / மத்யமம்); the parity failures this repo keeps hitting are all
 * this shape, so the copy lives in exactly one place.
 */

/** Semantic tone. Feeds each surface's own green / amber / red tokens. */
export function kutaTone(grade: KutaGrade): "good" | "mixed" | "caution" {
  if (grade === "UTTAMA") return "good";
  if (grade === "MADHYAMA") return "mixed";
  return "caution";
}

/** The grade word, active language only — never both (bilingual echo ruling). */
export function madhyamaLabel(en: boolean): string {
  return en ? "Madhyama" : "மத்யமம்";
}

/**
 * The gloss. Authored 2026-08-31 — do not paraphrase.
 *
 * A bare Sanskrit grade strands a non-astrologer reader exactly as badly as an
 * unexplained red Fail does, so the gloss is not decoration: the load-bearing
 * clause is **"not a failure"** (தோல்வி அல்ல). Spoken aloud, an astrologer's
 * tone carries that reassurance; on a silent screen beside an amber bar it has
 * to be written down or it is lost.
 *
 * `short` is for space-constrained public surfaces. It says மிதமான
 * ("moderate") rather than சாதாரண deliberately — சாதாரண collides with the
 * AVERAGE verdict word and would blur the two. **If space ever forces another
 * cut, drop the grade descriptor before "not a failure."**
 */
export function madhyamaGloss(en: boolean, short = false): string {
  if (short) {
    return en
      ? "Madhyama — a moderate match, not a failure."
      : "மத்யமம் — மிதமான பொருத்தம், தோல்வி அல்ல.";
  }
  return en
    ? "Madhyama — a middling result on this porutham. Acceptable, but not the strongest grade. It counts as a soft pass, not a failure."
    : "மத்யமம் — இந்தப் பொருத்தத்தில் நடுத்தர நிலை. பரவாயில்லை, ஆனால் உயர்ந்தது அல்ல. இது தோல்வி அல்ல, மிதமான பொருத்தமே.";
}

/** Whether any porutham in a set came out Madhyama — gates showing the gloss. */
export function hasMadhyama(kutas: ReadonlyArray<{ grade?: KutaGrade }>): boolean {
  return kutas.some((k) => k.grade === "MADHYAMA");
}

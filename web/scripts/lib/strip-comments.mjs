/**
 * Blank out comments, preserving length and line structure.
 *
 * This is not optional for any tool that asks "does the source mention this
 * name?", because this codebase documents its CSS and bundling decisions *in
 * prose that names the classes*. A naive scan reports `.cd-shell` as live on two
 * marketing pages that only mention it in a comment.
 *
 * The error runs in a different direction for each consumer, and both directions
 * have already cost a session:
 *
 *   - css-inventory.mjs asks "is this class used?" — a commented name makes a
 *     dead class look live, and it gets carried forward forever.
 *   - css-dynamic-class-audit.mjs asks "which classes can no scan see?" — a
 *     commented interpolation invents a prefix that protects a whole namespace.
 *     `css-inventory.mjs:413` explains DYNAMIC_RE with the example `cl-${x}`,
 *     and that one comment marked all ~400 `.cl-*` classes "at risk", which is
 *     the entire namespace F4 step 5 left to prune. A guard that flags
 *     everything answers nothing.
 *
 * String literals are preserved verbatim — they are where the class names that
 * matter actually live.
 */
export function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      let j = i;
      while (j < n && src[j] !== "\n") j++;
      out += " ".repeat(j - i);
      i = j;
    } else if (c === "/" && d === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j === -1 ? n : j + 2;
      out += src.slice(i, j).replace(/[^\n]/g, " ");
      i = j;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") j += 2;
        else if (src[j] === c) break;
        else j++;
      }
      j = Math.min(j + 1, n);
      out += src.slice(i, j);
      i = j;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

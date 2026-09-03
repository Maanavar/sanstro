/**
 * Does each surface still resolve a real Fraunces face for its display type?
 *
 * The Fraunces merge is a change to what is *declared*, not what is rendered —
 * but that claim is only checkable on a rendered page, because `.cd-shell` used
 * to re-point `--font-display` at a second instance and now inherits it. Static
 * analysis proves there is one definition; only the browser proves it arrives.
 */
import { chromium } from "@playwright/test";

const BASE = process.argv[2] ?? "http://127.0.0.1:3201";
const PAGES = ["/", "/learn/what-is-chandrashtama", "/login"];

const browser = await chromium.launch();
const page = await browser.newPage();
let bad = 0;

for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  const info = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const heading =
      document.querySelector("h1") ?? document.querySelector("h2") ?? document.body;
    const hs = getComputedStyle(heading);
    return {
      varDisplay: root.getPropertyValue("--font-display").trim(),
      varNova: root.getPropertyValue("--font-nova-display").trim(),
      headingFamily: hs.fontFamily,
      headingWeight: hs.fontWeight,
      headingTag: heading.tagName,
    };
  });
  const ok = /Fraunces/i.test(info.varDisplay) && info.varNova === "";
  if (!ok) bad += 1;
  console.log(
    `${ok ? "ok  " : "FAIL"} ${path.padEnd(34)} --font-display=${info.varDisplay || "(unset)"}` +
      `  ${info.headingTag} weight=${info.headingWeight} family=${info.headingFamily.slice(0, 60)}`,
  );
}

await browser.close();
console.log(bad === 0 ? "\nall surfaces resolve one Fraunces" : `\n${bad} surface(s) wrong`);
process.exitCode = bad === 0 ? 0 : 1;

#!/usr/bin/env node
/**
 * Which classes does the site ACTUALLY put in its HTML?
 *
 * Every "is this class used?" tool in this repo reads source, and the plan doc's
 * closing caution records four separate searches defeated by a name the output
 * writes differently from the source: `as-rasi--${tone}` built by interpolation,
 * `novaFieldStyle` behind a case-sensitive prefix, `Learn · Chandrashtama`
 * escaped in minified output, `^"use client"` behind a UTF-8 BOM. Every one
 * returned a confident, wrong, *smaller* number.
 *
 * This asks the question from the other end, where none of that applies. A
 * rendered page carries final class names: an interpolation has already been
 * evaluated, so `as-rasi--fire` appears as itself. That makes this the one
 * instrument immune to the blind spot that made F4 step 5 delete 13 live rules.
 *
 * It crawls rather than taking a route list, because a list is a thing that goes
 * stale silently — `nova-sweep`'s did, and the plan records the lesson ("a list
 * of destinations is only worth having if a destination going missing is loud").
 * Crawling from `/` reaches the dynamic families (`/temples/[slug]`,
 * `/dosham/[slug]`, `/natchathiram/[slug]`, …) without anyone maintaining their
 * slugs here.
 *
 * Both languages, because a `BiStr` render can differ per language and some
 * markup is language-conditional.
 *
 * WHAT IT CANNOT DO: prove a class is dead. A class rendered only behind an
 * interaction this crawler never performs (an open accordion, an error state, a
 * submitted form) will not appear. So a clean run is necessary evidence for a
 * prune and never sufficient on its own — pair it with the source scan and the
 * dynamic-class audit, which fail in different directions.
 *
 *   node scripts/css-rendered-class-probe.mjs http://127.0.0.1:3300 [doomed.json]
 */
import { readFileSync, writeFileSync } from "node:fs";

const BASE = (process.argv[2] ?? "http://127.0.0.1:3300").replace(/\/$/, "");
const DOOMED_PATH = process.argv[3];
const OUT_PATH = process.argv[4];

/** Routes that are not the marketing surface, plus assets and API. */
const EXCLUDE = /^\/(dashboard|login|admin|api|_next|favicon|robots|sitemap|opengraph|icon)/;

const seen = new Set();
const queue = ["/"];
const renderedClasses = new Map(); // class -> Set<route>
const routes = [];
let failures = 0;

const CLASS_ATTR = /\sclass(?:Name)?=["']([^"']*)["']/g;
const HREF = /\shref=["'](\/[^"'#?]*)["']/g;

async function fetchPage(path, lang) {
  const res = await fetch(BASE + path, {
    headers: lang === "ta" ? { cookie: "jothidam-lang=ta" } : {},
    redirect: "follow",
  });
  return { status: res.status, html: await res.text() };
}

function harvest(html, route) {
  for (const m of html.matchAll(CLASS_ATTR)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls) continue;
      if (!renderedClasses.has(cls)) renderedClasses.set(cls, new Set());
      renderedClasses.get(cls).add(route);
    }
  }
}

function enqueueLinks(html) {
  for (const m of html.matchAll(HREF)) {
    let href = m[1].replace(/\/$/, "") || "/";
    if (EXCLUDE.test(href)) continue;
    if (seen.has(href) || queue.includes(href)) continue;
    queue.push(href);
  }
}

const MAX = Number(process.env.PROBE_MAX ?? 400);

while (queue.length && seen.size < MAX) {
  const route = queue.shift();
  seen.add(route);
  try {
    const en = await fetchPage(route, "en");
    if (en.status !== 200) {
      failures++;
      console.log(`  ! ${route}  status ${en.status}`);
      continue;
    }
    harvest(en.html, route);
    enqueueLinks(en.html);

    const ta = await fetchPage(route, "ta");
    if (ta.status === 200) harvest(ta.html, route + " (ta)");

    routes.push(route);
    if (routes.length % 25 === 0) console.log(`  … ${routes.length} routes, ${renderedClasses.size} distinct classes`);
  } catch (e) {
    failures++;
    console.log(`  ! ${route}  ${String(e).slice(0, 100)}`);
  }
}

console.log(`\ncrawled ${routes.length} routes (${failures} failed), ${renderedClasses.size} distinct classes rendered`);

if (OUT_PATH) {
  writeFileSync(
    OUT_PATH,
    JSON.stringify(
      { base: BASE, routes, classes: Object.fromEntries([...renderedClasses].map(([c, r]) => [c, [...r]])) },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`wrote ${OUT_PATH}`);
}

if (!DOOMED_PATH) process.exit(failures ? 1 : 0);

const doomed = JSON.parse(readFileSync(DOOMED_PATH, "utf8").replace(/^﻿/, ""));
const alive = doomed.classes.filter((c) => renderedClasses.has(c));

console.log(`\n── of ${doomed.classes.length} classes proposed for deletion, rendered on a real page: ${alive.length} ──`);
for (const c of alive) console.log(`  .${c}   on ${[...renderedClasses.get(c)].slice(0, 6).join(", ")}`);
if (!alive.length) console.log("  (none)");

// Sanity: a crawl that harvested nothing would report "none" and look like a
// pass. Require that the classes we KNOW render actually showed up.
const CANARIES = ["cl-nav", "cl-footer", "cl-container"];
const missingCanaries = CANARIES.filter((c) => !renderedClasses.has(c));
if (missingCanaries.length) {
  console.error(`\nREFUSING to report a clean result: canary classes absent (${missingCanaries.join(", ")}).`);
  console.error("The crawl did not harvest real markup — check the base URL and that the server is serving pages.");
  process.exit(3);
}
console.log(`\ncanaries present (${CANARIES.join(", ")}) — the crawl did harvest real markup.`);

process.exit(alive.length ? 1 : 0);

"""Draft பத்தாண்டு for every தசகம் in the nakshatra visual pages (reviewer §10).

Read-only: prints a markdown list of each sentence with தசகம், its draft and
the English twin of the same dasa field, for the Tamil reviewer. Nothing is
written to the pages; the drafts ship only after a native read.

    python scripts/audit/dasakam_drafts.py > body.md
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

PAGES = Path(__file__).resolve().parents[2] / "web" / "app" / "(marketing)" / "natchathiram"
STR = r'"((?:[^"\\]|\\.)*)"'
BLOCK = re.compile(rf"expect:\s*{STR},\s*navigate:\s*{STR},\s*focus:\s*{STR}")
FIELDS = ("expect", "navigate", "focus")
LORD = re.compile(r'planet:\s*"(\w+)"')

# Inflected தசகம் → பத்தாண்டு. Plural stems carry every case ending unchanged.
DRAFTS: tuple[tuple[str, str], ...] = (
    ("பல-தசக", "பல பத்தாண்டு"),
    ("தசகங்க", "பத்தாண்டுக"),
    ("தசகத்தி", "பத்தாண்டி"),
    ("தசகம்", "பத்தாண்டு"),
)


def region(src: str, key: str) -> str:
    start = src.find(key)
    if start < 0:
        return ""
    end = src.find("spirituality:", start)
    return src[start:end if end >= 0 else None]


def draft(sentence: str) -> str:
    for old, new in DRAFTS:
        sentence = sentence.replace(old, new)
    return sentence


def sentences(text: str) -> list[str]:
    return [s for s in re.split(r"(?<=[.!?])\s+", text) if s]


def main() -> int:
    rows = 0
    out: list[str] = []
    for page in sorted(PAGES.glob("*/visual/page.tsx")):
        slug = page.parent.parent.name
        src = page.read_text(encoding="utf-8")
        en_region = region(src, "dashaTimeline:")
        lords = LORD.findall(en_region)
        en = [m.groups() for m in BLOCK.finditer(en_region)]
        ta = [m.groups() for m in BLOCK.finditer(region(src, "dashaDetails:"))]
        found_in_blocks = 0
        page_rows: list[str] = []
        for i, block in enumerate(ta):
            for f, raw in zip(FIELDS, block):
                text = json.loads(f'"{raw}"')
                for s in sentences(text):
                    if "தசக" not in s:
                        continue
                    found_in_blocks += s.count("தசக")
                    lord = lords[i].upper() if i < len(lords) else "?"
                    twin = json.loads(f'"{en[i][FIELDS.index(f)]}"') if i < len(en) else ""
                    decade = [e for e in sentences(twin) if re.search(r"decade", e, re.I)]
                    page_rows += [
                        f"- [ ] **{lord} dasa · {f}**",
                        f"  - Now: {s}",
                        f"  - Draft: {draft(s)}",
                        f"  - English: {' / '.join(decade) if decade else '(no sentence with “decade” in this field; read the whole field)'}",
                        "",
                    ]
                    rows += 1
        # Uses elsewhere on the page: dasa theme titles, guidance, descriptions.
        details = region(src, "dashaDetails:")
        details_at = src.find(details) if details else -1
        for m in re.finditer(STR, src):
            inside = details_at >= 0 and details_at <= m.start() < details_at + len(details)
            text = json.loads(f'"{m.group(1)}"')
            if inside or "தசக" not in text:
                continue
            line = src.count("\n", 0, m.start()) + 1
            for s in sentences(text):
                if "தசக" in s:
                    found_in_blocks += s.count("தசக")
                    page_rows += [f"- [ ] **Elsewhere on the page** (line {line})", f"  - Now: {s}", f"  - Draft: {draft(s)}", ""]
                    rows += 1
        total = src.count("தசக")
        if total != found_in_blocks:
            page_rows += [f"- [ ] **Not parsed:** {total - found_in_blocks} more use(s) on this page; read them in the source.", ""]
        if page_rows:
            out += [f"### `{slug}`", "", *page_rows]
    sys.stdout.write("\n".join(out))
    print(f"\n<!-- {rows} sentences -->", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

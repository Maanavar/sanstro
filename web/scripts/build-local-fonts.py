"""Regenerate the self-hosted web fonts in web/app/fonts/.

Why this exists: the five faces used to come from `next/font/google`, which
fetches the CSS and files from Google Fonts during `next build`. Google
occasionally answered with a font URL that has no file extension, and
next/font's loader crashed on it (`Cannot read properties of null (reading
'1')`, google `loader.js:122`) — three red CI runs in four days. The faces now
live in the repo and are loaded through `next/font/local`, so a build never
touches the network for fonts. See docs/MASTER_FIX_LIST.md ("Compose stack").

What it produces is what Google served, merged: for each face, one variable
woff2 per style that carries only the `wght` axis (every other axis pinned at
its default — exactly how Google instances a family when only `wght` is
requested) and covers the union of the Google subsets the app needs. Google
splits those subsets into separate files with `unicode-range`; next/font/local
cannot attach a unicode-range per file, so they are merged here instead.

Not run by the build or CI. Run it only to change a face, a subset or a
pinned source revision, then re-check the output with --verify:

    py -3 -m venv .fontenv
    .fontenv\\Scripts\\python -m pip install fonttools brotli
    .fontenv\\Scripts\\python web\\scripts\\build-local-fonts.py
    .fontenv\\Scripts\\python web\\scripts\\build-local-fonts.py --verify

--verify downloads what Google serves today for the same queries next/font
made and checks, glyph by glyph, that every code point both files map draws
the same outline with the same advance at the default instance.
"""

from __future__ import annotations

import argparse
import io
import re
import sys
import tempfile
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT = Path(__file__).resolve().parent.parent / "app" / "fonts"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Google's unicode-range for each subset, copied from fonts.googleapis.com/css2
# (2026-10-13). The ranges are the same for every family that has the subset.
RANGES = {
    "latin": "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
    # Carries the transliteration diacritics the UI renders (ā ū ḍ ṅ), ₹ and ꞉.
    "latin-ext": "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF",
    "tamil": "U+0964-0965, U+0B82-0BFA, U+200C-200D, U+20B9, U+25CC",
}

# Google ships these combining marks in every subset file, outside the declared
# ranges (they let the browser compose accented letters the font lacks).
EXTRA = "U+0300-0301, U+0303, U+0309, U+0323"

# Where Google pins an axis that was not requested: its axis-registry default,
# NOT the font's own fvar default. They differ for opsz (Fraunces' own default
# is 9, Source Serif 4's is 20; Google renders both at 14) — pinning at fvar
# defaults drew visibly different letters, which --verify caught.
GOOGLE_AXIS_DEFAULTS = {"opsz": 14.0, "SOFT": 0.0, "WONK": 0.0, "wdth": 100.0}

RAW = "https://raw.githubusercontent.com/google/fonts"

# (output file, google/fonts commit, source path, Google CSS2 query, subsets)
FACES = [
    ("fraunces-normal.woff2", "4024282d9b0cffcdb8e3024560862746178d741f",
     "ofl/fraunces/Fraunces[SOFT,WONK,opsz,wght].ttf",
     "Fraunces:ital,wght@0,400;0,500;0,600;0,700", ["latin", "latin-ext"]),
    ("fraunces-italic.woff2", "4024282d9b0cffcdb8e3024560862746178d741f",
     "ofl/fraunces/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf",
     "Fraunces:ital,wght@1,400;1,500;1,600;1,700", ["latin", "latin-ext"]),
    ("inter.woff2", "0b58fb370093f9a9f4ff785d94405710b79de67c",
     "ofl/inter/Inter[opsz,wght].ttf",
     "Inter:wght@400;500;600;700", ["latin", "latin-ext"]),
    ("jetbrains-mono.woff2", "6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da",
     "ofl/jetbrainsmono/JetBrainsMono[wght].ttf",
     "JetBrains+Mono:wght@400;500", ["latin", "latin-ext"]),
    # Latin is kept: Tamil-mode stacks put this face first, so mixed-script
    # text draws its Latin glyphs from here too, as it did from Google.
    ("noto-sans-tamil.woff2", "8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5",
     "ofl/notosanstamil/NotoSansTamil[wdth,wght].ttf",
     "Noto+Sans+Tamil:wght@400;500;600;700", ["tamil", "latin", "latin-ext"]),
    ("source-serif-4.woff2", "08dc85da6bca7ae308a6f1d38d0b137465646071",
     "ofl/sourceserif4/SourceSerif4[opsz,wght].ttf",
     "Source+Serif+4:wght@400;600", ["latin", "latin-ext"]),
]


# Google narrows JetBrains Mono's wght axis to 400..800 for the 400;500 query.
#
# Fraunces' default instance stays Black (900), as Google serves it. Moving it
# to 400 (so next/font/local would size the fallback face from Regular) was
# tried: re-encoding the deltas around a new default moved points by up to
# 118 units and broke shaping, which --verify caught. The fallback face is set
# by hand in app/layout.tsx instead.
WGHT_LIMITS = {"jetbrains-mono.woff2": (400.0, 800.0)}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return resp.read()


def parse_ranges(spec: str) -> list[int]:
    cps: list[int] = []
    for part in spec.split(","):
        lo, _, hi = part.strip().removeprefix("U+").partition("-")
        cps.extend(range(int(lo, 16), int(hi or lo, 16) + 1))
    return cps


def build(tmp: Path) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, sha, src, _query, subsets in FACES:
        ttf = tmp / Path(src).name
        if not ttf.exists():
            ttf.write_bytes(fetch(f"{RAW}/{sha}/{src}"))
        # recalcTimestamp=False keeps the source's head.modified, so an
        # unchanged rebuild is byte-identical and shows no diff in git.
        font = TTFont(ttf, recalcTimestamp=False)
        pinned = {a.axisTag: GOOGLE_AXIS_DEFAULTS[a.axisTag] for a in font["fvar"].axes if a.axisTag != "wght"}
        if name in WGHT_LIMITS:
            pinned["wght"] = WGHT_LIMITS[name]
        if pinned:
            # Round-trip through bytes: the subsetter trips over the instancer's
            # lazily-loaded gvar (KeyError on a glyph name) if handed it directly.
            buf = io.BytesIO()
            instancer.instantiateVariableFont(font, pinned).save(buf)
            buf.seek(0)
            font = TTFont(buf, recalcTimestamp=False)
        unicodes = sorted({cp for s in subsets for cp in parse_ranges(RANGES[s])} | set(parse_ranges(EXTRA)))
        opts = subset.Options()
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.name_languages = ["*"]
        opts.notdef_outline = True
        opts.hinting = False
        opts.flavor = "woff2"
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=unicodes)
        sub.subset(font)
        subset.save_font(font, str(OUT / name), opts)
        print(f"{name:24} {(OUT / name).stat().st_size:>7} B  pinned={pinned}  subsets={subsets}")
    # All five are SIL OFL 1.1, which requires the licence to travel with the
    # font files. One copy per family, from the same pinned commit.
    licences = OUT / "licenses"
    licences.mkdir(exist_ok=True)
    for sha, family_dir in sorted({(sha, Path(src).parent.as_posix()) for _n, sha, src, _q, _s in FACES}):
        (licences / f"{Path(family_dir).name}-OFL.txt").write_bytes(fetch(f"{RAW}/{sha}/{family_dir}/OFL.txt"))


# Font units. Google bakes the pinned axes into the wght deltas and rounds, so
# the same letter can land a fraction of a unit away (worst seen: 1.0u on a
# 1000- or 2000-unit em). A wrong pin or a wrong source moves points by tens.
TOLERANCE = 1.0


def _deviation(ref_gs, ref_glyph: str, ours_gs, our_glyph: str) -> float:
    """Largest coordinate or advance difference between two glyphs, in font units."""
    from fontTools.pens.recordingPen import DecomposingRecordingPen

    rp, op = DecomposingRecordingPen(ref_gs), DecomposingRecordingPen(ours_gs)
    ref_gs[ref_glyph].draw(rp)
    ours_gs[our_glyph].draw(op)
    if [cmd for cmd, _ in rp.value] != [cmd for cmd, _ in op.value]:
        return float("inf")
    worst = abs(ref_gs[ref_glyph].width - ours_gs[our_glyph].width)
    for (_, ra), (_, oa) in zip(rp.value, op.value):
        for rpt, opt in zip(ra, oa):
            worst = max(worst, abs(rpt[0] - opt[0]), abs(rpt[1] - opt[1]))
    return worst


# Text that only shaping reaches: Tamil conjuncts and vowel-sign reordering,
# Latin ligatures, JetBrains Mono's code ligatures, mark-on-base composition.
_CONSONANTS = [chr(c) for c in range(0x0B95, 0x0BBA) if c not in (0x0B96, 0x0B97, 0x0B98, 0x0B9B, 0x0B9D, 0x0BA0, 0x0BA1, 0x0BA2, 0x0BA5, 0x0BA6, 0x0BA7, 0x0BAB, 0x0BAC, 0x0BAD, 0x0BB6)]
_SIGNS = [chr(c) for c in (0x0BBE, 0x0BBF, 0x0BC0, 0x0BC1, 0x0BC2, 0x0BC6, 0x0BC7, 0x0BC8, 0x0BCA, 0x0BCB, 0x0BCC, 0x0BCD)]
SHAPING_SAMPLES = [
    " ".join(c + s for s in _SIGNS) for c in _CONSONANTS
] + [
    "ஸ்ரீ க்ஷ க்ஷ்ம தமிழ் ஜாதகம் பொருத்தம் நட்சத்திரம் ஶ்ரீ",
    "office affluent ffl fi fl ff Th",
    "-> => != === <= >= :: ... www 0O && || /* */ <!-- -->",
    "ā ṇ ḍ ṅ é õ",
]


def _shaping_differences(ref: TTFont, ours: TTFont, ref_cmap: dict[int, str]) -> list[str]:
    """Shape the samples with HarfBuzz in both fonts; return the ones that differ.

    Only samples the reference subset fully covers are shaped — a character
    outside it would be .notdef there and a real glyph here.
    """
    import uharfbuzz as hb

    def hb_font(tt: TTFont) -> tuple:
        buf = io.BytesIO()
        tt.flavor = None
        tt.save(buf)
        tt.flavor = "woff2"
        data = buf.getvalue()
        face = hb.Face(hb.Blob(data))
        return hb.Font(face), TTFont(io.BytesIO(data))

    (rf, rtt), (of, ott) = hb_font(ref), hb_font(ours)
    bad = []
    for text in SHAPING_SAMPLES:
        if any(ord(ch) not in ref_cmap for ch in text if ch != " "):
            continue
        for wght in (400, 700):
            runs = []
            for font, tt in ((rf, rtt), (of, ott)):
                font.set_variations({"wght": wght})
                buf = hb.Buffer()
                buf.add_str(text)
                buf.guess_segment_properties()
                hb.shape(font, buf)
                order = tt.getGlyphOrder()
                runs.append((buf.glyph_infos, buf.glyph_positions, tt.getGlyphSet(location={"wght": wght}), order))
            (ri, rp, rgs, ro), (oi, op, ogs, oo) = runs
            same = len(ri) == len(oi) and all(
                a.cluster == b.cluster
                and all(abs(x - y) <= TOLERANCE for x, y in zip(pa.position, pb.position))
                and _deviation(rgs, ro[a.codepoint], ogs, oo[b.codepoint]) <= TOLERANCE
                for a, b, pa, pb in zip(ri, oi, rp, op)
            )
            if not same:
                bad.append(f"{text[:12]}@{wght}")
    return bad


def verify(tmp: Path) -> int:
    failures = 0
    for name, _sha, _src, query, subsets in FACES:
        ours = TTFont(OUT / name)
        css = fetch(f"https://fonts.googleapis.com/css2?family={query}&display=swap").decode()
        refs = {
            sub: url
            for sub, url in re.findall(r"/\* ([\w-]+) \*/\s*@font-face \{.*?url\((.*?)\)", css, re.S)
        }
        for sub in subsets:
            ref_path = tmp / f"ref-{name}-{sub}.woff2"
            if not ref_path.exists():
                ref_path.write_bytes(fetch(refs[sub]))
            ref = TTFont(ref_path)
            ours_cmap, ref_cmap = ours.getBestCmap(), ref.getBestCmap()
            missing = [cp for cp in ref_cmap if cp not in ours_cmap]
            shaped_bad = _shaping_differences(ref, ours, ref_cmap)
            diff: set[int] = set()
            worst = 0.0
            # The two ends of the weights the app declares: matching outlines at
            # both mean the variation data matches too, not only the default.
            for wght in (400, 700):
                ref_gs = ref.getGlyphSet(location={"wght": wght})
                ours_gs = ours.getGlyphSet(location={"wght": wght})
                for cp, rg in ref_cmap.items():
                    og = ours_cmap.get(cp)
                    if og is None:
                        continue
                    dev = _deviation(ref_gs, rg, ours_gs, og)
                    worst = max(worst, dev)
                    if dev > TOLERANCE:
                        diff.add(cp)
            ref_axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in ref["fvar"].axes]
            our_axes = [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in ours["fvar"].axes]
            ok = not missing and not diff and not shaped_bad and ref_axes == our_axes
            failures += not ok
            print(
                f"{'OK  ' if ok else 'FAIL'} {name:24} {sub:10} {len(ref_cmap):4} code points"
                f"  missing={len(missing)} differ={len(diff)} shaping={len(shaped_bad)} bad"
                f" worst={worst:.2f}u axes={'same' if ref_axes == our_axes else (ref_axes, our_axes)}"
                + (f"  e.g. {[hex(c) for c in (missing + sorted(diff))[:8]]} {shaped_bad[:4]}" if not ok else "")
            )
    return failures


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    with tempfile.TemporaryDirectory() as d:
        if args.verify:
            return 1 if verify(Path(d)) else 0
        build(Path(d))
    return 0


if __name__ == "__main__":
    sys.exit(main())

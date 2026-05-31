from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN_DIRS = [ROOT / "app", ROOT / "web", ROOT / "docs", ROOT / "tests"]
TEXT_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".yml", ".yaml", ".toml", ".ps1", ".sql"}
EXCLUDE_PARTS = {"node_modules", ".next", ".git", "__pycache__", "artifacts"}

# Common mojibake markers seen when UTF-8 Tamil gets decoded/written incorrectly.
MOJIBAKE_MARKERS = (
    "\u00e0\u00ae",  # Tamil bytes mis-decoded
    "\u00e0\u00af",
    "\u00e2\u20ac\u201d",  # em dash mojibake
    "\u00e2\u20ac",        # smart quote mojibake prefix
    "\u00ef\u00b8",        # variation selector mojibake prefix
    "\u00c2\u00b7",        # stray lead byte before middle dot
    "\uFFFD",              # replacement character
)


def _iter_text_files() -> list[Path]:
    files: list[Path] = []
    for base in SCAN_DIRS:
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
                continue
            if any(part in EXCLUDE_PARTS for part in path.parts):
                continue
            if path.name == "test_text_encoding_guard.py":
                continue
            files.append(path)
    return files


def test_no_mojibake_text_markers() -> None:
    findings: list[str] = []
    for path in _iter_text_files():
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except UnicodeDecodeError:
            findings.append(f"{path.relative_to(ROOT)}: cannot decode as UTF-8")
            continue

        for idx, line in enumerate(lines, start=1):
            if any(marker in line for marker in MOJIBAKE_MARKERS):
                findings.append(f"{path.relative_to(ROOT)}:{idx}: {line.strip()[:160]}")

    assert not findings, "Found potential mojibake markers:\n" + "\n".join(findings)

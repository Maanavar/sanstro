"""Compare the host's requirements.txt (on stdin) against what is installed here.

Run inside the backend container by dev-docker.ps1. The point is to catch the
case where the image was built before a dependency change: only app/ is mounted,
so the container keeps serving the OLD tree while the mounted source expects the
new one. That surfaces as a route-level ImportError or a quiet version
difference -- never as anything that looks like a stale image.

The host file arrives on stdin deliberately. Reading /app/requirements.txt
instead would compare the image's own baked copy against the image's own
packages, which is circular and always passes.

Exit 0 = no drift, 1 = drift (printed to stdout), 2 = the check itself broke.
The caller distinguishes 1 from 2: a checker that crashes must not read as a
pass, which is how the first version of this gate could not fail.
"""

from __future__ import annotations

import re
import sys

# Lines whose environment marker does not apply to this interpreter. The
# requirements lock carries both Swiss Ephemeris bindings:
#   pyswisseph   ; python_version <  '3.14'   <- what this image (3.12) installs
#   swisseph-ffi ; python_version >= '3.14'   <- the host venv's, absent here
# so swisseph-ffi being missing is correct, not drift.
EXPECTED_ABSENT = {"swisseph-ffi"}

PIN = re.compile(r"^([A-Za-z0-9._-]+)==([^;]+?)\s*(;.*)?$")


def main() -> int:
    try:
        import importlib.metadata as md

        # PowerShell prepends a UTF-8 BOM when it pipes to a native exe, so the
        # FIRST line arrives as '﻿alembic==1.18.4' and matches no pin
        # pattern. That is not cosmetic: it silently drops one pin from the
        # comparison. It went unnoticed because requirements.txt happens to open
        # with a comment, so the BOM landed on a line that was discarded anyway
        # -- the gate was one reordered file away from skipping a real package.
        text = sys.stdin.read().lstrip('﻿')

        wanted: dict[str, tuple[str, str]] = {}
        for raw in text.splitlines():
            line = raw.split("#")[0].strip()
            match = PIN.match(line)
            if match:
                name = match.group(1).lower().replace("_", "-")
                wanted[name] = (match.group(2).strip(), match.group(3) or "")

        if not wanted:
            print("check-dep-drift: no pins found on stdin", file=sys.stderr)
            return 2

        drift: list[str] = []
        for name, (version, marker) in sorted(wanted.items()):
            if name in EXPECTED_ABSENT:
                continue
            try:
                installed = md.version(name)
            except md.PackageNotFoundError:
                drift.append(f"{name}: requirements.txt pins {version}, MISSING from image{marker}")
                continue
            if installed != version:
                drift.append(f"{name}: requirements.txt pins {version}, image has {installed}")

        for line in drift:
            print(line)
        return 1 if drift else 0
    except Exception as exc:  # the checker broke, which is not a pass
        print(f"check-dep-drift failed: {exc!r}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())

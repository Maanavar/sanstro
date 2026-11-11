"""Recover the readable text of a PDF with no key and no PDF library.

Used by tests/test_birth_data_at_rest.py to ask the only question that matters
for A12: can the birth facts be read back out of a stored document by someone
who has the bytes and nothing else?

**Compression is not protection.** reportlab writes
`/Filter [ /ASCII85Decode /FlateDecode ]`, so recovering the page text is an
ASCII85-decode followed by an inflate -- two standard transforms, no key. A
probe that does not do both finds nothing and passes vacuously, which is
exactly what the first version of this helper did: it called `zlib.decompress`
on ASCII85 text, inflated zero streams, and reported the document clean while
the birth place sat in it.

`_SELF_CHECK_NEEDLES` exists for that reason. A caller asserts the probe found
something it *must* find, so a probe that silently stops working fails loudly
instead of passing everything.
"""
from __future__ import annotations

import base64
import zlib

#: Text every report PDF carries in its uncompressed document-info dictionary.
#: Not evidence of a leak -- a title is not a birth fact -- but evidence the
#: probe is reading the file at all.
_SELF_CHECK_NEEDLES = ("Jadhagam", "Report")


def pdf_readable_text(blob: bytes) -> tuple[str, int]:
    """(everything recoverable, number of streams successfully inflated).

    The count is the probe's own proof of life: a PDF whose page content never
    inflated has not been examined, whatever the search then says.
    """
    parts = [blob.decode("latin1")]
    inflated = 0
    index = 0
    while True:
        start = blob.find(b"stream", index)
        if start == -1:
            break
        start += len(b"stream")
        while start < len(blob) and blob[start] in (0x0D, 0x0A):
            start += 1
        end = blob.find(b"endstream", start)
        if end == -1:
            break
        raw = bytes(blob[start:end]).strip()
        if raw.endswith(b"~>"):
            raw = raw[:-2]
        try:
            raw = base64.a85decode(raw)
        except ValueError:
            pass  # Not ASCII85-wrapped; try the bytes as they are.
        try:
            # decompressobj, not decompress: there is an EOL between the data
            # and `endstream` and decompress() rejects it as trailing garbage,
            # which is how this probe first inflated nothing at all.
            parts.append(zlib.decompressobj().decompress(raw).decode("latin1"))
            inflated += 1
        except zlib.error:
            pass
        # Past the whole keyword. `index = end` made the next find(b"stream")
        # match the "stream" inside this "endstream", which paired the next
        # real stream's data with garbage and skipped EVERY SECOND STREAM: on
        # a two-page report only page 1 was ever examined (found 2026-11-11).
        index = end + len(b"endstream")
    return "\n".join(parts), inflated


def count_streams(blob: bytes) -> int:
    """How many `stream ... endstream` objects the file holds, independently of
    the scan above, so a caller can prove the probe read all of them."""
    return blob.count(b"endstream")


def assert_probe_works(readable: str, inflated: int, blob: bytes | None = None) -> None:
    """Fail unless the probe actually read the document.

    Without this, every leak assertion built on it is vacuous. Pass `blob` to
    also require that EVERY stream was inflated: `inflated > 0` alone passed
    while the scan skipped every second stream (one page of two).
    """
    assert inflated > 0, (
        "the PDF probe inflated no streams, so it examined nothing -- "
        "any 'no leak' result from it is meaningless"
    )
    if blob is not None:
        total = count_streams(blob)
        assert inflated == total, (
            f"the PDF probe inflated {inflated} of {total} streams; the rest of "
            "the document was never examined"
        )
    missing = [n for n in _SELF_CHECK_NEEDLES if n not in readable]
    assert not missing, (
        f"the PDF probe could not find {missing!r}, which every report carries; "
        "it is no longer reading these documents"
    )

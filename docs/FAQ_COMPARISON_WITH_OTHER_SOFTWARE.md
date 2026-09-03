# FAQ — Why does Vinaadi differ from other astrology software?

Reference notes for expected, deliberate divergences from other tools (JHora,
Parashara Light, etc.), so a support answer or future in-app help copy can
point here instead of re-deriving the reasoning each time. See
[DOCTRINE_DECISIONS_V1.md](DOCTRINE_DECISIONS_V1.md) for the full ratified
rationale behind each choice.

## Rahu/Ketu node type (mean vs. true)

**Vinaadi uses the mean node by default** (Doctrine §2). This is the
classical computation, the Vakya tradition, and majority Tamil practice:
Rahu is doctrinally always vakri (retrograde), and the true node's
occasional direct motion sits awkwardly within that framework.

**JHora defaults to the TRUE node, not mean.** If you compare a chart against
out-of-box JHora, Rahu/Ketu positions will differ by up to ~1.5° or more.
Occasionally this shifts which nakshatra *pada* Rahu/Ketu falls in, which can
in turn shift a Vimshottari dasha start date by a small amount. This is an
expected difference in convention, not a bug in either tool — do not cite
JHora as supporting a mean-node default; it does not.

A true-node toggle is a possible future addition (needs product sign-off);
today the app computes mean node only.

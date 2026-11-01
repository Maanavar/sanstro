# Rulings: AAU-10, AAU-11, AAU-15, AAU-18 (2026-10-29)

**Ruled by:** Claude, acting as the astrologer under the owner's delegation of the audit's open
items. **Countersign pending** by a Tamil practitioner (AAU-18 by the native reviewer) before these
enter `DOCTRINE_DECISIONS_V1.md`. Layer tags follow the consolidated rulings of the same date:
கணிதம் (calculation), பலன் (interpretation), grading (Vinaadi product policy).

| ID | Question | Ruling | Layer | Status |
|---|---|---|---|---|
| AAU-10 | Where does the 1st house start in sama bhava? | The lagna degree is the **middle** of the 1st house: house *n* runs lagna + 30°(n−1) − 15° to + 15°. | கணிதம் | Settled |
| AAU-11 | Sunapha, Anapha and Durudhura together? | **Durudhura alone** when both sides of the Moon are occupied. | பலன் | Settled |
| AAU-15 | Which nitya yogas caution an ordinary day? | **One table of nine**; the daily caution and the strict muhurtham check both read all nine. | பலன் + grading | Settled |
| AAU-18 | One porutham, three spellings | **வசியம், மகேந்திரம், ஸ்திரீ தீர்க்கம்** (almanac forms). | Display | Settled, native review |

---

## AAU-10: the lagna is the bhava madhya

**Answer.** In Indian bhava reckoning the lagna degree is the middle of the 1st bhava, not its
start. In the equal-house (sama bhava) form every bhava is 30°, so house *n* is centred on
lagna + 30°·(n−1) and spans 15° either side. "Lagna → lagna + 30°" is the Western equal-house
convention; a Tamil reader asking for சம பாவம் expects the madhya form.

**Why it matters.** The panel lists "planets that change house between rasi and bhava". On the
Western convention, every planet whose degree is below the lagna degree is pushed back a house,
which is not what a Tamil reader's bhava chart shows. With lagna Meenam 5.9°, the Moon at Magaram
3.9° is the 10th on the old reckoning and the 11th on madhya.

**Engineering.**

1. `equal_bhava.compute_equal_bhava`: offset the cusps by −15°.
2. `chart_planets.bhava_house` is persisted. It is recomputed whenever a chart is rebuilt; existing
   rows are refreshed by the normal chart recompute, never by an ad-hoc write to the dev database.
3. Update `tests/test_equal_bhava.py` to the madhya convention, with the Meenam 5.9° case pinned.

## AAU-11: Durudhura replaces Sunapha and Anapha

**Answer.** Phaladeepika 6.1 gives the three yogas "respectively" for planets (other than the Sun)
in the 2nd from the Moon, in the 12th, and in both. They are three cases of one rule, so a chart
has exactly one of them. (The practitioner is asked to confirm the reading and to name any other
text that differs.) Showing all three for one
configuration tells the reader three things happened when one did.

**Engineering.** `detect_sunapha_anapha_durudhura` emits Durudhura alone when both sides are
occupied, and Sunapha or Anapha alone otherwise. Test: no chart ever carries Durudhura together
with Sunapha or Anapha.

## AAU-15: one table of nine inauspicious yogas

**Answer.** The standard muhurta list of nitya yogas to avoid for auspicious work has nine, and the
app's strict muhurtham check already holds exactly these: Vishkambha, Atiganda, Shoola, Ganda,
Vyaghata, Vajra, Vyatipata, Parigha, Vaidhriti. (Source to be named by the practitioner.) The daily
score used a six-yoga subset with no recorded reason, so a Parigha day was quiet in Today while
the muhurtham search refused it. That is the drift the audit found, not a policy.

- **Ruling.** One classification table, the nine. The daily caution and the strict muhurtham check
  both read it. The strict check is not made looser.
- **Grading (policy).** The daily yoga term keeps its present weight. A caution yoga is one input
  to the day score, not a veto. Vyatipata and Vaidhriti (the two mahapatas) are not weighted
  higher here; that would be a new rule needing a source.
- **Not ruled here.** Some texts avoid only the first few ghatikas of certain yogas (for example
  Vishkambha's first three). That is a partial-day refinement for the muhurta engine, not for a
  whole-day caution. It is recorded as an open question for the practitioner.

## AAU-18: the almanac spellings

**Answer.** The standing rule (2026-07-20, the project astrologer) is that display names follow what
a Tamil almanac prints, not the Sanskrit respelled in Tamil script. Almanacs print:

| Porutham | Use | Not |
|---|---|---|
| Vasya | **வசியம்** | வாஸ்யம் |
| Mahendra | **மகேந்திரம்** | மாஹேந்திரம் |
| Stree Deergha | **ஸ்திரீ தீர்க்கம்** | ஸ்திரீ தீர்கம் (the doubled க் is standard spelling) |

**Engineering.** One spelling per porutham, used by the server result screens
(`porutham.py`, `synastry_service.py`) and the mobile learn page (`learnContent.ts`). Add a drift
test that fails if any of the rejected spellings reappears. **Native reviewer:** confirm the three.

---

## For the countersigning practitioner

1. AAU-10: is the lagna the bhava madhya for sama bhava?
2. AAU-11: does Durudhura replace Sunapha and Anapha?
3. AAU-15: should all nine yogas caution an ordinary day? Should any be avoided only for their
   first ghatikas?
4. AAU-18 (native reviewer): வசியம், மகேந்திரம், ஸ்திரீ தீர்க்கம் — confirm.

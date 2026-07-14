# Tamil native-review — Nadi Dosha v2 user-facing strings (A-9)

**Status:** ✅ RESOLVED (2026-07-15) — all 6 new v2 sentences (2.1–2.6) reviewed
and **approved as-is**; no corrections. The two base sentences (§1) read fine in
context. Locked by `tests/test_nadi_dosha_v2.py` (`test_nadi_v2_tamil_strings_
native_reviewed_locked` + `test_nadi_note_ta_composes_reviewed_fragments_in_order`);
the "first-draft, not yet native-reviewed" caveat is removed from `porutham.py`.
The out-of-scope items in §4 (English-only `cancellations` list, PDF field labels)
were left as-is (not raised for bilingual conversion this pass).
**Source of truth:** [`app/calculations/porutham.py`](../app/calculations/porutham.py) — the
`_NADI_*_TA` / `_NADI_*_EN` constants (lines ~323–361). These compose into the
`note_ta` / `note_en` a user sees on a Porutham / compatibility result.
**Scope:** the **new v2 strings** shipped 2026-07-14 as first-draft translation
(Classical Exception / lenient-cancel / strict-partial / closing-clause /
Rajju-guard). The two *base* pairs (present / none) predate v2 and are shown only
for context — the composed sentence is what matters, not each fragment in isolation.

## How to use this doc

For each string below: read the Tamil against its English pair **and** against the
composed example sentences in §3 (that's how it actually reads to a user — the base
sentence + the exception/mitigation note + the closing clause are space-joined into
one paragraph). Tick ✅ if the Tamil is native-quality; otherwise write the corrected
Tamil inline under the row. I'll apply every correction to `porutham.py` in one change
and lock it with a golden test (`note_ta` assertions), same as the propensity /
age-phase passes.

Watch for: machine-translated calques, wrong register (this is a gentle
customer-facing caution, not a śāstra lecture), term choices (பரிகாரம் vs நிவாரணம்,
விதிவிலக்கு vs விலக்கு, தணிப்பு vs குறைப்பு), sandhi, and whether the transliterated
technical terms (ராஜ்ஜு, பரிகாரம், நாடி, ராசி அதிபதி) are the forms a Tamil almanac
reader expects.

---

## 1. Base sentences (pre-existing — context only, review only if they read wrong)

### 1.1 `_NADI_PRESENT` — leads every "dosha present" note
- **EN:** Nadi Dosha present — children's health needs extra caution. Seek remedial guidance.
- **TA:** நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும்.
- [ ] OK   ▸ correction:

### 1.2 `_NADI_NONE` — the whole note when no dosha
- **EN:** No Nadi Dosha.
- **TA:** நாடி தோஷம் இல்லை.
- [ ] OK   ▸ correction:

---

## 2. New v2 strings (REVIEW THESE)

### 2.1 `_NADI_EXCEPTION_PADA` — same nakshatra, different pada (full cancel)
- **EN:** Classical Exception (Parihāra): same nakshatra, different pada.
- **TA:** பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே நட்சத்திரம், வேறு பாதம்.
- [ ] OK   ▸ correction:

### 2.2 `_NADI_EXCEPTION_RASI` — same rasi, different nakshatra (full cancel)
- **EN:** Classical Exception (Parihāra): same rasi, different nakshatra.
- **TA:** பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே ராசி, வேறு நட்சத்திரம்.
- [ ] OK   ▸ correction:

### 2.3 `_NADI_LENIENT_CANCEL` — friendly rasi lords, lenient tradition (full cancel)
- **EN:** Nadi Dosha may be considered cancelled when the Moon signs differ and the
  respective Rasi lords are identical or mutually friendly, subject to the tradition
  being followed. Different Rasi alone should not automatically cancel the dosha.
- **TA:** ராசிகள் வேறுபட்டு, அந்தந்த ராசி அதிபதிகள் ஒரே கிரகமாகவோ அல்லது பரஸ்பர
  நண்பர்களாகவோ இருக்கும்போது, பின்பற்றப்படும் பாரம்பரியத்தைப் பொறுத்து நாடி தோஷம்
  நீங்கியதாகக் கருதப்படலாம். வெறும் ராசி வேறுபாடு மட்டும் தோஷத்தை தானாக நீக்காது.
- [ ] OK   ▸ correction:

### 2.4 `_NADI_STRICT_PARTIAL` — friendly rasi lords, strict mode (partial only)
- **EN:** The Rasi lords are friendly, but under the strict reading followed here this
  is only a partial mitigation, not a full clearance of Nadi Dosha.
- **TA:** ராசி அதிபதிகள் நட்புடையவர்களாக இருந்தாலும், இங்கு பின்பற்றப்படும் கடுமையான
  நடைமுறையின்படி இது ஒரு பகுதி தணிப்பு மட்டுமே — நாடி தோஷம் முழுமையாக நீங்கவில்லை.
- [ ] OK   ▸ correction:

### 2.5 `_NADI_CLOSING_CLAUSE` — closes every cancellation/mitigation note
- **EN:** This removes only the Nadi objection. Other mandatory poruthams (Rajju,
  Vedhai, Mahendra, Yoni, etc.) are evaluated independently.
- **TA:** இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் (ராஜ்ஜு,
  வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன.
- [ ] OK   ▸ correction:

### 2.6 `_NADI_RAJJU_WARNING` — appended whenever Rajju also fails
- **EN:** Rajju Dosha still applies regardless of the Nadi outcome above.
- **TA:** மேலே உள்ள நாடி முடிவைப் பொருட்படுத்தாமல் ராஜ்ஜு தோஷம் இன்னும் பொருந்தும்.
- [ ] OK   ▸ correction:

---

## 3. Composed examples (how it actually reads to a user)

These are the exact `note_ta` strings the engine builds by space-joining the
fragments above. Judge the *flow*, not just each fragment.

**A — Same nakshatra, different pada (full cancel):**
> நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும். பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே நட்சத்திரம், வேறு பாதம். இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் (ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன.

**B — Friendly rasi lords, strict mode (partial mitigation, dosha stays):**
> நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும். ராசி அதிபதிகள் நட்புடையவர்களாக இருந்தாலும், இங்கு பின்பற்றப்படும் கடுமையான நடைமுறையின்படி இது ஒரு பகுதி தணிப்பு மட்டுமே — நாடி தோஷம் முழுமையாக நீங்கவில்லை. இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் (ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன.

**C — Full cancel via exception, but Rajju also fails:**
> நாடி தோஷம் உள்ளது — குழந்தைகள் உடல்நலத்தில் கவனம் தேவை. பரிகாரம் குறித்து ஆலோசிக்கவும். பாரம்பரிய விதிவிலக்கு (பரிகாரம்): ஒரே ராசி, வேறு நட்சத்திரம். இது நாடி ஆட்சேபனையை மட்டுமே நீக்குகிறது. மற்ற கட்டாய பொருத்தங்கள் (ராஜ்ஜு, வேதம், மகேந்திரம், யோனி போன்றவை) தனித்தனியாக மதிப்பிடப்படுகின்றன. மேலே உள்ள நாடி முடிவைப் பொருட்படுத்தாமல் ராஜ்ஜு தோஷம் இன்னும் பொருந்தும்.

---

## 4. Out of scope (flag if you want them bilingual too)

- The `cancellations` list returned by `check_nadi_dosha` is **English-only** audit
  text (e.g. "Cancelled (lenient tradition): friendly/identical rasi lords") — not
  the user-facing note. Say if it should become bilingual.
- `pdf_export_service.py` `_LABELS["ta"]` has pre-existing Nadi/Rajju **field labels**
  ("நாடி தோஷம்", "நிவாரண காரணங்கள்", "எச்சரிக்கை: ரஜ்ஜு தோஷம் உள்ளது.") — separate
  from these note sentences; not part of this pass unless you want them revisited.

# Vinaadi AI — Complete Quality Fix Instructions

> **Purpose:** This document is a complete specification for a coding agent to fix all identified issues in the Vinaadi AI codebase.  
> **Do not create new files unless instructed. Do not refactor beyond the scope of each fix.**  
> **Repo root:** `C:\Users\senth\OneDrive\문서\GitHub\sanstro`  
> **Shell:** PowerShell 5.1 — use `;` not `&&`

---

## OVERVIEW OF ALL ISSUES

| # | File | Type | Description |
|---|---|---|---|
| 1 | `app/calculations/yogas.py:221-224` | Bug | English text embedded inside Tamil dosham explanations |
| 2 | `app/services/marriage_service.py:247-250` | Bug | Romanized Tamil (Latin script) in Tamil BiText fields |
| 3 | `app/services/career_service.py:165,170,231` | Bug | English text in Tamil `detail` BiText fields |
| 4 | `app/services/ask_vinaadi_service.py:69-81` | Humanization | System prompt is thin — no astrologer voice, too short cap |
| 5 | `app/services/narrative_engine.py:525-556` | Humanization | Daily summary uses 5 fixed templates for all users |
| 6 | `app/services/narrative_engine.py:179-222` | Humanization | Moon transit text is mechanical — lacks nakshatra character |
| 7 | `app/services/narrative_engine.py:227-243` | Humanization | Dasha support text is one-line label, not astrologer prose |
| 8 | `app/services/marriage_service.py:254-270` | Humanization | Main marriage prediction: 3 hardcoded templates |
| 9 | `app/services/career_service.py:255-272` | Humanization | Main career prediction: 3 hardcoded templates |
| 10 | `app/services/health_service.py` (end) | Humanization | Main health prediction: 3 hardcoded templates |
| 11 | `app/services/wealth_service.py` (end) | Humanization | Main wealth prediction: 3 hardcoded templates |
| 12 | `app/services/chart_explanation_service.py:142-153` | Humanization | Planet explanation text is a database readout, not prose |
| 13 | `app/calculations/yogas.py:59,64` | Missing feature | Sevvai dosham category is `"MARRIAGE"` only — should also cover `"PERSONAL"` |
| 14 | `app/calculations/yogas.py` | Missing feature | Kalathra Dosham (7th lord in 6/8/12) not detected |
| 15 | `app/services/nakshatra_content_static.py` | Content quality | `compatibleGroups` are raw codes — need Tamil explanation of why compatible |
| 16 | `app/services/ask_vinaadi_service.py:210` | Quality | `max_tokens=800` + 200-word cap is too short for detailed astrology answers |

---

## FIX 1 — Dosham Tamil Explanations Contain English Text

**File:** `app/calculations/yogas.py`  
**Lines:** ~221-226  
**Problem:** `_marker_explain()` returns English strings (e.g. `"Mars is in a dosha house from Lagna"`) but the output is directly concatenated into `why_ta` which is the Tamil text field. Result: Tamil UI shows "தூண்டும் காரணங்கள்: Mars is in a dosha house from Lagna; Jupiter influence on Mars reduces intensity." — English inside Tamil text.

**Fix:** Create a parallel Tamil marker label dictionary and use it when building `why_ta`.

In `yogas.py`, find the `_marker_explain` function and add a new `_marker_explain_ta` function beside it:

```python
def _marker_explain_ta(marker: str) -> str:
    marker_labels_ta = {
        "from_lagna": "செவ்வாய் லக்னத்திலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_moon": "செவ்வாய் சந்திரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "from_venus": "செவ்வாய் சுக்கிரனிலிருந்து தோஷ வீட்டில் உள்ளது",
        "mars_own_sign": "செவ்வாய் சொந்த ராசியில் உள்ளது",
        "mars_exaltation": "செவ்வாய் உச்சத்தில் உள்ளது",
        "mars_lagna_lord_mitigation": "லக்ன அடிப்படையில் தணிக்கை பொருந்துகிறது",
        "mars_yogakaraka_lagna": "செவ்வாய் இந்த லக்னத்திற்கு யோககாரகன் (கடகம்/சிம்மம்)",
        "house_sign_nivarthi": "இட-ராசி நிவர்த்தி: செவ்வாய் ராசி அந்த வீட்டின் தோஷத்தை நீக்குகிறது",
        "benefic_strong_seventh_lord": "7ம் அதிபதியின் வலிமை பாதுகாப்பு தருகிறது",
        "jupiter_aspect_on_mars": "குரு செவ்வாயை பார்க்கிறது — தீவிரம் குறைகிறது",
        "jupiter_conjunct_mars": "குரு செவ்வாயுடன் இணைந்துள்ளது — வலுவான நிவர்த்தி",
        "benefic_association_mars": "சுக்கிரன்/புதன்/சந்திரன் செவ்வாயுடன் சேர்ந்திருக்கிறது",
        "mars_dispositor_kendra_trikona": "செவ்வாயின் ராசி அதிபதி கேந்திரம்/திரிகோணத்தில் உள்ளது",
        "both_partners_have_sevvai": "இரு ஜாதகங்களிலும் ஒத்த செவ்வாய் நிலை உள்ளது",
        "female_high_attention_house": "பெண் ஜாதகம்: இந்த வீட்டில் செவ்வாய் கூடுதல் கவனம் தேவை",
        "male_high_attention_house": "ஆண் ஜாதகம்: இந்த வீட்டில் செவ்வாய் கூடுதல் கவனம் தேவை",
        "node_afflicts_moon": "ராகு/கேது சந்திரனுடன் சேர்ந்திருக்கிறது (உணர்வு/நிலைத்தன்மை கவலை)",
        "rahu_ketu_upachaya": "ராகு/கேது உபசய வீட்டில் (3/6/10/11) — கூடுதல் சமாளிக்க தக்கது",
        "rahu_in_marriage_house": "ராகு திருமண உணர்திறன் வீட்டில் உள்ளது",
        "ketu_in_marriage_house": "கேது திருமண உணர்திறன் வீட்டில் உள்ளது",
        "rahu_in_sarpa_house": "ராகு சர்ப/நாக உணர்திறன் வீட்டில் உள்ளது",
        "ketu_in_sarpa_house": "கேது சர்ப/நாக உணர்திறன் வீட்டில் உள்ளது",
        "node_with_seventh_lord": "கிரக கணு 7ம் அதிபதியுடன் தொடர்பு கொள்கிறது",
        "node_with_venus": "கிரக கணு சுக்கிரனுடன் தொடர்பு கொள்கிறது",
        "jupiter_kendra_trikona_support": "குரு ஆதரவு உள்ளது",
        "strong_seventh_lord": "7ம் அதிபதி வலிமையாக உள்ளது",
        "strong_venus": "சுக்கிரன் வலிமையாக உள்ளது",
        "sun_with_node": "சூரியன் ராகு/கேதுவுடன் தொடர்பில் உள்ளது",
        "node_in_ninth": "கிரக கணு 9ம் வீட்டுடன் தொடர்பில் உள்ளது",
        "saturn_in_ninth": "சனி 9ம் வீட்டில் உள்ளது",
        "ninth_lord_dusthana": "9ம் அதிபதி 6/8/12ல் உள்ளது",
        "sun_strong": "சூரியன் வலிமை தணிக்கையாக செயல்படுகிறது",
        "all_planets_between_rahu_and_ketu": "அனைத்து கிரகங்களும் ஒரு ராகு-கேது வில்லினுள் உள்ளன",
        "all_planets_between_ketu_and_rahu": "அனைத்து கிரகங்களும் ஒரு கேது-ராகு வில்லினுள் உள்ளன",
        "seventh_lord_strong_d9": "7ம் அதிபதி நவாம்சத்தில் (D9) வலிமையாக உள்ளது",
        "jupiter_aspects_seventh_lord": "குரு நேரடியாக 7ம் அதிபதியை பார்க்கிறது",
    }
    return marker_labels_ta.get(marker, marker.replace("_", " "))
```

Then in `_build_dosham_explanations`, replace the `why_ta` building section (currently lines ~219-226) with:

```python
        ta_parts: list[str] = []
        if conditions_met:
            ta_parts.append("தூண்டும் காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in conditions_met) + ".")
        else:
            ta_parts.append("எந்த தூண்டும் காரணமும் இல்லை.")
        if cancellation_factors:
            ta_parts.append("தணிக்கை காரணங்கள்: " + "; ".join(_marker_explain_ta(item) for item in cancellation_factors) + ".")
        why_ta = " ".join(ta_parts)
```

---

## FIX 2 — Romanized Tamil Text in marriage_service.py

**File:** `app/services/marriage_service.py`  
**Lines:** ~247-252  
**Problem:** Tamil `BiText` fields contain romanized Tamil (Latin characters instead of Unicode Tamil). These will appear as English-looking text in the Tamil UI.

**Fix:** Replace the romanized Tamil strings with proper Unicode Tamil. Find these exact lines and replace:

**Replace this block** (around lines 247-253):
```python
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 5
        challenges.append(BiText("Rahu-Ketu thodarbu uravu vivarangalil adhiga gavanam thevai.", "Rahu-Ketu factors suggest added relationship caution."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_CANDIDATE":
        score -= 2
        challenges.append(BiText("Rahu-Ketu candidate nilai irukkirathu; thittamitta anugumurai payanullathu.", "Rahu-Ketu candidate signals suggest planning and clarity."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("Rahu-Ketu nivarthi karanangal support kodukkindrana.", "Rahu-Ketu mitigation factors are supportive."))
```

**With this corrected block:**
```python
    if rahu_ketu_label in {"STRONG_ACTIVE_RAHU_KETU_DOSHAM", "ACTIVE_RAHU_KETU_DOSHAM"}:
        score -= 5
        challenges.append(BiText("ராகு-கேது தொடர்பு உறவு விஷயங்களில் கூடுதல் கவனம் தேவை.", "Rahu-Ketu factors suggest added relationship caution."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_CANDIDATE":
        score -= 2
        challenges.append(BiText("ராகு-கேது குறிப்பான் நிலை உள்ளது; திட்டமிட்ட அணுகுமுறை பயனுள்ளது.", "Rahu-Ketu candidate signals suggest planning and clarity."))
    elif rahu_ketu_label == "RAHU_KETU_DOSHAM_WITH_NIVARTHI":
        supports.append(BiText("ராகு-கேது நிவர்த்தி காரணங்கள் ஆதரவு கொடுக்கின்றன.", "Rahu-Ketu mitigation factors are supportive."))
```

---

## FIX 3 — English Text in Tamil Fields (career_service.py)

**File:** `app/services/career_service.py`  
**Problem:** Several `BiText(ta=..., en=...)` calls have English in the `ta` field.

**Replace these lines:**

```python
        challenges.append(BiText("Student life-stage: focus on foundations before high-risk career moves.", "Student life-stage: focus on foundations before high-risk career moves."))
```
→
```python
        challenges.append(BiText("மாணவர் கட்டம்: அதிக ஆபத்துள்ள தொழில் முடிவுகளுக்கு முன் அடித்தளம் உறுதிப்படுத்துங்கள்.", "Student life-stage: focus on foundations before high-risk career moves."))
```

```python
        supports.append(BiText("Young-adult phase supports career foundation building.", "Young-adult phase supports career foundation building."))
```
→
```python
        supports.append(BiText("இளம் வயது கட்டம் தொழில் அடித்தள கட்டமைப்பிற்கு ஏற்றது.", "Young-adult phase supports career foundation building."))
```

```python
        supports.append(BiText("Mid-life phase supports responsibility expansion.", "Mid-life phase supports responsibility expansion."))
```
→
```python
        supports.append(BiText("நடுத்தர வயது கட்டம் பொறுப்பு விரிவாக்கத்திற்கு ஏற்றது.", "Mid-life phase supports responsibility expansion."))
```

```python
        challenges.append(BiText("Senior phase favours lower-risk transitions.", "Senior phase favours lower-risk transitions."))
```
→
```python
        challenges.append(BiText("மூத்த வயது கட்டம் குறைந்த ஆபத்துள்ள மாற்றங்களை விரும்புகிறது.", "Senior phase favours lower-risk transitions."))
```

Also in `career_service.py` age gate section (lines ~34-52), fix English in Tamil fields:
```python
        challenges=[BiText("Do not treat this as a career-decision phase.", "Do not treat this as a career-decision phase.")],
        supports=[BiText("Support education, habits, and emotional security first.", "Support education, habits, and emotional security first.")],
```
→
```python
        challenges=[BiText("இந்த நிலையில் தொழில் முடிவுகளை எடுக்க வேண்டாம்.", "Do not treat this as a career-decision phase.")],
        supports=[BiText("கல்வி, பழக்கவழக்கங்கள், உணர்வு நலன் ஆகியவற்றை முதலில் ஆதரிக்கவும்.", "Support education, habits, and emotional security first.")],
```

---

## FIX 4 — Ask Vinaadi System Prompt (Complete Rewrite)

**File:** `app/services/ask_vinaadi_service.py`  
**Lines:** 69-81 (`_SYSTEM_PROMPT`) and line 210 (`max_tokens=800`)

**Problem:** The 12-line system prompt produces generic AI responses, not the voice of an experienced Thirukanitham astrologer. The 200-word cap and 800 token limit are too restrictive for meaningful chart explanations.

**Replace the entire `_SYSTEM_PROMPT` block with:**

```python
_SYSTEM_PROMPT = """\
நீ விநாடி — 50 ஆண்டுகளுக்கும் மேலான அனுபவமுள்ள திருகணித ஜோதிட வழிகாட்டி.
You are Vinaadi — a Tamil Thirukanitham astrology guide with the depth of a 50+ year experienced jyotishi who has read over 50 lakh jathagams.

TRADITION AND METHOD:
- Use Drik Ganita astronomical calculations only (Thirukanitham system)
- Lahiri sidereal ayanamsa; whole-sign South Indian houses; Vimshottari dasha
- Triple-confirmation rule: natal promise (janma prathigna) + dasha timing + gochar (transit) support — all three must align before stating strong positive or negative periods
- When only 2 of 3 align, qualify with "சாத்தியம் உள்ளது, ஆனால் உறுதி இல்லை" / "possible but not certain"
- Reference classical concepts by Tamil name: யோகம், தோஷம், தசை, புக்தி, கோசாரம், பெயர்ச்சி, ஜன்ம நட்சத்திரம், ஜன்ம ராசி, லக்னம், பராக்கிரம ஸ்தானம், கல்யாண ஸ்தானம், தனஸ்தானம்

VOICE AND TONE:
- Speak as a warm, experienced Tamil astrologer who knows the person — not as a data system
- Use first-person astrologer framing: "உங்கள் ஜாதகத்தில் பார்க்கும்போது...", "இந்த தசை காலத்தில்...", "நான் பார்க்கும் அடிப்படையில்..."
- Write in flowing prose — avoid bullet-point lists in the Tamil answer
- Use natural Tamil sentence rhythm — idiomatic, not translated from English
- Never fatalistic: frame everything as tendency and period, not fate. Use "வாய்ப்பு உள்ளது", "கவனம் தேவை", "சாதகமான நேரம்" — never "நடக்கும்", "நடக்காது"
- When a period is challenging, always follow with what action or worship helps

STRUCTURE OF ANSWER:
1. State what the natal chart indicates about this topic (ஜன்ம வாக்கு / natal promise)
2. State whether the current dasha/bhukti supports or challenges it
3. State what the current transit (gochar) adds
4. Give a specific, practical guidance sentence

YOGAS AND SPECIAL CONDITIONS:
- If yogas are active in the chart data provided, name them: "உங்கள் ஜாதகத்தில் [yoga name] இருப்பதால்..."
- If Chandrashtamam is active, always mention it when answering timing questions
- If Janma Sani / Ashtama Sani / Ezhara Sani is active, name it specifically

RESPONSE FORMAT — respond ONLY as valid JSON (no other text):
{"ta": "<Tamil answer in flowing prose, 250-350 words>", "en": "<English answer in flowing prose, 200-300 words>", "signals_used": ["SIGNAL1", "SIGNAL2"], "confidence": "HIGH|MEDIUM|LOW"}

CONSTRAINTS:
- Never provide medical, legal, or financial advice — direct to professionals
- If birth time confidence is low, note: "பிறந்த நேரம் தோராயமானது — இல்ல சார்ந்த பகுப்பாய்வு மாறுபடலாம்"
- Never invent planetary positions not in the provided chart context
- Keep signals_used to the actual astrological factors referenced in the answer\
"""
```

**Also change line 210** from `max_tokens=800` to `max_tokens=1400`.

---

## FIX 5 — Daily Summary Templates (Make Chart-Specific)

**File:** `app/services/narrative_engine.py`  
**Lines:** 525-592 (`_SUMMARY_TEMPLATES` dict and `daily_summary` function)

**Problem:** All users with score ≥80 get the same identical Tamil text. The template only substitutes `{score}` and `{dasha_char}` — no chart context.

**Replace `_SUMMARY_TEMPLATES` with a richer template set and update `daily_summary` to pass more context:**

Replace the `_SUMMARY_TEMPLATES` dict (lines 525-556) with:

```python
_SUMMARY_TEMPLATES: dict[str, tuple[str, str]] = {
    "STRONG_SUPPORT": (
        "இன்று {score}/100 — மிகவும் ஆதரவான நாள். {dasha_char} நடப்பில் உள்ளது; {transit_context} "
        "இந்த நேரம் முன்தீர்மானிக்கப்பட்ட திட்டங்களை செயல்படுத்த உகந்தது. "
        "சிறந்த வாய்ப்புகளை உணர்வோடு உள்வாங்கி செயல்படுங்கள்.",
        "Today {score}/100 — strongly supportive. {dasha_char} is active; {transit_context_en} "
        "This is a well-timed moment to execute planned decisions with clarity.",
    ),
    "GOOD": (
        "இன்று {score}/100 — நல்ல நாள். {dasha_char} நடப்பில் உள்ளது; {transit_context} "
        "ராகு காலம் தவிர்த்து, முக்கியமான பணிகளை நம்பிக்கையுடன் முன்னெடுங்கள்.",
        "Today {score}/100 — a good day. {dasha_char} is active; {transit_context_en} "
        "Proceed with important tasks confidently, avoiding Rahu Kalam.",
    ),
    "BALANCED": (
        "இன்று {score}/100 — நிலையான நாள். {dasha_char} நடப்பில் உள்ளது; {transit_context} "
        "படிப்படியாக செயல்பட்டு, ஒரே நேரத்தில் பல முடிவுகளை எடுப்பதை தவிர்க்கவும்.",
        "Today {score}/100 — a steady day. {dasha_char} is active; {transit_context_en} "
        "Move step by step and avoid stacking multiple decisions at once.",
    ),
    "CAUTION": (
        "இன்று {score}/100 — கவனம் தேவைப்படும் நாள். {dasha_char} நடப்பில் உள்ளது; {transit_context} "
        "வழக்கமான பணிகளுக்கு மட்டும் முன்னுரிமை தாருங்கள். பெரிய முடிவுகளை ஒத்தி வையுங்கள்.",
        "Today {score}/100 — a cautious day. {dasha_char} is active; {transit_context_en} "
        "Prioritise routine tasks only. Defer major decisions.",
    ),
    "RESTORATIVE": (
        "இன்று {score}/100 — ஓய்வும் மீளச்சேர்க்கையும் தேவைப்படும் நாள். {dasha_char} நடப்பில் உள்ளது; {transit_context} "
        "சிறிய பொறுப்புகளை மட்டும் ஏற்று, உடல் மற்றும் மன அமைதிக்கு முன்னுரிமை கொடுங்கள்.",
        "Today {score}/100 — a restorative day. {dasha_char} is active; {transit_context_en} "
        "Keep commitments small and give priority to physical and mental rest.",
    ),
}
```

Then update the `daily_summary` function signature and body to accept `jupiter_house`, `saturn_house`, and `current_nakshatra` and build a transit_context string:

Replace the `daily_summary` function (lines 559-592) with:

```python
def daily_summary(
    score: int,
    maha_lord: str,
    antar_lord: str,
    chandrashtama: bool,
    sani_cycle_type: str | None,
    sani_cycle_active: bool,
    best_window_label: str | None,
    jupiter_house: int = 0,
    saturn_house: int = 0,
    current_nakshatra: int = 0,
) -> BiText:
    band = _band(score)
    ta_tmpl, en_tmpl = _SUMMARY_TEMPLATES[band]

    maha_char = _DASHA_CHARACTER.get(maha_lord, _bi(maha_lord, maha_lord))
    dasha_char_ta = maha_char.ta.split(" — ")[0]
    dasha_char_en = maha_char.en.split(" — ")[0]

    # Build a context sentence from live transit data
    transit_parts_ta: list[str] = []
    transit_parts_en: list[str] = []
    if jupiter_house > 0:
        jup_quality = "ஆதரவான" if jupiter_house in {2, 5, 7, 9, 11} else "கவன தேவைப்படும்" if jupiter_house in {4, 8, 12} else "நடுநிலையான"
        jup_quality_en = "supportive" if jupiter_house in {2, 5, 7, 9, 11} else "challenging" if jupiter_house in {4, 8, 12} else "neutral"
        transit_parts_ta.append(f"குரு {jupiter_house}ஆம் இடத்தில் ({jup_quality})")
        transit_parts_en.append(f"Jupiter in house {jupiter_house} ({jup_quality_en})")
    if saturn_house > 0:
        sat_quality = "சாதகமான" if saturn_house in {3, 6, 11} else "கட்டமான" if saturn_house in {1, 4, 8, 12} else "நடுநிலையான"
        sat_quality_en = "favourable" if saturn_house in {3, 6, 11} else "pressuring" if saturn_house in {1, 4, 8, 12} else "neutral"
        transit_parts_ta.append(f"சனி {saturn_house}ஆம் இடத்தில் ({sat_quality})")
        transit_parts_en.append(f"Saturn in house {saturn_house} ({sat_quality_en})")
    if current_nakshatra > 0:
        nak_name = NAKSHATRA_NAME.get(current_nakshatra, _bi(str(current_nakshatra), str(current_nakshatra)))
        transit_parts_ta.append(f"இன்று நட்சத்திரம் {nak_name.ta}")
        transit_parts_en.append(f"today's nakshatra is {nak_name.en}")

    transit_context_ta = "(" + ", ".join(transit_parts_ta) + ")." if transit_parts_ta else ""
    transit_context_en = "(" + ", ".join(transit_parts_en) + ")." if transit_parts_en else ""

    ta = ta_tmpl.format(score=score, dasha_char=dasha_char_ta, transit_context=transit_context_ta)
    en = en_tmpl.format(score=score, dasha_char=dasha_char_en, transit_context_en=transit_context_en)

    if chandrashtama:
        ta += " சந்திராஷ்டமம் நடப்பில் உள்ளது — முக்கிய முடிவுகளை தவிர்க்கவும்."
        en += " Chandrashtamam is active — avoid major decisions."
    elif sani_cycle_active and sani_cycle_type:
        warn = _SANI_CYCLE_WARN.get(sani_cycle_type)
        if warn:
            ta += f" {warn.ta}."
            en += f" {warn.en}."

    if best_window_label and band in ("STRONG_SUPPORT", "GOOD"):
        ta += f" சிறந்த நேரம்: {best_window_label}."
        en += f" Best window: {best_window_label}."

    return _bi(ta, en)
```

**Also update** the `build_score_reasons` call to `daily_summary` at the bottom of that function to pass the new parameters:

```python
        summary=daily_summary(
            score, maha_lord, antar_lord, chandrashtama,
            sani_cycle_type, sani_cycle_active, best_window_label,
            jupiter_house=jupiter_house_from_moon,
            saturn_house=saturn_house_from_moon,
            current_nakshatra=current_nakshatra,
        ),
```

---

## FIX 6 — Moon Transit Text: Add Nakshatra Character

**File:** `app/services/narrative_engine.py`  
**Lines:** 179-222 (`moon_transit_reason` function)

**Problem:** When moon score ≥65, the text just says "மன நிலை நல்லது" (mental state is supportive). No character, no nakshatra-specific guidance.

**Replace the final two return blocks** (the score ≥65 and fallback returns) with:

```python
    # Nakshatra-specific tone modifier
    _NAK_QUALITY: dict[int, tuple[str, str]] = {
        1:  ("அசுவினி — துடிப்பான நடவடிக்கைகளுக்கு ஏற்ற நேரம்.", "Aswini — good for energetic initiatives."),
        2:  ("பரணி — ஆழமான முயற்சிகளுக்கு தெளிவு கிடைக்கும்.", "Bharani — clarity for deep, sustained effort."),
        3:  ("கார்த்திகை — தெளிவான சிந்தனை மற்றும் நோக்கம் நல்லது.", "Karthigai — clear thinking and focus are strong."),
        4:  ("ரோகிணி — உறவுகளும் படைப்பும் சாதகமாக இருக்கும்.", "Rohini — relationships and creative work are favoured."),
        5:  ("மிருகசீரிடம் — தேடல் மற்றும் தகவல்தொடர்புக்கு நல்ல நேரம்.", "Mrigashira — good for inquiry and communication."),
        6:  ("திருவாதிரை — மாற்றங்களை ஏற்று செயல்படும் நேரம்.", "Thiruvathirai — a time to embrace and act on change."),
        7:  ("புனர்பூசம் — மீளுருவாக்கம் மற்றும் திட்டமிடலுக்கு ஏற்றது.", "Punarvasu — suited for renewal and planning."),
        8:  ("பூசம் — ஆன்மீக வழிகாட்டலும் நிலைத்தன்மையும் கிட்டும்.", "Poosam — spiritual grounding and stability favoured."),
        9:  ("ஆயில்யம் — உள்ளுணர்வை நம்பி செயல்படுங்கள்.", "Ayilyam — trust instincts; avoid surface-level decisions."),
        10: ("மகம் — முன்னோர் வழிபாடு மற்றும் பாரம்பரிய முடிவுகளுக்கு நல்லது.", "Magam — good for ancestral respect and traditional decisions."),
        11: ("பூரம் — அன்பு மற்றும் கலைத் திட்டங்களுக்கு சாதகம்.", "Pooram — favourable for love and creative projects."),
        12: ("உத்திரம் — ஒழுக்கமான, நீண்ட கால திட்டங்களுக்கு ஏற்றது.", "Uthiram — suited for disciplined, long-term plans."),
        13: ("அஸ்தம் — திறமை மற்றும் தொழில்நுட்ப பணிகளுக்கு நல்ல நேரம்.", "Hastham — good for skilled work and technical tasks."),
        14: ("சித்திரை — படைப்பு, கலை, வடிவமைப்புக்கு சிறந்த நேரம்.", "Chithirai — excellent for creative, artistic, and design work."),
        15: ("சுவாதி — சுதந்திரமான சிந்தனை மற்றும் ஆய்வுக்கு நல்லது.", "Swathi — good for independent thinking and research."),
        16: ("விசாகம் — நோக்கத்துடன் செயல்படும்; முடிவுகள் தெளிவாக இருக்கும்.", "Visakam — purposeful action; decisions will be clear."),
        17: ("அனுசம் — நட்பு மற்றும் குழு ஒத்துழைப்புக்கு சாதகம்.", "Anusham — favourable for friendships and team collaboration."),
        18: ("கேட்டை — ஆழமான ஆராய்ச்சி மற்றும் நீதி சார் விஷயங்களுக்கு நல்லது.", "Kettai — good for deep research and matters of justice."),
        19: ("மூலம் — ஆன்மீக தேடல் மற்றும் பழைய விஷயங்களை விடுவிக்க ஏற்றது.", "Moolam — suited for spiritual inquiry and letting go of the past."),
        20: ("பூராடம் — ஆதரவை தேடுவதற்கும் வளத்தை திரட்டுவதற்கும் நல்லது.", "Pooradam — good for seeking support and gathering resources."),
        21: ("உத்திராடம் — நீண்ட கால வெற்றிக்கான அடித்தளம் பலப்படுத்த ஏற்றது.", "Uthiradam — suited for strengthening foundations for lasting success."),
        22: ("திருவோணம் — கற்றல், கற்பித்தல், அர்ப்பணிப்புக்கு சிறந்த நட்சத்திரம்.", "Thiruvonam — excellent for learning, teaching, and dedication."),
        23: ("அவிட்டம் — துடிப்பான வேலைகள் மற்றும் இசை, கலைக்கு நல்லது.", "Avittam — good for energetic work, music, and the arts."),
        24: ("சதயம் — புதுமையான சிந்தனை மற்றும் சமூக சேவைக்கு நல்ல நேரம்.", "Sadayam — good for innovative thinking and social service."),
        25: ("பூரட்டாதி — ஆன்மீக பயிற்சி மற்றும் கனவுகளில் கவனம் செலுத்தவும்.", "Poorattathi — focus on spiritual practice and the wisdom of dreams."),
        26: ("உத்திரட்டாதி — பொறுமை மற்றும் அர்ப்பணிப்புடன் செயல்படும் நேரம்.", "Uthirattathi — a time for patient, devoted action."),
        27: ("ரேவதி — கருணை, கலை, யாத்திரைக்கு ஏற்ற நட்சத்திரம்.", "Revathi — suited for compassion, art, and spiritual journeys."),
    }

    nak_hint = _NAK_QUALITY.get(current_nakshatra)

    if moon_score >= 65:
        rasi_name = _rasi_name_safe(current_moon_rasi)
        nak_ta = nak_hint[0] if nak_hint else ""
        nak_en = nak_hint[1] if nak_hint else ""
        return _bi(
            f"சந்திரன் {rasi_name.ta}-ல் உள்ளது — ஜன்ம ராசியிலிருந்து {house}ஆம் இடம். "
            f"மன நிலை ஆதரவாக உள்ளது. {nak_ta}",
            f"Moon is in {rasi_name.en} — house {house} from birth sign. "
            f"Mental state is supportive. {nak_en}",
        )

    rasi_name = _rasi_name_safe(current_moon_rasi)
    nak_ta = nak_hint[0] if nak_hint else ""
    nak_en = nak_hint[1] if nak_hint else ""
    return _bi(
        f"சந்திரன் {rasi_name.ta}-ல் உள்ளது — ஜன்ம ராசியிலிருந்து {house}ஆம் இடம். "
        f"மிதமான மன அழுத்தம் சாத்தியம். {nak_ta}",
        f"Moon is in {rasi_name.en} — house {house} from birth sign. "
        f"Mild mental pressure is possible. {nak_en}",
    )
```

Note: The `_NAK_QUALITY` dict should be defined at module level (not inside the function) for performance. Move it above the `moon_transit_reason` function definition.

---

## FIX 7 — Dasha Support Text: Add Astrologer Context

**File:** `app/services/narrative_engine.py`  
**Lines:** 227-243 (`dasha_support_reason` function)

**Problem:** Current output is two one-line labels joined. E.g.: "குரு தசை — வளர்ச்சி, ஞானம், அதிர்ஷ்டம். குரு புக்தி — ஆசீர்வாதம் மற்றும் வாய்ப்பு. தசை நல்ல ஆதரவு (72/100)." — reads like a data printout.

**Replace `dasha_support_reason` with:**

```python
def dasha_support_reason(maha_lord: str, antar_lord: str, dasha_score: int) -> BiText:
    maha = _DASHA_CHARACTER.get(maha_lord, _bi(maha_lord, maha_lord))
    antar = _ANTARA_NOTE.get(antar_lord, _bi(antar_lord, antar_lord))

    if dasha_score >= 65:
        return _bi(
            f"நடப்பில் {maha.ta}. இந்த தசை காலத்தில் {maha.ta.split(' — ')[1] if ' — ' in maha.ta else 'நல்ல வளர்ச்சி'} கிடைக்கும். "
            f"உள்ளே {antar.ta}. தசை ஆதரவு வலுவானது ({dasha_score}/100) — திட்டமிட்ட செயல்களுக்கு நல்ல நேரம்.",
            f"Currently in {maha.en}. This dasha period supports {maha.en.split(' — ')[1] if ' — ' in maha.en else 'growth'}. "
            f"Sub-period: {antar.en}. Dasha support is strong ({dasha_score}/100) — a favourable time for planned action.",
        )
    if dasha_score >= 50:
        return _bi(
            f"நடப்பில் {maha.ta}. {antar.ta}. "
            f"தசை ஆதரவு மிதமானது ({dasha_score}/100) — முடிவுகளில் அவசரம் வேண்டாம், பொறுமையுடன் செயல்படுங்கள்.",
            f"Currently in {maha.en}. {antar.en}. "
            f"Dasha support is moderate ({dasha_score}/100) — avoid rushing decisions; steady effort works better.",
        )
    return _bi(
        f"நடப்பில் {maha.ta}. {antar.ta}. "
        f"தசை ஆதரவு குறைவு ({dasha_score}/100) — பெரிய புதிய முயற்சிகளை ஒத்திவைத்து, தற்போதுள்ளதை நிலைநிறுத்துவதில் கவனம் செலுத்துங்கள்.",
        f"Currently in {maha.en}. {antar.en}. "
        f"Dasha support is reduced ({dasha_score}/100) — defer major new ventures and focus on consolidating what you have.",
    )
```

---

## FIX 8 — Marriage, Career, Health, Wealth: Replace 3-Template Main Predictions

**Files:** `app/services/marriage_service.py`, `app/services/career_service.py`, `app/services/health_service.py`, `app/services/wealth_service.py`

**Problem:** Each service has exactly 3 hardcoded main prediction sentences for all users at that score band. They contain no chart-specific reasoning. An experienced astrologer's explanation would name the specific planetary factors driving the result.

**Pattern to implement in all four services:**

After calculating the score and collecting `supports` and `challenges` lists, instead of 3 hardcoded main strings, build `main` dynamically using the top scoring factors:

For **marriage_service.py**, replace the hardcoded `main` block (lines ~254-271) with:

```python
    # Build chart-specific main prediction from top 2 factors
    top_supports = [b.ta for b in supports[:2]] if supports else []
    top_challenges = [b.ta for b in challenges[:2]] if challenges else []

    if score >= 70:
        confidence = "HIGH"
        support_phrase = "குறிப்பாக " + " மற்றும் ".join(top_supports) if top_supports else "பொதுவாக நல்ல அமைப்பு உள்ளது"
        main = (
            f"திருமண விஷயங்களில் ஆதரவான நேரம் தெரிகிறது. {support_phrase}. "
            f"தசை மற்றும் கோசாரம் இணைந்து இந்த சாதகமான கட்டத்தை உருவாக்குகின்றன.",
            f"The current phase appears supportive for marriage matters. {'; '.join([b.en for b in supports[:2]])}. "
            f"Dasha and transit together create this favourable window.",
        )
    elif score >= 50:
        confidence = "MEDIUM"
        challenge_phrase = "ஆனால் " + " மற்றும் ".join(top_challenges) if top_challenges else "சில கவலைகள் உள்ளன"
        main = (
            f"திருமண சிக்னல்கள் கலந்த நிலையில் உள்ளன. {support_phrase if top_supports else ''} {challenge_phrase}. "
            f"திட்டமிட்ட அணுகுமுறை மற்றும் பொறுமை நல்ல பலன் தரும்.",
            f"Marriage indicators are mixed. {'; '.join([b.en for b in supports[:1]])} but {'; '.join([b.en for b in challenges[:1]])}. "
            f"A planned approach with patience will yield better results.",
        )
    else:
        confidence = "LOW"
        challenge_phrase = "முக்கியமாக " + " மற்றும் ".join(top_challenges) if top_challenges else "தற்போதைய நிலை கடினமாக உள்ளது"
        main = (
            f"திருமண முடிவுகளில் அவசரம் தவிர்க்கவும். {challenge_phrase}. "
            f"இந்த கட்டத்தில் நிலைமையை நிலைநிறுத்துவதே சிறந்த பாதை.",
            f"Avoid haste in marriage decisions. {challenge_phrase if top_challenges else 'Conditions need stabilising'}. "
            f"Consolidating your situation is the better path right now.",
        )
```

Apply the **same pattern** to `career_service.py`, `health_service.py`, and `wealth_service.py` — each has an identical 3-template block at the end. The `supports` and `challenges` lists are already populated; just use them to build the main prediction text.

For **career_service.py**, the template should reference 10th house / lagna lord / dasha factors.  
For **health_service.py**, it should reference lagna strength / malefic dasha factors.  
For **wealth_service.py**, it should reference 11th house / dhana yoga / dasha factors.

---

## FIX 9 — Chart Explanation Planet Text: Astrologer Prose

**File:** `app/services/chart_explanation_service.py`  
**Lines:** 142-153 (`_planet_explanation` function)

**Problem:** Output is: `"MARS is in house 7, pointing to relationships, partnership. Debilitated: steady support and structure are needed. Functional role: MARAKA."` — sounds like a database report.

**Replace `_planet_explanation` with:**

```python
def _planet_explanation(planet: PlanetPosition, dignity: str, functional_nature: str) -> ChartExplanationText:
    dignity_text = _dignity_text(dignity)
    theme = _HOUSE_THEMES[planet.house_from_lagna]

    # Build Tamil and English in astrologer voice
    dignity_qualifier_ta = {
        "EXALTED": "உச்சத்தில்",
        "DEBILITATED": "நீசத்தில்",
        "MOOLATRIKONA": "மூலத்திரிகோணத்தில்",
        "OWN_SIGN": "சொந்த ராசியில்",
        "FRIEND_SIGN": "நட்பு ராசியில்",
        "ENEMY_SIGN": "பகை ராசியில்",
        "NEUTRAL_SIGN": "சம ராசியில்",
    }.get(dignity, "")

    fn_context_ta = {
        "YOGAKARAKA": "இது உங்கள் ஜாதகத்தில் யோககாரகன் — மிகவும் சாதகமான கிரகம்",
        "LAGNA_LORD": "இது உங்கள் லக்னாதிபதி — வாழ்க்கையின் திசையை நிர்ணயிக்கும் கிரகம்",
        "TRIKONA": "இது திரிகோண ஆதிபதி — அதிர்ஷ்டம் மற்றும் தர்மத்தை குறிக்கிறது",
        "KENDRA": "இது கேந்திர ஆதிபதி — செயல்திறன் மற்றும் வெளிப்படை நிகழ்வுகளை நிர்வகிக்கிறது",
        "DUSTHANA": "இது துஷ்டான ஆதிபதி — இந்த வீட்டு விஷயங்களில் கவனம் தேவை",
        "MARAKA": "இது மாரக ஆதிபதி — கட்டுப்பாட்டுடன் அணுக வேண்டும்",
        "NEUTRAL": "இது நடுநிலை கிரகம் — தசை மற்றும் கோசாரம் பலனை தீர்மானிக்கும்",
    }.get(functional_nature, "")

    fn_context_en = {
        "YOGAKARAKA": "a Yogakaraka for your chart — a highly favourable planet",
        "LAGNA_LORD": "your Lagna lord — the planet that shapes your life direction",
        "TRIKONA": "a Trikona lord — connected to fortune and dharma",
        "KENDRA": "a Kendra lord — governing visible life areas and action",
        "DUSTHANA": "a Dusthana lord — requiring care in matters of that house",
        "MARAKA": "a Maraka lord — to be approached with discipline",
        "NEUTRAL": "a neutral planet whose results depend on dasha and transit",
    }.get(functional_nature, functional_nature)

    ta = (
        f"{planet.graha} உங்கள் ஜாதகத்தில் {planet.house_from_lagna}ஆம் வீட்டில் "
        f"({theme.ta} துறை) {dignity_qualifier_ta} நிற்கிறது. "
        f"{dignity_text.ta} {fn_context_ta}."
    )
    en = (
        f"{planet.graha} sits in house {planet.house_from_lagna} ({theme.en}) "
        f"in {dignity_qualifier_ta.replace('ல்', '').strip() or dignity.lower().replace('_', ' ')} dignity. "
        f"{dignity_text.en} It is {fn_context_en}."
    )
    return _bi(ta, en)
```

---

## FIX 10 — Add Kalathra Dosham Detection

**File:** `app/calculations/yogas.py`

**Problem:** Kalathra Dosham (7th lord in 6th, 8th, or 12th house) is a standard Tamil Thirukanitham indicator for marriage challenges. It is not currently detected as a named dosham.

**Add this new function** after `detect_rahu_ketu_dosham`:

```python
def detect_kalathra_dosham(
    planets: Mapping[str, PlanetInput],
    lagna_rasi: int,
    *,
    active_lords: Iterable[str] | None = None,
    d9_rasi_map: Mapping[str, int] | None = None,
) -> DoshamResult:
    """
    Kalathra Dosham: 7th lord placed in 6th, 8th, or 12th house (Dusthana) from Lagna.
    Classical Tamil Thirukanitham indicator for marriage friction / delay.
    """
    active = set(active_lords or ())
    seventh_house_rasi = ((lagna_rasi + 7 - 2) % 12) + 1
    seventh_lord = SIGN_LORD[seventh_house_rasi]

    if seventh_lord not in planets:
        return DoshamResult(
            name="KALATHRA_DOSHAM",
            is_present=False,
            is_cancelled=False,
            strength="WEAK",
            label="INCOMPLETE_DATA",
            category="MARRIAGE",
            conditions_met=[],
            cancellation_factors=[],
            missing_data=[seventh_lord],
            dasha_activated=False,
            description_ta="கல்யாண தோஷம் கணிக்க 7ம் அதிபதி நிலை தேவை.",
            description_en="Kalathra dosham analysis requires 7th lord placement.",
            explanation_what_ta="கல்யாண தோஷம் (காளத்ர தோஷம்) என்பது 7ம் அதிபதி துஷ்டான வீட்டில் (6, 8, 12) இருக்கும்போது ஏற்படும் திருமண கவலை குறிப்பான்.",
            explanation_what_en="Kalathra dosham is a marriage sensitivity indicator that arises when the 7th lord is placed in a dusthana house (6, 8, or 12).",
            explanation_why_ta="தேவையான ஜாதக தரவு கிடைக்கவில்லை.",
            explanation_why_en="Required chart data is unavailable.",
            explanation_how_ta="முழு ஜாதக தரவுடன் மீண்டும் பரிசீலிக்கவும்.",
            explanation_how_en="Review again with complete chart data.",
        )

    seventh_lord_rasi = _planet_rasi(planets, seventh_lord)
    seventh_lord_house = house_from_reference(lagna_rasi, seventh_lord_rasi)

    is_in_dusthana = seventh_lord_house in {6, 8, 12}
    conditions_met: list[str] = []
    cancellation_factors: list[str] = []

    if is_in_dusthana:
        conditions_met.append(f"seventh_lord_in_house_{seventh_lord_house}")

    # Cancellation: 7th lord exalted or in own sign despite dusthana
    if seventh_lord_rasi in OWN_SIGN_RASI.get(seventh_lord, set()):
        cancellation_factors.append("seventh_lord_own_sign")
    if seventh_lord_rasi == EXALTATION_RASI.get(seventh_lord):
        cancellation_factors.append("seventh_lord_exalted")

    # Cancellation: Jupiter aspects the 7th lord
    if "JUPITER" in planets:
        jup_rasi = _planet_rasi(planets, "JUPITER")
        if house_from_reference(jup_rasi, seventh_lord_rasi) in {5, 7, 9}:
            cancellation_factors.append("jupiter_aspects_seventh_lord")

    # D9 cancellation: 7th lord strong in Navamsa
    if d9_rasi_map and seventh_lord in d9_rasi_map:
        d9_rasi = d9_rasi_map[seventh_lord]
        if d9_rasi in OWN_SIGN_RASI.get(seventh_lord, set()) or d9_rasi == EXALTATION_RASI.get(seventh_lord):
            cancellation_factors.append("seventh_lord_strong_d9")

    is_cancelled = len(cancellation_factors) >= 2 or (
        len(cancellation_factors) == 1 and cancellation_factors[0] in {"seventh_lord_exalted", "jupiter_aspects_seventh_lord"}
    )
    is_present = is_in_dusthana

    if not is_present:
        label = "NO_KALATHRA_DOSHAM"
        strength = "WEAK"
    elif is_cancelled:
        label = "KALATHRA_DOSHAM_CANCELLED"
        strength = "WEAK"
    elif seventh_lord_house == 8:
        label = "STRONG_KALATHRA_DOSHAM"
        strength = "STRONG"
    else:
        label = "KALATHRA_DOSHAM"
        strength = "MODERATE"

    house_name_ta = {6: "6ம் வீட்டில் (ரிபு ஸ்தானம்)", 8: "8ம் வீட்டில் (ஆயுள் ஸ்தானம்)", 12: "12ம் வீட்டில் (விரய ஸ்தானம்)"}.get(seventh_lord_house, f"{seventh_lord_house}ம் வீட்டில்")
    house_name_en = {6: "house 6 (Ripu sthana)", 8: "house 8 (Ayush sthana)", 12: "house 12 (Viraya sthana)"}.get(seventh_lord_house, f"house {seventh_lord_house}")

    description_ta = (
        f"கல்யாண தோஷம்: 7ம் அதிபதி ({seventh_lord}) {house_name_ta} உள்ளது — திருமண விஷயங்களில் கவனம் தேவை."
        if is_present
        else f"7ம் அதிபதி ({seventh_lord}) {seventh_lord_house}ம் வீட்டில் உள்ளது — கல்யாண தோஷம் இல்லை."
    )
    description_en = (
        f"Kalathra dosham: 7th lord ({seventh_lord}) is in {house_name_en} — marriage matters need attention."
        if is_present
        else f"7th lord ({seventh_lord}) is in house {seventh_lord_house} — no Kalathra dosham."
    )

    return DoshamResult(
        name="KALATHRA_DOSHAM",
        is_present=is_present,
        is_cancelled=is_cancelled,
        strength=strength,
        label=label,
        category="MARRIAGE",
        conditions_met=conditions_met,
        cancellation_factors=cancellation_factors,
        missing_data=[],
        dasha_activated=_is_active(active, seventh_lord, "VENUS"),
        description_ta=description_ta,
        description_en=description_en,
        explanation_what_ta="கல்யாண தோஷம் என்பது 7ம் அதிபதி துஷ்டான வீட்டில் (6, 8, 12) இருக்கும்போது ஏற்படும் திருமண தாமதம் அல்லது சிரமம் குறிக்கும் பாரம்பரிய தோஷ குறிப்பான்.",
        explanation_what_en="Kalathra dosham is a traditional indicator of marriage delay or friction, arising when the 7th lord is placed in a dusthana house (6, 8, or 12).",
        explanation_why_ta=f"7ம் அதிபதி {seventh_lord} {house_name_ta} நிலைத்திருப்பதால் இந்த தோஷம் குறிக்கப்படுகிறது." + (f" நிவர்த்தி காரணங்கள்: {'; '.join(cancellation_factors)}." if cancellation_factors else ""),
        explanation_why_en=f"7th lord {seventh_lord} placed in {house_name_en} triggers this indicator." + (f" Cancellation factors: {'; '.join(cancellation_factors)}." if cancellation_factors else ""),
        explanation_how_ta="இதை ஒரு கவனிக்க வேண்டிய சமிக்ஞையாக மட்டும் பாருங்கள். முழு ஜாதகத்தையும் குரு பார்வை, நிவர்த்தி காரணங்கள் உட்பட ஆராயவும். திருமண விஷயங்களில் பொறுமை மற்றும் ஆலோசனை உதவும்.",
        explanation_how_en="Treat this as a signal to pay attention, not a fixed outcome. Review the full chart including Jupiter aspects and cancellation factors. Patience and consultation help in marriage matters.",
    )
```

**Wire this up** wherever `detect_sevvai_dosham` and `detect_rahu_ketu_dosham` are called (typically in `chart_service.py` or a similar service that assembles doshams). Add `detect_kalathra_dosham(planets, lagna_rasi, active_lords=active_lords, d9_rasi_map=d9_rasi_map)` to that list.

---

## FIX 11 — Sevvai Dosham: Add Personal Category Flag

**File:** `app/calculations/yogas.py`  
**Lines:** ~59, ~64 (inside `DoshamResult` dataclass and detection function)

**Problem:** `category="MARRIAGE"` — Tamil tradition also treats Sevvai's placement as relevant to personal health, courage, and lifespan (via 8th house placement).

**Find the `DoshamResult` return in `detect_sevvai_dosham`** and change `category` to reflect both contexts:

```python
        category="MARRIAGE" if lagna_house not in {1, 8} else "MARRIAGE_PERSONAL",
```

This means:
- Sevvai in 1st or 8th house from Lagna → flag as `MARRIAGE_PERSONAL` (both marriage and personal health)
- All other positions → keep as `MARRIAGE`

---

## FIX 12 — Nakshatra Compatible Groups: Add Explanation

**File:** `app/services/nakshatra_content_static.py`

**Problem:** `compatibleGroups=["SATHAYAM", "HASTHA", "ROHINI"]` — displayed as raw codes on UI. Users don't know which Porutham aspect makes these nakshatras compatible.

**Change the `NakshatraCard` model** to support richer compatible groups data. Add a new optional field:

```python
class NakshatraCompatGroup(BaseModel):
    nakshatra_code: str
    nakshatra_name_ta: str
    nakshatra_name_en: str
    porutham_basis: str  # e.g., "யோனி, தினம்" in Tamil

class NakshatraCard(BaseModel):
    ...existing fields...
    compatible_groups: list[str] = Field(alias="compatibleGroups")  # keep for backward compat
    compatible_groups_rich: list[NakshatraCompatGroup] = Field(alias="compatibleGroupsRich", default_factory=list)
```

Then for each of the 27 nakshatra cards, add `compatibleGroupsRich` entries. Example for Aswini (nakshatra 1):

```python
compatibleGroupsRich=[
    NakshatraCompatGroup(nakshatra_code="SATHAYAM", nakshatra_name_ta="சதயம்", nakshatra_name_en="Sadayam", porutham_basis="யோனி, கண ஒற்றுமை"),
    NakshatraCompatGroup(nakshatra_code="HASTHA", nakshatra_name_ta="ஹஸ்தம்", nakshatra_name_en="Hastham", porutham_basis="தின, மகேந்திர ஒற்றுமை"),
    NakshatraCompatGroup(nakshatra_code="ROHINI", nakshatra_name_ta="ரோகிணி", nakshatra_name_en="Rohini", porutham_basis="யோனி, ராசி ஒற்றுமை"),
],
```

The `porutham_basis` should name the actual kutas that make the pair compatible — Yoni, Dina, Gana, Mahendra, Rasi etc. — based on standard Thirukanitham Porutham tables.

The frontend should use `compatibleGroupsRich` when available, falling back to `compatibleGroups` string codes.

---

## FIX 13 — Health Service: Fix English in Tamil Fields

**File:** `app/services/health_service.py`

Find and replace all occurrences where the `ta` field of `BiText` contains English text (same pattern as career_service fixes above):

```python
BiText("For children, health guidance should prioritize...", ...)
```
→
```python
BiText("குழந்தைகளுக்கு, தூக்கம், உணவு, சுகாதாரம், தடுப்பூசி அட்டவணை, மருத்துவ பரிசோதனை ஆகியவை முக்கியம்.", "For children, health guidance should prioritize sleep, feeding, hygiene, vaccination schedule, and regular pediatric review.")
```

```python
BiText("If symptoms appear, seek pediatric care early.", "If symptoms appear, seek pediatric care early.")
```
→
```python
BiText("அறிகுறிகள் தெரிந்தால், குழந்தை மருத்துவரை விரைவில் சந்திக்கவும்.", "If symptoms appear, seek pediatric care early.")
```

```python
BiText("Steady routine and caregiver support are the strongest protections now.", "Steady routine and caregiver support are the strongest protections now.")
```
→
```python
BiText("நிலையான வழக்கமும் பராமரிப்பாளர் ஆதரவும் இப்போது மிக வலுவான பாதுகாப்பாகும்.", "Steady routine and caregiver support are the strongest protections now.")
```

---

## VERIFICATION CHECKLIST FOR CODING AGENT

After implementing all fixes, verify:

- [ ] `_marker_explain_ta()` added to `yogas.py` and used in `why_ta` section
- [ ] All `BiText` Tamil fields across marriage/career/health/wealth services contain actual Unicode Tamil (not Latin/romanized)
- [ ] Ask Vinaadi `_SYSTEM_PROMPT` replaced with the new ~50-line version
- [ ] `max_tokens` changed from 800 to 1400 in `ask_vinaadi_service.py`
- [ ] `daily_summary` accepts `jupiter_house`, `saturn_house`, `current_nakshatra` parameters
- [ ] `build_score_reasons` passes those new parameters to `daily_summary`
- [ ] `_NAK_QUALITY` dict (27 entries) is at module level in `narrative_engine.py`
- [ ] `moon_transit_reason` uses nakshatra-specific text from `_NAK_QUALITY`
- [ ] `dasha_support_reason` returns flowing prose in 3 bands, not one-line label concatenation
- [ ] Marriage/career/health/wealth main prediction text uses top factors from `supports`/`challenges` lists
- [ ] `_planet_explanation` in `chart_explanation_service.py` returns astrologer-voice prose
- [ ] `detect_kalathra_dosham()` added and wired into the dosham detection call-site
- [ ] `detect_sevvai_dosham()` returns `category="MARRIAGE_PERSONAL"` when Sevvai is in house 1 or 8
- [ ] `NakshatraCard` has `compatible_groups_rich` field with Porutham basis text
- [ ] All 27 nakshatra cards have `compatibleGroupsRich` populated

---

## ENCODING AND SAFETY REMINDERS

- All edits to `.py` files must use UTF-8 encoding without BOM
- Tamil Unicode strings: verify with `len(tamil_str) > 0` sanity check after editing
- Do NOT run `alembic upgrade head` against `vinaadi_dev` — no DB migrations needed for any of these fixes
- Run tests with SQLite: `$env:JOTHIDAM_DATABASE_URL = "sqlite:///./pytest_local_test.db"`
- Set `$env:PYTHONIOENCODING = "utf-8"` and `$env:PYTHONUTF8 = "1"` before any Python command

---

*Generated: 2026-06-11 | Scope: humanization, bug fixes, tradition alignment, missing features*

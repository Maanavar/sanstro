# Tamil review — daily briefing connective glue (Track B)

These are the **new** bilingual strings the briefing synthesizer adds
(`app/services/daily_briefing_synth.py`). The English is production-intent; the
Tamil is my first draft and needs your native eye.

**How to use:** edit the `TA (suggested)` line under any entry you want to change.
Leave it blank to keep the current Tamil as-is. Hand the file back and I'll apply
every change to the exact constant (the IDs map 1:1 to the code).

> Note: `W1` (window lead) may be **removed** entirely — the action line already
> states the best window, so it currently prints twice. Review it only if you
> think the briefing should still carry its own window line.

---

## Verdict openers — `_OPENERS[<band>][<i>]`

The first sentence of every briefing. Two variants per band (alternate by day).

### O1 — STRONG_SUPPORT · variant 1
- EN: Today reads strongly in your favour — a genuinely good day to move on what matters.
- TA (current): இன்று உங்களுக்கு மிகவும் சாதகமான நாள் — முக்கியமானதை முன்னெடுக்க ஏற்ற தருணம்.
- TA (suggested):

### O2 — STRONG_SUPPORT · variant 2
- EN: The day is strongly with you — the right window to act on what you've planned.
- TA (current): இன்று வலுவான ஆதரவு உள்ளது — திட்டமிட்டதைச் செயல்படுத்த இதுவே சரியான நேரம்.
- TA (suggested):

### O3 — GOOD · variant 1
- EN: A good day — steady momentum is on your side.
- TA (current): இன்று நல்ல நாள் — நிலையான வேகம் உங்கள் பக்கம் உள்ளது.
- TA (suggested):

### O4 — GOOD · variant 2
- EN: Today shapes up well — you can carry your important tasks forward with confidence.
- TA (current): இன்று சாதகமாக அமைகிறது — முக்கிய பணிகளை நம்பிக்கையுடன் தொடரலாம்.
- TA (suggested):

### O5 — BALANCED · variant 1
- EN: Today reads steady — not one to force big moves, but a good one to keep things simple and finish what's already on your plate.
- TA (current): இன்று சமநிலையான நாள் — பெரிதாக வற்புறுத்தாமல், எளிமையாக வைத்து தொடங்கியதை முடிப்பது நல்லது.
- TA (suggested):

### O6 — BALANCED · variant 2
- EN: An even-keeled day — small, sure steps work better than sweeping ones right now.
- TA (current): இன்று நடுநிலையான ஓட்டம் — சிறிய, உறுதியான அடிகள் இன்று சிறப்பாக வேலை செய்யும்.
- TA (suggested):

### O7 — CAUTION · variant 1
- EN: Today asks for a lighter touch — favour routine over big new decisions.
- TA (current): இன்று சற்று கவனத்துடன் அணுகுங்கள் — புதிய பெரிய முடிவுகளை விட வழக்கமான பணிகளுக்கு முன்னுரிமை.
- TA (suggested):

### O8 — CAUTION · variant 2
- EN: Patience serves you today — avoid rushed calls and steady what's already moving.
- TA (current): இன்று பொறுமை உதவும் — அவசர முடிவுகளைத் தவிர்த்து, நடப்பதை நிலைப்படுத்துங்கள்.
- TA (suggested):

### O9 — RESTORATIVE · variant 1
- EN: A day to slow down and restore — keep commitments small.
- TA (current): இன்று மெதுவாக, ஓய்வுக்கு முன்னுரிமை தரும் நாள் — பொறுப்புகளைச் சிறியதாக வையுங்கள்.
- TA (suggested):

### O10 — RESTORATIVE · variant 2
- EN: A recharging day — don't take on anything new; let yourself rest.
- TA (current): இன்று உங்களை மீட்டெடுக்கும் நாள் — புதிதாக எதையும் சுமக்காமல் ஓய்வெடுங்கள்.
- TA (suggested):

---

## Connectors that introduce the 2nd (supporting) signal — `_CONNECTORS_SUPPORT[<i>]`

Used when the second signal is *positive*. Reads as additive.

### CS1
- EN: At the same time,
- TA (current): அதே நேரத்தில்,
- TA (suggested):

### CS2
- EN: Alongside that,
- TA (current): அதனுடன்,
- TA (suggested):

---

## Connectors that introduce the 2nd (cautionary) signal — `_CONNECTORS_CAUTION[<i>]`

Used when the second signal is a *warning*. Reads as a pivot.

### CC1
- EN: One thing worth noting —
- TA (current): கவனிக்க வேண்டிய ஒன்று —
- TA (suggested):

### CC2
- EN: That said, tread carefully —
- TA (current): அதே வேளையில், கவனமாக —
- TA (suggested):

---

## Action lead-in — `_ACTION_LEAD`

Introduces the single concrete action.

### A1
- EN: What to do with it:
- TA (current): இன்று செய்யலாம்:
- TA (suggested):

---

## ~~Window lead-in — `_WINDOW_LEAD`~~  *(REMOVED 2026-07-09)*

`W1` no longer exists. The briefing used to append its own "Best window: …" line,
which duplicated the window already present in the action text (and shown as a
dashboard metric). `_WINDOW_LEAD` has been deleted — nothing to review here.

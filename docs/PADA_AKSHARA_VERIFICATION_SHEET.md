# Pada-Akshara Verification Sheet (NU-8a)

> **Generated file — do not hand-edit.**
> Regenerate with `python scripts/generate_pada_verification_sheet.py`
> after flipping rows in `app/data/nakshatra_pada_akshara.py`.

- **Canon version:** `0.1.0-draft`
- **Verified:** 0 / 108 rows

Nothing is verified yet, so nothing renders: `numerology_naming.assert_canon_usable()` raises `UnverifiedCanonError` outside development, and `NamingResult.usable` is `False` while any row in a result is draft. **Baby-name suggestion is blocked on this sheet and on nothing else.**

## How to fill this in

For each row, one question: **for this nakshatra and this pada, is this the
akshara a name should begin with?**

1. Check against **one named printed source**. Prefer a Tamil
   panchangam or jataka text in current use over any online table.
2. Where the source disagrees with the draft, **the source wins** — write
   the source's akshara in the `Correct?` column.
3. Record the source in `app/data/nakshatra_pada_akshara.py` on that row:
   `source_ref`, `verified_by`, `verified_on`, then `verified=True`.
4. Re-run the generator so this sheet's counts follow.

Leave a row alone rather than guessing it. A row marked verified on a
recollection is worse than a row still marked draft, because the guard
stops protecting it.

## Before you start: rows that look like duplicates and are not

14 bare-Latin strings are each carried by more than one pada. These are genuine distinctions the Latin spelling cannot show — mostly retroflex-vs-dental pairs (`ṭa`/`ta`, `ḍa`/`da`, `ṇa`/`na`). **Do not reconcile them into one another.** Read the Devanagari column, which is the identity key; the Latin column is display only.

| Latin | Padas sharing it |
| --- | --- |
| Da | 8-P4, 25-P3 |
| De | 9-P3, 27-P1 |
| Dha | 20-P2, 20-P4 |
| Di | 9-P1, 25-P4 |
| Do | 9-P4, 27-P2 |
| Du | 9-P2, 26-P1 |
| Gha | 6-P2, 22-P4 |
| Na | 13-P3, 17-P1 |
| Ta | 11-P2, 15-P4 |
| Te | 12-P1, 16-P3 |
| Tha | 13-P4, 26-P2 |
| Ti | 11-P3, 16-P1 |
| To | 12-P2, 16-P4 |
| Tu | 11-P4, 16-P2 |

## Before you start: where Tamil script cannot settle the question

**59 of 108 rows** (55%) are marked `TA?` below. On those the Tamil letter is shared by several Sanskrit consonants — க covers *ka / kha / ga / gha*, ட covers *ṭa / ṭha / ḍa / ḍha*, and so on — so a Tamil-script source can rule the row out but cannot confirm it. Those rows need a source that carries Devanagari or a diacritic-bearing transliteration.

This is the open practitioner question the draft left, and it is why it is a blocker rather than an edge case: it governs the majority of the table, spanning 21 of the 27 nakshatras.

## The 108 rows

Legend — `TA?` the Tamil letter alone cannot confirm this row · 
`DUP` the Latin string is shared with another pada (see above) · 
`OK` verified · `—` still draft.


### 1. Ashwini · அசுவினி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | चु | cu | Chu | சு | `TA?` | — |  |  |
| P2 | चे | ce | Che | சே | `TA?` | — |  |  |
| P3 | चो | co | Cho | சோ | `TA?` | — |  |  |
| P4 | ला | lā | La | லா |  | — |  |  |

### 2. Bharani · பரணி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | ली | lī | Li | லீ |  | — |  |  |
| P2 | लू | lū | Lu | லூ |  | — |  |  |
| P3 | ले | le | Le | லே |  | — |  |  |
| P4 | लो | lo | Lo | லோ |  | — |  |  |

### 3. Krittika · கார்த்திகை

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | अ | a | A | அ |  | — |  |  |
| P2 | ई | ī | I | ஈ |  | — |  |  |
| P3 | उ | u | U | உ |  | — |  |  |
| P4 | ए | e | E | ஏ |  | — |  |  |

### 4. Rohini · ரோகிணி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | ओ | o | O | ஓ |  | — |  |  |
| P2 | वा | vā | Va | வா |  | — |  |  |
| P3 | वी | vī | Vi | வீ |  | — |  |  |
| P4 | वू | vū | Vu | வூ |  | — |  |  |

### 5. Mrigashira · மிருகசீரிடம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | वे | ve | Ve | வே |  | — |  |  |
| P2 | वो | vo | Vo | வோ |  | — |  |  |
| P3 | का | kā | Ka | கா | `TA?` | — |  |  |
| P4 | की | kī | Ki | கீ | `TA?` | — |  |  |

### 6. Ardra · திருவாதிரை

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | कु | ku | Ku | கு | `TA?` | — |  |  |
| P2 | घा | ghā | Gha | கா | `TA?` `DUP` | — |  |  |
| P3 | ङ | ṅa | Ing | ங |  | — |  |  |
| P4 | छा | chā | Chha | சா | `TA?` | — |  |  |

### 7. Punarvasu · புனர்பூசம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | के | ke | Ke | கே | `TA?` | — |  |  |
| P2 | को | ko | Ko | கோ | `TA?` | — |  |  |
| P3 | हा | hā | Ha | ஹா |  | — |  |  |
| P4 | ही | hī | Hi | ஹீ |  | — |  |  |

### 8. Pushya · பூசம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | हु | hu | Hu | ஹு |  | — |  |  |
| P2 | हे | he | He | ஹே |  | — |  |  |
| P3 | हो | ho | Ho | ஹோ |  | — |  |  |
| P4 | डा | ḍā | Da | டா | `TA?` `DUP` | — |  |  |

### 9. Ashlesha · ஆயில்யம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | डी | ḍī | Di | டீ | `TA?` `DUP` | — |  |  |
| P2 | डू | ḍū | Du | டூ | `TA?` `DUP` | — |  |  |
| P3 | डे | ḍe | De | டே | `TA?` `DUP` | — |  |  |
| P4 | डो | ḍo | Do | டோ | `TA?` `DUP` | — |  |  |

### 10. Magha · மகம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | मा | mā | Ma | மா |  | — |  |  |
| P2 | मी | mī | Mi | மீ |  | — |  |  |
| P3 | मू | mū | Mu | மூ |  | — |  |  |
| P4 | मे | me | Me | மே |  | — |  |  |

### 11. Purva Phalguni · பூரம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | मो | mo | Mo | மோ |  | — |  |  |
| P2 | टा | ṭā | Ta | டா | `TA?` `DUP` | — |  |  |
| P3 | टी | ṭī | Ti | டீ | `TA?` `DUP` | — |  |  |
| P4 | टू | ṭū | Tu | டூ | `TA?` `DUP` | — |  |  |

### 12. Uttara Phalguni · உத்திரம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | टे | ṭe | Te | டே | `TA?` `DUP` | — |  |  |
| P2 | टो | ṭo | To | டோ | `TA?` `DUP` | — |  |  |
| P3 | पा | pā | Pa | பா | `TA?` | — |  |  |
| P4 | पी | pī | Pi | பீ | `TA?` | — |  |  |

### 13. Hasta · அஸ்தம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | पू | pū | Pu | பூ | `TA?` | — |  |  |
| P2 | षा | ṣā | Sha | ஷா |  | — |  |  |
| P3 | णा | ṇā | Na | ணா | `DUP` | — |  |  |
| P4 | ठा | ṭhā | Tha | டா | `TA?` `DUP` | — |  |  |

### 14. Chitra · சித்திரை

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | पे | pe | Pe | பே | `TA?` | — |  |  |
| P2 | पो | po | Po | போ | `TA?` | — |  |  |
| P3 | रा | rā | Ra | ரா |  | — |  |  |
| P4 | री | rī | Ri | ரீ |  | — |  |  |

### 15. Swati · சுவாதி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | रू | rū | Ru | ரூ |  | — |  |  |
| P2 | रे | re | Re | ரே |  | — |  |  |
| P3 | रो | ro | Ro | ரோ |  | — |  |  |
| P4 | ता | tā | Ta | தா | `TA?` `DUP` | — |  |  |

### 16. Vishakha · விசாகம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | ती | tī | Ti | தீ | `TA?` `DUP` | — |  |  |
| P2 | तू | tū | Tu | தூ | `TA?` `DUP` | — |  |  |
| P3 | ते | te | Te | தே | `TA?` `DUP` | — |  |  |
| P4 | तो | to | To | தோ | `TA?` `DUP` | — |  |  |

### 17. Anuradha · அனுஷம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | ना | nā | Na | நா | `DUP` | — |  |  |
| P2 | नी | nī | Ni | நீ |  | — |  |  |
| P3 | नू | nū | Nu | நூ |  | — |  |  |
| P4 | ने | ne | Ne | நே |  | — |  |  |

### 18. Jyeshtha · கேட்டை

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | नो | no | No | நோ |  | — |  |  |
| P2 | या | yā | Ya | யா |  | — |  |  |
| P3 | यी | yī | Yi | யீ |  | — |  |  |
| P4 | यू | yū | Yu | யூ |  | — |  |  |

### 19. Mula · மூலம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | ये | ye | Ye | யே |  | — |  |  |
| P2 | यो | yo | Yo | யோ |  | — |  |  |
| P3 | भा | bhā | Bha | பா | `TA?` | — |  |  |
| P4 | भी | bhī | Bhi | பீ | `TA?` | — |  |  |

### 20. Purva Ashadha · பூராடம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | भू | bhū | Bhu | பூ | `TA?` | — |  |  |
| P2 | धा | dhā | Dha | தா | `TA?` `DUP` | — |  |  |
| P3 | फा | phā | Pha | பா | `TA?` | — |  |  |
| P4 | ढा | ḍhā | Dha | டா | `TA?` `DUP` | — |  |  |

### 21. Uttara Ashadha · உத்திராடம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | भे | bhe | Bhe | பே | `TA?` | — |  |  |
| P2 | भो | bho | Bho | போ | `TA?` | — |  |  |
| P3 | जा | jā | Ja | ஜா | `TA?` | — |  |  |
| P4 | जी | jī | Ji | ஜீ | `TA?` | — |  |  |

### 22. Shravana · திருவோணம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | जु | ju | Ju | ஜு | `TA?` | — |  |  |
| P2 | जे | je | Je | ஜே | `TA?` | — |  |  |
| P3 | जो | jo | Jo | ஜோ | `TA?` | — |  |  |
| P4 | घा | ghā | Gha | கா | `TA?` `DUP` | — |  |  |

### 23. Dhanishta · அவிட்டம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | गा | gā | Ga | கா | `TA?` | — |  |  |
| P2 | गी | gī | Gi | கீ | `TA?` | — |  |  |
| P3 | गू | gū | Gu | கூ | `TA?` | — |  |  |
| P4 | गे | ge | Ge | கே | `TA?` | — |  |  |

### 24. Shatabhisha · சதயம்

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | गो | go | Go | கோ | `TA?` | — |  |  |
| P2 | सा | sā | Sa | ஸா |  | — |  |  |
| P3 | सी | sī | Si | ஸீ |  | — |  |  |
| P4 | सू | sū | Su | ஸூ |  | — |  |  |

### 25. Purva Bhadrapada · பூரட்டாதி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | से | se | Se | ஸே |  | — |  |  |
| P2 | सो | so | So | ஸோ |  | — |  |  |
| P3 | दा | dā | Da | தா | `TA?` `DUP` | — |  |  |
| P4 | दी | dī | Di | தீ | `TA?` `DUP` | — |  |  |

### 26. Uttara Bhadrapada · உத்திரட்டாதி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | दू | dū | Du | தூ | `TA?` `DUP` | — |  |  |
| P2 | था | thā | Tha | தா | `TA?` `DUP` | — |  |  |
| P3 | झा | jhā | Jha | ஜா | `TA?` | — |  |  |
| P4 | ञ | ña | Gya | ஞா |  | — |  |  |

### 27. Revati · ரேவதி

| Pada | Devanagari | ISO | Latin | Tamil | Flags | Status | Correct? | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | दे | de | De | தே | `TA?` `DUP` | — |  |  |
| P2 | दो | do | Do | தோ | `TA?` `DUP` | — |  |  |
| P3 | चा | cā | Cha | சா | `TA?` | — |  |  |
| P4 | ची | cī | Chi | சீ | `TA?` | — |  |  |

---

Related: `docs/NUMEROLOGY_IMPLEMENTATION_PLAN_2026-07-25.md` (NU-8a), `app/calculations/numerology_naming.py` (the guard this sheet releases), `tests/test_numerology_naming.py` (the collision counts asserted as tests).

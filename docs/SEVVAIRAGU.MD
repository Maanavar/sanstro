# Tamil Astrology Dosha Validation Specification  
## Sevvai Dosham + Rahu/Ketu Dosham — Thirukanitham-Based Rule Engine Guide

**Purpose:**  
This document is meant to be supplied to a coding agent or engineering team to validate whether a Tamil astrology application correctly identifies, classifies, explains, and presents:

1. **Sevvai Dosham / Chevvai Dosham / Kuja Dosha**
2. **Sevvai Dosham Illai**
3. **Sevvai Dosham Nivarthi / Cancellation / Reduction**
4. **Rahu–Ketu Dosham**
5. **Rahu–Ketu Dosham Illai**
6. **Rahu–Ketu Dosham Nivarthi / Cancellation / Reduction**
7. **Male/Female severity weighting**
8. **Scenario-specific interpretation**

This is a **traditional Tamil astrology rule specification**, not a scientific or medical/legal standard. Different astrologers and paramparai may vary. The application should therefore support rule flags, confidence, and explanation transparency rather than making blind yes/no claims.

---

# 1. Core Principle: Thirukanitham First, Dosha Rules Second

## 1.1 Calculation Layer

Before applying dosha rules, the system must calculate the chart using a proper **Thirukanitham / Drik-style astronomical calculation**.

Required inputs:

```yaml
birth_date: YYYY-MM-DD
birth_time: HH:mm:ss
timezone: e.g. Asia/Kolkata / +05:30
birth_place:
  latitude: decimal
  longitude: decimal
ayanamsa: Lahiri or configured ayanamsa
gender: male | female | unknown
```

Required derived chart data:

```yaml
lagna:
  rasi: Mesham/Rishabam/etc.
  degree: decimal

planets:
  sun:
    rasi:
    house_from_lagna:
    degree:
  moon:
    rasi:
    nakshatra:
    pada:
    house_from_lagna:
    degree:
  mars:
    rasi:
    house_from_lagna:
    degree:
  mercury:
    rasi:
    house_from_lagna:
    degree:
  jupiter:
    rasi:
    house_from_lagna:
    degree:
  venus:
    rasi:
    house_from_lagna:
    degree:
  saturn:
    rasi:
    house_from_lagna:
    degree:
  rahu:
    rasi:
    house_from_lagna:
    degree:
  ketu:
    rasi:
    house_from_lagna:
    degree:

navamsa:
  lagna:
  planets:
```

## 1.2 Important Separation

Thirukanitham determines:

```text
Exact Lagna
Planetary rasi
Planetary degrees
House positions
Nakshatra and pada
Navamsa placements
```

Dosha judgement is then applied as a **traditional interpretive layer**.

---

# 2. Shared Utility Functions

## 2.1 Rasi Order

Use this fixed order:

```python
RASI_ORDER = [
  "Mesham",     # Aries
  "Rishabam",  # Taurus
  "Mithunam",  # Gemini
  "Kadagam",   # Cancer
  "Simmam",    # Leo
  "Kanni",     # Virgo
  "Thulam",    # Libra
  "Viruchigam",# Scorpio
  "Dhanusu",   # Sagittarius
  "Magaram",   # Capricorn
  "Kumbam",    # Aquarius
  "Meenam"     # Pisces
]
```

## 2.2 House Counting Function

House counting is inclusive.

Example:

```text
Reference: Mesham
Mesham = 1
Rishabam = 2
Mithunam = 3
Kadagam = 4
...
```

Pseudocode:

```python
def house_from(reference_rasi, target_rasi):
    ref_index = RASI_ORDER.index(reference_rasi)
    target_index = RASI_ORDER.index(target_rasi)
    return ((target_index - ref_index) % 12) + 1
```

Example:

```python
house_from("Magaram", "Viruchigam") == 11
house_from("Mesham", "Viruchigam") == 8
```

---

# 3. Output Labels

Use explicit labels instead of vague wording.

```python
DOSHA_LABELS = [
  "NO_DOSHAM",
  "DOSHAM_CANDIDATE",
  "DOSHAM_WITH_NIVARTHI",
  "ACTIVE_DOSHAM",
  "STRONG_ACTIVE_DOSHAM",
  "INCOMPLETE_DATA"
]
```

For Sevvai:

```python
SEVVAI_LABELS = [
  "NO_SEVVAI_DOSHAM",
  "SEVVAI_DOSHAM_CANDIDATE",
  "SEVVAI_DOSHAM_WITH_NIVARTHI",
  "ACTIVE_SEVVAI_DOSHAM",
  "STRONG_ACTIVE_SEVVAI_DOSHAM",
  "INCOMPLETE_DATA"
]
```

For Rahu/Ketu:

```python
RAHU_KETU_LABELS = [
  "NO_RAHU_KETU_DOSHAM",
  "RAHU_KETU_DOSHAM_CANDIDATE",
  "RAHU_KETU_DOSHAM_WITH_NIVARTHI",
  "ACTIVE_RAHU_KETU_DOSHAM",
  "STRONG_ACTIVE_RAHU_KETU_DOSHAM",
  "SARPA_NAGA_DOSHAM_CANDIDATE",
  "KALA_SARPA_DOSHAM_CANDIDATE",
  "INCOMPLETE_DATA"
]
```

---

# 4. Sevvai Dosham Framework

## 4.1 Basic Rule

Traditional Tamil marriage-matching rule:

```text
If Mars/Sevvai is in 2, 4, 7, 8, or 12
from Lagna, Moon, or Venus,
mark Sevvai Dosham candidate.
```

Primary reference points:

```python
SEVVAI_REFERENCE_POINTS = [
  "Lagna",
  "Moon",
  "Venus"
]
```

Core Tamil mode dosha houses:

```python
TAMIL_SEVVAI_DOSHA_HOUSES = [2, 4, 7, 8, 12]
```

Extended Manglik mode, optional:

```python
EXTENDED_MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12]
```

The app should support:

```yaml
sevvai_mode:
  - tamil_standard
  - extended_manglik
```

## 4.2 Sevvai Dosham Illai

Declare **Sevvai Dosham Illai** only if:

```text
Mars is not in 2,4,7,8,12 from Lagna
AND
Mars is not in 2,4,7,8,12 from Moon
AND
Mars is not in 2,4,7,8,12 from Venus
```

In Tamil standard mode, these are generally non-dosha houses:

```python
NON_SEVVAI_DOSHA_HOUSES = [1, 3, 5, 6, 9, 10, 11]
```

But in extended mode, the 1st house may be counted.

---

# 5. Sevvai Severity Rules

## 5.1 House-Based Severity

```yaml
sevvai_house_severity:
  8: very_strong
  7: strong
  4: medium
  12: medium
  2: mild_to_medium
```

General severity guide:

| Mars Position | Traditional Severity |
|---|---|
| 8th from Lagna/Moon | Very strong |
| 7th from Lagna/Moon | Strong |
| 4th or 12th | Medium |
| 2nd | Mild to medium |
| Only from Venus | Usually milder than Lagna/Moon |
| From Lagna + Moon + Venus | Stronger cumulative effect |

## 5.2 Reference-Point Weighting

Suggested scoring:

```python
REFERENCE_WEIGHT = {
  "Lagna": 3,
  "Moon": 2,
  "Venus": 1
}
```

Suggested house severity:

```python
HOUSE_SEVERITY_WEIGHT = {
  8: 5,
  7: 4,
  4: 3,
  12: 3,
  2: 2
}
```

Total raw score can be:

```python
raw_score += REFERENCE_WEIGHT[reference] * HOUSE_SEVERITY_WEIGHT[house]
```

Do not use score alone. Use score plus nivarthi rules.

---

# 6. Sevvai Dosham Nivarthi / Cancellation Rules

A dosham candidate can become **Dosham with Nivarthi** if one or more of these rules apply.

## 6.1 Mars in Own Sign or Exalted Sign

Strong nivarthi:

```python
MARS_OWN_SIGNS = ["Mesham", "Viruchigam"]
MARS_EXALTATION_SIGN = "Magaram"
```

If Mars is in:

```text
Mesham
Viruchigam
Magaram
```

then reduce severity strongly.

## 6.2 General Traditional Nivarthi Signs

Some Tamil rule lists include:

```python
GENERAL_SEVVAI_NIVARTHI_SIGNS = [
  "Mesham",
  "Simmam",
  "Viruchigam",
  "Magaram",
  "Kumbam"
]
```

Recommended implementation:

```yaml
rule_type: optional_paramparai_rule
weight: medium
```

Do not treat this as universal across all traditions unless the app’s selected tradition enables it.

## 6.3 House-Sign Based Nivarthi

Important Tamil rule:

| Sevvai House | Nivarthi if Mars is in this Rasi |
|---|---|
| 2nd | Mithunam or Kanni |
| 4th | Mesham or Viruchigam |
| 7th | Kadagam or Magaram |
| 8th | Dhanusu or Meenam |
| 12th | Rishabam or Thulam |

Implementation:

```python
HOUSE_SIGN_NIVARTHI = {
  2: ["Mithunam", "Kanni"],
  4: ["Mesham", "Viruchigam"],
  7: ["Kadagam", "Magaram"],
  8: ["Dhanusu", "Meenam"],
  12: ["Rishabam", "Thulam"]
}
```

Check against the reference point used.

Example:

```python
house = house_from(reference_rasi, mars_rasi)
if house in HOUSE_SIGN_NIVARTHI:
    if mars_rasi in HOUSE_SIGN_NIVARTHI[house]:
        nivarthi.append("HOUSE_SIGN_NIVARTHI")
```

## 6.4 Guru Aspect on Mars

Guru/Jupiter aspects:

```python
JUPITER_SPECIAL_ASPECTS = [5, 7, 9]
```

If Jupiter aspects Mars:

```text
Sevvai Dosham candidate + Guru aspect = strong nivarthi
```

Implementation:

```python
def planet_aspects(jupiter_rasi, target_rasi):
    return house_from(jupiter_rasi, target_rasi) in [5, 7, 9]
```

## 6.5 Guru Conjunction with Mars

If Guru and Mars are in the same rasi/house:

```text
Guru + Mars = nivarthi/reduction, depending on total dignity.
```

This should be counted as a strong benefic modification.

## 6.6 Benefic Association

Some traditions reduce Sevvai Dosham if Mars is joined/aspected by:

```text
Guru
Chandran
Budhan
Sukran
Sooriyan — accepted in some lists, but should be treated carefully
```

Recommended weighting:

```yaml
Guru: strong
Sukran: medium
Budhan: medium
Chandran: medium
Sooriyan: weak_to_medium / tradition-dependent
```

Important: do not overstate Sun conjunction as full cancellation. Sun can add heat and ego even if it is friendly to Mars.

## 6.7 Dispositor Rule

If the lord of the rasi where Mars is placed is in kendra or trikona from Mars, reduce dosham.

Kendra from Mars:

```python
KENDRA_HOUSES = [1, 4, 7, 10]
```

Trikona from Mars:

```python
TRIKONA_HOUSES = [1, 5, 9]
```

Combined:

```python
KENDRA_TRIKONA_HOUSES = [1, 4, 5, 7, 9, 10]
```

Implementation:

```python
mars_sign_lord = lord_of(mars_rasi)
lord_rasi = planet[mars_sign_lord].rasi
if house_from(mars_rasi, lord_rasi) in KENDRA_TRIKONA_HOUSES:
    nivarthi.append("MARS_DISPOSITOR_KENDRA_TRIKONA")
```

## 6.8 Kadagam / Simmam Lagna Exception

Some Tamil traditions say:

```python
LAGNA_NIVARTHI_EXCEPTIONS = ["Kadagam", "Simmam"]
```

Reason:

```text
For Kadagam Lagna, Mars becomes yogakaraka by owning 5th and 10th.
For Simmam Lagna, Mars becomes yogakaraka by owning 4th and 9th.
```

Recommended implementation:

```yaml
rule_type: optional_paramparai_rule
weight: medium_to_strong
```

---

# 7. Male/Female Sevvai Severity Rules

## 7.1 Common Rule

The same core rule applies to both male and female charts:

```text
Check Sevvai in 2,4,7,8,12 from Lagna, Moon, Venus.
```

## 7.2 Gender-Based Severity Weighting

Some Tamil traditions add severity weighting.

For male chart:

```python
MALE_HIGH_ATTENTION_SEVVAI_HOUSES = [2, 7, 8]
```

For female chart:

```python
FEMALE_HIGH_ATTENTION_SEVVAI_HOUSES = [4, 8, 12]
```

Recommended implementation:

```text
Do not ignore common rule.
Use gender rule only as extra severity weighting.
```

Example:

```python
if gender == "female" and sevvai_house in [4, 8, 12]:
    severity += "gender_weighted_attention"
```

Especially for female chart:

```text
8th house Sevvai must be checked carefully because of mangalya/marital longevity symbolism.
```

---

# 8. Sevvai Matching Rule Between Bride and Groom

For marriage matching:

```text
No Sevvai + No Sevvai = balanced
Sevvai + comparable Sevvai = often acceptable
Strong Sevvai + no Sevvai = traditionally avoided
Sevvai with nivarthi + comparable Sevvai or strong clean chart = needs full judgement
```

The app must not simply output:

```text
Cancelled = no issue
```

Better:

```text
Candidate dosham exists, but nivarthi/reduction rules are present.
Final compatibility should compare both charts.
```

---

# 9. Sevvai Decision Algorithm

Pseudocode:

```python
def analyze_sevvai(chart, mode="tamil_standard"):
    dosha_houses = [2,4,7,8,12] if mode == "tamil_standard" else [1,2,4,7,8,12]

    references = {
        "Lagna": chart.lagna.rasi,
        "Moon": chart.planets["moon"].rasi,
        "Venus": chart.planets["venus"].rasi
    }

    mars_rasi = chart.planets["mars"].rasi

    result = {
        "label": None,
        "candidate_references": [],
        "nivarthi_rules": [],
        "severity_notes": [],
        "missing_data": []
    }

    for ref_name, ref_rasi in references.items():
        if ref_rasi is None:
            result["missing_data"].append(ref_name)
            continue

        house = house_from(ref_rasi, mars_rasi)

        if house in dosha_houses:
            result["candidate_references"].append({
                "reference": ref_name,
                "reference_rasi": ref_rasi,
                "mars_rasi": mars_rasi,
                "house": house
            })

            if house == 8:
                result["severity_notes"].append(f"8th from {ref_name}: strong/very strong")
            elif house == 7:
                result["severity_notes"].append(f"7th from {ref_name}: strong")
            elif house in [4,12]:
                result["severity_notes"].append(f"{house}th from {ref_name}: medium")
            elif house == 2:
                result["severity_notes"].append(f"2nd from {ref_name}: mild/medium")

            if house in HOUSE_SIGN_NIVARTHI and mars_rasi in HOUSE_SIGN_NIVARTHI[house]:
                result["nivarthi_rules"].append({
                    "rule": "HOUSE_SIGN_NIVARTHI",
                    "reference": ref_name,
                    "house": house,
                    "mars_rasi": mars_rasi
                })

    if mars_rasi in MARS_OWN_SIGNS:
        result["nivarthi_rules"].append({"rule": "MARS_IN_OWN_SIGN", "mars_rasi": mars_rasi})

    if mars_rasi == MARS_EXALTATION_SIGN:
        result["nivarthi_rules"].append({"rule": "MARS_EXALTED", "mars_rasi": mars_rasi})

    if guru_aspects_mars(chart):
        result["nivarthi_rules"].append({"rule": "GURU_ASPECT_ON_MARS"})

    if mars_dispositor_in_kendra_trikona(chart):
        result["nivarthi_rules"].append({"rule": "MARS_DISPOSITOR_KENDRA_TRIKONA"})

    if not result["candidate_references"]:
        result["label"] = "NO_SEVVAI_DOSHAM"
    elif result["nivarthi_rules"]:
        result["label"] = "SEVVAI_DOSHAM_WITH_NIVARTHI"
    else:
        result["label"] = "ACTIVE_SEVVAI_DOSHAM"

    return result
```

---

# 10. Rahu–Ketu Dosham Framework

## 10.1 Important Difference From Sevvai

Rahu–Ketu Dosham is less standardized than Sevvai Dosham.

Do not implement it as a single yes/no rule. Classify it into:

```text
Marriage/Kalathra Rahu-Ketu Dosham
Sarpa/Naga Dosham
Kala Sarpa Dosham
Putra/children-related node affliction
Pitru/ancestral node affliction
```

---

# 11. Rahu–Ketu Marriage Dosham

## 11.1 Main Houses

For marriage, check Rahu/Ketu in:

```python
RAHU_KETU_MARRIAGE_DOSHA_HOUSES = [1, 2, 7, 8]
```

Meaning:

| House | Marriage Meaning |
|---|---|
| 1st | Self, body, personality |
| 2nd | Family life after marriage |
| 7th | Spouse, relationship |
| 8th | Mangalya, intimacy, hidden matters, spouse longevity symbolism |

Basic rule:

```text
If Rahu or Ketu is in 1, 2, 7, or 8 from Lagna,
mark Rahu-Ketu marriage dosham candidate.
```

Optional additional checks:

```text
From Moon
From Venus
From Navamsa Lagna
```

## 11.2 Serious Marriage Afflictions

Confirm stronger Rahu–Ketu marriage concern when:

```text
Rahu/Ketu in 7th house
Rahu/Ketu in 8th house
Rahu/Ketu afflicts 7th lord
Rahu/Ketu joins Venus
Rahu/Ketu joins Mars and Venus
Rahu/Ketu joins Moon and affects emotional stability
Rahu/Ketu is in 7th or 8th in Navamsa
7th lord is with Rahu/Ketu in 6, 8, or 12
Venus is weak and connected with Rahu/Ketu
```

Rule:

```text
Node placement alone = candidate
Node placement + 7th/8th/Venus/7th-lord damage = confirmed/strong dosham
```

---

# 12. Rahu–Ketu Dosham Illai / Weak

Do not call Rahu–Ketu severe if:

```text
Rahu/Ketu are in 3,6,10,11 and not damaging 7th house/lord/Venus
7th house is strong
7th lord is strong
Venus is strong
Guru aspects the affected house or planet
Nodes are not close-degree conjunct with marriage planets
Navamsam is clean
Both bride and groom have similar dosha balance
```

Houses often considered more workable:

```python
RAHU_KETU_WORKABLE_HOUSES = [3, 6, 10, 11]
```

Contextual houses:

```python
RAHU_KETU_CONTEXTUAL_HOUSES = [4, 5, 9, 12]
```

But 5 and 9 may indicate Sarpa/Naga/Putra/Pitru concerns.

---

# 13. Rahu–Ketu Nivarthi / Cancellation Rules

## 13.1 Guru Aspect

Strongest protection:

```text
Guru aspect on Rahu/Ketu
Guru aspect on 7th house
Guru aspect on 7th lord
Guru aspect on Venus
Guru aspect on Moon
```

Use Jupiter aspects:

```python
JUPITER_SPECIAL_ASPECTS = [5, 7, 9]
```

## 13.2 Strong 7th Lord

Rahu/Ketu marriage dosham reduces if the 7th lord is:

```text
Own house
Exalted
In kendra/trikona
Aspected by Guru
Not joined with malefics
Strong in Navamsam
```

## 13.3 Strong Venus

Rahu/Ketu dosham reduces if Venus is:

```text
Strong by rasi
Not combust
Not with Rahu/Ketu
Not heavily afflicted by Mars/Saturn/Rahu/Ketu
Good in Navamsam
Aspected by Guru
```

## 13.4 Nodes in Upachaya Houses

Rahu/Ketu in 3,6,10,11 is often more manageable, especially if not afflicting marriage factors.

```python
UPACHAYA_HOUSES = [3, 6, 10, 11]
```

## 13.5 Similar Dosha in Both Charts

Marriage matching can balance doshas:

```text
Rahu-Ketu affected chart + similar affected chart = more balanced
Severe Rahu-Ketu chart + totally clean chart = needs caution
```

---

# 14. Male/Female Rahu–Ketu Conditions

## 14.1 Same Base Rule

Both male and female charts must be checked for:

```text
Lagna
Moon
Venus
7th house
7th lord
8th house
Navamsa
```

## 14.2 Female Chart Extra Focus

For female charts, give extra attention to:

```text
8th house
8th lord
7th house
7th lord
Venus
Mars
Navamsa
Mangalya strength
```

Special caution:

```text
Rahu/Ketu in 8th
Rahu/Ketu afflicting 8th lord
Rahu/Ketu with 7th lord
Rahu/Ketu with Venus
Rahu/Ketu in Navamsa 7th/8th
```

## 14.3 Male Chart Extra Focus

For male charts, give extra attention to:

```text
7th house
7th lord
Venus
2nd house family life
Navamsa
```

Special caution:

```text
Rahu/Ketu in 7th
Rahu/Ketu with Venus
Rahu/Ketu afflicting 2nd house/family house
Rahu/Ketu in Navamsa 7th
```

---

# 15. Sarpa / Naga Dosham

This is separate from direct marriage Rahu–Ketu Dosham.

Candidate when Rahu/Ketu affect:

```text
5th house
9th house
5th lord
9th lord
Guru
Putra karaka
Family lineage houses
```

Common interpretations:

| Placement | Traditional Concern |
|---|---|
| Rahu/Ketu in 5th | Children, pregnancy delay, mental restlessness |
| Rahu/Ketu in 9th | Father, dharma, guru, ancestral karma |
| Rahu/Ketu with 5th lord | Putra dosham concern |
| Rahu/Ketu with Guru | Guru-chandala style concern depending on chart |
| Rahu/Ketu afflicting Moon | Emotional/mental restlessness |

Do not automatically reject marriage based on Sarpa/Naga candidate. Judge full chart.

---

# 16. Kala Sarpa Dosham

Kala Sarpa Dosham is a specific condition:

```text
All seven classical planets are on one side of the Rahu-Ketu axis.
```

Classical planets:

```python
CLASSICAL_PLANETS = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn"
]
```

Algorithm idea:

```python
def is_kala_sarpa(chart):
    # using degrees 0-360
    rahu = chart.planets["rahu"].absolute_degree
    ketu = chart.planets["ketu"].absolute_degree

    # check whether all classical planets fall in arc Rahu -> Ketu
    # or all fall in arc Ketu -> Rahu
    return all_planets_inside_one_axis_arc
```

Important:

```text
Kala Sarpa is not the same as Rahu/Ketu in 7th or 8th.
They are separate checks.
```

---

# 17. Rahu–Ketu Axis Rules for Mesha Lagnam

For Mesha Lagnam, Rahu/Ketu can fall on these axes.

## 17.1 Rahu Mesham / Ketu Thulam

```text
Rahu 1st house
Ketu 7th house
Marriage dosham candidate: strong
```

Concerns:

```text
Self-restlessness
Relationship detachment
Unusual spouse/relationship pattern
Need strong Venus and 7th lord
```

## 17.2 Rahu Thulam / Ketu Mesham

```text
Rahu 7th house
Ketu 1st house
Marriage dosham candidate: strong
```

Concerns:

```text
Strong attraction/obsession
Unusual relationship
Internal dissatisfaction
Needs strong Venus, 7th lord, Navamsa
```

## 17.3 Rahu Rishabam / Ketu Viruchigam

```text
Rahu 2nd house
Ketu 8th house
Marriage/family dosham candidate: strong
```

Concerns:

```text
Family speech/family adjustment
Mangalya/intimacy/hidden emotional matters
Female chart: Ketu in 8th needs serious checking
```

## 17.4 Rahu Viruchigam / Ketu Rishabam

```text
Rahu 8th house
Ketu 2nd house
Marriage/family dosham candidate: strong
```

Concerns:

```text
Sudden changes
Secrecy
Psychological intensity
Family detachment
Female chart: Rahu in 8th needs serious checking
```

## 17.5 Rahu Midhunam / Ketu Dhanusu

```text
Rahu 3rd house
Ketu 9th house
Direct marriage dosham: usually not
Sarpa/Pitru/Guru concern: possible
```

## 17.6 Rahu Dhanusu / Ketu Midhunam

```text
Rahu 9th house
Ketu 3rd house
Direct marriage dosham: usually not
Dharma/father/guru/belief-system concern: possible
```

## 17.7 Rahu Kadagam / Ketu Magaram

```text
Rahu 4th house
Ketu 10th house
Direct marriage dosham: not usually
Home-career-emotional axis affected
```

If Ketu joins Moon in Magaram, emotional detachment/restlessness increases.

## 17.8 Rahu Magaram / Ketu Kadagam

```text
Rahu 10th house
Ketu 4th house
Direct marriage dosham: not usually
Career-home imbalance possible
```

If Ketu joins Guru in Kadagam, spiritual/detached inner life should be judged carefully.

## 17.9 Rahu Simmam / Ketu Kumbam

```text
Rahu 5th house
Ketu 11th house
Direct marriage dosham: not usually
Putra/Sarpa/Naga concern possible
```

## 17.10 Rahu Kumbam / Ketu Simmam

```text
Rahu 11th house
Ketu 5th house
Direct marriage dosham: not usually
Putra/children-related concern possible
```

## 17.11 Rahu Kanni / Ketu Meenam

```text
Rahu 6th house
Ketu 12th house
Direct marriage dosham: usually not
Health/debt/enemies/sleep/spirituality/private-life axis
```

## 17.12 Rahu Meenam / Ketu Kanni

```text
Rahu 12th house
Ketu 6th house
Direct marriage dosham: mild/indirect unless Venus/7th lord afflicted
```

---

# 18. Rahu–Ketu Decision Algorithm

Pseudocode:

```python
def analyze_rahu_ketu(chart):
    result = {
        "label": None,
        "marriage_candidates": [],
        "sarpa_naga_candidates": [],
        "kala_sarpa": False,
        "nivarthi_rules": [],
        "severity_notes": [],
        "missing_data": []
    }

    if chart.planets["rahu"].rasi is None or chart.planets["ketu"].rasi is None:
        result["label"] = "INCOMPLETE_DATA"
        result["missing_data"].append("Rahu/Ketu positions")
        return result

    lagna_rasi = chart.lagna.rasi

    for node_name in ["rahu", "ketu"]:
        node_rasi = chart.planets[node_name].rasi
        node_house = house_from(lagna_rasi, node_rasi)

        if node_house in [1,2,7,8]:
            result["marriage_candidates"].append({
                "node": node_name,
                "house": node_house,
                "rasi": node_rasi
            })

            if node_house in [7,8]:
                result["severity_notes"].append(
                    f"{node_name} in {node_house}th: strong marriage/mangalya concern"
                )

        if node_house in [5,9]:
            result["sarpa_naga_candidates"].append({
                "node": node_name,
                "house": node_house,
                "rasi": node_rasi
            })

    if node_afflicts_7th_house_or_lord(chart):
        result["severity_notes"].append("Rahu/Ketu afflicts 7th house or 7th lord")

    if node_afflicts_venus(chart):
        result["severity_notes"].append("Rahu/Ketu afflicts Venus")

    if node_afflicts_moon(chart):
        result["severity_notes"].append("Rahu/Ketu afflicts Moon/emotional stability")

    if guru_aspects_nodes_or_affected_house(chart):
        result["nivarthi_rules"].append("GURU_PROTECTION")

    if seventh_lord_strong(chart):
        result["nivarthi_rules"].append("STRONG_7TH_LORD")

    if venus_strong(chart):
        result["nivarthi_rules"].append("STRONG_VENUS")

    if navamsa_clean_for_marriage(chart):
        result["nivarthi_rules"].append("CLEAN_NAVAMSA_MARRIAGE_FACTORS")

    if is_kala_sarpa(chart):
        result["kala_sarpa"] = True

    if result["marriage_candidates"]:
        if result["nivarthi_rules"]:
            result["label"] = "RAHU_KETU_DOSHAM_WITH_NIVARTHI"
        else:
            result["label"] = "ACTIVE_RAHU_KETU_DOSHAM"
    elif result["sarpa_naga_candidates"]:
        result["label"] = "SARPA_NAGA_DOSHAM_CANDIDATE"
    elif result["kala_sarpa"]:
        result["label"] = "KALA_SARPA_DOSHAM_CANDIDATE"
    else:
        result["label"] = "NO_RAHU_KETU_DOSHAM"

    return result
```

---

# 19. Scenario Test Case: Given Chart

## 19.1 Given Data

This scenario is based on the user-provided chart details.

```yaml
gender: female

lagna:
  rasi: Mesham

planets:
  mars:
    rasi: Viruchigam
    house_from_lagna: 8
  sun:
    rasi: Viruchigam
    house_from_lagna: 8
  jupiter:
    rasi: Kadagam
    house_from_lagna: 4
  moon:
    rasi: Magaram
    nakshatra: Uthiradam
    house_from_lagna: 10

unknown:
  venus: not provided
  rahu: not provided
  ketu: not provided
  navamsa: not provided
  7th_lord_venus_strength: not provided
```

## 19.2 Scenario: Sevvai Analysis

For Mesha Lagnam:

```text
8th house = Viruchigam
Mars/Sevvai in Viruchigam = 8th from Lagna
```

Therefore:

```text
Sevvai Dosham candidate is present from Lagna.
```

Because this is a female chart:

```text
8th house Sevvai gets extra attention.
```

But there is strong nivarthi:

```text
Mars is in own sign Viruchigam.
Mars is Lagna lord for Mesha Lagna.
Jupiter in Kadagam aspects Viruchigam by 5th aspect.
Jupiter therefore aspects Mars + Sun in the 8th.
```

From Moon:

```text
Moon is in Magaram.
Mars is in Viruchigam.
Counting from Magaram to Viruchigam gives 11th house.
11th is not a Sevvai Dosham house.
```

So:

```text
From Lagna: Sevvai Dosham candidate
From Moon: No Sevvai Dosham
From Venus: Cannot decide because Venus position is missing
```

Expected classification:

```yaml
sevvai_result:
  label: SEVVAI_DOSHAM_WITH_NIVARTHI
  candidate_references:
    - reference: Lagna
      house: 8
      mars_rasi: Viruchigam
      severity: strong/very_strong
  non_candidate_references:
    - reference: Moon
      house: 11
      result: no_dosham
  nivarthi_rules:
    - MARS_IN_OWN_SIGN
    - MARS_AS_LAGNA_LORD
    - GURU_ASPECT_ON_MARS
  missing_data:
    - Venus position
    - Navamsa
```

Human explanation:

```text
This chart has Sevvai Dosham from Lagna because Mars is in the 8th house.
However, Mars is in its own sign Viruchigam and is the Lagna lord for Mesha Lagna.
Jupiter in Kadagam aspects the 8th house Viruchigam by 5th aspect.
From Moon sign Magaram, Mars is 11th, so there is no Sevvai Dosham from Moon.
Therefore this is not an unprotected severe Sevvai Dosham.
It should be classified as Sevvai Dosham with strong nivarthi.
```

Tamil-style explanation:

```text
இந்த ஜாதகத்தில் லக்னத்திலிருந்து 8-ஆம் இடத்தில் செவ்வாய் இருப்பதால் செவ்வாய் தோஷம் candidate இருக்கிறது.

ஆனால் செவ்வாய் விருச்சிகத்தில் தன்வீட்டில் இருக்கிறது. மேலும் மேஷ லக்னத்திற்கு செவ்வாய் லக்னாதிபதி. கடகத்தில் இருக்கும் குரு 5-ஆம் பார்வையால் விருச்சிகத்தில் இருக்கும் செவ்வாய் + சூரியனை பார்க்கிறது. அதனால் பலமான நிவர்த்தி இருக்கிறது.

மகர சந்திர ராசியிலிருந்து செவ்வாய் 11-ஆம் இடத்தில் இருப்பதால் சந்திர ராசி அடிப்படையில் செவ்வாய் தோஷம் இல்லை.

ஆகவே இது severe active Sevvai Dosham அல்ல. இது strong nivarthi உடைய Sevvai Dosham.
```

## 19.3 Scenario: Rahu/Ketu Analysis

Rahu and Ketu positions were not provided.

Expected classification:

```yaml
rahu_ketu_result:
  label: INCOMPLETE_DATA
  reason: Rahu and Ketu positions are missing
```

But the rule engine should support conditional interpretation.

### If Rahu/Ketu are in 1/7 axis

```text
Rahu Mesham / Ketu Thulam
or
Rahu Thulam / Ketu Mesham
```

Expected:

```yaml
label: RAHU_KETU_DOSHAM_CANDIDATE or ACTIVE_RAHU_KETU_DOSHAM
severity: strong
reason:
  - Nodes affect Lagna/7th relationship axis
must_check:
  - Venus
  - 7th lord
  - Navamsa
  - Guru protection
  - groom chart dosha balance
```

### If Rahu/Ketu are in 2/8 axis

```text
Rahu Rishabam / Ketu Viruchigam
or
Rahu Viruchigam / Ketu Rishabam
```

Expected:

```yaml
label: RAHU_KETU_DOSHAM_CANDIDATE or ACTIVE_RAHU_KETU_DOSHAM
severity: strong
reason:
  - Nodes affect 2nd/8th family-mangalya axis
  - Female chart gives extra attention to 8th house
special_note:
  - 8th house already contains Mars + Sun
protection:
  - Jupiter in Kadagam aspects Viruchigam by 5th aspect
```

Human explanation:

```text
If Rahu or Ketu is also in the 8th house Viruchigam, the 8th house becomes heavily loaded because Mars + Sun are already there. For a female chart, this must be checked seriously. However, Jupiter in Kadagam aspects Viruchigam, giving strong protection. Final decision still requires Venus, 7th lord, Navamsa, and partner chart.
```

### If Rahu/Ketu are in 4/10 axis

```text
Rahu Kadagam / Ketu Magaram
or
Rahu Magaram / Ketu Kadagam
```

Expected:

```yaml
label: contextual_not_direct_marriage_dosham
reason:
  - Nodes affect home-career axis
  - If node joins Moon, emotional restlessness/detachment may increase
  - If node joins Guru, spiritual/karmic influence must be interpreted carefully
```

### If Rahu/Ketu are in 5/11 or 3/9 axis

Expected:

```yaml
label: SARPA_NAGA_DOSHAM_CANDIDATE or PITRU/PUTRA_CONTEXT
reason:
  - More related to children, father, guru, dharma, ancestral karma
  - Not direct marriage dosham unless 7th/Venus/7th lord is affected
```

### If Rahu/Ketu are in 6/12 axis

Expected:

```yaml
label: mild_or_indirect
reason:
  - Not usually direct marriage dosham
  - Check Venus, 7th lord, Navamsa before final statement
```

---

# 20. Required Explanation Format for App Output

The application should not only give a label. It must explain:

```yaml
dosha_name:
final_label:
calculation_basis:
  reference_point:
  planet:
  house_count:
  rasi:
why_dosha_candidate:
nivarthi_found:
severity:
gender_specific_attention:
missing_data:
final_human_explanation:
```

Example:

```yaml
dosha_name: Sevvai Dosham
final_label: SEVVAI_DOSHAM_WITH_NIVARTHI
calculation_basis:
  reference_point: Lagna
  lagna_rasi: Mesham
  mars_rasi: Viruchigam
  house_from_lagna: 8
why_dosha_candidate:
  - Mars in 8th from Lagna
nivarthi_found:
  - Mars in own sign Viruchigam
  - Mars is Lagna lord
  - Jupiter aspects Mars by 5th aspect
severity:
  base: strong
  after_nivarthi: reduced
gender_specific_attention:
  - Female chart: 8th house Mars must be checked carefully
missing_data:
  - Venus position
  - Navamsa chart
final_human_explanation: >
  Sevvai Dosham is present from Lagna because Mars is in the 8th house.
  But Mars is in its own sign and Jupiter aspects it, so strong nivarthi exists.
  From Moon, there is no Sevvai Dosham. Final marriage judgement still requires
  Venus, 7th lord, Navamsa, and partner chart.
```

---

# 21. Coding Agent Validation Checklist

Ask the coding agent to verify these items.

## 21.1 Calculation Validation

- [ ] Is Lagna calculated using Thirukanitham/Drik method?
- [ ] Are planetary rasis calculated correctly?
- [ ] Are houses counted inclusively from reference rasi?
- [ ] Is Moon rasi used correctly for Chandra/Rasi-based checks?
- [ ] Is Venus used correctly for Sukra-based checks?
- [ ] Is Navamsa available for final marriage judgement?
- [ ] Are Rahu and Ketu always opposite by 180 degrees?

## 21.2 Sevvai Validation

- [ ] Does code check Mars from Lagna?
- [ ] Does code check Mars from Moon?
- [ ] Does code check Mars from Venus?
- [ ] Does Tamil mode use 2,4,7,8,12?
- [ ] Does extended mode optionally include 1?
- [ ] Does code classify house severity?
- [ ] Does code check Mars own signs: Mesham, Viruchigam?
- [ ] Does code check Mars exaltation: Magaram?
- [ ] Does code check house-sign nivarthi table?
- [ ] Does code check Guru aspect on Mars?
- [ ] Does code check Guru conjunction with Mars?
- [ ] Does code check Mars sign lord/dispositor in kendra/trikona?
- [ ] Does code handle optional Kadagam/Simmam Lagna exception?
- [ ] Does code apply male/female severity weighting but not override core rule?
- [ ] Does output distinguish "No Dosham" from "Dosham with Nivarthi"?

## 21.3 Rahu/Ketu Validation

- [ ] Does code require Rahu/Ketu positions before final judgement?
- [ ] Does code check Rahu/Ketu from Lagna?
- [ ] Does code check 1,2,7,8 as marriage dosham candidate houses?
- [ ] Does code classify 5/9 as Sarpa/Naga/Putra/Pitru candidate?
- [ ] Does code treat 3/6/10/11 as usually workable unless afflicting marriage factors?
- [ ] Does code check Rahu/Ketu influence on 7th house?
- [ ] Does code check Rahu/Ketu influence on 7th lord?
- [ ] Does code check Rahu/Ketu influence on Venus?
- [ ] Does code check Rahu/Ketu influence on Moon?
- [ ] Does code check Navamsa 7th/8th/node placements?
- [ ] Does code check Guru protection on nodes/affected houses?
- [ ] Does code check strong 7th lord?
- [ ] Does code check strong Venus?
- [ ] Does code check Kala Sarpa separately?
- [ ] Does code avoid confusing Kala Sarpa with basic Rahu/Ketu dosham?
- [ ] Does code apply female extra focus on 8th house?
- [ ] Does code apply male extra focus on 7th, Venus, and 2nd house family life?

## 21.4 Scenario Validation

For the given scenario:

```yaml
Lagna: Mesham
Mars: Viruchigam, 8th
Sun: Viruchigam, 8th
Jupiter: Kadagam, 4th
Moon: Magaram, 10th, Uthiradam
Gender: Female
```

Expected Sevvai result:

```yaml
label: SEVVAI_DOSHAM_WITH_NIVARTHI
must_detect:
  - Mars 8th from Lagna
  - Mars in own sign Viruchigam
  - Mars is Lagna lord for Mesha Lagna
  - Jupiter aspects Mars by 5th aspect from Kadagam to Viruchigam
  - Mars is 11th from Moon, so no Sevvai from Moon
must_not_output:
  - Plain "No Sevvai Dosham"
  - Plain "Severe dangerous Sevvai Dosham"
correct_output:
  - "Sevvai Dosham candidate exists from Lagna, but strong nivarthi is present."
```

Expected Rahu/Ketu result:

```yaml
label: INCOMPLETE_DATA
reason:
  - Rahu and Ketu positions were not supplied
must_not_output:
  - Rahu-Ketu Dosham confirmed
  - Rahu-Ketu Dosham absent
correct_output:
  - "Cannot finalize Rahu-Ketu Dosham without Rahu/Ketu positions."
```

---

# 22. Prompt to Give Coding Agent

Use this prompt:

```text
You are reviewing a Tamil astrology / Thirukanitham-based dosha analysis codebase.

Validate whether the code correctly implements the attached specification for:
1. Sevvai Dosham
2. Sevvai Dosham Illai
3. Sevvai Dosham Nivarthi / Cancellation
4. Rahu-Ketu Marriage Dosham
5. Sarpa/Naga/Kala Sarpa differentiation
6. Male/female severity weighting
7. Scenario-specific output correctness

Check the implementation at these levels:
- Astronomical chart input assumptions
- Inclusive house counting
- Lagna/Moon/Venus reference checks
- Sevvai dosha houses
- Sevvai nivarthi tables
- Guru aspect logic
- Mars own/exalted sign logic
- Dispositor logic
- Rahu/Ketu house-axis logic
- Rahu/Ketu nivarthi logic
- Navamsa dependency
- Missing-data handling
- Human-readable explanation generation

Use the scenario test case:
Lagna = Mesham
Mars = Viruchigam, 8th
Sun = Viruchigam, 8th
Jupiter = Kadagam, 4th
Moon = Magaram, Uthiradam, 10th
Gender = Female
Rahu/Ketu = not provided

Expected Sevvai result:
SEVVAI_DOSHAM_WITH_NIVARTHI

Expected Rahu/Ketu result:
INCOMPLETE_DATA unless Rahu/Ketu positions are supplied.

Return:
1. What is correctly implemented
2. What is missing
3. What is incorrectly implemented
4. Edge cases not handled
5. Required code changes
6. Required test cases
7. Whether output explanation is astrologically transparent and not misleading
```

---

# 23. Final Recommendation

The code should never say only:

```text
Dosham exists
```

or only:

```text
Dosham cancelled
```

It should say:

```text
Which planet caused it
From which reference point
Which house
Which rasi
Why it is a candidate
Which nivarthi rules apply
Whether male/female severity changes the weight
What data is missing
What final label is assigned
What should still be checked before marriage judgement
```

For the given chart, the correct Sevvai conclusion is:

```text
Sevvai Dosham exists from Lagna because Mars is in the 8th house.
But it has strong nivarthi because Mars is in own sign Viruchigam, is Lagna lord for Mesha Lagna, and receives Guru's 5th aspect from Kadagam.
From Moon sign Magaram, Mars is 11th, so there is no Sevvai Dosham from Moon.
Final: Sevvai Dosham with strong nivarthi.
```

For Rahu/Ketu:

```text
Rahu/Ketu dosham cannot be finalized until Rahu and Ketu positions are supplied.
If Rahu/Ketu are in 1/7 or 2/8 axis, marriage dosham candidate is present.
If Rahu/Ketu affect 5/9, Sarpa/Naga/Putra/Pitru type concern may be present.
If all planets are within Rahu-Ketu axis, Kala Sarpa must be checked separately.
```

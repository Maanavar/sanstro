# VINAADI UX BLINDSPOT AUDIT REPORT

**Date:** 2026-08-22
**Auditor:** Claude Code
**Method:** Source-level walkthrough of the shipped surfaces (`web/app`, `web/components`, `web/lib/i18n.ts`, `web/lib/marketing-i18n/`, `app/services/`) read as each persona would see them. Every finding below cites the file that produces the behaviour. Nothing is assumed to exist that I could not find in the tree.

---

## EXECUTIVE SUMMARY

**Total issues found: 61**

| Severity | Count |
|---|---|
| **S0 — BLIND** | 7 |
| **S1 — LOST** | 19 |
| **S2 — GUESSING** | 11 |
| **S3 — FRICTION** | 15 |
| **S4 — MISSED** | 9 |

### Top 5 most critical findings

1. **The birth chart grid prints Tamil script in English mode.** `buildD1CellDetail` ([chart-utils.ts:208](web/lib/chart-utils.ts#L208), [:245](web/lib/chart-utils.ts#L245)) always fills the 12 boxes from `GRAHA_ABBR` — சூ, சந், செ, பு, கு, சு, ச, ரா, கே — regardless of `lang`. `GRAHA_ABBR_EN` ("Su/Mo/Ma/…") exists at [:164](web/lib/chart-utils.ts#L164) but only the marketing *share card* uses it ([JadhagamTool.tsx:999](web/app/(marketing)/tools/jadhagam-generator/JadhagamTool.tsx#L999)). Only the Lagna marker language-switches ([dashboard-charts.tsx:53-57](web/components/dashboard-charts.tsx#L53-L57)). Jake, in an English UI, gets a grid of characters he cannot read at all. **S0.**

2. **There is no glossary, help page, or FAQ anywhere in the app.** `find web/app -ipath "*gloss*" -o -ipath "*help*" -o -ipath "*faq*"` returns nothing. The one in-context mechanism, `GlossaryTerm` ([glossary-term.tsx](web/components/glossary-term.tsx)), covers **20 terms** ([glossary.ts](web/lib/glossary.ts)) and is imported by **7 files** — none of them the Today tab or the Calendar tab, which between them show ~29 untranslated terms on first paint. **S0/S1 shared.**

3. **A brand-new user's first screen carries 14+ unexplained terms with no ladder out of any of them.** Today tab: Rahu Kalam, Yamagandam, Kuligai, Nalla Neram, Nakshatram, Tithi, Chandrashtama, Abhijit muhurtham, Horai, Dasa layer, Panchangam, Transit, Sukla/Krishna Paksham ([dashboard-today-tab-nova.tsx](web/components/dashboard-today-tab-nova.tsx), [dashboard-today-ribbon-nova.tsx](web/components/dashboard-today-ribbon-nova.tsx)). None is a tooltip. **S1 shared.**

4. **The plain-language layer is built and unwired.** `plainLang()` and `plainLangBiText()` in [plainlang.ts](web/lib/plainlang.ts) — a full table glossing planets, rasis, Chandrashtama, retrograde, combust, Vargottama into ordinary English — have **zero callers** in the entire tree. Only `plainLangDashaLord` is used, in one file. The `BEGINNER` mode that would drive it defaults to `BALANCED` ([app/schemas/auth.py:59](app/schemas/auth.py#L59)), lives only in Settings, and is never offered at signup. **S4 — the fix for finding #3 is already written and switched off.**

5. **Onboarding is a data-entry form, not an introduction.** The whole first-run guide is a two-line checklist: "Add your birth profile" / "Add a family member to compare charts" ([i18n.ts:1093-1096](web/lib/i18n.ts#L1093-L1096)). No tour, no coachmarks, no "what is this app", no explanation of why birth time matters — even though `/learn/why-birth-time-matters` is written and shipped ([dashboard-learn-content.ts:79](web/components/dashboard-learn-content.ts#L79)) and simply isn't linked from the birth-time field. **S1/S4 shared.**

### "Would they come back?" — verdict

**Karthik (Persona A): Yes, but shallow — 2–3 sessions, then drift.**
He completes setup, gets a genuinely good two-minute reading, and screenshots it for the family WhatsApp group. That is the win. But every surface past Today is written for someone who already practises: he can name maybe 4 of the ~40 terms he meets, and the app never once offers to teach him one *at the moment he meets it*. He will use it as a panchangam/Rahu-Kalam lookup and a porutham calculator when a wedding comes up. He will not explore his own chart, because nothing on the chart surface is addressed to a person who has never opened one.

**Jake (Persona B): No. He bounces inside the first 5 minutes, most likely at the birth-place field.**
Two hard stops before he ever sees a result: (a) Portland, Oregon is not in the 145-entry city list ([tn-cities.ts](web/lib/tn-cities.ts)) — his only recourse is the `place_unmatched_hint` telling him to type latitude and longitude by hand; (b) if he instead uses the guest preview, it silently defaults his timezone to `Asia/Kolkata` and his birth time to `12:00` ([dashboard-guest-chart-modal.tsx:66-70](web/components/dashboard-guest-chart-modal.tsx#L66-L70)) and hands him a confidently wrong chart with no warning. If he somehow clears both, the chart itself renders in Tamil script. There is no page anywhere in the product that explains what Vedic/sidereal astrology *is* relative to the horoscopes he knows — the closest, `/learn/what-is-thirukanitham`, opens on "Drik vs Vakya", a question only an insider has.

---

# PERSONA A (KARTHIK) — FULL WALKTHROUGH

*28, Chennai, software engineer. Reads Tamil, prefers English UI. Heard the words his whole life; has never opened his own jathagam.*

**Emotional arc:** Curious → Recognises the vocabulary, mildly reassured → Completes setup with light friction → **Genuinely impressed by the two-minute reading** → Opens the chart, understands nothing, closes it → Uses Today as a Rahu-Kalam widget → Drifts.

## First Contact (0–60 seconds)

**Second 0–8 — Landing page.** Eyebrow reads "Thirukanitham-Precise Tamil Astrology"; tagline "Your birth second, calculated precisely"; H1 "One calm guide for your chart, your day, and the people you plan with" ([home.ts:7-16](web/lib/marketing-i18n/home.ts#L7-L16)). He does not know what Thirukanitham is, but he recognises the shape of the claim — this is the kind of thing his father's jothidar would say — and the H1 is in plain English. **This lands.** Tone is calm, not carnival; he stays.

**Second 8–20 — Scrolling.** "What Vinaadi does" is six plain-language cards. `help4_body` literally promises "your lagna, dasa lord, transiting planets, yogas, and doshas — explained in plain language, not jargon" ([home.ts:63](web/lib/marketing-i18n/home.ts#L63)). He reads that as a direct answer to his problem. `daily_sig3` then says "Panchangam quality — Tithi, Vara, Nakshathiram, Yoga, Karana for the day" — five words, none of which he can define, in the section that just promised no jargon. Small dissonance, not fatal.

**Second 20–35 — Social proof.** "N jadhagams generated for Tamil families worldwide", three named testimonials from Chennai/Madurai/Coimbatore. He is exactly the addressee. Trust up.

**Second 35–60 — CTA → `/login`.** The left panel is four hardcoded English lines ([login/page.tsx:46-51](web/app/login/page.tsx#L46-L51)): "Thirukanitham accuracy — Lahiri ayanamsa, Drik ephemeris", "Daily Dasa, Gochar & Panchangam in plain language", "Family vault — group charts, shared fortune windows", "Yogas & Dosham explained transparently, not just a verdict". He can parse roughly half. "Lahiri ayanamsa, Drik ephemeris" reads to him as *credentials he can't check* — which is arguably the intent, and it does work as a trust signal on him. He signs up.

### Screen: Landing page

**What Karthik sees:** A calm, Tamil-addressed marketing page with a live sample reading card showing today's real tithi/nakshatra/yoga.
**What he understands:** The value proposition, the six benefit cards, the testimonials, the three how-it-works steps.
**What he doesn't:** Thirukanitham, ayanamsa, the five panchangam limbs by name, "D1 · D9 ready" on the sample card, Rajju/Vedhai/Sevvai/D9 in `help5_body`.
**What he feels:** Reassured. This is his culture, presented respectfully and without hype.
**What he does next:** Clicks the primary CTA.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-001 | `card_d1_ready` "D1 · D9 ready" ([home.ts:35](web/lib/marketing-i18n/home.ts#L35)) | S1 | D1/D9 is astrologer shorthand on the hero card — the first sample he studies. He has never heard "D9". | "Birth chart + marriage chart ready" (or drop from hero; it earns nothing here). |
| A-002 | `daily_sig3` naming all five limbs ([home.ts:88](web/lib/marketing-i18n/home.ts#L88)) | S3 | Sits inside the section promising plain language; names five terms and defines none. | "Panchangam quality — the five daily almanac readings that decide whether a day is favourable." Keep the term, add the gloss. |
| A-003 | `help5_body` "Rajju, Vedhai, Sevvai, D9, and dasa context" ([home.ts:68](web/lib/marketing-i18n/home.ts#L68)) | S3 | Four terms in one sentence on a marketing page. He knows "porutham" and stops there. | Lead with the count and the promise ("all ten poruthams plus the three dosha cross-checks"), list the names as a smaller sub-line. |
| A-004 | Login left panel, hardcoded English array ([login/page.tsx:46-51](web/app/login/page.tsx#L46-L51)) | S3 | Not bilingual — a Tamil-language visitor gets English here while the whole rest of the marketing surface honours `lang`. Also the densest jargon block before signup. | Move to `marketing-i18n`, add Tamil, and cut "Lahiri ayanamsa, Drik ephemeris" to one trust line. |

### Screen: Setup / birth data entry (`Tab: onboarding`)

**What Karthik sees:** A three-step rail — "Your chart" → "Family vault" → "Add member" ([i18n.ts:63-65](web/lib/i18n.ts#L63-L65)) — and a form: Name*, Birth date*, Birth time, Birth place*, Timezone*, **Latitude***, **Longitude***, Relationship, Birth Time Source, Where you live now, Marital Status, Children, Employment Type.

**What he understands:** Name, date, time, place. The city combobox autofills lat/lng/timezone for Chennai, so the scary fields resolve themselves.
**What he doesn't:** Why the app needs Latitude and Longitude as *required, visible* fields at all. What a "vault" is. Why "Weight" appears on a family member. Why marital status and employment type are being collected before he has seen a single result.
**What he feels:** Mild "this is a database form, not a product." Tolerable — he's an engineer.
**What he does next:** Fills step 1, presses "Create chart", ignores steps 2 and 3.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-005 | `field_birth_time` + helper "Leave blank if unknown" ([i18n.ts:93,102](web/lib/i18n.ts#L93)) | **S2** | Nothing says exact time matters. He half-remembers "morning sometime", shrugs, leaves it blank — and silently loses Lagna, every house placement, and the whole chart-explanation surface. He will never know that's what happened. | Helper: "Even 15 minutes changes your Lagna and every house in your chart. Ask a parent or check the birth certificate — you can refine it later." Link `/learn/why-birth-time-matters` inline. Show, on the result, what is unavailable without it. |
| A-006 | `/learn/why-birth-time-matters` not linked from the field ([dashboard-learn-content.ts:79](web/components/dashboard-learn-content.ts#L79)) | **S4** | The article is written, shipped, and reachable only from Explore or the public footer — i.e. everywhere except the one screen where the question arises. | Link it from the birth-time helper and from the `rectify_banner` estimated-time warning. |
| A-007 | `setup_step2_label` "Family vault" ([i18n.ts:64](web/lib/i18n.ts#L64)) | S3 | "Vault" is product jargon, not astrology jargon, and it gates step 3 (`setup_step3_sub_vault`: "Pick a vault first, then add members"). He reads it as storage, not as "your family group". | Rename to "Your family" / "Family group". Auto-create one on first member instead of gating. |
| A-008 | `field_latitude` / `field_longitude` shown as required ([i18n.ts:96-97](web/lib/i18n.ts#L96-L97)) | S3 | Two raw geodetic fields on the primary signup form. The combobox fills them, so they are pure anxiety surface. | Collapse behind "Enter coordinates manually" — the pattern `place_edit_coords` already implements ([i18n.ts:109](web/lib/i18n.ts#L109)). |
| A-009 | `field_weight` "Weight" + "Auto-set by relationship" ([i18n.ts:98,105](web/lib/i18n.ts#L98)) | S1 | A numeric weight on a family member (rendered as "· weight 0.80", [dashboard-setup-tab.tsx:601](web/components/dashboard-setup-tab.tsx#L601)) with no statement of what it weights. He guesses "importance", which is uncomfortable. | Either hide it entirely (it is auto-set) or label it "How much this person's chart counts toward the family score". |
| A-010 | Marital status / children / employment collected pre-result | S3 | Five personal-profile questions before any value has been delivered. Classic pre-payment friction. | Move to a post-first-result "make this more specific about you" prompt. |
| A-011 | Onboarding checklist is the entire first-run guide ([i18n.ts:1093-1096](web/lib/i18n.ts#L1093-L1096)) | S1 | Two steps, both data entry. Nothing tells him what the app will do, what to look at first, or what the tabs mean. | Add a third step that is an *outcome*, not an input: "Read your two-minute chart summary" — the app's single best asset, currently buried in Family & Charts. |
| A-012 | Dead App Store link `id0000000000` ([dashboard-setup-tab.tsx:902](web/components/dashboard-setup-tab.tsx#L902)) | S3 | Broken store link in the signed-in upsell block. `home-content.tsx:36` already documents this as a dead link and nulls its own badge; this copy was missed. | Null-guard it the same way, or remove until iOS ships. |

### Screen: Today (first result)

**What Karthik sees:** A score ring "64 / 100", "Why this score", greeting, best window / avoid window, "Horai now", a Chandrashtama chip, a panchangam ribbon reading `Nakshatram · Tithi · sunrise/sunset`, "Rahu Kalam / Yamagandam / Kuligai / Nalla Neram" strips, "Dasa layer · Panchangam · Transit" as score components, "Is today okay for…?", "Coming up", a family strip.

**What he understands:** The number 64 is a rating of his day. Rahu Kalam is a bad time (he knew that already). Best window / Avoid are actionable and clear. "Is today okay for…?" is the single most legible thing on the page.
**What he doesn't:** Yamagandam, Kuligai, Nalla Neram vs Abhijit vs Horai (four different time systems shown side by side with no hierarchy), Tithi, Nakshatram as a *daily* value (he thinks nakshatram is a birth thing), Chandrashtama, Sukla/Krishna Paksham, what "Dasa layer" contributes.
**What he feels:** Impressed by the density, mildly overwhelmed. Reassured by "a day for awareness, not alarm" on the Chandrashtama chip — that framing works.
**What he does next:** Taps "Why this score". Then taps "Is today okay for…?". Then screenshots the score.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-013 | Four parallel timing systems on one screen — Nalla Neram, Gowri, Abhijit, Horai, plus Rahu/Yama/Kuligai | **S2** | He cannot tell which one to obey. He has heard of exactly one (Rahu Kalam) and will assume the others are variants of it, or ignore the screen. Worse: he may act on the wrong one. | Promote **one** recommended window per day (the app already computes `title_recommended_nalla_neram`) and demote the rest behind "Other traditional timings", each with a one-line "what this system is". |
| A-014 | "Nakshatram" in the daily ribbon ([dashboard-today-ribbon-nova.tsx:252](web/components/dashboard-today-ribbon-nova.tsx#L252)) | **S2** | Elsewhere the app labels his natal star "Birth Star" (`label_nakshatra`). Here the *day's* star is labelled "Nakshatram". Same concept, two labels, two meanings — he reads the day's star as his own. | Label it "Today's star" / "Moon's star today". Reserve "Birth Star" for natal. |
| A-015 | "Chandrashtama today" ([dashboard-today-tab-nova.tsx:534-535](web/components/dashboard-today-tab-nova.tsx#L534)) | S1 | The reassurance line ("a day for awareness, not alarm") is excellent, but the *word* is never defined at point of use. `chandrashtama_warning` elsewhere does define it ("Moon is in the 8th rasi from your natal Moon sign") — that definition doesn't reach this chip. | Reuse the existing definition sentence as a tap-to-reveal on the chip. The `DashboardLearnArticleModal` for this exact topic is already wired in `dashboard-personal-shared.tsx:106` — reuse it here. |
| A-016 | "Dasa layer / Panchangam / Transit" as score components ([dashboard-today-tab-nova.tsx:870-872](web/components/dashboard-today-tab-nova.tsx#L870)) | S1 | Three named inputs, none glossed. He can't tell whether "Dasa layer" is about his life or about today. | One clause each: "Dasa — the multi-year period you're in", "Panchangam — today's almanac", "Transit — where planets are today vs your chart." |
| A-017 | "Horai now" ([dashboard-today-tab-nova.tsx:700](web/components/dashboard-today-tab-nova.tsx#L700)) | S4 | Hourly planetary ruler, shown with a "Next" chip. He has never heard the word, doesn't click, and misses a genuinely usable hour-by-hour feature. | "Planetary hour" with the Tamil name secondary; add "Good for: …" so the value is legible without the term. |
| A-018 | Score = 64/100 with no band language on the ring itself | S2 | Is 64 good? He has no reference. `getScoreBand`/`getScoreVerdictFromGuidance` exist ([format.ts](web/lib/format.ts)) — the verdict word needs to sit on the ring, not below the fold. | Print the band word next to the number: "64 — a steady day". |

### Screen: Family & Charts (the chart itself)

**What Karthik sees:** A South Indian 12-box kattam. In English mode the boxes contain **சூ, சந், செ, பு, கு, சு, ச, ரா, கே** and the Lagna is "La". Beside it: "D1 Rasi / D9 Navamsa" toggle, "Jathagam Kattam (South Indian)", "Tap to explain", a planet table with columns Planet / Sign / Degree / Birth Star / Pada / **House (L)** / D9 Sign / Special, and flags Retrograde / Combust / Vargottama / Cazimi. Further down: "Sade Sati / Ashtama Sani" in a red card, "Sani · from Moon", "Sani · from Lagna".

**What he understands:** It's his horoscope. He can *read* the Tamil letters but was never taught that சு is Venus and சூ is the Sun — these differ by one vowel mark. "Retrograde" he half-knows from memes.
**What he doesn't:** Which letter is which planet; what a house is; what "House (L)" means; Pada; Combust; Vargottama; Cazimi; D9; Navamsa; Sade Sati; Ashtama Sani; why there are two Sani cycles.
**What he feels:** *This is the screen he came for, and it is closed to him.* Deflating.
**What he does next:** Taps a box (finds "Tap to explain" — good), reads one panel, doesn't return.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-019 | Tamil graha abbreviations with no legend ([chart-utils.ts:139-161](web/lib/chart-utils.ts#L139-L161)) | **S1** | சூ/சு (Sun/Venus) and ச/சந் (Saturn/Moon) are one mark apart. He reads Tamil but has never been taught this notation. There is no legend anywhere on the chart. | Render a persistent 9-item legend below the kattam in both languages. In English mode use `GRAHA_ABBR_EN` (see B-006). |
| A-020 | `col_house` "House (L)" ([i18n.ts:282](web/lib/i18n.ts#L282)) | S1 | "(L)" is unexplained astrologer shorthand for "from Lagna". He reads it as a code. | "House (from Lagna)" — and the house-group copy already written in `HOUSE_GROUP_COPY` should be reachable from this column. |
| A-021 | `flag_astam` "Combust", `flag_vargottamam` "Vargottama", `flag_cazimi` "Cazimi" ([i18n.ts:286-288](web/lib/i18n.ts#L286-L288)) | S1 | Three dignity states as bare chips. `plainlang.ts` already has "Sun-suppressed" and "Double strength" glosses for two of them — unwired. | Wire `plainLangBiText` as the chip tooltip (see A-030). Add Cazimi to the table. |
| A-022 | "Sade Sati / Ashtama Sani" red card ([dashboard-family-charts-hybrid.tsx:375](web/components/dashboard-family-charts-hybrid.tsx#L375)) | **S2** | He knows only "Sani is bad". An active cycle renders in the caution palette with a cycle name and no duration, no "this happens to everyone three times in a life", no "what actually helps". This is the single most anxiety-productive card in the app for a Tamil user. | Always show duration and normalcy: "Ezharai Sani — a 7½-year Saturn period that reaches everyone roughly three times in a lifetime. You are in phase 2 of 3, ending ~March 2028." Pair with the remedy the app already computes. |
| A-023 | Two Sani cycles ("from Moon", "from Lagna") shown as equals | S2 | Two verdicts side by side on the same question. If they disagree he cannot resolve it, and will read the worse one. | Name one as primary ("the traditional reckoning") and mark the other as a cross-check, per the same principle already applied to porutham cross-checks. |
| A-024 | Chart-explanation section titles: "Drishti / Aspects", "Kendra / Trikona / Dusthana", "Upcoming Peyarchi" ([dashboard-chart-explanation-data.ts:96-148](web/components/dashboard-chart-explanation-data.ts#L96-L148)) | S3 | The section *bodies* are genuinely plain (`HOUSE_MEANING` is excellent: "home, inner peace, property"). The *titles* he must click through are not. He judges the section by its title and skips. | Retitle by outcome — "Which planets look at which", "Which parts of life your planets sit in", "Big planet moves coming for you" — with the traditional term as a subtitle. |
| A-025 | "Tap to explain" affordance is a `title` attribute ([dashboard-charts.tsx:190](web/components/dashboard-charts.tsx#L190)) | S4 | A native tooltip is invisible on touch and low-discoverability on desktop. The explanation behind it is one of the app's best assets. | Make it a visible chip on the chart ("Tap any box to see what it means"), shown until first use. |

### Screen: Explore

**What Karthik sees:** "The why behind your readings", a search box ("Search a star, dosham, temple or question…"), "Start from your chart — the entries that apply to you", his birth star card, active yogas, present doshams, then "The library — every entry in plain Tamil-first language", and 5 Learn articles.

**What he feels:** *This is the good part.* Personalised entry points ("Active in your chart", "Present in your chart") are exactly right. This is the one place the app teaches.
**Issue:** he only found it by chance, on visit three.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-026 | Explore is undiscovered ([dashboard-explore-tab-nova.tsx](web/components/dashboard-explore-tab-nova.tsx)) | **S4** | The app's entire teaching layer sits behind a tab labelled "Explore", which reads as "browse content", not "understand what you just saw". Nothing on Today, the chart, or the Calendar links into it. | Every unexplained term on Today/Chart/Calendar should deep-link into its Explore entry. Rename the tab "Understand" or "Learn". |
| A-027 | Explore search searches the library, not the interface | S4 | If he types "Kuligai" — a word he saw on Today — the library has no entry for it, so search fails on the term that prompted it. | Index the *interface vocabulary* (Kuligai, Yamagandam, Nalla Neram, Horai, Paksham, Pada, Vargottama…) into the same search, pointing at glossary definitions. |
| A-028 | Only 5 Learn articles ([dashboard-learn-content.ts](web/components/dashboard-learn-content.ts)) | S4 | Nothing on: what a dasa is, what a house is, what a lagnam is, what the daily score means. Those are his four actual questions. | Four new articles, each linked from the surface that raises the question. |

### Screen: Tools → Compatibility Check (porutham)

**What Karthik sees:** Context selector (General/Marriage/Friendship/Business/Family), two birth forms with ♂ Groom / ♀ Bride labels, then a result: big ring "7 / 10 PORUTHAMS", a verdict badge, possibly a red "Rajju Dosha" chip, the ten poruthams each with a one-line "governs" description and ✓/✗, some tagged **CRITICAL**, a "Cross-checks" rail, and "If you go ahead → Find wedding muhurtas".

**What he understands:** More than anywhere else in the app. Each porutham carries a plain description ("Physical and emotional intimacy compatibility", "Rasi-lord friendship and mutual support"). The footnote is genuinely excellent: *"Each porutham is a strict pass/fail check — one point each. A porutham is guidance for conversation between families — not a gate."*
**What he doesn't:** What score is normal. Whether 7/10 is good. What "Rajju" is beyond the chip's colour.
**What he feels:** Engaged, then spiked by the red chip.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-029 | Verdict badge can read "Dosham - Avoid" ([dashboard-tools-porutham-nova.tsx:414](web/components/dashboard-tools-porutham-nova.tsx#L414)) | **S2** | Two words, in the largest type on the page, with the de-escalating footnote three scroll-lengths below. For a real couple checking their own match this is the highest-stakes string in the product. | Keep the verdict — do not dilute the doctrine — but colocate the footnote *with the badge*, and name the specific blocker: "Rajju does not match — traditionally a serious check. See what it measures ↓". |
| A-030 | "Rajju: Traditional marital longevity risk marker", weight **Critical** ([dashboard-synastry-panel.tsx:90](web/components/dashboard-synastry-panel.tsx#L90)) | **S2** | "Longevity risk" without qualification reads as "one of you will die". No indication that classical sources vary on Rajju, that it is one of ten, or what an astrologer would actually do with it. | Rewrite: "Rajju — a traditional check on the durability of the marriage. Sources differ on how much weight it carries; a family astrologer will read it alongside both full charts." |
| A-031 | No baseline for the score ([dashboard-tools-porutham-nova.tsx:406](web/components/dashboard-tools-porutham-nova.tsx#L406)) | **S2** | "7 / 10 PORUTHAMS" with no statement of what families conventionally accept. He assumes 10/10 is the target and reads 7 as failure. | One line under the ring: "Most matches families proceed with fall between 5 and 8. Below 5 usually prompts a deeper reading." |
| A-032 | ♂ Groom / ♀ Bride hardcoded ([:338-342](web/components/dashboard-tools-porutham-nova.tsx#L338)) | S3 | Fine for the marriage context; wrong for the Friendship/Business/Family contexts the same form offers. | Swap to "Person 1 / Person 2" outside MARRIAGE context — the strings already exist in the ternary. |

### Screen: Calendar (Transits & Events)

**What Karthik sees:** Tithi, Nakshatra, **Naamyogam**, Karana, **Amirdhadhi**, Vara, **Soolam**, **Parigaram**, Valarpirai/Theipirai, "Inauspicious kala", "Subha Muhurtham day" / "Not a muhurtham day", **Karinaal**, Day Muhurtham / Night Muhurtham, Recommended Nalla Neram.

**What he understands:** "Auspicious" / "Avoid". The date grid.
**What he doesn't:** 12 of the 15 named fields.
**What he feels:** "This is the printed panchangam my grandmother reads." Respect — and total exclusion. He cannot use it.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-033 | 15+ terms, zero definitions ([dashboard-calendar-tab-nova.tsx:878-922](web/components/dashboard-calendar-tab-nova.tsx#L878-L922)) | **S1** | The densest jargon wall in the app. `GlossaryTerm` is not used on this file at all. | Wrap every one of these in `GlossaryTerm` and add the missing entries to `glossary.ts` (it currently has none of them). This is a ~15-string change with the largest comprehension payoff in the product. |
| A-034 | "Soolam" and "Parigaram" adjacent ([:920-922](web/components/dashboard-calendar-tab-nova.tsx#L920)) | S1 | A direction to avoid and its remedy, presented as two bare labels. Without the gloss the pair is meaningless; with it, it is one of the most *usable* things on the screen (don't travel that way today, or do this if you must). | "Soolam — direction to avoid today" / "Parigaram — what to do if you must travel that way". |
| A-035 | "Karinaal" ([:787](web/components/dashboard-calendar-tab-nova.tsx#L787)) | S2 | An inauspicious-day marker with no explanation. He sees it on a day he planned something and now doesn't know how seriously to take it. | Gloss + severity framing: "Karinaal — a day traditionally avoided for new beginnings. Ongoing work is unaffected." |

### Screen: Life Areas / Yogas & Doshams

**What he sees:** Structured panels — "What This Is", "Why Your Chart Has This", "What This Brings", "Protective Factors", "Attention Note", "How This May Affect You", "How to Reduce Impact", "Remedies", plus severity and "Activated by current Dasha".

**This is the best-designed content architecture in the app.** The Meaning → Why → Mechanics → What to do ladder is exactly right, and "Protective Factors" before "Attention Note" is genuinely humane ordering.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-036 | "Activated by current Dasha" ([dashboard-life-areas-yogas-doshams-nova.tsx:423](web/components/dashboard-life-areas-yogas-doshams-nova.tsx#L423)) | S1 | The most decision-relevant line on the panel — is this live *right now* — hangs on a term he doesn't have. | "Active right now (your current planetary period is triggering it)". |
| A-037 | Yoga names shown bare (e.g. "Gajakesari Yoga") | S3 | The name tells him nothing; the explanation below is good. He judges by the name and may not expand. | Show the effect as the headline and the Sanskrit name as the subtitle: "Respect that outlasts setbacks · *Gajakesari Yoga*". |
| A-038 | Gemstone panel: "Prescribed — wear these" / "Not recommended" ([dashboard-life-areas-remedies-nova.tsx:247-249](web/components/dashboard-life-areas-remedies-nova.tsx#L247)) | S3 | "Prescribed" is medical register for something the app's own disclaimer calls a traditional belief system. Also no cost/where framing. | "Traditionally worn for your chart" / "Traditionally avoided". Add "these are traditional recommendations, not requirements". |

### Screen: Settings

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-039 | Detail level (Beginner/Balanced/Traditional) is buried in Settings ([dashboard-settings-session-tab.tsx:641-648](web/components/dashboard-settings-session-tab.tsx#L641-L648)) | **S4** | The single control that would fix half this report's findings for him, defaulting to BALANCED, placed where he will never look. | Ask it once, at signup, in plain terms: "How much astrology do you already know?" → *"I've heard the words but never studied it"* should map to BEGINNER. |
| A-040 | `settings_owner` "Owner user ID", `settings_profile` "Birth profile ID", `settings_chart` "Chart ID" ([i18n.ts:383-389](web/lib/i18n.ts#L383-L389)) | S3 | Internal identifiers surfaced in end-user settings. Reads as an unfinished admin panel — and he's an engineer, so he notices. | Move behind a "Technical details" disclosure or remove. |

### Absences he notices

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| A-041 | No glossary / help / FAQ route anywhere in `web/app` | **S1** | When he doesn't know a word, there is no destination. The `GLOSSARY` object exists with 20 good definitions and no index page. | Ship `/dashboard/glossary` rendering `GLOSSARY`, linked from the nav and from every `GlossaryTerm`'s "see all". Expand from 20 to ~60 terms. |
| A-042 | `plainLang()` / `plainLangBiText()` have zero callers ([plainlang.ts](web/lib/plainlang.ts)) | **S4** | A finished plain-language table for planets, rasis, Chandrashtama, retrograde, combust, Vargottama — shipped, tested by nothing, called by nothing. | Wire `plainLangBiText` as the universal tooltip source in BALANCED mode (which is what `mode_balanced_desc` — "Some terms, with tooltips" — already promises the user). |
| A-043 | No onboarding tour, coachmarks, or first-run walkthrough | S1 | Verified absent: no coachmark/walkthrough/product-tour/spotlight component in the tree. | Three coachmarks on first Today load: the score ring, the best window, "Why this score". |

---

# PERSONA B (JAKE) — FULL WALKTHROUGH

*31, Portland OR, marketing. Knows "Gemini" and the Mercury-retrograde meme. Cannot read a single Tamil character.*

**Emotional arc:** Open and curious → Immediately signalled "not for you" by the landing page → Pushes on out of goodwill → **Hard stop at the birth-place field** → Either abandons, or forces through and receives a chart he cannot read at all → Gone.

## First Contact (0–60 seconds)

**Second 0–5.** Eyebrow: "Thirukanitham-Precise Tamil Astrology". Tagline: "Your birth second, calculated precisely". He does not know what Thirukanitham is, and the second word he reads is "Tamil", which he reads — correctly — as *this is for a specific ethnic community and I am not it*. He does not yet leave; his friend recommended it.

**Second 5–25.** H1 and body are plain English and land fine. But `hero_body` says "Vinaadi turns Thirukanitham-based astrology into daily guidance…" — the differentiator is a word with no definition on the page. The sample card shows "Ekadasi · Kettai · Vishkambha" and "Moon Dasa · Moon Bhukti". Zero of five terms parse.

**Second 25–40.** Social proof reads "N **jadhagams** generated for **Tamil families** worldwide", with three Tamil testimonials from three Indian cities. Every trust signal on the page is addressed to someone else. He is now a tourist.

**Second 40–60.** Nav: Features / Tools / Guide / **Natchathirams** / Pricing / Learn / Methodology. Under Tools: "Muhurtham Naal 2026", "Marriage Porutham Calculator", "Jadhagam Generator", "Indraiya Rasipalan". Under Guide: "Dosham", "Yogam", "Pariharam", "Temples". **Nine of the fourteen nav destinations are named in a language he does not speak.** He clicks "Learn" hoping for an explainer.

**Second 60+.** `/learn/what-is-thirukanitham` opens on "Thirukanitham is the Tamil astronomical calculation system for astrology — based on the actual (drik) positions of the planets, not traditional memorised tables", then "Drik vs Vakya". This answers *which Indian method* — a question only someone already inside the tradition has. It never answers *what is this tradition, and how does it relate to the horoscope I know*. The word "Western" appears exactly once in the product, inside a parenthetical about ayanamsa ([learn-thirukanitham.ts:27](web/lib/marketing-i18n/learn-thirukanitham.ts#L27)).

### Screen: Landing page

**What Jake sees:** A handsome, calm page about something he cannot name.
**What he understands:** It's an astrology app. It's Indian. It's precise about something.
**What he doesn't:** Thirukanitham, jadhagam, porutham, panchangam, dasa, bhukti, nakshathiram, rasi, lagna, tithi, karana, muhurtham, natchathiram, dosham, yogam, pariharam, rasipalan, Chandrashtama, D1/D9, Rajju, Vedhai, Sevvai, ayanamsa. **~22 unfamiliar terms on the marketing surface alone.**
**What he feels:** Politely excluded.
**What he does next:** Clicks the CTA anyway, once, for his friend.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-001 | No "what is Vedic astrology" bridge anywhere in the product | **S0** | There is no page that says: *this system uses a different zodiac calculation from Western astrology; your rising sign matters more than your sun sign; there are 27 lunar stars as well as 12 signs; timing runs in multi-year planetary periods.* Those four sentences would carry him through 80% of the app. | Write `/learn/vedic-vs-western`, link it from the hero, the nav, and the first dashboard load. This is the single highest-leverage missing artefact for this persona. |
| B-002 | Sample hero card: "Ekadasi · Kettai · Vishkambha", "Moon Dasa · Moon Bhukti" ([home-content.tsx:118-122](web/components/home-content.tsx#L118-L122)) | **S0** | The one concrete demonstration of the product is five untranslated proper nouns. He cannot tell whether it is good news or bad. | Add a plain-English second line under the panchangam strip: "A steady day. Best hour: 11:53–12:41." The card already computes both. |
| B-003 | Social proof addressed exclusively to Tamil families ([home.ts:24-31](web/lib/marketing-i18n/home.ts#L24-L31)) | S3 | "jadhagams generated for Tamil families worldwide" + three Tamil testimonials. Correct for the primary audience; a closed door for him. | Keep it. Add one non-Tamil testimonial and a "new to Vedic astrology? start here →" link in the same band. That costs the primary audience nothing. |
| B-004 | 9 of 14 nav labels are untranslated ([public-nav.tsx:65-88](web/components/public-nav.tsx#L65-L88)) | **S1** | Natchathirams, Muhurtham Naal, Porutham, Jadhagam, Rasipalan, Dosham, Yogam, Pariharam — he cannot form an intention to click any of them. | Every nav item already has a `desc` field in the same object for some entries. Populate it for all, and lead the English label with function: "Birth Stars (Natchathiram)", "Compatibility (Porutham)", "Remedies (Pariharam)". |
| B-005 | `/learn/what-is-thirukanitham` is the entry point ([learn-thirukanitham.ts](web/lib/marketing-i18n/learn-thirukanitham.ts)) | S1 | The "Learn" destination opens on an intra-tradition methodology debate. He leaves more confused than he arrived. | Reorder Learn so a "Start here" article precedes it. Thirukanitham is a *credibility* article, not an *orientation* article. |

### Screen: Signup / birth data entry — **where he leaves**

**What Jake sees:** Name, Birth date, Birth time, **Birth place** (a combobox), Timezone, Latitude*, Longitude*.

**What happens:** He types "Portland". The combobox filters `PLACE_CITIES` — 145 entries covering Tamil Nadu, the rest of India, and the Tamil diaspora (SF Bay, Toronto, London, Sydney, Kuala Lumpur, Durban…). **Portland is not in it. Neither is Boston, Denver, Minneapolis, or Philadelphia.** He gets `place_unmatched_hint`: *"We couldn't match this place to a known city — check the spelling above, or enter coordinates directly below."*

He is now being asked, by an astrology app, to look up his own latitude and longitude.

**What he feels:** "This app isn't built for people like me." Correct inference.
**What he does next:** ~70% close the tab here.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-006 | Birth-place dataset is 145 hand-listed cities ([tn-cities.ts](web/lib/tn-cities.ts)) | **S0** | Hard functional block. Only 14 US cities exist, all Tamil-diaspora hubs. Any non-diaspora user of any nationality is asked to hand-enter coordinates on the first form. | Back the combobox with a real geocoder (or a bundled world-cities dataset ≥100k population). This is the single blocking defect for every non-diaspora user, not just Jake. |
| B-007 | Fallback is raw lat/lng entry ([i18n.ts:111](web/lib/i18n.ts#L111)) | **S1** | The escape hatch demands geodetic literacy and offers no help finding the numbers. | Until B-006 lands: offer a map picker, or a "paste a Google Maps link" field, or at minimum a link to a coordinate lookup with instructions. |
| B-008 | Guest chart modal silently defaults `birthTimezone: "Asia/Kolkata"` and `birthTimeLocal: "12:00"` ([dashboard-guest-chart-modal.tsx:66-70](web/components/dashboard-guest-chart-modal.tsx#L66-L70)) | **S0** | If he uses the no-account preview and doesn't notice the timezone field, the app computes his chart in Indian Standard Time — a 12.5-hour error — and presents the result with no warning at all. He receives a confidently wrong chart and has no way to know. | Default the timezone from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`). If birth time is left at the 12:00 placeholder, mark the result "approximate — birth time not provided", the way `rectify_banner` already does for the signed-in path. |
| B-009 | Birth time helper says only "Leave blank if unknown" ([i18n.ts:102](web/lib/i18n.ts#L102)) | **S2** | Jake's model of astrology is "your birthday determines your sign". Nothing tells him that in *this* system the minute of birth is the primary input. He leaves it blank and gets a degraded chart he believes is complete. | Same fix as A-005, plus one sentence he specifically needs: "Unlike Western sun-sign astrology, this system's core reading comes from the exact minute — which changes roughly every two hours." |
| B-010 | `field_timezone` with no explanation ([i18n.ts:95](web/lib/i18n.ts#L95)) | S3 | Even if he finds Portland, he must reason about which timezone applied on his 1994 birth date. No guidance on historical DST. | State the rule: "Use the timezone of the birth place — we handle daylight saving automatically for that date." |

### Screen: Today (if he gets this far)

**What Jake sees:** A score. Then: Rahu Kalam, Yamagandam, Kuligai, Nalla Neram, Nakshatram, Tithi, Chandrashtama, Abhijit muhurtham, Horai, Dasa layer, Panchangam, Sukla Paksham, Valarpirai.

**What he understands:** The number. "Best window" and "Avoid" — genuinely legible, and the strongest thing on the page for him. "Good morning".
**What he doesn't:** Everything else. **13+ terms, zero definitions, no tooltip mechanism on this file.**
**Explain-to-a-friend test:** Fails. He could say "it gave me a 64 out of 100 and told me a good hour." That is the entire transferable content of the screen.

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-011 | Today tab jargon density, no tooltips ([dashboard-today-tab-nova.tsx](web/components/dashboard-today-tab-nova.tsx)) | **S0** | 13+ untranslated terms on the primary screen. `GlossaryTerm` is not imported here. `glossary.ts` defines none of these words. | Wrap in `GlossaryTerm`; add the ~13 missing entries to `GLOSSARY`. Combined with A-033 this is roughly 28 new glossary entries and covers the two highest-traffic screens. |
| B-012 | "Yoga" used in the astrological sense ([i18n.ts:360](web/lib/i18n.ts#L360)) | **S2** | He reads it as exercise. It appears as a *daily panchangam value*, so "today's Yoga is Vishkambha" reads as a yoga class recommendation. Classic false-familiarity vector. | In English mode render "Yoga (planetary combination)" on first occurrence per screen, or use "Daily combination" with the term secondary. |
| B-013 | "House" used in the astrological sense | **S2** | Second false-familiarity term. "House (L)" in the planet table is unrecoverable for him. | "Life area (house)" on first use; the app's own `HOUSE_MEANING` table already supplies the plain gloss. |
| B-014 | "Transit" used in the astrological sense | S2 | Third. He may read it as travel, especially beside "Travel Abroad" in the goals list. | "Transit — where a planet is today, compared with your birth chart" on first use. `glossary.ts` already has exactly this sentence under `gochar` and never shows it here. |
| B-015 | "Best window" / "Avoid" ([i18n.ts:197-198](web/lib/i18n.ts#L197-L198)) | — | **Strength.** The only fully self-explanatory pair on the screen, and the thing he'd actually use. | Lead with it. For a beginner, this should be the hero of Today, above the score. |

### Screen: The birth chart

**What Jake sees:** A 12-box grid containing **சூ சந் செ பு கு சு ச ரா கே** and "La".

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-016 | Chart renders Tamil abbreviations in English mode ([chart-utils.ts:208,245](web/lib/chart-utils.ts#L208)) | **S0** | Total incomprehension. Not "confusing" — *unreadable*. He cannot extract one bit of information. The fix already exists as an unused constant 44 lines above (`GRAHA_ABBR_EN`), and the public jadhagam tool's share card already uses it. | `abbr: (lang === "en" ? GRAHA_ABBR_EN : GRAHA_ABBR)[p.graha]`. `buildD1CellDetail`/`buildD9CellDetail` need a `lang` parameter — the same parameter `occupantAbbr` already takes for the Lagna marker. |
| B-017 | No chart legend ([dashboard-charts.tsx](web/components/dashboard-charts.tsx)) | **S0** | Even fixed to "Su/Mo/Ma/Me/Ju/Ve/Sa/**Ra**/**Ke**", he does not know Ra and Ke are anything — they are not planets in his solar system. | A 9-item legend under the chart with full names, and one line for the nodes: "Rahu & Ketu — the two lunar nodes, where the Moon's path crosses the Sun's. Treated as planets in this system." |
| B-018 | "Jathagam Kattam (South Indian)" ([i18n.ts:219](web/lib/i18n.ts#L219)) | **S1** | He does not know this is *a chart format among several*, that the boxes are fixed signs and not equal houses, or that the layout is read differently from a Western wheel. | "Birth chart — South Indian square format" plus a one-line reading key: "The 12 boxes are the 12 signs, fixed in place. Your Lagna box is marked; count clockwise from there." |
| B-019 | "D1 Rasi / D9 Navamsa" toggle ([i18n.ts:221-223](web/lib/i18n.ts#L221)) | **S1** | Two codes and two untranslated words for the app's most important structural distinction. | "Main chart" / "Marriage & depth chart (Navamsa)" with a one-line explanation of what a divisional chart is. |
| B-020 | Planet table columns: Sign / Degree / Birth Star / Pada / House (L) / D9 Sign / Special ([i18n.ts:277-288](web/lib/i18n.ts#L277)) | **S1** | Five of seven columns are meaningless to him. "Pada" has no English rendering anywhere in the product. | Gloss every column header on hover; give Pada a plain rendering ("quarter of the star, 1–4"). |
| B-021 | `flag_vakra` "Retrograde" ([i18n.ts:285](web/lib/i18n.ts#L285)) | S2 | He knows the *meme*, not the meaning, and the meme is "everything goes wrong". The app's own `plainlang.ts` glosses it far better — "Reflective phase" — and never shows it. | Wire the existing gloss. |

### Screen: Porutham / marriage matching

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-022 | No framing of what porutham *is* culturally ([dashboard-tools-porutham-nova.tsx](web/components/dashboard-tools-porutham-nova.tsx)) | **S1** | He has no concept of formal, family-mediated chart matching. Presented cold, it reads as a novelty compatibility quiz, and the ♂ Groom / ♀ Bride labels then read as dated rather than as accurate to the practice. | One paragraph above the form: "In South Indian tradition, families compare two birth charts across ten specific checks before a marriage. This is that calculation." Reuse `/learn/what-is-porutham`, which is already written. |
| B-023 | Ten untranslated kuta names — Dinam, Ganam, Mahendra, Sthree Deergham, Yoni, Rasi, Graha Maitri, Vedha, Vasya, Rajju | **S1** | Ten proper nouns. Mitigated — genuinely well — by the one-line "governs" description on each row ([dashboard-synastry-panel.tsx:85-90](web/components/dashboard-synastry-panel.tsx#L85-L90)), which is the single best explanatory pattern in the codebase. | Lead with the description and demote the name: "**Day-to-day rhythm** · Dinam ✓". Same content, reversed hierarchy. |
| B-024 | "Dosham - Avoid" verdict badge ([:414](web/components/dashboard-tools-porutham-nova.tsx#L414)) | **S2** | See A-029. For Jake it is strictly worse: "Dosham" is not a word, so all he takes is "Avoid" in red. | Same fix; ensure the English rendering never leaves an untranslated noun carrying the verdict. |
| B-025 | The de-escalating footnote is genuinely good | — | **Strength.** "A porutham is guidance for conversation between families — not a gate." | Promote it to sit beside the score, not below the table. |

### Screen: Calendar / Panchangam

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-026 | Entire surface untranslated ([dashboard-calendar-tab-nova.tsx](web/components/dashboard-calendar-tab-nova.tsx)) | **S0** | Tithi, Nakshatra, Naamyogam, Karana, Amirdhadhi, Vara, Soolam, Parigaram, Valarpirai, Theipirai, Karinaal, Subha Muhurtham, Kala. Thirteen terms, no English equivalent visible, no tooltips. There is nothing on this screen he can use. | Same as A-033. Additionally: one plain-English summary line per day ("A generally favourable day. Avoid 10:30–12:00.") so the screen has *any* value without the vocabulary. |
| B-027 | Tamil month names in the calendar header | **S1** | "Aavani" is not translated or dated ("mid-Aug to mid-Sep"). | Show the Gregorian range alongside on first render. |
| B-028 | "Valarpirai / Theipirai" ([i18n.ts:368-369](web/lib/i18n.ts#L368)) | S1 | Waxing/waning moon — a concept he *does* have, hidden behind words he doesn't. The Today tab already renders "Waxing"/"Waning" ([dashboard-today-tab-nova.tsx:369](web/components/dashboard-today-tab-nova.tsx#L369)); the Calendar doesn't. | Use the English rendering the app already has, consistently. |

### Screens: Dasha, Yogas, Doshams, Remedies, Numerology, Muhurta

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-029 | "Dasa · Bhukti · Antaram" as a panel title ([i18n.ts:295](web/lib/i18n.ts#L295)) | **S1** | Three untranslated words naming a three-level system he has never heard of. `glossary.ts` defines `dasha` and `bhukti` well — and `GlossaryTerm` is not used on this panel. | "Life periods — major, sub, and minor". Wire the existing glossary entries. |
| B-030 | "Vimshottari Dasa timeline" ([i18n.ts:297](web/lib/i18n.ts#L297)) | S1 | Names the *system* before establishing that a period system exists. | "Your life periods (Vimshottari system)". |
| B-031 | "Chandiran Dasa" style labels — planet names in Tamil transliteration | **S1** | `tPlanetLord` renders Tamil planet names; `plainLangDashaLord` would give him "Moon (mind planet)" — but only in BEGINNER mode, which he was never offered. | Default English-language users to English planet names regardless of detail level. Language and expertise are different axes and are currently conflated. |
| B-032 | "Yogas" section title ([i18n.ts:574](web/lib/i18n.ts#L574)) | **S2** | Reads as exercise. He may open it expecting wellness content. | "Chart patterns (yogas)" — the panel body already explains each one well. |
| B-033 | "Doshams" section title ([i18n.ts:575](web/lib/i18n.ts#L575)) | **S1** | No English equivalent given anywhere at the title level. | "Difficult placements (doshams)". |
| B-034 | Kala Sarpa naga names ([dashboard-life-areas-yogas-doshams-nova.tsx:432](web/components/dashboard-life-areas-yogas-doshams-nova.tsx#L432)) | S1 | "The specific Kala Sarpa naga for this chart" — a serpent name, in a system he doesn't have. | Gloss "naga" once; the surrounding "What This Is / Protective Factors" structure carries the rest well. |
| B-035 | Remedies: temple visits, mantras, fasting, gemstones | **S2** | Presented as prescriptions ("Prescribed — wear these"). For a non-Hindu these read as religious instructions he is being told to follow, not as a tradition being described. | Frame as description, not prescription: "In this tradition, people with this placement are advised to…". Offer the secular alternative that `remedies_mode_secular` already implements ([dashboard-life-areas-remedies-nova.tsx:181](web/components/dashboard-life-areas-remedies-nova.tsx#L181)) — and surface that toggle prominently, not as a hidden mode. |
| B-036 | "Griha Pravesam"-style activity names in Muhurta | S1 | Activity list is mostly translated well ("Job Change", "Marriage", "Property") — a genuine strength — but the surrounding factor names (Tithi, Nakshatra, Rahu Kalam) are not. | Keep the plain activity names; gloss the factors. |
| B-037 | Muhurta framing ([dashboard-plan-muhurta-nova.tsx:54-68](web/components/dashboard-plan-muhurta-nova.tsx#L54-L68)) | S1 | "Personalised to your jadhagam", "full muhurta assessment". He has no concept of electional astrology. | One line: "Muhurta — choosing the most favourable time to begin something important. Pick what you're planning and we'll rank the days." |
| B-038 | Numerology: "Name Lab" / name-correction recommendations | **S2** | Recommending a spelling change to a person's name is a strong, culturally specific practice. Without framing, he reads it as the app telling him his name is wrong. | Frame explicitly as a traditional practice and make the "why" precede the suggestion. |

### Emotional & trust audit — Jake

| ID | Element | Sev | Description | Suggested fix |
|---|---|---|---|---|
| B-039 | `disclaimer_astro` ([i18n.ts:471](web/lib/i18n.ts#L471)) | — | **Strength.** "Astrology is a traditional belief system, not a science." Honest, and exactly what a skeptical Portland marketer needs to see to stay. | Surface it earlier — currently a footer disclaimer, should be a first-run statement. |
| B-040 | `safeguard_health` / `safeguard_decision` ([i18n.ts:474-475](web/lib/i18n.ts#L474)) | — | **Strength.** "the stars point to timing and tendency, never a diagnosis" is excellent. | Keep. |
| B-041 | "Thirukanitham method" / "Drik ephemeris" / "Lahiri ayanamsa" as trust signals | **S3** | These read to Karthik as credentials. To Jake they read as *jargon substituting for evidence* — the opposite of the intended effect. | Add one line he can evaluate: "Planetary positions computed with the Swiss Ephemeris — the same astronomical data used by observatories." |
| B-042 | No return hook he can name | **S4** | After one session he cannot articulate what the app told him. Nothing is shareable in his own words. | The two-minute reading is the answer and he never reaches it (see shared finding below). |

---

## COMPARATIVE ANALYSIS

### Unique to Karthik (cultural awareness, no practice)
The "false fluency" gap. He recognises ~40 words phonetically and can define ~4. The app therefore reads to him as *almost* comprehensible, which is worse than opaque — he doesn't ask for help, he just quietly gets less. His specific failures cluster on **notation** (Tamil graha abbreviations, "House (L)", D1/D9) and on **which-of-several** confusion (four timing systems, two Sani cycles) — questions a practitioner resolves by training and he cannot resolve at all.

### Unique to Jake (zero context)
Two of his blockers are **functional, not comprehension** failures: the city dataset (B-006) and the Asia/Kolkata timezone default (B-008). He is stopped before the UX questions arise. Past those, his gap is structural: he needs to be told the system exists before any label can help him. His three false-familiarity traps — Yoga, House, Transit — are invisible to a Tamil-native reviewer, because in Tamil those words carry no competing meaning.

### Shared by BOTH — these are P0
1. **The chart grid** (A-019 / B-016, B-017) — different severity, same root cause: a notation shipped with no legend and no language switch.
2. **No glossary, no help, no FAQ** (A-041 / B-011, B-026) — the same absence blocks both, on the same two screens.
3. **Today and Calendar jargon walls** (A-013, A-033 / B-011, B-026) — 13 and 15 terms respectively, zero tooltips on either file.
4. **Birth time is undersold** (A-005 / B-009) — both silently degrade their own chart, neither is told.
5. **The two-minute reading is buried** — see below.
6. **The plain-language layer is written and disconnected** (A-042 / B-021, B-031) — both would be materially better served by code already in the repo.

### The single most valuable thing in the product is also the hardest to find

`app/services/one_minute_reading_service.py` and `five_minute_reading_service.py` generate genuinely excellent plain-language prose: *"You read a room before anyone speaks, and people bring you their troubles — though other…"*, *"Life keeps asking you to care without carrying all of it."* No jargon in the body; the technical basis is quarantined in a separate "what this rests on" line ([dashboard-one-minute-reading.tsx:53](web/components/dashboard-one-minute-reading.tsx#L53)).

**This is the answer to most of this report** — and it is rendered inside the Family & Charts tab ([dashboard-family-charts-hybrid.tsx:1017](web/components/dashboard-family-charts-hybrid.tsx#L1017)), behind a member selector, on a tab named after a feature neither persona is looking for on day one. Both personas would have a completely different first session if this were the first thing they saw after their chart calculated.

---

## PRIORITIZED FIX RECOMMENDATIONS

### TIER 1 — Before launch (S0 + anxiety-producing S2)

1. **`buildD1CellDetail`/`buildD9CellDetail` take `lang`; use `GRAHA_ABBR_EN` in English mode.** ([chart-utils.ts:202-260](web/lib/chart-utils.ts#L202)) The constant and the precedent both already exist. Ship a 9-item legend with it. *(B-016, B-017, A-019)*
2. **Replace the birth-place dataset with a real geocoder or a world-cities set.** ([tn-cities.ts](web/lib/tn-cities.ts)) This is a hard functional block for every non-diaspora user. *(B-006, B-007)*
3. **Guest chart modal: default the timezone from the browser; flag a missing birth time on the result.** ([dashboard-guest-chart-modal.tsx:66-70](web/components/dashboard-guest-chart-modal.tsx#L66-L70)) Shipping a silently wrong chart is worse than shipping none. *(B-008)*
4. **Rewrite the birth-time helper and link `/learn/why-birth-time-matters` from the field.** The article is already written. *(A-005, A-006, B-009)*
5. **Colocate the porutham de-escalation with the verdict.** "Dosham - Avoid" must never appear without the "guidance for conversation, not a gate" line and the named blocker in the same viewport. Add a baseline ("most families proceed at 5–8"). *(A-029, A-031, B-024)*
6. **Sade Sati card: always show duration and normalcy.** A red card naming a 7½-year Saturn period with no end date and no context is the app's worst anxiety surface for its primary audience. *(A-022)*
7. **Ask detail level at signup, not in Settings** — in plain terms, and map "heard the words, never studied it" to BEGINNER. *(A-039)*
8. **Promote the two-minute reading to the first post-calculation screen.** *(shared)*
9. **Fix the dead App Store link.** *(A-012)*

### TIER 2 — First month (S1 + remaining S2)

10. **Expand `GLOSSARY` from 20 to ~60 terms and wrap Today + Calendar in `GlossaryTerm`.** Highest comprehension-per-line-of-code in the whole report. Missing entries include: rahu kalam, yamagandam, kuligai, nalla neram, abhijit, horai, tithi, karana, vara, paksham, chandrashtama, karinaal, soolam, parigaram, naamyogam, amirdhadhi, lagna, pada, house, yoga, dosham, porutham, muhurta, vargottama, combust, retrograde, exalted, debilitated, peyarchi, sade sati. *(A-013, A-033, B-011, B-026)*
11. **Ship `/dashboard/glossary` as an index over the same object**, linked from nav and from each `GlossaryTerm`. *(A-041)*
12. **Wire `plainLangBiText` as the universal tooltip source in BALANCED mode** — delivering what `mode_balanced_desc` ("Some terms, with tooltips") already promises. *(A-042, B-021, B-031)*
13. **Write `/learn/vedic-vs-western`** and link it from the hero, the nav, and first dashboard load. Four sentences carry Jake through most of the app. *(B-001)*
14. **Decouple language from expertise.** An English-language user should get English planet names regardless of detail level. *(B-031)*
15. **Collapse the four parallel timing systems** into one recommendation plus a disclosure. *(A-013)*
16. **Rename "Nakshatram" in the daily ribbon** to distinguish the day's star from the birth star. *(A-014)*
17. **Disambiguate Yoga / House / Transit in English mode** on first use per screen. *(B-012, B-013, B-014)*
18. **Add a plain-English day summary line to the Calendar**, so the screen has value without the vocabulary. *(B-026)*
19. **Add cultural framing above porutham, muhurta, and remedies** — one paragraph each, reusing the shipped Learn articles. *(B-022, B-035, B-037)*

### TIER 3 — Over time (S3 + S4)

20. Rename "Family vault" → "Your family"; auto-create on first member. *(A-007)*
21. Collapse lat/lng behind a manual-entry disclosure. *(A-008)*
22. Move marital status / children / employment to a post-result prompt. *(A-010)*
23. Retitle chart-explanation sections by outcome, traditional term as subtitle. *(A-024)*
24. Deep-link every unexplained term into its Explore entry; rename the tab "Understand". *(A-026)*
25. Index interface vocabulary into Explore search. *(A-027)*
26. Four new Learn articles: what a dasa is, what a house is, what a lagnam is, what the daily score means. *(A-028)*
27. Lead yoga rows with the effect, name as subtitle. *(A-037)*
28. Populate `desc` on every nav item; lead English labels with function. *(B-004)*
29. Make "Tap to explain" a visible chip. *(A-025)*
30. Bilingualise and de-jargon the login left panel. *(A-004)*
31. Hide `Owner user ID` / `Birth profile ID` / `Chart ID` behind a technical disclosure. *(A-040)*
32. Surface the secular-remedy mode as a first-class choice. *(B-035)*
33. Person 1 / Person 2 labels outside MARRIAGE context. *(A-032)*

---

## DESIGN PATTERN RECOMMENDATIONS

### Progressive disclosure strategy

The app already has the right primitive and mis-scopes it. `AdvancedAstrologyGate` ([advanced-astrology-gate.tsx](web/components/advanced-astrology-gate.tsx)) folds experimental dasha systems behind "More advanced astrology (optional)" for BEGINNER users, with the excellent line *"none feed your daily score. For the curious reader only."* That pattern should govern far more of the surface than three comparison panels.

Proposed three-layer contract, applied per screen:

- **Layer 1 — always visible:** what this means for you today, in words with no tradition-specific vocabulary. Best window. Avoid window. One action. The score with its band word.
- **Layer 2 — one tap:** the named traditional concept and its one-line definition. This is where every term currently on Today and Calendar belongs.
- **Layer 3 — one more tap:** the calculation, the degrees, the doctrine, the competing systems. Never hidden, never first.

Doctrinal rigour lives entirely in Layer 3 and is not diluted by the existence of Layers 1 and 2. The current build collapses all three into one.

### Glossary / tooltip system design

`GlossaryTerm` is well built — click-to-reveal rather than hover (works on touch), closes on outside click, bilingual, `role="tooltip"`, `aria-expanded`. The problem is coverage: 20 entries, 7 call sites.

Recommendations:
- **Make the vocabulary list the contract.** Enumerate every tradition-specific term rendered anywhere in `web/`, and make an entry in `GLOSSARY` mandatory for each. A test that greps rendered strings against `GlossaryKey` would keep this from re-drifting — the same shape as the existing i18n and wrapper-parity guards.
- **First-occurrence-per-screen rule.** Don't dot-underline every instance; underline the first per screen and leave the rest clean.
- **Definitions must define, not restate.** The existing entries do this well (`gochar`: "Transit — where the planets are moving right now, compared against your birth chart"). Hold new entries to that bar; reject anything of the form "Rajju — the Rajju porutham".
- **Ship the index page.** A term someone half-remembers needs a destination.

### Emotional safety framework

The app already does three things right and should generalise them:
1. **"a day for awareness, not alarm"** (Chandrashtama chip)
2. **"guidance for conversation between families — not a gate"** (porutham footnote)
3. **"Protective Factors" placed before "Attention Note"** (dosham panel ordering)

Generalise into a rule: **no negative finding renders without four elements in the same viewport** —
- **Prevalence** — how common is this? ("Sade Sati reaches everyone roughly three times in a lifetime.")
- **Scope** — what it does and does not touch. ("This affects timing of career moves. It is not a health prediction.")
- **Duration** — when it ends, with a date.
- **Agency** — the one thing to do, linked.

Apply first to: Sade Sati / Ashtama Sani, Rajju dosha, Kala Sarpa, Mangal/Sevvai dosha, and any porutham verdict below the baseline. The `disclaimer_no_doom` promise — *"This app never uses fear, doom language, or guaranteed negative predictions"* — is currently kept at the sentence level and broken at the layout level, by red cards carrying untranslated nouns.

### Cultural bridging for non-Indian users

Do not de-Tamilise the product. The Tamil identity is the reason the primary audience trusts it, and diluting it would cost more than it gains. Bridge instead:

- **One orientation article** (`/learn/vedic-vs-western`), four claims: different zodiac calculation; rising sign over sun sign; 27 lunar stars as well as 12 signs; life runs in multi-year planetary periods.
- **Function-first labels, tradition-second** — everywhere, for English mode: "Compatibility (Porutham)", "Birth Stars (Natchathiram)", "Remedies (Pariharam)". The term survives; the door opens.
- **Describe practices, don't prescribe them.** "In this tradition, people with this placement visit…" rather than "Prescribed". The secular-remedy mode already exists and should be offered, not hidden.
- **Fix the mechanical exclusions first.** The city dataset and the Asia/Kolkata default are not cultural-sensitivity issues — they are bugs that happen to only affect outsiders, which is why they survived.

### "What this means for you" translation layer

The strongest asset in the codebase is the readings' discipline: **prose in the body, jargon quarantined in a labelled provenance line** ("what this rests on"). That is the pattern the rest of the app needs, and it is already proven here.

Adopt it as a house rule:

> Every card states its meaning in ordinary language first. The astrological basis appears below it, labelled as the basis, in smaller type. A card that names a technique without naming an outcome is not finished.

Concretely, the `Meaning → Why → Mechanics` law recorded in the Family & Charts humanization work is already the right rule; it is enforced on the Life Areas dosham/yoga panels and nowhere else. Extend it to: Today's ribbon strips, the Calendar day panel, the planet table, the Sani card, the porutham rows, and every dasha panel.

---

## APPENDIX — Verified absences

These were searched for and are not present in the tree. Each is a finding in its own right.

| Absent | Verification |
|---|---|
| Glossary page | `find web/app -ipath "*gloss*"` → empty |
| Help page | `find web/app -ipath "*help*"` → empty |
| FAQ page | `find web/app -ipath "*faq*"` → empty |
| Onboarding tour / coachmarks / spotlight | no component matching `coachmark\|walkthrough\|product-tour\|first-run\|spotlight` |
| Ayanamsa user setting | none in settings tabs — *correct call*, one less confusing control |
| `plainLang()` callers | zero, tree-wide |
| `plainLangBiText()` callers | zero, tree-wide |
| `GRAHA_ABBR_EN` in any dashboard chart | zero — only the marketing share card |
| "Western astrology" comparison content | one parenthetical, inside the ayanamsa paragraph |
| Glossary entries for Today/Calendar vocabulary | zero of ~28 terms present in `GLOSSARY` |

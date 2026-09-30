"""Copy registers for the bhava palan panel — conduct, why-lines, framing.

Split from `bhava_palan.py` so the logic stays readable: this file is tables.

**Conduct is keyed on the responsible graha, not on the band** (plan §5.3). Band-keyed
copy gives twelve interchangeable paragraphs; what a jyotishi actually varies is which
graha is doing the work. Saturn on the 7th asks for patience and an older partner; Mars
asks you not to decide in anger; Rahu asks you to verify what you were told. So the
register below is 9 grahas x 2 leans x 2 cautions, composed against the house's domain,
rather than 12 x 3 x 2 hand-written blocks.

**The fence every conduct line sits inside** (ruling Q6, 2026-09-28). Each line must be:

  - reader-controllable  — their own behaviour, never a third party's,
  - reversible           — never "leave", "sell", "refuse",
  - non-medical, non-legal, non-financially-specific,
  - phrased as "go slowly with", never "don't".

Allowed:  "involve a family elder before you agree."
Refused:  "postpone the wedding", "see a doctor about your stomach", "don't sign in July."

`tests/test_bhava_palan.py` sweeps every generated string through the tone validator.
"""
from __future__ import annotations

# ── Per-graha conduct register ──────────────────────────────────────────────────
#
# Same register whether the graha helps or strains the house: what changes is the
# framing sentence, not the advice. Jupiter supporting a house still carries
# Jupiter's shadow (promising more than you can carry), and saying so is more useful
# than an unqualified "this area is fine".
#
# (ta, en) pairs. Two leans and two cautions each — enough to be specific, few enough
# to read in one glance on a phone.
CONDUCT: dict[str, dict[str, list[tuple[str, str]]]] = {
    "SUN": {
        "lean_on": [
            ("நேரடியான, தெளிவான பேச்சு", "clear, direct speech"),
            ("பொறுப்பை வெளிப்படையாக ஏற்பது", "taking responsibility openly"),
        ],
        "go_slowly": [
            ("சரி என்று நிரூபிக்க வேண்டிய தேவை", "needing to be proved right"),
            ("மதிப்புக்காக எடுக்கும் முடிவு", "deciding to protect your standing"),
        ],
    },
    "MOON": {
        "lean_on": [
            ("சீரான தூக்கமும் அன்றாட ஒழுங்கும்", "steady sleep and a settled daily routine"),
            ("நம்பிக்கையான ஒருவரிடம் பேசிப் பார்ப்பது", "talking it through with someone you trust"),
        ],
        "go_slowly": [
            ("மனம் தளர்ந்த நேரத்தில் முடிவெடுப்பது", "deciding while your mood is low"),
            ("கடந்து போகும் உணர்வுக்கு அதிக பொருள் கொடுப்பது", "reading too much into a passing feeling"),
        ],
    },
    "MARS": {
        "lean_on": [
            ("உடல் உழைப்பு — அது அமைதியின்மையைக் கரைக்கும்", "physical work that burns off the restlessness"),
            ("ஒரே முறை, உறுதியாகச் செயல்படுவது", "acting once, decisively, instead of in bursts"),
        ],
        "go_slowly": [
            ("கோபத்தில் எதிர்கொள்வது", "taking anything up while you are angry"),
            ("அதே நாளில் சரி என்று சொல்வது", "saying yes the same day you are asked"),
        ],
    },
    "MERCURY": {
        "lean_on": [
            ("பேசுவதற்கு முன் எழுதிப் பார்ப்பது", "writing it down before you say it"),
            ("இன்னும் ஒரு கேள்வி கேட்பது", "asking one more question than feels necessary"),
        ],
        "go_slowly": [
            ("தேவைக்கு அதிகமாக விளக்குவது", "over-explaining yourself"),
            ("ஒரே வாரத்தில் திட்டத்தை மீண்டும் மாற்றுவது", "changing the plan twice in one week"),
        ],
    },
    "JUPITER": {
        "lean_on": [
            ("மூத்தவர் அல்லது ஆசிரியரின் பார்வை", "an elder's or a teacher's reading of it"),
            ("உங்களால் தாங்கக்கூடிய அளவு வள்ளன்மை", "generosity you can comfortably afford"),
        ],
        "go_slowly": [
            ("தாங்கக்கூடியதை விட அதிகம் வாக்களிப்பது", "promising more than you can carry"),
            ("தானே சரியாகிவிடும் என்று நம்புவது", "assuming it will work itself out"),
        ],
    },
    "VENUS": {
        "lean_on": [
            ("உங்களுக்கு எதுவும் செலவாகாத மரியாதை", "courtesy that costs you nothing"),
            ("இருக்கும் இடத்தை இனிமையாக வைத்திருப்பது", "keeping the space around you pleasant"),
        ],
        "go_slowly": [
            ("அமைதி காக்க கடினமான உரையாடலைத் தவிர்ப்பது", "avoiding a hard conversation to keep the peace"),
            ("ஆறுதலுக்காகச் செய்யும் செலவு", "spending for comfort"),
        ],
    },
    "SATURN": {
        "lean_on": [
            ("பொறுமை — சனியிடம் தாமதமே தீர்வு, தடை அல்ல", "patience — with Saturn, delay is the remedy, not the problem"),
            ("தினமும் தவறாமல் காக்கும் ஒரு சிறிய ஒழுங்கு", "one small routine kept every single day"),
        ],
        "go_slowly": [
            ("முடித்துவிட வேண்டும் என்ற அவசரம்", "rushing to get it finished"),
            ("உங்களுடையது அல்லாத சுமையை ஏற்பது", "taking on what is not yours to carry"),
        ],
    },
    "RAHU": {
        "lean_on": [
            ("சொல்லப்பட்டதை எழுத்தில் உறுதி செய்வது", "confirming in writing what you were told"),
            ("சம்மதிக்கும் முன் குடும்பப் பெரியவரை இணைப்பது", "involving a family elder before you agree"),
        ],
        "go_slowly": [
            ("இன்றே முடிவு வேண்டும் என்னும் வாய்ப்பு", "an opportunity that must be decided today"),
            ("இருப்பதை விட சிறப்பாகத் தோன்றுவது", "anything that looks better than it should"),
        ],
    },
    "KETU": {
        "lean_on": [
            ("நன்கு அறிந்த ஒன்றுக்குத் திரும்புவது", "returning to something you already know well"),
            ("தனியாக இருக்கும் அமைதியான நேரம்", "quiet time on your own"),
        ],
        "go_slowly": [
            ("இப்போதுதான் தொடங்கியதை விட்டுவிடுவது", "walking away from something you have only just begun"),
            ("இனி ஆர்வமில்லை என்று முடிவு கட்டுவது", "concluding that you no longer care"),
        ],
    },
}

# Mandhi/Gulika can own a house's signal in principle; it has no conduct register and
# should never be named as the responsible body in advice.
CONDUCT_FALLBACK: dict[str, list[tuple[str, str]]] = {
    "lean_on": [
        ("இந்தத் துறையில் நிதானமான, சீரான முயற்சி", "steady, unhurried effort in this area"),
        ("முடிவெடுக்கும் முன் ஒரு நாள் இடைவெளி", "a day's gap before you decide"),
    ],
    "go_slowly": [
        ("ஒரே நாளில் பெரிய மாற்றம் செய்வது", "making a large change in a single day"),
        ("ஒருவரின் கருத்தை மட்டும் நம்புவது", "relying on a single opinion"),
    ],
}


# ── House domain, for the framing sentence ──────────────────────────────────────
#
# "In matters of X" — the phrase the conduct is introduced with. Kept separate from
# HOUSE_LABEL (the chip) and from HOUSE_MEANING in the web bundle (the subtitle), so
# each reads naturally in its own slot rather than one string doing three jobs.
HOUSE_DOMAIN: dict[int, tuple[str, str]] = {
    1: ("உடல்நலம், தன்னம்பிக்கை, வாழ்க்கைத் திசை", "your health, confidence and sense of direction"),
    2: ("குடும்பம், சேமிப்பு, பேச்சு", "family, savings and the way you speak"),
    3: ("முயற்சி, உடன்பிறந்தோர், குறுகிய பயணம்", "your own initiative, siblings and short journeys"),
    4: ("வீடு, தாய், மன அமைதி", "home, mother and peace of mind"),
    5: ("கல்வி, குழந்தைகள், படைப்பாற்றல்", "learning, children and creative work"),
    6: ("போட்டி, கடன், அன்றாட ஒழுங்கு", "competition, debts and daily discipline"),
    7: ("திருமணம், வாழ்க்கைத் துணை, கூட்டாண்மை", "marriage, your partner and business partnerships"),
    8: ("ஆழமான மாற்றம், கூட்டு வளங்கள், ஆராய்ச்சி", "deep change, shared resources and research"),
    9: ("அதிர்ஷ்டம், தந்தை, உயர்கல்வி, நம்பிக்கை", "fortune, father, higher study and belief"),
    10: ("தொழில், பொறுப்பு, சமூக அங்கீகாரம்", "work, responsibility and public standing"),
    11: ("வருமானம், நண்பர்கள், தொடர்புகள்", "income, friends and the people you know"),
    12: ("ஓய்வு, வெளிநாடு, செலவு, ஆன்மிகம்", "rest, foreign links, outgoings and inner life"),
}


# ── Framing sentence per band ───────────────────────────────────────────────────
#
# "வலுவானது / Supported" never becomes a promise, and "கவனம் தேவை / Needs care" never
# becomes a refusal. The 7th is the house this feature will be judged on: a NEEDS_CARE
# 7th must read as "marry with care", never as "you should not marry".
FRAMING: dict[str, tuple[str, str]] = {
    "SUPPORTED": (
        "இந்தத் துறை உங்கள் ஜாதகத்தில் நல்ல ஆதரவு பெற்றுள்ளது. {domain} சார்ந்த விஷயங்களில் "
        "உங்கள் இயல்பான வலிமையை நம்பி செயல்படலாம்.",
        "This area has solid support in your chart. In matters of {domain}, you can act "
        "from your own natural strength.",
    ),
    "MIXED": (
        "இந்தத் துறை கலப்பான நிலையில் உள்ளது — சில ஆதரவுகளும் சில சவால்களும் உண்டு. "
        "{domain} சார்ந்த விஷயங்களில் நிதானம் பலன் தரும்.",
        "This area is mixed — some support, some strain. In matters of {domain}, a steady "
        "pace serves you better than a fast one.",
    ),
    "NEEDS_CARE": (
        "இந்தத் துறைக்குக் கூடுதல் கவனம் தேவை. இது தடை அல்ல — {domain} சார்ந்த விஷயங்களை "
        "அவசரப்படாமல், ஆலோசனையுடன் செய்வது நல்லது.",
        "This area asks for more care than the rest of your chart. That is not a closed "
        "door — it means matters of {domain} go better unhurried and well advised.",
    ),
}

# The top band for 6/8/12 is worded "quiet", so it needs its own framing: a low 6th is
# good news, and saying "supported" over a low number makes the reader distrust us.
FRAMING_QUIET: tuple[str, str] = (
    "இந்தத் துறை உங்கள் ஜாதகத்தில் அமைதியாக உள்ளது. {domain} சார்ந்த விஷயங்கள் "
    "பெரிய இடையூறு இல்லாமல் கடந்து செல்லும்.",
    "This area is quiet in your chart. Matters of {domain} tend to pass without making "
    "much trouble for you.",
)

# One line explaining the inversion, shown on 6/8/12 only. Without it a reader who has
# seen the other chips reads a green dot on a low house as a bug.
INVERSION_NOTE: tuple[str, str] = (
    "6, 8, 12 ஆகிய வீடுகள் தலைகீழாகப் படிக்கப்படுகின்றன: இவை அமைதியாக இருப்பதே "
    "நல்லது என்பது பராசர மரபின் பார்வை.",
    "Houses 6, 8 and 12 are read the other way round: in the Parashari line we follow, "
    "a quiet one of these favours you.",
)

# Shown on 3 and 11 — these genuinely improve with age and effort, and a reader who
# gets "needs care" on their 11th deserves to know it is the most movable of the twelve.
UPACHAYA_NOTE: tuple[str, str] = (
    "3, 11 ஆகியவை உபசய வீடுகள் — வயதும் தொடர் முயற்சியும் இவற்றை மேம்படுத்தும்.",
    "Houses 3 and 11 are upachaya houses — they improve with age and sustained effort "
    "more than any others.",
)


# ── Why the chart on screen disagrees with the why-line ─────────────────────────
#
# `render_why` says "Its lord Venus is strongly placed in house 7" whenever the lord's
# composite score clears 50. The reader reads that as a claim about DIGNITY — the one
# thing they can check against the chart drawn beside it. Those two are not the same
# claim, and a sweep found the gap is common rather than exotic. Forcing one graha into
# its debilitation sign across 4,000 charts: 3,384 of them (84.6%) still scored it >= 50,
# and of the 3,560 whose debilitation was cancelled, 3,184 (89.4%) did. Reproduce with
# `scripts/bhava_dignity_sweep.py`, which also records the sampling caveat — uniform
# random placements over-represent kendras, so these bound the SHAPE of the problem and
# not its rate in real charts. The reader sees a visibly neecha Venus under a sentence
# calling it strong, and stops believing the panel.
#
# So when the visible chart contradicts the sentence, the sentence states its ground.
# These are display notes on a number that is already decided — they change no score
# (ruling Q5: `compute_bhava_bala` feeds the live Life Areas number and is not moved
# for a reading panel).
#
# Placed after the lord sentence, so they read as its second clause. Only ever shown
# for a LORD verdict: D9 and dignity enter `bhava_bala` through the lord's score alone
# (Bhavadhipati Bala, 50%) — the occupant and drishti terms are keyed on benefic/malefic
# class and never see either.

# Debilitated in the Rasi, cancelled, and the Navamsa is one of the reasons why. This
# is the answer to "is the bhava reading D1 or D9": the frame is D1, and D9 reaches it
# here, through the lord.
BHANGA_VIA_D9: tuple[str, str] = (
    "ராசியில் இவர் நீசம் பெற்றிருந்தாலும் நவாம்சத்தில் வலிமையாக நிற்கிறார் — இது நீசபங்கம். "
    "அதனால் ராசிக் கட்டத்தில் தெரிவதை விட இந்த வீடு உறுதியாக உள்ளது.",
    "Though it sits in its sign of debilitation in the Rasi, it stands strong in the "
    "Navamsa — this is neecha bhanga. That is why this house reads better than the Rasi "
    "chart on its own suggests.",
)

# Cancelled by one of the three Rasi-side routes instead (the debilitation sign's lord
# or its exalter in a kendra, or the exaltation lord's drishti). Deliberately not
# spelled out further: naming the rule is what lets a reader ask their own astrologer.
BHANGA: tuple[str, str] = (
    "ராசியில் இவர் நீசம் பெற்றிருந்தாலும், ஜாதகத்தின் பிற அமைப்புகளால் அந்த நீசம் "
    "பங்கம் அடைகிறது — இது நீசபங்கம்.",
    "Though it sits in its sign of debilitation, other placements in the chart lift "
    "that debilitation — this is neecha bhanga.",
)

# Debilitated, NOT cancelled, and still carrying the house. Dignity is only 30% of the
# score's sthana term and the house it occupies is 40% of that term, so a neecha graha
# in a kendra genuinely can support a house. Saying which of the two is doing the work
# is the difference between a reading and an assertion.
DEBILITATED_BUT_PLACED: tuple[str, str] = (
    "ராசியில் இவர் நீசம் பெற்றவர்; இங்கு உதவுவது இவரது ராசிப் பலம் அல்ல, "
    "இவர் அமர்ந்துள்ள இடத்தின் பலம்.",
    "It does stand in its sign of debilitation — what carries this house is where it "
    "sits, not the sign it sits in.",
)

# The mirror case, and the one the D9 exists to catch: exalted in the Rasi, neecha in
# the Navamsa, scored down for it, and the reader sees an exalted graha above a
# "needs care" band. Charged double in the scorer (D9_DEBILITATION_PENALTY_EXALTED).
HOLLOW_EXALTATION: tuple[str, str] = (
    "ராசியில் இவர் உச்சம் பெற்றிருந்தாலும் நவாம்சத்தில் அந்த வலிமை உறுதிப்படவில்லை — "
    "உச்சம் பெயரளவில் நிற்பதால், பலன் தரும் நேரத்தில் அது முழுமையாகக் கிடைப்பதில்லை.",
    "It is exalted in the Rasi, but the Navamsa does not confirm that strength — "
    "exalted in name, and less so when the result is due.",
)

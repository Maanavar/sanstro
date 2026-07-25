"""What a planetary condition actually means for the person, in plain language.

The chart already flags retrograde, combustion, cazimi, vargottama and Navamsa
dignity, and the UI already renders badges for them. What was missing is the
translation: a badge reading "Combust" tells a reader who knows jyotisham
something and everyone else nothing.

The per-planet split matters. "Combust" is not one meaning — a combust Mercury
is a communication signal ("what you meant may not be what lands"), a combust
Venus is a relationship-and-comfort signal. Collapsing them into a single
generic sentence would be the same failure as the mechanism-only yoga
descriptions this layer exists to fix.

Framing rules:

- Describe a *tendency to work with*, never a verdict. Combustion is "give the
  message a second pass", not "you will be misunderstood".
- Retrograde is internalised/revisited, not "bad". Classical strength models
  actually award retrograde planets chesta bala, which the scorer here honours.
- Cazimi is a boost and must read as one.

TAMIL COPY STATUS: first-draft, author-written. Queued for the native-Tamil
review pass — not a substitute for it.
"""
from __future__ import annotations

# ── Combustion (asthangamam) ────────────────────────────────────────────────
# The planet is too close to the Sun to express itself freely. Sun is absent
# (it cannot be combust); the nodes are shadow bodies and are not read for
# combustion either.
COMBUST_MEANING: dict[str, tuple[str, str]] = {
    "MOON": (
        "மனநிலை வெளியே தெரியாமல் உள்ளுக்குள் இருக்கும்; "
        "உணர்வுகளை வார்த்தையாக்க கூடுதல் நேரம் தேவைப்படலாம்.",
        "Feelings tend to stay inward rather than show; you may need longer than others to put "
        "what you feel into words.",
    ),
    "MERCURY": (
        "நீங்கள் சொல்ல நினைத்ததற்கும் மற்றவர் புரிந்துகொள்வதற்கும் இடையே இடைவெளி வரலாம்; "
        "முக்கியமான செய்திகளை ஒருமுறை மீண்டும் படித்து அனுப்புவது நல்லது.",
        "What you mean and what the other person hears can drift apart; it pays to re-read an "
        "important message before sending it, and to confirm you were understood.",
    ),
    "VENUS": (
        "உறவுகளிலும் வசதிகளிலும் உங்கள் விருப்பம் வெளிப்படையாகச் சொல்லப்படாமல் போகலாம்; "
        "தேவையை நேரடியாகச் சொல்வது உதவும்.",
        "What you want from relationships and comfort can go unspoken; saying the need directly "
        "tends to work better than expecting it to be noticed.",
    ),
    "MARS": (
        "முனைப்பு வெளியே தெரியாமல் உள்ளே அழுத்தமாகத் தேங்கலாம்; "
        "உடல் உழைப்பு அல்லது தெளிவான இலக்கு அதற்கு வடிகால் தரும்.",
        "Drive can bank up inside instead of showing as action; physical exertion or a clearly "
        "defined target gives it somewhere to go.",
    ),
    "JUPITER": (
        "சொந்த நம்பிக்கையையும் தீர்ப்பையும் வெளிப்படையாக நிலைநாட்ட தயக்கம் இருக்கலாம்; "
        "நம்பகமான ஒருவரிடம் பேசி தெளிவு பெறுவது உதவும்.",
        "You may hold back from asserting your own judgement even when it is sound; talking it "
        "through with someone you trust helps it firm up.",
    ),
    "SATURN": (
        "கட்டமைப்பும் ஒழுங்கும் வெளியில் தெரியாமல் மெதுவாக உருவாகும்; "
        "விளைவுகள் தாமதமாக வந்தாலும் நிலைக்கும்.",
        "Structure and discipline build quietly rather than visibly; results arrive later than you "
        "would like and tend to hold once they do.",
    ),
}

# ── Retrograde (vakram) ─────────────────────────────────────────────────────
# Sun and Moon are never retrograde; Rahu/Ketu are always retrograde by nature,
# so the condition carries no signal for them and they are omitted here.
RETROGRADE_MEANING: dict[str, tuple[str, str]] = {
    "MERCURY": (
        "சிந்தனை உள்நோக்கிச் செல்லும்; முடிவெடுக்கும் முன் மீண்டும் ஆராயும் இயல்பு. "
        "திட்டங்களை மறுபரிசீலனை செய்வது இங்கே பலவீனம் அல்ல, பலம்.",
        "Thinking turns inward and doubles back before settling. Revisiting a plan is a strength "
        "in this placement rather than indecision.",
    ),
    "VENUS": (
        "உறவுகளிலும் ரசனையிலும் பழையவை மீண்டும் வரும்; "
        "மதிப்புகளை மறுபரிசீலனை செய்யும் காலகட்டங்கள் இயல்பு.",
        "Old connections and old tastes tend to resurface; periods of re-examining what you "
        "actually value are part of how this placement works.",
    ),
    "MARS": (
        "செயல்படும் முன் யோசிக்கும் இயல்பு; வெளிப்படையான மோதலைத் தவிர்த்து "
        "மறைமுகமாக முயற்சி தொடரும்.",
        "Action comes after deliberation rather than before it; effort tends to continue "
        "indirectly instead of through open confrontation.",
    ),
    "JUPITER": (
        "நம்பிக்கைகளையும் வழிகாட்டுதலையும் சொந்தமாக ஆராய்ந்து ஏற்கும் இயல்பு; "
        "பாரம்பரியத்தை கேள்வியின்றி ஏற்காத மனம்.",
        "Belief and guidance get examined before they are accepted; inherited tradition is not "
        "taken on trust here.",
    ),
    "SATURN": (
        "பொறுப்புகளை உள்ளுக்குள் எடைபோடும் இயல்பு; "
        "வெளியில் தெரியாத ஒழுக்கம் நீண்ட காலத்தில் பலன் தரும்.",
        "Responsibility is weighed internally; a discipline others do not see is what pays off "
        "over the long run.",
    ),
}

# ── Generic condition notes ─────────────────────────────────────────────────
CAZIMI_MEANING: tuple[str, str] = (
    "இந்தக் கிரகம் சூரியனின் இதயத்தில் (கசிமி) உள்ளது — அஸ்தங்க தோஷம் நீங்கி, "
    "மாறாக பலம் பெற்றதாகக் கணிக்கப்படுகிறது.",
    "This planet sits in the heart of the Sun (cazimi): the usual combustion penalty is lifted and "
    "it is read as strengthened, not weakened.",
)

VARGOTTAMA_MEANING: tuple[str, str] = (
    "ராசியிலும் நவாம்சத்திலும் ஒரே ராசி (வர்கோத்தமம்) — இந்தக் கிரகத்தின் பலன் "
    "நிலையானது, சூழ்நிலைக்கேற்ப அதிகம் மாறாது.",
    "The same sign in both the Rasi and the Navamsa (vargottama) — this planet's results are "
    "steady, and shift less with circumstance than the rest of the chart.",
)

D9_DEBILITATED_MEANING: tuple[str, str] = (
    "ராசியில் நன்றாக அமைந்திருந்தாலும் நவாம்சத்தில் நீசம் — வெளியில் தெரியும் "
    "வாக்குறுதிக்கும் உண்மையான பலனுக்கும் இடையே இடைவெளி இருக்கலாம்; "
    "இந்தத் துறையில் தொடர்ச்சியான முயற்சி தேவை.",
    "Placed well in the Rasi but debilitated in the Navamsa — the outward promise of this planet "
    "can outrun what it actually delivers, so its area rewards sustained effort over assumption.",
)

D9_DIGNIFIED_MEANING: tuple[str, str] = (
    "நவாம்சத்தில் வலுவாக உள்ளது — ராசியில் தெரியும் பலனை நவாம்சம் உறுதிப்படுத்துகிறது.",
    "Strong in the Navamsa — the D9 chart backs up what the Rasi chart promises here, which is the "
    "more reliable of the two signals.",
)


# ── Minor-safe variants ─────────────────────────────────────────────────────
# The tables above are written in adult second person and assume the reader has
# messages to send, a partner to speak to, and responsibilities to weigh. Served
# unchanged on a child's chart they are not just tonally off — they address
# someone who does not exist yet, and an eight-month-old's reading advised her
# to re-read important messages before sending them.
#
# These say the SAME astrological thing about the graha, described as a
# developmental tendency a parent can recognise and support. Nothing is softened
# or withheld; only the recipient changes.
#
# TAMIL COPY STATUS: author-written first draft, same as the adult tables above.
# Queued for the native-Tamil review pass.
COMBUST_MEANING_MINOR: dict[str, tuple[str, str]] = {
    "MOON": (
        "உணர்வுகளை வெளிக்காட்டாமல் உள்ளுக்குள் வைத்திருக்கும் இயல்பு; "
        "என்ன உணர்கிறார் என்பதைச் சொல்ல அமைதியான நேரமும் பொறுமையும் உதவும்.",
        "Feelings tend to stay inside rather than show. Unhurried, quiet attention helps this "
        "child put what they feel into words.",
    ),
    "MERCURY": (
        "சொல்ல நினைப்பதற்கும் வெளிப்படுத்துவதற்கும் இடையே இடைவெளி இருக்கலாம்; "
        "பேச்சு அல்லது கற்றல் சற்று தாமதமாகத் தெளிவடையலாம் — அவசரப்படுத்தாமல் இருப்பது நல்லது.",
        "There can be a gap between what this child means and what comes out. Speech or "
        "learning may take its own time to settle — steady practice serves better than pressure.",
    ),
    "VENUS": (
        "தனக்கு என்ன பிடிக்கும் என்பதை வெளிப்படையாகக் கேட்காத இயல்பு; "
        "விருப்பங்களைக் கேட்டறிவது அவரது ரசனை வளர உதவும்.",
        "This child may not readily say what they like or want. Asking, rather than waiting to "
        "be told, helps their own taste and preferences develop.",
    ),
    "MARS": (
        "ஆற்றல் வெளியே தெரியாமல் உள்ளே தேங்கலாம்; "
        "விளையாட்டு அல்லது உடல் இயக்கம் அதற்கு நல்ல வடிகால்.",
        "Energy can bank up inside instead of coming out as activity. Play and physical movement "
        "give it somewhere useful to go.",
    ),
    "JUPITER": (
        "தன் கருத்தை முன்வைக்கத் தயங்கும் இயல்பு; "
        "அவரது கேள்விகளை மதிப்பது தன்னம்பிக்கையை வளர்க்கும்.",
        "This child may hold back their own view even when it is sound. Taking their questions "
        "seriously is what builds the confidence to voice it.",
    ),
    "SATURN": (
        "ஒழுங்கும் திறனும் மெதுவாக, வெளியில் தெரியாமல் உருவாகும்; "
        "பிற குழந்தைகளுடன் ஒப்பிடாமல் அவரவர் வேகத்தை மதிப்பது நல்லது.",
        "Structure and capability build slowly and quietly here. Comparison with other children "
        "misreads it — this pace is the placement working normally, not a delay.",
    ),
}

RETROGRADE_MEANING_MINOR: dict[str, tuple[str, str]] = {
    "MERCURY": (
        "யோசித்து, மீண்டும் ஆராய்ந்து முடிவெடுக்கும் இயல்பு; "
        "உடனடி பதில் வராதது புரியாமை அல்ல — அது இந்த அமைப்பின் இயல்பு.",
        "Thinking doubles back before it settles. A slow answer here is not a gap in "
        "understanding; it is how this placement processes.",
    ),
    "VENUS": (
        "பழகிய பொருட்கள், பழகிய நபர்களிடம் திரும்பத் திரும்பச் செல்லும் இயல்பு; "
        "மாற்றங்களுக்கு சற்று நேரம் தேவைப்படும்.",
        "A pull back towards familiar things and familiar people. Changes of setting or routine "
        "need a little more time here than usual.",
    ),
    "MARS": (
        "செயல்படும் முன் யோசிக்கும் இயல்பு; வெளிப்படையான மோதலைத் தவிர்க்கும் குழந்தை.",
        "Action comes after thinking rather than before it. This child tends to avoid open "
        "confrontation rather than meet it.",
    ),
    "JUPITER": (
        "சொல்லப்படுவதை அப்படியே ஏற்காமல் கேள்வி கேட்கும் இயல்பு; "
        "இது மரியாதைக் குறைவு அல்ல, சொந்தமாக ஆராயும் மனம்.",
        "What they are told gets questioned before it is accepted. This is not defiance — it is "
        "a mind that needs to work things out for itself.",
    ),
    "SATURN": (
        "பொறுப்பை உள்ளுக்குள் எடைபோடும் இயல்பு; "
        "வெளியில் தெரியாத ஒழுக்கம் நாளடைவில் பலன் தரும்.",
        "Responsibility gets weighed internally. A discipline that others do not see is what "
        "pays off here over time.",
    ),
}


def combust_meaning(graha: str, *, minor: bool = False) -> tuple[str, str]:
    """Practical meaning of combustion for a specific graha, ("", "") if none.

    ``minor`` selects the developmental phrasing addressed to a parent. It
    changes the recipient, never the astrological claim.
    """
    table = COMBUST_MEANING_MINOR if minor else COMBUST_MEANING
    return table.get(graha, ("", ""))


def retrograde_meaning(graha: str, *, minor: bool = False) -> tuple[str, str]:
    """Practical meaning of retrogression for a specific graha, ("", "") if none.

    Rahu and Ketu are perpetually retrograde, so the flag distinguishes nothing
    for them and they intentionally have no entry.
    """
    table = RETROGRADE_MEANING_MINOR if minor else RETROGRADE_MEANING
    return table.get(graha, ("", ""))

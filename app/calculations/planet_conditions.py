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
        "மனதில் இருப்பது வெளியே தெரியாது; உணர்வுகளை வார்த்தையில் சொல்ல உங்களுக்குக் கொஞ்சம் கூடுதல் நேரம் தேவைப்படலாம்.",
        "Feelings tend to stay inward rather than show; you may need longer than others to put "
        "what you feel into words.",
    ),
    "MERCURY": (
        "நீங்கள் சொல்ல நினைத்ததும் மற்றவர் புரிந்துகொள்வதும் வேறாக இருக்கலாம்; முக்கியமான செய்திகளை அனுப்பும் முன் ஒருமுறை படித்துப் பார்ப்பது நல்லது.",
        "What you mean and what the other person hears can drift apart; it pays to re-read an "
        "important message before sending it, and to confirm you were understood.",
    ),
    "VENUS": (
        "உறவுகளிலும் வசதிகளிலும் உங்களுக்கு என்ன வேண்டும் என்பதை நீங்கள் வெளிப்படையாகச் சொல்லாமல் விடலாம்; தேவையை நேரடியாகச் சொல்வது உதவும்.",
        "What you want from relationships and comfort can go unspoken; saying the need directly "
        "tends to work better than expecting it to be noticed.",
    ),
    "MARS": (
        "முனைப்பு வெளியே தெரியாமல் உள்ளுக்குள் தேங்கலாம்; உடல் உழைப்போ தெளிவான இலக்கோ இருந்தால் அதற்கு ஒரு வழி கிடைக்கும்.",
        "Drive can bank up inside instead of showing as action; physical exertion or a clearly "
        "defined target gives it somewhere to go.",
    ),
    "JUPITER": (
        "உங்கள் நம்பிக்கையையும் கருத்தையும் வெளிப்படையாகச் சொல்லத் தயக்கம் இருக்கலாம்; நம்பகமான ஒருவரிடம் பேசினால் தெளிவு கிடைக்கும்.",
        "You may hold back from asserting your own judgement even when it is sound; talking it "
        "through with someone you trust helps it firm up.",
    ),
    "SATURN": (
        "ஒழுங்கும் அமைப்பும் வெளியே தெரியாமல் மெதுவாக உருவாகும்; பலன் தாமதமாக வந்தாலும் நிலைக்கும்.",
        "Structure and discipline build quietly rather than visibly; results arrive later than you "
        "would like and tend to hold once they do.",
    ),
}

# ── Retrograde (vakram) ─────────────────────────────────────────────────────
# Sun and Moon are never retrograde; Rahu/Ketu are always retrograde by nature,
# so the condition carries no signal for them and they are omitted here.
RETROGRADE_MEANING: dict[str, tuple[str, str]] = {
    "MERCURY": (
        "எதையும் உள்ளுக்குள் யோசிப்பீர்கள்; முடிவெடுக்கும் முன் மீண்டும் ஒருமுறை ஆராய்வீர்கள். திட்டத்தை மறுபடி பார்ப்பது இங்கே பலவீனம் அல்ல, பலம்.",
        "Thinking turns inward and doubles back before settling. Revisiting a plan is a strength "
        "in this placement rather than indecision.",
    ),
    "VENUS": (
        "உறவுகளிலும் ரசனையிலும் பழையவை மீண்டும் வரும்; எது உண்மையில் முக்கியம் என்று அவ்வப்போது மறுபடி யோசிப்பது உங்கள் இயல்பு.",
        "Old connections and old tastes tend to resurface; periods of re-examining what you "
        "actually value are part of how this placement works.",
    ),
    "MARS": (
        "செயலில் இறங்கும் முன் யோசிக்கும் இயல்பு; நேரடி மோதலைத் தவிர்த்து, வேறு வழியில் முயற்சியைத் தொடர்வீர்கள்.",
        "Action comes after deliberation rather than before it; effort tends to continue "
        "indirectly instead of through open confrontation.",
    ),
    "JUPITER": (
        "நம்பிக்கைகளையும் அறிவுரைகளையும் நீங்களாக ஆராய்ந்த பிறகே ஏற்றுக்கொள்வீர்கள்; பாரம்பரியம் என்பதற்காக மட்டும் ஏற்கும் மனம் அல்ல.",
        "Belief and guidance get examined before they are accepted; inherited tradition is not "
        "taken on trust here.",
    ),
    "SATURN": (
        "பொறுப்புகளை உள்ளுக்குள் எடைபோடும் இயல்பு; வெளியே தெரியாத உங்கள் ஒழுக்கம் நீண்ட காலத்தில் பலன் தரும்.",
        "Responsibility is weighed internally; a discipline others do not see is what pays off "
        "over the long run.",
    ),
}

# ── Generic condition notes ─────────────────────────────────────────────────
CAZIMI_MEANING: tuple[str, str] = (
    "இந்தக் கிரகம் சூரியனுக்கு மிக அருகில், அதன் இதயப் பகுதியில் (கசிமி) இருக்கிறது. அதனால் அஸ்தங்க தோஷம் நீங்கி, இது பலம் பெற்றதாகவே கணிக்கப்படுகிறது.",
    "This planet sits in the heart of the Sun (cazimi): the usual combustion penalty is lifted and "
    "it is read as strengthened, not weakened.",
)

VARGOTTAMA_MEANING: tuple[str, str] = (
    "ராசியிலும் நவாம்சத்திலும் ஒரே ராசி (வர்கோத்தமம்). இந்தக் கிரகத்தின் பலன் நிலையாக இருக்கும்; சூழ்நிலைக்கு ஏற்ப அதிகம் மாறாது.",
    "The same sign in both the Rasi and the Navamsa (vargottama) — this planet's results are "
    "steady, and shift less with circumstance than the rest of the chart.",
)

D9_DEBILITATED_MEANING: tuple[str, str] = (
    "ராசியில் நன்றாக இருந்தாலும் நவாம்சத்தில் நீசம். வெளியே தெரியும் வாக்குறுதி அளவுக்குப் பலன் கிடைக்காமல் போகலாம்; இந்தத் துறையில் தொடர்ந்து முயற்சி செய்வது நல்லது.",
    "Placed well in the Rasi but debilitated in the Navamsa — the outward promise of this planet "
    "can outrun what it actually delivers, so its area rewards sustained effort over assumption.",
)

# Vargottama in the debilitation sign: neecha in the Rasi AND the Navamsa. Said
# beside VARGOTTAMA_MEANING, never instead of it — ruling 2026-10-01 keeps the
# two facts separate, and the scorer charges both rows. D9_DEBILITATED_MEANING
# opens "placed well in the Rasi", which is false for this graha.
VARGOTTAMA_NEECHA_MEANING: tuple[str, str] = (
    "ஆனால் அந்த ராசி இதன் நீச ராசி. வர்கோத்தமம் நிலைத்தன்மையைத் தரும், நீசத்தை நீக்காது. நவாம்ச நீசம் தனியாகவே கணக்கில் கொள்ளப்படுகிறது.",
    "But that sign is its debilitation sign, so it is debilitated in both charts. Vargottama "
    "makes the placement consistent; it does not lift the debility, which is counted on its own.",
)

D9_DIGNIFIED_MEANING: tuple[str, str] = (
    "நவாம்சத்தில் வலுவாக உள்ளது. ராசியில் தெரியும் பலனை நவாம்சம் உறுதி செய்கிறது.",
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
        "உணர்வுகளை வெளியே காட்டாமல் உள்ளுக்குள் வைத்திருப்பார்; அமைதியாக, பொறுமையாகக் கேட்டால் என்ன உணர்கிறார் என்பதைச் சொல்வார்.",
        "Feelings tend to stay inside rather than show. Unhurried, quiet attention helps this "
        "child put what they feel into words.",
    ),
    "MERCURY": (
        "சொல்ல நினைப்பதும் வெளியே வருவதும் வேறாக இருக்கலாம்; பேச்சோ படிப்போ கொஞ்சம் தாமதமாகத் தெளிவாகலாம். அவசரப்படுத்தாமல் இருப்பது நல்லது.",
        "There can be a gap between what this child means and what comes out. Speech or "
        "learning may take its own time to settle — steady practice serves better than pressure.",
    ),
    "VENUS": (
        "தனக்கு என்ன பிடிக்கும் என்பதை வெளிப்படையாகக் கேட்க மாட்டார்; நீங்களே கேட்டுத் தெரிந்துகொண்டால் அவருடைய ரசனை வளரும்.",
        "This child may not readily say what they like or want. Asking, rather than waiting to "
        "be told, helps their own taste and preferences develop.",
    ),
    "MARS": (
        "சக்தி வெளியே தெரியாமல் உள்ளுக்குள் தேங்கலாம்; விளையாட்டும் உடல் இயக்கமும் அதற்கு நல்ல வழி.",
        "Energy can bank up inside instead of coming out as activity. Play and physical movement "
        "give it somewhere useful to go.",
    ),
    "JUPITER": (
        "தன் கருத்தைச் சொல்லத் தயங்குவார்; அவருடைய கேள்விகளை மதித்தால் தன்னம்பிக்கை வளரும்.",
        "This child may hold back their own view even when it is sound. Taking their questions "
        "seriously is what builds the confidence to voice it.",
    ),
    "SATURN": (
        "ஒழுங்கும் திறனும் வெளியே தெரியாமல் மெதுவாக உருவாகும்; மற்ற குழந்தைகளோடு ஒப்பிடாமல் அவருடைய வேகத்தை மதிப்பது நல்லது.",
        "Structure and capability build slowly and quietly here. Comparison with other children "
        "misreads it — this pace is the placement working normally, not a delay.",
    ),
}

RETROGRADE_MEANING_MINOR: dict[str, tuple[str, str]] = {
    "MERCURY": (
        "யோசித்து, மறுபடி ஆராய்ந்து முடிவெடுப்பார்; உடனே பதில் வரவில்லை என்றால் புரியவில்லை என்று அர்த்தம் அல்ல. இது அவருடைய இயல்பு.",
        "Thinking doubles back before it settles. A slow answer here is not a gap in "
        "understanding; it is how this placement processes.",
    ),
    "VENUS": (
        "பழகிய பொருட்களிடமும் பழகிய மனிதர்களிடமும் திரும்பத் திரும்பப் போவார்; மாற்றங்களுக்குப் பழக அவருக்குக் கொஞ்சம் நேரம் தேவைப்படும்.",
        "A pull back towards familiar things and familiar people. Changes of setting or routine "
        "need a little more time here than usual.",
    ),
    "MARS": (
        "செயலில் இறங்கும் முன் யோசிப்பார்; நேரடி மோதலைத் தவிர்க்கும் குழந்தை.",
        "Action comes after thinking rather than before it. This child tends to avoid open "
        "confrontation rather than meet it.",
    ),
    "JUPITER": (
        "சொல்வதை அப்படியே ஏற்காமல் கேள்வி கேட்பார்; இது மரியாதைக் குறைவு அல்ல, தானாக யோசிக்கும் மனம்.",
        "What they are told gets questioned before it is accepted. This is not defiance — it is "
        "a mind that needs to work things out for itself.",
    ),
    "SATURN": (
        "பொறுப்பை உள்ளுக்குள் எடைபோடும் இயல்பு; வெளியே தெரியாத அவருடைய ஒழுக்கம் நாளடைவில் பலன் தரும்.",
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

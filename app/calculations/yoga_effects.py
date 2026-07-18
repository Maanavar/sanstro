"""Plain-language "so what" for every yoga the engine can detect.

The detectors already carry a ``description_*`` field, but that field states the
*mechanism* — "Amala Yoga — benefics in the 10th from Lagna or Moon" — which
tells a reader who already knows jyotisham nothing new, and tells everyone else
nothing at all. Several yogas were worse than that: ``SUNAPHA_YOGA`` shipped the
literal string "Sunapha Yoga.".

This module is the missing half: what the yoga is traditionally held to *do*,
in one sentence a person can act on. Mechanism stays in ``description_*``;
effect lives here. The two are rendered as separate lines, never merged.

Tone rules (same as the rest of the prose layer):

- Traditional attributions are framed as traditional ("classically linked
  to..."), never as a promise about this person's life.
- No guarantees, no fear. A challenging yoga names the demand it makes and
  what tends to answer it — it does not predict misfortune.
- One sentence. If it needs two, the mechanism belongs in ``description_*``.

Coverage is enforced by ``tests/test_yoga_effects.py``, which walks every yoga
code the detectors can emit and fails if one has no entry here — so a newly
added yoga cannot silently ship with a name, a score, and no meaning.

TAMIL COPY STATUS: first-draft, author-written. Queued for the native-Tamil
review pass alongside the other recent ``ta`` additions — not a substitute for
it.
"""
from __future__ import annotations

# code -> (ta, en). One sentence each.
YOGA_EFFECT: dict[str, tuple[str, str]] = {
    # ── Benefic / supportive ────────────────────────────────────────────────
    "GAJA_KESARI_YOGA": (
        "மனத் தெளிவு, பேச்சாற்றல், பொது மதிப்பு ஆகியவற்றுடன் பாரம்பரியமாக இணைக்கப்படுகிறது; "
        "நெருக்கடியான நேரங்களில் அமைதி காக்கும் திறன் இதன் நடைமுறை வடிவம்.",
        "Classically linked to mental clarity, articulate speech, and public regard; in practice it "
        "tends to show up as composure when a situation turns difficult.",
    ),
    "RAJA_YOGA": (
        "பொறுப்பு, முன்னேற்றம், அங்கீகாரம் ஆகியவற்றுடன் இணைக்கப்படுகிறது; "
        "பொறுப்பை ஏற்கும்போது வாய்ப்புகள் திறக்கும் அமைப்பு.",
        "Linked to advancement, responsibility, and recognition; the pattern typically opens doors "
        "when you step toward responsibility rather than wait to be offered it.",
    ),
    "DHANA_YOGA": (
        "வருமானமும் சேமிப்பும் திட்டமிட்ட முயற்சியால் வளரும் என்று சுட்டுகிறது; "
        "திடீர் ஆதாயம் அல்ல, தொடர்ச்சியான கட்டமைப்பு.",
        "Points to income and savings growing through planned effort — it describes steady "
        "accumulation, not sudden windfall.",
    ),
    "NEECHA_BHANGA_RAJA_YOGA": (
        "ஆரம்பச் சவால்கள் காலப்போக்கில் பலமாக மாறும் அமைப்பு; "
        "முன்பு தடையாக இருந்த துறையே பின்னர் பலமாகலாம்.",
        "Describes early difficulty converting into later strength — the area that felt like a "
        "handicap often becomes the one you are known for.",
    ),
    "BUDHA_ADITYA_YOGA": (
        "நுண்ணறிவு, கற்கும் வேகம், தெளிவான தொடர்பு ஆகியவற்றுடன் இணைக்கப்படுகிறது; "
        "கருத்தை விளக்கிச் சொல்லும் திறன்.",
        "Linked to intelligence, quick learning, and clear communication — particularly the ability "
        "to explain an idea so others follow it.",
    ),
    "VIPAREETHA_RAJA_YOGA": (
        "பிறர் பின்வாங்கும் கடினமான சூழல்களில் இருந்தே முன்னேற்றம் வரும் அமைப்பு; "
        "நெருக்கடி மேலாண்மை இதன் பலம்.",
        "Describes gain arriving through the difficult situations others step back from — crisis "
        "handling is where this pattern does its work.",
    ),
    "PARIVARTANA_YOGA": (
        "இரு வாழ்க்கைத் துறைகள் ஒன்றையொன்று சார்ந்து இயங்கும்; "
        "ஒன்றில் ஏற்படும் முன்னேற்றம் மற்றொன்றிலும் எதிரொலிக்கும்.",
        "Ties two areas of life together so they move as one — progress in either tends to show up "
        "in the other.",
    ),
    "CHANDRA_MANGALA_YOGA": (
        "செயல்திறனும் முனைப்பும் சேர்ந்த அமைப்பு; வணிக நோக்கு, முன்முயற்சி ஆகியவற்றுடன் இணைக்கப்படுகிறது.",
        "Combines drive with initiative; classically associated with commercial instinct and a "
        "willingness to act before conditions are perfect.",
    ),
    "AMALA_YOGA": (
        "நல்ல பெயரும் தூய்மையான தொழில் நடத்தையும் சுட்டும் அமைப்பு; "
        "நேர்மையால் கிடைக்கும் மதிப்பு நீடிக்கும்.",
        "Points to a clean professional reputation — regard earned through straight dealing, which "
        "tends to outlast the roles themselves.",
    ),
    "ADHI_YOGA": (
        "நிலைத்த ஆதரவும் அமைதியான தலைமையும் சுட்டுகிறது; "
        "எதிர்ப்பை மோதலின்றி கடக்கும் திறன்.",
        "Indicates steady support and a quiet form of leadership — the capacity to get past "
        "opposition without turning it into conflict.",
    ),
    "LAKSHMI_YOGA": (
        "வளமையும் நல்ல பெயரும் சேர்ந்து வரும் அமைப்பு; உறவுகள் வழியாக வாய்ப்புகள் திறக்கும்.",
        "Associated with prosperity paired with good standing — opportunity arriving through people "
        "who think well of you.",
    ),
    "VASUMATI_YOGA": (
        "சொந்த முயற்சியால் வளம் சேரும் அமைப்பு; பிறரைச் சார்ந்திராத நிதி நிலை.",
        "Describes resources built by your own effort — a financial position that does not depend on "
        "someone else's decision.",
    ),
    # Pancha Mahapurusha — the five "great person" yogas.
    "RUCHAKA_YOGA": (
        "தைரியம், தலைமை, உடல் வலிமை ஆகியவற்றுடன் இணைக்கப்படுகிறது; "
        "நேரடியான, துணிவான அணுகுமுறை.",
        "Linked to courage, leadership, and physical vigour — a direct approach that does not shy "
        "from confrontation.",
    ),
    "BHADRA_YOGA": (
        "அறிவுக்கூர்மை, பேச்சுத்திறன், வணிக நுட்பம் ஆகியவற்றுடன் இணைக்கப்படுகிறது.",
        "Linked to sharp intellect, skill with words, and a good instinct for negotiation.",
    ),
    "HAMSA_YOGA": (
        "ஞானம், நேர்மை, மற்றவர்கள் ஆலோசனை கேட்கும் தன்மை ஆகியவற்றுடன் இணைக்கப்படுகிறது.",
        "Linked to wisdom and integrity — the kind of standing that makes people bring you their "
        "decisions.",
    ),
    "MALAVYA_YOGA": (
        "கலை ரசனை, வசதி, உறவுகளில் இனிமை ஆகியவற்றுடன் இணைக்கப்படுகிறது.",
        "Linked to refinement, comfort, and ease in relationships — an eye for beauty and for what "
        "makes people comfortable.",
    ),
    "SASA_YOGA": (
        "பொறுமையால் கட்டப்படும் அதிகாரம்; காலம் எடுத்தாலும் நிலைக்கும் அமைப்பு.",
        "Describes authority built slowly through discipline — it takes longer to arrive and tends "
        "to hold once it does.",
    ),
    "SUNAPHA_YOGA": (
        "சொந்த உழைப்பால் வரும் வளமும் தன்னிறைவும் சுட்டுகிறது.",
        "Points to self-earned resources and a degree of financial self-sufficiency.",
    ),
    "ANAPHA_YOGA": (
        "நல்ல உடல்நலம், அமைதியான மனநிலை, சுதந்திரமான இயல்பு ஆகியவற்றுடன் இணைக்கப்படுகிறது.",
        "Linked to wellbeing, an even temperament, and comfort with your own company.",
    ),
    "DURUDHURA_YOGA": (
        "இருபுறமும் ஆதரவு உள்ள அமைப்பு; வளமும் தாராள மனப்பான்மையும் சேர்ந்து வரும்.",
        "Support on both sides of the Moon — associated with resources and with a tendency to share "
        "them.",
    ),
    "SHUBHA_KARTARI_YOGA": (
        "சுபக்கிரகங்களின் பாதுகாப்பு வளையம்; கடினமான காலங்களில் உதவி எதிர்பாராமல் வரும்.",
        "A protective enclosure by benefics — help tends to arrive in hard periods from directions "
        "you were not counting on.",
    ),
    # ── Demanding / cautionary ──────────────────────────────────────────────
    # Framed as a demand and its answer, never as a prediction of misfortune.
    "SAKATA_YOGA": (
        "வாழ்க்கை ஏற்ற இறக்கமாக நகரும் அமைப்பு; "
        "நல்ல காலங்களில் சேமிப்பதே இதற்கான பாரம்பரிய பதில்.",
        "Describes fortunes that rise and fall in cycles rather than climbing steadily; the "
        "traditional answer is to build reserves during the good stretches.",
    ),
    "KEMADRUMA_YOGA": (
        "உணர்வு ரீதியான தனிமையைச் சுட்டும் அமைப்பு; "
        "வேண்டுமென்றே பேணப்படும் நட்பும் தொடர்பும் இதை நேரடியாக மாற்றும்.",
        "Points to stretches of emotional isolation; deliberately maintained friendships and "
        "community are what classical sources offer as the direct counterweight.",
    ),
    "CHANDALA_YOGA": (
        "வழிகாட்டுதலுக்கும் சொந்த நம்பிக்கைக்கும் இடையே ஏற்படும் இழுபறி; "
        "நம்பிக்கைகளைச் சொந்தமாக ஆய்ந்து தெளிவது இதன் வளர்ச்சிப் பாதை.",
        "Sets up tension between inherited guidance and your own conviction; examining what you "
        "believe rather than inheriting it is where this pattern matures.",
    ),
    "DARIDRA_YOGA": (
        "வருமான வழிகளில் அழுத்தம் இருக்கும் அமைப்பு; "
        "பல வருமான ஆதாரங்களும் கவனமான செலவுத் திட்டமும் தேவை.",
        "Indicates pressure on income channels; diversified earnings and deliberate spending "
        "discipline are what this asks for.",
    ),
    "PAPA_KARTARI_YOGA": (
        "இரு பக்கமும் அழுத்தம் தரும் அமைப்பு; "
        "அவசரப்படாமல், ஒரு விஷயத்தை ஒரு நேரத்தில் அணுகுவது நல்லது.",
        "Describes pressure arriving from two sides at once; the workable response is to take one "
        "matter at a time rather than force a single decisive move.",
    ),
    "KARTARI_YOGA": (
        "கலவையான தாக்கங்களுக்கு இடையே அமைந்த நிலை; "
        "சூழலுக்கேற்ப முடிவுகள் மாறுபடும்.",
        "A mixed enclosure — surrounding influences pull in different directions, so outcomes here "
        "depend more than usual on context.",
    ),
    "KALASARPA": (
        "வாழ்க்கை ஆற்றல் குறிப்பிட்ட துறைகளில் குவியும் அமைப்பு; "
        "சில காலகட்டங்கள் தீவிரமாக உணரப்படும், ஆனால் அதே குவிப்பே ஆழத்தையும் தரும்.",
        "Concentrates life energy into particular areas; some phases feel intense, though that same "
        "concentration is what produces unusual depth in the areas it favours.",
    ),
    "MARANA_KARAKA_STHANA": (
        "இந்தக் கிரகம் தன் இயல்பை வெளிப்படுத்த சிரமப்படும் இடத்தில் உள்ளது; "
        "அதன் துறையில் விளைவுகள் மெதுவாகவும் மறைமுகமாகவும் வரும்.",
        "Places a planet where it struggles to express its nature, so results in its area tend to "
        "arrive slowly and indirectly rather than not at all.",
    ),
}


def yoga_effect(name: str) -> tuple[str, str]:
    """Bilingual one-sentence effect for a yoga code.

    Returns ``("", "")`` for an unknown code so a missing entry degrades to a
    hidden line rather than a raw enum leaking into user-facing prose. The
    coverage test is what stops that silence from going unnoticed.
    """
    return YOGA_EFFECT.get(name, ("", ""))

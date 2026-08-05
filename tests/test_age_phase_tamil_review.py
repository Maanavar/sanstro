"""Golden lock for the age_phase_service.py native-Tamil review pass
(C-3/C-4, 2026-07-14 astrologer live session). 21 Tamil corrections applied
across get_age_based_practical_guidance / _add_dasha_guidance /
_add_gender_guidance / _add_planet_strength_guidance / get_age_based_remedies
/ build_year_guidance. Source-level assertion is the robust guard since most
strings only render for specific age/dasha/planet-strength combinations.
If a string is intentionally re-reworded later, update this test in the same
change.

Two entries were dropped from _REQUIRED on 2026-08-05, and the reason is worth
distinguishing from a re-wording: the Tamil in both was correct and reviewed.
The SENTENCES were removed because they asserted the reader has children on the
evidence of age and gender alone (see age_phase_service.get_active_life_phases).
Their pre-review bad wordings stay in _BANNED — a string that must never come
back must stay banned whether or not anything currently emits it.
"""
from __future__ import annotations

import inspect

from app.services import age_phase_service

_SRC = inspect.getsource(age_phase_service)

# Old wordings that must never come back.
_BANNED = [
    "கட்டுப்பாடுகளை இப்போது தவிர்க்கவும் — இது ஆராய்ச்சி காலம்",  # restrictions/research-period, not commitments/exploratory
    "அவசர கட்டுப்பாடுகளை தவிர்க்கவும்",  # restrictions, not rushed commitments
    "திட்டமிட்ட நிதி திட்டமிடலை",  # "planned planning" — same-root redundancy
    "குடியேற்றமும் செயலில் உள்ள முன்னுரிமை",  # immigration/colonization, not life settlement
    "குடியேற்றமும் முன்னுரிமையில் முன்னேறுவது",  # same, gender-guidance sibling
    "பகிர்ந்த மதிப்புகள்",  # "distributed values" calque for shared values
    "ஊக வளர்ச்சியை விட செல்வம் ஒருங்கிணைப்பு",  # speculative-growth/integration miscast as consolidation
    "முதலீடு செய்ய இது நல்ல நேரம்",  # spiritual practice framed as a financial pitch
    "தனிமைப்படுத்தலை தடுக்கிறது மற்றும் நலன்புரிவை",  # quarantine + coined word
    "ஆர்வமிக்க இயக்கங்களையும்",  # "movements" (political), not drives
    "கேது மகாதசை பிரிவு",  # separation/parting, not detachment
    "கண்ணளவிய செயல்பாட்டை",  # not a real Tamil word
    "மூங்கில் மவுல்",  # bamboo + non-word, not coral gemstone
    "ஆக்கிரமிப்பு இல்லாமல்",  # invasion/occupation, not aggression
    "ஒருங்கிணைக்க தசை சக்தியை",  # muscle energy, not dasha energy
    "அஞ்சநேய ஸ்தோத்திரம்",  # inconsistent spelling vs ஆஞ்சநேயர் பூஜை in the same line
    "நிதி அனுபவங்களில்",  # financial experiences, not indulgences
    "கவனமான பகுத்தறிவு தேவை",  # rationalist-movement connotation, not discernment
    "விட்டுக்கொடுத்தல் மற்றும் நீண்ட காலமாக",  # negotiation-compromise sense, not letting go
    "திரும்ப முடியாத கடமைகளை",  # duties, not commitments
    "உடல்நலம் இடம் தந்தால்",  # stilted "if health gives room"
]

# Corrected wordings that must be present.
_REQUIRED = [
    "நீண்ட கால உறுதிமொழிகளை இப்போது தவிர்க்கவும் — இது கண்டறியும் காலம்.",
    "நீண்ட கால உறவுகளை கவனமாக மதிப்பிடவும் — அவசர முடிவுகளைத் தவிர்க்கவும்.",
    "திருமண வாய்ப்புகளை ஒத்த மதிப்புகள் மற்றும் வாழ்க்கை இலக்குகள் உட்பட முழுமையாக மதிப்பிடவும்.",
    "முறையான நிதித் திட்டமிடலைத் தொடங்கவும்",
    "இந்த காலத்தில் தீவிர வளர்ச்சியை விட செல்வத்தைத் திரட்டிப் பாதுகாப்பது அதிக முக்கியம்.",
    # Two progeny-asserting sentences were removed here — see the module docstring.
    "அவற்றில் ஈடுபட இது நல்ல காலம்.",
    "சமூக தொடர்பையும் நோக்கத்தையும் பராமரிப்பது தனிமையைத் தடுக்கிறது, நல்வாழ்வை ஆதரிக்கிறது.",
    "ராகு மகாதசை பேராசையான உந்துதல்களையும் வழக்கத்திற்கு மாறான பாதைகளையும் கொண்டுவருகிறது — கவனமும் விவேகமும் முக்கியம்.",
    "கேது மகாதசை பற்றின்மை, ஆன்மீக நுண்ணறிவு",
    "பலவீனமான செவ்வாய் அளவான செயல்பாட்டைக் கோருகிறது",
    "செவ்வாய்க்கிழமைகளில் ஆஞ்சநேயர் பூஜை மற்றும் ஆஞ்சநேய ஸ்தோத்திரம்",
    "பவளக் கல் (சரியான முகூர்த்தத்திற்குப் பின் வெள்ளி/தங்கத்தில்) செவ்வாயை வலுப்படுத்தலாம்.",
    "ஆக்ரோஷம் இல்லாமல் சக்தியை வழிப்படுத்தவும்.",
    "நிதி ஆடம்பரங்களில் நுண்ணறிவுடன் இருக்கவும்.",
    "ஆனால் கவனமான விவேகம் தேவை.",
    "கேது ஆண்டு ஆன்மீக ஆழம், கைவிடுதல் மற்றும்",
    "திரும்ப முடியாத உறுதிமொழிகளைத் தவிர்க்கவும்.",
    "ஒருங்கிணைக்க தசா சக்தியைப் பயன்படுத்தவும்.",
    "உடல்நிலை அனுமதித்தால்",
]


def test_native_tamil_review_corrections_locked() -> None:
    for bad in _BANNED:
        assert bad not in _SRC, f"banned Tamil wording resurfaced in age_phase_service.py: {bad}"
    for good in _REQUIRED:
        assert good in _SRC, f"expected corrected Tamil wording missing from age_phase_service.py: {good}"

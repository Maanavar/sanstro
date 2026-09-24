"""இன்றைய பலன் · உங்கள் ஜாதகப்படி — the personal daily palan (proposal §5, R6).

A television rasipalan reads one thing: the Moon's transit house counted from
the listener's janma rasi (Chandra gochara), shared by everyone of that rasi.
This reads the same gochara from the reader's *own* natal Moon and adds the two
lenses a Tamil almanac reader applies next, both of which change daily:

1. **Chandra gochara** — the Moon's house from the janma rasi. It is the
   primary lens, and it holds for about 2¼ days, so the basis line says so
   rather than implying a fresh calculation at midnight.
2. **Tara bala** — the day's star counted from the janma star (nine taras).
   It modulates a line; it never reverses one (content review §B).
3. **Chandrashtama** — the reader's own star window (ruling D11). When present
   it leads, and no area may read favourable.

The headline is **not** a new score. `overall.polarity` is read off the hero's
own label (`_score_label`, already Chandrashtama-capped), so the card and the
hero cannot disagree ("two axes on one card read as a contradiction"). The best
part of the day is the hero's featured window, passed in, not recomputed.

Moon-house results follow the classical Chandra gochara phala as printed in
Tamil almanacs (Phaladeepika ch. 26 lineage): 1 comfort, 2 expense, 3 success,
4 unease, 5 dejection, 6 victory, 7 companionship, 8 anxiety, 9 obstruction,
10 accomplishment, 11 gain, 12 loss. The per-area refinements weigh that result
against the bhava each area belongs to (7th for partners and customers, 4th for
home and vehicle, 3rd for short travel and speech, and so on).

**Review status.** Written 2026-09-23 at the owner's direction, in the role of
the project astrologer, to replace the stalled sign-off gate in
docs/PERSONAL_PALAN_CONTENT_REVIEW_2026-09-23.md. The copy is
`OWNER_COMMISSIONED_DRAFT`: an outside astrologer and native-Tamil review are
still owed, and `CONTENT_VERSION` must change with any wording change so a
reviewer can cite exactly what they passed.

Lucky colour / number / direction follow R9: one graha, its classical colour and
direction, the app's own graha number, named on tap (section G). Kuligai is not
mentioned at all (R10: the only polarity table is `app/data/kuligai_polarity.py`).
"""
from __future__ import annotations

import zlib
from dataclasses import dataclass
from datetime import date
from typing import Literal

from app.calculations.numerology import NUMBER_TO_GRAHA
from app.calculations.tara_bala import TARA_NAMES, chandra_bala, tara_number
from app.constants.astrology import SIGN_LORD
from app.services._dg_peyarchi import NODE_AXIS_SUPPORTIVE
from app.services.narrative_engine import format_clock_label

# v2 (2026-09-23): period layer — dasha/bhukti, Sani cycles, Guru and Rahu.
# v3 (2026-09-23): presenter transcript (section F).
# v4 (2026-09-23): lucky colour / number / direction under R9 (section G).
CONTENT_VERSION = "palan-2026-09-23-v4"
REVIEW_STATUS = "OWNER_COMMISSIONED_DRAFT"

Polarity = Literal["FAVOURABLE", "MIXED", "CAUTION"]
F: Polarity = "FAVOURABLE"
M: Polarity = "MIXED"
C: Polarity = "CAUTION"
_STEP = {F: 2, M: 1, C: 0}
_FROM_STEP: dict[int, Polarity] = {2: F, 1: M, 0: C}

# Neutral reading order (a family member's chart, or no life focus). The owner's
# chip list: Career · Business · Money · Family · Love · Health · Education ·
# Travel · Communication — plus the three R6 sections the chips fold in
# (documents, friends, the Moon's mental reading).
AREAS: tuple[str, ...] = (
    "CAREER", "BUSINESS", "MONEY", "FAMILY", "LOVE", "HEALTH",
    "EDUCATION", "TRAVEL", "DOCUMENTS", "FRIENDS", "COMMUNICATION", "MIND",
)


@dataclass(frozen=True)
class Bi:
    ta: str
    en: str


# ── A. Moon house → per-area polarity ─────────────────────────────────────────
# Columns follow AREAS. Rows are the Moon's house from the janma rasi.
#                 CAR BUS MON FAM LOV HEA EDU TRA DOC FRI COM MIND
_MATRIX: dict[int, tuple[Polarity, ...]] = {
    1:  (F,  F,  F,  F,  F,  F,  F,  F,  M,  F,  F,  M),  # ஜென்ம சந்திரன்: comfort; mind restless
    2:  (M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M),  # expense, speech needs care
    3:  (F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F),  # success, courage
    4:  (M,  M,  M,  C,  M,  M,  M,  C,  M,  M,  M,  C),  # home unease, vehicle care
    5:  (M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M),  # dejection, obstacles
    6:  (F,  F,  F,  M,  C,  F,  F,  F,  F,  C,  F,  F),  # victory over rivals; friction with close ones
    7:  (M,  F,  M,  F,  F,  F,  M,  F,  M,  F,  F,  F),  # companionship, customers
    8:  (C,  C,  C,  C,  C,  C,  C,  C,  C,  C,  C,  C),  # anxiety (rasi-level ashtama)
    9:  (M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M,  M),  # obstruction, fatigue
    10: (F,  F,  F,  M,  M,  F,  F,  M,  F,  M,  F,  F),  # accomplishment at work
    11: (F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F,  F),  # gain, joy
    12: (C,  C,  C,  M,  M,  C,  C,  M,  C,  M,  C,  C),  # expense, loss of sleep
}

# The classical result of each Moon house, in the almanac's own words. Used for
# the Moon's mental reading and as the second clause of the overall line.
_HOUSE_THEME: dict[int, Bi] = {
    1: Bi("சந்திரன் உங்கள் ராசியிலேயே இருப்பதால் உடல் சுகமும் நல்ல உணவும் அமையும்; ஆனால் மனம் சற்று அலைபாயலாம்.",
          "With the Moon in your own rasi, comfort and good food come easily, though the mind can wander."),
    2: Bi("சந்திரன் இரண்டாம் இடத்தில் இருப்பதால் செலவுகள் தலைதூக்கும்; வார்த்தைகளை அளந்து பேசுவது நல்லது.",
          "With the Moon in your 2nd, spending rises and words need measuring."),
    3: Bi("சந்திரன் மூன்றாம் இடத்தில் இருப்பதால் தைரியமும் முயற்சிக்கேற்ற வெற்றியும் கிடைக்கும்.",
          "With the Moon in your 3rd, courage is high and effort converts into results."),
    4: Bi("சந்திரன் நான்காம் இடத்தில் இருப்பதால் மனதில் சிறு சஞ்சலமும் வீட்டில் சிறு அமைதியின்மையும் இருக்கலாம்.",
          "With the Moon in your 4th, the mind is uneasy and home can feel unsettled."),
    5: Bi("சந்திரன் ஐந்தாம் இடத்தில் இருப்பதால் எதிர்பார்த்தது தாமதமாகலாம்; மனச்சோர்வுக்கு இடம் கொடுக்க வேண்டாம்.",
          "With the Moon in your 5th, expected things may lag; don't let it turn into low spirits."),
    6: Bi("சந்திரன் ஆறாம் இடத்தில் இருப்பதால் போட்டிகளில் வெற்றியும் உடல்நலத்தில் முன்னேற்றமும் கிடைக்கும்.",
          "With the Moon in your 6th, you get the better of competition and health improves."),
    7: Bi("சந்திரன் ஏழாம் இடத்தில் இருப்பதால் துணையின் அன்பும் பிறரின் ஒத்துழைப்பும் கிடைக்கும்.",
          "With the Moon in your 7th, companionship and other people's cooperation come readily."),
    8: Bi("சந்திரன் எட்டாம் இடத்தில் இருப்பதால் மனதில் பதற்றம் இருக்கலாம்; பெரிய முடிவுகளை ஒத்திவைப்பது நல்லது.",
          "With the Moon in your 8th, the mind runs anxious; big decisions are better deferred."),
    9: Bi("சந்திரன் ஒன்பதாம் இடத்தில் இருப்பதால் காரியங்களில் சிறு தடையும் உடல் அசதியும் இருக்கலாம்.",
          "With the Moon in your 9th, tasks meet small obstructions and the body tires sooner."),
    10: Bi("சந்திரன் பத்தாம் இடத்தில் இருப்பதால் தொடங்கிய வேலைகள் நிறைவேறும்; உழைப்புக்கு மதிப்பு கிடைக்கும்.",
           "With the Moon in your 10th, work in hand gets finished and effort is recognised."),
    11: Bi("சந்திரன் பதினொன்றாம் இடத்தில் இருப்பதால் லாபமும் மகிழ்ச்சியும் நண்பர்களின் ஆதரவும் கிடைக்கும்.",
           "With the Moon in your 11th, gains, cheer and friends' support arrive."),
    12: Bi("சந்திரன் பன்னிரண்டாம் இடத்தில் இருப்பதால் விரயச் செலவும் தூக்கக் குறைவும் இருக்கலாம்.",
           "With the Moon in your 12th, money leaks out and sleep runs short."),
}

# ── B. Tara modifiers ─────────────────────────────────────────────────────────
# A tara may soften, sharpen or lift a line, never reverse it: a lift moves
# MIXED to FAVOURABLE only, never CAUTION upward; a soften moves FAVOURABLE to
# MIXED; only Naidhana sharpens (one step, two areas).
_ACTION_AREAS = frozenset({"CAREER", "BUSINESS", "MONEY", "DOCUMENTS", "TRAVEL"})
_TARA_LIFT: dict[int, frozenset[str]] = {
    2: frozenset({"MONEY", "BUSINESS"}),                   # Sampat — wealth
    4: frozenset({"HEALTH", "FAMILY"}),                    # Kshema — wellbeing
    6: frozenset({"CAREER", "EDUCATION", "DOCUMENTS"}),    # Sadhana — accomplishment
    8: frozenset({"FRIENDS", "LOVE"}),                     # Mitra — friendship
    9: frozenset({"FRIENDS", "CAREER", "BUSINESS"}),       # Parama Mitra
}
_TARA_ADVERSE = frozenset({3, 5, 7})  # Vipat, Pratyari, Naidhana

# Tara 1 covers three stars: the janma star itself (count 1) and its 10th and
# 19th (anu-janma, tri-janma). Only count 1 may be called "your birth star".
_TARA_NOTE_TRIAD = Bi(
    "இன்றைய நட்சத்திரம் உங்கள் ஜென்ம நட்சத்திரத்தின் திரிகோண நட்சத்திரம் (ஜென்ம தாரை); உடலும் மனமும் சற்று உணர்வுப்பூர்வமாக இருக்கும்.",
    "Today's star is a trine of your birth star (Janma tara), so body and mind are more sensitive than usual.",
)
_TARA_NOTE: dict[int, Bi] = {
    1: Bi("இன்று உங்கள் ஜென்ம நட்சத்திர நாள்; உடலும் மனமும் சற்று உணர்வுப்பூர்வமாக இருக்கும்.",
          "It is your janma star today, so body and mind are more sensitive than usual."),
    2: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு சம்பத் தாரை; பண விஷயங்களுக்குத் துணை நிற்கும்.",
          "Today's star is Sampat tara for you, which backs money matters."),
    3: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு விபத் தாரை; புதிய முயற்சிகளைக் கவனமாகத் தொடங்குங்கள்.",
          "Today's star is Vipat tara for you, so begin new things carefully."),
    4: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு க்ஷேம தாரை; நலனும் குடும்ப அமைதியும் கூடும்.",
          "Today's star is Kshema tara for you, favouring wellbeing and a calm home."),
    5: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு பிரத்யரி தாரை; காரியங்களில் சிறு தடைகள் வரலாம்.",
          "Today's star is Pratyari tara for you, so expect small hold-ups."),
    6: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு சாதக தாரை; முயற்சி செய்த காரியம் கைகூடும்.",
          "Today's star is Sadhana tara for you, so focused effort pays off."),
    7: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு நைதன தாரை; பயணத்திலும் உடல்நலத்திலும் கூடுதல் கவனம் தேவை.",
          "Today's star is Naidhana tara for you, so take extra care with travel and health."),
    8: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு மித்ர தாரை; நண்பர்களும் அன்புக்குரியவர்களும் உதவுவார்கள்.",
          "Today's star is Mitra tara for you; friends and loved ones help."),
    9: Bi("இன்றைய நட்சத்திரம் உங்களுக்கு பரம மித்ர தாரை; பிறர் ஆதரவு தாராளமாகக் கிடைக்கும்.",
          "Today's star is Parama Mitra tara for you; support from others comes generously."),
}

# ── Area lines: one per area × polarity ───────────────────────────────────────
_AREA_TEXT: dict[str, dict[Polarity, Bi]] = {
    "CAREER": {
        F: Bi("வேலையில் உங்கள் உழைப்பு கவனிக்கப்படும்; மேலதிகாரியின் ஆதரவும் புதிய பொறுப்பும் கிடைக்க வாய்ப்பு உண்டு.",
              "Your work gets noticed; support from above and a new responsibility are likely."),
        M: Bi("வேலைச்சுமை கூடலாம்; கையில் உள்ளதை முடிப்பதில் கவனம் செலுத்துங்கள், சக ஊழியர்களுடன் பொறுமை தேவை.",
              "The workload may grow; finish what is in hand and stay patient with colleagues."),
        C: Bi("வேலையில் அவசர வாக்குறுதிகள் வேண்டாம்; மேலதிகாரியிடம் பேசும்போது நிதானம் தேவை.",
              "Make no hasty promises at work, and speak to superiors with restraint."),
    },
    "BUSINESS": {
        F: Bi("தொழிலில் வாடிக்கையாளர்களிடமிருந்து நல்ல பதில் கிடைக்கும்; பேச்சுவார்த்தை சாதகமாக முடியும்.",
              "In business, customers respond well and negotiations close in your favour."),
        M: Bi("தொழிலில் ஆர்டர்கள் வந்தாலும் பணம் வந்துசேர தாமதமாகலாம்; ஒப்பந்தங்களைத் தெளிவாகப் பேசுங்கள்.",
              "Orders may come but payment can lag; spell out terms clearly."),
        C: Bi("புதிய ஒப்பந்தம் அல்லது பெரிய முதலீட்டை இன்று ஒத்திவையுங்கள்; கூட்டாளிகளிடம் கருத்து வேறுபாடு வரலாம்.",
              "Hold off on new contracts or big investment today; partners may disagree."),
    },
    "MONEY": {
        F: Bi("பணவரவு திருப்திகரமாக இருக்கும்; நிலுவையில் இருந்த தொகை வந்துசேர வாய்ப்பு உண்டு.",
              "Money flows in well, and a pending amount may be recovered."),
        M: Bi("வரவு இருந்தாலும் குடும்பத் தேவைகளுக்காக செலவும் கூடும்; திட்டமிட்டுச் செலவிடுங்கள்.",
              "Income comes, but household needs raise spending; spend to a plan."),
        C: Bi("எதிர்பாராத செலவுகள் வரலாம்; கடன் கொடுப்பதையும் பெரிய வாங்குதலையும் தவிர்ப்பது நல்லது.",
              "Unexpected expenses may crop up; avoid lending and big purchases."),
    },
    "FAMILY": {
        F: Bi("குடும்பத்தில் மகிழ்ச்சியான சூழல் நிலவும்; பெற்றோர், குழந்தைகளுடன் நல்ல நேரம் செலவிடுவீர்கள்.",
              "Home is cheerful, with good time spent with parents and children."),
        M: Bi("குடும்பத்தில் சிறு கருத்து வேறுபாடுகள் வரலாம்; பொறுமையாகக் கையாண்டால் விரைவில் சரியாகும்.",
              "Small disagreements may arise at home; handled patiently, they pass quickly."),
        C: Bi("வீட்டில் வார்த்தை மோதல்களைத் தவிர்க்கவும்; பெரியவர்களின் உடல்நலத்தில் கவனம் செலுத்துங்கள்.",
              "Avoid sharp words at home, and keep an eye on elders' wellbeing."),
    },
    "LOVE": {
        F: Bi("துணையுடன் நெருக்கம் கூடும்; திருமணப் பேச்சு நடப்பவர்களுக்கு சாதகமான தகவல் வரலாம்.",
              "Closeness with your partner grows; marriage talks may bring good news."),
        M: Bi("அன்புக்குரியவருடன் மனம்விட்டுப் பேசுங்கள்; சிறு தவறான புரிதல்களை உடனே தீர்த்துக்கொள்ளுங்கள்.",
              "Talk openly with the one you love and clear small misunderstandings at once."),
        C: Bi("துணையுடன் சிறு மனக்கசப்பு வரலாம்; முக்கியமான உறவுப் பேச்சுகளை இன்னொரு நாளுக்கு வையுங்கள்.",
              "Some friction with your partner is possible; keep important relationship talks for another day."),
    },
    "HEALTH": {
        F: Bi("உடல் சுறுசுறுப்பாக இருக்கும்; நல்ல உணவும் ஓய்வும் இதைத் தொடரச் செய்யும்.",
              "You feel energetic; good food and rest keep it that way."),
        M: Bi("சோர்வு அல்லது லேசான தலைவலி வரலாம்; நேரத்துக்கு உணவும் போதுமான தண்ணீரும் அவசியம்.",
              "Tiredness or a mild headache may come; eat on time and drink enough water."),
        C: Bi("தூக்கக் குறைவும் செரிமானக் கோளாறும் வரலாம்; அதிக வேலைச்சுமையைக் குறைத்து ஓய்வெடுங்கள்.",
              "Sleep and digestion may suffer; ease the load and rest."),
    },
    "EDUCATION": {
        F: Bi("மாணவர்களுக்கு கவனமும் நினைவாற்றலும் கூடும்; விண்ணப்பங்களையும் தேர்வுத் தயாரிப்பையும் முன்னெடுக்கலாம்.",
              "Students find focus and memory sharp; push applications and exam preparation forward."),
        M: Bi("படிப்பில் கவனச் சிதறல் இருக்கலாம்; குறுகிய இடைவெளிகளுடன் படிப்பது பலன் தரும்.",
              "Attention may drift from study; short sessions with breaks work best."),
        C: Bi("முக்கியமான தேர்வு அல்லது விண்ணப்பம் இருந்தால் முன்கூட்டியே சரிபார்த்துக் கொள்ளுங்கள்; அவசரம் வேண்டாம்.",
              "If an exam or application is due, check everything in advance and don't rush."),
    },
    "TRAVEL": {
        F: Bi("பயணங்கள் சாதகமாக அமையும்; திட்டமிட்ட பயணம் நல்ல பலன் தரும்.",
              "Travel goes well, and a planned trip pays off."),
        M: Bi("பயணத்தில் சிறு தாமதங்கள் இருக்கலாம்; கூடுதல் நேரம் ஒதுக்கிப் புறப்படுங்கள்.",
              "Journeys may see small delays; leave with time to spare."),
        C: Bi("வாகனம் ஓட்டும்போது அவசரம் வேண்டாம்; தேவையற்ற பயணங்களைத் தவிர்ப்பது நல்லது.",
              "Don't hurry at the wheel, and skip journeys that aren't needed."),
    },
    "DOCUMENTS": {
        F: Bi("அரசு சார்ந்த வேலைகள், விண்ணப்பங்கள், பதிவுகள் சுமுகமாக நடக்கும்.",
              "Government work, applications and registrations move smoothly."),
        M: Bi("ஆவணப் பணிகள் நடந்தாலும் ஒப்புதலுக்கு சற்று நேரம் ஆகலாம்; ஆவணங்களை முழுமையாக வைத்திருங்கள்.",
              "Paperwork progresses but approvals take time; keep your documents complete."),
        C: Bi("கையெழுத்திடும் முன் ஆவணங்களை இருமுறை படியுங்கள்; சட்ட விஷயங்களில் அவசர முடிவு வேண்டாம்.",
              "Read documents twice before signing, and take no hasty legal step."),
    },
    "FRIENDS": {
        F: Bi("நண்பர்களின் உதவி தக்க நேரத்தில் கிடைக்கும்; புதிய தொடர்புகள் பயன் தரும்.",
              "Friends help at the right moment, and new contacts prove useful."),
        M: Bi("நண்பர்களுடன் பழகும்போது எல்லை தெரிந்து நடந்துகொள்ளுங்கள்; வாக்குறுதிகளை அளவோடு கொடுங்கள்.",
              "Keep sensible limits with friends and promise only what you can give."),
        C: Bi("பிறர் விஷயங்களில் தலையிடுவதைத் தவிர்க்கவும்; நம்பிக்கைக்குரியவர்களிடம் மட்டும் மனம் திறங்கள்.",
              "Stay out of others' affairs, and confide only in people you trust."),
    },
    "COMMUNICATION": {
        F: Bi("உங்கள் பேச்சுக்கு மதிப்பு கிடைக்கும்; முக்கியமான செய்திகளையும் அழைப்புகளையும் இன்று செய்யலாம்.",
              "Your words carry weight; important messages and calls can go out today."),
        M: Bi("சொல்ல வந்ததைத் தெளிவாகச் சொல்லுங்கள்; தவறான புரிதல்களுக்கு இடம் கொடுக்க வேண்டாம்.",
              "Say plainly what you mean and leave no room for misreading."),
        C: Bi("பேச்சில் நிதானம் தேவை; கோபத்தில் பதில் சொல்லாமல் சற்று நேரம் கழித்துப் பேசுங்கள்.",
              "Speak with restraint; don't answer in anger, reply after a pause."),
    },
}

# ── C. Precedence copy ────────────────────────────────────────────────────────
_CHANDRASHTAMA_LEAD = Bi(
    "இன்று உங்களுக்கு சந்திராஷ்டமம்; புதிய தொடக்கங்களையும் பெரிய முடிவுகளையும் தவிர்த்து, நிதானமாகச் செயல்படுங்கள்.",
    "Today is your Chandrashtama: skip new beginnings and big decisions, and go steadily.",
)
_MIND_CHANDRASHTAMA = Bi(
    "மனதில் குழப்பமும் பதற்றமும் தோன்றலாம்; அமைதியாக இருந்து, முக்கிய முடிவுகளை நாளைக்கு வையுங்கள்.",
    "Confusion and unease may surface; stay calm and keep key decisions for tomorrow.",
)
_OVERALL_LEAD: dict[Polarity, Bi] = {
    F: Bi("இன்று உங்களுக்கு சாதகமான நாள்; முயற்சிகளில் வேகமும் முடிவுகளில் தெளிவும் இருக்கும்.",
          "A favourable day for you: effort moves quickly and decisions come clearly."),
    M: Bi("இன்று கலவையான நாள்; திட்டமிட்டுச் செயல்பட்டால் நல்ல பலன் கிடைக்கும்.",
          "A mixed day: work to a plan and it turns out well."),
    C: Bi("இன்று கவனமாகச் செயல்பட வேண்டிய நாள்; அவசரத்தைத் தவிர்த்தால் சிக்கல்கள் விலகும்.",
          "A day for care: avoid haste and the snags stay small."),
}
_OVERALL_BY_LABEL: dict[str, Polarity] = {
    "STRONG_SUPPORT": F, "GOOD": F, "BALANCED": M, "CAUTION": C, "RESTORATIVE": C,
}

# ── D. Advice, worship and closing banks ──────────────────────────────────────
# Advice is keyed by the area the day asks most care for; with none, by the
# area it supports most. Counsel, not command.
_ADVICE_CAUTION: dict[str, Bi] = {
    "CAREER": Bi("வேலையில் சொன்னதைச் செய்து முடியுங்கள்; புதிய வாக்குறுதிகளை நாளைக்கு வையுங்கள்.",
                 "Deliver what you have promised at work; save new commitments for tomorrow."),
    "BUSINESS": Bi("புதிய ஒப்பந்தங்களில் கையெழுத்திடும் முன் ஒருநாள் யோசியுங்கள்.",
                   "Sleep on any new contract before signing it."),
    "MONEY": Bi("பண விஷயத்தில் அவசரம் வேண்டாம்; கடன் கொடுக்கல் வாங்கலை ஒத்திவையுங்கள்.",
                "Don't rush money matters; put off lending and borrowing."),
    "FAMILY": Bi("வீட்டில் கேட்பதற்கு அதிக நேரம் கொடுங்கள்; வாதத்தை வளர்க்க வேண்டாம்.",
                 "At home, listen more than you argue."),
    "LOVE": Bi("துணையின் பார்வையையும் பொறுமையாகக் கேளுங்கள்; பழைய விஷயங்களைக் கிளற வேண்டாம்.",
               "Hear your partner out patiently and leave old issues alone."),
    "HEALTH": Bi("இன்று உடலுக்கு ஓய்வு கொடுங்கள்; இரவு சீக்கிரம் உறங்கச் செல்லுங்கள்.",
                 "Give your body rest today and turn in early."),
    "EDUCATION": Bi("படிப்பதற்கு அமைதியான நேரத்தைத் தேர்ந்தெடுங்கள்; கைப்பேசியைத் தள்ளி வையுங்கள்.",
                    "Pick a quiet hour to study and keep the phone away."),
    "TRAVEL": Bi("பயணத்துக்கு முன்கூட்டியே புறப்படுங்கள்; வாகனத்தில் வேகம் வேண்டாம்.",
                 "Set out early and keep your speed down."),
    "DOCUMENTS": Bi("ஆவணங்களை இருமுறை சரிபார்த்த பிறகே சமர்ப்பியுங்கள்.",
                    "Submit documents only after checking them twice."),
    "FRIENDS": Bi("பிறர் சண்டையில் நடுவராகச் செல்ல வேண்டாம்.",
                  "Don't step in as referee in other people's quarrels."),
    "COMMUNICATION": Bi("பேச்சில் நிதானம்; கோபத்தில் எதையும் எழுதவோ அனுப்பவோ வேண்டாம்.",
                        "Measured words; send nothing written in anger."),
    "MIND": Bi("அவசர முடிவுகளைத் தவிர்க்கவும்; மனம் அமைதியான பிறகு தீர்மானியுங்கள்.",
               "Avoid snap decisions; decide once the mind has settled."),
}
_ADVICE_OPPORTUNITY: dict[str, Bi] = {
    "CAREER": Bi("தள்ளிப்போட்டிருந்த வேலையை இன்று தொடங்குங்கள்.", "Start the task you have been putting off."),
    "BUSINESS": Bi("வாடிக்கையாளர்களை நேரில் சந்தித்துப் பேச நல்ல நாள்.", "A good day to meet customers in person."),
    "MONEY": Bi("நிலுவைத் தொகைகளை இன்று நினைவூட்டுங்கள்.", "Follow up on money owed to you today."),
    "FAMILY": Bi("குடும்பத்தினருடன் சேர்ந்து ஒரு வேளை உணவருந்துங்கள்.", "Share a meal with the family."),
    "LOVE": Bi("அன்புக்குரியவருக்கு நேரம் ஒதுக்குங்கள்.", "Make time for the one you love."),
    "HEALTH": Bi("புதிய உடற்பயிற்சிப் பழக்கத்தைத் தொடங்க நல்ல நாள்.", "A good day to start a new exercise habit."),
    "EDUCATION": Bi("கடினமான பாடத்தை இன்று எடுத்துப் படியுங்கள்.", "Take up the hardest subject today."),
    "TRAVEL": Bi("திட்டமிட்ட பயணத்தை இன்று மேற்கொள்ளலாம்.", "The trip you planned can go ahead today."),
    "DOCUMENTS": Bi("நிலுவையில் உள்ள விண்ணப்பத்தை இன்று சமர்ப்பியுங்கள்.", "Submit the pending application today."),
    "FRIENDS": Bi("நீண்ட நாள் பேசாத நண்பரை அழைத்துப் பேசுங்கள்.", "Call a friend you have not spoken to in a while."),
    "COMMUNICATION": Bi("முக்கியமான பேச்சுகளையும் கோரிக்கைகளையும் இன்று முன்வையுங்கள்.", "Raise the important conversation or request today."),
    "MIND": Bi("மனத்தெளிவைப் பயன்படுத்தி முக்கிய முடிவுகளை எடுங்கள்.", "Use today's clear head for the decisions that matter."),
}

# Light worship by the day's weekday lord: a deity, a lamp, a small act. No
# frightening remedy, no purchase, no promise of a cure.
_WORSHIP: dict[str, Bi] = {
    "SUN": Bi("காலையில் சூரியனை வணங்கி நாளைத் தொடங்குங்கள்.", "Begin the day with a greeting to the Sun."),
    "MOON": Bi("சிவபெருமானை நினைத்து ‘ஓம் நமசிவாய’ சொல்லுங்கள்.", "Remember Lord Shiva and say ‘Om Namah Shivaya’."),
    "MARS": Bi("முருகப்பெருமானை வணங்குங்கள்; கந்த சஷ்டி கவசம் கேட்பது மனதுக்கு உறுதி தரும்.",
               "Pray to Lord Murugan; listening to Kanda Sashti Kavasam steadies the mind."),
    "MERCURY": Bi("பெருமாளை வணங்குங்கள்; துளசி அர்ச்சனை மனதுக்கு நிறைவு தரும்.",
                  "Pray to Perumal; a tulasi offering brings contentment."),
    "JUPITER": Bi("குருவை நினைத்து வணங்குங்கள்; பெரியவர்களிடம் ஆசி பெறுங்கள்.",
                  "Honour Guru, and seek an elder's blessing."),
    "VENUS": Bi("மகாலட்சுமியை நினைத்து மாலையில் விளக்கேற்றுங்கள்.", "Light a lamp for Mahalakshmi in the evening."),
    "SATURN": Bi("ஆஞ்சநேயரை வணங்குங்கள்; இயன்றால் ஒருவருக்கு உணவளியுங்கள்.",
                 "Pray to Anjaneya, and if you can, feed someone."),
}
_WORSHIP_CHANDRASHTAMA = Bi(
    "மனம் அமைதி பெற அம்பாளை நினைத்து ஒரு விளக்கேற்றுங்கள்.",
    "Light a lamp to Amman for a settled mind.",
)

_STRENGTH: dict[str, Bi] = {
    "CAREER": Bi("பொறுப்புணர்வு", "your sense of responsibility"),
    "BUSINESS": Bi("பேச்சுவார்த்தைத் திறன்", "your negotiating skill"),
    "MONEY": Bi("திட்டமிடல்", "your planning"),
    "FAMILY": Bi("குடும்ப அன்பு", "your family's affection"),
    "LOVE": Bi("புரிதல்", "understanding"),
    "HEALTH": Bi("உடல் வலிமை", "physical energy"),
    "EDUCATION": Bi("கவனம்", "focus"),
    "TRAVEL": Bi("சுறுசுறுப்பு", "your drive"),
    "DOCUMENTS": Bi("ஒழுங்கு", "orderliness"),
    "FRIENDS": Bi("நட்பு வட்டம்", "your circle of friends"),
    "COMMUNICATION": Bi("பேச்சுத் திறன்", "your way with words"),
    "MIND": Bi("மன உறுதி", "a steady mind"),
}
_WATCH: dict[str, Bi] = {
    "CAREER": Bi("வேலையில் அவசர வாக்குறுதிகள்", "hasty promises at work"),
    "BUSINESS": Bi("புதிய ஒப்பந்தங்கள்", "new contracts"),
    "MONEY": Bi("திடீர் செலவுகள்", "sudden spending"),
    "FAMILY": Bi("வீட்டில் வார்த்தை மோதல்", "sharp words at home"),
    "LOVE": Bi("துணையுடன் சிறு மனக்கசப்பு", "small frictions with your partner"),
    "HEALTH": Bi("தூக்கமும் ஓய்வும்", "sleep and rest"),
    "EDUCATION": Bi("கவனச் சிதறல்", "distraction"),
    "TRAVEL": Bi("வாகனத்தில் அவசரம்", "hurry on the road"),
    "DOCUMENTS": Bi("ஆவணங்களில் சிறு பிழைகள்", "small errors in paperwork"),
    "FRIENDS": Bi("பிறர் விஷயத்தில் தலையீடு", "getting drawn into others' affairs"),
    "COMMUNICATION": Bi("கடுஞ்சொல்", "harsh words"),
    "MIND": Bi("அவசர முடிவுகள்", "snap decisions"),
}

_CLOSING: dict[Polarity, tuple[Bi, ...]] = {
    F: (
        Bi("முயற்சி வெற்றி தரும் நாள்.", "A day when effort wins."),
        Bi("நம்பிக்கையுடன் முன்னேறுங்கள்; நாள் உங்கள் பக்கம்.", "Go ahead with confidence; the day is on your side."),
        Bi("தொடங்கியதை முடித்து மகிழும் நாள்.", "A day to finish what you began, and enjoy it."),
    ),
    M: (
        Bi("திட்டமிட்டால் நாள் நல்லபடியாக அமையும்.", "Plan it, and the day turns out well."),
        Bi("பொறுமையே இன்றைய பலம்.", "Patience is today's strength."),
        Bi("செலவைக் கட்டுப்படுத்தினால் நாள் நல்லபடியாக அமையும்.", "Keep spending in check and the day goes well."),
    ),
    C: (
        Bi("நிதானமே இன்றைய வெற்றி.", "Today, steadiness is the win."),
        Bi("பேச்சில் நிதானம் தேவை; நாளை புதிய தொடக்கம்.", "Measured words today; tomorrow is a fresh start."),
        Bi("அவசரம் தவிர்த்தால் நாள் அமைதியாகக் கழியும்.", "Skip the hurry and the day passes calmly."),
    ),
}

# The order opportunity/caution are named in when several areas tie: the areas
# a day most often turns on come first.
_PRIORITY: tuple[str, ...] = (
    "CAREER", "MONEY", "FAMILY", "HEALTH", "BUSINESS", "COMMUNICATION",
    "LOVE", "TRAVEL", "EDUCATION", "DOCUMENTS", "FRIENDS", "MIND",
)


@dataclass(frozen=True)
class PalanArea:
    area: str
    polarity: Polarity
    text: Bi
    # The season's one clause for this area (Sani / Guru / Rahu), if any.
    period_note: Bi | None = None


@dataclass(frozen=True)
class PersonalPalan:
    content_version: str
    review_status: str
    overall_polarity: Polarity
    overall: Bi
    areas: tuple[PalanArea, ...]
    advice: Bi
    worship: Bi
    closing: Bi
    strength: Bi | None
    watch: Bi | None
    opportunity_area: str | None
    caution_area: str | None
    moon_house: int
    tara: int
    tara_name: Bi
    is_chandrashtama: bool
    basis: Bi
    period: PalanPeriod | None = None
    # Areas the running bhukti lord brings forward; they lead the card.
    dasha_areas: tuple[str, ...] = ()
    transcript: tuple[TranscriptSegment, ...] = ()
    lucky: PalanLucky | None = None


# ── E. Period layer: dasha / bhukti and the slow transits ─────────────────────
# The Moon and tara are the day's weather. Three slower layers are the season a
# Tamil reader sets that weather against:
#
# * The running **bhukti lord** names which areas are *in play* this period —
#   the houses it rules from the lagna (a node: the house it occupies). Those
#   areas move up the card. Today, its transit house from the Moon says whether
#   the day backs them.
# * **Sani** cycles (Ezharai / Janma / Ashtama / Ardhashtama / Kandaka, all from
#   the Moon, doctrine A-1) and **Guru** and **Rahu** from the Moon qualify the
#   areas they govern for the whole season.
#
# Precedence: a period layer adds ONE clause to an area and may cap it from
# favourable to mixed; it never lifts a line and never touches the overall
# polarity. The hero score these come from already weighs every one of them
# (dasha 19%, gochar 24%, the Sani penalty in personal cautions), so moving the
# headline again would count them twice ("layered scoring double-counts").

GRAHA_NAME: dict[str, Bi] = {
    "SUN": Bi("சூரியன்", "Sun"), "MOON": Bi("சந்திரன்", "Moon"), "MARS": Bi("செவ்வாய்", "Mars"),
    "MERCURY": Bi("புதன்", "Mercury"), "JUPITER": Bi("குரு", "Jupiter"), "VENUS": Bi("சுக்கிரன்", "Venus"),
    "SATURN": Bi("சனி", "Saturn"), "RAHU": Bi("ராகு", "Rahu"), "KETU": Bi("கேது", "Ketu"),
}

# Sani cycle → the areas it presses on, and the season clause it adds there.
_SANI_LAYER: dict[str, tuple[frozenset[str], Bi]] = {
    "EZHARAI_SANI_PHASE_1": (
        frozenset({"MONEY", "TRAVEL", "HEALTH"}),
        Bi("ஏழரை சனியின் தொடக்கக் காலம் என்பதால் செலவும் அலைச்சலும் கூடும்; இதில் நிதானம் தேவை.",
           "Ezharai Sani's opening phase brings extra spending and running about, so go steadily here."),
    ),
    "JANMA_SANI": (
        frozenset({"CAREER", "HEALTH", "MIND"}),
        Bi("ஜன்ம சனி காலம் என்பதால் இதில் உழைப்பு அதிகம், பலன் மெதுவாக வரும்; அவசரம் வேண்டாம்.",
           "This is your Janma Sani season: more effort and slower results here, so don't hurry."),
    ),
    "EZHARAI_SANI_PHASE_3": (
        frozenset({"MONEY", "FAMILY", "COMMUNICATION"}),
        Bi("ஏழரை சனியின் நிறைவுக் காலம் என்பதால் பணத்திலும் பேச்சிலும் கவனம் தேவை.",
           "Ezharai Sani's closing phase asks for care with money and with words."),
    ),
    "ARDHASHTAMA_SANI": (
        frozenset({"FAMILY", "TRAVEL", "MIND"}),
        Bi("அர்த்தாஷ்டம சனி காலம் என்பதால் வீடு, வாகனம், மன அமைதியில் கூடுதல் கவனம் தேவை.",
           "In this Ardhashtama Sani season, give home, vehicle and peace of mind extra care."),
    ),
    "ASHTAMA_SANI": (
        frozenset({"CAREER", "HEALTH", "DOCUMENTS", "MONEY"}),
        Bi("அஷ்டம சனி காலம் என்பதால் பெரிய மாற்றங்களையும் புதிய பொறுப்புகளையும் நிதானமாக எடுங்கள்.",
           "In this Ashtama Sani season, take big changes and new responsibilities slowly."),
    ),
}
# The engine never names phase 2 (it is JANMA_SANI), but a client might send it.
_SANI_LAYER["EZHARAI_SANI_PHASE_2"] = _SANI_LAYER["JANMA_SANI"]

# Kandaka Sani by limb. The 4th is Ardhashtama and already named above.
_KANDAKA_LAYER: dict[int, tuple[frozenset[str], Bi]] = {
    7: (
        frozenset({"LOVE", "BUSINESS"}),
        Bi("கண்டக சனி (7-ஆம் இடம்) காலம் என்பதால் துணையுடனும் கூட்டாளிகளுடனும் பொறுமை தேவை.",
           "With Kantaka Sani in your 7th, be patient with your partner and business partners."),
    ),
    10: (
        frozenset({"CAREER"}),
        Bi("கண்டக சனி (10-ஆம் இடம்) காலம் என்பதால் வேலைச்சுமை கூடும்; பொறுப்புகளை அளவோடு ஏற்றுக்கொள்ளுங்கள்.",
           "With Kantaka Sani in your 10th, work weighs heavier; take on responsibility in measure."),
    ),
}

# Guru from the Moon. The house sets are the engine's own (TRANSIT_BASE_SCORE
# ["JUPITER"] ≥ 65 supportive, < 45 testing; a test pins the agreement).
_GURU_SUPPORT: dict[int, frozenset[str]] = {
    2: frozenset({"MONEY", "FAMILY"}),
    5: frozenset({"EDUCATION", "FAMILY"}),
    7: frozenset({"LOVE", "BUSINESS"}),
    9: frozenset({"TRAVEL", "MIND"}),
    11: frozenset({"MONEY", "FRIENDS", "CAREER"}),
}
_GURU_TESTING: dict[int, frozenset[str]] = {
    4: frozenset({"FAMILY", "MIND"}),
    6: frozenset({"HEALTH", "DOCUMENTS"}),
    8: frozenset({"MONEY", "HEALTH"}),
    12: frozenset({"MONEY", "TRAVEL"}),
}
# Rahu from the Moon, on the peyarchi report's own axis sets (a test pins it).
_RAHU_SUPPORT: dict[int, frozenset[str]] = {
    3: frozenset({"COMMUNICATION"}),
    6: frozenset({"HEALTH", "DOCUMENTS"}),
    10: frozenset({"CAREER"}),
    11: frozenset({"MONEY", "FRIENDS"}),
}
_RAHU_TESTING: dict[int, frozenset[str]] = {
    1: frozenset({"MIND"}),
    5: frozenset({"EDUCATION"}),
    7: frozenset({"LOVE", "BUSINESS"}),
    8: frozenset({"HEALTH"}),
    12: frozenset({"TRAVEL", "MONEY"}),
}


def _guru_note(house: int, supportive: bool) -> Bi:
    if supportive:
        return Bi(f"குரு உங்கள் ராசிக்கு {house}-ஆம் இடத்தில் இருப்பதால், இப்பகுதிக்கு இக்காலம் பொதுவாக ஆதரவானது.",
                  f"With Guru in house {house} from your Moon, this season broadly supports this area.")
    return Bi(f"குரு உங்கள் ராசிக்கு {house}-ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் இக்காலம் கூடுதல் கவனம் கேட்கிறது.",
              f"With Guru in house {house} from your Moon, this season asks for more care here.")


def _rahu_note(house: int, supportive: bool) -> Bi:
    if supportive:
        return Bi(f"ராகு உங்கள் ராசிக்கு {house}-ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் முயற்சிக்கு இக்காலம் கைகொடுக்கும்.",
                  f"With Rahu in house {house} from your Moon, effort here is backed this season.")
    return Bi(f"ராகு உங்கள் ராசிக்கு {house}-ஆம் இடத்தில் இருப்பதால், இப்பகுதியில் இது மாற்றங்களின் காலம்; வேகத்தை விட நிலைத்தன்மை முக்கியம்.",
              f"With Rahu in house {house} from your Moon, this is a season of change here; steadiness matters more than speed.")


# The one area each bhava brings forward when the bhukti lord rules or holds it.
_BHAVA_AREA: dict[int, str] = {
    1: "HEALTH", 2: "MONEY", 3: "COMMUNICATION", 4: "FAMILY", 5: "EDUCATION", 6: "HEALTH",
    7: "LOVE", 8: "HEALTH", 9: "TRAVEL", 10: "CAREER", 11: "MONEY", 12: "TRAVEL",
}

# Classical gochara: houses from the Moon in which each graha's transit gives
# good results (Phaladeepika ch. 26). Nodes use the peyarchi axis set. Used only
# to say whether today's transit of the bhukti lord backs its areas — a
# yes/no sentence, not a score.
_GOCHARA_GOOD: dict[str, frozenset[int]] = {
    "SUN": frozenset({3, 6, 10, 11}),
    "MOON": frozenset({1, 3, 6, 7, 10, 11}),
    "MARS": frozenset({3, 6, 11}),
    "MERCURY": frozenset({2, 4, 6, 8, 10, 11}),
    "JUPITER": frozenset({2, 5, 7, 9, 11}),
    "VENUS": frozenset({1, 2, 3, 4, 5, 8, 9, 11, 12}),
    "SATURN": frozenset({3, 6, 11}),
    "RAHU": NODE_AXIS_SUPPORTIVE,
    "KETU": NODE_AXIS_SUPPORTIVE,
}


@dataclass(frozen=True)
class PeriodInputs:
    """Values the daily-guidance engine already holds for the day."""

    maha_lord: str
    antar_lord: str
    natal_lagna_rasi: int
    antar_natal_rasi: int  # where the bhukti lord sits natally (nodes read from it)
    sani_cycle: str | None  # classify_sani_cycle type when active
    kandaka_house: int | None  # Saturn's house from the Moon when Kandaka is active
    guru_house: int  # Jupiter's house from the natal Moon today
    saturn_house: int
    rahu_house: int
    antar_transit_house: int  # bhukti lord's house from the natal Moon today


@dataclass(frozen=True)
class PalanPeriod:
    maha_lord: str
    antar_lord: str
    sani_cycle: str | None
    kandaka_house: int | None
    guru_house: int
    saturn_house: int
    rahu_house: int
    antar_houses: tuple[int, ...]
    antar_transit_house: int
    antar_transit_supportive: bool
    text: Bi


def _bhukti_houses(p: PeriodInputs) -> tuple[int, ...]:
    if p.antar_lord in ("RAHU", "KETU"):
        return (chandra_bala(p.natal_lagna_rasi, p.antar_natal_rasi),)
    return tuple(
        h for h in range(1, 13)
        if SIGN_LORD[(p.natal_lagna_rasi + h - 2) % 12 + 1] == p.antar_lord
    )


def _period_notes(p: PeriodInputs) -> dict[str, tuple[Bi, bool]]:
    """Area → (the one clause it gets, whether it caps favourable to mixed).

    Insertion order is the precedence: Sani, then the testing Guru and Rahu
    placements, then the supportive ones. The first layer to claim an area wins.
    """
    notes: dict[str, tuple[Bi, bool]] = {}

    def claim(areas: frozenset[str], note: Bi, caps: bool) -> None:
        for area in sorted(areas):
            notes.setdefault(area, (note, caps))

    if p.sani_cycle in _SANI_LAYER:
        claim(*_SANI_LAYER[p.sani_cycle], True)
    if p.kandaka_house in _KANDAKA_LAYER:
        claim(*_KANDAKA_LAYER[p.kandaka_house], True)
    if p.guru_house in _GURU_TESTING:
        claim(_GURU_TESTING[p.guru_house], _guru_note(p.guru_house, False), True)
    if p.rahu_house in _RAHU_TESTING:
        claim(_RAHU_TESTING[p.rahu_house], _rahu_note(p.rahu_house, False), True)
    if p.guru_house in _GURU_SUPPORT:
        claim(_GURU_SUPPORT[p.guru_house], _guru_note(p.guru_house, True), False)
    if p.rahu_house in _RAHU_SUPPORT:
        claim(_RAHU_SUPPORT[p.rahu_house], _rahu_note(p.rahu_house, True), False)
    return notes


def _houses_phrase(houses: tuple[int, ...]) -> Bi:
    joined = ", ".join(str(h) for h in houses)
    if len(houses) == 1:
        return Bi(f"{joined}-ஆம் இடத்தை", f"house {joined}")
    return Bi(f"{joined}-ஆம் இடங்களை", f"houses {joined}")


def _period(p: PeriodInputs) -> PalanPeriod:
    houses = _bhukti_houses(p)
    supportive = p.antar_transit_house in _GOCHARA_GOOD.get(p.antar_lord, frozenset())
    maha, antar = GRAHA_NAME[p.maha_lord], GRAHA_NAME[p.antar_lord]
    hp = _houses_phrase(houses)
    if p.antar_lord in ("RAHU", "KETU"):
        rule = Bi(
            f"{antar.ta} உங்கள் லக்னத்திலிருந்து {houses[0]}-ஆம் இடத்தில் அமர்ந்திருப்பதால்,",
            f"{antar.en} sits in house {houses[0]} from your lagna, so",
        )
    else:
        rule = Bi(f"{antar.ta} உங்கள் லக்னத்திலிருந்து {hp.ta} ஆள்வதால்,", f"{antar.en} rules {hp.en} from your lagna, so")
    today = (
        Bi("இவற்றுக்கு ஆதரவானது.", "which backs them.")
        if supportive
        else Bi("இவற்றில் சற்று பொறுமை கேட்கிறது.", "which asks for some patience with them.")
    )
    text = Bi(
        f"{maha.ta} தசையில் {antar.ta} புக்தி நடக்கிறது. {rule.ta} அந்த இடம் சார்ந்த விஷயங்கள் இக்காலத்தில் முன்னிலை பெறும். "
        f"இன்று {antar.ta} உங்கள் ராசியிலிருந்து {p.antar_transit_house}-ஆம் இடத்தில் சஞ்சரிப்பது {today.ta}",
        f"You are in {maha.en} dasa, {antar.en} bhukti. {rule.en} those matters come forward this period. "
        f"Today {antar.en} is in house {p.antar_transit_house} from your Moon, {today.en}",
    )
    return PalanPeriod(
        maha_lord=p.maha_lord,
        antar_lord=p.antar_lord,
        sani_cycle=p.sani_cycle,
        kandaka_house=p.kandaka_house,
        guru_house=p.guru_house,
        saturn_house=p.saturn_house,
        rahu_house=p.rahu_house,
        antar_houses=houses,
        antar_transit_house=p.antar_transit_house,
        antar_transit_supportive=supportive,
        text=text,
    )


# ── G. Lucky colour, number and direction (ruling R9) ─────────────────────────
# R9: classical and auditable only, every value naming its rule. So the three
# are not a table of their own: all three belong to ONE graha, named on tap —
#
# * the lord of the hora the reader's best window falls in today. That window
#   is the hero's featured one, which prefers the reader's own lagna and dasha
#   lords (a personal hora), so the graha is chosen by their chart, not by the
#   calendar alone;
# * when the best window is not a hora (Abhijit only), the day's weekday lord.
#
# Colour and direction are that graha's own in Brihat Parashara Hora Shastra
# ch. 3 (colours: copper-red, white, blood-red, green, yellow, white or
# variegated, black; directions: Sun E, Venus SE, Mars S, Rahu SW, Saturn W,
# Moon NW, Mercury N, Jupiter NE). The number is the graha–number table the
# numerology section already uses (`NUMBER_TO_GRAHA`), so the app never gives a
# graha two numbers. "8 is unlucky" is not doctrine here: the numerology rulings
# of 2026-07-25 refuse it, since Saturn is a benefic for many lagnas.
#
# The day's Soolam (the almanac's travel direction to avoid) always wins: a
# graha direction that falls on it is withheld, and the Soolam is named.

GRAHA_COLOUR: dict[str, Bi] = {
    "SUN": Bi("செம்பு சிவப்பு", "copper red"),
    "MOON": Bi("வெள்ளை", "white"),
    "MARS": Bi("சிவப்பு", "red"),
    "MERCURY": Bi("பச்சை", "green"),
    "JUPITER": Bi("மஞ்சள்", "yellow"),
    "VENUS": Bi("வெண்மை அல்லது பல வண்ணம்", "white or many-coloured"),
    "SATURN": Bi("கருப்பு அல்லது கருநீலம்", "black or dark blue"),
}
GRAHA_DIRECTION: dict[str, str] = {
    "SUN": "EAST", "VENUS": "SOUTH_EAST", "MARS": "SOUTH", "RAHU": "SOUTH_WEST",
    "SATURN": "WEST", "MOON": "NORTH_WEST", "MERCURY": "NORTH", "JUPITER": "NORTH_EAST",
}
DIRECTION_NAME: dict[str, Bi] = {
    "EAST": Bi("கிழக்கு", "east"), "SOUTH_EAST": Bi("தென்கிழக்கு", "south-east"),
    "SOUTH": Bi("தெற்கு", "south"), "SOUTH_WEST": Bi("தென்மேற்கு", "south-west"),
    "WEST": Bi("மேற்கு", "west"), "NORTH_WEST": Bi("வடமேற்கு", "north-west"),
    "NORTH": Bi("வடக்கு", "north"), "NORTH_EAST": Bi("வடகிழக்கு", "north-east"),
}
GRAHA_NUMBER: dict[str, int] = {graha: number for number, graha in NUMBER_TO_GRAHA.items()}
# The panchangam carries the Soolam as its Tamil word (SOOLAM_DIRECTION).
_SOOLAM_KEY: dict[str, str] = {"கிழக்கு": "EAST", "மேற்கு": "WEST", "வடக்கு": "NORTH", "தெற்கு": "SOUTH"}


@dataclass(frozen=True)
class PalanLucky:
    graha: str
    source: str  # BEST_HORA | WEEKDAY
    colour: Bi
    number: int
    direction: str | None  # withheld when it falls on the day's Soolam
    soolam: str | None
    basis: Bi


def _lucky(graha: str, source: str, soolam_ta: str | None) -> PalanLucky | None:
    if graha not in GRAHA_COLOUR:
        return None
    name, number = GRAHA_NAME[graha], GRAHA_NUMBER[graha]
    soolam = _SOOLAM_KEY.get(soolam_ta or "")
    own = GRAHA_DIRECTION[graha]
    direction = None if own == soolam else own
    reason = (
        Bi("இன்று உங்கள் சிறந்த நேரத்தின் ஹோரை அதிபதி", "the lord of the hora your best time falls in today")
        if source == "BEST_HORA"
        else Bi("இன்றைய கிழமையின் அதிபதி", "the lord of today's weekday")
    )
    ta = (
        f"நிறம், எண், திசை மூன்றும் {name.ta} கிரகத்தினுடையவை; {name.ta} {reason.ta}. "
        f"நிறமும் திசையும் பிருஹத் பராசர ஹோரா சாஸ்திரம் (அத்தியாயம் 3) கூறும் கிரக நிறம், கிரகத் திசை; "
        f"எண், Vinaadi எண் கணிதப் பகுதி பயன்படுத்தும் கிரக–எண் அட்டவணைப்படி ({name.ta} = {number})."
    )
    en = (
        f"Colour, number and direction all belong to {name.en}, {reason.en}. "
        f"Colour and direction are the graha's own in Brihat Parashara Hora Shastra, ch. 3; "
        f"the number follows the graha–number table Vinaadi's numerology section uses ({name.en} = {number})."
    )
    if direction is None:
        own_name = DIRECTION_NAME[own]
        ta += f" {name.ta} திசை {own_name.ta}; இன்று அதுவே சூலம் என்பதால் அதிர்ஷ்ட திசை சொல்லப்படவில்லை."
        en += f" {name.en}'s direction is {own_name.en}, but that is today's soolam, so no lucky direction is given."
    return PalanLucky(graha, source, GRAHA_COLOUR[graha], number, direction, soolam, Bi(ta, en))


def _lucky_spoken(lucky: PalanLucky) -> Bi:
    ta = f"இன்று உங்களுக்கு அதிர்ஷ்ட நிறம் {lucky.colour.ta}, அதிர்ஷ்ட எண் {lucky.number}"
    en = f"Your lucky colour today is {lucky.colour.en}, your lucky number {lucky.number}"
    if lucky.direction is not None:
        ta += f", அதிர்ஷ்ட திசை {DIRECTION_NAME[lucky.direction].ta}"
        en += f", and your lucky direction {DIRECTION_NAME[lucky.direction].en}"
    ta += "."
    en += "."
    if lucky.soolam is not None:
        ta += f" இன்று சூலம் {DIRECTION_NAME[lucky.soolam].ta}; அத்திசைப் பயணத்தைத் தவிர்ப்பது நல்லது."
        en += f" Today's soolam is {DIRECTION_NAME[lucky.soolam].en}; travel that way is best avoided."
    return Bi(ta, en)


# ── F. Presenter transcript ───────────────────────────────────────────────────
# The same palan, said the way a Tamil TV presenter says a rasipalan: one
# flowing piece, area after area, closing on "இன்று உங்கள் பலம்… கவனிக்க
# வேண்டியது…". It is composed only from the lines above, so it can never say
# something the card does not. Segments, not one string, so a voice reader can
# pause between them and a surface can highlight the one being spoken. The
# greeting (which needs the person's name) is the client's.

_SANI_SPOKEN: dict[str, Bi] = {
    "EZHARAI_SANI_PHASE_1": Bi("ஏழரை சனியின் தொடக்கக் கட்டம்", "the opening phase of Ezharai Sani"),
    "JANMA_SANI": Bi("ஜன்ம சனி", "Janma Sani"),
    "EZHARAI_SANI_PHASE_2": Bi("ஜன்ம சனி", "Janma Sani"),
    "EZHARAI_SANI_PHASE_3": Bi("ஏழரை சனியின் நிறைவுக் கட்டம்", "the closing phase of Ezharai Sani"),
    "ARDHASHTAMA_SANI": Bi("அர்த்தாஷ்டம சனி", "Ardhashtama Sani"),
    "ASHTAMA_SANI": Bi("அஷ்டம சனி", "Ashtama Sani"),
}
_KANDAKA_SPOKEN = Bi("கண்டக சனி", "Kantaka Sani")

# Spoken nouns for "this period brings … forward". A register of its own (the
# chip labels are the client's), so it lives beside the sentence it completes.
_AREA_SPOKEN: dict[str, Bi] = {
    "CAREER": Bi("வேலை", "work"), "BUSINESS": Bi("தொழில்", "business"), "MONEY": Bi("பணம்", "money"),
    "FAMILY": Bi("குடும்பம்", "family"), "LOVE": Bi("உறவு", "relationships"), "HEALTH": Bi("உடல்நலம்", "wellbeing"),
    "EDUCATION": Bi("கல்வி", "studies"), "TRAVEL": Bi("பயணம்", "travel"), "DOCUMENTS": Bi("ஆவணங்கள்", "paperwork"),
    "FRIENDS": Bi("நட்பு", "friendships"), "COMMUNICATION": Bi("பேச்சு", "communication"), "MIND": Bi("மனம்", "state of mind"),
}


@dataclass(frozen=True)
class TranscriptSegment:
    kind: str  # OVERALL | PERIOD | AREA | TIME | STRENGTH | ADVICE | WORSHIP | CLOSING
    text: Bi
    area: str | None = None


def _and_list(words: list[str], conj: str) -> str:
    return words[0] if len(words) == 1 else f"{', '.join(words[:-1])} {conj} {words[-1]}"


def _period_spoken(season: PalanPeriod, dasha_areas: tuple[str, ...]) -> Bi:
    maha, antar = GRAHA_NAME[season.maha_lord], GRAHA_NAME[season.antar_lord]
    sani: list[Bi] = []
    if season.sani_cycle in _SANI_SPOKEN:
        sani.append(_SANI_SPOKEN[season.sani_cycle])
    if season.kandaka_house is not None and season.sani_cycle != "ARDHASHTAMA_SANI":
        sani.append(_KANDAKA_SPOKEN)
    ta = f"தற்போது உங்களுக்கு {maha.ta} தசையில் {antar.ta} புக்தி நடக்கிறது"
    en = f"You are running {antar.en} bhukti in {maha.en} dasa"
    if sani:
        ta += f"; கூடவே {_and_list([s.ta for s in sani], 'மற்றும்')} நடைபெறுகிறது"
        en += f", alongside {_and_list([s.en for s in sani], 'and')}"
    ta += "."
    en += "."
    if dasha_areas:
        ta += f" இக்காலத்தில் {_and_list([_AREA_SPOKEN[a].ta for a in dasha_areas], 'மற்றும்')} சார்ந்த விஷயங்கள் முன்னிலை பெறும்."
        en += f" This period brings {_and_list([_AREA_SPOKEN[a].en for a in dasha_areas], 'and')} to the fore."
    return Bi(ta, en)


def _transcript(
    *,
    overall: Bi,
    season: PalanPeriod | None,
    dasha_areas: tuple[str, ...],
    areas: tuple[PalanArea, ...],
    best_window: tuple[str, str] | None,
    strength: Bi | None,
    watch: Bi | None,
    advice: Bi,
    worship: Bi,
    closing: Bi,
    lucky: PalanLucky | None = None,
) -> tuple[TranscriptSegment, ...]:
    segments = [TranscriptSegment("OVERALL", overall)]
    if season is not None:
        segments.append(TranscriptSegment("PERIOD", _period_spoken(season, dasha_areas)))
    said: set[Bi] = set()
    for area in areas:
        # The Moon line is the house theme; when the headline already said it,
        # a presenter would not say it twice.
        if area.area == "MIND" and area.text.en in overall.en:
            continue
        text = area.text
        if area.period_note is not None and area.period_note not in said:
            said.add(area.period_note)
            text = _join(text, area.period_note)
        segments.append(TranscriptSegment("AREA", text, area.area))
    if best_window is not None:
        start, end = best_window
        segments.append(TranscriptSegment("TIME", Bi(
            f"இன்று {format_clock_label(start, 'ta')} முதல் {format_clock_label(end, 'ta')} வரை உங்களுக்குச் சிறந்த நேரம்.",
            f"Your best stretch today runs from {format_clock_label(start)} to {format_clock_label(end)}.",
        )))
    if strength is not None and watch is not None:
        segments.append(TranscriptSegment("STRENGTH", Bi(
            f"இன்று உங்கள் பலம்: {strength.ta}; கவனிக்க வேண்டியது: {watch.ta}.",
            f"Your strength today: {strength.en}. Watch out for: {watch.en}.",
        )))
    elif strength is not None:
        segments.append(TranscriptSegment("STRENGTH", Bi(f"இன்று உங்கள் பலம்: {strength.ta}.", f"Your strength today: {strength.en}.")))
    elif watch is not None:
        segments.append(TranscriptSegment("STRENGTH", Bi(f"இன்று கவனிக்க வேண்டியது: {watch.ta}.", f"Today, watch out for: {watch.en}.")))
    segments.append(TranscriptSegment("ADVICE", Bi(f"இன்றைய சிறப்பு அறிவுரை: {advice.ta}", f"Today's advice: {advice.en}")))
    if lucky is not None:
        segments.append(TranscriptSegment("LUCKY", _lucky_spoken(lucky)))
    segments.append(TranscriptSegment("WORSHIP", worship))
    segments.append(TranscriptSegment("CLOSING", closing))
    return tuple(segments)


def _area_polarity(area: str, house: int, tara: int, chandrashtama: bool) -> Polarity:
    step = _STEP[_MATRIX[house][AREAS.index(area)]]
    if tara in _TARA_LIFT and area in _TARA_LIFT[tara] and step == 1:
        step = 2
    if tara in _TARA_ADVERSE and area in _ACTION_AREAS and step == 2:
        step = 1
    if tara == 7 and area in {"TRAVEL", "HEALTH"}:
        step = max(0, step - 1)
    if tara == 1 and area in {"MIND", "HEALTH"} and step == 2:
        step = 1
    if chandrashtama:
        # Chandrashtama leads (review §C): nothing reads favourable, and the
        # areas the tradition names — new ventures, money, travel, paperwork,
        # speech, the mind — read caution.
        if area in _ACTION_AREAS or area in {"COMMUNICATION", "MIND"}:
            step = 0
        else:
            step = min(step, 1)
    return _FROM_STEP[step]


_HOUSE_BASE: dict[int, Polarity] = {
    1: F, 2: M, 3: F, 4: C, 5: M, 6: F, 7: F, 8: C, 9: M, 10: F, 11: F, 12: C,
}


def _pulls_against(overall: Polarity, house: int) -> bool:
    return {overall, _HOUSE_BASE[house]} == {F, C}


def _first(areas: tuple[PalanArea, ...], polarity: Polarity) -> str | None:
    hits = {a.area for a in areas if a.polarity == polarity}
    return next((key for key in _PRIORITY if key in hits), None)


def _join(*parts: Bi) -> Bi:
    return Bi(" ".join(p.ta for p in parts), " ".join(p.en for p in parts))


def build_personal_palan(
    *,
    on_date: date,
    natal_moon_rasi: int,
    janma_nakshatra: int,
    day_moon_rasi: int,
    day_nakshatra: int,
    weekday_lord: str,
    label: str,
    is_chandrashtama: bool,
    period: PeriodInputs | None = None,
    best_window: tuple[str, str] | None = None,
    best_hora_lord: str | None = None,
    soolam: str | None = None,
) -> PersonalPalan:
    """Compose the palan from values the daily-guidance engine already holds.

    ``label`` is the hero's verdict label; the overall polarity is read off it
    and nowhere else, so this function cannot contradict the hero. ``period``
    adds the dasha and slow-transit layer (section E); without it the palan is
    the Moon and tara reading alone.
    """
    house = chandra_bala(natal_moon_rasi, day_moon_rasi)
    tara = tara_number(janma_nakshatra, day_nakshatra)
    star_count = (day_nakshatra - janma_nakshatra) % 27 + 1
    tara_note = _TARA_NOTE_TRIAD if tara == 1 and star_count != 1 else _TARA_NOTE[tara]

    areas = tuple(
        PalanArea(area, pol, _AREA_TEXT[area][pol] if area != "MIND" else _HOUSE_THEME[house])
        for area in AREAS
        for pol in (_area_polarity(area, house, tara, is_chandrashtama),)
    )
    mind_text = _MIND_CHANDRASHTAMA if is_chandrashtama else _HOUSE_THEME[house]
    if tara == 1:
        mind_text = _join(mind_text, tara_note)
    areas = tuple(
        PalanArea(a.area, a.polarity, mind_text) if a.area == "MIND" else a for a in areas
    )

    season: PalanPeriod | None = None
    dasha_areas: tuple[str, ...] = ()
    if period is not None:
        season = _period(period)
        dasha_areas = tuple(dict.fromkeys(_BHAVA_AREA[h] for h in season.antar_houses))
        notes = _period_notes(period)
        capped: list[PalanArea] = []
        for a in areas:
            note, caps = notes.get(a.area, (None, False))
            if caps and a.polarity == F:
                # The sentence follows the tag: a capped area reads its mixed
                # line, never a favourable sentence under a "Mixed" tag.
                text = a.text if a.area == "MIND" else _AREA_TEXT[a.area][M]
                capped.append(PalanArea(a.area, M, text, note))
            else:
                capped.append(PalanArea(a.area, a.polarity, a.text, note))
        areas = tuple(capped)

    overall_polarity = _OVERALL_BY_LABEL.get(label, M)
    if is_chandrashtama:
        # The star window and the Moon's rasi can disagree at the edges, so a
        # house theme here could read cheerful beside the Chandrashtama lead.
        overall = _CHANDRASHTAMA_LEAD
    elif _pulls_against(overall_polarity, house):
        # The hero's verdict weighs far more than the Moon; when the Moon's
        # house pulls the other way, the headline keeps the verdict alone and
        # the house result is still read in the Moon/mind line below.
        overall = _OVERALL_LEAD[overall_polarity]
    else:
        overall = _join(_OVERALL_LEAD[overall_polarity], _HOUSE_THEME[house])

    opportunity = None if is_chandrashtama else _first(areas, F)
    caution = _first(areas, C) or (_first(areas, M) if overall_polarity != F else None)
    if is_chandrashtama:
        advice = _ADVICE_CAUTION["MIND"]
    elif caution is not None:
        advice = _ADVICE_CAUTION[caution]
    elif opportunity is not None:
        advice = _ADVICE_OPPORTUNITY[opportunity]
    else:
        advice = _ADVICE_CAUTION["MIND"]

    worship = _WORSHIP.get(weekday_lord.upper(), _WORSHIP["JUPITER"])
    if is_chandrashtama:
        worship = _WORSHIP_CHANDRASHTAMA

    seed = zlib.crc32(f"{on_date.isoformat()}:{janma_nakshatra}".encode())
    closing_bank = _CLOSING[overall_polarity]
    closing = closing_bank[seed % len(closing_bank)]

    tara_ta, tara_en = TARA_NAMES[tara]
    lucky = _lucky(
        (best_hora_lord or weekday_lord).upper(),
        "BEST_HORA" if best_hora_lord else "WEEKDAY",
        soolam,
    )
    basis = _join(
        Bi(
            f"சந்திரன் உங்கள் ஜென்ம ராசியிலிருந்து {house}-ஆம் இடத்தில் உள்ளார்; இது சுமார் இரண்டே கால் நாள் நீடிக்கும்.",
            f"The Moon is in house {house} from your janma rasi, where it stays about two and a quarter days.",
        ),
        tara_note,
    )

    return PersonalPalan(
        content_version=CONTENT_VERSION,
        review_status=REVIEW_STATUS,
        overall_polarity=overall_polarity,
        overall=overall,
        areas=areas,
        advice=advice,
        worship=worship,
        closing=closing,
        strength=_STRENGTH[opportunity] if opportunity else None,
        watch=_WATCH[caution] if caution else None,
        opportunity_area=opportunity,
        caution_area=caution,
        moon_house=house,
        tara=tara,
        tara_name=Bi(tara_ta, tara_en),
        is_chandrashtama=is_chandrashtama,
        basis=basis,
        period=season,
        dasha_areas=dasha_areas,
        transcript=_transcript(
            overall=overall,
            season=season,
            dasha_areas=dasha_areas,
            areas=areas,
            best_window=best_window,
            strength=_STRENGTH[opportunity] if opportunity else None,
            watch=_WATCH[caution] if caution else None,
            advice=advice,
            worship=worship,
            closing=closing,
            lucky=lucky,
        ),
        lucky=lucky,
    )

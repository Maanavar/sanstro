from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NakshatraLens:
    ta: str
    en: str


# Compact, supportive archetype lens lines for all 27 nakshatras.
# These are interpretation overlays only and never alter computed astrology.
NAKSHATRA_LENS: dict[int, NakshatraLens] = {
    1: NakshatraLens(
        ta="Aswini janma nakshatra lens: vegam irundhalum mudivugalai amaidiyudan sei.",
        en="Aswini lens: keep your natural speed, but make decisions with calm pacing.",
    ),
    2: NakshatraLens(
        ta="Bharani janma nakshatra lens: poruppu ungal balam; alavukku mel sumaiyai yetrukkaadhe.",
        en="Bharani lens: responsibility is your strength; avoid carrying more than needed.",
    ),
    3: NakshatraLens(
        ta="Karthigai janma nakshatra lens: thelivu mukkiyam; thevai illadha sandaiyai thaviru.",
        en="Karthigai lens: clarity is key; avoid unnecessary conflict.",
    ),
    4: NakshatraLens(
        ta="Rohini janma nakshatra lens: nilaiyum nalamum serntha nithana nadai inru nanmai tharalaam.",
        en="Rohini lens: steady and grounded effort can bring good outcomes today.",
    ),
    5: NakshatraLens(
        ta="Mirugaseeridam janma nakshatra lens: thedal ungal thanmai; oru nerathil oru seyalthittam.",
        en="Mirugaseeridam lens: curiosity is your gift; focus on one clear task at a time.",
    ),
    6: NakshatraLens(
        ta="Thiruvathirai janma nakshatra lens: aazhamana sindhanaiyai payanpadutthu; adhiga overthinking-ai kuraithidu.",
        en="Thiruvathirai lens: use depth of thought well, while reducing overthinking.",
    ),
    7: NakshatraLens(
        ta="Punarpoosam janma nakshatra lens: thirumba amaikkum sakthi ungalidam ulladhu; nambikkaiyai kaappaatu.",
        en="Punarpoosam lens: you recover and rebuild well; protect your optimism.",
    ),
    8: NakshatraLens(
        ta="Poosam janma nakshatra lens: paramarippu ungal balam; ungal thani nerathaiyum kaappaatu.",
        en="Poosam lens: nurturing is your strength; also preserve your own recovery time.",
    ),
    9: NakshatraLens(
        ta="Ayilyam janma nakshatra lens: unarvu thelivu mukkiyam; maru artham seivadarku mun kelvi ketka.",
        en="Ayilyam lens: emotional clarity matters; ask before assuming intent.",
    ),
    10: NakshatraLens(
        ta="Magam janma nakshatra lens: mariyadhaiyum panivum serntha nadavadikkai inru migavum payanulladhu.",
        en="Magam lens: dignity with humility is especially effective today.",
    ),
    11: NakshatraLens(
        ta="Pooram janma nakshatra lens: uravugalil inbam irukkattum, aana varambugal thelivaga irukkattum.",
        en="Pooram lens: enjoy connection, while keeping boundaries clear.",
    ),
    12: NakshatraLens(
        ta="Uthiram janma nakshatra lens: oppandham, poruppu, mudivu - ivatrail neethi nilaiyai pidithu nadakka.",
        en="Uthiram lens: in commitments and decisions, hold firm to fairness.",
    ),
    13: NakshatraLens(
        ta="Hastham janma nakshatra lens: kaiyil ulladhai nandraaga mudikka; adhiga multitasking-ai thaviru.",
        en="Hastham lens: finish what is in your hands well; avoid excessive multitasking.",
    ),
    14: NakshatraLens(
        ta="Chithirai janma nakshatra lens: tharam mukkiyam; perfectionism-ai alavukku ullae vaithu sei.",
        en="Chithirai lens: quality matters; keep perfectionism within healthy limits.",
    ),
    15: NakshatraLens(
        ta="Swathi janma nakshatra lens: suya nilaiyai kaappaatum bodhuvum uravugalil inakkam kaappaatu.",
        en="Swathi lens: preserve independence while maintaining harmony in relationships.",
    ),
    16: NakshatraLens(
        ta="Visakam janma nakshatra lens: ilakku balam ulladhu; avasarathai vida nilaiyana munneram thedu.",
        en="Visakam lens: your goal focus is strong; choose steady progress over haste.",
    ),
    17: NakshatraLens(
        ta="Anusham janma nakshatra lens: natpu, anbu, anushasanam - moondrum samamaaga nadathinaal inru nanmai.",
        en="Anusham lens: friendship, warmth, and discipline in balance can support today.",
    ),
    18: NakshatraLens(
        ta="Kettai janma nakshatra lens: balathudan pesu, aana urudhiyai karunaiyudan serthu velipaduththu.",
        en="Kettai lens: speak with strength, but pair firmness with compassion.",
    ),
    19: NakshatraLens(
        ta="Moolam janma nakshatra lens: veru karanathai purindhu thirutham seyyum nadai inru mikka payanulladhu.",
        en="Moolam lens: root-cause understanding and correction are highly useful today.",
    ),
    20: NakshatraLens(
        ta="Pooradam janma nakshatra lens: nambikkai ungal urudhi; aana sollum seyalum onraaga irukka vendum.",
        en="Pooradam lens: conviction is your strength; keep words and actions aligned.",
    ),
    21: NakshatraLens(
        ta="Uthiradam janma nakshatra lens: thaamadham irundhaalum nilaiyana vetri varum; porumaiyum ozhukkamum pidithu nadakka.",
        en="Uthiradam lens: results may be delayed but durable; stay with discipline and patience.",
    ),
    22: NakshatraLens(
        ta="Thiruvonam janma nakshatra lens: kettu purindhu seyyum thiran inru ungalukku valuvana aadharavu.",
        en="Thiruvonam lens: listening carefully before acting gives you strong support today.",
    ),
    23: NakshatraLens(
        ta="Avittam janma nakshatra lens: kuzhu seyalgalil rhythm kaappaatu; over-commit seivathai kuraithidu.",
        en="Avittam lens: keep rhythm in team efforts; reduce over-commitment.",
    ),
    24: NakshatraLens(
        ta="Sadayam janma nakshatra lens: pudhu yosanaigalai varaverka, aana unmai saripaarppuudan munneru.",
        en="Sadayam lens: welcome new ideas, and move forward with verification.",
    ),
    25: NakshatraLens(
        ta="Poorattathi janma nakshatra lens: aazhamana paarvai ungal balam; manadhaara oivukku neram kodu.",
        en="Poorattathi lens: deep insight is your strength; give the mind recovery space.",
    ),
    26: NakshatraLens(
        ta="Uthirattathi janma nakshatra lens: nithanam, neenda paarvai, poruppu - inru ivai moolam nalla nadai varalaam.",
        en="Uthirattathi lens: patience, long view, and responsibility can carry the day.",
    ),
    27: NakshatraLens(
        ta="Revathi janma nakshatra lens: karunaiyum vazhikaattudhalum ungal balam; varambaiyum urudhiyaaga kaappaatu.",
        en="Revathi lens: compassion and guidance are your strengths; keep boundaries firm.",
    ),
}

DEFAULT_LENS = NakshatraLens(
    ta="Janma nakshatra lens: amaidiyana, nilaiyana nadai inru nanmaiyai perukka udavum.",
    en="Janma nakshatra lens: a calm, steady approach can improve today.",
)


def build_nakshatra_perspective(nakshatra_number: int, score_label: str) -> NakshatraLens:
    base = NAKSHATRA_LENS.get(nakshatra_number, DEFAULT_LENS)

    if score_label in {"CAUTION", "RESTORATIVE"}:
        return NakshatraLens(
            ta=f"{base.ta} Inru periya mudivugalai vida siru, urudhiyaana seyalgalai munneru.",
            en=f"{base.en} Today, prefer small and stable steps over major new commitments.",
        )

    if score_label in {"STRONG_SUPPORT", "GOOD"}:
        return NakshatraLens(
            ta=f"{base.ta} Inru nalla nerangalil mukkiya seyalgalai mudhalil nirvaagam seyyalaam.",
            en=f"{base.en} Use supportive windows first for your highest-priority actions today.",
        )

    return base


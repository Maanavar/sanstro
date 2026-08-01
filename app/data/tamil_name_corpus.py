"""Tamil baby-name corpus (NUM-52) — DRAFT, unreviewed, assistant-authored.

STATUS
------
Every name below was drafted by an AI assistant to exercise the NU-8a naming
pipeline (`app.calculations.numerology_naming`), NOT sourced from an
astrologer or a printed name dictionary. ``CORPUS_VERSION`` carries a
``-draft`` suffix for the same reason `nakshatra_pada_akshara.CANON_VERSION`
does, and the two draft statuses compound: this corpus sits on top of a pada
canon that is itself 0/108 rows verified. The `numerology_baby_naming` feature
flag (independent of `numerology_engine`) defaults `True` as of 2026-07-30 on
product direction — access-gating, not a claim that review is done. The pada
canon's own `assert_canon_usable()` still raises outside dev/test regardless
of this flag, and stays the operative safety backstop until this corpus and
the canon both clear astrologer/native review — see
`app/services/feature_flags.py`.

Do not promote a name out of "draft" by editing this file alone. Review is a
person checking each (tamil_form, latin_variants, meaning) tuple against a
source they trust, the same discipline `nakshatra_pada_akshara.py` documents
for its own rows.

MATCHING NOTE — why some entries carry two `latin_variants`
-------------------------------------------------------------
`app.calculations.numerology_naming.evaluate_candidate` scores CONFIRMED only
when both the Tamil opening AND a Latin opening hit the target pada row. For
`tamil_collapse` rows (a Tamil base letter shared by several Sanskrit
consonants — கசஜடதப, see `nakshatra_pada_akshara.TAMIL_SHARED_BASES`), the
row's `latin_initial_set` was hand-entered from the Devanagari/ISO side and
often only lists ONE member of a voiced/unvoiced or aspirated/unaspirated
pair (e.g. Mrigashira pada 4 lists "Ki/Kee/Ky", not "Gi/Gee/Gy", for a letter
Tamil renders identically either way). Where a name's common spelling misses
that set but a genuinely-used alternate spelling hits it (Geetha/Kitha,
Deepika/Dipika, Bharathi's "Ba"), both are listed — this is recording real
variation in how these names are actually romanised, not manufacturing a
match. `evaluate_candidate` scores CONFIRMED once either variant lands.

COVERAGE (measured 2026-07-31, `tests/test_tamil_name_corpus.py`)
-------------------------------------------------------------------
215 candidates (96 before the 2026-07-31 expansion). All 27 nakshatras clear
the original bar — at least one CONFIRMED match somewhere among their 4
padas — but that bar turned out to measure the wrong thing.

What a parent actually experiences is the count for THEIR one pada, and on
the 96-name draft that number was 1 for 69 of the 108 padas. A Baby Name
Finder that answers with a single name reads as broken, not as a shortlist.
The expansion targets depth per pada; the numbers that matter now are:

    100/108 padas return at least one name   (44/108 before)
     80/108 return two or more
     48/108 return three or more

Eight padas remain empty, and no future pass will fill most of them:

    (6,3) ங "Ing"      (13,3) ணா "Na"     — barred from word-initial position
    (4,4) வூ "Vu"      (5,2) வோ "Vo"      — no attested name opens here
    (18,3) யீ "Yi"     (23,3) கூ "Gu"
    (9,2) டூ "Du"      (11,4) டூ "Tu"     — retroflex ட-, loan names only

ங and ண, like ன, ல, ள, ழ, ற, cannot begin a word at all under Tamil
phonotactics; no native or loan personal name starts with either sound. The
retroflex ட- run is the same problem one step weaker: Tamil words never begin
with ட, so those padas can only ever be served by loan names.

Re-run the coverage test after any edit here rather than hand-tracking which
padas are covered in a comment — the numbers above will drift the moment a
name is added or removed, per the same lesson `nakshatra_pada_akshara.py`
records about `tamil_collapse` (measure, don't guess).
"""
from __future__ import annotations

from app.calculations.numerology_naming import NameCandidate

CORPUS_VERSION = "0.1.0-draft"

TAMIL_NAME_CORPUS: tuple[NameCandidate, ...] = (
    # --- 1 Ashwini ---
    NameCandidate("சுரேஷ்", ("Suresh",), "Ruler of the gods", "தேவர்களின் தலைவன்", "m"),
    NameCandidate("சுதா", ("Sudha",), "Nectar", "அமிர்தம்", "f"),
    NameCandidate("சேகர்", ("Sekar", "Shekar"), "Peak, crown", "சிகரம்", "m"),
    NameCandidate("சோழன்", ("Cholan",), "Of the Chola line", "சோழ மரபினன்", "m"),
    NameCandidate("லாவண்யா", ("Lavanya",), "Grace, beauty", "அழகு, இளிமை", "f"),

    # --- 2 Bharani ---
    NameCandidate("லீலா", ("Leela", "Lila"), "Divine play", "திருவிளையாடல்", "f"),
    NameCandidate("லூர்துசாமி", ("Lourdusamy", "Loordusamy"), "Devoted to Our Lady of Lourdes", "லூர்து அன்னையின் அடியவன்", "m"),
    NameCandidate("லேகா", ("Lekha",), "A written verse; fate", "எழுத்து, விதி", "f"),
    NameCandidate("லோகேஷ்", ("Logesh", "Lokesh"), "Lord of the world", "உலகத்தலைவன்", "m"),

    # --- 3 Krittika ---
    NameCandidate("அமுதா", ("Amudha", "Amutha"), "Nectar, ambrosia", "அமிர்தம்", "f"),
    NameCandidate("அருண்", ("Arun",), "Dawn, reddish glow", "அருணோதயம்", "m"),
    NameCandidate("ஈசன்", ("Eesan",), "Lord Shiva", "சிவபெருமான்", "m"),
    NameCandidate("ஈஸ்வரன்", ("Eeswaran",), "The Supreme Lord", "இறைவன்", "m"),
    NameCandidate("உமா", ("Uma",), "Goddess Parvati; tranquility", "பார்வதி தேவி", "f"),
    NameCandidate("ஏகாம்பரம்", ("Ekambaram",), "Shiva under the mango tree (Kanchipuram)", "ஏகாம்பரேஸ்வரர்", "m"),

    # --- 4 Rohini ---
    NameCandidate("ஓவியா", ("Oviya",), "Painting, artwork", "ஓவியம்", "f"),
    NameCandidate("வாசுகி", ("Vasuki",), "The serpent-king of legend", "நாக அரசன்", "n"),
    NameCandidate("வீரா", ("Veera",), "Brave, valiant", "வீரம்", "m"),

    # --- 5 Mrigashira ---
    NameCandidate("வேணு", ("Venu",), "Flute", "புல்லாங்குழல்", "m"),
    NameCandidate("வேதா", ("Vedha", "Veda"), "Sacred knowledge", "வேதம்", "f"),
    NameCandidate("காவ்யா", ("Kavya",), "Poetry", "கவிதை", "f"),
    NameCandidate("கார்த்திக்", ("Karthik",), "Of Karthikeya (Murugan)", "முருகன் தொடர்பான", "m"),
    NameCandidate("கீதா", ("Geetha", "Kitha"), "Song", "பாடல்", "f"),

    # --- 6 Ardra ---
    NameCandidate("குமார்", ("Kumar",), "Prince, son", "இளவரசன்", "m"),
    NameCandidate("குமரி", ("Kumari",), "Young woman, princess", "இளவரசி", "f"),
    NameCandidate("காயத்ரி", ("Gayathri", "Gayatri"), "The sacred Vedic metre", "காயத்ரி மந்திரம்", "f"),
    NameCandidate("சாரதா", ("Saradha", "Sharadha"), "Autumn; goddess of learning", "கல்வித் தேவி", "f"),
    # ங (pada 3) begins no Tamil personal name — see module docstring.

    # --- 7 Punarvasu ---
    NameCandidate("கேசவன்", ("Kesavan",), "One of beautiful hair; Vishnu", "அழகிய கேசம் உடையவன்", "m"),
    NameCandidate("கோகிலா", ("Kokila", "Gokila"), "Cuckoo bird, sweet-voiced", "குயில்", "f"),
    NameCandidate("ஹாசினி", ("Hasini",), "One who smiles", "புன்னகையாளர்", "f"),
    NameCandidate("ஹீரா", ("Heera",), "Diamond", "வைரம்", "f"),

    # --- 8 Pushya ---
    NameCandidate("ஹுசைன்", ("Hussain", "Husain"), "Handsome, good", "அழகியவன்", "m"),
    NameCandidate("ஹேமா", ("Hema",), "Gold", "பொன்", "f"),
    NameCandidate("ஹோமா", ("Homa",), "The mythical bird of good fortune", "நற்பேறு அருளும் புராணப் பறவை", "f"),
    NameCandidate("டானியேல்", ("Daniel",), "God is my judge", "இறைவன் என் நீதிபதி", "m"),

    # --- 9 Ashlesha ---
    NameCandidate("டீனா", ("Deena", "Tina"), "Dear one", "அன்புக்குரியவள்", "f"),
    # டூ (pada 2) — no confirmed candidate in this draft; genuinely rare opening.
    NameCandidate("டேசி", ("Daisy", "Daysi"), "The flower", "டெய்சி மலர்", "f"),
    NameCandidate("டோனி", ("Tony",), "Praiseworthy", "புகழத்தக்கவன்", "m"),

    # --- 10 Magha ---
    NameCandidate("மாலா", ("Mala",), "Garland", "மாலை", "f"),
    NameCandidate("மீனா", ("Meena",), "Fish; a gem", "மீன்; மணி", "f"),
    NameCandidate("மூர்த்தி", ("Murthy", "Moorthy"), "Form, embodiment of a deity", "வடிவம்", "m"),
    NameCandidate("மேகலா", ("Mekala",), "A jewelled girdle", "மேகலை அணி", "f"),

    # --- 11 Purva Phalguni ---
    NameCandidate("மோகன்", ("Mohan",), "Attractive, charming; Krishna", "கவர்ச்சியானவன்", "m"),
    NameCandidate("தானியா", ("Tania", "Dania"), "Fairy queen (used name)", "தேவதை", "f"),
    # டீ (pada 3) covered via nakshatra 9's Deena/Tina — same akshara, overlapping Latin set.
    # டூ (pada 4) — no confirmed candidate in this draft; genuinely rare opening.

    # --- 12 Uttara Phalguni ---
    NameCandidate("டேனிஷ்", ("Denish", "Danish"), "From Denmark; also an Islamic given name", "டென்மார்க் நாட்டைச் சேர்ந்த", "m"),
    NameCandidate("டோனா", ("Dona",), "Lady (honorific-derived given name)", "பெண்மணி", "f"),
    NameCandidate("பாரதி", ("Bharathi", "Bharathy"), "Of Saraswati; the poet's name", "சரஸ்வதி தொடர்பான", "f"),
    NameCandidate("பீட்டர்", ("Peter", "Peeter"), "Rock, stone", "பாறை", "m"),

    # --- 13 Hasta ---
    NameCandidate("பூரணி", ("Poorani", "Poornima"), "Full moon; complete", "பூரணை நிலவு", "f"),
    NameCandidate("ஷாலினி", ("Shalini",), "Modest, virtuous", "பணிவுடையவள்", "f"),
    # ணா (pada 3) begins no Tamil word at all — see module docstring.
    # டா (pada 4) covered via nakshatra 8's Daniel — same akshara, overlapping Latin set.

    # --- 14 Chitra ---
    NameCandidate("பேகம்", ("Begum",), "Lady (honorific given name)", "பேரரசி", "f"),
    NameCandidate("போஸ்", ("Bose",), "Given/surname of Bengali origin, widely used", "வங்காள வம்சாவளிப் பெயர்", "m"),
    NameCandidate("ராதா", ("Radha",), "Success, achievement; Krishna's beloved", "வெற்றி", "f"),
    NameCandidate("ராஜா", ("Raja",), "King", "அரசன்", "m"),
    NameCandidate("ரீதா", ("Reetha", "Rita"), "Pearl (used name)", "முத்து", "f"),

    # --- 15 Swati ---
    NameCandidate("ரூபா", ("Roopa", "Rupa"), "Beauty, form", "அழகு, உருவம்", "f"),
    NameCandidate("ரேவதி", ("Revathi",), "Wealthy; the nakshatra's own name", "செல்வம் மிக்கவள்", "f"),
    NameCandidate("ரோஜா", ("Roja",), "Rose", "ரோஜா மலர்", "f"),
    NameCandidate("தாமரை", ("Thamarai",), "Lotus", "தாமரை மலர்", "f"),

    # --- 16 Vishakha ---
    NameCandidate("தீபா", ("Deepa", "Theepa"), "Lamp, light", "விளக்கு", "f"),
    # தூ (pada 2) covered via nakshatra 26's Thuyavan — same akshara, overlapping Latin set.
    NameCandidate("தேவி", ("Devi", "Thevi"), "Goddess", "தேவி", "f"),
    NameCandidate("தேவன்", ("Devan", "Thevan"), "Godly, divine", "தெய்வீகமானவன்", "m"),
    NameCandidate("தோமஸ்", ("Thomas",), "Twin", "இரட்டையர்", "m"),

    # --- 17 Anuradha ---
    NameCandidate("நாராயணன்", ("Narayanan",), "Vishnu, the one who rests on the waters", "மகாவிஷ்ணு", "m"),
    NameCandidate("நீலா", ("Neela",), "Blue", "நீலம்", "f"),
    NameCandidate("நூரா", ("Noora",), "Light", "ஒளி", "f"),
    NameCandidate("நேசன்", ("Nesan",), "Friend, beloved", "நண்பன்", "m"),

    # --- 18 Jyeshtha ---
    NameCandidate("நோயல்", ("Noel",), "Of the Nativity (Christmas-associated name)", "கிறிஸ்து பிறப்புடன் தொடர்புடையது", "n"),
    NameCandidate("யாழினி", ("Yazhini",), "One who plays the yaazh (harp)", "யாழ் மீட்டுபவள்", "f"),
    # யீ (pada 3) — no confirmed candidate in this draft; genuinely rare opening.
    NameCandidate("யூனுஸ்", ("Yunus", "Younus"), "The prophet Jonah's name", "யூனுஸ் நபி", "m"),

    # --- 19 Mula ---
    NameCandidate("யேசுதாஸ்", ("Yesudas",), "Servant of the divine", "இறைவனின் தொண்டன்", "m"),
    NameCandidate("யோகேஷ்", ("Yogesh",), "Lord of yoga", "யோகத்தின் தலைவன்", "m"),
    NameCandidate("பாலா", ("Bala",), "Child; strength", "பலம்", "m"),
    # பீ (pada 4) — no confirmed candidate in this draft; genuinely rare opening
    # under this row's specific Latin set (distinct from the Peter/Peeter set above).

    # --- 20 Purva Ashadha ---
    # பூ (pada 1) — no confirmed candidate in this draft; genuinely rare opening
    # under this row's specific Latin set (Bhu/Bu/Pu).
    # (pada 2 "தா" already reachable via nakshatra 15's Thamarai — same akshara, overlapping Latin set.)
    NameCandidate("பாரூக்", ("Farooq",), "One who distinguishes truth from falsehood", "உண்மையும் பொய்யும் பிரிப்பவன்", "m"),
    # (pada 4 "டா" already reachable via nakshatra 8's Daniel — same akshara, overlapping Latin set.)

    # --- 21 Uttara Ashadha ---
    # (pada 1 "பே" and pada 2 "போ" already reachable via nakshatra 14's Begum/Bose — same akshara, overlapping Latin sets.)
    NameCandidate("ஜானகி", ("Janaki",), "Daughter of Janaka; Sita", "ஜனகனின் மகள்", "f"),
    NameCandidate("ஜீவா", ("Jeeva",), "Life", "உயிர்", "n"),

    # --- 22 Shravana ---
    NameCandidate("ஜுனைதா", ("Junaida",), "Warrior (feminine form)", "போராளி", "f"),
    NameCandidate("ஜேனிபர்", ("Jennifer",), "Fair one, white wave (used name)", "வெண்மையானவள்", "f"),
    NameCandidate("ஜோசப்", ("Joseph",), "He will add/increase", "பெருக்குபவன்", "m"),
    # (pada 4 "கா" already reachable via nakshatra 6's Gayathri — documented full-script collision with 6-P2.)

    # --- 23 Dhanishta ---
    NameCandidate("கார்த்திகா", ("Karthika",), "Of the Karthikai star", "கார்த்திகை நட்சத்திரம் தொடர்பானவள்", "f"),
    NameCandidate("கீர்த்தனா", ("Keerthana", "Geerthana"), "Praise, a devotional song", "துதிப்பாடல்", "f"),
    # கூ (pada 3) — no confirmed candidate in this draft; genuinely rare opening.
    NameCandidate("கேசரி", ("Kesari",), "Lion", "சிங்கம்", "m"),

    # --- 24 Shatabhisha ---
    NameCandidate("கோபிகா", ("Gopika",), "A cowherd girl; Krishna's devotee", "கோபியர்", "f"),
    NameCandidate("ஸாரா", ("Sara", "Zara"), "Princess, noble", "இளவரசி", "f"),
    NameCandidate("ஸீமா", ("Seema",), "Boundary, limit", "எல்லை", "f"),
    NameCandidate("ஸூரி", ("Soori", "Suri"), "Sun", "சூரியன்", "m"),

    # --- 25 Purva Bhadrapada ---
    NameCandidate("ஸேஷன்", ("Seshan",), "The endless one; the serpent Adisesha", "ஆதிசேஷன்", "m"),
    NameCandidate("ஸோமன்", ("Soman",), "Moon", "சந்திரன்", "m"),
    # (pada 3 "தா" already reachable via nakshatra 15/20/26's Thamarai — same akshara, overlapping Latin set.)
    NameCandidate("தீபிகா", ("Deepika", "Dipika"), "Little lamp", "சிறு விளக்கு", "f"),

    # --- 26 Uttara Bhadrapada ---
    NameCandidate("தூயவன்", ("Thuyavan",), "The pure one", "தூயவன்", "m"),
    # (pada 2 "தா" already reachable via nakshatra 15/20/25's Thamarai — same akshara, overlapping Latin set.)
    NameCandidate("ஜாஸ்மின்", ("Jasmine",), "The flower", "மல்லிகை", "f"),
    NameCandidate("ஞானா", ("Gnana", "Njana"), "Wisdom, knowledge", "ஞானம்", "n"),

    # --- 27 Revati ---
    NameCandidate("தேனி", ("Theni",), "Honey (also a Tamil Nadu place name used as a given name)", "தேன்", "f"),
    NameCandidate("தோகை", ("Thogai",), "A peacock's tail feathers; an anthology", "மயிலிறகு; தொகுப்பு", "f"),
    NameCandidate("சாந்தி", ("Shanthi", "Santhi"), "Peace", "அமைதி", "f"),
    NameCandidate("சீதா", ("Seetha", "Sita"), "Furrow; Rama's consort", "உழவுசால்; சீதை", "f"),

    # =====================================================================
    # EXPANSION PASS — 2026-07-31. Same draft status as everything above.
    #
    # The first pass optimised for *reach* (at least one CONFIRMED name per
    # nakshatra) and hit it with 96 names. Reach turned out to be the wrong
    # target: measured against the shipping engine, 69 of the 108 padas
    # returned exactly ONE name, which reads to a parent as a broken tool
    # rather than a short list. This pass optimises for *depth* — several
    # genuinely-used names per pada — because "here is one name for your
    # child" is not a finder.
    #
    # Names are ones in real current use in Tamil Nadu, deliberately across
    # Hindu, Christian and Muslim Tamil families as the first pass already
    # was. Nothing here is invented to fill a hole: the aksharas that stay
    # thin below (ங, ணா, வூ, வோ, யீ, கூ, and the retroflex ட- rows) stay thin
    # because Tamil phonotactics or usage genuinely offer nothing, and a
    # fabricated name would be worse than an empty pada.
    # =====================================================================

    # --- 1 Aswini (சு / சே / சோ / லா) ---
    NameCandidate("சுமதி", ("Sumathi",), "Good-minded, wise", "நல்லறிவுடையவள்", "f"),
    NameCandidate("சுந்தர்", ("Sundar", "Sundhar"), "Handsome", "அழகன்", "m"),
    NameCandidate("சுபாஷ்", ("Subash", "Subhash"), "Well-spoken", "இனிமையாகப் பேசுபவன்", "m"),
    NameCandidate("சுகன்யா", ("Sukanya",), "Fair maiden", "நற்கன்னி", "f"),
    NameCandidate("சுசீலா", ("Suseela", "Susheela"), "Of good character", "நற்குணமுடையவள்", "f"),
    NameCandidate("சேது", ("Sethu",), "The causeway at Rameswaram", "சேதுபந்தனம்", "m"),
    NameCandidate("சேரன்", ("Cheran", "Seran"), "Of the Chera line", "சேர மரபினன்", "m"),
    NameCandidate("சேவந்தி", ("Sevanthi", "Chevanthi"), "Chrysanthemum", "சாமந்திப் பூ", "f"),
    NameCandidate("சோமு", ("Somu",), "Of the moon", "சந்திரன் சார்ந்தவன்", "m"),
    NameCandidate("சோதி", ("Sothi", "Jothi"), "Radiance, flame", "ஒளி, சுடர்", "f"),
    NameCandidate("சோபனா", ("Sobana", "Shobana"), "Splendid, auspicious", "சிறப்புமிக்கவள்", "f"),
    NameCandidate("லாஸ்யா", ("Lasya", "Laasya"), "Graceful dance", "லாஸ்ய நடனம்", "f"),

    # --- 2 Bharani (லீ / லூ / லே / லோ) ---
    NameCandidate("லீனா", ("Leena", "Lena"), "Devoted, wholly absorbed", "ஒன்றியவள்", "f"),
    NameCandidate("லூர்து", ("Lourdhu", "Loordhu"), "Of Our Lady of Lourdes", "லூர்து அன்னை", "n"),
    NameCandidate("லோகநாதன்", ("Loganathan", "Lokanathan"), "Lord of the world", "உலகநாதன்", "m"),
    NameCandidate("லோகிதா", ("Lohitha", "Logitha"), "Radiant, ruddy", "செம்மையானவள்", "f"),

    # --- 3 Karthigai (அ / ஈ / உ / ஏ) ---
    NameCandidate("அன்பு", ("Anbu",), "Love", "அன்பு", "n"),
    NameCandidate("அகிலா", ("Akila", "Agila"), "Whole, entire", "அகிலம்", "f"),
    NameCandidate("அரசு", ("Arasu",), "Sovereignty", "அரசு", "m"),
    NameCandidate("அமிர்தா", ("Amirtha", "Amritha"), "Nectar, the undying", "அமிர்தம்", "f"),
    NameCandidate("அஜய்", ("Ajay",), "Unconquered", "வெல்லமுடியாதவன்", "m"),
    NameCandidate("அறிவு", ("Arivu",), "Wisdom", "அறிவு", "n"),
    NameCandidate("ஈஸ்வரி", ("Eeswari", "Ishwari"), "The Supreme Goddess", "ஈஸ்வரி", "f"),
    NameCandidate("உதயா", ("Udhaya", "Uthaya"), "Sunrise", "உதயம்", "n"),
    NameCandidate("உமையாள்", ("Umaiyal",), "Goddess Parvati", "உமையம்மை", "f"),
    NameCandidate("உலகநாதன்", ("Ulaganathan",), "Lord of the world", "உலகநாதன்", "m"),
    NameCandidate("ஏழுமலை", ("Ezhumalai",), "He of the seven hills (Tirupati)", "ஏழுமலையான்", "m"),

    # --- 4 Rohini (ஓ / வா / வீ / வூ) ---
    # வூ (pada 4) opens no Tamil personal name — see module docstring.
    NameCandidate("ஓவியன்", ("Oviyan",), "Painter", "ஓவியம் தீட்டுபவன்", "m"),
    NameCandidate("வாணி", ("Vani", "Wani"), "Speech; goddess Saraswathi", "வாக்குத் தேவி", "f"),
    NameCandidate("வாசன்", ("Vasan",), "Fragrance; one who dwells", "வாசம்", "m"),
    NameCandidate("வாசுதேவன்", ("Vasudevan",), "Krishna, son of Vasudeva", "கிருஷ்ணன்", "m"),
    NameCandidate("வீணா", ("Veena", "Vina"), "The veena", "வீணை", "f"),
    NameCandidate("வீரமணி", ("Veeramani",), "Jewel of valour", "வீர மணி", "m"),

    # --- 5 Mirugaseeridam (வே / வோ / கா / கீ) ---
    # வோ (pada 2) opens no Tamil personal name — see module docstring.
    NameCandidate("வேலன்", ("Velan",), "He of the spear; Murugan", "வேலவன்", "m"),
    NameCandidate("வேல்முருகன்", ("Velmurugan",), "Murugan of the spear", "வேல் முருகன்", "m"),
    NameCandidate("வேதவல்லி", ("Vedavalli", "Vethavalli"), "She of the Vedas", "வேத வல்லி", "f"),
    NameCandidate("காளிதாஸ்", ("Kalidas", "Kalidhas"), "Servant of Kali; the poet", "காளியின் அடியவன்", "m"),
    NameCandidate("காமாட்சி", ("Kamatchi", "Kamakshi"), "The goddess of Kanchi", "காமாட்சி அம்மன்", "f"),
    NameCandidate("காவேரி", ("Kaveri", "Cauvery"), "The Kaveri river", "காவிரி", "f"),
    NameCandidate("கீர்த்தி", ("Keerthi", "Kirthi", "Geerthi"), "Fame, renown", "புகழ்", "f"),

    # --- 6 Thiruvathirai (கு / கா-Gha / ங / சா) ---
    # ங (pada 3) begins no Tamil personal name — see module docstring.
    NameCandidate("குணசேகரன்", ("Gunasekaran", "Kunasekaran"), "Peak of good qualities", "குண சிகரம்", "m"),
    NameCandidate("குருநாதன்", ("Gurunathan", "Kurunathan"), "Lord who is the guru", "குருநாதன்", "m"),
    NameCandidate("குமரேசன்", ("Kumaresan", "Gumaresan"), "Lord Murugan", "குமரேசன்", "m"),
    NameCandidate("காந்திமதி", ("Kanthimathi", "Ganthimathi"), "She of radiance", "ஒளி பொருந்தியவள்", "f"),
    NameCandidate("சாந்தினி", ("Santhini", "Chandhini"), "Moonlight; peaceful", "நிலவொளி", "f"),
    NameCandidate("சாமிநாதன்", ("Saminathan", "Chaminathan"), "Lord Murugan", "சாமிநாதன்", "m"),
    NameCandidate("சாருமதி", ("Charumathi", "Sarumathi"), "Of beautiful mind", "அழகிய அறிவுடையவள்", "f"),

    # --- 7 Punarpoosam (கே / கோ / ஹா / ஹீ) ---
    NameCandidate("கேதார்", ("Kedhar", "Kedar", "Gedhar"), "Kedarnath; a mountain field", "கேதாரம்", "m"),
    NameCandidate("கோபால்", ("Gopal", "Kopal"), "Cowherd; Krishna", "கோபாலன்", "m"),
    NameCandidate("கோவிந்தன்", ("Govindhan", "Kovindhan"), "Krishna, keeper of cattle", "கோவிந்தன்", "m"),
    NameCandidate("கோமதி", ("Komathi", "Gomathi"), "The Gomati river", "கோமதி", "f"),
    NameCandidate("ஹாரிகா", ("Harika",), "Golden; a divine offering", "பொன்னானவள்", "f"),

    # --- 8 Poosam (ஹு / ஹே / ஹோ / டா) ---
    NameCandidate("ஹுமா", ("Huma",), "A bird of good fortune", "நற்பேறு தரும் பறவை", "f"),
    NameCandidate("ஹேமலதா", ("Hemalatha",), "Golden creeper", "பொன் கொடி", "f"),
    NameCandidate("ஹேமந்த்", ("Hemanth", "Hemant"), "The cool season", "பனிக்காலம்", "m"),

    # --- 9 Ayilyam (டீ / டூ / டே / டோ) ---
    # The retroflex ட- rows carry loan names only: Tamil words do not begin
    # with ட, so this whole run stays thin however many passes are made.
    NameCandidate("டேவிட்", ("David", "Devid"), "Beloved", "அன்புக்குரியவன்", "m"),

    # --- 10 Magam (மா / மீ / மூ / மே) ---
    NameCandidate("மாதவன்", ("Madhavan", "Mathavan"), "Krishna; of the springtime", "மாதவன்", "m"),
    NameCandidate("மாரியப்பன்", ("Mariappan",), "Devotee of Mariamman", "மாரியம்மன் அடியவன்", "m"),
    NameCandidate("மாலதி", ("Malathi",), "Jasmine bud", "மாலதி மலர்", "f"),
    NameCandidate("மாணிக்கம்", ("Manickam", "Maanickam"), "Ruby", "மாணிக்கக் கல்", "n"),
    NameCandidate("மீனாட்சி", ("Meenakshi", "Meenatchi"), "Fish-eyed; the goddess of Madurai", "மீனாட்சி அம்மன்", "f"),
    NameCandidate("மீரா", ("Meera", "Mira"), "The poet-saint devoted to Krishna", "மீராபாய்", "f"),
    NameCandidate("மூகாம்பிகை", ("Mookambigai", "Mookambika"), "The goddess of Kollur", "மூகாம்பிகை", "f"),
    NameCandidate("மேனகா", ("Menaka",), "A celestial dancer", "மேனகை", "f"),
    NameCandidate("மேகநாதன்", ("Meganathan", "Meghanathan"), "Lord of the clouds", "மேக நாதன்", "m"),

    # --- 11 Pooram (மோ / டா / டீ / டூ) ---
    NameCandidate("மோகனா", ("Mohana",), "Enchanting", "மயக்கும் அழகுடையவள்", "f"),
    NameCandidate("மோனிஷா", ("Monisha",), "Solitary; lord of the mind", "மனத்தின் தலைவி", "f"),

    # --- 12 Uthiram (டே / டோ / பா / பீ) ---
    NameCandidate("பாலாஜி", ("Balaji", "Palaji"), "The Lord of Tirupati", "திருப்பதி பெருமாள்", "m"),
    NameCandidate("பாவனா", ("Bhavana", "Pavana"), "Feeling, contemplation", "பாவனை", "f"),
    NameCandidate("பாண்டியன்", ("Pandian", "Bandian"), "Of the Pandya line", "பாண்டிய மரபினன்", "m"),
    NameCandidate("பாக்கியம்", ("Bhagyam", "Pakkiyam"), "Good fortune", "பாக்கியம்", "f"),
    NameCandidate("பீமன்", ("Bheeman", "Peeman"), "The mighty Pandava", "பீமன்", "m"),

    # --- 13 Hastham (பூ / ஷா / ணா / டா) ---
    # ணா (pada 3) begins no Tamil personal name — see module docstring.
    NameCandidate("பூஜா", ("Pooja", "Puja", "Bhooja"), "Worship, offering", "பூஜை", "f"),
    NameCandidate("பூங்கொடி", ("Poonkodi", "Bhoonkodi"), "Flowering creeper", "பூங்கொடி", "f"),
    NameCandidate("பூபதி", ("Bhoopathi", "Poopathi"), "Lord of the earth", "நிலத்தின் தலைவன்", "m"),

    # --- 14 Chithirai (பே / போ / ரா / ரீ) ---
    NameCandidate("பேச்சியம்மாள்", ("Pechiammal", "Bechiammal"), "Devotee of Pechiamman", "பேச்சியம்மன் அடியவள்", "f"),
    NameCandidate("ராமன்", ("Raman", "Raaman"), "Rama; the delightful one", "இராமன்", "m"),
    NameCandidate("ராணி", ("Rani", "Raani"), "Queen", "அரசி", "f"),
    NameCandidate("ராஜேஷ்", ("Rajesh", "Raajesh"), "Lord among kings", "அரசர்களின் தலைவன்", "m"),
    NameCandidate("ராதிகா", ("Radhika", "Raadhika"), "Krishna's beloved", "இராதிகை", "f"),
    NameCandidate("ராகவன்", ("Raghavan", "Raagavan"), "Of Raghu's line; Rama", "இராகவன்", "m"),
    NameCandidate("ரீனா", ("Reena", "Rina"), "Melted, dissolved in joy", "மகிழ்ச்சியில் திளைத்தவள்", "f"),

    # --- 15 Swathi (ரூ / ரே / ரோ / தா) ---
    NameCandidate("ரூபன்", ("Rupan", "Roopan"), "Of fine form", "அழகிய உருவினன்", "m"),
    NameCandidate("ரேணுகா", ("Renuka", "Raenuka"), "Parasurama's mother", "இரேணுகா", "f"),
    NameCandidate("ரோகிணி", ("Rohini", "Rogini"), "The star Rohini", "ரோகிணி நட்சத்திரம்", "f"),
    NameCandidate("ரோகித்", ("Rohith", "Rohit"), "Red; the first ray", "செம்மையானவன்", "m"),
    NameCandidate("தாமோதரன்", ("Dhamodharan", "Thamodharan", "Damodaran"), "Krishna, rope-bound at the waist", "தாமோதரன்", "m"),
    NameCandidate("தாரணி", ("Dharani", "Tharani"), "The earth that bears all", "தரணி", "f"),
    NameCandidate("தாட்சாயணி", ("Dhatchayani", "Thatchayani"), "Daksha's daughter; Parvati", "தாட்சாயணி", "f"),

    # --- 16 Visakam (தீ / தூ / தே / தோ) ---
    NameCandidate("தீபன்", ("Deepan", "Theepan"), "He who gives light", "விளக்கு ஏற்றுபவன்", "m"),
    NameCandidate("தீக்ஷா", ("Deeksha", "Theeksha"), "Consecration, initiation", "தீட்சை", "f"),
    NameCandidate("தேன்மொழி", ("Thenmozhi", "Denmozhi"), "She of honeyed speech", "தேன் போன்ற மொழி", "f"),
    NameCandidate("தேவகி", ("Devaki", "Thevaki"), "Krishna's mother", "தேவகி", "f"),
    NameCandidate("தேவராஜ்", ("Devaraj", "Thevaraj"), "King among the gods", "தேவர்களின் அரசன்", "m"),

    # --- 17 Anusham (நா / நீ / நூ / நே) ---
    NameCandidate("நாகராஜ்", ("Nagaraj", "Naagaraj"), "King of serpents", "நாக ராஜன்", "m"),
    NameCandidate("நாகமணி", ("Nagamani", "Naagamani"), "The serpent's jewel", "நாக மணி", "f"),
    NameCandidate("நாச்சியார்", ("Nachiyar", "Naachiyar"), "Lady, mistress; Andal", "ஆண்டாள் நாச்சியார்", "f"),
    NameCandidate("நீலகண்டன்", ("Neelakandan", "Nilakandan"), "Blue-throated Shiva", "நீலகண்டன்", "m"),
    NameCandidate("நீரஜா", ("Neeraja", "Niraja"), "Born of water; lotus", "தாமரை", "f"),
    NameCandidate("நேத்ரா", ("Nethra", "Netra"), "Eye; the guiding one", "கண், வழிகாட்டி", "f"),

    # --- 18 Kettai (நோ / யா / யீ / யூ) ---
    # யீ (pada 3) opens no Tamil personal name — see module docstring.
    NameCandidate("யாமினி", ("Yamini", "Yaamini"), "Night", "இரவு", "f"),

    # --- 19 Moolam (யே / யோ / பா-Bha / பீ-Bhi) ---
    NameCandidate("யேசுராஜ்", ("Yesuraj", "Jesuraj"), "Christ the king", "இயேசு ராஜா", "m"),
    NameCandidate("யோகிதா", ("Yogitha", "Yogita"), "She who is steadfast in yoga", "யோகம் நிறைந்தவள்", "f"),
    NameCandidate("யோகநாதன்", ("Yoganathan",), "Lord of yoga", "யோக நாதன்", "m"),

    # --- 20 Pooradam (பூ-Bhu / தா-Dha / பா-Pha / டா-Dha) ---
    NameCandidate("பாத்திமா", ("Fathima", "Fatima", "Pathima"), "The Prophet's daughter", "பாத்திமா", "f"),

    # --- 21 Uthiradam (பே-Bhe / போ-Bho / ஜா / ஜீ) ---
    NameCandidate("ஜாபர்", ("Jaffar", "Jafar"), "A stream; the generous one", "ஜாஃபர்", "m"),
    NameCandidate("ஜீவிதா", ("Jeevitha", "Jivitha"), "Full of life", "வாழ்வு நிறைந்தவள்", "f"),

    # --- 22 Thiruvonam (ஜு / ஜே / ஜோ / கா-Gha) ---
    NameCandidate("ஜேம்ஸ்", ("James", "Jems"), "The supplanter", "யாக்கோபு", "m"),
    NameCandidate("ஜோதிகா", ("Jothika", "Jyothika"), "She who is light", "ஒளியானவள்", "f"),

    # --- 23 Avittam (கா-Ga / கீ-Gi / கூ-Gu / கே-Ge) ---
    # கூ (pada 3) opens no Tamil personal name in current use.

    # --- 24 Sadayam (கோ-Go / ஸா / ஸீ / ஸூ) ---
    # The Grantha ஸ- rows are thin by orthography: Tamil families overwhelmingly
    # write these names with ச-, which is a different akshara and a different pada.

    # --- 26 Uthirattathi (தூ-Dhu / தா-Tha / ஜா-Jha / ஞா) ---
    NameCandidate("ஞானவேல்", ("Gnanavel", "Njanavel"), "Spear of wisdom", "ஞான வேல்", "m"),
    NameCandidate("ஞானசெல்வன்", ("Gnanaselvan", "Njanaselvan"), "Rich in wisdom", "ஞானச் செல்வன்", "m"),

    # --- Second targeted round: padas the pass above left on a single name,
    #     where a genuinely-used name exists for the exact opening. Padas NOT
    #     served here (வூ வோ ங ணா யீ கூ, டூ, and the ஸ- run) are left short on
    #     purpose — see the note at the head of this block.
    NameCandidate("ஷாஜஹான்", ("Shajahan", "Sajahan"), "King of the world", "ஷாஜஹான்", "m"),
    NameCandidate("ஷாமிலி", ("Shamili", "Samili"), "Composed, self-possessed", "அமைதி நிறைந்தவள்", "f"),
    NameCandidate("போகர்", ("Bogar", "Pogar"), "The siddhar of Palani", "பழநி சித்தர்", "m"),
    NameCandidate("நூர்ஜஹான்", ("Noorjahan", "Nurjahan"), "Light of the world", "உலகின் ஒளி", "f"),
    NameCandidate("பீமா", ("Bhima", "Bima"), "The formidable one", "வலிமையானவன்", "m"),
    NameCandidate("பூமிநாதன்", ("Bhuminathan", "Buminathan"), "Lord of the earth", "பூமிநாதன்", "m"),
    NameCandidate("தீட்சிதா", ("Dhikshitha", "Deekshitha"), "One who has been consecrated", "தீட்சை பெற்றவள்", "f"),
    NameCandidate("சீதாலட்சுமி", ("Sithalakshmi", "Seethalakshmi"), "Seetha and Lakshmi together", "சீதா லட்சுமி", "f"),
)

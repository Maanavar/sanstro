"""Sensitive-topic flags for Ask Vinaadi questions (admin spec L7, D-16).

A keyword match over what the person typed, in English and Tamil. It decides
two things: whether the safety addendum is added to the prompt
(`ask_vinaadi_service`), and which categories the call's metering row carries
(`ask_vinaadi_calls.flags`), which the L+30 review list will read.

This is a matcher over user input, not copy we render, so common spellings and
misspellings belong here side by side. It errs toward flagging: a false flag
costs one extra paragraph of instructions to the model; a missed one can let a
question about self-harm be answered as an ordinary horoscope.

English terms match on word boundaries ("die" must not match "diet" or
"studied"); Tamil terms match as substrings, because Tamil inflects by
suffixing (மரணம், மரணத்தை, மரண).
"""
from __future__ import annotations

import re

#: Every category, in the order flags are reported.
CATEGORIES: tuple[str, ...] = (
    "death",
    "illness",
    "pregnancy",
    "child_health",
    "divorce",
    "self_harm",
    "money_loss",
)

_ENGLISH: dict[str, tuple[str, ...]] = {
    "death": (
        "death", "die", "dies", "dying", "died", "pass away", "passed away", "lifespan", "life span",
        "longevity", "how long will i live", "ayul", "aayul", "maranam",
    ),
    "illness": (
        "illness", "ill", "sick", "sickness", "disease", "cancer", "tumour", "tumor", "surgery",
        "hospital", "hospitalised", "hospitalized", "diagnosis", "diagnosed", "heart attack",
        "kidney", "dialysis", "chemo", "chemotherapy", "diabetes", "health problem", "health issue",
    ),
    "pregnancy": (
        "pregnant", "pregnancy", "conceive", "conceiving", "conception", "miscarriage", "ivf",
        "fertility", "infertility", "childbirth", "santhana", "santhanam",
    ),
    "divorce": (
        "divorce", "divorced", "separation", "separated", "split up", "talaq",
        "leave my husband", "leave my wife",
    ),
    "self_harm": (
        "suicide", "suicidal", "kill myself", "end my life", "end it all", "self harm", "self-harm",
        "hurt myself", "want to die", "wish i was dead", "wish i were dead", "don't want to live",
        "dont want to live", "no reason to live",
    ),
    "money_loss": (
        "lost money", "lose money", "losing money", "lost my money", "financial loss", "business loss",
        "loss in business", "bankrupt", "bankruptcy", "debt trap", "in debt", "huge debt", "cheated",
        "fraud", "stock market loss", "trading loss",
    ),
}

_TAMIL: dict[str, tuple[str, ...]] = {
    "death": ("மரண", "இறப்பு", "சாவு", "ஆயுள்"),
    "illness": ("நோய்", "புற்றுநோய்", "அறுவை", "மருத்துவமனை", "உடல்நலக்குறைவு", "உடம்பு சரியில்லை"),
    "pregnancy": ("கர்ப்ப", "கருத்தரி", "கருச்சிதைவு", "குழந்தை பாக்கியம்", "மகப்பேறு", "சந்தான"),
    "divorce": ("விவாகரத்து", "விவாக ரத்து", "பிரிந்து வாழ"),
    "self_harm": ("தற்கொலை", "சாக வேண்டும்", "சாகணும்", "உயிரை மாய்", "வாழ விருப்பம் இல்லை"),
    "money_loss": ("நஷ்டம்", "நட்டம்", "கடன் தொல்லை", "கடன் சுமை", "ஏமாற்ற", "திவால்"),
}

#: Child words. A child word together with an illness term is `child_health`.
_CHILD_ENGLISH = ("child", "children", "kid", "kids", "son", "daughter", "baby", "infant", "toddler")
_CHILD_TAMIL = ("குழந்தை", "மகன்", "மகள்", "பிள்ளை")


def _english_pattern(terms: tuple[str, ...]) -> re.Pattern[str]:
    alternatives = "|".join(re.escape(term) for term in sorted(terms, key=len, reverse=True))
    return re.compile(rf"\b(?:{alternatives})\b")


_PATTERNS: dict[str, re.Pattern[str]] = {name: _english_pattern(terms) for name, terms in _ENGLISH.items()}
_CHILD_PATTERN = _english_pattern(_CHILD_ENGLISH)


def _matches(category: str, text: str) -> bool:
    pattern = _PATTERNS.get(category)
    if pattern is not None and pattern.search(text):
        return True
    return any(term in text for term in _TAMIL.get(category, ()))


def sensitive_topics(question: str) -> tuple[str, ...]:
    """The sensitive categories `question` touches, in `CATEGORIES` order."""
    text = question.lower()
    found = {category for category in _ENGLISH if _matches(category, text)}
    if "illness" in found and (_CHILD_PATTERN.search(text) or any(term in text for term in _CHILD_TAMIL)):
        found.add("child_health")
    return tuple(category for category in CATEGORIES if category in found)

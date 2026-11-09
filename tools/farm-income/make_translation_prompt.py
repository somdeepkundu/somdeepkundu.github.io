#!/usr/bin/env python3
"""Write a ready-to-paste prompt that asks Gemini (or any capable model) to translate the page.

    python tools/farm-income/make_translation_prompt.py hi > prompt-hi.txt
    python tools/farm-income/make_translation_prompt.py bn > prompt-bn.txt
    python tools/farm-income/make_translation_prompt.py mr   # any language in GUIDE below

Paste the whole file into a new Gemini chat. Save its reply as docs/farm-income/assets/i18n/<code>.json,
check it with check_translation.py, and add the language to languages.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

EN = Path(__file__).resolve().parents[2] / "docs/farm-income/assets/i18n/en.json"

# code: (English name, own name, guidance on register, digits and fixed terms)
GUIDE = {
    "hi": ("Hindi", "हिन्दी", """\
- Register: the plain, formal Hindi of a Government of India press release (PIB Hindi). Prefer the word a
  district agriculture officer would use over a heavily Sanskritised one, but keep official terms.
- Digits: keep 0-9 (international numerals), as Hindi government documents do.
- Fixed terms, use exactly these everywhere:
  agricultural household → कृषक परिवार   (as in NSSO's own Hindi title "भारत में कृषक परिवारों की स्थिति के मुख्य संकेतक")
  National Statistical Office → राष्ट्रीय सांख्यिकी कार्यालय
  Ministry of Statistics and Programme Implementation → सांख्यिकी और कार्यक्रम कार्यान्वयन मंत्रालय
  rabi → रबी, kharif → खरीफ़
  Union Territory → केंद्र शासित प्रदेश"""),
    "bn": ("Bengali", "বাংলা", """\
- Register: standard modern Bengali (চলিত ভাষা) as used by the West Bengal government and major newspapers;
  clear and formal, not literary.
- Digits: write numbers that appear inside the text with Bengali digits (০-৯), e.g. ২০১৩, because the page
  also shows its figures in Bengali digits.
- Fixed terms, use exactly these everywhere:
  rabi → রবি, kharif → খরিফ
  Union Territory → কেন্দ্রশাসিত অঞ্চল"""),
    "mr": ("Marathi", "मराठी", "- Register: plain formal Marathi of Maharashtra government publications.\n- Digits: keep 0-9."),
    "ta": ("Tamil", "தமிழ்", "- Register: plain formal Tamil of Tamil Nadu government publications.\n- Digits: keep 0-9."),
    "te": ("Telugu", "తెలుగు", "- Register: plain formal Telugu of government publications.\n- Digits: keep 0-9."),
    "gu": ("Gujarati", "ગુજરાતી", "- Register: plain formal Gujarati of government publications.\n- Digits: keep 0-9."),
    "or": ("Odia", "ଓଡ଼ିଆ", "- Register: plain formal Odia of Odisha government publications.\n- Digits: keep 0-9."),
    "pa": ("Punjabi (Gurmukhi)", "ਪੰਜਾਬੀ", "- Register: plain formal Punjabi in Gurmukhi script.\n- Digits: keep 0-9."),
    "kn": ("Kannada", "ಕನ್ನಡ", "- Register: plain formal Kannada of government publications.\n- Digits: keep 0-9."),
    "ml": ("Malayalam", "മലയാളം", "- Register: plain formal Malayalam of government publications.\n- Digits: keep 0-9."),
}

TEMPLATE = """\
You are translating the text of a public web page from English into {name} ({own}).

ABOUT THE PAGE
The page shows what India's agricultural households earned from growing crops in January–June 2013,
state by state, from an official government survey (NSS 70th round, National Statistical Office). Its
readers are policy makers, officials, journalists and researchers. Accuracy and clarity matter more than
style: a mistranslated statistical term could be quoted in a policy note.

WHAT TO RETURN
Return ONE valid JSON object and nothing else: no explanation, no markdown, no ``` fences.
- Keep every key exactly as it is, in the same order. Do not add, remove or rename keys.
- Translate only the values.
- Text inside curly braces is a placeholder, for example {{state}}, {{households}}, {{lo}}, {{n}}. Copy each
  placeholder exactly, letters and braces unchanged, and keep every placeholder that the English value
  has. You may move a placeholder within the sentence when {name} grammar needs it.
- Keep these unchanged: ₹, %, URLs, "microdata.gov.in", "NSS", "NSSO", "KI(70/33)", "API", "CSV", "JSON",
  "PDF", "GitHub", "Google Colab", "Colab", "Run all", "Secrets".
- "_meta.language": write the name of the language in {name} itself ({own}).
- "_meta.note": translate it.
- "cite.text": do NOT translate; copy the English citation exactly (citations stay in their original language).
- "footer.translation": write, in {name}: "This page was translated from English with the help of AI. Please
  report any error." (The English value is empty on purpose; this one must not be.)
- "state.*" and "short.*": use the official {name} names of Indian states and Union Territories.
  "short.*" values are shorter forms for a narrow list.
- Labels for buttons, menus and table headings must stay short, about as long as the English.
- Use the same {name} word for the same English term everywhere on the page, in particular for: agricultural
  household, household that grew crops, net receipt, paid-out expenses, value of crops at harvest, 95% range,
  median, relative standard error, households surveyed, use with caution, survey weights.

LANGUAGE GUIDANCE
{guide}

THE ENGLISH TEXT (JSON)
{source}
"""


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in GUIDE:
        print(f"usage: make_translation_prompt.py <{'|'.join(GUIDE)}>", file=sys.stderr)
        return 2
    name, own, guide = GUIDE[sys.argv[1]]
    source = json.dumps(json.loads(EN.read_text(encoding="utf-8")), ensure_ascii=False, indent=1)
    sys.stdout.write(TEMPLATE.format(name=name, own=own, guide=guide, source=source))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

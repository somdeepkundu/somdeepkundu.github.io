#!/usr/bin/env python3
"""Check a translated strings file against en.json before it goes on the page.

    python tools/farm-income/check_translation.py docs/farm-income/assets/i18n/hi.json

Fails on: invalid JSON, missing or extra keys, a placeholder lost or changed, an empty value,
HTML in a value, a changed citation. Warns on: values that look untranslated, wrong digits for
Bengali, and very long labels.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

EN = Path(__file__).resolve().parents[2] / "docs/farm-income/assets/i18n/en.json"
SCRIPTS = {"hi": r"[ऀ-ॿ]", "mr": r"[ऀ-ॿ]", "bn": r"[ঀ-৿]",
           "ta": r"[஀-௿]", "te": r"[ఀ-౿]", "gu": r"[઀-૿]",
           "or": r"[଀-୿]", "pa": r"[਀-੿]", "kn": r"[ಀ-೿]",
           "ml": r"[ഀ-ൿ]"}
PLACEHOLDER = re.compile(r"\{[\w+]+\}")
KEEP_ENGLISH = {"cite.text"}
SHORT = ("nav.", "theme.", "table.col.", "method.col.", "method.result.", "short.", "lang.")


def main(path: str) -> int:
    code = Path(path).stem
    en = json.loads(EN.read_text(encoding="utf-8"))
    raw = Path(path).read_text(encoding="utf-8").strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)  # tolerate fences pasted from a chat
    try:
        tr = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"FAIL not valid JSON: {exc}")
        return 1
    errors, warnings = [], []
    missing = [k for k in en if k not in tr]
    extra = [k for k in tr if k not in en]
    errors += [f"missing key {k}" for k in missing] + [f"extra key {k}" for k in extra]
    script = re.compile(SCRIPTS.get(code, r"[^\x00-\x7F]"))
    for key, source in en.items():
        if key not in tr:
            continue
        value = tr[key]
        if not isinstance(value, str):
            errors.append(f"{key}: not text")
            continue
        if sorted(PLACEHOLDER.findall(source)) != sorted(PLACEHOLDER.findall(value)):
            errors.append(f"{key}: placeholders {PLACEHOLDER.findall(source)} became "
                          f"{PLACEHOLDER.findall(value)}")
        if not value.strip() and (source.strip() or key == "footer.translation"):
            errors.append(f"{key}: empty")
        if re.search(r"<[a-z/][^>]*>", value):
            errors.append(f"{key}: contains HTML")
        if key in KEEP_ENGLISH and value != source:
            errors.append(f"{key}: the citation must stay exactly as in English")
        if (key not in KEEP_ENGLISH and not key.startswith("_meta.note") and source.strip()
                and len(source) > 12 and not script.search(value)):
            warnings.append(f"{key}: looks untranslated: {value[:60]!r}")
        if code == "bn" and re.search(r"\d", PLACEHOLDER.sub("", value)) and key not in KEEP_ENGLISH:
            if re.search(r"[0-9]", re.sub(r"https?://\S+|KI\(70/33\)|NSS \d+|\d+%", "", PLACEHOLDER.sub("", value))):
                warnings.append(f"{key}: Latin digits in Bengali text: {value[:60]!r}")
        if key.startswith(SHORT) and len(value) > max(28, 2 * len(source)):
            warnings.append(f"{key}: long for a label ({len(value)} characters)")
    for e in errors:
        print("FAIL", e)
    for w in warnings:
        print("warn", w)
    print(f"{path}: {len(en)} keys, {len(errors)} errors, {len(warnings)} warnings")
    return 1 if errors else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: check_translation.py <lang>.json", file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))

"""Apply a reviewed translation workbook (MindGuide-translation-review.xlsx) to the dictionaries.

Usage: python3 scripts/i18n-apply-review.py reviewed.xlsx [path/to/website/assets/i18n]
Rows marked "Fix" with text in "Better wording" replace the current translation.
"""
import json, sys
from pathlib import Path
from openpyxl import load_workbook

SHEETS = {"Pidgin": "pcm", "Yoruba": "yo", "Igbo": "ig", "Hausa": "ha"}
app_dir = Path(__file__).resolve().parent.parent / "public" / "i18n"
dirs = [app_dir] + [Path(p) for p in sys.argv[2:]]
wb = load_workbook(sys.argv[1], data_only=True)
for sheet, code in SHEETS.items():
    if sheet not in wb.sheetnames: continue
    fixes = {}
    for row in wb[sheet].iter_rows(min_row=3, values_only=True):
        _, _, en, _, verdict, better = row[:6]
        if en and str(verdict).strip().lower() == "fix" and better and str(better).strip():
            fixes[en] = str(better).strip()
    for d in dirs:
        f = d / f"{code}.json"
        data = json.loads(f.read_text())
        data.update({k: v for k, v in fixes.items() if k in data})
        f.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    print(f"{sheet}: {len(fixes)} corrections applied")

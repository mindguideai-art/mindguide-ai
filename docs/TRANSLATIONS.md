# Languages: Pidgin, Yoruba, Igbo, Hausa (added 10 Nov 2026)

Visitors can switch the website and the patient side of the web app between **English, Nigerian Pidgin, Yorùbá, Igbo and Hausa** with the globe button in the top bar (on phones, inside the app menu). The choice is remembered on the device, and links from the website into the app carry it across.

Therapist and admin screens stay in English. Chat messages, names and anything people type are never translated.

## How it works

- `public/i18n/engine.js` swaps English text for the chosen language once the page has loaded. Text it doesn't know stays in English, so nothing ever breaks.
- One dictionary per language: `public/i18n/{pcm,yo,ig,ha}.json` (`"English text": "Translation"`). The website uses copies in `assets/i18n/`.
- Numbers are carried over automatically, so "4 of 4 sessions left" uses the same entry as "1 of 4 sessions left".

## Native-speaker review (before announcing it)

The translations were written carefully but **must be checked by fluent speakers**, especially the clinical wording (anxiety, grief, postpartum, crisis help).

1. Send `MindGuide-translation-review.xlsx` to one reviewer per language. They mark each row OK or Fix and write better wording.
2. When it comes back: `python3 scripts/i18n-apply-review.py reviewed.xlsx ../mindguideai/assets/i18n`
3. Commit both repos.

## Adding new text later

New English text shows in English until it is added to the four dictionaries. Add the same key to each file (app and website copies).

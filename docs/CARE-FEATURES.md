# Care features (added 9 Nov 2026)

## Switch them on (once)

1. In **Supabase → SQL editor**, run `supabase/migrations/2026-11-09-care-features.sql`. Supabase may warn about "destructive operations". That's only the `drop policy if exists` lines, which recreate access rules. No data is deleted.
2. Wait for Vercel to finish deploying the latest code.

## What's new, and who uses it

| Feature | Where | Notes |
|---|---|---|
| **Get help now** | Red button at the top of every patient page | Lists crisis helplines with tap-to-call. Edit the numbers in **Admin → Settings**. ⚠️ Ask the CMO to confirm the numbers before launch, and every few months. |
| **Safety flags** | Therapist → Patients → a patient → **Flag a safety concern** | Low / Medium / High / Immediate. High and Immediate email every admin straight away. Review them in **Admin → Reports & flags → Therapist flags**. |
| **Session summaries and practice tasks** | Therapist → Appointments → a session → **Summary for your client** | Separate from private notes. The patient is notified, and can tick tasks off under My sessions → **Session notes**. |
| **Private session feedback** | Patient → My sessions → **Rate session** | Overall rating, "felt listened to", call quality, and whether they'd keep the therapist. A public review is optional. See **Admin → Session quality**. Low ratings alert admins. |
| **Language and faith matching** | Therapist → My profile; Patient → Settings → Therapy preferences; Find a therapist filters | Languages: English, Nigerian Pidgin, Yoruba, Igbo, Hausa, French. Faith-sensitive: Christian or Islamic, only when the client asks. |
| **Test my connection and low-data mode** | My sessions / Appointments → **Test my connection** | Speed, camera and mic check. Low-data mode cuts video data by about 75%. |
| **WhatsApp reminders and weekly check-in** | Patient → Settings (opt-in) | Needs the WhatsApp setup below. Replies of 1–10 go into the progress tracker; STOP turns it off. Low scores get a caring reply with helplines. |
| **Self-help library and private journal** | Patient → Self-help | Breathing, 5-4-3-2-1 grounding, sleep wind-down, thought record, three good things, journal. Free for every patient. Only the patient can read their journal. |
| **Programmes** | Patient → Programmes; **Admin → Programmes** | Managing anxiety, Mothers' wellbeing after birth, Living with grief (6 weeks each). **Hidden until clinically reviewed:** the CMO reads each one ("Read the full content"), then an admin enters the reviewer's name and ticks "Show to patients". |
| **Organisation plans** | **Admin → Organisations**; Patient → Subscription → "Covered by your employer or school?" | Create an organisation, choose the plan, seats and dates, and share the join code. Members' plans renew monthly until the contract ends. The report never shows names, and hides figures until at least 5 people join. |

## WhatsApp setup (for reminders and check-ins)

WhatsApp only lets businesses start a conversation with an approved template.

1. In **Meta → WhatsApp Manager → Message templates**, create two templates, category **Utility**, language **English**:
   - `session_reminder`: *Hi {{1}}, a reminder that your MindGuide AI session with {{2}} is on {{3}} (Lagos time). Join from your MindGuide account. Reply STOP to stop WhatsApp messages.*
   - `weekly_checkin`: *Hi {{1}}, it's your weekly MindGuide check-in 💚 How are you feeling this week, from 1 (very low) to 10 (very good)? Just reply with a number. Reply STOP to stop these messages.*
2. Wait for Meta to approve them (usually minutes to a day).
3. Make sure `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_APP_SECRET` are set in Vercel. Check-ins go out on Monday mornings with the daily reminder job.

## Languages

The website and the patient app can now be switched to Pidgin, Yoruba, Igbo or Hausa. See `docs/TRANSLATIONS.md`.

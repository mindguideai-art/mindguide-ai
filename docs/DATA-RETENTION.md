# Data retention and deletion schedule

How long MindGuide AI keeps each kind of information, and how it is deleted.
**Status: proposed defaults. The periods marked ⚖️ must be confirmed by Nigerian legal counsel and the clinical lead before launch.**

## Deleted automatically (every night)
The job `/api/cron/retention` runs daily at 02:30 (vercel.json) and deletes anything older than:

| Information | Kept for | Why |
|---|---|---|
| Technical data used to connect a call (`call_signals`) | 1 day | Only needed while a call connects |
| WhatsApp assistant conversations (`assistant_messages`) | 90 days | Context for follow-up questions; no clinical value |
| In-app notifications (`notifications`) | 12 months | Convenience only |
| Usage events: sign-ins, check-in counts, Telegram clicks (`events`) | 24 months | Admin dashboard metrics and security |
| Call history: start/end times only, never audio or video (`calls`) | 24 months | Disputes about missed sessions |
| WhatsApp check-in records (`whatsapp_checkins`) | 12 months | Knowing which weekly check-ins were answered |
| Private journal and worksheets (`journal_entries`) | Until the patient deletes them or their account | Patient's own records; only they can read them |
| Session feedback (`session_feedback`) | Kept with the account | Quality monitoring |
| Event registrations: name, email, phone, answers (`event_registrations`) | 24 months | Running the event and follow-up; deleting an event deletes its registrations straight away |
| Access log: who viewed sensitive records (`record_access_log`) | 36 months ⚖️ | Accountability and breach investigation |

The periods live in `src/lib/retention.ts`. Change them there and update this table.

## Kept while the account is open (not deleted automatically)

| Information | Proposed rule |
|---|---|
| Account and registration details (`profiles`, `patient_profiles`) | Until the account is closed |
| Assessments, mood check-ins (`assessments`, `mood_checkins`) | Until the account is closed, then as for clinical records ⚖️ |
| Session notes (`session_notes`) | Clinical record: keep for the period required of the therapist's profession after the last session ⚖️ |
| Appointments, consents, reviews | Until the account is closed, then as for clinical records ⚖️ |
| Private messages (`messages`) | Until the account is closed ⚖️ |
| Payments and subscriptions (`payments`, `subscriptions`) | 6 years after the transaction, for tax and accounting ⚖️ |
| Therapist licences and documents (`therapist-docs` storage) | While the therapist is active, then for the period needed to show they were verified ⚖️ |
| Safeguarding reports (`reports`) | Per the Safeguarding Policy record-keeping rules ⚖️ |
| Database backups (Supabase) | 7 days on the Pro plan, then overwritten |

## Closing an account (user request)
Until a self-service option is added, users email **mindguideai@gmail.com**.
1. Confirm the request comes from the account's email address.
2. Check whether anything must be kept (unpaid disputes, a safeguarding concern, legal hold). Record the decision.
3. In **Supabase → Authentication → Users**, delete the user. This also deletes their profile, registration answers, assessments, mood check-ins, consents, notifications and messages (the database removes linked rows automatically). Payment rows are kept without the user link for accounting.
4. Reply to the user confirming the deletion, within one month of the request.

## Access and correction requests
Users can see and edit their own details in **Settings**. For a full copy of their data, an admin exports it from Supabase (Table Editor → filter by the user's id → Export) and sends it securely, within one month.

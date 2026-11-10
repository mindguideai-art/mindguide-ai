# Service providers (data processors)

Every outside company that handles MindGuide AI users' information, what it receives, and why.
The Privacy Policy must list these. Before launch, sign or accept each provider's data processing agreement (DPA) and record where it stores data.

| Provider | What it does for us | Information it receives | Where / notes |
|---|---|---|---|
| **Supabase** | Database, sign-in, file storage | Everything stored in the app: accounts, event registrations, gallery photos, private journals, session summaries and feedback, organisation memberships, registration answers, assessments, appointments, messages, session notes, licences | Region chosen when the project was created (Supabase → Settings → General). Encrypted at rest. SOC 2 Type 2. |
| **Vercel** | Hosts the web app and the website | All web traffic passes through it; server logs include IP addresses | Global network. |
| **Anthropic** (Claude AI) | 1) Writes the plain-language assessment summary. 2) Answers questions in the MindGuide Assistant (website chat and WhatsApp) | 1) Assessment answers, optional notes the user types, selected concerns and support areas, scores. **Not sent:** name, email, phone, age, location. 2) The text of chat messages | United States. Under Anthropic's commercial terms, API inputs are not used to train models by default. Confirm the current retention period and accept Anthropic's DPA. Crisis messages in the assistant are answered by fixed text and never sent to the AI. |
| **Paystack** | Card, transfer and USSD payments; monthly renewals | Name, email, amount, plan. Card details go straight to Paystack; we never see or store them | Nigeria. PCI DSS certified. |
| **Resend** | Sends emails (confirmations, reminders, receipts) | Email address, name, appointment time, email text | United States. |
| **Termii** | Sends SMS reminders | Phone number and reminder text. Reminders say "your video session"; they don't mention therapy or the therapist | Nigeria. |
| **Meta (WhatsApp Cloud API)** | WhatsApp assistant; session reminders and weekly mood check-ins for patients who opt in | WhatsApp number and message text; for opted-in patients also their first name, therapist's name, session time and the 1–10 mood they reply with | Meta's servers. Assistant conversations are deleted from our database after 90 days. Patients can reply STOP or switch it off in Settings. |
| **Google (STUN servers)** | Helps two devices find each other when a call starts | The devices' IP addresses only. Call audio and video never pass through it | Calls are end-to-end between the two devices (or via the TURN relay you add). |
| **TURN relay provider** (to be chosen) | Relays calls when a network blocks direct connections | Encrypted call traffic it cannot read, IP addresses | Choose a provider and add it here. |
| **Telegram** | Community group (outside the app) | Whatever members choose to share in the group | Not controlled by MindGuide AI. See docs/TELEGRAM-COMMUNITY.md. |

The official website loads its fonts from its own files, so visitors' browsers don't contact Google Fonts.

## Rules
- Don't send names, contact details or session notes to the AI provider. The code sends only what's listed above; keep it that way when adding features.
- Add any new provider to this table before it receives user data.
- Review this list at least once a year and whenever a provider changes.

## Phone alerts (web push)

Alerts are delivered by the push service built into each person's browser (Google for Chrome/Android, Apple for Safari/iPhone, Mozilla for Firefox). The alert is encrypted so the push service can't read it, and it contains no names or message text in any case. Only the device address and its encryption keys are stored, in `push_subscriptions`; they're deleted when the person turns alerts off, when the browser reports the device is gone, or when the account is deleted.

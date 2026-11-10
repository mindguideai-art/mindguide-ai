# Phone and computer alerts (added 10 Nov 2026)

Patients, therapists and admins can get real alerts on their phone or computer, even when MindGuide AI is closed:

| What happens | Who gets the alert | Alert text |
|---|---|---|
| New chat message | The other person | "You have a new message." |
| Booking request, confirmation, decline, cancellation | Therapist or patient | e.g. "Your session is confirmed." |
| Session reminders (24 hours and 1 hour before) | Both | "Your session is tomorrow / in 1 hour." |
| Someone opens the session room | The other person | "Your session has started. Tap to join." (stays on screen) |
| Call from chat (Premium/Family) | The person being called | "Incoming video call. Tap to answer." (stays on screen) |
| Missed call, session notes, feedback, admin alerts | As today in the bell | Short, general line |

**Privacy:** alerts can show on a lock screen, so they never include names or message text. Tapping the alert opens the right page after sign-in.

## Switch it on (once)

1. **Supabase → SQL editor:** run `supabase/migrations/2026-11-10-push-notifications.sql`.
2. **Vercel → Settings → Environment Variables** (web app project), add:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` (keep this one secret)
   - `VAPID_SUBJECT` = `mailto:mindguideai@gmail.com`
3. Redeploy. Until the keys are set, the alert options stay hidden and nothing else changes.

To make a new key pair later: `npx web-push generate-vapid-keys`. Changing the keys means everyone has to turn alerts on again.

## How people turn it on

- A "Never miss a message or session" card on the patient and therapist home pages, and **Settings → Alerts on this device** (also in Admin → Settings).
- **Android / computers (Chrome, Edge, Firefox):** tap "Turn on alerts" and allow.
- **iPhone (iOS 16.4 or newer):** first open the app in Safari, tap Share → **Add to Home Screen**, open MindGuide AI from the home screen, then turn alerts on. Safari tabs on iPhone can't show alerts; the card explains this.
- A test alert is sent straight away so people can see it works.

Alerts are per device. Old devices are removed automatically when the browser says they're no longer valid.

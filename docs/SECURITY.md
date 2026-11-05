# Security and launch checklist

MindGuide AI stores health information, so treat this list as required before real patients sign up. Tick each item as you go.

## Already built into the app

- **Row Level Security on every table.** Patients see only their own records. Therapists see a patient's details only after the patient gives consent. Triggers stop users from changing their own role, approval status or other people's appointments.
- **Two-factor login for admins and therapists.** Every admin and therapist must add an authenticator app (Google or Microsoft Authenticator) and enter a 6-digit code at each sign-in. This is enforced in two places:
  - The app sends admins and therapists to `/mfa/setup` or `/mfa/verify` until they enter a code.
  - The database requires a two-factor session (`aal2`) before an admin or therapist can read patient data (`is_admin()` and `mfa_ok()`). A stolen password alone can't read patient records, even through the API.
  - If an admin or therapist loses their phone, an admin can reset it from **Admin → Users → Reset two-factor**.
- **Password rule.** At least 10 characters, with letters and numbers. Match this in Supabase (below).
- **Security headers on every page:**
  - A Content Security Policy that blocks scripts and connections from other sites.
  - HTTPS-only (HSTS).
  - Blocks the site from being framed (clickjacking).
  - Camera and microphone allowed only for this site.
- **Payments and reminders:**
  - Paystack webhooks are checked against Paystack's signature.
  - The reminder job needs `CRON_SECRET`.
- **Secret keys stay out of GitHub.** Keys live only in environment variables, and `.env*` files are ignored by git. The Supabase service key is used only on the server.
- **Access log.** Every time a therapist or admin opens patient details, session notes, messages, risk reports, therapist documents, the user list, payments or appointments, it's recorded (`record_access_log`) and shown in **Admin → Access log**. The `events` table also records sign-ins and two-factor changes.
- **Retention.** Old technical data is deleted automatically every night. See [`DATA-RETENTION.md`](DATA-RETENTION.md).
- **Service providers.** Every company that receives user data is listed in [`SERVICE-PROVIDERS.md`](SERVICE-PROVIDERS.md).
- **Community.** People see rules and privacy tips at `/community` before joining Telegram. Group settings: [`TELEGRAM-COMMUNITY.md`](TELEGRAM-COMMUNITY.md).
- **Dependencies.** `npm audit` reported 0 known vulnerabilities on 4 Nov 2026. Re-run it monthly.

## Supabase (dashboard settings)

1. **Plan: Pro** ($25/month). It includes daily backups kept for 7 days and leaked-password protection. Compute size *Small* is recommended (about $5/month extra after the included credit).
2. **Region:** choose London (`eu-west-2`) or Frankfurt (`eu-central-1`) when creating the project. It can't be changed later.
3. **Database:** run `supabase/schema.sql` in the SQL editor. For a project created before 5 Nov 2026, also run each file in `supabase/migrations/` once, oldest first.
4. **Authentication → Sign In / Providers → Email:**
   - [ ] Confirm email: **on**
   - [ ] Secure password change: **on**
   - [ ] Minimum password length: **10**, required characters: **letters and digits**
   - [ ] Leaked password protection: **on** (checks passwords against known breaches)
5. **Authentication → Multi-Factor:** [ ] TOTP (authenticator app) **enabled**. It's on by default.
6. **Authentication → URL Configuration:** [ ] Site URL and redirect URLs list **only** your live domain.
7. **Authentication → SMTP:** [ ] use Resend (or another provider) so emails come from your domain. The built-in sender is heavily rate-limited.
8. **Database → Backups:**
   - [ ] Confirm daily backups are listed.
   - [ ] Optional: point-in-time recovery ($100/month) to restore to any minute.
   - [ ] Once a month, also download a backup and keep it encrypted somewhere outside Supabase.
9. **Database → Settings:** [ ] Enforce SSL on connections: **on**.
10. **Advisors → Security Advisor:** [ ] fix every *Error* and review every *Warning* before launch.
11. **Organization → Team:**
    - [ ] Every member has two-factor login on their Supabase account.
    - [ ] Remove anyone who doesn't need access.
    - [ ] The client should be the owner.

## Hosting (the client's server)

- [ ] Add all variables from `.env.example` in the host's dashboard. Never upload a `.env` file to GitHub or a public folder.
- [ ] HTTPS with a valid certificate, and redirect `http://` to `https://`.
- [ ] Run a current Node.js LTS version.
- [ ] Turn on automatic restarts and keep logs for at least 30 days. Don't log message text, notes or assessment answers.
- [ ] If a key is ever exposed, rotate it immediately:
  - Supabase: Settings → API keys
  - Paystack: Settings → API Keys
  - Resend, Termii and Anthropic: their dashboards

## Accounts (strong unique password + two-factor on each)

- [ ] Hosting provider
- [ ] Domain registrar and DNS
- [ ] Supabase
- [ ] GitHub. Also make the repo private, and turn on Dependabot alerts and secret scanning.
- [ ] Paystack
- [ ] Resend, Termii, Anthropic
- [ ] The email inbox that receives password resets for all of the above

## Before real patients sign up

- [ ] **Independent security review (penetration test)** by a qualified firm. Ask them to cover:
  - sign-in and two-factor
  - Row Level Security (one user trying to read another's data)
  - file uploads
  - payments and webhooks
  - video and voice calls
  - admin pages
- [ ] **Nigeria Data Protection Act 2023:**
  - Publish a real privacy policy at `/privacy`.
  - Check whether you must register with the NDPC.
  - Sign data processing terms with Supabase, Paystack, Resend and Termii.
  - Be ready to report a breach to the NDPC within 72 hours.
- [ ] **Incident plan:** who to call, how to lock admin accounts, how to rotate keys, and how to tell affected users.
- [ ] **Test restoring a backup** to a separate project, so you know it works.

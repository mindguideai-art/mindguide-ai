<p align="center"><img src="public/brand/mindguide-logo.png" alt="MindGuide AI" width="260"></p>

# MindGuide AI – online therapy web app

A web application that connects patients with verified therapists for video and audio sessions.

- **Patients** register with their details, take an AI-assisted wellbeing assessment, book, reschedule and cancel sessions, join video or audio calls, message their therapist securely, track their mood and progress, and pay for a monthly plan.
- **Therapists** apply with their licence and qualifications, set their availability, accept or decline bookings, run sessions, see patient details (only with patient consent) and track their earnings.
- **Admins** verify therapists, manage users, handle reports and high-risk flags, track revenue and payouts, and see the 10 key metrics on the dashboard.

Built with Next.js 16, Supabase (database, login, file storage, realtime), Paystack (subscriptions), built-in WebRTC video and voice calls, Claude (assessment summaries), Resend (email) and Termii (SMS).

Also included: in-app notifications, ratings and reviews, private therapist session notes, account settings, calendar views, and calling straight from chat.

---

## 1. Run it on your computer

You need [Node.js 20+](https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # open http://localhost:3000
```

## 2. Set up Supabase (database and logins)

1. Create a project at [supabase.com](https://supabase.com). Use the **Pro** plan for the live site (daily backups and leaked-password protection); the free plan is fine for testing.
2. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql` and click **Run**. This creates all tables, security rules and file storage.
3. Go to **Project Settings → API** and copy into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` – Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – `anon` public key
   - `SUPABASE_SERVICE_ROLE_KEY` – `service_role` secret key (never share this)
4. Go to **Authentication → URL Configuration** and set **Site URL** to your live domain (for example `https://www.yourdomain.com`). Add `http://localhost:3000/**` and `https://www.yourdomain.com/**` under **Redirect URLs**.
5. **(Important) Email links.** Go to **Authentication → Email Templates**:
   - In **Confirm signup**, change the link's `href` to:
     ```
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
     ```
   - In **Reset password**, change it to:
     ```
     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
     ```
   These links work on any device. They open a page with a button, so email security scanners that open links automatically can't use them up ("Email link is invalid or has expired").
6. **Make yourself an admin.** Sign up on the site like a normal patient, then run this in the SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
   The next time you open the admin pages you'll be asked to add an authenticator app (Google or Microsoft Authenticator). Admins must enter a code from it at every sign-in.
7. Follow the Supabase part of [`docs/SECURITY.md`](docs/SECURITY.md): password rules, leaked-password protection, backups and the Security Advisor.

## 3. Set up Paystack (subscriptions)

1. In the Paystack dashboard, create four **monthly plans** under **Products → Plans**: Basic ₦10,000, Standard ₦20,000, Premium ₦30,000 and Family ₦50,000.
2. Put each plan code (`PLN_…`) into `PAYSTACK_PLAN_BASIC`, `PAYSTACK_PLAN_STANDARD`, `PAYSTACK_PLAN_PREMIUM` and `PAYSTACK_PLAN_FAMILY`.
3. Copy your secret key into `PAYSTACK_SECRET_KEY` (use the test key `sk_test_…` until you go live).
4. Under **Settings → API Keys & Webhooks**, set the webhook URL to `https://YOUR-DOMAIN/api/paystack/webhook`.

Each plan unlocks different features (sessions per month, messaging, calls from chat, priority booking). The app enforces these on the server. Change what each plan includes in **Admin → Settings → Plan features**.

To test booking without paying, use Paystack's test keys and test cards.

## 4. Optional services

| Service | What it does | Variables | If left empty |
| --- | --- | --- | --- |
| [Anthropic](https://console.anthropic.com) | Writes the assessment summary and recommends specialties | `ANTHROPIC_API_KEY` | A built-in summary is used instead |
| [Resend](https://resend.com) | Sign-up, booking and reminder emails | `RESEND_API_KEY`, `EMAIL_FROM` | Emails are skipped (logged only) |
| [Termii](https://termii.com) | SMS reminders | `TERMII_API_KEY`, `TERMII_SENDER_ID` | SMS is skipped |

Set `ADMIN_ALERT_EMAIL` to get an email whenever an assessment is flagged as high-risk.

Supabase also sends its own sign-up emails. For a branded sender, add your Resend SMTP details under **Supabase → Project Settings → Authentication → SMTP Settings**.

## 5. Video and voice calls

Calls are built in, like WhatsApp. They connect directly between the patient's and therapist's devices (WebRTC), with mute, camera on/off, camera flip, full screen, ringing, missed-call alerts and automatic reconnection.

- **Session calls:** the room opens 15 minutes before a confirmed session. The first person to join rings the other.
- **Calls from chat:** patients and therapists who have a booking together can start a voice or video call from their conversation.

Most connections work without extra setup. Some mobile networks block direct connections, so for launch add a **TURN server** that relays those calls:

- Run the free, open-source **coturn** on a small server, or use a hosted TURN service (Metered, Twilio, Cloudflare and others offer one).
- Put its details in `TURN_URLS`, `TURN_USERNAME` and `TURN_CREDENTIAL`.

Calls need HTTPS (or `localhost`) because browsers only allow camera and microphone on secure pages.

## 6. Appointment reminders

`/api/cron/reminders` sends email and SMS reminders 24 hours and 1 hour before each confirmed session. It must be called every 15 minutes.

1. Set `CRON_SECRET` to a long random string.
2. **On Vercel**, `vercel.json` runs it once a day (the most the free Hobby plan allows), and Vercel sends the secret automatically. On Vercel Pro you can change the schedule to `*/15 * * * *`.
3. **For reminders every 15 minutes on the free plan or any other host**, create a free job at [cron-job.org](https://cron-job.org) that calls
   `https://YOUR-DOMAIN/api/cron/reminders?secret=YOUR_CRON_SECRET` every 15 minutes.

## 7. Deploy

The app needs a host that runs Node.js (a Next.js server), not plain static hosting.

- **Your existing hosting:** if it supports Node.js apps (cPanel "Setup Node.js App", a VPS, Render, Railway and similar), run `npm run build` then `npm start`, and add all the variables from `.env.example`.
- **Vercel:** import the GitHub repo, add the environment variables, then point your domain's DNS to Vercel.

After deploying, set `NEXT_PUBLIC_SITE_URL` to your live address and update the Supabase and Paystack URLs above.

## 8. Before going live

Work through [`docs/SECURITY.md`](docs/SECURITY.md) first. It covers Supabase settings, hosting, account two-factor, backups and the independent security review.


- [ ] Replace the placeholder text on `/privacy` and `/terms` with your real privacy policy and terms of use.
- [ ] In **Admin → Settings**, add your Telegram link and the crisis helpline numbers to show patients.
- [ ] Switch Paystack to live keys and live plan codes.
- [ ] Add a TURN server for calls (section 5).
- [ ] Test a full journey: patient sign-up → assessment → therapist application → admin approval → booking → session → payment.

## Project structure

```
supabase/schema.sql          Database tables, security rules and storage
src/app/                     Pages (patient/, therapist/, admin/, session/, api/)
src/app/actions/             Server actions for each role
src/lib/                     Supabase clients, auth, AI, Paystack, email/SMS, booking slots
src/components/              Shared UI
```

The platform name comes from `NEXT_PUBLIC_APP_NAME` (default "MindGuide AI"). The logo files are in `public/brand/`, and the browser and home-screen icons are `src/app/icon.png` and `src/app/apple-icon.png`.

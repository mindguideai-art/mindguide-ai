# Events and gallery

Admins manage both from the web app. The official website shows them automatically.

## One-time setup

1. In Supabase → SQL editor, run `supabase/migrations/2026-11-06-events-gallery.sql` once. It creates the tables and two public image folders (`event-images` and `gallery`). Only admins signed in with two-factor can upload or delete images.
2. In Vercel (web app project) → Settings → Environment Variables:
   - `NEXT_PUBLIC_WEBSITE_URL`: the website's address, e.g. `https://www.mindguideailtd.com`.
   - `ASSISTANT_ALLOWED_ORIGINS`: if you've set it, include the website's address(es), e.g. `https://www.mindguideailtd.com,https://mindguideailtd.com`. If it's empty, any site can call the API.
   - Then redeploy.
3. Confirmation emails need `RESEND_API_KEY` (see `.env.example`). Without it, people are still registered but get no email.

## Events (Admin → Events)

- **New event:** add an image (a wide 16:9 picture or flyer works best), title, short summary, full description, start and end time (Lagos time), and format (online, in person or both).
- **Online link:** kept private. It's only sent in the confirmation email. You can add it later, but people who registered before won't get it automatically, so add it before you publish if you can.
- **Places and deadline:** the form closes by itself when it's full, after the deadline, or when the event ends. Untick "Accept registrations" to close it early.
- **Extra question:** one optional question of your own, e.g. accessibility needs or dietary needs.
- **Publish:** tick "Show on the website". Drafts stay hidden.
- **Registrations:** open an event to see everyone who registered, search, mark people as attended, cancel a registration, or **Download (Excel/CSV)**.
- **Share link:** `https://www.mindguideailtd.com/events.html#<event-address>`. "View on website" on the event page opens it.
- Each person can register once per event (checked by email). The form has spam protection.

## Gallery (Admin → Gallery)

- Create an album (title, date, and optionally the event it was from), then drag in photos or choose them. Up to 60 at a time.
- Photos are resized in the browser before upload (longest side 2,000 px), so phone photos upload quickly and the website stays fast. iPhone HEIC photos must be exported as JPG first.
- Add captions, choose the cover, reorder, or delete photos.
- Tick "Show on the website" to publish the album.

## Privacy

- Event registrations are personal data. They're kept for 24 months and then deleted automatically. Deleting an event deletes its registrations at once. Viewing or downloading registrations is recorded in the access log.
- Being photographed at a mental health event can reveal something sensitive about a person. Only publish photos of people who agreed to be photographed, for example with a sign at registration and a "no photos" lanyard or sticker. The website says so, and offers removal by email.

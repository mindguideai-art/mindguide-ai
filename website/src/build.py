"""Builds the MindGuide AI website.

Run:  python3 src/build.py
Writes the finished pages next to /assets in the site folder (ready to host anywhere),
and a preview copy in /preview for the Claude artifact (the home page without its own doctype).

Change APP_URL when the web app moves to the client's domain (e.g. https://app.mindguide.ng).
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP_URL = "https://mindguide-ai.vercel.app"
EMAIL = "mindguideai@gmail.com"
# WhatsApp number in international format without + or spaces, e.g. 2348012345678. Leave empty to hide WhatsApp buttons.
WHATSAPP = ""
TELEGRAM = APP_URL + "/community"  # rules and privacy tips, then the Telegram group (https://t.me/+tdTz3hcagzkyNjQ0)
SITE_URL = "https://mindguide-website.vercel.app"  # the website's own address, used in sitemap.xml

ICONS = {
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "video": '<path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.94a.5.5 0 0 0-.76-.43L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    "lock": '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    "calendar": '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    "message": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    "chart": '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    "badge": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    "wifi": '<path d="M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.43a5 5 0 0 1 7 0"/>',
    "brain": '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>',
    "wallet": '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M9 15l2 2 4-4"/>',
    "image": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    "ticket": '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    "monitor": '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    "share": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "chev-left": '<path d="m15 18-6-6 6-6"/>',
    "chev-right": '<path d="m9 18 6-6-6-6"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
}


def icon(name, size=20):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>'


ARROW = f'<span class="arrow">{icon("arrow", 18)}</span>'

NAV = [("index.html", "Home"), ("how-it-works.html", "How it works"), ("pricing.html", "Plans"), ("therapists.html", "For therapists"), ("events.html", "Events"), ("gallery.html", "Gallery"), ("about.html", "About"), ("team.html", "Team"), ("faq.html", "FAQ"), ("contact.html", "Contact")]
DESKTOP_HIDE = {"index.html", "faq.html"}  # FAQ stays in the mobile menu and footer to keep the top bar uncluttered

PLANS = [
    ("basic", "Basic", "₦10,000", "2 sessions a month", ["Verified, licensed therapists", "AI wellbeing assessment", "Session calendar", "Email and SMS reminders"], ["Private messaging", "Mood and progress tracker"]),
    ("standard", "Standard", "₦20,000", "4 sessions a month", ["Everything in Basic", "Private messaging with your therapist", "Mood and progress tracker"], ["Calls outside booked sessions"]),
    ("premium", "Premium", "₦30,000", "8 sessions a month", ["Everything in Standard", "Voice and video calls outside booked sessions", "Priority booking, as little as 2 hours ahead"], []),
    ("family", "Family", "₦50,000", "12 sessions a month, shared", ["Everything in Premium", "Sessions shared across your household", "One plan for the people you care about"], []),
]


def plans_html(cta_prefix="Choose"):
    out = []
    for key, name, price, sessions, yes, no in PLANS:
        featured = key == "standard"
        items = "".join(f"<li>{icon('check', 16)}<span>{x}</span></li>" for x in yes)
        items += "".join(f'<li class="off">{icon("plus", 16).replace("<path", "<path transform=\"rotate(45 12 12)\"")}<span>{x}</span></li>' for x in no)
        btn = "btn-glow" if featured else "btn-ghost"
        out.append(f"""
      <article class="plan{' featured' if featured else ''}">
        {'<span class="tag">Most chosen</span>' if featured else ''}
        <h3>{name}</h3>
        <p class="price">{price}</p>
        <p class="per">per month · renews monthly · cancel anytime</p>
        <p class="sessions">{sessions}</p>
        <ul>{items}</ul>
        <a class="btn {btn}" href="{APP_URL}/register?plan={key}">{cta_prefix} {name}</a>
      </article>""")
    return '<div class="plans">' + "".join(out) + "</div>"


def layout(page, title, description, body, scripts=()):
    links = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if href == page else ""}>{label}</a>' for href, label in NAV if href not in DESKTOP_HIDE
    )
    mobile = "".join(f'<a href="{href}">{label}</a>' for href, label in NAV)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{description}">
<meta name="claude:viewport-fit-sides" content="cover">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="assets/img/app-home.webp">
<meta name="theme-color" content="#130f36">
<link rel="icon" href="assets/img/favicon.png">
<link rel="preload" href="assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<a class="sr-only" href="#main" style="position:absolute;left:-9999px">Skip to content</a>
<header class="site-header">
  <div class="wrap nav">
    <a class="brand" href="index.html" aria-label="MindGuide AI home"><img src="assets/img/mindguide-mark.png" alt="" width="38" height="38"><span><span class="mind">MindGuide</span> <b>AI</b></span></a>
    <nav class="nav-links" aria-label="Main">{links}</nav>
    <div class="nav-cta">
      <a class="btn btn-ghost" href="{APP_URL}/login">Sign in</a>
      <a class="btn btn-primary" href="{APP_URL}/register">Get started</a>
    </div>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">{icon("menu", 22)}</button>
  </div>
  <div class="mobile-menu" id="mobile-menu">
    <div class="wrap">
      <nav aria-label="Mobile">{mobile}</nav>
      <div class="btn-row"><a class="btn btn-ghost" href="{APP_URL}/login">Sign in</a><a class="btn btn-primary" href="{APP_URL}/register">Get started</a></div>
    </div>
  </div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="index.html"><img src="assets/img/mindguide-mark.png" alt="" width="38" height="38"><span><span class="mind">MindGuide</span> <b>AI</b></span></a>
        <p>A technology-enabled mental health and wellbeing platform making care more accessible, affordable, personalised and inclusive. Guiding minds, empowering lives.</p>
      </div>
      <div>
        <h4>Get support</h4>
        <ul>
          <li><a href="{APP_URL}/register">Create an account</a></li>
          <li><a href="how-it-works.html">How it works</a></li>
          <li><a href="pricing.html">Plans and prices</a></li>
          <li><a href="{APP_URL}/login">Sign in</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="about.html">About us</a></li>
          <li><a href="team.html">Our team</a></li>
          <li><a href="events.html">Events</a></li>
          <li><a href="gallery.html">Gallery</a></li>
          <li><a href="therapists.html">For therapists</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Legal</h4>
        <ul>
          <li><a href="{APP_URL}/terms">Terms of use</a></li>
          <li><a href="{APP_URL}/privacy">Privacy</a></li>
          <li><a href="{TELEGRAM}">Telegram community</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span id="year">2026</span> MindGuide AI. All rights reserved.</span>
      <span>Not for emergencies. If you are in danger, call 112 now.</span>
    </div>
  </div>
</footer>
<div id="mg-assistant" data-api="{APP_URL}/api/assistant" data-app="{APP_URL}" data-whatsapp="{WHATSAPP}" data-telegram="{TELEGRAM}"></div>
<script src="assets/site.js"></script>
<script src="assets/assistant.js"></script>
{"".join(f'<script src="assets/{js}"></script>' for js in scripts)}
</body>
</html>
"""


def cta_block(title="You don’t have to carry it alone.", text="Create your free account, take the 2-minute assessment and see therapists matched to what you’re going through."):
    return f"""
<section class="section" style="padding-bottom:0">
  <div class="wrap">
    <div class="cta">
      <h2>{title}</h2>
      <p>{text}</p>
      <div class="btn-row">
        <a class="btn btn-glow" href="{APP_URL}/register">Get started {ARROW}</a>
        <a class="btn btn-outline-light" href="pricing.html">See plans</a>
      </div>
    </div>
  </div>
</section>"""


def frame(img, url, alt, w=1280, h=800):
    return f'<div class="frame"><div class="bar"><i></i><i></i><i></i><small>{url}</small></div><img src="assets/img/{img}" alt="{alt}" width="{w}" height="{h}"></div>'


FAQS = {
    "Getting started": [
        ("Who is MindGuide AI for?", "Anyone in Nigeria who wants private, professional support for their mental health: students, working professionals, parents, couples and families. Whatever you’re going through, you’re welcome here."),
        ("How do I start?", "Create an account, answer a few short questions about how you’re feeling, and take the 2-minute wellbeing assessment. You’ll see therapists who specialise in what you’re going through, then choose a plan and book a time."),
        ("Do I need to download an app?", "No. MindGuide AI works in your web browser on a phone, tablet or computer. Allow your camera and microphone when your session starts."),
        ("What does the AI assessment do?", "It asks seven short questions based on standard screening scales, then gives you a plain-language summary and suggests therapists who fit. It is not a diagnosis. Your therapist talks through your needs with you."),
    ],
    "Sessions": [
        ("Who are the therapists?", "Licensed mental health professionals: clinical and counselling psychologists, psychotherapists and counsellors. Our team checks every therapist’s licence and qualifications before they can see patients."),
        ("Can I choose a video or voice session?", "Yes. Choose video to see your therapist face to face, or voice if you prefer, or if your internet is slow. Voice uses far less data."),
        ("Can I cancel or reschedule?", "Yes, from your sessions page, up to 24 hours before a confirmed session. You’ll get email and SMS reminders before every session."),
        ("Can I message my therapist between sessions?", "Private messaging is included from the Standard plan. Premium and Family plans can also call their therapist by voice or video outside booked sessions."),
    ],
    "Privacy and safety": [
        ("Is it really private?", "Yes. Calls connect directly between you and your therapist and are encrypted. Your registration details and assessment are only shared with a therapist if you allow it, and you can stop sharing at any time."),
        ("Who can see my information?", "Only you, and the therapists you choose to share with. Our admin team can see account and payment records to run the service, and they must use two-step sign-in to protect that access."),
        ("Is MindGuide AI for emergencies?", "No. If you are in danger or thinking about harming yourself, call 112 or go to the nearest hospital immediately."),
    ],
    "Plans and payments": [
        ("How much does it cost?", "Plans start at ₦10,000 a month for 2 sessions. Standard is ₦20,000 for 4 sessions, Premium is ₦30,000 for 8, and Family is ₦50,000 for 12 sessions shared across your household."),
        ("How do I pay?", "Securely with Paystack, by card, bank transfer or USSD. We never see or store your card details."),
        ("Can I cancel my plan?", "Yes, anytime from your Subscription page. You keep your plan until the end of the month you paid for, and it won’t renew."),
        ("What happens if I use all my sessions?", "You can upgrade your plan at any time to get more sessions that month. Unused sessions don’t roll over."),
    ],
}


def faq_html(groups, with_titles=True):
    out = []
    for g, items in groups.items():
        rows = "".join(
            f'<details><summary>{q}<span class="plus">{icon("plus", 16)}</span></summary><div class="answer"><p>{a}</p></div></details>' for q, a in items
        )
        out.append(f'<div class="faq-group">{"<h2>" + g + "</h2>" if with_titles else ""}<div class="faq">{rows}</div></div>')
    return "".join(out)


# ---------------------------------------------------------------- pages
HOME = f"""
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <span class="pill"><i>New</i> Online therapy, made for Nigeria</span>
      <h1>Guiding minds, <em class="grad-text">empowering lives.</em></h1>
      <p class="lead">Private video and voice sessions with licensed, verified therapists, from wherever you are. Book in minutes, track how you’re doing, and get support that fits your life.</p>
      <div class="btn-row">
        <a class="btn btn-glow" href="{APP_URL}/register">Find your therapist {ARROW}</a>
        <a class="btn btn-ghost" href="how-it-works.html">See how it works</a>
      </div>
      <ul class="assurances">
        <li>{icon("badge", 18)} Every licence verified</li>
        <li>{icon("lock", 18)} Private and encrypted</li>
        <li>{icon("wifi", 18)} Voice option for slow internet</li>
      </ul>
    </div>
    <aside class="checkin" aria-label="Mood check-in">
      <span class="label">Daily check-in</span>
      <h2>How are you feeling today?</h2>
      <div class="score"><output id="mood-value" for="mood">5</output><span>/10 · <span id="mood-word">Okay</span></span></div>
      <label for="mood" class="sr-only" style="position:absolute;left:-9999px">Your mood from 1 to 10</label>
      <input id="mood" type="range" min="1" max="10" value="5" step="1">
      <div class="scale-ends"><span>Very low</span><span>Very good</span></div>
      <p class="reply" id="mood-reply" aria-live="polite"><strong>Okay is a good place to start.</strong> Therapy isn’t only for hard times. It helps you understand yourself and stay steady.</p>
      <a class="btn btn-light" href="{APP_URL}/register">Talk to a therapist {ARROW}</a>
      <p class="fine">This is the same 1–10 check-in you’ll use in the app to see your progress over time.</p>
    </aside>
  </div>
</section>

<section class="strip" aria-label="At a glance">
  <div class="wrap">
    <ul>
      <li><b>36 states + FCT</b><span>Support anywhere in Nigeria</span></li>
      <li><b>From ₦10,000</b><span>a month, for 2 sessions</span></li>
      <li><b>Video or voice</b><span>Right in your browser</span></li>
      <li><b>2 minutes</b><span>to take your first assessment</span></li>
    </ul>
  </div>
</section>

<section class="section manifesto">
  <div class="wrap manifesto-grid">
    <div>
      <p class="eyebrow">Why we exist</p>
      <blockquote style="margin-top:18px">Everyone carries something. <span>You don’t have to carry it alone.</span></blockquote>
      <p class="lead" style="margin-top:22px">MindGuide AI makes professional mental health support private, affordable and easy to reach, so you can look after yourself without explaining it to anyone.</p>
    </div>
    <div class="reasons">
      <div>{icon("lock", 26)}<div><h3>Talk privately, from anywhere</h3><p>No waiting rooms and no one needs to know. Join from your bedroom, your car or your office with the door closed.</p></div></div>
      <div>{icon("badge", 26)}<div><h3>Professionals you can trust</h3><p>Every therapist is licensed, and our team checks their licence and qualifications before they’re listed.</p></div></div>
      <div>{icon("heart", 26)}<div><h3>Support for real life</h3><p>Anxiety, stress, relationships, grief, parenting, work pressure, healing from the past. Bring whatever you’re carrying.</p></div></div>
      <div>{icon("wallet", 26)}<div><h3>Plans that fit your budget</h3><p>Monthly plans from ₦10,000, paid securely with Paystack. Cancel anytime.</p></div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">How it works</p>
      <h2>From sign-up to your first session in three steps</h2>
    </div>
    <div class="steps">
      <div class="step"><h3>Tell us how you feel</h3><p>Create a free account and answer a few private questions about how you’re feeling and what you need help with.</p></div>
      <div class="step"><h3>Meet your match</h3><p>Our AI assessment suggests verified therapists who specialise in what you’re going through. Read their profiles and reviews.</p></div>
      <div class="step"><h3>Start talking</h3><p>Choose a plan, book a time that suits you, and join your video or voice session in your browser.</p></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="feature">
      <div class="copy">
        <p class="eyebrow">Sessions</p>
        <h3>Video and voice sessions built in, like WhatsApp</h3>
        <p>Join with one tap from your sessions page. No extra apps or links to copy. If your network is slow, switch to voice and keep talking.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Private, encrypted calls between you and your therapist</span></li>
          <li>{icon("check", 18)}<span>Reminders by email and SMS before every session</span></li>
          <li>{icon("check", 18)}<span>Reschedule or cancel up to 24 hours before</span></li>
        </ul>
      </div>
      <div class="duo">
        {frame("app-home.webp", "mindguide-ai · Home", "Patient home screen showing the next video session, mood check-in and plan")}
        <div class="phone"><img src="assets/img/phone-call.webp" alt="Voice call in progress on a phone" width="390" height="800"></div>
      </div>
    </div>

    <div class="feature flip">
      <div class="copy">
        <p class="eyebrow">Matching</p>
        <h3>Find a therapist who understands you</h3>
        <p>See each therapist’s specialties, languages, experience and reviews from other patients, then pick a time from their real availability.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Matches from your assessment are shown first</span></li>
          <li>{icon("check", 18)}<span>Languages including English, Yoruba, Igbo and Hausa</span></li>
          <li>{icon("check", 18)}<span>Only verified therapists can be booked</span></li>
        </ul>
      </div>
      {frame("app-book.webp", "mindguide-ai · Book a session", "Therapist profile with reviews next to the booking calendar", 1280, 860)}
    </div>

    <div class="feature">
      <div class="copy">
        <p class="eyebrow">Between sessions</p>
        <h3>Stay connected and see your progress</h3>
        <p>Message your therapist privately, log a quick daily check-in, and watch your mood and assessment scores change over the weeks.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Secure messaging with your therapist</span></li>
          <li>{icon("check", 18)}<span>Mood check-ins and progress charts</span></li>
          <li>{icon("check", 18)}<span>A private Telegram community for extra support</span></li>
        </ul>
      </div>
      {frame("app-progress.webp", "mindguide-ai · My progress", "Progress page with mood check-in chart and assessment scores")}
    </div>
  </div>
</section>

<section class="section night">
  <div class="wrap night-grid">
    <div>
      <p class="eyebrow">For therapists</p>
      <h2 style="margin-top:14px">Grow your practice online</h2>
      <p class="lead" style="margin-top:20px">Set your own hours, see clients from anywhere in Nigeria, and let MindGuide AI handle bookings, reminders and payments.</p>
      <ul class="ticks">
        <li>{icon("check", 18)}<span>Your own profile, reviews and availability</span></li>
        <li>{icon("check", 18)}<span>Accept or decline bookings, with private session notes</span></li>
        <li>{icon("check", 18)}<span>Built-in video and voice calls, no extra software</span></li>
        <li>{icon("check", 18)}<span>Track your sessions and earnings in one place</span></li>
      </ul>
      <div class="btn-row" style="margin-top:32px">
        <a class="btn btn-light" href="{APP_URL}/register/therapist">Apply to join {ARROW}</a>
        <a class="btn btn-outline-light" href="therapists.html">Learn more</a>
      </div>
    </div>
    {frame("app-therapist.webp", "mindguide-ai · Therapist portal", "Therapist dashboard with requests, upcoming sessions, earnings and reviews")}
  </div>
</section>

<section class="section" id="plans">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Plans</p>
      <h2>Simple monthly plans</h2>
      <p class="lead">Every plan includes verified therapists, the AI wellbeing assessment and session reminders. Pay securely with Paystack and cancel anytime.</p>
    </div>
    {plans_html()}
    <p class="plans-note">Not sure which to pick? Start with your free assessment first. You choose and pay for a plan after you’ve seen your matched therapists. <a href="pricing.html">Compare plans in detail</a>.</p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Questions</p>
      <h2>Good to know</h2>
    </div>
    {faq_html({"": FAQS["Getting started"][:2] + FAQS["Privacy and safety"][:1] + FAQS["Sessions"][2:3] + FAQS["Privacy and safety"][2:3]}, with_titles=False)}
    <div class="btn-row" style="margin-top:24px"><a href="faq.html" class="btn btn-ghost">All questions {ARROW}</a><button type="button" class="btn btn-primary" data-open-assistant>Ask the MindGuide Assistant</button></div>
  </div>
</section>
<section class="section home-events" id="home-events" data-api="{APP_URL}" hidden>
  <div class="wrap">
    <div class="section-head-row">
      <div class="section-head" style="margin-bottom:0">
        <p class="eyebrow">Upcoming events</p>
        <h2>Join us in person and online</h2>
      </div>
      <a class="btn btn-ghost" href="events.html">All events {ARROW}</a>
    </div>
    <div class="ev-grid" data-events-home></div>
  </div>
</section>

{cta_block()}
"""

HOW = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">How it works</p>
    <h1>Getting help should feel simple</h1>
    <p class="lead">From your first check-in to your weekly sessions, everything happens in one private place you can open on your phone.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="feature">
      <div class="copy">
        <p class="eyebrow">Step 1</p>
        <h3>Create your account</h3>
        <p>Tell us a little about yourself: your age, where you live, how you’re feeling, what you’d like help with and whether you’ve had support before. Your answers are private.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Takes about 3 minutes</span></li>
          <li>{icon("check", 18)}<span>Pick a plan now, or decide later</span></li>
        </ul>
      </div>
      {frame("app-register.webp", "mindguide-ai · Create your account", "Registration step where a patient chooses a plan")}
    </div>
    <div class="feature flip">
      <div class="copy">
        <p class="eyebrow">Step 2</p>
        <h3>Take the 2-minute assessment</h3>
        <p>Seven short questions based on standard screening scales. You get a gentle summary in plain language and a list of therapists who specialise in what you’re facing. It is not a diagnosis.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Retake it anytime to see how you’re changing</span></li>
          <li>{icon("check", 18)}<span>If your answers suggest you need urgent help, we show emergency contacts straight away</span></li>
        </ul>
      </div>
      {frame("app-assessment.webp", "mindguide-ai · Your results", "Assessment results with a plain-language summary and recommended therapists")}
    </div>
    <div class="feature">
      <div class="copy">
        <p class="eyebrow">Step 3</p>
        <h3>Book and join your session</h3>
        <p>Choose a day and time from your therapist’s real availability, video or voice. Your therapist confirms, and you get reminders the day before and an hour before.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Join in your browser with one tap</span></li>
          <li>{icon("check", 18)}<span>Reschedule or cancel up to 24 hours before</span></li>
        </ul>
      </div>
      <div class="duo">
        {frame("app-home.webp", "mindguide-ai · Home", "Home screen with a Join session button")}
        <div class="phone"><img src="assets/img/phone-call.webp" alt="Voice session on a phone" width="390" height="800"></div>
      </div>
    </div>
    <div class="feature flip">
      <div class="copy">
        <p class="eyebrow">Step 4</p>
        <h3>Keep going between sessions</h3>
        <p>Message your therapist, log how you feel each day and watch your progress. Share your details with a therapist only if you want to, and stop sharing anytime.</p>
        <ul class="ticks">
          <li>{icon("check", 18)}<span>Rate each session to help others choose</span></li>
          <li>{icon("check", 18)}<span>Join our Telegram community</span></li>
        </ul>
      </div>
      {frame("app-chat.webp", "mindguide-ai · Messages", "Private chat between a patient and her therapist")}
    </div>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">What we help with</p>
      <h2>Bring whatever you’re carrying</h2>
    </div>
    <div class="chips">
      {''.join(f'<span>{c}</span>' for c in ["Anxiety", "Depression", "Stress and burnout", "Grief and loss", "Relationships and marriage", "Trauma and PTSD", "Sleep problems", "Self-esteem", "Family issues", "Parenting", "Work or school pressure", "Life changes", "Addiction", "Anger", "Healing from past experiences"])}
    </div>
    <div class="crisis" style="margin-top:40px">{icon("alert", 24)}<p><b>MindGuide AI is not an emergency service.</b> If you are in danger or thinking about harming yourself, call <b>112</b> or go to the nearest hospital now.</p></div>
  </div>
</section>
{cta_block()}
"""

PRICING = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Plans and prices</p>
    <h1>Care that fits your month</h1>
    <p class="lead">Choose how many sessions you need. Every plan renews monthly, is paid securely with Paystack, and can be cancelled anytime.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    {plans_html()}
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head"><h2>Compare plans</h2></div>
    <div class="table-wrap">
      <table class="compare">
        <thead><tr><th scope="col">Included</th><th scope="col">Basic</th><th scope="col">Standard</th><th scope="col">Premium</th><th scope="col">Family</th></tr></thead>
        <tbody>
          <tr><th scope="row">Price per month</th><td>₦10,000</td><td>₦20,000</td><td>₦30,000</td><td>₦50,000</td></tr>
          <tr><th scope="row">Video or voice sessions</th><td>2</td><td>4</td><td>8</td><td>12, shared</td></tr>
          <tr><th scope="row">Verified, licensed therapists</th><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">AI wellbeing assessment</th><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">Calendar, email and SMS reminders</th><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">Private messaging with your therapist</th><td>—</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">Mood and progress tracker</th><td>—</td><td class="yes">✓</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">Calls outside booked sessions</th><td>—</td><td>—</td><td class="yes">✓</td><td class="yes">✓</td></tr>
          <tr><th scope="row">Priority booking (2 hours ahead)</th><td>—</td><td>—</td><td class="yes">✓</td><td class="yes">✓</td></tr>
        </tbody>
      </table>
    </div>
    <p class="plans-note">Booking normally needs at least 24 hours’ notice. Premium and Family can book as little as 2 hours ahead. Sessions reset each month and don’t roll over.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    {faq_html({"Billing questions": FAQS["Plans and payments"]})}
  </div>
</section>
{cta_block("Start with a free assessment.", "See your matched therapists before you choose a plan.")}
"""

THERAPISTS = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">For therapists</p>
    <h1>Do your best work, without the admin</h1>
    <p class="lead">Join a growing network of licensed professionals supporting people across Nigeria. Set your own hours and let MindGuide AI handle bookings, reminders, calls and payments.</p>
    <div class="btn-row" style="margin-top:32px"><a class="btn btn-glow" href="{APP_URL}/register/therapist">Apply to join {ARROW}</a><a class="btn btn-ghost" href="contact.html">Ask us a question</a></div>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="cards">
      <div class="card">{icon("calendar", 28)}<h3>Your hours, your way</h3><p>Set weekly availability and days off. Patients can only book times you’ve opened.</p></div>
      <div class="card">{icon("users", 28)}<h3>Clients matched to you</h3><p>Patients see you first when your specialties fit their assessment.</p></div>
      <div class="card">{icon("video", 28)}<h3>Calls built in</h3><p>Start video or voice sessions from your dashboard. No extra software or links.</p></div>
      <div class="card">{icon("file", 28)}<h3>Private session notes</h3><p>Keep notes for each session that only you can see.</p></div>
      <div class="card">{icon("shield", 28)}<h3>Consent-based records</h3><p>See a patient’s registration answers, assessment and mood history when they choose to share them.</p></div>
      <div class="card">{icon("wallet", 28)}<h3>Clear earnings</h3><p>See what you’ve earned per completed session and when it’s been paid out.</p></div>
    </div>
  </div>
</section>
<section class="section night">
  <div class="wrap night-grid">
    <div>
      <p class="eyebrow">How to join</p>
      <h2 style="margin-top:14px">Verified before you see your first client</h2>
      <p class="lead" style="margin-top:20px">We check every application so patients can trust everyone on MindGuide AI.</p>
      <ol class="ticks" style="list-style:none">
        <li>{icon("check", 18)}<span><b style="color:#fff">Create your account</b> and complete your profile: title, bio, specialties, languages, experience and fee.</span></li>
        <li>{icon("check", 18)}<span><b style="color:#fff">Upload your licence</b> and any qualifications or certificates.</span></li>
        <li>{icon("check", 18)}<span><b style="color:#fff">Our team reviews them</b> and approves your account, usually within a few working days.</span></li>
        <li>{icon("check", 18)}<span><b style="color:#fff">Set your hours</b> and start accepting bookings.</span></li>
      </ol>
    </div>
    {frame("app-availability.webp", "mindguide-ai · Availability", "Therapist availability settings with weekly hours and days off")}
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Who can apply</p>
      <h2>Licensed mental health professionals</h2>
      <p class="lead">Clinical and counselling psychologists, psychotherapists and counsellors with a current practising licence. We welcome specialists in:</p>
    </div>
    <div class="chips">{''.join(f'<span>{c}</span>' for c in ["Anxiety", "Depression", "Trauma and PTSD", "Grief", "Relationships and couples", "Family therapy", "Addiction", "Child and adolescent", "Stress and burnout", "Sleep"])}</div>
  </div>
</section>
{cta_block("Ready to support more people?", "Apply in minutes. We’ll review your licence and let you know by email.").replace(f'{APP_URL}/register"', f'{APP_URL}/register/therapist"').replace("Get started", "Apply to join").replace('href="pricing.html">See plans', 'href="contact.html">Contact us')}
"""

TEAM_MEMBERS = [
    ("Oluwakorede Atansuyi", "Founder & Chief Executive Officer", "team-oluwakorede-atansuyi.webp"),
    ("Ogbodo Daniel Obumneme", "Chief Medical Officer", "team-ogbodo-daniel.webp"),
    ("Joshua Ogiriosa", "Chief Technology Officer", "team-joshua-ogiriosa.webp"),
]


def team_html():
    return '<div class="team">' + "".join(
        f'<figure class="member"><div class="member-photo"><img src="assets/img/{img}" alt="Portrait of {name}" width="800" height="1000"></div>'
        f'<figcaption><h3>{name}</h3><p>{role}</p></figcaption></figure>'
        for name, role, img in TEAM_MEMBERS
    ) + "</div>"


ABOUT = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">About us</p>
    <h1>No one should navigate their mental wellbeing alone</h1>
    <p class="lead">MindGuide AI is a technology-enabled mental health and wellbeing platform designed to make mental healthcare more accessible, affordable, personalised and inclusive.</p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap about-split">
    <div>
      <p class="eyebrow">Why we exist</p>
      <h2 style="margin-top:14px">Every mental health journey is different</h2>
    </div>
    <div class="prose">
      <p>We recognise that mental health journeys are different. Everyone experiences emotional and psychological challenges differently, and finding the right support can often be difficult due to cost, limited access to professionals, stigma and a lack of reliable information.</p>
      <p>MindGuide AI addresses these challenges by combining artificial intelligence, professional mental health services, education and community support to create a more connected approach to mental wellbeing.</p>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">What we offer</p>
      <h2>One connected place for your wellbeing</h2>
    </div>
    <div class="cards">
      <div class="card">{icon("brain", 28)}<h3>AI-assisted assessments</h3><p>Wellbeing assessments with personalised recommendations, so you know where to start.</p></div>
      <div class="card">{icon("badge", 28)}<h3>Qualified professionals</h3><p>Connect with verified mental health professionals by video or voice, from wherever you are.</p></div>
      <div class="card">{icon("file", 28)}<h3>Educational resources</h3><p>Reliable information to help you understand mental health and look after yourself.</p></div>
      <div class="card">{icon("users", 28)}<h3>Supportive communities</h3><p>Connect with others who understand, in a safe and supportive space.</p></div>
      <div class="card">{icon("calendar", 28)}<h3>Programmes and events</h3><p>Discover relevant mental health programmes and events that help you grow.</p></div>
      <div class="card">{icon("heart", 28)}<h3>Strategic partnerships</h3><p>Building partnerships with hospitals, NGOs and institutions to strengthen referrals, counselling and community support.</p></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap about-split">
    <div>
      <p class="eyebrow">Beyond digital access</p>
      <h2 style="margin-top:14px">Working with partners who share our goal</h2>
    </div>
    <div class="prose">
      <p>Our approach extends beyond digital access. Through strategic partnerships with hospitals, healthcare professionals, NGOs, educational institutions and other relevant organisations, we aim to strengthen access to mental health education, professional referrals, counselling and community-based support.</p>
      <div class="chips" style="margin-top:22px">{''.join(f'<span>{c}</span>' for c in ["Hospitals", "Healthcare professionals", "NGOs", "Educational institutions", "Community organisations"])}</div>
      <p style="margin-top:22px">Interested in partnering with us? <a href="contact.html">Get in touch</a>.</p>
    </div>
  </div>
</section>

<section class="section manifesto">
  <div class="wrap manifesto-grid">
    <div>
      <p class="eyebrow">What we believe</p>
      <blockquote style="margin-top:18px">Technology should complement human care, <span>not replace it.</span></blockquote>
    </div>
    <div class="prose">
      <p>At MindGuide AI, our goal is to bridge the gap between individuals who need support and the people, services and resources that can help them.</p>
      <p>We are building an inclusive mental health ecosystem where no one has to navigate their mental wellbeing journey without guidance, connection or support.</p>
      <p class="tagline">MindGuide AI · Guiding minds, empowering lives</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap mv">
    <article class="mv-card">
      <p class="eyebrow">Our mission</p>
      <p class="mv-lead">To make mental health and wellbeing support more accessible, affordable and personalised by connecting individuals to the right professional care, resources, communities and support systems through technology, education and strategic partnerships.</p>
      <p>We are committed to creating a safe and supportive environment where everyone can access guidance, build emotional resilience and take meaningful steps towards better mental wellbeing.</p>
    </article>
    <article class="mv-card mv-dark">
      <p class="eyebrow">Our vision</p>
      <p class="mv-lead">To become a leading technology-driven mental health and wellbeing ecosystem that transforms how individuals access, experience and sustain mental healthcare across Africa and beyond.</p>
      <p>We envision a world where seeking mental health support is accessible, affordable, stigma-free and integrated into everyday life.</p>
    </article>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">What we stand for</p><h2>Our promises to you</h2></div>
    <div class="values">
      <div><h3>Safety first</h3><p>Every therapist’s licence is checked before they’re listed. If an assessment suggests someone may be at risk, they see emergency contacts straight away and the answers are flagged for our team to review.</p></div>
      <div><h3>Your privacy, your choice</h3><p>Calls are encrypted and connect directly between you and your therapist. You decide which therapists can see your details, and you can stop sharing anytime.</p></div>
      <div><h3>Care without judgement</h3><p>Whatever you’re going through, you deserve to be heard with respect, warmth and confidentiality.</p></div>
      <div><h3>Stigma-free support</h3><p>Seeking help is a strength. We make it private and simple so you can take the first step on your own terms.</p></div>
    </div>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="section-head-row">
      <div class="section-head" style="margin-bottom:0"><p class="eyebrow">Our team</p><h2 style="font-size:var(--step-3)">Meet the people leading MindGuide AI</h2></div>
      <a class="btn btn-ghost" href="team.html">Meet the team {ARROW}</a>
    </div>
    {team_html()}
  </div>
</section>
<section class="section night">
  <div class="wrap night-grid">
    <div>
      <p class="eyebrow">How we keep you safe</p>
      <h2 style="margin-top:14px">Built with security in mind</h2>
      <ul class="ticks">
        <li>{icon("check", 18)}<span>Therapists are verified by our team before they can see patients</span></li>
        <li>{icon("check", 18)}<span>Encrypted video and voice calls</span></li>
        <li>{icon("check", 18)}<span>Consent controls for who can see your information</span></li>
        <li>{icon("check", 18)}<span>Two-step sign-in for every admin account</span></li>
        <li>{icon("check", 18)}<span>Secure payments through Paystack. We never see your card details</span></li>
      </ul>
    </div>
    {frame("app-verify.webp", "mindguide-ai · Therapist verification", "Admin screen reviewing a therapist's licence before approval")}
  </div>
</section>
{cta_block()}
"""

FAQ = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">FAQ</p>
    <h1>Questions, answered</h1>
    <p class="lead">Can’t find what you’re looking for? <a href="contact.html">Contact us</a> or ask in our Telegram community.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap">
    {faq_html(FAQS)}
    <div class="btn-row" style="margin-top:40px"><button type="button" class="btn btn-primary" data-open-assistant>Ask the MindGuide Assistant</button><a class="btn btn-ghost" href="contact.html">Contact us</a></div>
    <div class="crisis" style="margin-top:40px">{icon("alert", 24)}<p><b>In an emergency, don’t wait.</b> If you are in danger or thinking about harming yourself, call <b>112</b> or go to the nearest hospital now.</p></div>
  </div>
</section>
{cta_block()}
"""

WA_ITEM = (f'<div class="contact-item"><span class="ico" style="background:#e9fbef;color:#1a9e52">{icon("phone", 22)}</span><div><b>WhatsApp</b><a href="https://wa.me/{WHATSAPP}">+{WHATSAPP}</a></div></div>' if WHATSAPP else "")

CONTACT = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Contact</p>
    <h1>We’re here to help</h1>
    <p class="lead">Questions about plans, your account, joining as a therapist or partnering with us? Send us a message and we’ll reply as soon as we can.</p>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="wrap contact-grid">
    <div class="contact-list">
      <div class="contact-item"><span class="ico">{icon("mail", 22)}</span><div><b>Email</b><span id="email-text">{EMAIL}</span><button class="copy-btn" type="button" data-copy="{EMAIL}">Copy</button></div></div>
      <div class="contact-item"><span class="ico">{icon("message", 22)}</span><div><b>MindGuide Assistant</b><span>Instant answers about plans, privacy and booking. </span><button class="copy-btn" type="button" data-open-assistant>Start a chat</button></div></div>
      {WA_ITEM}
      <div class="contact-item"><span class="ico">{icon("send", 22)}</span><div><b>Telegram community</b><a href="{TELEGRAM}">Join the conversation</a></div></div>
      <div class="contact-item"><span class="ico">{icon("pin", 22)}</span><div><b>Where we work</b><span>Online, across all 36 states and the FCT</span></div></div>
      <div class="contact-item"><span class="ico">{icon("users", 22)}</span><div><b>Already a member?</b><a href="{APP_URL}/login">Sign in</a><span> and use Privacy &amp; support to reach our team.</span></div></div>
      <div class="crisis">{icon("alert", 24)}<p><b>Need urgent help?</b> This inbox isn’t monitored around the clock. In an emergency call <b>112</b>.</p></div>
    </div>
    <form class="form" id="contact-form" data-to="{EMAIL}">
      <div class="row">
        <label for="c-name">Your name<input id="c-name" name="name" required autocomplete="name"></label>
        <label for="c-email">Email<input id="c-email" name="email" type="email" required autocomplete="email"></label>
      </div>
      <div class="row">
        <label for="c-phone">Phone (optional)<input id="c-phone" name="phone" type="tel" autocomplete="tel" placeholder="e.g. 08012345678"></label>
        <label for="c-topic">Topic<select id="c-topic" name="topic"><option>General question</option><option>Plans and payments</option><option>My account</option><option>Joining as a therapist</option><option>Partnerships and press</option></select></label>
      </div>
      <label for="c-message">Message<textarea id="c-message" name="message" required placeholder="How can we help?"></textarea></label>
      <p class="note">Please don’t include medical details here. Share those with your therapist inside the app.</p>
      <button class="btn btn-primary" type="submit">Send message {ARROW}</button>
      <p class="form-status" id="form-status" role="status" hidden></p>
    </form>
  </div>
</section>
"""

NOT_FOUND = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Page not found</p>
    <h1>We couldn’t find that page</h1>
    <p class="lead">The link may be old or mistyped. Try the home page, or ask the MindGuide Assistant.</p>
    <div class="btn-row" style="margin-top:32px"><a class="btn btn-primary" href="index.html">Go to the home page {ARROW}</a><button type="button" class="btn btn-ghost" data-open-assistant>Ask the assistant</button></div>
  </div>
</section>
"""

TEAM = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Our team</p>
    <h1>The people behind MindGuide AI</h1>
    <p class="lead">A team of healthcare and technology professionals working to make mental health support easier to reach, more affordable and free of stigma, for everyone.</p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="team-page">
      <div class="team-head"><p class="eyebrow">Leadership</p><h2>Meet our leadership team</h2></div>
      {team_html()}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="ev-host">
      <div>
        <p class="eyebrow">Work with us</p>
        <h2>Are you a licensed therapist?</h2>
        <p>Join our network of verified psychologists, psychotherapists and counsellors, set your own hours and support clients across Nigeria.</p>
      </div>
      <a class="btn btn-light" href="therapists.html">Apply as a therapist {ARROW}</a>
    </div>
  </div>
</section>
"""

EVENTS = f"""
<section class="page-hero ev-hero">
  <div class="wrap">
    <p class="eyebrow">Events</p>
    <h1>Talks, workshops and walks for your wellbeing</h1>
    <p class="lead">Community events hosted by MindGuide AI and our licensed therapists, online and across Nigeria. Registration takes a minute, and we email your confirmation straight away.</p>
  </div>
</section>

<section class="section" style="padding-top:0" id="events-app" data-api="{APP_URL}" data-telegram="{TELEGRAM}">
  <div class="wrap">
    <div data-events-upcoming aria-live="polite">
      <div class="ev-skeleton"><div></div><div></div><div></div></div>
    </div>
    <div class="ev-past" data-events-past hidden>
      <div class="section-head" style="margin:clamp(64px,8vw,112px) 0 28px">
        <p class="eyebrow">Past events</p>
        <h2 style="font-size:var(--step-3)">Recently</h2>
      </div>
      <div class="ev-past-list" data-events-past-list></div>
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap">
    <div class="ev-host">
      <div>
        <p class="eyebrow">Work with us</p>
        <h2>Want a session for your team, school or church?</h2>
        <p>Our therapists run talks and workshops on stress, burnout, grief, relationships and more. Tell us what you have in mind.</p>
      </div>
      <a class="btn btn-light" href="contact.html">Get in touch {ARROW}</a>
    </div>
  </div>
</section>

<dialog class="ev-modal" id="ev-modal" aria-labelledby="ev-modal-title">
  <div class="ev-modal-inner" data-modal-body></div>
</dialog>
"""

GALLERY = f"""
<section class="page-hero">
  <div class="wrap">
    <p class="eyebrow">Gallery</p>
    <h1>Moments from our community</h1>
    <p class="lead">Photos from MindGuide AI events, walks and workshops. Thank you to everyone who showed up for their wellbeing, and for each other.</p>
  </div>
</section>

<section class="section" style="padding-top:0" id="gallery-app" data-api="{APP_URL}">
  <div class="wrap">
    <div data-gallery aria-live="polite">
      <div class="ev-skeleton gal"><div></div><div></div><div></div></div>
    </div>
    <p class="gal-note">We only share photos of people who agreed to be photographed. If you'd like a photo of you removed, email <a href="mailto:{EMAIL}">{EMAIL}</a> and we'll take it down.</p>
  </div>
</section>

<div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Photo viewer">
  <button class="lb-btn lb-close" type="button" aria-label="Close">{icon("x", 22)}</button>
  <button class="lb-btn lb-prev" type="button" aria-label="Previous photo">{icon("chev-left", 26)}</button>
  <figure><img alt=""><figcaption></figcaption></figure>
  <button class="lb-btn lb-next" type="button" aria-label="Next photo">{icon("chev-right", 26)}</button>
</div>
"""

PAGES = {
    "index.html": ("MindGuide AI · Online therapy in Nigeria", "Private video and voice therapy with licensed, verified therapists across Nigeria. Guiding minds, empowering lives. Plans from ₦10,000 a month.", HOME),
    "how-it-works.html": ("How it works · MindGuide AI", "Create an account, take a 2-minute assessment, meet a matched therapist and join private video or voice sessions in your browser.", HOW),
    "pricing.html": ("Plans and prices · MindGuide AI", "Monthly therapy plans from ₦10,000: Basic, Standard, Premium and Family. Pay with Paystack and cancel anytime.", PRICING),
    "therapists.html": ("For therapists · MindGuide AI", "Licensed therapists: set your own hours and see clients across Nigeria. MindGuide AI handles bookings, calls, reminders and payments.", THERAPISTS),
    "about.html": ("About us · MindGuide AI", "MindGuide AI is a technology-enabled mental health and wellbeing platform making mental healthcare more accessible, affordable, personalised and inclusive.", ABOUT),
    "team.html": ("Our team · MindGuide AI", "Meet the leadership of MindGuide AI: Oluwakorede Atansuyi, Founder and CEO, Ogbodo Daniel Obumneme, Chief Medical Officer, and Joshua Ogiriosa, Chief Technology Officer.", TEAM),
    "events.html": ("Events · MindGuide AI", "Mental health talks, workshops and community walks from MindGuide AI, online and across Nigeria. Register online in a minute.", EVENTS),
    "gallery.html": ("Gallery · MindGuide AI", "Photos from MindGuide AI community events, walks and workshops.", GALLERY),
    "faq.html": ("FAQ · MindGuide AI", "Answers about getting started, sessions, privacy and plans on MindGuide AI.", FAQ),
    "contact.html": ("Contact · MindGuide AI", "Get in touch with the MindGuide AI team.", CONTACT),
    "404.html": ("Page not found · MindGuide AI", "This page doesn't exist.", NOT_FOUND),
}

if __name__ == "__main__":
    preview = ROOT / "preview"
    preview.mkdir(exist_ok=True)
    SCRIPTS = {"index.html": ("events.js",), "events.html": ("events.js",), "gallery.html": ("gallery.js",)}
    for name, (title, desc, body) in PAGES.items():
        html = layout(name, title, desc, body, SCRIPTS.get(name, ()))
        (ROOT / name).write_text(html)
        if name == "index.html":
            # Artifact preview: the platform adds the doctype/html/head/body wrapper itself.
            head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
            head = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', "", head)
            inner = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
            head = re.sub(r"<title>.*?</title>", "<title>MindGuide AI Website</title>", head, count=1)
            (preview / "index.html").write_text(head.strip() + "\n" + inner.strip() + "\n")
        print("wrote", name)
    urls = "".join(f"<url><loc>{SITE_URL}/{'' if n == 'index.html' else n}</loc></url>" for n in PAGES if n != "404.html")
    (ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    (ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")

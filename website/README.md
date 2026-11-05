# MindGuide AI website

The official marketing website for MindGuide AI. Plain HTML, CSS and a little JavaScript: no build step is needed to host it.

## Pages
`index.html` (home), `how-it-works.html`, `pricing.html`, `therapists.html`, `about.html`, `faq.html`, `contact.html`.

## Editing
All page content lives in `src/build.py`. Edit it, then run:

```
python3 src/build.py
```

This rewrites the HTML pages. Styles are in `assets/style.css`, scripts in `assets/site.js`, images in `assets/img/`.

- **Web app address:** change `APP_URL` at the top of `src/build.py` when the app moves to the client's domain (for example `https://app.mindguide.ng`), then rebuild. Every "Get started", "Sign in" and plan button points there.
- **Contact email:** change `EMAIL` in the same file.

## Hosting on Vercel
1. In Vercel, **Add New → Project** and import the `mindguideai-art/mindguide-ai` repository again.
2. Set **Root Directory** to `website` and **Framework Preset** to **Other**. Leave the build command empty.
3. Deploy. When the client has a domain, add `www.yourdomain.com` to this project (the website) and `app.yourdomain.com` to the web app project.

It also works on any ordinary web hosting (cPanel): upload everything in this folder except `src/` and `preview/` to `public_html`.

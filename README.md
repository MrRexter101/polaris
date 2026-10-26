# Polaris by Tradewind

The Polaris landing page. Plain HTML, CSS and JavaScript modules: no build step, no dependencies.
Hosted on GitHub Pages from the `main` branch.

## Run it locally

```
python3 serve.py 5179
```

Open http://localhost:5179. Use `serve.py`, not the file directly: the scripts are ES modules, which
browsers refuse to load from `file://`, and the study film needs video seeking (HTTP Range requests),
which Python's built-in server lacks. `serve.py` also turns off caching, so a plain reload shows edits.

On localhost the Results section shows a labelled sample layout. On the live site it stays hidden
until real numbers are added (see below).

## Where things live

The code follows [Feature-Sliced Design](https://fsd.how): `app` starts things, `pages` holds the page
and its sections, `shared` holds pieces with no Polaris-specific logic. Code may only import from a
layer below it (`app → pages → shared`).

```
index.html                      all page content and copy, section by section
admin/index.html                the private admin page (see "Admin" below)
assets/                         images, logo, campus photos (assets/campus), small face avatars (assets/faces),
                                films (assets/video), share image (og.jpg)
src/
  app/
    boot.js                     runs before first paint: marks scripts on, decides whether the opening voyage plays
    main.js                     script entry: starts the home page
    admin.js                    script entry for /admin (visitors never download it)
    styles/fonts.css            self-hosted Fraunces and General Sans (files in assets/fonts)
    styles/admin.css            stylesheet entry for /admin
    styles/tokens.css           colours, fonts, radii, shadows, spacing, header height
    styles/base.css             reset, type scale, utilities, the light section surfaces
  shared/
    config/contact.js           WhatsApp number, booking link, lead email, message text
    lib/                        DOM helpers, spring engine, one shared scroll loop,
                                in-view triggers, film autoplay, sticky fitting, scroll-scrubbed video
    ui/                         button, brand lockup, faces row, chapter marker, YouTube facade,
                                reveal (entrances: headings, text and cards, pictures)
  pages/home/
    index.js                    starts every section, top to bottom
    model/results.js            results data (empty = section hidden)
    lib/night.js                which sections are dark (header and chat button turn light there)
    ui/<section>/               one folder per section: its CSS, and its JS if it has behaviour
  pages/admin/
    index.js                    access gate and the screen router
    api/store.js                the admin's only door to data (sample now; the backend plugs in here)
    model/sample-data.js        labelled sample families and traffic, with checks that totals add up
    lib/access.js               the access code check
    ui/                         overview, pipeline, content, settings, charts, admin.css
```

Sections, in page order, and their folders under `src/pages/home/ui/`:

| Section on the page | Folder | Behaviour |
|---|---|---|
| Header, nav, mobile menu, progress line | `header/` | night mode, active link, menu |
| Opening voyage (first visit only) | `intro/` | a sail crosses the horizon while the film and fonts load, then the night parts; skipped on any scroll, tap or key, with reduced motion, and on deep links |
| Hero film | `hero/` | campus montage (phone gets a portrait cut), pause/play, line-by-line headline, settles back on scroll |
| Log line card | `log/` | |
| 01 Your route: "Which type of student are you?" | `chooser/` | the chosen track widens and opens; Type I books Polaris, II and III link to Odyssey |
| 02 Meet the director | `meet-director/` | YouTube facade (shared) |
| Film bands (study, consultation: Radcliffe Square) | `interlude/` | bands open on scroll; the study film scrubs with the scroll |
| 03 The package | `package/` | rolling price, sticky price card |
| 04 Impact projects | `impact/` | |
| Campus scene: "Guided by mentors from Oxford, Cambridge, Stanford and the Ivy League" | `campus/` | pinned; the scroll plays one film from the reading room to each campus and lights each name |
| 05 Programme directors | `directors/` | profile sheet grows out of the pressed card |
| 06 Tutors | `tutors/` | carousel arrows |
| 07 How it works | `how-it-works/` | on laptops a pinned scene: the stage holds while the scroll sails the course and lights each step; elsewhere the sail follows the steps |
| 08–09 Tradewind and its programmes | `tradewind/` | pinned scene on wide screens |
| 10 Results | `results/` | renders `model/results.js` |
| 11 Families | `families/` | |
| 12 Free consultation (band, map, form) | `consult/` | pathway map draws in; form validation and hand-off |
| 13 Questions | `faq/` | |
| Payments line | `paybar/` | |
| Footer | `footer/` | the wordmark rises as the page ends; the hidden admin door |
| Chat button and phone booking dock | `contact-dock/` | WhatsApp links, hide over booking areas |
| Section transitions (laptops and desktops) | `stack/` | each section holds while the next slides over; the page settles gently onto sections |

## Common edits

- **WhatsApp number:** set `WA_NUMBER` in `src/shared/config/contact.js` (digits with country code).
  Until then, WhatsApp buttons open WhatsApp without a chat, and the form opens the visitor's email
  app with the request addressed to `LEAD_EMAIL`.
- **Booking calendar:** set `BOOKING_URL` in the same file (your Cal.com or Calendly link). The form then
  offers "Or pick a time on our calendar".
- **Results:** add real, verifiable entries to `RESULTS` in `src/pages/home/model/results.js`. Never
  sample or invented numbers. The section appears on the live site as soon as one list has data.
- **Testimonials:** replace the two placeholder quotes in the Families section of `index.html` with
  real, permissioned quotes, then delete the placeholder note under them.
- **Copy:** all text is in `index.html`. Director profiles are the `<template id="dir-…">` blocks at the
  bottom.
- **Colours, fonts, spacing:** change the tokens in `src/app/styles/tokens.css`, not individual files.

## Colours and type

From the "Which type of student are you?" poster: aubergine ink (`--plum-900`), amber pills for every
booking action (`--amber`), brick for labels (`--brick`), on warm ivory, peach and blush. A mid purple
(`--violet-600`) carries links and focus. Headings are Fraunces (a serif with optical sizes); text is
General Sans. All of it lives in `src/app/styles/tokens.css`.

## Speed and safety

- Every stylesheet and script module is listed in the `<head>`, so the browser fetches them all at once
  (no import chains). Fonts are self-hosted and preloaded; the hero's first frame is preloaded.
- Films below the first screen download only when you scroll near them.
- Both pages carry a Content Security Policy: scripts only from this site, frames only from
  youtube-nocookie.com. Inline `<script>` tags are blocked by it, so add scripts as files.

## Films

The campus films are cut and graded in Remotion, in `../polaris-studio` (see its README):
`campus-hero.mp4` (desktop hero loop), `campus-hero-portrait.mp4` (phone hero loop) and
`campus-reel.mp4` (the scrolled campus scene, encoded with a keyframe every 6 frames so it can seek).
Source footage is from Pexels (free for commercial use, no credit required; credited in the footer anyway).
The Sather Tower photo is CC BY-SA 4.0 and must keep its credit (footer; details in `assets/campus/credits.json`).

## Admin

`/admin` is a private page for leads, the sales pipeline, site content and settings. It is not linked:
open it from the site by pressing the small amber star in the footer's coordinates line three times
(or a long press on a phone), or go to `/admin` directly.

- **Access code:** given to the owner privately, never written in this public repo. Change it in
  `src/pages/admin/lib/access.js` (the file says how). This check runs in the browser, so it only keeps
  casual visitors out; it must move to the server before real data is connected.
- **Sample data:** every screen is labelled. Families, numbers and dates are invented, and edits are kept
  in that browser only. Totals are computed from the rows and checked on load.
- **Connecting real data:** rewrite `src/pages/admin/api/store.js` only (Supabase is the plan: a `leads`
  table the form writes to, an `events` table for visits and clicks, Storage for images, and Auth for the
  login). No screen changes.

## Adding a section

1. Add the markup to `index.html` where it belongs, with a `chapter` marker and an `h2`.
2. Create `src/pages/home/ui/<name>/<name>.css` and add its `<link rel="stylesheet">` in the `<head>` of
   `index.html`, at the same position as the section on the page (links are listed in cascade order).
   Add its script to the `<link rel="modulepreload">` list there too, so it downloads in parallel.
3. If it needs behaviour, add `<name>.js` exporting `init<Name>()`, and call it in
   `src/pages/home/index.js`. Scroll-linked effects register with `onScrollFrame` from `shared/lib`
   instead of adding their own scroll listener; anything that reacts to the viewport size uses `onResize`.
4. For a light section, add `bg-base` or `bg-band` to the `<section>` for the page's surfaces, and
   `latitude` for the dotted chart line.
5. To make it fill one screen on laptops and desktops like the others, add `screen` to the `<section>`
   (see "One section, one screen" below).

## Conventions

- Motion: transforms and opacity only. Film bands open by clipping (`clip-path`), never by margins, so the page
  is not re-laid out on every scroll frame. Elements with their own motion carry `data-own-motion`, and the
  entrance animations (`shared/ui/reveal`) leave them alone, so two animations never fight and flash. Every effect has a `prefers-reduced-motion` fallback, and with
  reduced motion all content shows without travel.
- Scroll effects use the shared spring (`makeSpring`) so they glide rather than jump.
- Breakpoints: 1080px (nav to menu), 860px (two columns to one), 700px (director sheet), 600px (phone).
  Landscape phones (under 500px tall) get a slimmer header and a shorter hero.
- Sticky panels use `fitSticky`, so a panel taller than the screen never hides its foot.

## One section, one screen

On screens at least 1081px wide and 720px tall, every content section with the `screen` class fills the
screen under the header, with its content centred. Scrolling or a nav link lands on the whole section, and
nothing is cut off at the foot. The rule is in `src/app/styles/base.css`; it gives each section `--fit`, the
height its content may use. Sections size their pictures from it (for example the director portraits are
`calc(var(--fit) - 426px)` tall), and each section's CSS ends with a block marked "fitted to one screen".
The hero, film bands, the campus and Tradewind scenes, the consultation section (its own rule) and the footer
are not `screen` sections. Phones, tablets and short windows keep the normal flow.

On the same screens (with motion allowed), `stack/stack.js` makes the sections stack: each fitted section
holds under the header while the next one slides over it with a soft edge of shadow, and the covered one
dims a little.

Settling (`stack/settle.js`, same screens): the page scrolls freely and natively, with the trackpad's own
momentum, so nothing is skipped and you can stop anywhere. When the scroll comes to rest, it tidies up
gently: if a stop is nearly reached in the direction you were going (within a third of a screen), the page
eases the rest of the way; if you stopped just past one, it eases back onto it; anywhere else it stays put.
The ease is slow and soft (`glideTo`: about 0.7s for a short tidy-up, up to about 1.2s for a long jump), menu
links glide the same way, and any new scroll, touch or key cancels it at once. Stops: each section under the
header, each film band centred, and each beat inside the pinned scenes (one per campus, one per step of the
sail, one per Tradewind stage; each scene lists its own in `data-stops`). Links to a covered section still land on it (the script aims at its place in the page),
and the header's night mode and nav highlight read whichever section is on top (`lib/night.js`). How it works
pins itself instead (a sticky stage inside a taller section), and the questions section doesn't stack, since
only the short footer follows it.

If you add copy to a fitted section, check it still fits at 1280×720 and 1366×768 (the shortest common laptop
screens). If it doesn't, subtract more from its `--fit` calc or tighten the block for `max-height: 760px`.

## Publishing

```
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages rebuilds in about a minute: https://mrrexter101.github.io/polaris/

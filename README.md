# Sharon Tabak Coaching: website

A multi-page, mobile-first website for **Sharon Tabak**, Certified Jay Shetty Life Coach and founder of **Women for Women's Truths**. It is designed to turn quiet visitors into free discovery-call bookings.

Plain HTML, CSS and JavaScript. No framework and no build step on the server, so it runs on any static host.

## Pages

| File | Page | Purpose |
|---|---|---|
| `index.html` | Home | Hero, who it's for, the cocoon-to-wings journey, pricing, Sharon's film, testimonials, Jay Shetty endorsement, WFWT teaser |
| `about.html` | About | Sharon's story, approach, values, credentials |
| `services.html` | Coaching | Focus areas (trauma, identity, relationships…), how it works, packages, comparison table, FAQ |
| `stories.html` | Stories | Video and written testimonials |
| `community.html` | Women for Women's Truths | Mission, formats, giving back, waitlist form |
| `contact.html` | Contact | Inline Calendly booking, message form, social links |
| `terms-and-conditions.html` | Terms | Same URL as the current site |
| `404.html` | Not found | Friendly error page |

`services.html` and `terms-and-conditions.html` keep the current site's URLs, so existing links and search rankings carry over.

## Conversion features

- Every "Book a free call" button opens Sharon's Calendly in a slide-in drawer, so visitors never leave the site. Without JavaScript it falls back to opening Calendly directly.
- A sticky "Free 30-min call" bar appears on phones and tablets once the visitor scrolls past the hero.
- Pricing shows the per-session value of each package (about $231 for 3 months, about $212 for 6 months).
- The "What happens on the free call" steps and FAQ answer the usual hesitations before booking.
- Every page carries a gentle crisis-care note, which is important given the trauma focus.

## Motion and design

- Bodoni Moda (display) and Manrope (body) from Google Fonts. Palette: ink, bone and Sharon's brand cobalt `#0C4C98`.
- Preloader (first visit only), branded page transitions, word-by-word headline reveals, scroll-lit paragraphs, image wipes, parallax, a pinned horizontal "journey" section, a custom cursor and magnetic buttons on desktop.
- Smooth scrolling via [Lenis](https://github.com/darkroomengineering/lenis) on desktop only. Touch devices keep native scrolling.
- Everything respects **Reduce Motion**: animations switch off and all content stays readable.
- Background videos load lazily, pause when off-screen, and are skipped on Save-Data connections.

## Editing

The header, footer and closing call-to-action are shared across pages. Edit them in `/partials`, then run:

```bash
python3 build.py
```

This copies the partials into every page between `<!-- include:name -->` markers and highlights the current page in the menu. Edit page content directly in each `.html` file.

Main settings are at the top of `assets/js/main.js`:

```js
var CONFIG = {
  calendly: 'https://calendly.com/sharontabak-sharontabak/30min',
  email: 'sharontabak@sharontabak.com',
  formEndpoint: ''   // optional, see below
};
```

### Forms

The contact form and the WFWT waitlist work straight away: they open the visitor's email app with the message pre-filled to Sharon. To receive messages directly instead, create a free form endpoint (for example Formspree, Basin or Getform) and paste its URL into `formEndpoint`.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Upload the folder as-is to any static host:

- **Netlify / Cloudflare Pages / Vercel:** connect this repo, with no build command and the root directory as output.
- **GitHub Pages:** Settings → Pages → deploy from branch, root folder (`.nojekyll` is included).

Then point `sharontabak.com` at the host. Canonical URLs, Open Graph tags, `sitemap.xml`, `robots.txt` and schema.org data (business, offers, FAQ) already use `https://sharontabak.com/`.

## Assets

- Photos, videos, logo and monogram come from Sharon's current website. Videos were re-encoded (43 MB → 15 MB) and images converted to WebP.
- Stock photography (ocean, candles, horizon and others) is the Unsplash imagery already used on the current site.
- Testimonial quotes were lightly tidied for grammar from the video transcripts on the current site. Please confirm with Sharon.

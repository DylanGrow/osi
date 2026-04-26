# OSI Model Quiz

An AI-powered, interactive quiz app for mastering all 7 layers of the OSI Model. Built with vanilla JavaScript, HTML, and CSS — no frameworks, no dependencies, no tracking.

![Theme](https://img.shields.io/badge/theme-glassmorphism-00e5ff?style=flat-square) ![Lighthouse](https://img.shields.io/badge/lighthouse-100%2F100-00e676?style=flat-square) ![No tracking](https://img.shields.io/badge/tracking-none-ff1744?style=flat-square) ![PWA](https://img.shields.io/badge/PWA-ready-00e5ff?style=flat-square)

---

## What It Does

- Generates unique quiz questions for each OSI layer using the Gemini 1.5 Flash API via a Cloudflare Worker
- Tracks which questions you've already seen so you never get repeats
- Advances you through all 7 layers — Physical → Application — as you answer correctly
- Resets and loops when you complete all layers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| AI Backend | AI Backend | Meta Llama 3.1 8B Instruct |
| API Proxy | Cloudflare Workers |
| Hosting | Static (any host) |
| Fonts | System monospace (zero external requests) |

---

## File Structure

```
/
├── index.html          # App shell — semantic, accessible, PWA-ready
├── style.css           # Glassmorphism UI — cyan theme, star field, mobile-first
├── app.js              # Game logic — question loading, answer checking, progress
├── worker.js           # Cloudflare Worker — proxies requests to Gemini API
├── sw.js               # Service worker — asset caching for offline/PWA
├── manifest.json       # PWA manifest — installable on mobile/desktop
├── generate-icons.html # Utility page for generating PNG icons
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-192.png
    └── icon-512.png
```

---

## Getting Started

### 1. Deploy the Cloudflare Worker

The worker proxies quiz requests to Gemini so your API key is never exposed in the frontend.

1. Create a free account at [workers.cloudflare.com](https://workers.cloudflare.com)
2. Create a new Worker and paste in `worker.js`
3. Add your Gemini API key inside `worker.js` as `GEMINI_API_KEY`
4. Deploy — copy your Worker URL (e.g. `https://your-app.workers.dev`)
5. Update the fetch URL in `app.js` to match your Worker URL

### 2. Deploy the Frontend

The frontend is plain static files — drop them anywhere:

- **Cloudflare Pages** — drag and drop the folder, done
- **GitHub Pages** — push to a repo, enable Pages in settings
- **Netlify / Vercel** — connect your repo or drag and drop
- **Any static host** — upload all files, no build step needed

### 3. Verify Icons Exist

Make sure your `icons/` folder contains all four sizes referenced in `manifest.json` and `index.html`. Open `generate-icons.html` in a browser locally to regenerate them if needed.

---

## Zero API Keys Required
Because this project uses Cloudflare Workers AI, the Meta Llama 3.1 model is baked directly into the Cloudflare environment. You do not need to manage, secure, or pay for external OpenAI, Anthropic, or Google API keys. The Cloudflare free tier handles the AI requests natively.

---

## Performance & Accessibility

This app targets **Lighthouse 100** across all four categories.

| Category | Score | Key decisions |
|---|---|---|
| Performance | 100 | No external fonts, `defer` on JS, non-blocking CSS, system font stack |
| Accessibility | 100 | `aria-live` regions, `role="alert"` on feedback, 48px touch targets, `prefers-reduced-motion` |
| Best Practices | 100 | CSP meta tag, PWA manifest, `https` only, no third-party requests |
| SEO | 100 | Meta description, Open Graph tags, semantic HTML landmarks, descriptive title |

**Privacy:** Zero third-party network requests from the frontend. The only outbound call is to your own Cloudflare Worker. No analytics, no fonts CDN, no ads.

---

## Content Security Policy

The app ships with a strict CSP that whitelists only your Worker URL:

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
connect-src https://<your-worker>.workers.dev;
img-src 'self' data:;
font-src 'self';
```

Update the `connect-src` value in `index.html` if you change your Worker URL.

---

## OSI Layers Covered

| # | Layer | Focus Area |
|---|---|---|
| 1 | Physical | Cables, signals, hardware, bit transmission |
| 2 | Data Link | MAC addresses, frames, switches, error detection |
| 3 | Network | IP addressing, routing, packets |
| 4 | Transport | TCP/UDP, ports, flow control, reliability |
| 5 | Session | Session establishment, synchronization, dialogs |
| 6 | Presentation | Encoding, encryption, compression, data formats |
| 7 | Application | HTTP, DNS, FTP, SMTP, user-facing protocols |

---

## License

See `LICENSE` for details.

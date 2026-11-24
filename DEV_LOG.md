# HACKSHELF — LEAD ARCHITECT & CTO DEV LOG
> **Product**: Hackshelf (by Kaushift)  
> **Repository**: `https://github.com/rivcoder/hackshelf.git`  
> **Production Target**: Vercel (`hackshelf.vercel.app`)  
> **Lead Architecture Standard**: Local-first, zero-friction, dark-luxury aesthetic, 0ms latency, zero tracking bloat.

---

## 📌 Executive Summary & Guiding Principles
1. **Friction is the Enemy**: No mandatory signups or passwords for V1. Users get value in under 5 seconds.
2. **Local-First Reliability**: Browser storage (`localStorage`) handles state with graceful fallback (`QuotaExceededError`, schema migrations, offline PWA cache).
3. **Prepared for V2 Scale**: Supabase schema and RLS rules are staged in `PRD_AND_SAFETY_AUDIT.md` and `js/config.js` for seamless cloud sync when user traction demands it.
4. **Git Discipline**: AI agent builds, validates, and tests code locally; **User executes `git commit` and `git push`**.

---

## 🛠️ Complete History: What Was Broken & What Was Fixed

### 1. Branding & Identity Transition
- **Issue**: Project originally used "Hackmark", missing custom branding and community tie-in.
- **Fix**: Rebranded globally across all HTML titles, manifests, headers, footers, meta tags, and local storage keys to **Hackshelf**.
- **Fix**: Linked directly to the **Kaushift Community** (`https://kaushift.com`) with *"From the Kaushift Community — Never build alone."*

### 2. Mobile Layout & Overflow Fixes
- **Issue**: Filter dropdowns were set to a strict desktop multi-column grid, causing massive horizontal page expansion, broken margins, and ugly layout blowouts on mobile screens.
- **Fix**: Built a clean horizontal scroll container (`overflow-x: auto; scrollbar-width: none;`) for mobile filter chips. Constrained `html, body` with `max-width: 100vw; overflow-x: hidden`.
- **Fix**: Stacking buttons in the hero section ("Try it now" and "See how it works") were breaking awkwardly on narrow viewports; locked them to side-by-side with fluid padding.

### 3. Navigation & Floating Drawer
- **Issue**: Mobile hamburger menu was a flat block that sliced through the hero section.
- **Fix**: Redesigned the mobile navigation into a floating glass card (`backdrop-filter: blur(24px)`, rounded pill edges `20px`, smooth entrance drop animation).
- **Fix**: Repositioned *"by Kaushift ↗"* cleanly as a sleek subline underneath the logo icon to avoid horizontal crowding.

### 4. Interactive Hero & CTA Animations
- **Issue**: Hero animation loop stopped working on deployment due to missing relative path references in iframe; CTA canvas had vendor-prefixed CSS errors (`mask` vs `-webkit-mask` and `skew` vs `transform: skewX`).
- **Fix**: Normalized iframe sources to clean local relative files (`hero-loop.html` and `cta-live.html`).
- **Fix**: Fixed CSS standards for `mask` compatibility and replaced illegal `skew` properties with standard `transform: skewX(-14deg)`.
- **Fix**: Scaled down excessive dead space on the CTA section (reduced height from 580px to 380px desktop / 280px mobile).

### 5. App Dashboard Card UI Polish
- **Issue**: Hackathon list rows were cramped: countdown tile ("14 days") was squeezed into a harsh box, action buttons were plain text, and status was unstyled.
- **Fix**: Overhauled `.row` design:
  - Big, breathable countdown tile with glowing urgency palettes (`u-red`, `u-gold`, `u-calm`).
  - Sleek pill buttons (`.icon-btn`) for Edit and Delete with tactile hover states.
  - Platform badges (`.platform-badge`) color-coded to Devfolio, Devpost, Unstop, and MLH.
  - Notes rendered as luxury quote blocks (`.notes-quote`).
- **Fix**: Moved keyboard shortcut hints (`/`, `N`, `Esc`) out of the main card area down to the footer to keep the shelf clean.

### 6. Tactile Micro-Interactions
- **Decision**: Avoided putting heavy video loops or canvas animations on every section (which drains phone battery and causes scrolling lag).
- **Fix**: Implemented cursor-tracking ruby/oxblood radial glow on `.steps`, `.feats`, and `.why` cards via lightweight mouse-coordinate CSS variables (`--mx`, `--my`) in `js/fx.js`.

---

## 🎯 Current Technical State (As of Nov 2026)

| Component | Status | File(s) | Description |
| :--- | :--- | :--- | :--- |
| **PWA & Offline** | ✅ Stable | `manifest.webmanifest`, `sw.js` | Service Worker cache `hackshelf-v2`, installable on Android/iOS/Desktop. |
| **Storage Engine** | ✅ Stable | `js/app.js` | `localStorage` key `hackshelf.items.v1` with automatic migration from v0. |
| **Design System** | ✅ Stable | `css/lux.css`, `css/app.css` | Espresso/Oxblood palette (`#150B08`, `#C42A36`, `#F2E8E1`), Cormorant Garamond & Instrument Sans. |
| **Landing Hero** | ✅ Stable | `index.html`, `hero-loop.html` | 10s CSS loop embedded via responsive iframe. |
| **Closing CTA** | ✅ Stable | `index.html`, `cta-live.html` | Interactive typewriter with full-screen dark wine gradient. |
| **Bookmarklet** | ✅ Stable | `app.html`, `js/app.js` | 1-click desktop browser capture tool. |
| **Data Backup** | ✅ Stable | `app.html`, `js/app.js` | JSON export and import utility for zero lock-in. |

---

## 🚀 Active Roadmap & Next Features to Build

### Phase 1: High-Utility Power Features (CURRENT)
1. **📅 1-Click Calendar Sync (Google & Apple/Outlook .ics) — [COMPLETED]**
   - *Implemented*: `makeGoogleCalUrl()` and `downloadIcs()` in `js/app.js`.
   - *UI*: Added interactive `📅` calendar dropdown on every hackathon row with one-click Google Calendar opening and RFC-compliant `.ics` invite export. Outside click handling added.

2. **⚡ Smart Auto-Fill on Link Paste — [COMPLETED]**
   - *Implemented*: `titleFromUrl()` parser in `js/app.js` and `.autofill-notice` badge in `app.html` & `css/app.css`.
   - *Behavior*: Automatically detects platform (Devfolio, Unstop, Devpost, MLH) and beautifies URL slugs into clean title names on link paste, displaying visual confirmation.

3. **✅ Milestone Checklist (Per Hackathon) — [PENDING]**
   - *Goal*: Keep teams organized during the hackathon sprint.
   - *Checklist items*: Idea pitched, Repo created, Prototype built, Demo recorded, Submitted.

4. **📊 Shelf Momentum & Record Stats — [PENDING]**
   - *Goal*: Give hackers pride in their build streak.
   - *Metrics*: Active deadlines, Submissions completed, Win rate.

### Phase 2: Community & Cloud (POST-TRACTION)
1. **Supabase Cloud Sync**: Real-time cross-device sync via anonymous room key or Magic Link.
2. **Kaushift Team Matchmaker**: Direct link to find teammates on `kaushift.com` with matching tags/skills.
3. **Automated Webhook/OpenGraph Scraper**: Serverless edge function to fetch exact banner images and dates automatically from URLs.

---

## 📝 Rules of Engagement for AI Acting CTO
1. Always test code syntax (`node -e ...`) before handing over.
2. Never execute `git commit` or `git push` directly — leave for the founder to review.
3. Keep all files documented and update this `DEV_LOG.md` whenever core architecture changes.

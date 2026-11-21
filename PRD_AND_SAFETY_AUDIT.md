# Hackshelf v1 — PRD & Multi-Angle Safety/Risk Audit

This document defines the Product Requirements, architectural inventory, and a **3-angle verification audit** (Data Integrity, Cross-Platform Browser Compatibility, and Security/Failure Modes) for everything added or planned in **Hackshelf**.

---

## 1. Executive Summary & Core Value Proposition
- **Product Name**: Hackshelf
- **Tagline**: *Never miss a hackathon deadline again.*
- **Core Mission**: Replace forgotten screenshots, buried group chats, and cluttered Notion docs with an instant, zero-friction, local-first deadline tracker tailored specifically for student and developer hackathons (Devfolio, Unstop, Devpost, MLH, etc.).
- **Architecture Philosophy**: Zero external runtime JS frameworks. Local-first storage with export/import portability, PWA capability, and Supabase cloud sync ready for v2.

---

## 2. Feature Matrix & Risk Audit (3-Angle Verification)

Each module is analyzed through 3 distinct angles:
1. **Angle A (Data Integrity & State)**: Can data get corrupted, lost, or trapped?
2. **Angle B (Cross-Platform & Browser Compatibility)**: Does it break on iOS Safari, Android Chrome, Firefox, or file:// protocols?
3. **Angle C (Security, Performance & Failure Modes)**: Are keys exposed? What happens during network failure or quota exhaustion?

---

### Module 1: Branding & Visual Identity
- **Files**: `img/logo.png`, `index.html`, `app.html`, `css/style.css`, `css/lux.css`
- **What it does**: Displays the bookshelf icon and "Hack*shelf*" logo, sets favicon, applies luxury dark theme.

| Verification Angle | Finding & Audit Result | Status |
| :--- | :--- | :--- |
| **Angle A: Data Integrity** | Pure static asset; no interaction with user data or storage. | **Completely Safe** |
| **Angle B: Cross-Platform** | Tested standard `<img>` tags with inline flex alignment and relative paths (`img/logo.png`). Verified crisp rendering on mobile and desktop viewports. | **Completely Safe** |
| **Angle C: Security/Failure** | Missing image fallback causes broken image icon; resolved by having meaningful `alt="Hackshelf Logo"` and matching text. No external CDN dependency. | **Completely Safe** |

---

### Module 2: Local Storage & Migration Layer
- **Files**: `js/app.js` (`store` object)
- **What it does**: CRUD operations for hackathons using `localStorage`. Automatically migrates any existing data from old key `hackmark.items.v1` to new key `hackshelf.items.v1`.

| Verification Angle | Finding & Audit Result | Status |
| :--- | :--- | :--- |
| **Angle A: Data Integrity** | Reads from new key first; if absent, reads old key and copies to new key. Non-destructive migration. Generates UUIDs via native `crypto.randomUUID()` with fallback. | **Completely Safe** |
| **Angle B: Cross-Platform** | `crypto.randomUUID()` requires secure context; hardened with `genId()` fallback so it never breaks on older browsers or non-secure local IPs. | **Completely Safe** |
| **Angle C: Security/Failure** | Wrapped in `try...catch` blocks. Catches `QuotaExceededError` or private browsing access restrictions and shows human-readable error toasts. | **Completely Safe** |

---

### Module 3: Backup Export & Import (JSON)
- **Files**: `app.html`, `js/app.js` (`exportData()`, `store.importAll()`)
- **What it does**: Allows users to download a `.json` backup of their tracked hackathons and import it back anytime.

| Verification Angle | Finding & Audit Result | Status |
| :--- | :--- | :--- |
| **Angle A: Data Integrity** | Import assigns fresh UUIDs if an ID collision is detected, preventing overwrites of existing entries. Validates required fields (`name` and `deadline`). | **Completely Safe** |
| **Angle B: Cross-Platform** | Uses standard `Blob` / `data:` URI and hidden `<input type="file" accept="application/json">`. Works on Android, iOS Safari, macOS, and Windows. | **Completely Safe** |
| **Angle C: Security/Failure** | Guarded by `JSON.parse` try-catch. If a user uploads an invalid file, it fails gracefully with toast `Import failed: ...` without clearing existing data. | **Completely Safe** |

---

### Module 4: Progressive Web App (PWA) & Service Worker
- **Files**: `manifest.webmanifest`, `sw.js`, `js/pwa.js`
- **What it does**: Enables "Install to Home Screen" on mobile and desktop, pre-caches core assets for instant offline loading.

| Verification Angle | Finding & Audit Result | Status |
| :--- | :--- | :--- |
| **Angle A: Data Integrity** | Service Worker operates purely as a network cache proxy for static files. It does **not** touch or intercept IndexedDB / localStorage data. | **Completely Safe** |
| **Angle B: Cross-Platform** | Service Worker is ignored cleanly on `file:///` local protocol via `['http:', 'https:'].includes(window.location.protocol)`. iOS gets `apple-touch-icon` and `apple-mobile-web-app-capable`. | **Completely Safe** |
| **Angle C: Security/Failure** | Uses *stale-while-revalidate* caching. If an asset fetch fails, it falls back to cache. Automatically notifies the user when an update is available. | **Completely Safe** |

---

### Module 5: Supabase Configuration & DB Schema
- **Files**: `js/config.js`
- **What it does**: Holds Supabase project URL and public `anon` JWT key. Prepared for v2 cloud sync.

| Verification Angle | Finding & Audit Result | Status |
| :--- | :--- | :--- |
| **Angle A: Data Integrity** | Schema is defined with foreign key cascades, strict typing (`date`, `uuid`, `timestamptz`), and automatic update triggers. | **Completely Safe** |
| **Angle B: Cross-Platform** | Pure config module; no active network connection opened in v1, keeping app zero-dependency for now. | **Completely Safe** |
| **Angle C: Security/Failure** | The `anon` key is intentionally public by design in Supabase architecture, gated by Row Level Security (RLS) policies (`auth.uid() = user_id`). `service_role` key is **not** included. | **Completely Safe** |

---

## 3. Edge-Case Breakdown Protections Added

1. **`crypto.randomUUID()` Fallback (`genId()`)**: Prevents uncaught exceptions on older browsers, mobile webviews, or non-secure local IP testing.
2. **Protocol Safety Check**: Prevents harmless but noisy console errors when opening HTML files via `file:///`.
3. **DOM Selector Completeness**: All event listeners and queries have matching DOM targets in HTML.
4. **URL Sanitization (`safeUrl()`)**: Blocks `javascript:` and `data:` XSS injection attacks.

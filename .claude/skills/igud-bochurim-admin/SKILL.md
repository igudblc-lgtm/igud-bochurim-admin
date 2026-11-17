---
name: igud-bochurim-admin
description: Continue development on the "איגוד בחורים" (Igud Bochurim) admin web app — a Hebrew/RTL management system for the "א חסידישע ליל שישי" program (dashboard, annual roadmap, booklets/posters, operator checklist, student tracker, multi-branch admin, Firebase sync). Use this skill whenever the user asks to change, fix, extend, or deploy this project, whenever they mention "איגוד בחורים", "ליל שישי", the project folder igud-bochurim-admin, or anything about its booklets/posters/Firebase/GitHub Pages setup — even if they don't say "skill" or name a file. It captures hard-won conventions (Hebrew-only communication, the vanilla-JS module pattern, the Firestore-without-Storage architecture, Drive-linked PDFs) that a fresh session would otherwise have to rediscover by trial and error.
---

# Igud Bochurim Admin App — Continuation Guide

This is a **living, already-deployed project** for a real organization, not a fresh scaffold. Read this whole file before touching code — it encodes decisions made (and bugs already hit and fixed) across a long build history. Skipping it means redoing work or breaking something that was deliberately built a certain way.

## The one rule that overrides everything else

**Communicate with the user EXCLUSIVELY in simple Hebrew.** Every reply, every question, every status update — Hebrew only, no exceptions, no mixing in English or any other language mid-sentence. The user is not a programmer. Do not use technical jargon without a plain-language gloss.

The app's own UI, all generated content (posters, booklets, cover pages, the syllabus), and every code comment the user might see must also be 100% Hebrew/RTL.

## How to work with this user: "technical autopilot"

- Perform all code edits, file changes, and terminal/git/gh commands **yourself**. Don't ask the user technical questions ("should I use X or Y approach?") — make the sensible call and tell them what you did, in Hebrew, after the fact.
- The **only** time to stop and wait is when the next step genuinely requires the user's own hands on a keyboard in their own browser/account — a Firebase Console click, a GitHub login, approving a 2FA prompt, pasting a config value only they can see. In that case: give **one** short, simple instruction in Hebrew, then wait for their confirmation before giving the next one. Never dump a multi-step checklist on them at once.
- If something needs a product decision with real tradeoffs (e.g., "should attendance sync in real time or on save?"), it's fine to ask — but keep it to one focused question, in Hebrew, with a recommended default.

## Where things live

```
igud-bochurim-admin/
├── index.html              App shell: sidebar, nav, theme toggle, script tags (order matters — see below)
├── css/styles.css          All styling: CSS-variable light/dark theme, print-always-light overrides
├── assets/logo-igud.png    The real org logo (source file)
├── booklets-archive/       User's own local copy of real booklet PDFs (not read by the app itself)
├── js/
│   ├── core.js             Defines window.Igud = { screens: {} } — must load first
│   ├── logo.js             window.IGUD_LOGO_DATA_URL — the logo as a base64 data: URI (for print/html2canvas reliability)
│   ├── data.js             Mock/seed data: Hebrew months, parshiot, maamarim, MAAMAR_QUESTIONNAIRES, mashpiim, students, poster templates
│   ├── cloud.js            IgudCloud — Firebase Firestore ONLY (no Storage). isConfigured()/init()/pushState()/subscribeState()
│   ├── firebase-config.js  window.IGUD_FIREBASE_CONFIG — null until the user supplies real Firebase config (see "Firebase" below)
│   ├── store.js            IgudStore — the single state object, localStorage persistence, migrate() for old saved states, resetToDemo()
│   ├── auth.js             IgudAuth — session role (admin vs branch coordinator), passcodes
│   ├── utils.js             IgudUtils (import as `var U = global.IgudUtils`) — formatting, DOM helpers (U.el), Drive-link parsing, image compression, ICS/mailto builders
│   ├── dashboard.js        "תא הטייס השבועי" screen + the "מוכן לאישור דפוס" ready-to-print card
│   ├── roadmap.js          "מפת דרכים שנתית" screen (admin-only editing)
│   ├── printmedia.js       "מרכז חוברות ומודעות": booklets list, Drive-link modal, poster generator, study-material search
│   ├── syllabus.js         Printable program prospectus generator
│   ├── coverpage.js        Single-maamar cover page generator
│   ├── pdfmerge.js         html2canvas + pdf-lib PDF assembly (see "PDF generation" below)
│   ├── operator.js         "אחראי ליל שישי": checklist + evening feedback form, branch-scoped
│   ├── students.js         "מצב הבחורים" tracker table, branch-scoped
│   ├── admin.js            "ניהול מערכת": branches/codes, backup/restore, Firebase sync button, print specs, danger zone
│   └── main.js             Router (Igud.navigate), modal system (Igud.openModal), theme toggle, app init
└── .claude/launch.json     Dev server config (name "igud-admin", npx serve ., port 5173) — NOT committed to git
```

**No build step.** Plain `<script>` tags in `index.html`, loaded in dependency order. Each file is an IIFE that reads/writes properties on `window` (`Igud`, `IgudUtils`, `IgudStore`, `IgudAuth`, `IgudCloud`, `IGUD_LOGO_DATA_URL`, `IGUD_FIREBASE_CONFIG`). If you add a new file, add its `<script>` tag in `index.html` in a position where whatever it reads at *load time* (not just at call time) already exists — most modules only touch globals inside functions, which run later, so order is more forgiving than it looks, but `core.js` must always be first and `main.js` must always be last.

Inside each screen module, the convention is `var U = global.IgudUtils;` at the top, and registering the screen via `global.Igud.screens.<name> = { render: render, title: '...' };`.

## Architecture decisions — preserve these, don't "improve" them away

1. **Firestore, never Storage.** The org is on Firebase's free Spark plan specifically to avoid needing a credit card. `js/cloud.js` has no `uploadFile`/Storage code — don't re-add it. Heavy PDFs (study booklets, often 10–30+ MB) are **linked from Google Drive**, not uploaded: `IgudUtils.parseDriveFileId(url)` extracts the file ID from a normal share link, and `driveOpenUrl`/`drivePreviewUrl`/`driveDownloadUrl` build the various Drive URLs from it. See `printmedia.js`'s Drive-link modal on each booklet row.
2. **Google Drive blocks large-file fetches.** `pdfmerge.js` tries to `fetch()` the Drive-linked PDF and merge it into one print-ready file via pdf-lib, but Drive serves an HTML "can't scan for viruses" interstitial instead of the PDF for files over roughly 25MB (confirmed against a real 33MB file from this org's Drive) — the fetch fails with a CORS error, which is expected, not a bug. The code checks the response actually starts with the `%PDF-` magic bytes before trusting it, and falls back gracefully: it still produces the dynamic cover/schedule/questions page, plus a direct "open in Drive" link, instead of silently failing or claiming a merge that didn't happen. Preserve this fallback path — don't "fix" it into something that assumes the fetch always works.
3. **Hebrew text in PDFs: html2canvas, not pdf-lib text drawing.** pdf-lib's built-in fonts have no Hebrew glyphs. Every dynamically-generated PDF page (covers, schedule/questions, publisher-credit page) is built as real styled HTML, rasterized with `html2canvas` (so the browser's own font engine renders the Hebrew correctly), then the resulting PNG is embedded as a full-page image via pdf-lib. Don't try to draw Hebrew text directly with pdf-lib — it will render as boxes or Latin fallback glyphs.
4. **The logo is a data: URI, not a file path.** `js/logo.js` embeds `assets/logo-igud.png` as a base64 `data:` URI in `window.IGUD_LOGO_DATA_URL`. This is used everywhere the logo appears (posters, booklet covers, syllabus) specifically so it works identically in the live app, in `window.print()` output, and inside an html2canvas capture — a relative file path can fail or race in the capture context. If the logo file ever changes, regenerate `js/logo.js` with Node (`fs.readFileSync` → `toString('base64')`), don't hand-edit the base64.
5. **Real content over generic placeholders.** `MAAMAR_QUESTIONNAIRES` in `data.js` holds genuine, maamar-specific study questions (modeled on a real questionnaire found in the org's own Drive), not one generic sentence reused everywhere. If you add a new maamar to the mock data, write it a real, specific questionnaire in the same style (a couple of content questions + a personal "שאלת סיכום" closer) — don't fall back to boilerplate.
6. **Multi-branch access control.** `state.security.adminCode` (default `770`) is the master passcode; `state.branches[]` each optionally carry their own 4-digit code. `IgudAuth.isAdmin()` / `IgudAuth.getSession()` gate: admin-only screens (`admin.js`, roadmap editing), and branch-scoped data filtering in `operator.js`/`students.js`/`dashboard.js` KPIs. Branch coordinators must never see other branches' data, the danger zone, or the Firebase sync button.
7. **Light/dark theme, but print is always light.** Colors are CSS variables redefined under `:root[data-theme="dark"]`; the toggle writes the attribute and persists the choice to `localStorage`. Every *print* output (posters, booklets, cover pages) uses hardcoded light "paper" colors regardless of the app's current theme — a poster represents physical paper, which doesn't have a dark mode. Don't let print CSS inherit the themed variables.
8. **Small images get compressed client-side.** `IgudUtils.compressImageFile()` resizes/re-encodes to WebP (~150KB target) via canvas before a poster photo is used, specifically so that if such an image is ever persisted, it stays well under Firestore's 1MB document limit. Apply the same treatment to any new user-uploaded image feature.

## Firebase setup status (check this every session — it changes)

`js/firebase-config.js` starts as `window.IGUD_FIREBASE_CONFIG = null;`. The app works fully on `localStorage` alone in that state — `IgudCloud.isConfigured()` returns false and every cloud call becomes a no-op.

**As of the last session, Firebase is live and connected** — `js/firebase-config.js` holds the real config for project `igud-bacurim-lemida`, committed and pushed, and a real Firestore write/read round-trip was confirmed working end-to-end (read via `onSnapshot` and write via `.set()` both succeed on the live GitHub Pages origin, in a real browser — the Claude in Chrome extension, not the sandboxed built-in Browser pane, which sits behind a NetFree-style content filter and is not representative of the real network). Don't re-ask the setup questions; Firebase is done.

**⚠️ CRITICAL — never call `IgudCloud.pushState(...)` with throwaway/diagnostic data.** `cloud.js`'s `pushState` does a full `.set()` overwrite of the *one shared* `igud/state` Firestore document — there's no merge, no per-field update. Any tab with cloud sync active (every real device, since Firebase is now live) is subscribed via `onSnapshot` and will immediately pull down whatever you just wrote and call `IgudStore.setState(remoteState, {skipCloudPush:true})` on it, which **replaces** that tab's local state and persists it to that browser's `localStorage` too. A past session wrote `{test:true, ts:...}` directly to diagnose a connection issue, and it propagated instantly, wiping `weeks`/`students`/etc. from both the shared cloud doc and the real browser's local storage (dashboard.js then crashed trying to render the missing `state.weeks`). It was recoverable here only because it was caught immediately and it turned out to be demo data — real user data could have been destroyed exactly the same way, with no undo (Firestore's Spark plan has no version history). **Rule: never test `pushState` with fabricated objects. If you must verify the write path works, call it with `IgudStore.getState()` (the real current state) or push through the real UI flow, never a hand-rolled test payload — and treat any live device as something a careless write can reach the instant you run it.**

## Deployment

- **Live URL:** https://igudblc-lgtm.github.io/igud-bochurim-admin/ (GitHub Pages, serving the `master` branch root — no build step, so a push *is* a deploy).
- **Repo:** https://github.com/igudblc-lgtm/igud-bochurim-admin (public — the user explicitly chose this to get free GitHub Pages; only the *code* is public, never real student/attendance data, which lives only in the user's own browser/Firestore).
- **`gh` CLI** is installed at `C:\Program Files\GitHub CLI\gh.exe` and already authenticated as `igudblc-lgtm`. Bash tool calls don't persist shell state between calls, so every call that needs `gh` must re-add it to PATH in that same command: `export PATH="$PATH:/c/Program Files/GitHub CLI" && gh ...`.
- After any commit meant to reach the live site: `git push`. GitHub Pages rebuilds automatically, usually in under a minute; you can poll `gh api repos/igudblc-lgtm/igud-bochurim-admin/pages/builds/latest --jq .status` in a bounded loop (not bare `sleep`) until it says `built`.
- Git commit messages end with the `Co-Authored-By` line from the system reminder currently in force; write the commit message itself in English (only *user-facing* text must be Hebrew).

## Testing convention

1. Start the local dev server with the Browser pane's `preview_start` tool, config name `igud-admin` (defined in `.claude/launch.json`, `npx serve .` on port 5173).
2. For fast verification, don't click through the UI by hand for everything — use `javascript_tool` to call `IgudStore.getState()`, `Igud.navigate('screen')`, `IgudAuth.loginWithCode('770')`, etc. directly. This project's whole state is reachable from the console.
3. **Always call `IgudStore.resetToDemo()` and `Igud.rerender()` before committing** — any test data (fake Drive links, test branches, scratch admin codes) must not leak into the repo's seed state or into a pushed Firestore document.
4. Check `read_console_messages({onlyErrors: true})` after changes. Note: this pane's console buffer can show a *stale* error from an earlier navigation/reload — if something looks wrong, reproduce it fresh rather than trusting an old-looking log line at face value.
5. For anything involving `window.print()` or the pdf-lib/html2canvas pipeline, you can't easily screenshot a real print dialog — instead stub `window.print` to a no-op and inspect `document.getElementById('print-root').innerHTML`, or for merged PDFs, load the returned blob with `PDFLib.PDFDocument.load()` and check `getPageCount()` / known content programmatically rather than relying only on visual inspection.

## Real brand design system (synced from claude.ai)

The user maintains a proper Design System artifact on claude.ai (link: `https://claude.ai/artifact/5BKN5VtinW1PRwTqijrQZH` — a "Design System"-type artifact, re-read with `Artifact action:"read"`, not a page fetch) built from the org's real logos/fonts/brief. As of this session its tokens and fonts were pulled into the app:
- **Fonts**: `EFT Pnina` (Hebrew workhorse family, weights 300–900) is now `--font-body`, used app-wide via `assets/fonts/EFT-Pnina-*.ttf` + `@font-face` in `css/styles.css`. `HaYetzira Choppy` (hand-cut display face, one weight only — never fake-bold it) is `--font-display`, used for all headings/titles and poster/booklet headlines. Google Fonts Heebo/Rubik stay only as fallbacks in the stack, not the primary face anymore.
- **Colors**: light-mode `--gold-500/600` now match the real brand gold (`#d4a94a`/`#a97c2c`), plus new `--brand-sienna*`, `--brand-cream`, `--brand-sky*`, `--brand-sunrise*` tokens matching the design system's palette exactly (see `colors.css` token values if you need the full ramp). The poster generator's three accent themes (`accent-gold`/`accent-navy`/`accent-purple` — class names kept for low churn) were re-colored to gold/sky/sunrise to match the brand's "two supporting morning-light accents" instead of generic navy/purple.
- **Logo**: `assets/logo-igud.png` already matched the design system's `igud-bachurim-primary.png` byte-for-byte (verified by SHA-256) — no change needed there.
- **Deliberately NOT done**: the dashboard's dark navy sidebar/hero chrome (the earlier "luxury dashboard" redesign) was left as-is. The brand brief explicitly says "no dark, heavy backgrounds... fixed headers should stay light/cream, never a dark bar" — that's a real tension with the current chrome. Don't silently repaint the sidebar light to "fully comply" — ask the user first, since the dark theme was a deliberate, previously-approved decision on its own.
- If the user updates that claude.ai design system later (new assets, new tokens) and asks to re-sync, re-read it fresh rather than assuming this summary is still current — `read` the index (`project/README.md`, `project/tokens/*.css`) again.

## Known open items (don't assume these are done unless you check)

- **Real auto-send email** (not just an opened mail-client draft) was discussed but deliberately *not* built without the user's go-ahead — it would need a third service (e.g. EmailJS) and a new account signup. Check whether that decision has since been made before assuming mailto-only is still the answer.
- **Publisher credit page** (`printSpecs.publisherName`) ships empty by default — the second "חומרי הלימוד באדיבות המו\"ל" page only appears once the user fills in a real name via "ניהול מערכת".
- The two-track/two-cohort curriculum ("מחזור א׳ / מחזור ב׳") mentioned early in the project's history was never implemented — confirm with the user before assuming a single curriculum track is still correct.
- **Likutei Sichos library**: done as of this session — the user supplied a zip that was *already* split per-parsha/occasion (no need for the `פיצול-ספר` skill after all), uploaded to Drive under `חומרי לימוד › ליקוטי שיחות › חלק א › {1 בראשית, 2 שמות, 3 ויקרא}` (folder id `1fBMfBAWvL1egeQUaeWaSHJ5U5dw4dlxf`), 42 PDFs total. The app's own "חיפוש חומר לימוד" search (in `printmedia.js`) does **not** index this yet — it still only searches the mock booklet/maamar data. If the user wants this library searchable/browsable from inside the app (not just Drive), that's unbuilt: it would need either a static index of these 42 files baked into `data.js`, or a live Drive-folder listing (which this static GitHub Pages site can't do without exposing Drive API credentials client-side — needs a decision, not a given). Future "חלק ב" etc. volumes should go in sibling `חלק ב`/`חלק ג` folders under the same `ליקוטי שיחות` folder, same per-volume Chumash subfolder structure.
- **Drive folder convention**: booklets live in Drive under `חומרי לימוד › א חסידישע ליל שישי` (folder id `1kGvUkjrjPJg7uqJJNpCOQPD3hsb8M79F`), named `קובץ לימוד א חסידישע ליל שישי – חודש <חודש> ה׳<שנה>.pdf`. Point the user back to this folder/convention for any new booklet rather than letting files land loose in Drive root again.

# FUNAABSU Constitution App

A minimal, slick reader for the **2019 Revised Constitution of FUNAABSU**
(Federal University of Agriculture, Abeokuta Student Union), built with
Next.js + Tailwind. Students read without an account; authorised admins edit
the text and add bills from a hidden, password-gated route.

## What's inside

- **Home** — title, search, category cards, recently read & bookmarks
- **Articles** — list + filter, with article number and short title
- **Article detail** — full text, sub-clauses, related articles, prev/next, save
- **Search** — by article number / keyword / topic, with content-type filters
- **Bookmarks** — saved articles + private per-item notes (stored on-device)
- **Appendix → Bills** — appendices, anthems, and the editable **Bills** tab
- **Rights & Duties** — curated index of membership rights, code of conduct & objectives
- **Settings** — dark / light / auto, reading text size, clear-on-device data
- **`/admin`** — password-gated editor for the constitution text and bills

## How "no user login" works

- **Users** never see a login. They read statically-rendered content.
- **Admins** open `/admin`, enter a password (checked **server-side** against a
  salted SHA-256 hash; the plaintext is never shipped to the browser).
- When an admin clicks **Publish**, the full `data/constitution.json` is
  committed back to this repo via the **GitHub Contents API** ("GitHub as a
  database"). That commit kicks off a new Vercel deploy, so students get the
  update on next load — no app update needed.

This fits the "≈8 edits per session" cadence perfectly. Because each edit is a
git commit, you get full history and one-click rollback for free.

## Quick start (local)

```bash
cd constitution-app
cp .env.example .env.local      # working dev defaults included
npm install
npm run dev
```

Open http://localhost:3000. Admin at http://localhost:3000/admin.

> **Default dev password:** `uTQZ#ACbzcujiHvYKuU*-p`
> (pre-hashed in `.env.example` — change it before going live, see below).

To edit content in dev **without** GitHub, just edit
`constitution-app/data/constitution.json` directly and the app picks it up.
The admin "Save" flow needs the GitHub env vars (below) to persist.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel. Framework: **Next.js** (auto-detected).
3. Add environment variables (Project → Settings → Environment Variables):
   - `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`
   - `GH_TOKEN`, `GH_OWNER`, `GH_REPO`, `GH_BRANCH`, `GH_PATH`
   (`GH_PATH` = `data/constitution.json`; `GH_BRANCH` = your default branch.)
4. Deploy. Users land on `/`; admins use `/admin`.

## Rotate the admin password

```bash
npm run hash "your new strong password"
# prints ADMIN_PASSWORD_SALT and ADMIN_PASSWORD_HASH
```

Paste them into `.env.local` (dev) or Vercel env vars (prod). The plaintext
never gets stored anywhere.

## Create the GitHub token (admin saves)

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens**.
2. Token access: **Only select repositories** → pick this repo.
3. Repository permissions → **Contents: Read and write**.
4. Copy the token into `GH_TOKEN`.
   (`GH_OWNER` / `GH_REPO` are the repo's owner and name.)

The token is scoped to a single repo and only used server-side in the
`/api/save` route — it's never sent to browsers.

## Data source

`data/constitution.json` is generated from
`2019 Revised Constitution of FUNAABSU.docx` by:

```bash
python3 tools/parse_docx.py
```

Re-run it after editing the original `.docx` to regenerate the structured JSON
(articles, sections, appendices, anthems, signatures). The `bills` array is
empty by default and is filled through the admin editor.

## Project structure

```
constitution-app/
  data/constitution.json          canonical content (seed; admin commits here)
  tools/parse_docx.py             docx → structured JSON parser
  tools/hash_password.js          generate salted SHA-256 admin hash
  src/
    lib/data.ts                   types + accessors + search + categories
    lib/content-key.ts            bookmark/resolve helpers
    lib/useLocalStorage.ts        SSR-safe persisted state
    components/                   AppProviders, Nav, icons, SaveBar, …
    app/                          pages + /api/save route + /admin editor
```

## Security notes (honest)

- The admin password is checked server-side, but the *route exists at a public
  URL* (`/admin`). Anyone can attempt it; wrong passwords are rate-limited.
  Use a strong password. The hash is salted SHA-256.
- The GitHub token lives in a server-only env var and is repo-scoped. Anyone
  who extracts it can overwrite the document — so keep it private and rotate
  it if leaked.
- Users have no accounts and no edit capability; their localStorage holds only
  bookmarks, notes, recently read, and display preferences.
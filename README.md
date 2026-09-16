# Bonus Coin Giveaway

A simple, professional, mobile-friendly giveaway website. Followers visit two public
pages (Home and Rewards) to view the current giveaway and submit a claim. A separate,
password-protected admin panel at `/admin` lets the owner edit the welcome message,
manage reward info, and — most importantly — create **any custom submission fields**
the giveaway needs (wallet address, account number, username, or anything else),
without touching code.

No database server required — data is stored in a small JSON file on disk. No build
step required — plain Express + EJS + vanilla JS/CSS.

## Features

- **Home page** — editable welcome message, "Rewards" and "Claim Reward" buttons.
- **Rewards page** — shows the current reward, optional copyable details (e.g. a
  deposit address), and a dynamic claim form built from whatever fields the admin
  has configured.
- **Fully custom submission fields** — add, edit, delete, reorder, enable/disable,
  require/optional, and mark individual fields as copyable. No fixed schema.
- **Admin panel at `/admin`** — separate from the public site, with no link to it
  anywhere on the public pages. Protected by server-side session auth.
- **Winner selection** — pick a winner manually from submissions, or at random.
- **Security** — submissions are never publicly visible; only an authenticated admin
  can view them. Passwords are never stored in the frontend; only a bcrypt hash is
  used server-side.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Generate a password hash for the admin account (this never stores the plain
password anywhere):

```bash
npm run hash -- "your-chosen-password"
```

Paste the printed hash into `.env` as `ADMIN_PASSWORD_HASH`, and set `ADMIN_USERNAME`
and a random `SESSION_SECRET`. Then run:

```bash
npm start
```

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

## 2. Deploying to Render

### Option A — Blueprint (`render.yaml`), recommended

1. Push this project to a GitHub/GitLab repo (or use Render's "Deploy from a public
   Git repo" / manual upload flow).
2. In Render, choose **New > Blueprint** and point it at the repo. Render will read
   `render.yaml` and create the web service plus a small persistent disk mounted at
   `/data` automatically.
3. When prompted, set the `ADMIN_PASSWORD_HASH` environment variable (generate it
   first with `npm run hash -- "your-password"` locally, since it's never entered as
   plain text). `SESSION_SECRET` is generated for you automatically.
4. Deploy. Your site will be live at the URL Render gives you.

### Option B — Manual Web Service

1. In Render, choose **New > Web Service** and connect your repo (or upload the code).
2. Environment: **Node**. Build command: `npm install`. Start command: `npm start`.
3. Add environment variables:
   - `NODE_ENV=production`
   - `SESSION_SECRET` — a long random string
   - `ADMIN_USERNAME` — your admin username
   - `ADMIN_PASSWORD_HASH` — generate with `npm run hash -- "your-password"`
   - `DATA_DIR=/data` (only if you add a persistent disk — see below)
4. **Important — persistent storage:** Render's default disk is ephemeral, meaning
   submissions and settings would be lost on every redeploy/restart. To keep data
   permanently, add a **Persistent Disk** in the service's "Disks" settings (e.g.
   mount path `/data`, 1 GB is plenty), and set `DATA_DIR=/data` as above. Without a
   disk, the app still works fine for testing, but data resets on redeploy.
5. Deploy.

## 3. Using the admin panel

Go to `https://your-site.onrender.com/admin`, log in, and you can:

- **Welcome & Reward tab** — edit the homepage welcome message, set the reward
  title/description, and toggle whether the giveaway is currently active (accepting
  entries).
- **Reward Details tab** — add optional label/value details shown on the Rewards
  page (e.g. "Deposit Address" with a Copy button, a promo code, a prize amount).
  Entirely optional and fully custom.
- **Submission Fields tab** — this is where you define what information followers
  must submit. Add as many fields as you like, name them anything, mark them
  required/optional, enable a Copy button on the value the user types, reorder them
  with the arrow buttons, or disable/delete them.
- **Submissions tab** — view every entry, manually select a winner, or click
  "Pick Random Winner" to choose one at random. "Reset All" clears submissions to
  start a fresh giveaway round.

The public pages only ever show fields that are currently enabled — nothing is
hard-coded to a specific giveaway type.

## 4. Security notes

- The admin password is never stored in plain text or in any frontend code — only a
  bcrypt hash lives in an environment variable, compared server-side.
- `/admin` requires an authenticated session (httpOnly, sameSite cookies) and every
  state-changing admin request is checked against a CSRF token.
- Repeated failed logins from the same IP are temporarily locked out.
- Submitted entries are stored server-side and are only ever returned to an
  authenticated admin session — there is no endpoint that exposes another user's
  submission.
- Change `SESSION_SECRET` and your admin password before sharing the site publicly,
  and always deploy with `NODE_ENV=production` so cookies are marked `secure`.

## Project structure

```
server.js              App entry point
lib/db.js               JSON file storage
lib/auth.js              Admin auth + CSRF checks
lib/loginLimiter.js       Basic brute-force lockout
routes/public.js        Home + Rewards pages
routes/publicApi.js      Public config + submit API
routes/adminPages.js    Admin login/dashboard pages
routes/adminApi.js       Admin CRUD API (protected)
views/                  EJS templates
public/                 CSS + client-side JS
scripts/generate-hash.js  Helper to create ADMIN_PASSWORD_HASH
data/                   JSON data file lives here (gitignored)
```

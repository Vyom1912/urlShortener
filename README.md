# 🔗 URL Shortener

A full-stack URL shortener built with **Node.js**, **Express 5**, **MongoDB (Mongoose)** and **EJS**.
Create an account, shorten links under your own username, share them, and see how many clicks each one gets.
The UI is mobile-first and supports light and dark mode.

```
yoursite.com/<username>/<short-code>   →   https://the-original-long-url.com/...
```

---

## ✨ Features

**Links**

- Shorten any `http://` / `https://` URL
- Custom short codes (`gh`, `my-portfolio`, …) or an auto-generated random one
- **Per-user namespaces**: every user has their own username, so two users can both own `/gh`
  - `yoursite.com/alice/gh` → Alice's link
  - `yoursite.com/bob/gh` → Bob's link
- Click counter for every link, with total clicks on the profile page
- Edit a link's destination or short code, or delete it
- One-tap copy, native share sheet on phones, and search when you have more than 3 links
- Each user only ever sees and manages their own links
- Links from before usernames existed (`yoursite.com/<code>`) keep working

**Accounts**

- Register / log in / log out
- JWT access token (15 min) + refresh token (7 days) in `httpOnly` cookies, backed by a session in MongoDB
- Email verification with an 8-digit code or a link (sent with [Resend](https://resend.com))
- Forgot password → emailed reset link (expires after 15 minutes, single use)
- Change password, edit name, and pick a custom username

**UI**

- Mobile-first layout with a bottom tab bar on phones
- Automatic dark mode
- Inline validation errors, success messages, and forms that keep what you typed after an error
- Friendly 404 and error pages

---

## 🛠️ Tech stack

| Area       | Tools                                                   |
| ---------- | ------------------------------------------------------- |
| Server     | Node.js, Express 5                                      |
| Database   | MongoDB Atlas via Mongoose                              |
| Views      | EJS templates, plain CSS, Font Awesome, Poppins         |
| Auth       | jsonwebtoken, argon2 (password hashing), cookie-parser  |
| Validation | Zod                                                     |
| Email      | Resend + MJML templates                                 |
| Hosting    | Vercel (or any Node host)                               |

---

## 🚀 Getting started

### 1. Prerequisites

- Node.js **20.11+** (the code uses `import.meta.dirname`)
- A MongoDB connection string (free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local MongoDB)
- A [Resend](https://resend.com) API key (only needed for verification and password-reset emails)

### 2. Install

```bash
git clone https://github.com/Vyom1912/urlShortener.git
cd urlShortener
npm install
```

### 3. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable             | Required | Description                                                                              |
| -------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `MONGO_URI`          | ✅       | MongoDB connection string                                                                |
| `JWT_SECRET`         | ✅       | Secret for signing access tokens (a long random string)                                  |
| `JWT_REFRESH_SECRET` | ✅       | Secret for signing refresh tokens (a *different* long random string)                     |
| `SESSION_SECRET`     | ✅       | Secret for the session cookie used for flash messages                                    |
| `RESEND_API_KEY`     | ✅       | API key from Resend for sending emails                                                   |
| `FRONTEND_URL`       | ✅       | Public base URL used in email links, e.g. `http://localhost:3000` or your deployed URL   |
| `PORT`               |          | Port for local development (default `3000`)                                              |

> Tip: generate a secret with
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 4. Run

```bash
npm run dev     # development, restarts on file changes
npm start       # production
```

Open <http://localhost:3000>. To try the mobile layout, open DevTools and switch to a phone view, or visit the site from your phone on the same Wi-Fi.

---

## 🧭 Routes

| Method | Path                         | Description                                   |
| ------ | ---------------------------- | --------------------------------------------- |
| GET    | `/`                          | Home: shorten form and your links (login required) |
| POST   | `/`                          | Create a short link                           |
| GET    | `/edit/:id`                  | Edit link page                                |
| POST   | `/edit/:id`                  | Save link changes                             |
| POST   | `/delete/:id`                | Delete a link                                 |
| GET    | `/:username/:shortCode`      | **Redirect** to the original URL              |
| GET    | `/:shortCode`                | Redirect (older links from before usernames existed) |
| GET/POST | `/register`, `/login`      | Sign up / log in                              |
| GET    | `/logout`                    | Log out                                       |
| GET    | `/profile`                   | Profile and stats                             |
| GET/POST | `/edit-profile`            | Change name and username                      |
| GET/POST | `/change-password`         | Change password                               |
| GET    | `/verify-email`              | Enter verification code                       |
| POST   | `/resend-verification-link`  | Send a new verification email                 |
| GET    | `/verify-email-token`        | Verify via code or emailed link               |
| GET/POST | `/reset-password`          | Request a password reset email                |
| GET/POST | `/reset-password/:token`   | Set a new password                            |
| GET    | `/health`                    | Deployment check: database status and which settings are set (yes/no only) |

Usernames and short codes cannot use the app's own words (`login`, `profile`, `edit`, …) so they never clash with these routes.

---

## 📁 Project structure

```txt
app.js                    Express app: middleware, routes, 404 and error handlers
api/index.js              Vercel entry point (re-exports the app)
vercel.json               Sends every request to api/index.js

config/
  constants.js            Token lifetimes
  db.js                   MongoDB connection and index sync

controllers/
  auth.controller.js      Register, login, profile, email verification, passwords
  shortener.controller.js Create / edit / delete / redirect short links

services/
  auth.services.js        Users, sessions, JWT, verification and reset tokens
  shortener.services.js   Short link queries and username handles

middlewares/
  auth.middleware.js      Reads the JWT cookies and refreshes expired access tokens

models/                   Mongoose schemas
  User.js  ShortLink.js  Session.js  VerifyEmailToken.js  PasswordResetToken.js

validators/               Zod schemas for every form
  auth.validator.js  shortener.validator.js

lib/
  send-email.js           Resend wrapper
  get-html-from-template.js  Renders MJML email templates

emails/                   MJML email templates
views/                    EJS pages
  partials/               header, footer, flash messages, password field
  auth/                   login, register, profile, password and verification pages
public/style.css          All styles (mobile-first, dark mode)
```

---

## ☁️ Deploying to Vercel

1. Import the GitHub repo into Vercel. `vercel.json` and `api/index.js` are already set up.
2. In **Project → Settings → Environment Variables**, add every variable from the table above.
   Set `FRONTEND_URL` to your Vercel URL (e.g. `https://your-app.vercel.app`) so email links point to the live site.
3. In MongoDB Atlas → **Network Access**, allow connections from Vercel (e.g. `0.0.0.0/0`).
4. Deploy, then open `https://<your-app>.vercel.app/health`. It should show `"ok": true`.
   If not, `database.error` explains why (for example a wrong password, or Atlas blocking Vercel's IP),
   and `env` shows which settings are missing. After changing environment variables, **redeploy** so they take effect.

> **Note:** flash messages use the default in-memory session store. On serverless hosting a message can occasionally be lost between requests.
> For production, switch to a persistent store such as [`connect-mongo`](https://www.npmjs.com/package/connect-mongo).

---

## 🗄️ Database notes

- Short codes are unique **per user**, enforced by a unique index on `{ userId, shortCode }`.
- On startup the app runs `ShortLink.syncIndexes()`. This removes the old site-wide unique index on `shortCode` from earlier versions and adds the per-user one.
- A user's username (`handle`) is generated randomly the first time it's needed and can be changed from **Edit profile**.
  Changing it changes every short link for that user, so links already shared with the old username stop working.

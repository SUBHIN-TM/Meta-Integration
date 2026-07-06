# How to Run — Quick Start

A fast, copy-paste guide to get the project running.

---

## 1. Start the server

In **Terminal 1**, from the project folder:

```bash
npm start
```

> This runs `node server.js`. You should see: `Server running on port 3005`
> (For auto-restart while coding, use `npm run dev` instead.)

---

## 2. Start ngrok (public HTTPS tunnel)

In **Terminal 2**:

```bash
ngrok http 3005
```

> ngrok prints a public URL like `https://xxxx-xxxx.ngrok-free.dev`.
> **Why we need it:** Meta cannot call `localhost`. ngrok gives your local
> server a public address so Meta's webhooks can reach it.
> ⚠️ On the free plan this URL **changes every restart** — re-paste it in Meta.

---

## 3. Local URLs (open in a browser)

| URL | What it is |
|---|---|
| http://localhost:3005/health | Quick check — should say "Server running successfully.." |
| http://localhost:3005/meta-notifications | The **live dashboard** — watch messages + statuses in real time |

---

## 4. Register the webhook in Meta (one-time per ngrok URL)

In **Meta App Dashboard → WhatsApp → Configuration → Webhook**:

| Field | Value |
|---|---|
| **Callback URL** | `https://<your-ngrok-url>/webhook` |
| **Verify token** | `connect_student_portal_verify` (this is `VERIFY_TOKEN` in `.env`) |
| **Subscribe to** | the `messages` field |

Click **Verify and Save**. Then send a WhatsApp message to your number and
watch the dashboard fill up.

---

## Key idea to remember

> **A webhook is always the URL of whoever wants to RECEIVE the data.**
>
> - Meta has the events → **we** want them → **we** give Meta **our** URL
>   (`/webhook`). So `/webhook` is our webhook. *(We receive.)*
> - When **we** send a reply, **we** call **Meta's** URL. That is an **API
>   call**, not a webhook. *(We send.)*

---

## All routes (reference)

| Method + URL | Who calls it | Purpose |
|---|---|---|
| `GET /health` | us / monitors | Health check |
| `GET /webhook` | Meta (once) | Verification handshake |
| `POST /webhook` | Meta (every event) | Receive messages + statuses, auto-reply |
| `POST /send` | dashboard popup | Send a manual reply |
| `POST /send-message` | demo | Echo demo |
| `GET /meta-notifications` | us (browser) | Live dashboard page |
| `GET /meta-notifications/data` | the page | JSON feed (polled every 2s) |
| `POST /meta-notifications/clear` | the page | Clear the dashboard |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing script: start` | Already fixed — `npm start` runs `node server.js` |
| `Authentication Error (code 190)` when sending | Access token expired — refresh it in `.env`, then restart the server |
| Meta webhook won't verify | Check the Callback URL ends with `/webhook` and the verify token matches `VERIFY_TOKEN` in `.env` |
| Dashboard is empty | Send a WhatsApp message to your number; make sure ngrok + Meta point to the current URL |
| ngrok URL stopped working | It changed on restart — copy the new URL into Meta again |

---

## The two commands you use most

```bash
npm start           # Terminal 1 — start the server
ngrok http 3005     # Terminal 2 — expose it publicly
```

Then open: **http://localhost:3005/meta-notifications**

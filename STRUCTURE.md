# Project Structure — Team Walkthrough

A guide to explain the codebase file-by-file. Open each file as you read its row.

---

## The big picture (how one request flows)

```
   Meta  /  Browser
        │
        ▼
   server.js            ← starts the server
        │
        ▼
   src/app.js           ← builds the Express app + turns on JSON parsing
        │
        ▼
   src/routes/*         ← "ADDRESS BOOK": which URL goes to which handler
        │
        ▼
   src/controllers/*    ← "THE BRAIN": what to DO when a URL is hit
        │
        ├─────────────► src/services/whatsapp.service.js   (SEND to Meta)
        └─────────────► src/services/eventStore.service.js (REMEMBER events)
                                    │
                                    ▼
                        src/views/dashboard.view.js        (the dashboard LOOK)
```

**One-line idea:** *routes* decide the address, *controllers* decide the action,
*services* do the reusable work, *views* draw the screen.

---

## Folder-by-folder (what to say to the team)

| File | Say this: "This file is for…" |
|---|---|
| **server.js** | "…starting the app. It does one thing: start listening on the port. That's the entry point — `npm start` runs this." |
| **src/config.js** | "…all our settings in one place. Every token, the port, the Meta API version. If a value changes, we change it here only." |
| **src/app.js** | "…assembling the app: turn on JSON reading and connect all the routes. It builds the app; server.js starts it." |
| **src/routes/index.js** | "…the master address book. It lists every route group. When we add OTP later, we add one line here." |
| **src/routes/health.routes.js** | "…the `/health` check — a quick 'is the server alive?' endpoint." |
| **src/routes/webhook.routes.js** | "…the `/webhook` address — the one we give Meta so Meta can call US." |
| **src/routes/message.routes.js** | "…the addresses where WE send messages: `/send` and `/send-message`." |
| **src/routes/dashboard.routes.js** | "…the dashboard addresses: the page, its data feed, and the clear button." |
| **src/controllers/webhook.controller.js** | "…the brain for Meta's calls: verify the webhook once, then receive every event and auto-reply." |
| **src/controllers/message.controller.js** | "…the brain for sending: the dashboard reply popup and the echo demo." |
| **src/controllers/dashboard.controller.js** | "…the brain for the dashboard: show the page, give it JSON, clear it." |
| **src/services/whatsapp.service.js** | "…the SEND worker. Every outgoing call to Meta lives here (template, auto-reply, manual send)." |
| **src/services/eventStore.service.js** | "…the MEMORY. It decodes each webhook into a readable row and keeps a list for the dashboard." |
| **src/views/dashboard.view.js** | "…the LOOK of the dashboard — the HTML/CSS page. Kept separate so the code stays clean." |

---

## The routes at a glance (what each URL is)

| Method + URL | Who calls it | What it does |
|---|---|---|
| `GET /health` | us / monitors | "Server running successfully.." |
| `GET /webhook` | **Meta** (once) | Verification handshake (checks the secret token) |
| `POST /webhook` | **Meta** (every event) | Receives messages + statuses, records them, auto-replies |
| `POST /send` | our dashboard | Sends a manual free-text reply (popup) |
| `POST /send-message` | demo | Echo demo route |
| `GET /meta-notifications` | **us** (browser) | The live dashboard page |
| `GET /meta-notifications/data` | the page | JSON feed the page polls every 2s |
| `POST /meta-notifications/clear` | the page | Clears the dashboard |

> **Reminder for the team:** only `/webhook` is an actual *webhook* (Meta calls it).
> Everything under `/meta-notifications` is our own viewing UI — Meta never calls it.

---

## Two key concepts to repeat

1. **Webhook vs API call**
   - **Webhook** = *Meta calls us* (we receive) → `POST /webhook`
   - **API call** = *we call Meta* (we send) → `whatsapp.service.js`

2. **The 24-hour window**
   - If the **user** messages first → we may reply with **free text** for 24 hours.
   - If **we** message first (or the window closed) → we must use an **approved template**.

---

## Where the next feature (OTP via MSG91) will go

OTP will be a **separate, self-contained module** — it does NOT touch the Meta code.

```
src/routes/otp.routes.js          (new)  ->  /otp/send, /otp/verify, /otp/resend
src/controllers/otp.controller.js (new)
src/services/msg91.service.js     (new)  ->  talks to MSG91 (SMS/WhatsApp/email OTP)
```

Wiring it in is one line in `src/routes/index.js`. Meta stays for chat; MSG91 does OTP.

---

## How to run

```bash
npm start        # start the server (node server.js)
npm run dev      # start with auto-restart on file changes
```

Then open the dashboard: `http://localhost:3005/meta-notifications`

# Interval Connect — WhatsApp Integration (Handover / Build Spec)

**Read this first:** this file is a complete build spec. Paste it into Claude Code
on your machine and it can recreate the whole project from scratch. You do not
need the original repo.

**Scope — what this covers:**

- ✅ WhatsApp Cloud API (Meta Graph API) — receive messages, auto-reply, manual send, live dashboard
- ✅ ONE WhatsApp number: the **Interval Connect** production number
- ❌ No MSG91 / OTP (separate module, not part of this handover)
- ❌ No Meta sandbox / test number (the old test integration is dropped)
- 🔀 Public URL is **ngrok**, not the old `whatsapptest.teaminterval.net` VPS

---

## 1. Stack

| Thing | Value |
|---|---|
| Runtime | Node.js (CommonJS, `"type": "commonjs"`) |
| Framework | Express 5 |
| HTTP client | axios |
| Config | dotenv |
| Meta Graph API version | `v25.0` |
| Port | `3005` |
| Storage | In-memory only (events are lost on restart — no DB) |

`package.json` dependencies:

```json
{
  "axios": "^1.16.1",
  "dotenv": "^17.4.2",
  "express": "^5.2.1"
}
```

Scripts: `"start": "node server.js"`, `"dev": "node --watch server.js"`

---

## 2. Environment variables (`.env`)

> ⚠️ **The real values are NOT in this file — they are sent separately.**
> Ask for the actual `.env` and paste the values in place of the placeholders.

```env
PORT=3005

# Interval Connect — production WhatsApp number
VERIFY_TOKEN_2=REPLACE_ME_ANY_SECRET_STRING
WHATSAPP_ACCESS_TOKEN_2=REPLACE_ME_PERMANENT_SYSTEM_USER_TOKEN
PHONE_NUMBER_ID_2=REPLACE_ME_PHONE_NUMBER_ID
```

| Key | What it is | Where it comes from |
|---|---|---|
| `PORT` | Port the server listens on | Ours — `3005` |
| `VERIFY_TOKEN_2` | Any secret string you choose. Must be typed **identically** into Meta when registering the callback URL. Only used for the one-time handshake. | You invent it |
| `WHATSAPP_ACCESS_TOKEN_2` | **Permanent** System User access token (not the 24h temp token) | Meta Business Settings → System Users → Generate Token |
| `PHONE_NUMBER_ID_2` | The Interval Connect number's ID | Meta App → WhatsApp → API Setup |

> **Why the `_2` suffix?** The original project ran two numbers side by side
> (test + production); production was the `_2` set. The names are kept so the
> existing `.env` file drops in unchanged. There is only one number now — the
> `_2` set IS the Interval Connect number. Rename them if you prefer, just
> update `src/config.js` to match.

Also create a `.env.example` with the same keys and placeholder values, and make
sure `.gitignore` contains `.env`.

---

## 3. Folder structure

```
server.js                  # entry — starts the server, nothing else
.env                       # secrets (gitignored)
src/
  app.js                   # builds the Express app, mounts routes
  config.js                # the ONLY file that reads process.env
  routes/
    index.js               # master router — mounts all route files
    health.routes.js
    webhook.routes.js      # Meta calls us
    message.routes.js      # we send
    dashboard.routes.js    # our monitoring UI
  controllers/
    webhook.controller.js
    message.controller.js
    dashboard.controller.js
  services/
    whatsapp.service.js    # every outgoing call to Meta lives here
    eventStore.service.js  # in-memory event log for the dashboard
  views/
    dashboard.view.js      # returns the dashboard HTML as a string
```

**Layering rule:** routes never contain logic, controllers never call axios
directly, only `config.js` reads `process.env`.

---

## 4. ENDPOINTS → CONTROLLERS (the core table)

| Method | Endpoint | Route file | Controller → function | Who calls it | Purpose |
|---|---|---|---|---|---|
| `GET` | `/health` | `health.routes.js` | *(inline handler)* | Us / uptime monitors | Returns `Server running successfully..` |
| `GET` | `/webhook-interval` | `webhook.routes.js` | `webhook.controller.js` → `verifyWebhook` | **Meta** (once) | Verification handshake |
| `POST` | `/webhook-interval` | `webhook.routes.js` | `webhook.controller.js` → `receiveWebhook` | **Meta** (every event) | Receive messages + statuses, auto-reply |
| `POST` | `/send` | `message.routes.js` | `message.controller.js` → `sendManual` | Dashboard reply popup | Send a manual free-text reply |
| `POST` | `/send-message` | `message.routes.js` | `message.controller.js` → `sendEcho` | Demo | Echo demo — replies with a template |
| `GET` | `/meta-notifications` | `dashboard.routes.js` | `dashboard.controller.js` → `showDashboard` | Us (browser) | The live dashboard page |
| `GET` | `/meta-notifications/data` | `dashboard.routes.js` | `dashboard.controller.js` → `getData` | The page (polls every 2s) | JSON event feed |
| `POST` | `/meta-notifications/clear` | `dashboard.routes.js` | `dashboard.controller.js` → `clearData` | The page (Clear button) | Wipe the event list |

> **Key idea:** a webhook is always the URL of whoever wants to **RECEIVE**.
> Meta has the events, we want them, so we give Meta **our** URL
> (`/webhook-interval`) — that is our webhook, *we receive*.
> When we send a reply we call **Meta's** URL — that is an **API call**, not a
> webhook, *we send*.

---

## 5. What each piece does

### `src/config.js`

Loads dotenv and exports one flat object. Nothing else in the project touches
`process.env`.

```js
{
  port: process.env.PORT,
  graphApiVersion: "v25.0",
  account: {
    label: "interval",
    webhookPath: "/webhook-interval",
    verifyToken: process.env.VERIFY_TOKEN_2,
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN_2,
    phoneNumberId: process.env.PHONE_NUMBER_ID_2,
  },
}
```

### `src/services/whatsapp.service.js` — the only file that calls Meta

Builds the URL
`https://graph.facebook.com/{graphApiVersion}/{phoneNumberId}/messages`
and the header `Authorization: Bearer {whatsappAccessToken}`.

Exports three send functions:

| Function | Body sent to Meta | Error behaviour | Used by |
|---|---|---|---|
| `sendTemplateMessage(to, templateName = "hello_world")` | `type: "template"`, `language: { code: "en_US" }` | **Swallows** errors (logs only) | `/send-message` |
| `replyMessage(to, text)` | `text: { body }` | **Swallows** errors on purpose — a failed auto-reply must never crash the webhook | `/webhook-interval` auto-reply |
| `sendTextMessage(to, text)` | `text: { body }` | **Throws** — so the dashboard popup can show Meta's real reason (e.g. "outside 24h window") | `/send` |

All bodies include `messaging_product: "whatsapp"`.

> Free text only works inside Meta's **24-hour customer service window** (i.e.
> the user messaged us within the last 24h). Outside it, only approved
> templates go through.

### `src/controllers/webhook.controller.js`

**`verifyWebhook(req, res)`** — the one-time GET handshake:

- Reads `hub.mode`, `hub.verify_token`, `hub.challenge` from `req.query`
- If `mode === "subscribe"` **and** `token === config.account.verifyToken` →
  `res.status(200).send(challenge)` (echo the challenge back verbatim)
- Otherwise → `res.sendStatus(403)`

**`receiveWebhook(req, res)`** — the POST that fires on every event:

1. Log the raw body, then `eventStore.recordWebhook(req.body, "interval")`
2. Dig out the message:
   `req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]`
3. **If there is no message** it was only a status update (sent/delivered/read)
   → `res.sendStatus(200)` and stop
4. Read `message.from` and `message?.text?.body`
5. **Auto-reply rule:** only reply to a greeting — test with `/\bhi\b/i`.
   The `\b` word boundaries mean "hi", "Hi", "HI", "oh hi there" match, but
   "this" / "ship" do **not**. Any other message is recorded for the dashboard
   but gets **no** auto-reply.
6. If it is a greeting → `await whatsapp.replyMessage(from, \`Received: "${text}" 👋\`)`
7. `res.sendStatus(200)` — always ack Meta. On a thrown error, `res.sendStatus(500)`

> ⚠️ **Always return 200 fast.** If Meta doesn't get a 2xx it retries the event,
> and after repeated failures it can disable the webhook subscription.

### `src/controllers/message.controller.js`

**`sendManual(req, res)`** — body `{ to, text }`

- Validate both fields → `400 { ok: false, error: "Both 'to' and 'text' are required." }`
- `const data = await whatsapp.sendTextMessage(to, text)`
- Pull the message id: `data?.messages?.[0]?.id`
- Push an outgoing event to the eventStore so it shows instantly in the
  dashboard as a right-side bubble:
  `{ kind: "manual-out", direction: "out", dirLabel: "SERVER → USER", title: "📤 You sent (manual)", who: \`to ${to}\`, detail: text, id: wamid, source: "interval" }`
- Success → `{ ok: true, id: wamid }`
- Failure → `500 { ok: false, error }` where error is
  `error?.response?.data?.error?.message` so Meta's real reason reaches the popup

**`sendEcho(req, res)`** — demo. Expects a Meta-shaped body, extracts the same
`entry[0].changes[0].value.messages[0]` path, and calls
`sendTemplateMessage(from)` (the `hello_world` template). No message → `200`.

### `src/services/eventStore.service.js`

In-memory array (no DB). Needs:

- `recordWebhook(body, label)` — decode a raw Meta webhook body into readable
  event(s) — separate incoming **messages** from **statuses** (sent/delivered/read) —
  and push them
- `pushEvent(event)` — push a pre-built event (used by `sendManual`)
- `getEvents()` — return the list, newest first
- `clearEvents()` — empty the list

Cap the list (e.g. keep the latest ~100) so it can't grow forever.

### `src/views/dashboard.view.js`

Exports `renderDashboardHtml()` returning a full HTML page as a string
(no template engine). The page:

- Polls `GET /meta-notifications/data` every 2 seconds
- Renders a chat view — incoming messages on the left, outgoing on the right
- Has a **Clear** button → `POST /meta-notifications/clear`
- Has a reply popup → `POST /send` with `{ to, text }`

---

## 6. Running it locally with ngrok

```bash
npm install
npm start              # Terminal 1 → "Server running on port 3005"
ngrok http 3005        # Terminal 2 → prints https://xxxx-xxxx.ngrok-free.dev
```

Local URLs:

| URL | What |
|---|---|
| http://localhost:3005/health | Should say `Server running successfully..` |
| http://localhost:3005/meta-notifications | The live dashboard |

---

## 7. Register the webhook in Meta

**Meta App Dashboard → (Interval Connect app) → WhatsApp → Configuration → Webhook → Edit**

| Field | Value |
|---|---|
| **Callback URL** | `https://<your-ngrok-url>/webhook-interval` |
| **Verify token** | the exact value of `VERIFY_TOKEN_2` in your `.env` |
| **Subscribe to** | the **`messages`** field |

Click **Verify and Save** — Meta immediately fires `GET /webhook-interval` and
must get the challenge echoed back. Watch Terminal 1 for
`Webhook verified successfully ✅`.

> ⚠️ **ngrok free plan: the URL changes on every restart.** Each time you
> restart ngrok you must paste the new URL back into Meta and Verify again.
> (A paid ngrok static domain avoids this.)

**Test it end-to-end:** send `hi` from a real WhatsApp to the Interval Connect
number → you should get `Received: "hi" 👋` back, and the message should appear
on the dashboard.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Webhook won't verify | Callback URL must end in `/webhook-interval`; verify token must match `VERIFY_TOKEN_2` exactly; server + ngrok both running |
| `Authentication Error (code 190)` on send | Token expired or wrong — you need the **permanent System User token**, not the 24h temp one. Update `.env`, restart the server |
| Send fails "outside 24h window" | Expected. Free text needs the user to have messaged within 24h — use an approved template instead |
| Dashboard empty | ngrok URL changed → re-register in Meta. Confirm `messages` is subscribed |
| No auto-reply | By design — it only replies to `hi`. Anything else is recorded but not answered |
| Events vanished after restart | Expected — the store is in-memory, no DB |

---

## 9. Notes for whoever takes this over

- **In-memory store** — everything is lost on restart. A DB is the obvious next step.
- **No auth on any endpoint.** `/meta-notifications` and `/send` are wide open to
  anyone who has the ngrok URL. Do not leave a tunnel up unattended, and put auth
  in before this goes anywhere permanent.
- **No Meta signature verification.** The webhook trusts any POST that reaches it.
  Production should verify the `X-Hub-Signature-256` header against the app secret.
- **The auto-reply `hi` rule is deliberate** — it was limited on purpose to stop
  the bot answering every message during testing.

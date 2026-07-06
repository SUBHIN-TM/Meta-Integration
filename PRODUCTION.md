# WhatsApp Integration — Production Readiness Plan

**Project:** WhatsApp Business messaging integration (Node.js / Express + Meta WhatsApp Cloud API)
**Prepared for:** Team lead review
**Status:** Working in development (local + ngrok); ready to plan production rollout

---

## 1. What the project does

A Node.js/Express service that connects to the **Meta WhatsApp Cloud API** to:

- **Receive** incoming WhatsApp messages from customers (via a webhook).
- **Auto-reply** to customers and **send** messages/templates.
- **Track delivery status** of every message (sent → delivered → read → failed).
- Provide a **live browser dashboard** (`/meta-notifications`) to watch all webhook activity in real time, with a click-to-reply popup and a clear/reset button.

### Key concepts

- **Webhook (`/webhook`)** — our endpoint that Meta calls automatically whenever an event happens (message received, status update). *We receive.*
- **API call** — when our server calls Meta's Graph API to send a message. *We send.*
- **24-hour window** — customer-initiated chats allow free-text replies for 24h. Company-initiated messages require a **pre-approved template**.

---

## 2. Current state (Development)

| Item | Current setup |
|---|---|
| Server | Runs locally (`node server.js`, port 3005) |
| Public URL | **ngrok** temporary tunnel (URL changes on restart) |
| Access token | **Permanent System User token** (already created — does not expire) |
| Phone number | Meta **test number** (dev only) |
| App mode | **Development** (can only message test numbers) |
| Event storage | In-memory (resets on server restart) |
| Webhook security | Not yet verifying Meta's request signature |

---

## 3. What changes for Production

The application **code barely changes**. Most production work is **Meta account setup and hosting**, not development.

### 3.1 Technical changes — Low effort (≈ half a day)

| # | Task | Notes |
|---|---|---|
| 1 | **Host the server** on a real platform (Render / Railway / VPS / cloud) | Same `server.js`, deployed to get a **permanent HTTPS URL** instead of ngrok |
| 2 | **Update Meta webhook Callback URL** to the production URL + `/webhook` | Single field change in Meta dashboard |
| 3 | **Move secrets to host environment variables** | `PORT`, `VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `PHONE_NUMBER_ID` — no `.env` file in production |
| 4 | Access token | Already handled — permanent System User token created ✅ |

> No application rewrite required. ngrok → real host is the only structural change.

### 3.2 Meta account changes — Medium effort (mostly waiting on Meta)

| # | Task | Why it's needed | Time |
|---|---|---|---|
| 5 | **Business Verification** | Meta must verify the business is legitimate | ~1–3 days (review) |
| 6 | **Switch app to "Live" mode** | Development mode only messages test numbers | Instant toggle (after verification) |
| 7 | **Register a real phone number** | The test number is dev-only | ~1 hour |
| 8 | **Add a payment method** | Production conversations are billed | ~15 min |
| 9 | **Get message templates approved** | Required for company-initiated (outbound) messages | Hours to ~1 day per template |

### 3.3 Recommended hardening — Optional but advised

| Task | Benefit |
|---|---|
| **Verify webhook signature** (`X-Hub-Signature-256`) | Rejects fake/spoofed webhook calls — currently we accept any POST |
| **Persistent storage** (database) | Message/event history survives restarts (dashboard is currently in-memory) |
| **Rate limiting + structured error logging** | Stability and easier debugging in production |
| **Monitoring / uptime alerts** | Know immediately if the webhook goes down |

---

## 4. Effort & complexity summary

| Area | Complexity | Owner | Time |
|---|---|---|---|
| Code / deployment | 🟢 Simple | Dev | ~Half a day |
| Meta business verification & live mode | 🟡 Medium (paperwork + waiting) | Business/Admin | ~1–3 days |
| Real number + payment + templates | 🟡 Medium | Business/Admin | ~1 day |
| Optional hardening | 🟢–🟡 | Dev | ~1 day |

**Bottom line:** *Technically simple, bureaucratically medium.* The gap between the working demo and production is roughly **90% Meta account setup, 10% deployment**. There is **no major coding effort** to go live.

---

## 5. Cost note

- **Development / test mode:** free.
- **Production:** Meta bills **per conversation** (pricing varies by country and message category — utility / marketing / authentication / service). A payment method on the WhatsApp Business Account is required.

---

## 6. Suggested rollout order

1. Complete **Business Verification** in Meta (start early — it's the longest wait).
2. **Deploy** the server to a permanent host; set environment variables.
3. Point Meta's **webhook** to the production URL and verify.
4. **Register the real phone number** and add a payment method.
5. **Submit templates** for approval.
6. Switch the app to **Live** mode.
7. (Recommended) Add **webhook signature verification** and **persistent storage** before heavy use.
8. Run a **controlled test** with a few real numbers, then open up.

---

## 7. Open questions for the lead

- Which **hosting platform** should we use? (Render/Railway are quickest; a company cloud account if one exists.)
- Is the **business already verified** with Meta, or do we start that process?
- Do we need **message history stored** (database), or is live-only acceptable for v1?
- Expected **message volume** (affects cost estimate and whether we need rate limiting/scaling)?
- Which **outbound templates** do we need approved (content + languages)?

---

*Document generated to support production planning discussion.*

# MSG91 Setup Guide (OTP: Email + SMS + WhatsApp)

A step-by-step record of setting up MSG91 for OTP. Updated as we go.
Goal: OTP verification across **Email, SMS, and WhatsApp** from our Node app.

> **Quick truth per channel (India / TRAI):**
> - 📧 **Email** — no TRAI, no DLT, no KYC. Testable + usable immediately.
> - 💬 **WhatsApp** — governed by Meta (not TRAI). Testable via MSG91 sandbox; production needs business verification.
> - 📱 **SMS** — **TRAI/DLT applies**. Needs company docs (PAN/GST) + approved sender + template. Blocked until DLT is done.

---

## Step 1 — Create the MSG91 account ✅ DONE

1. Go to **https://msg91.com** → **Sign Up**.
2. On "Create an account": the GitHub icon = "developer/GitHub signup" (skip it).
   Click the blue **"Sign up with Email"** button.
3. Enter **personal email + mobile + password**. Submit.
4. **Verify** the email + mobile OTP they send.

### Onboarding questions (answers we used)
| Question | What to pick |
|---|---|
| Select source (how did you hear about us) | Anything (e.g. Google) — no effect |
| Are you a developer? | Skip (use "Sign up with Email") |
| Company name / Type | Your details; Type = Education |
| Service | **OTP** |
| What best describes your goal? | **OTP - User Authentication** |
| Tools you are using (CleverTap, Shopify, …) | None apply — **Skip** |
| GST | **Not mandatory for testing** — skip / leave blank |

**Result:** You land on the dashboard at `control.msg91.com/app/` — "Good Afternoon, Subhin! / interval".

---

## Step 2 — Create the Auth Key ✅ DONE

The Auth Key is the secret our code uses to call MSG91 (like the Meta token was for WhatsApp).

1. Top-right of dashboard → click **"AuthKey"**.
   (URL: `control.msg91.com/app/m/l/settings/security/authkey`)
2. The list is empty at first ("Nothing Here") → click **"+ Create Authkey"** (top-right).
3. Fill the form:

| Field | What to enter |
|---|---|
| **Name** | Alphanumeric only, NO spaces/symbols. We used `otptest2026` |
| **Select Rule** | The full-access / messaging+OTP rule (Admin/All if shown) |
| **Where are you Integrating? / Add Usecases** | Add **OTP** (or skip if optional) |
| **IP Security** | ⚠️ ON by default — see note below |

> **Name rule:** must be alphanumeric, no spaces or special characters
> (e.g. `Otp@test` is rejected → use `otptest2026`).

### ⚠️ IP Security note
- IP Security is **ON by default** and demands at least one whitelisted IP.
- **Easiest for testing:** turn IP Security **OFF** → key works from anywhere (localhost/ngrok).
- **If it can't be turned off:** whitelist your **public IPv4** (find at https://whatismyipaddress.com).
  Downside: if your network/IP changes, you must update it. (So OFF is simpler while testing.)
- The "Company's Whitelisted IPs" section is optional — ignore it.

4. **Create** → the key appears in the table.
5. **Copy the Authkey** value (copy icon next to the masked key) → store in `.env` as `MSG91_AUTHKEY`.

**Created key:** name `otptest2026`, Rules = **Admin**, Status = **ON**, **IP Security = OFF** ✅
(IP Security OFF = works from any IP, ideal for testing. IP Count 0.)

---

## Step 3 — Create OTP Template ⬜ TODO
(Coming next: create an OTP template in the OTP app, copy its **Template ID**.)

---

## Step 4 — Test the first OTP ⬜ TODO
(Coming next: send a test OTP to your own email/number, then verify it.)

---

## Values we will need for the code (fill as we get them)

```
MSG91_AUTHKEY=            # from Step 2
MSG91_EMAIL_TEMPLATE_ID=  # from Step 3 (email)
MSG91_SMS_TEMPLATE_ID=    # later (needs DLT)
MSG91_WHATSAPP_...=       # later (WhatsApp sandbox/production)
```

---

## Cost / regulatory checkpoints (for the lead)
- Account + Auth Key: **free**
- Email OTP testing: **free trial credits**
- SMS: needs **KYC + Add Funds + DLT** (company docs) — paid + TRAI-regulated
- WhatsApp: needs business verification for production — paid per conversation

*(This file is updated at each step as we progress.)*

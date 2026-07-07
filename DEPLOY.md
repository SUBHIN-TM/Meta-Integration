# Deploy & Update on Contabo VPS — Simple Guide (no ngrok)

How to run this project on the **Contabo VPS** at the real domain
**`whatsapptest.teaminterval.net`**.

> **What replaces ngrok?**
> On your laptop, ngrok gave `localhost:3005` a public HTTPS address so Meta
> could reach it. On the server we don't need ngrok — the VPS already has a
> public IP + a real domain. We only add **Nginx** (front door) + **Certbot**
> (free HTTPS padlock) + **PM2** (keeps Node running 24/7).
>
> Flow:  Meta → `https://whatsapptest.teaminterval.net` → **Nginx (443)** → **Node (3005)**

---

# PART A — First-time deploy

## Step 0 — Point the domain at the VPS (DNS)  ⬜ do this first

In the DNS panel for `teaminterval.net`, add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `whatsapptest` | `<your Contabo VPS IP>` |

Wait a few minutes, then check it resolves (from your laptop):

```bash
ping whatsapptest.teaminterval.net      # should show the VPS IP
```

Do the rest **after** DNS points to the server (Certbot needs it to issue HTTPS).

---

## Step 1 — Log into the VPS

```bash
ssh root@<your Contabo VPS IP>
```

---

## Step 2 — Install what we need (one time)

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# git, nginx, certbot, and pm2 (process manager)
sudo apt install -y git nginx
sudo apt install -y certbot python3-certbot-nginx
sudo npm install -g pm2

# quick checks
node -v && npm -v && nginx -v
```

---

## Step 3 — Get the code (git clone)

```bash
sudo mkdir -p /var/www           # a normal place for web apps
cd /var/www
sudo git clone <your-repo-url> whatsapp
cd whatsapp
sudo npm install --omit=dev
```

---

## Step 4 — Create the `.env` on the server

The `.env` is **not** in git (it has secrets). Create it by hand:

```bash
sudo nano .env
```

Paste (use the real token/values):

```
PORT=3005
VERIFY_TOKEN=connect_student_portal_verify
WHATSAPP_ACCESS_TOKEN=<your Meta access token>
PHONE_NUMBER_ID=1165465923317096
MSG91_AUTHKEY=<your MSG91 authkey>
```

Save: `Ctrl+O`, `Enter`, then `Ctrl+X`.

---

## Step 5 — Start the app with PM2

```bash
pm2 start server.js --name whatsapp
pm2 save                 # remember this app across reboots
pm2 startup              # run the command it prints, so PM2 auto-starts on boot
```

Check it's alive locally:

```bash
curl http://localhost:3005/health      # -> "Server running successfully.."
```

---

## Step 6 — Nginx: send the domain to the app

```bash
sudo nano /etc/nginx/sites-available/whatsapp
```

Paste:

```nginx
server {
    listen 80;
    server_name whatsapptest.teaminterval.net;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp /etc/nginx/sites-enabled/
sudo nginx -t            # test config — must say "syntax is ok"
sudo systemctl reload nginx
```

Now `http://whatsapptest.teaminterval.net/health` should work (plain HTTP).

---

## Step 7 — Add HTTPS (Certbot — free, auto-renews)

```bash
sudo certbot --nginx -d whatsapptest.teaminterval.net
```

- Enter an email, agree to terms.
- Choose **redirect** (force HTTPS) when asked.

Certbot edits the Nginx config for you and installs the certificate. Test:

```
https://whatsapptest.teaminterval.net/health
```

Renewal is automatic. (Test any time: `sudo certbot renew --dry-run`.)

---

## Step 8 — Point Meta at the new URL (replaces the old ngrok URL)

In **Meta App Dashboard → WhatsApp → Configuration → Webhook**:

| Field | Value |
|---|---|
| **Callback URL** | `https://whatsapptest.teaminterval.net/webhook` |
| **Verify token** | `connect_student_portal_verify` |
| **Subscribe to** | the `messages` field |

Click **Verify and Save**. This URL is **permanent** now — unlike ngrok, it
never changes on restart, so you set it once.

Open the dashboard:  **https://whatsapptest.teaminterval.net/meta-notifications**

---

# PART B — Updating the app (after code changes)

Whenever new code is pushed to git, update the server like this:

```bash
cd /var/www/whatsapp
git pull                     # get the latest code
npm install --omit=dev       # in case new packages were added
pm2 restart whatsapp         # restart with the new code
```

That's the whole update. Verify:

```bash
curl http://localhost:3005/health
pm2 logs whatsapp            # watch for errors
```

> If you changed only `.env` (not code), you still need `pm2 restart whatsapp`
> — env values are read once at startup.

---

## Handy PM2 commands

```bash
pm2 status                 # is it running?
pm2 logs whatsapp          # live logs
pm2 restart whatsapp       # restart
pm2 stop whatsapp          # stop
pm2 start whatsapp         # start again
```

---

## Firewall (if traffic is blocked)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `502 Bad Gateway` | Node isn't running → `pm2 status`, `pm2 logs whatsapp`. Check `PORT=3005` in `.env`. |
| Certbot fails | DNS not pointing to the VPS yet, or port 80 blocked. Fix DNS (Step 0), open the firewall, retry. |
| Meta webhook won't verify | Callback URL must be `https://...` and end in `/webhook`; verify token must match `VERIFY_TOKEN` in `.env`. |
| `git pull` "permission denied" | You cloned with `sudo`, so pull with `sudo git pull` (or run once: `sudo chown -R $USER /var/www/whatsapp`). |
| Changed `.env` but nothing changed | `pm2 restart whatsapp`. |

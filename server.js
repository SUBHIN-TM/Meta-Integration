require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

/*
|--------------------------------------------------------------------------
| IN-MEMORY EVENT LOG (for the browser dashboard at /meta-notifications)
|--------------------------------------------------------------------------
| Every webhook Meta sends to /webhook is decoded and pushed here so we can
| show it in a UI. Kept in memory only (resets when the server restarts).
*/

const events = []; // newest pushed to the front
const MAX_EVENTS = 200;

const STATUS_MEANING = {
  sent: "Your auto-reply left the server — Meta accepted it (single tick).",
  delivered: "Your auto-reply reached the user's phone (double grey tick).",
  read: "The user opened/read your auto-reply (blue tick).",
  failed: "Your auto-reply FAILED to send — check the error.",
  deleted: "The message was deleted.",
};

function pushEvent(evt) {
  events.unshift({ ...evt, at: new Date().toISOString() });
  if (events.length > MAX_EVENTS) events.pop();
}

// Decode a raw webhook body into one or more friendly event rows
function recordWebhook(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  if (!value) return;

  const name = value?.contacts?.[0]?.profile?.name || "";

  if (Array.isArray(value.messages)) {
    for (const m of value.messages) {
      pushEvent({
        kind: "incoming",
        direction: "in", // USER -> SERVER
        dirLabel: "USER → SERVER",
        title: "📥 User sent a message",
        who: `${name || "User"}  ·  ${m.from}`,
        phone: m.from, // used by the UI to reply to this person
        name: name || "",
        detail: m.type === "text" ? m.text?.body : `[${m.type} message]`,
        id: m.id,
      });
    }
  }

  if (Array.isArray(value.statuses)) {
    for (const s of value.statuses) {
      pushEvent({
        kind: `status-${s.status}`,
        direction: "out", // SERVER -> USER (status of YOUR auto-reply)
        dirLabel: "SERVER → USER",
        title: `📤 Your auto-reply — ${String(s.status).toUpperCase()}`,
        who: `to  ${s.recipient_id}`,
        detail: STATUS_MEANING[s.status] || "Unknown status",
        billable: s.pricing ? `${s.pricing.billable} (${s.pricing.category})` : "",
        error: s.errors ? JSON.stringify(s.errors) : "",
        id: s.id,
      });
    }
  }
}

/*
|--------------------------------------------------------------------------
| WEBHOOK VERIFICATION
|--------------------------------------------------------------------------
*/

app.get("/health", (req, res) => {
  console.log("HEALTH CHECK");
  res.send("Server running successfully..");
});

app.get("/webhook", (req, res) => {
  console.log("WebHook Get For VERIFICATION");
  console.log("QUERY:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("Verification failed");
  return res.sendStatus(403);
});

/*
|--------------------------------------------------------------------------
| RECEIVE WHATSAPP MESSAGE
|--------------------------------------------------------------------------
*/

app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming webhook:", JSON.stringify(req.body, null, 2));

    // Capture this webhook for the browser dashboard at /meta-notifications
    recordWebhook(req.body);

    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const text = message?.text?.body || "Message received";

    console.log("FROM:", from);
    console.log("TEXT:", text);

    await replyMessage(
      from,
      `We received your message: "${text}"

Thank you for contacting us.
Our team will get back to you soon.`,
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error(error?.response?.data || error);
    return res.sendStatus(500);
  }
});

/*
|--------------------------------------------------------------------------
| META NOTIFICATIONS DASHBOARD (browser UI)
|--------------------------------------------------------------------------
| Open in a browser:  http://localhost:3005/meta-notifications
| It auto-refreshes and shows every webhook /webhook received, decoded:
| who, what kind (incoming / sent / delivered / read), and the meaning.
*/

// JSON feed the page polls every 2s
app.get("/meta-notifications/data", (req, res) => {
  res.json(events);
});

// Clear all captured events (used by the "Clear" button)
app.post("/meta-notifications/clear", (req, res) => {
  events.length = 0;
  console.log("🧹 Dashboard events cleared");
  res.json({ ok: true });
});

// The HTML dashboard
app.get("/meta-notifications", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Meta WhatsApp — Live Webhook Log</title>
  <style>
    :root{color-scheme:dark}
    body{font-family:system-ui,Segoe UI,Roboto,sans-serif;margin:0;background:#0b141a;color:#e9edef}
    header{padding:16px 20px;background:#111b21;border-bottom:1px solid #222d34;position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:12px;z-index:10}
    header h1{margin:0;font-size:18px}
    header p{margin:4px 0 0;font-size:13px;color:#8696a0}
    .clearBtn{font:inherit;font-weight:600;background:#3a2530;color:#f7a3b0;border:1px solid #5a2a38;border-radius:8px;padding:9px 16px;cursor:pointer;white-space:nowrap}
    .clearBtn:hover{background:#4a2a38}
    .wrap{max-width:820px;margin:0 auto;padding:16px 20px}
    .legend{display:flex;gap:18px;flex-wrap:wrap;font-size:13px;color:#8696a0;padding:10px 0 4px}
    .legend b{color:#e9edef}
    .legend .in{color:#00a884}.legend .out{color:#53bdeb}
    .row{border:1px solid #222d34;border-radius:12px;padding:12px 14px;margin:12px 0;background:#182229;max-width:82%;position:relative}
    .row.in{border-left:4px solid #00a884;margin-right:auto}
    .row.out{border-right:4px solid #53bdeb;margin-left:auto;background:#12242e}
    .dir{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.6px;padding:2px 8px;border-radius:20px;margin-bottom:6px}
    .row.in .dir{background:#0b3b30;color:#25d366}
    .row.out .dir{background:#0c2f3d;color:#53bdeb}
    .top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
    .badge{font-size:14px;font-weight:700}
    .who{font-size:13px;color:#8696a0;margin-top:4px}
    .detail{margin-top:6px;font-size:15px;line-height:1.35}
    .time{font-size:12px;color:#667781;white-space:nowrap}
    .meta{font-size:12px;color:#667781;margin-top:6px;word-break:break-all}
    .status-read .badge{color:#a855f7}
    .status-failed{border-right-color:#f15c6d!important}.status-failed .badge{color:#f15c6d}
    .manual-out{border-right:4px solid #25d366!important}.manual-out .badge{color:#25d366}
    .row.in{cursor:pointer;transition:background .12s}
    .row.in:hover{background:#20303a}
    .reply-hint{font-size:11px;color:#00a884;margin-top:8px;font-weight:600}
    .empty{color:#667781;text-align:center;padding:40px}
    /* modal */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:50}
    .overlay.show{display:flex}
    .modal{background:#1a262e;border:1px solid #2a3942;border-radius:14px;width:min(440px,92vw);padding:20px}
    .modal h3{margin:0 0 4px;font-size:16px}
    .modal .to{font-size:13px;color:#8696a0;margin-bottom:12px}
    .modal textarea{width:100%;box-sizing:border-box;min-height:90px;background:#0b141a;color:#e9edef;border:1px solid #2a3942;border-radius:10px;padding:10px;font:inherit;resize:vertical}
    .modal .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px}
    .modal button{font:inherit;font-weight:600;border:0;border-radius:8px;padding:9px 16px;cursor:pointer}
    .modal .cancel{background:#2a3942;color:#e9edef}
    .modal .send{background:#00a884;color:#04130d}
    .modal .send:disabled{opacity:.5;cursor:default}
    .modal .msg{font-size:13px;margin-top:10px;min-height:16px}
    .modal .msg.ok{color:#25d366}.modal .msg.err{color:#f15c6d}
  </style>
</head>
<body>
  <header>
    <div>
      <h1>📡 Meta WhatsApp — Live Webhook Log</h1>
      <p>Auto-refreshing every 2s · newest on top · resets when server restarts</p>
    </div>
    <button class="clearBtn" onclick="clearAll()">🧹 Clear</button>
  </header>
  <div class="wrap">
    <div class="legend">
      <span><b>How to read:</b></span>
      <span class="in">◀ LEFT = 📥 USER → your server (they messaged you)</span>
      <span class="out">RIGHT ▶ = 📤 your server → USER (status of the auto-reply)</span>
    </div>
    <div id="list"><div class="empty">Waiting for webhooks… send a WhatsApp message to your number.</div></div>
  </div>

  <!-- Reply popup -->
  <div class="overlay" id="overlay">
    <div class="modal">
      <h3>Send a message</h3>
      <div class="to" id="modalTo"></div>
      <textarea id="modalText" placeholder="Type your message…"></textarea>
      <div class="msg" id="modalMsg"></div>
      <div class="actions">
        <button class="cancel" onclick="closeReply()">Cancel</button>
        <button class="send" id="sendBtn" onclick="sendReply()">Send</button>
      </div>
    </div>
  </div>

  <script>
    function esc(s){return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}
    let replyTo = null;

    async function clearAll(){
      if(!confirm('Clear all notifications from the dashboard?')) return;
      try{ await fetch('/meta-notifications/clear',{method:'POST'}); load(); }
      catch(err){/* ignore */}
    }

    function openReply(phone, name){
      replyTo = phone;
      document.getElementById('modalTo').textContent = '👤 To: ' + (name ? name + '  ·  ' : '') + phone;
      document.getElementById('modalText').value = '';
      const msg = document.getElementById('modalMsg'); msg.textContent=''; msg.className='msg';
      document.getElementById('overlay').classList.add('show');
      document.getElementById('modalText').focus();
    }
    function closeReply(){ document.getElementById('overlay').classList.remove('show'); replyTo=null; }
    document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') closeReply(); });

    async function sendReply(){
      const text = document.getElementById('modalText').value.trim();
      const msg = document.getElementById('modalMsg');
      if(!text){ msg.className='msg err'; msg.textContent='Type a message first.'; return; }
      const btn = document.getElementById('sendBtn'); btn.disabled=true;
      msg.className='msg'; msg.textContent='Sending…';
      try{
        const r = await fetch('/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:replyTo,text})});
        const d = await r.json();
        if(d.ok){ msg.className='msg ok'; msg.textContent='✅ Sent!'; load(); setTimeout(closeReply, 700); }
        else { msg.className='msg err'; msg.textContent='❌ '+ (d.error||'Failed'); }
      }catch(err){ msg.className='msg err'; msg.textContent='❌ '+err; }
      finally{ btn.disabled=false; }
    }

    async function load(){
      try{
        const r = await fetch('/meta-notifications/data'); const data = await r.json();
        const el = document.getElementById('list');
        if(!data.length){el.innerHTML='<div class="empty">Waiting for webhooks… send a WhatsApp message to your number.</div>';return}
        el.innerHTML = data.map(e=>\`
          <div class="row \${esc(e.direction)} \${esc(e.kind)}" \${e.direction==='in'?\`onclick="openReply('\${esc(e.phone)}','\${esc(e.name||'')}')"\`:''}>
            <span class="dir">\${esc(e.dirLabel||'')}</span>
            <div class="top">
              <span class="badge">\${esc(e.title)}</span>
              <span class="time">\${esc(new Date(e.at).toLocaleTimeString())}</span>
            </div>
            <div class="who">👤 \${esc(e.who)}</div>
            <div class="detail">\${esc(e.detail)}</div>
            \${e.billable?'<div class="meta">💰 billable: '+esc(e.billable)+'</div>':''}
            \${e.error?'<div class="meta">⚠️ '+esc(e.error)+'</div>':''}
            \${e.id?'<div class="meta">🆔 '+esc(e.id)+'</div>':''}
            \${e.direction==='in'?'<div class="reply-hint">💬 Click to reply to this user</div>':''}
          </div>\`).join('');
      }catch(err){/* keep last view on transient error */}
    }
    load(); setInterval(load, 2000);
  </script>
</body>
</html>`);
});

app.post("/send-message", async (req, res) => {
  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;

    const text = message?.text?.body || "Message received";

    console.log("FROM:", from, "TEXT: ", text);

    await sendWhatsappMessage(from, `You said: ${text}`);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error?.response?.data || error);
    return res.sendStatus(500);
  }
});

/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
*/

async function sendWhatsappMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`;

    const result = await axios.post(
      url,

      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Message sent successfully ✅");
    // console.log("Response :",result?.data);
  } catch (error) {
    console.error("Send Error:", error?.response?.data || error);
  }
}

async function replyMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`;

    const result = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        text: {
          body: text,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Reply sent successfully ✅");

    // console.log(result.data);
  } catch (error) {
    console.error("Reply Error:", error?.response?.data || error);
  }
}

/*
|--------------------------------------------------------------------------
| MANUAL SEND (used by the dashboard "reply" popup)
|--------------------------------------------------------------------------
| Sends free text and THROWS on failure so the UI can show Meta's error
| (e.g. outside the 24h window). Returns Meta's response data on success.
*/
async function sendTextMessage(to, text) {
  const url = `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`;
  const result = await axios.post(
    url,
    { messaging_product: "whatsapp", to, text: { body: text } },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );
  return result.data;
}

// The dashboard popup POSTs { to, text } here
app.post("/send", async (req, res) => {
  const { to, text } = req.body || {};
  if (!to || !text) {
    return res.status(400).json({ ok: false, error: "Both 'to' and 'text' are required." });
  }
  try {
    const data = await sendTextMessage(to, text);
    const wamid = data?.messages?.[0]?.id;
    // Show it immediately in the dashboard as an outgoing bubble
    pushEvent({
      kind: "manual-out",
      direction: "out",
      dirLabel: "SERVER → USER",
      title: "📤 You sent (manual)",
      who: `to  ${to}`,
      detail: text,
      id: wamid,
    });
    return res.json({ ok: true, id: wamid });
  } catch (error) {
    const err = error?.response?.data?.error?.message || error?.response?.data || String(error);
    console.error("Manual send error:", err);
    return res.status(500).json({ ok: false, error: err });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

/*
|==============================================================================
| eventStore.service.js  —  THE "MEMORY" FOR THE DASHBOARD
|==============================================================================
| WHAT THIS FILE IS:
|   A small in-memory list that remembers every webhook Meta sent us, decoded
|   into a friendly, readable shape. The dashboard reads from this list.
|
| WHY IT EXISTS:
|   Meta's raw webhooks are messy JSON. This file turns each one into a clean
|   row (who, direction, what happened, meaning) so the UI is easy to read.
|
| IMPORTANT:
|   This is IN MEMORY only. Restarting the server clears everything. (For
|   production we would swap this for a database — see PRODUCTION.md.)
|==============================================================================
*/

const events = []; // newest item is always at the front (index 0)
const MAX_EVENTS = 200; // keep the list from growing forever

// Plain-language meaning for each delivery status Meta reports about OUR replies
const STATUS_MEANING = {
  sent: "Your auto-reply left the server — Meta accepted it (single tick).",
  delivered: "Your auto-reply reached the user's phone (double grey tick).",
  read: "The user opened/read your auto-reply (blue tick).",
  failed: "Your auto-reply FAILED to send — check the error.",
  deleted: "The message was deleted.",
};

// Add one decoded row to the front of the list (and stamp the time)
function pushEvent(evt) {
  events.unshift({ ...evt, at: new Date().toISOString() });
  if (events.length > MAX_EVENTS) events.pop();
}

// Give the dashboard the whole list
function getEvents() {
  return events;
}

// Empty the list (used by the "Clear" button)
function clearEvents() {
  events.length = 0;
  console.log("🧹 Dashboard events cleared");
}

/*
| recordWebhook()
|   Takes Meta's raw webhook body and turns it into friendly rows.
|   A single webhook can contain either:
|     - messages[]  -> the USER sent us something  (direction "in")
|     - statuses[]  -> status of a reply WE sent   (direction "out")
|
|   "source" tags which number the event came from ("test" or "interval") so
|   the dashboard can tell the two numbers apart. It's optional and defaults to
|   "" so any old caller keeps working.
*/
function recordWebhook(body, source = "") {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  if (!value) return;

  const name = value?.contacts?.[0]?.profile?.name || "";

  // CASE A: the user sent us a message  (USER -> SERVER)
  if (Array.isArray(value.messages)) {
    for (const m of value.messages) {
      pushEvent({
        kind: "incoming",
        direction: "in",
        dirLabel: "USER → SERVER",
        title: "📥 User sent a message",
        who: `${name || "User"}  ·  ${m.from}`,
        phone: m.from, // the dashboard uses this to reply to the user
        name: name || "",
        detail: m.type === "text" ? m.text?.body : `[${m.type} message]`,
        id: m.id,
        source,
      });
    }
  }

  // CASE B: status update about a reply WE sent  (SERVER -> USER)
  if (Array.isArray(value.statuses)) {
    for (const s of value.statuses) {
      pushEvent({
        kind: `status-${s.status}`,
        direction: "out",
        dirLabel: "SERVER → USER",
        title: `📤 Your auto-reply — ${String(s.status).toUpperCase()}`,
        who: `to  ${s.recipient_id}`,
        detail: STATUS_MEANING[s.status] || "Unknown status",
        billable: s.pricing ? `${s.pricing.billable} (${s.pricing.category})` : "",
        error: s.errors ? JSON.stringify(s.errors) : "",
        id: s.id,
        source,
      });
    }
  }
}

module.exports = {
  pushEvent,
  getEvents,
  clearEvents,
  recordWebhook,
};

require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

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


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

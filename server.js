require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const store = require("./lib/store");
const { handleIncomingMessage } = require("./lib/orderFlow");

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

store.init();

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified.");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const messages = value?.messages;
    if (!messages || messages.length === 0) return;

    const contact = value.contacts?.[0];

    for (const message of messages) {
      await handleIncomingMessage(message, contact);
    }
  } catch (err) {
    console.error("Error handling webhook payload:", err);
  }
});

app.get("/orders", (req, res) => {
  res.json(store.getOrders());
});

app.get("/customers", (req, res) => {
  res.json(store.getAllCustomers());
});

app.get("/", (req, res) => {
  res.send("WhatsApp F&B ordering bot is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

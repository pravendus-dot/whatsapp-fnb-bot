const GRAPH_API_BASE = process.env.GRAPH_API_BASE || "https://graph.facebook.com/v20.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

async function callGraphAPI(payload) {
  const url = `${GRAPH_API_BASE}/${PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("WhatsApp API error:", JSON.stringify(data));
  }
  return data;
}

function sendText(to, body) {
  return callGraphAPI({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

function sendMenuList(to, businessName, items, currency) {
  return callGraphAPI({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: businessName },
      body: { text: "Tap to see today's menu and pick an item." },
      footer: { text: "Reply CART to review your order anytime." },
      action: {
        button: "View Menu",
        sections: [
          {
            title: "Menu",
            rows: items.map((item) => ({
              id: `item_${item.id}`,
              title: item.name.slice(0, 24),
              description: `${currency}${item.price} - ${item.description}`.slice(0, 72),
            })),
          },
        ],
      },
    },
  });
}

function sendButtons(to, bodyText, buttons) {
  return callGraphAPI({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title.slice(0, 20) },
        })),
      },
    },
  });
}

function sendTemplate(to, templateName, languageCode, components) {
  return callGraphAPI({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode || "en" },
      components: components || [],
    },
  });
}

module.exports = { sendText, sendMenuList, sendButtons, sendTemplate };

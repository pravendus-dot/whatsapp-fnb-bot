require("dotenv").config();
const store = require("../lib/store");
const whatsapp = require("../lib/whatsapp");
const menu = require("../data/menu.json");

const LAPSED_AFTER_DAYS = 7;
const TEMPLATE_NAME = "reengagement_nudge";
const TEMPLATE_LANG = "en";

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

async function run() {
  store.init();
  const customers = store.getAllCustomers();
  const lapsed = Object.values(customers).filter(
    (c) => c.totalOrders > 0 && daysSince(c.lastOrderAt) >= LAPSED_AFTER_DAYS
  );

  console.log(`Found ${lapsed.length} lapsed customer(s) to nudge.`);

  for (const customer of lapsed) {
    try {
      await whatsapp.sendTemplate(customer.phone, TEMPLATE_NAME, TEMPLATE_LANG, [
        {
          type: "body",
          parameters: [
            { type: "text", text: customer.name || "there" },
            { type: "text", text: menu.businessName },
          ],
        },
      ]);
      console.log(`Nudged ${customer.phone}`);
    } catch (err) {
      console.error(`Failed to nudge ${customer.phone}:`, err.message);
    }
  }
}

run();

const store = require("./store");
const whatsapp = require("./whatsapp");
const menu = require("../data/menu.json");

const CURRENCY = menu.currency;

function findItem(id) {
  return menu.items.find((i) => i.id === id);
}

function cartTotal(cart) {
  return cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

function formatCart(cart) {
  if (cart.length === 0) return "Your cart is empty.";
  const lines = cart.map(
    (line) => `${line.qty} x ${line.name} - ${CURRENCY}${line.price * line.qty}`
  );
  return `${lines.join("\n")}\n\nTotal: ${CURRENCY}${cartTotal(cart)}`;
}

async function handleIncomingMessage(message, contact) {
  const phone = message.from;
  const name = contact?.profile?.name || null;

  store.upsertCustomer(phone, { name: name || undefined });

  let session = store.getSession(phone) || { state: "NEW", cart: [] };

  if (message.type === "interactive") {
    const interactive = message.interactive;

    if (interactive.type === "list_reply") {
      const itemId = interactive.list_reply.id.replace("item_", "");
      const item = findItem(itemId);
      if (item) {
        session.cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
        store.setSession(phone, session);
        await whatsapp.sendButtons(
          phone,
          `Added ${item.name} (${CURRENCY}${item.price}) to your cart.\n\n${formatCart(session.cart)}`,
          [
            { id: "add_more", title: "Add more" },
            { id: "checkout", title: "Checkout" },
          ]
        );
      }
      return;
    }

    if (interactive.type === "button_reply") {
      const buttonId = interactive.button_reply.id;

      if (buttonId === "add_more") {
        await whatsapp.sendMenuList(phone, menu.businessName, menu.items, CURRENCY);
        return;
      }

      if (buttonId === "checkout") {
        if (session.cart.length === 0) {
          await whatsapp.sendText(phone, "Your cart is empty. Reply MENU to start an order.");
          return;
        }
        session.state = "CONFIRMING";
        store.setSession(phone, session);
        await whatsapp.sendButtons(
          phone,
          `Please confirm your order:\n\n${formatCart(session.cart)}\n\nConfirm to place this order.`,
          [
            { id: "confirm_order", title: "Confirm" },
            { id: "cancel_order", title: "Cancel" },
          ]
        );
        return;
      }

      if (buttonId === "confirm_order") {
        const order = {
          id: `ORD-${Date.now()}`,
          phone,
          name: store.getCustomer(phone)?.name || null,
          items: session.cart,
          total: cartTotal(session.cart),
          createdAt: new Date().toISOString(),
          status: "confirmed",
        };
        store.addOrder(order);

        const customer = store.getCustomer(phone);
        store.upsertCustomer(phone, {
          lastOrderAt: order.createdAt,
          totalOrders: (customer.totalOrders || 0) + 1,
        });

        store.clearSession(phone);

        await whatsapp.sendText(
          phone,
          `Order confirmed! ✅\n\nOrder ${order.id}\n${formatCart(order.items)}\n\nWe'll message you when it's ready. Thank you!`
        );
        return;
      }

      if (buttonId === "cancel_order") {
        store.clearSession(phone);
        await whatsapp.sendText(phone, "Order cancelled. Reply MENU anytime to start again.");
        return;
      }
    }
    return;
  }

  if (message.type === "text") {
    const text = message.text.body.trim().toLowerCase();

    if (["hi", "hello", "hey", "menu", "start"].includes(text)) {
      session = { state: "MENU_SHOWN", cart: session.cart || [] };
      store.setSession(phone, session);
      await whatsapp.sendText(phone, `Welcome to ${menu.businessName}! 👋`);
      await whatsapp.sendMenuList(phone, menu.businessName, menu.items, CURRENCY);
      return;
    }

    if (text === "cart") {
      await whatsapp.sendText(phone, formatCart(session.cart || []));
      return;
    }

    await whatsapp.sendText(
      phone,
      "I didn't quite get that. Reply MENU to see today's menu, or CART to review your order."
    );
    return;
  }
}

module.exports = { handleIncomingMessage };

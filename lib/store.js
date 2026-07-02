const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const FILES = {
  customers: path.join(DATA_DIR, "customers.json"),
  orders: path.join(DATA_DIR, "orders.json"),
  sessions: path.join(DATA_DIR, "sessions.json"),
};

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  ensureFile(FILES.customers, {});
  ensureFile(FILES.orders, []);
  ensureFile(FILES.sessions, {});
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getCustomer(phone) {
  const customers = readJSON(FILES.customers);
  return customers[phone] || null;
}

function upsertCustomer(phone, updates) {
  const customers = readJSON(FILES.customers);
  const existing = customers[phone] || {
    phone,
    name: null,
    firstSeen: new Date().toISOString(),
    lastOrderAt: null,
    totalOrders: 0,
  };
  customers[phone] = { ...existing, ...updates };
  writeJSON(FILES.customers, customers);
  return customers[phone];
}

function getAllCustomers() {
  return readJSON(FILES.customers);
}

function addOrder(order) {
  const orders = readJSON(FILES.orders);
  orders.push(order);
  writeJSON(FILES.orders, orders);
  return order;
}

function getOrders() {
  return readJSON(FILES.orders);
}

function getSession(phone) {
  const sessions = readJSON(FILES.sessions);
  return sessions[phone] || null;
}

function setSession(phone, session) {
  const sessions = readJSON(FILES.sessions);
  sessions[phone] = session;
  writeJSON(FILES.sessions, sessions);
}

function clearSession(phone) {
  const sessions = readJSON(FILES.sessions);
  delete sessions[phone];
  writeJSON(FILES.sessions, sessions);
}

module.exports = {
  init,
  getCustomer,
  upsertCustomer,
  getAllCustomers,
  addOrder,
  getOrders,
  getSession,
  setSession,
  clearSession,
};

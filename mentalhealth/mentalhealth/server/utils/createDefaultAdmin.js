const bcrypt = require("bcrypt");

const DEFAULT_ADMIN_EMAIL = "mindbridge.local@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "#bodima#";
const SALT_ROUNDS = 10;

async function createDefaultAdmin(db) {
  const existing = await db.collection("users").findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existing) {
    if (existing.role !== "admin") {
      await db.collection("users").updateOne(
        { _id: existing._id },
        { $set: { role: "admin", updatedAt: new Date() } }
      );
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
  await db.collection("users").insertOne({
    email: DEFAULT_ADMIN_EMAIL,
    name: "MindBridge System Admin",
    password: hashedPassword,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

module.exports = { createDefaultAdmin };

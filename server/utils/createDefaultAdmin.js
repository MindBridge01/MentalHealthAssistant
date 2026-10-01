const bcrypt = require("bcrypt");
const { findUserByEmail, createUser, updateUser } = require("../models/userModel");
const { createObjectId } = require("../lib/objectId");

const DEFAULT_ADMIN_EMAIL = "mindbridge.local@gmail.com";
const DEFAULT_ADMIN_PASSWORD = "#bodima#";
const SALT_ROUNDS = 10;

async function createDefaultAdmin() {
  const existing = await findUserByEmail(DEFAULT_ADMIN_EMAIL);
  if (existing) {
    if (existing.role !== "admin") {
      await updateUser(existing._id, { role: "admin", updatedAt: new Date() });
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
  await createUser({
    _id: createObjectId(),
    email: DEFAULT_ADMIN_EMAIL,
    name: "MindBridge System Admin",
    password: hashedPassword,
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

module.exports = { createDefaultAdmin };

// createAdmin.js
const bcrypt = require("bcrypt");
const { findUserByEmail, createUser } = require("./models/userModel");
const { createObjectId } = require("./lib/objectId");

const SALT_ROUNDS = 10;
const ADMIN_EMAIL = "lakshikahiruni20@gmail.com";

async function createAdmin() {
  if (!process.env.ADMIN_PASSWORD) {
    console.log("Please set ADMIN_PASSWORD in your .env file");
    process.exit(1);
  }

  try {
    const existing = await findUserByEmail(ADMIN_EMAIL);
    if (existing) {
      console.log("Admin already exists with ID:", existing._id);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, SALT_ROUNDS);
    const user = await createUser({
      _id: createObjectId(),
      email: ADMIN_EMAIL,
      name: "Admin",
      password: hashedPassword,
      profilePic: null,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Admin created with ID:", user._id);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }

  process.exit(0);
}

createAdmin();

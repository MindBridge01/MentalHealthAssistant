// createAdmin.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config(); // if you store DB URI in .env

const SALT_ROUNDS = 10;

// Replace with your MongoDB URI in .env like:
// MONGODB_URI = mongodb+srv://<username>:<password>@cluster0.mongodb.net/Mind_Bridge?retryWrites=true&w=majority
const uri = process.env.MONGODB_URI;

async function createAdmin() {
  if (!uri) {
    console.log("Please set MONGODB_URI in your .env file");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(); // default DB from URI

    // Hash your admin password
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, SALT_ROUNDS);

    // Insert admin user
    const result = await db.collection('users').insertOne({
      email: "lakshikahiruni20@gmail.com",
      name: "Admin",
      password: hashedPassword,
      profilePic: null,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Admin created with ID:", result.insertedId);

  } catch (err) {
    console.error("Failed to create admin:", err);
  } finally {
    await client.close();
    process.exit();
  }
}

createAdmin();
import { getMongoClient } from "./lib/mongodb";
import { requireAuth } from "./lib/requireAuth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { encryptClassifiedFields } = require("../server/services/encryptionService");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length <= 1) {
    return res.status(200).json({ success: false, message: "No conversation to save" });
  }

  try {
    // Connect to MongoDB
    const client = await getMongoClient();
    const db = client.db("Messages"); // Database name from your connection string
    const collection = db.collection("conversations"); // Collection name

    const conversationId = Date.now();
    const protectedConversation = encryptClassifiedFields({ messages });
    const conversation = {
      id: conversationId,
      userId: user._id,
      ...protectedConversation,
      createdAt: new Date()
    };

    // Insert the conversation into MongoDB
    await collection.insertOne(conversation);

    res.status(200).json({ success: true, conversationId });
  } catch (error) {
    console.error("[api/save-conversation] request failed");
    res.status(500).json({ success: false, message: "Failed to save conversation" });
  }
}

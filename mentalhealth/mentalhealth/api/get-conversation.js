import { getMongoClient } from "./lib/mongodb";
import { requireAuth } from "./lib/requireAuth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { decryptClassifiedFields } = require("../server/services/encryptionService");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    // Connect to MongoDB
    const client = await getMongoClient();
    const db = client.db("Messages");
    const collection = db.collection("conversations");

    // Retrieve all conversations, sorted by creation date (newest first)
    const conversations = await collection
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    const decryptedConversations = conversations.map((conversation) =>
      decryptClassifiedFields(conversation)
    );

    res.status(200).json(decryptedConversations);
  } catch (error) {
    console.error("[api/get-conversation] request failed");
    res.status(500).json({ message: "Failed to retrieve conversations" });
  }
}

import { getMongoClient } from "../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ content: "Method not allowed" });
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
    const conversation = { id: conversationId, messages, createdAt: new Date() };

    // Insert the conversation into MongoDB
    await collection.insertOne(conversation);

    res.status(200).json({ success: true, conversationId });
  } catch (error) {
    console.error("Error saving conversation to MongoDB:", error);
    res.status(500).json({ success: false, message: "Failed to save conversation" });
  }
}
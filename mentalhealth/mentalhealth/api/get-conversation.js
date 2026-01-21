import { getMongoClient } from "../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  try {
    // Connect to MongoDB
    const client = await getMongoClient();
    const db = client.db("Messages");
    const collection = db.collection("conversations");

    // Retrieve all conversations, sorted by creation date (newest first)
    const conversations = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(conversations);
  } catch (error) {
    console.error("Error retrieving conversations from MongoDB:", error);
    res.status(500).json({ message: "Failed to retrieve conversations" });
  }
}
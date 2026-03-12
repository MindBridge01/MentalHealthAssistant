import { ensurePostgres } from "./lib/postgres";
import { requireAuth } from "./lib/requireAuth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { decryptClassifiedFields } = require("../server/services/encryptionService");
const { findConversationsByUserId } = require("../server/models/messageModel");
const { logAuditEventSafely } = require("../server/services/auditLogService");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    await ensurePostgres();
    const conversations = await findConversationsByUserId(user._id);

    const decryptedConversations = conversations.map((conversation) =>
      decryptClassifiedFields(conversation)
    );

    await logAuditEventSafely({
      userId: user._id,
      role: user.role,
      action: "view_chat_history",
      resourceType: "chat_conversation",
      resourceId: user._id,
      ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
      metadata: {
        route: req.url,
        method: req.method,
        conversationCount: decryptedConversations.length,
      },
    });

    res.status(200).json(decryptedConversations);
  } catch (error) {
    console.error("[api/get-conversation] request failed");
    res.status(500).json({ message: "Failed to retrieve conversations" });
  }
}

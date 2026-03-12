import { ensurePostgres } from "./lib/postgres";
import { requireAuth } from "./lib/requireAuth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { encryptClassifiedFields } = require("../server/services/encryptionService");
const { saveConversation } = require("../server/models/messageModel");
const { logAuditEventSafely } = require("../server/services/auditLogService");

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
    await ensurePostgres();
    const conversationId = Date.now();
    const protectedConversation = encryptClassifiedFields({ messages });
    await saveConversation({
      id: conversationId,
      userId: user._id,
      messages: protectedConversation.messages,
      createdAt: new Date()
    });

    await logAuditEventSafely({
      userId: user._id,
      role: user.role,
      action: "save_chat_history",
      resourceType: "chat_conversation",
      resourceId: String(conversationId),
      ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
      metadata: {
        route: req.url,
        method: req.method,
        conversationMessageCount: messages.length,
      },
    });

    res.status(200).json({ success: true, conversationId });
  } catch (error) {
    console.error("[api/save-conversation] request failed");
    res.status(500).json({ success: false, message: "Failed to save conversation" });
  }
}

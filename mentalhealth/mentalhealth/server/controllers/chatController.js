const { moderateModelResponse } = require("../services/responseModerationService");
const { logSafetyEvent } = require("../services/safetyEventLogger");
const { encryptClassifiedFields } = require("../services/encryptionService");
const { generateAiResponse } = require("../services/aiService");
const { retrieveKnowledgeContext } = require("../services/knowledgeRetrievalService");
const { saveConversation } = require("../models/messageModel");

async function chatController(req, res, next) {
  const message = req.piiSafeMessage || "";
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const sanitizedMessages = rawMessages
    .filter((entry) => entry && typeof entry.content === "string")
    .map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: entry.role === "user" ? (entry.content === req.body?.message ? message : entry.content) : entry.content,
    }));

  try {
    const { contextText, matches } = await retrieveKnowledgeContext(message);
    const responseText = await generateAiResponse({
      userMessage: message,
      knowledgeContext: contextText,
      messages: sanitizedMessages,
    });

    const moderated = moderateModelResponse(responseText);

    if (moderated.moderated) {
      logSafetyEvent({
        eventType: "response_moderated",
        userRole: req.user?.role,
        metadata: { severity: "medium", reason: moderated.reason },
      });
    }

    await req.logAuditEvent?.({
      action: "rag_chat_query",
      resourceType: "knowledge_chunks",
      metadata: {
        retrievedChunkCount: matches.length,
        sources: matches.map((item) => item.document_key),
        topSimilarity: matches[0]?.similarity || null,
      },
    });

    return res.json({
      content: moderated.content,
      sources: matches.map((item) => ({
        title: item.title,
        documentKey: item.document_key,
        similarity: item.similarity,
      })),
    });
  } catch (error) {
    return next(error);
  }
}

async function saveConversationController(req, res, next) {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length <= 1) {
    return res.status(200).json({ success: false, message: "No conversation to save" });
  }

  try {
    const encryptedConversation = encryptClassifiedFields({ messages });
    const conversation = {
      id: Date.now(),
      userId: req.user._id,
      messages: encryptedConversation.messages,
      createdAt: new Date(),
    };

    await saveConversation(conversation);
    await req.logAuditEvent?.({
      action: "save_chat_history",
      resourceType: "chat_conversation",
      resourceId: String(conversation.id),
      metadata: {
        conversationMessageCount: messages.length,
        userId: req.user?._id,
      },
    });
    return res.status(200).json({ success: true, conversationId: conversation.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  chatController,
  saveConversationController,
};

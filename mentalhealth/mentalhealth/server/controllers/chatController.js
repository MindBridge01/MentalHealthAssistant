const { logSafetyEvent } = require("../services/safetyEventLogger");
const { encryptClassifiedFields } = require("../services/encryptionService");
const { saveConversation } = require("../models/messageModel");
const { runChatPipeline } = require("../services/chatPipelineService");

async function chatController(req, res, next) {
  const message = req.body?.message || "";
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

  try {
    const pipelineResult = await runChatPipeline({
      message,
      rawMessages,
    });
    const moderated = pipelineResult.blocked
      ? {
          moderated: false,
          reason: null,
          content: pipelineResult.responseText,
        }
      : pipelineResult.moderation;

    if (moderated.moderated) {
      logSafetyEvent({
        eventType: "response_moderated",
        userRole: req.user?.role,
        metadata: { severity: "medium", reason: moderated.reason },
      });
    }

    if (pipelineResult.blocked) {
      logSafetyEvent({
        eventType: "blocked_prompt",
        userRole: req.user?.role,
        metadata: { severity: "medium", reason: pipelineResult.safety?.reason },
      });
    }

    await req.logAuditEvent?.({
      action: "rag_chat_query",
      resourceType: "knowledge_chunks",
      metadata: {
        retrievedChunkCount: pipelineResult.knowledgeMatches.length,
        sources: pipelineResult.knowledgeMatches.map((item) => item.document_key),
        topSimilarity: pipelineResult.knowledgeMatches[0]?.similarity || null,
        sanitizedHistoryCount: pipelineResult.sanitizedHistory.length,
        blocked: pipelineResult.blocked,
      },
    });

    return res.json({
      content: moderated.content,
      sources: pipelineResult.knowledgeMatches.map((item) => ({
        title: item.title,
        documentKey: item.document_key,
        similarity: item.similarity,
      })),
      ...(pipelineResult.safety ? { safety: pipelineResult.safety } : {}),
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

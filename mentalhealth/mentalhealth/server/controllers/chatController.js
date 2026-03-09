const { moderateModelResponse } = require("../services/responseModerationService");
const { logSafetyEvent } = require("../services/safetyEventLogger");
const { encryptClassifiedFields } = require("../services/encryptionService");
const { generateAiResponse } = require("../services/aiService");

async function chatController(req, res, next) {
  const message = req.piiSafeMessage || "";

  try {
    const responseText = await generateAiResponse(message);
    const moderated = moderateModelResponse(responseText);
    if (moderated.moderated) {
      logSafetyEvent({
        eventType: "response_moderated",
        userRole: req.user?.role,
        metadata: { severity: "medium", reason: moderated.reason },
      });
    }

    return res.json({ content: moderated.content });
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
    const mongoClient = req.app.locals.mongoClient;
    if (!mongoClient) {
      return res.status(500).json({ error: "Database not connected" });
    }

    const messagesDb = mongoClient.db("Messages");
    const collection = messagesDb.collection("conversations");
    const encryptedConversation = encryptClassifiedFields({ messages });
    const conversation = {
      id: Date.now(),
      userId: req.user._id,
      ...encryptedConversation,
      createdAt: new Date(),
    };

    await collection.insertOne(conversation);
    return res.status(200).json({ success: true, conversationId: conversation.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  chatController,
  saveConversationController,
};

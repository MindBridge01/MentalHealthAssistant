const { moderateModelResponse } = require("./responseModerationService");
const { generateAiResponse } = require("./aiService");
const { retrieveKnowledgeContext } = require("./knowledgeRetrievalService");
const { evaluatePromptGuardrails } = require("./promptGuardrailService");
const { getBlockedDiagnosisResponse } = require("./safeResponseService");
const {
  sanitizeConversationHistory,
  sanitizeUserMessage,
} = require("./messageSanitizerService");

function buildBlockedResponse(reason) {
  return {
    blocked: true,
    moderation: { moderated: false, reason: null },
    responseText: getBlockedDiagnosisResponse(),
    knowledgeMatches: [],
    safety: { event: "blocked_prompt", reason },
    sanitizedHistory: [],
  };
}

async function runChatPipeline({ message, rawMessages = [] }) {
  const sanitizedMessage = sanitizeUserMessage(message);
  const sanitizedHistory = sanitizeConversationHistory(rawMessages, sanitizedMessage);

  const currentMessageEvaluation = evaluatePromptGuardrails(sanitizedMessage, {
    context: "current_message",
  });

  if (currentMessageEvaluation.blocked) {
    return buildBlockedResponse(currentMessageEvaluation.reason);
  }

  const safeHistory = sanitizedHistory.filter((entry) => {
    const historyEvaluation = evaluatePromptGuardrails(entry.content, {
      context: "conversation_history",
    });
    return !historyEvaluation.blocked;
  });

  const { contextText, matches } = await retrieveKnowledgeContext(sanitizedMessage);
  const responseText = await generateAiResponse({
    userMessage: sanitizedMessage,
    knowledgeContext: contextText,
    messages: safeHistory,
  });

  return {
    blocked: false,
    moderation: moderateModelResponse(responseText),
    responseText,
    knowledgeMatches: matches,
    safety: null,
    sanitizedHistory: safeHistory,
  };
}

module.exports = {
  runChatPipeline,
};

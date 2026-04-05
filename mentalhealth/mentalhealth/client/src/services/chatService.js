import { apiRequest } from "./apiClient";

export function sendChatMessage(message, messages = []) {
  return apiRequest("/api/chat", {
    method: "POST",
    body: { message, messages },
  });
}

export function sendPublicChatMessage(message, messages = []) {
  return apiRequest("/api/public-chat", {
    method: "POST",
    body: { message, messages },
  });
}

export function saveConversation(messages) {
  return apiRequest("/api/save-conversation", {
    method: "POST",
    body: { messages },
  });
}

import { apiRequest } from "./apiClient";

export function sendChatMessage(message) {
  return apiRequest("/api/chat", {
    method: "POST",
    body: { message },
  });
}

export function saveConversation(messages) {
  return apiRequest("/api/save-conversation", {
    method: "POST",
    body: { messages },
  });
}

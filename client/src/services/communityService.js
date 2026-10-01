import { apiRequest } from "./apiClient";

export function getCommunityPosts() {
  return apiRequest("/api/patient/community/posts");
}

export function getCommunityPost(postId) {
  return apiRequest(`/api/patient/community/posts/${postId}`);
}

export function createCommunityPost(payload) {
  return apiRequest("/api/patient/community/posts", {
    method: "POST",
    body: payload,
  });
}

export function addComment(postId, content) {
  return apiRequest(`/api/patient/community/posts/${postId}/comments`, {
    method: "POST",
    body: { content },
  });
}

export function togglePostLike(postId) {
  return apiRequest(`/api/patient/community/posts/${postId}/like`, {
    method: "POST",
  });
}

export function togglePostSave(postId) {
  return apiRequest(`/api/patient/community/posts/${postId}/save`, {
    method: "POST",
  });
}

const { query } = require("../config/database");
const { normalizeId, serializeJson } = require("./_shared");

function mapConversation(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.external_id,
    userId: row.user_id,
    messages: row.messages,
    createdAt: row.created_at,
  };
}

async function saveConversation({ id, userId, messages, createdAt }) {
  const result = await query(
    `INSERT INTO chat_conversations (external_id, user_id, messages, created_at)
     VALUES ($1,$2,$3,$4)
     RETURNING id, external_id, user_id, messages, created_at`,
    [String(id), normalizeId(userId), serializeJson(messages), createdAt || new Date()]
  );
  return mapConversation(result.rows[0]);
}

async function findConversationsByUserId(userId) {
  const result = await query(
    `SELECT id, external_id, user_id, messages, created_at
     FROM chat_conversations
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [normalizeId(userId)]
  );
  return result.rows.map(mapConversation);
}

module.exports = {
  saveConversation,
  findConversationsByUserId,
};

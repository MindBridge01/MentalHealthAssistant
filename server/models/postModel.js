const { query } = require("../config/database");
const { normalizeId } = require("./_shared");

function mapPost(row) {
  if (!row) return null;
  return {
    _id: row.id,
    caption: row.caption,
    name: row.name,
    location: row.location,
    image: row.image,
    likes: row.likes,
    comments: row.comments,
    saved: row.saved,
    createdAt: row.created_at,
  };
}

async function listPosts() {
  const result = await query("SELECT * FROM posts WHERE moderation_status = 'approved' ORDER BY created_at DESC");
  return result.rows.map(mapPost);
}

async function incrementPostMetric(id, action) {
  const column =
    action === "like" ? "likes" : action === "comment" ? "comments" : "saved";
  const result = await query(
    `UPDATE posts SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
    [normalizeId(id)]
  );
  return mapPost(result.rows[0]);
}

module.exports = {
  listPosts,
  incrementPostMetric,
};

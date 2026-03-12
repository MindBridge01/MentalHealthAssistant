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
  const result = await query("SELECT * FROM posts ORDER BY created_at DESC");
  return result.rows.map(mapPost);
}

async function createPost(post) {
  const result = await query(
    `INSERT INTO posts (id, caption, name, location, image, likes, comments, saved, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      normalizeId(post._id),
      post.caption,
      post.name || null,
      post.location || null,
      post.image || null,
      post.likes || 0,
      post.comments || 0,
      post.saved || 0,
      post.createdAt || new Date(),
    ]
  );
  return mapPost(result.rows[0]);
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
  createPost,
  incrementPostMetric,
};

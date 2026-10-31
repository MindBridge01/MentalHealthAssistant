const { query, withTransaction } = require("../config/database");
const { normalizeId } = require("./_shared");

function mapComment(row) {
  if (!row) return null;
  return {
    _id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapCommunityPost(row, extras = {}) {
  if (!row) return null;
  return {
    _id: row.id,
    caption: row.caption,
    name: row.name,
    location: row.location,
    image: row.image,
    likes: Number(row.likes_count || row.likes || 0),
    commentsCount: Number(row.comments_count || row.comments || 0),
    savedCount: Number(row.saved_count || row.saved || 0),
    createdAt: row.created_at,
    moderationStatus: row.moderation_status,
    viewerHasLiked: Boolean(row.viewer_has_liked),
    viewerHasSaved: Boolean(row.viewer_has_saved),
    comments: extras.comments || [],
  };
}

async function listCommunityPosts(userId) {
  const normalizedUserId = normalizeId(userId);
  const postsResult = await query(
    `SELECT
      p.*,
      COALESCE(like_counts.total, 0) AS likes_count,
      COALESCE(save_counts.total, 0) AS saved_count,
      COALESCE(comment_counts.total, 0) AS comments_count,
      EXISTS(
        SELECT 1 FROM post_engagements pe
        WHERE pe.post_id = p.id AND pe.user_id = $1 AND pe.reaction_type = 'like'
      ) AS viewer_has_liked,
      EXISTS(
        SELECT 1 FROM post_engagements pe
        WHERE pe.post_id = p.id AND pe.user_id = $1 AND pe.reaction_type = 'save'
      ) AS viewer_has_saved
    FROM posts p
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS total FROM post_engagements WHERE reaction_type = 'like' GROUP BY post_id
    ) like_counts ON like_counts.post_id = p.id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS total FROM post_engagements WHERE reaction_type = 'save' GROUP BY post_id
    ) save_counts ON save_counts.post_id = p.id
    LEFT JOIN (
      SELECT post_id, COUNT(*) AS total FROM post_comments GROUP BY post_id
    ) comment_counts ON comment_counts.post_id = p.id
    WHERE p.moderation_status = 'approved'
    ORDER BY p.created_at DESC`
    ,
    [normalizedUserId]
  );

  const postIds = postsResult.rows.map((row) => row.id);
  if (postIds.length === 0) return [];

  const commentsResult = await query(
    `SELECT * FROM post_comments WHERE post_id = ANY($1::text[]) ORDER BY created_at ASC`,
    [postIds]
  );

  const commentsByPost = new Map();
  for (const row of commentsResult.rows) {
    const comment = mapComment(row);
    const entries = commentsByPost.get(row.post_id) || [];
    entries.push(comment);
    commentsByPost.set(row.post_id, entries);
  }

  return postsResult.rows.map((row) =>
    mapCommunityPost(row, { comments: commentsByPost.get(row.id) || [] })
  );
}

async function findCommunityPostById(postId, userId) {
  const posts = await listCommunityPosts(userId);
  return posts.find((post) => String(post._id) === String(postId)) || null;
}

async function createCommunityPost(post) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO posts
        (id, caption, name, location, image, likes, comments, saved, created_at, moderation_status, submitted_by)
       VALUES ($1,$2,$3,$4,$5,0,0,0,$6,'pending',$7)
       RETURNING *`,
      [
        normalizeId(post._id),
        post.caption,
        post.name || null,
        post.location || null,
        post.image || null,
        post.createdAt || new Date(),
        normalizeId(post.submittedBy),
      ]
    );

    await client.query(
      `INSERT INTO community_post_email_jobs (post_id) VALUES ($1)`,
      [result.rows[0].id]
    );

    return mapCommunityPost(result.rows[0], { comments: [] });
  });
}

async function listPendingCommunityPosts() {
  const result = await query(
    `SELECT p.id, p.caption, p.name, p.location, p.image, p.created_at,
      u.id AS submitter_id, u.name AS submitter_name, u.email AS submitter_email
     FROM posts p
     LEFT JOIN users u ON u.id = p.submitted_by
     WHERE p.moderation_status = 'pending'
     ORDER BY p.created_at ASC`
  );
  return result.rows.map((row) => ({
    _id: row.id,
    caption: row.caption,
    name: row.name,
    location: row.location,
    image: row.image,
    createdAt: row.created_at,
    submitter: row.submitter_id
      ? { _id: row.submitter_id, name: row.submitter_name, email: row.submitter_email }
      : null,
  }));
}

async function reviewCommunityPost(postId, adminId, decision) {
  const result = await query(
    `UPDATE posts
     SET moderation_status = $2, reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $1 AND moderation_status = 'pending'
     RETURNING id, moderation_status, reviewed_at`,
    [normalizeId(postId), decision, normalizeId(adminId)]
  );
  const row = result.rows[0];
  return row
    ? { _id: row.id, moderationStatus: row.moderation_status, reviewedAt: row.reviewed_at }
    : null;
}

async function togglePostEngagement({ postId, userId, reactionType }) {
  const normalizedPostId = normalizeId(postId);
  const normalizedUserId = normalizeId(userId);

  const existing = await query(
    `SELECT 1 FROM post_engagements WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3 LIMIT 1`,
    [normalizedPostId, normalizedUserId, reactionType]
  );

  if (existing.rows[0]) {
    await query(
      `DELETE FROM post_engagements WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3`,
      [normalizedPostId, normalizedUserId, reactionType]
    );
    return { active: false };
  }

  await query(
    `INSERT INTO post_engagements (post_id, user_id, reaction_type, created_at) VALUES ($1,$2,$3,$4)`,
    [normalizedPostId, normalizedUserId, reactionType, new Date()]
  );
  return { active: true };
}

async function addPostComment(comment) {
  const result = await query(
    `INSERT INTO post_comments (id, post_id, user_id, author_name, content, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      normalizeId(comment._id),
      normalizeId(comment.postId),
      normalizeId(comment.userId),
      comment.authorName,
      comment.content,
      comment.createdAt || new Date(),
    ]
  );

  return mapComment(result.rows[0]);
}

module.exports = {
  listCommunityPosts,
  findCommunityPostById,
  createCommunityPost,
  listPendingCommunityPosts,
  reviewCommunityPost,
  togglePostEngagement,
  addPostComment,
};

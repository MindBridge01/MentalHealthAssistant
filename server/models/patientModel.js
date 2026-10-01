const { query } = require("../config/database");
const { normalizeId, serializeJson } = require("./_shared");

function mapAssessment(row) {
  if (!row) return null;
  return {
    _id: row.id,
    userId: row.user_id,
    responses: row.responses || [],
    score: row.score,
    classification: row.classification,
    recommendation: row.recommendation,
    createdAt: row.created_at,
  };
}

async function createAssessmentSession(assessment) {
  const result = await query(
    `INSERT INTO assessment_sessions (id, user_id, responses, score, classification, recommendation, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      normalizeId(assessment._id),
      normalizeId(assessment.userId),
      serializeJson(assessment.responses || []),
      assessment.score,
      assessment.classification,
      assessment.recommendation,
      assessment.createdAt || new Date(),
    ]
  );

  return mapAssessment(result.rows[0]);
}

async function findLatestAssessmentByUserId(userId) {
  const result = await query(
    `SELECT * FROM assessment_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [normalizeId(userId)]
  );
  return mapAssessment(result.rows[0]);
}

async function findAssessmentById(id, userId) {
  const result = await query(
    `SELECT * FROM assessment_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [normalizeId(id), normalizeId(userId)]
  );
  return mapAssessment(result.rows[0]);
}

module.exports = {
  createAssessmentSession,
  findLatestAssessmentByUserId,
  findAssessmentById,
};

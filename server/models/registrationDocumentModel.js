const { query, withTransaction } = require('../config/database');
const { encryptValue, decryptValue } = require('../services/encryptionService');

function describe(row) {
  return { id: row.id, ...decryptValue(row.metadata), mediaType: row.media_type, size: row.size_bytes, createdAt: row.created_at };
}
async function listDocuments(userId) {
  const result = await query('SELECT id, metadata, media_type, size_bytes, created_at FROM registration_documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows.map(describe);
}
async function addDocument(userId, file, mediaType) {
  return withTransaction(async (client) => {
    // Serialize per-owner uploads so simultaneous requests cannot exceed the quota.
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const count = await client.query('SELECT COUNT(*)::int AS total FROM registration_documents WHERE user_id = $1', [userId]);
    if (count.rows[0].total >= 3) throw Object.assign(new Error('You can keep up to three reports. Remove one before adding another.'), { status: 409 });
    // eslint-disable-next-line no-control-regex -- Sanitize control bytes from uploaded filenames.
    const filename = String(file.originalname || 'report').replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0, 160);
    const result = await client.query(`INSERT INTO registration_documents(user_id,metadata,content,media_type,size_bytes)
      VALUES ($1,$2,$3,$4,$5) RETURNING id,metadata,media_type,size_bytes,created_at`,
    [userId, JSON.stringify(encryptValue({ filename })), JSON.stringify(encryptValue({ base64: file.buffer.toString('base64') })), mediaType, file.buffer.length]);
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id)
      VALUES ($1,'patient','upload_registration_report','registration_document',$2)`, [userId, result.rows[0].id]);
    return describe(result.rows[0]);
  });
}
async function readDocument(userId, id) {
  return withTransaction(async (client) => {
    const result = await client.query('SELECT * FROM registration_documents WHERE id = $1 AND user_id = $2', [id, userId]);
    const row = result.rows[0];
    if (!row) return null;
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id)
      VALUES ($1,'patient','download_registration_report','registration_document',$2)`, [userId, id]);
    return { ...describe(row), buffer: Buffer.from(decryptValue(row.content).base64, 'base64') };
  });
}
async function removeDocument(userId, id) {
  return withTransaction(async (client) => {
    const result = await client.query('DELETE FROM registration_documents WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (!result.rows.length) return false;
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id)
      VALUES ($1,'patient','remove_registration_report','registration_document',$2)`, [userId, id]);
    return true;
  });
}
module.exports = { listDocuments, addDocument, readDocument, removeDocument };

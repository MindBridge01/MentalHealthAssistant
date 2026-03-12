const { query } = require("../config/database");
const { normalizeId } = require("./_shared");

function mapUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    email: row.email,
    name: row.name,
    password: row.password,
    googleId: row.google_id,
    facebookId: row.facebook_id,
    profilePic: row.profile_pic,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findUserByEmail(email) {
  const result = await query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  return mapUser(result.rows[0]);
}

async function findUserByEmailOrFacebookId({ email, facebookId }) {
  const result = await query(
    `SELECT * FROM users
     WHERE facebook_id = $1 OR email = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [facebookId, email]
  );
  return mapUser(result.rows[0]);
}

async function findUserById(userId) {
  const result = await query("SELECT * FROM users WHERE id = $1 LIMIT 1", [normalizeId(userId)]);
  return mapUser(result.rows[0]);
}

async function createUser(user) {
  const result = await query(
    `INSERT INTO users (
      id, email, name, password, google_id, facebook_id, profile_pic, role, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      normalizeId(user._id),
      user.email,
      user.name,
      user.password || null,
      user.googleId || null,
      user.facebookId || null,
      user.profilePic || null,
      user.role,
      user.createdAt || new Date(),
      user.updatedAt || new Date(),
    ]
  );
  return mapUser(result.rows[0]);
}

async function updateUser(userId, updates) {
  const fields = [];
  const values = [];
  let index = 1;

  const columnMap = {
    email: "email",
    name: "name",
    password: "password",
    googleId: "google_id",
    facebookId: "facebook_id",
    profilePic: "profile_pic",
    role: "role",
    updatedAt: "updated_at",
  };

  for (const [key, column] of Object.entries(columnMap)) {
    if (updates[key] === undefined) continue;
    fields.push(`${column} = $${index++}`);
    values.push(updates[key]);
  }

  if (fields.length === 0) {
    return findUserById(userId);
  }

  values.push(normalizeId(userId));
  const result = await query(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`,
    values
  );
  return mapUser(result.rows[0]);
}

async function listPendingDoctors() {
  const result = await query(
    "SELECT * FROM users WHERE role = 'pending-doctor' ORDER BY created_at DESC"
  );
  return result.rows.map(mapUser);
}

async function approveDoctor(doctorId) {
  return updateUser(doctorId, { role: "doctor", updatedAt: new Date() });
}

async function deleteUser(doctorId) {
  const result = await query("DELETE FROM users WHERE id = $1 RETURNING id", [normalizeId(doctorId)]);
  return result.rowCount > 0;
}

async function listUsers() {
  const result = await query(
    `SELECT id, email, name, google_id, facebook_id, profile_pic, role, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );
  return result.rows.map((row) => mapUser({ ...row, password: undefined }));
}

module.exports = {
  mapUser,
  findUserByEmail,
  findUserByEmailOrFacebookId,
  findUserById,
  createUser,
  updateUser,
  listPendingDoctors,
  approveDoctor,
  deleteUser,
  listUsers,
};

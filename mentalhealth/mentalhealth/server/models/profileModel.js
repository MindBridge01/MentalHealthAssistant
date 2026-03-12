const { query } = require("../config/database");
const { normalizeId, serializeJson } = require("./_shared");

function mapProfile(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    birthday: row.birthday,
    age: row.age,
    gender: row.gender,
    phone: row.phone,
    address: row.address,
    zipcode: row.zipcode,
    country: row.country,
    city: row.city,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,
    guardianEmail: row.guardian_email,
    illnesses: row.illnesses,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findProfileByUserId(userId) {
  const result = await query("SELECT * FROM profiles WHERE user_id = $1 LIMIT 1", [
    normalizeId(userId),
  ]);
  return mapProfile(result.rows[0]);
}

async function upsertProfile(userId, profile) {
  const now = profile.updatedAt || new Date();
  const createdAt = profile.createdAt || now;
  const result = await query(
    `INSERT INTO profiles (
      user_id, birthday, age, gender, phone, address, zipcode, country, city,
      guardian_name, guardian_phone, guardian_email, illnesses, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT (user_id) DO UPDATE SET
      birthday = EXCLUDED.birthday,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      phone = EXCLUDED.phone,
      address = EXCLUDED.address,
      zipcode = EXCLUDED.zipcode,
      country = EXCLUDED.country,
      city = EXCLUDED.city,
      guardian_name = EXCLUDED.guardian_name,
      guardian_phone = EXCLUDED.guardian_phone,
      guardian_email = EXCLUDED.guardian_email,
      illnesses = EXCLUDED.illnesses,
      updated_at = EXCLUDED.updated_at
    RETURNING *`,
    [
      normalizeId(userId),
      serializeJson(profile.birthday),
      serializeJson(profile.age),
      serializeJson(profile.gender),
      serializeJson(profile.phone),
      serializeJson(profile.address),
      profile.zipcode || null,
      profile.country || null,
      profile.city || null,
      serializeJson(profile.guardianName),
      serializeJson(profile.guardianPhone),
      serializeJson(profile.guardianEmail),
      serializeJson(profile.illnesses),
      createdAt,
      now,
    ]
  );
  return mapProfile(result.rows[0]);
}

module.exports = {
  findProfileByUserId,
  upsertProfile,
};

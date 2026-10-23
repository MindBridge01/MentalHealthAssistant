const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const MIGRATIONS = [
  { id: '001_base_schema', file: 'init_schema.sql', legacyTables: ['users', 'profiles', 'doctors', 'doctor_slots',
    'appointments', 'doctor_messages', 'chat_conversations', 'audit_logs', 'posts', 'assessment_sessions',
    'post_comments', 'post_engagements', 'knowledge_chunks'] },
  { id: '002_patient_registration', file: 'patient_registration.sql', legacyTables: ['patient_registrations', 'patient_registration_events'] },
  { id: '003_patient_registry', file: '003_patient_registry.sql', backfill: true },
  { id: '004_registration_completion', file: '004_registration_completion.sql' },
  { id: '005_professional_registration', file: '005_professional_registration.sql' },
  { id: '006_hospital_booking', file: '006_hospital_booking.sql' },
];

async function runMigrations(client, backfillRegistry) {
  // The caller owns a single transaction; locking and the ledger commit together with the changes.
  await client.query('SELECT pg_advisory_xact_lock(48290173)');
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY, checksum TEXT NOT NULL, adopted_existing BOOLEAN NOT NULL DEFAULT FALSE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const applied = [];
  for (const migration of MIGRATIONS) {
    const sql = await fs.readFile(path.join(__dirname, migration.file), 'utf8');
    // Backfill implementation is also part of the immutable migration checksum.
    const backfillSource = migration.backfill ? await fs.readFile(path.join(__dirname, 'registryBackfill.js'), 'utf8') : '';
    // Git may check out CRLF on Windows and LF in deployment; both represent the same migration.
    const checksum = createHash('sha256').update((sql + backfillSource).replace(/\r\n/g, '\n')).digest('hex');
    const existing = await client.query('SELECT checksum FROM schema_migrations WHERE id = $1', [migration.id]);
    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${migration.id}. Add a new migration instead.`);
      continue;
    }
    let adopted = false;
    if (migration.legacyTables) {
      const tables = await client.query(`SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1::text[])`, [migration.legacyTables]);
      if (tables.rows.length && tables.rows.length !== migration.legacyTables.length) {
        throw new Error(`Incomplete existing schema for ${migration.id}; reconcile missing tables before migrating.`);
      }
      adopted = tables.rows.length === migration.legacyTables.length;
    }
    // Do not replay legacy DROP COLUMN or grandfathering statements on an existing installation.
    if (!adopted) await client.query(sql);
    if (migration.backfill) await backfillRegistry(client);
    await client.query('INSERT INTO schema_migrations(id, checksum, adopted_existing) VALUES ($1,$2,$3)',
      [migration.id, checksum, adopted]);
    applied.push({ id: migration.id, adopted });
  }
  return applied;
}
module.exports = { runMigrations };

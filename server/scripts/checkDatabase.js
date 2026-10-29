// Read-only diagnostic. Run explicitly from the operator's configured terminal.
const { databaseDiagnostic } = require('../services/databaseDiagnostic');
async function main() {
  let database;
  try {
    database = require('../config/database');
    await database.query('SELECT 1');
    console.log('[database-check] Connection successful.');
    const required = { users: ['id', 'email', 'name', 'password', 'role'], audit_logs: ['user_id', 'user_role', 'action', 'resource_type', 'resource_id'] };
    for (const [table, columns] of Object.entries(required)) {
      const result = await database.query("SELECT a.attname FROM pg_attribute a WHERE a.attrelid=to_regclass($1) AND a.attnum>0 AND NOT a.attisdropped", [table]);
      const present = new Set(result.rows.map(row => row.attname));
      const missing = columns.filter(column => !present.has(column));
      if (missing.length) {
        console.error(`[database-check] Missing required columns/table: ${table} (${missing.join(', ')}). Verify the database, then run npm --prefix server run migrate:postgres.`);
        process.exitCode = 1;
        return;
      }
    }
    console.log('[database-check] Required administrator setup tables and columns are available.');
    const admins = await database.query("SELECT EXISTS(SELECT 1 FROM users WHERE role='admin') AS present");
    console.log(admins.rows[0].present ? '[database-check] An administrator already exists. First-admin setup will refuse to create another.' : '[database-check] No administrator exists. First-admin setup can be attempted.');
  } catch (error) {
    console.error(`[database-check] ${databaseDiagnostic(error)}`);
    process.exitCode = 1;
  } finally {
    if (database) await database.closePool();
  }
}
main();

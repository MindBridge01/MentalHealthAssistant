// Explicit operator command only; never called during server startup.
const { bootstrapAdmin } = require('../services/adminBootstrap');
async function main() {
  const input={email:process.env.ADMIN_BOOTSTRAP_EMAIL,password:process.env.ADMIN_BOOTSTRAP_PASSWORD};
  delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if(!input.email || !input.password) throw new Error('Set temporary ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD process variables before running this command.');
  const database=require('../config/database');
  try {
    await bootstrapAdmin(database,require('bcrypt').hash,input);
    console.log('First administrator created. Sign in with the credentials you supplied.');
  } finally { input.password=''; await database.closePool(); }
}
main().catch(error=>{
  const knownMessages = [
    'Set temporary ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD process variables before running this command.',
    'Provide a valid email and a unique password of at least 15 characters (maximum 72 UTF-8 bytes).',
    'An administrator already exists. First-admin setup is disabled.',
    'This email already belongs to an account. Setup will not promote it automatically.'
  ];
  console.error(knownMessages.includes(error.message) ? error.message : require('../services/databaseDiagnostic').databaseDiagnostic(error));
  process.exitCode=1;
});

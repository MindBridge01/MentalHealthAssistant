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
  console.error(error.code ? 'Administrator setup failed. Check database availability and migrations.' : error.message);
  process.exitCode=1;
});

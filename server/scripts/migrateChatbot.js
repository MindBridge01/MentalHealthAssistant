// Explicit operator action only: never run migrations during ordinary startup.
require('../config/environment').loadEnvironment();
const fs=require('node:fs/promises');
const path=require('node:path');
const database=require('../config/database');
(async()=>{
  try {
    const sql=await fs.readFile(path.resolve(__dirname,'../../chatbot/db/001_initial.sql'),'utf8');
    await database.query(sql);
    console.log('[chatbot] Chatbot schema installed in the configured website database. Existing chat history was not changed.');
  } catch(error) {console.error('[chatbot] Migration failed. '+require('../services/databaseDiagnostic').databaseDiagnostic(error));process.exitCode=1;}
  finally {await database.closePool();}
})();

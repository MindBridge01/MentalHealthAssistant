const {loadEnvironment}=require('../config/environment');
loadEnvironment();
const {startEmailWorker}=require('../services/emailWorkerRuntime');
let database;
try {
  database=require('../config/database');
  const worker=startEmailWorker({database,check:process.argv.includes('--check'),once:process.argv.includes('--once')});
  const stop=()=>worker.stop();
  process.once('SIGINT',stop);
  process.once('SIGTERM',stop);
  worker.done.then(ok=>{if(!ok)process.exitCode=1;}).catch(()=>{console.error('[email-worker] Worker failed.');process.exitCode=1;}).finally(()=>database.closePool());
} catch {
  console.error('[email-worker] Check database configuration.');
  process.exitCode=1;
}

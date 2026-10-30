const {databaseDiagnostic}=require('./databaseDiagnostic');
function transient(error) {
 const code=error?.code||error?.cause?.code;
 if(code)return ['ECONNRESET','ECONNREFUSED','ETIMEDOUT','EAI_AGAIN','57P03','53300'].includes(code);
 return /connection terminated|connection timeout/i.test(error?.message||'');
}
async function connectWithRetry(testConnection,{attempts=4,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=console.warn}={}) {
 for(let attempt=1;attempt<=attempts;attempt++){
  try {await testConnection();return;}
  catch(error){
   if(!transient(error)||attempt===attempts)throw error;
   const delay=attempt*2000;
   log('[database] '+databaseDiagnostic(error)+' Retrying in '+delay/1000+' seconds ('+attempt+'/'+attempts+').');
   await wait(delay);
  }
 }
}
module.exports={connectWithRetry};

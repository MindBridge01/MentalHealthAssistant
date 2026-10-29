const {validateEmailConfiguration, safeWorkerError} = require('./emailWorkerDiagnostics');

// One serial polling loop per backend process. Database leases coordinate instances.
function startEmailWorker({database, env=process.env, logger=console, check=false, once=false,
  createTransport, processQueue, retryMs=30000, idleMs=5000} = {}) {
  let stopping=false, wake, transport;
  const pause=ms=>new Promise(resolve=>{const timer=setTimeout(resolve,ms);wake=()=>{clearTimeout(timer);resolve();};});
  const done=(async()=>{
    const error=validateEmailConfiguration(env);
    if(error){logger.error(`[email-worker] ${error}`);return false;}
    const config={appOrigin:env.APP_PUBLIC_URL,adminEmail:env.REGISTRATION_ADMIN_EMAIL,from:env.MAIL_FROM};
    while(!stopping){
      let stage='Database connection';
      try {
        for(const table of ['registration_email_jobs','care_email_jobs','staff_invitation_email_jobs']) await database.query(`SELECT id FROM ${table} LIMIT 0`);
        if(stopping) break;
        const factory=createTransport||require('nodemailer').createTransport;
        transport=factory({host:env.SMTP_HOST,port:Number(env.SMTP_PORT||587),secure:env.SMTP_SECURE==='true',requireTLS:env.SMTP_SECURE!=='true',auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASSWORD}:undefined,connectionTimeout:15000,greetingTimeout:15000,socketTimeout:30000});
        stage='SMTP connection';
        await transport.verify();
        logger.log('[email-worker] SMTP verified. No test email was sent.');
        if(check) return true;
        stage='Queue processing';
        logger.log('[email-worker] Running automatically; idle polling every five seconds.');
        while(!stopping){
          const delivered=await (processQueue||processEmailQueue)({database,transport,config});
          if(once) return true;
          if(!delivered&&!stopping) await pause(idleMs);
        }
      } catch(error){
        logger.error(`[email-worker] ${safeWorkerError(error,stage)}`);
        if(check||once) return false;
        logger.log('[email-worker] Retrying in 30 seconds; queued emails remain in the database.');
      } finally {transport?.close();transport=undefined;}
      if(!stopping) await pause(retryMs);
    }
    return true;
  })();
  return {done, async stop(){stopping=true;wake?.();await done;}};
}
async function processEmailQueue({database,transport,config}) {
  await require('./careService').createCareService(database).maintenance();
  const registration=await require('./registrationEmailDelivery').deliverNext({database,transport,config});
  const care=await require('./careEmailDelivery').deliverCareNext({database,transport,config});
  const invitation=await require('./invitationService').deliverStaffInvitationNext({database,transport,config});
  return registration||care||invitation;
}
module.exports={startEmailWorker};

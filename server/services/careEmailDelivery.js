const {randomUUID}=require('node:crypto');
const {emailLayout,logoAttachments}=require('./emailLayout');
function renderCareEmail(j,origin){
 const url=new URL(origin);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('Invalid origin');
 const title={pending:'Appointment request received',confirmed:'Appointment confirmed',proposed:'Alternative appointment time proposed',declined:'Appointment request declined',cancelled:'Appointment cancelled',expired:'Appointment request expired',completed:'Appointment marked completed',no_show:'Appointment marked not attended',reminder:'Upcoming appointment reminder'}[j.event];if(!title)throw Error('Unknown event');
 const route=j.audience==='admin'?'/admin/dashboard?view=care-bookings':j.audience==='hospital'?'/hospital/dashboard':j.audience==='professional'?'/doctor/dashboard':'/patient/appointments';
 const when=new Intl.DateTimeFormat('en-GB',{timeZone:j.timezone,dateStyle:'full',timeStyle:'short'}).format(new Date(j.starts_at))+' ('+j.timezone+')';
 const paragraphs=['Hello,',j.audience==='admin'?`Operational update: request ${j.booking_id} — ${j.event}.`:`${title}.`,`Reference: ${j.booking_id}`,`Professional: ${j.professional_name}`,`Hospital: ${j.hospital_name}`,`Appointment: ${when}`];
 if(j.event==='pending')paragraphs.push(j.audience==='hospital'?'Sign in to confirm, decline or propose another time.':'This is a request, not a confirmed appointment. Do not travel until confirmation.');
 if(j.event==='proposed')paragraphs.push('The patient must accept this proposed time before it is confirmed.');
 if(j.expires_at&&['pending','proposed'].includes(j.event))paragraphs.push('Respond before: '+new Date(j.expires_at).toISOString());
 if(j.audience==='patient'&&['confirmed','reminder'].includes(j.event))paragraphs.push('Address: '+j.address,'Fee: '+j.fee,'Payment: '+j.payment_instructions,'Arrival: '+j.arrival_instructions,'Cancellation: '+j.cancellation_instructions,'Hospital phone: '+j.public_phone,'Payment is handled directly by the hospital. MindBridge has not collected payment.');
 if(j.audience==='admin')paragraphs.push('Updated by: '+(j.actor_name||'System'),'Updated at: '+new Date(j.updated_at).toISOString(),'No action is required unless a booking issue is reported.');
 if(j.demo)paragraphs.push('DEMONSTRATION ONLY — this is not a real medical appointment.');
 paragraphs.push('View securely: '+new URL(route,url).href,'Please do not reply with medical information.');
 return {subject:(j.demo?'[DEMO] ':'')+title+' — '+j.booking_id,text:paragraphs.join('\n\n'),html:emailLayout({title,paragraphs:paragraphs.filter(p=>!p.startsWith('View securely: ')),action:'View appointment securely',url:new URL(route,url).href}),attachments:logoAttachments()};
}
async function deliverCareNext({database,transport,config}){
 const job=await database.withTransaction(async c=>{
  await c.query("UPDATE care_email_jobs SET status=CASE WHEN attempts>=5 THEN 'failed' ELSE 'pending' END,lease_token=NULL,locked_at=NULL WHERE status='processing' AND locked_at<NOW()-INTERVAL '10 minutes'");
  const row=(await c.query(`SELECT j.*,b.status AS booking_status,b.version AS current_version,b.expires_at,b.updated_at,s.starts_at,s.timezone,s.fee,h.name AS hospital_name,h.address,h.public_phone,h.payment_instructions,h.arrival_instructions,h.cancellation_instructions,h.demo,h.active AS hospital_active,o.role AS officer_role,o.email AS officer_email,p.email AS patient_email,d.email AS professional_email,d.name AS professional_name,actor.name AS actor_name FROM care_email_jobs j JOIN care_bookings b ON b.id=j.booking_id JOIN care_slots s ON s.id=b.slot_id JOIN care_hospitals h ON h.id=s.hospital_id JOIN users o ON o.id=h.officer_id JOIN users p ON p.id=b.patient_id JOIN users d ON d.id=s.professional_id LEFT JOIN care_booking_events e ON e.booking_id=b.id AND e.version=b.version LEFT JOIN users actor ON actor.id=e.actor_id WHERE j.status='pending' AND j.available_at<=NOW() AND j.attempts<5 ORDER BY j.available_at FOR UPDATE OF j SKIP LOCKED LIMIT 1`)).rows[0];
  if(!row)return null;
  if(row.version!==row.current_version||(row.event==='reminder'&&(row.booking_status!=='confirmed'||new Date(row.starts_at)<=new Date()))||(row.audience==='hospital'&&(!row.hospital_active||row.officer_role!=='hospital'))){await c.query("UPDATE care_email_jobs SET status='skipped' WHERE id=$1",[row.id]);return {skipped:true};}
  row.lease=randomUUID();await c.query("UPDATE care_email_jobs SET status='processing',attempts=attempts+1,locked_at=NOW(),lease_token=$2 WHERE id=$1",[row.id,row.lease]);return row;
 });
 if(!job)return false;if(job.skipped)return true;
 try{const to={patient:job.patient_email,hospital:job.officer_email,admin:config.adminEmail,professional:job.professional_email}[job.audience];if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to||''))throw Error('recipient');const result=await transport.sendMail({from:config.from,to,messageId:`<care-${job.id}@${new URL(config.appOrigin).hostname}>`,...renderCareEmail(job,config.appOrigin)});if(!result.accepted?.length||result.rejected?.length)throw Error('delivery');await database.query("UPDATE care_email_jobs SET status='sent',sent_at=NOW(),lease_token=NULL,locked_at=NULL,last_error=NULL WHERE id=$1 AND lease_token=$2",[job.id,job.lease]);}
 catch{await database.query("UPDATE care_email_jobs SET status=$3,lease_token=NULL,locked_at=NULL,last_error='delivery_failed',available_at=NOW()+($4*INTERVAL '1 minute') WHERE id=$1 AND lease_token=$2",[job.id,job.lease,job.attempts+1>=5?'failed':'pending',2**(job.attempts+1)]);}
 return true;
}
module.exports={renderCareEmail,deliverCareNext};

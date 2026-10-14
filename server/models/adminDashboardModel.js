const { query, withTransaction } = require('../config/database');

function filters(input = {}) {
  const offset = Number(input.offset || 0);
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw Object.assign(new Error('Invalid page.'), {status:400});
  return {offset, search: String(input.search || '').trim().slice(0,100), status: String(input.status || '').slice(0,40)};
}
async function summary() {
  const result = await query(`SELECT
    (SELECT count(*)::int FROM users WHERE role='patient') AS patients,
    (SELECT count(*)::int FROM users WHERE role='doctor') AS professionals,
    (SELECT count(*)::int FROM patient_registrations WHERE status='submitted') AS patient_reviews,
    (SELECT count(*)::int FROM professional_applications WHERE status='submitted') AS professional_reviews,
    (SELECT count(*)::int FROM appointments) AS appointments,
    (SELECT count(*)::int FROM registration_email_jobs WHERE status='failed') AS failed_emails,
    (SELECT count(*)::int FROM registration_email_jobs WHERE status IN ('pending','processing')) AS queued_emails,
    (SELECT count(*)::int FROM registration_email_jobs WHERE status='sent') AS sent_emails`);
  return {...result.rows[0], updatedAt:new Date().toISOString()};
}
async function directory(input) {
  const {offset,search,status}=filters(input);
  const result=await query(`SELECT id,name,email,role,created_at,
    password IS NOT NULL AS has_password,google_id IS NOT NULL AS has_google
    FROM users WHERE ($1='' OR role=$1) AND ($2='' OR name ILIKE '%' || $2 || '%' OR email ILIKE '%' || $2 || '%')
    ORDER BY created_at DESC,id LIMIT 26 OFFSET $3`,[status,search,offset]);
  return page(result.rows);
}
function page(rows) { return {items:rows.slice(0,25),hasMore:rows.length>25}; }
async function appointments(input) {
  const {offset,search,status}=filters(input);
  const result=await query(`SELECT a.id,a.appointment_date,a.appointment_time,a.status,
    d.name AS professional,p.name AS patient FROM appointments a
    JOIN users d ON d.id=a.doctor_user_id JOIN users p ON p.id=a.patient_user_id
    WHERE ($1='' OR a.status=$1) AND ($2='' OR d.name ILIKE '%' || $2 || '%' OR p.name ILIKE '%' || $2 || '%')
    ORDER BY a.created_at DESC,a.id LIMIT 26 OFFSET $3`,[status,search,offset]);
  return page(result.rows);
}
async function emails(input) {
  const {offset,status}=filters(input);
  const result=await query(`SELECT id,application_kind,audience,event,status,attempts,created_at,sent_at
    FROM registration_email_jobs WHERE ($1='' OR status=$1)
    ORDER BY created_at DESC,id LIMIT 26 OFFSET $2`,[status,offset]);
  return page(result.rows);
}
async function activity(input) {
  const {offset,search}=filters(input);
  const result=await query(`SELECT id,user_role,action,resource_type,"timestamp" FROM audit_logs
    WHERE ($1='' OR action ILIKE '%' || $1 || '%')
    ORDER BY "timestamp" DESC,id DESC LIMIT 26 OFFSET $2`,[search,offset]);
  return page(result.rows);
}
async function retryEmail(id,actor) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw Object.assign(new Error('Invalid notification.'),{status:400});
  return withTransaction(async client=>{
    const result=await client.query(`UPDATE registration_email_jobs SET status='pending',attempts=0,available_at=NOW(),
      locked_at=NULL,lease_token=NULL,last_error=NULL WHERE id=$1 AND status='failed' RETURNING id`,[id]);
    if(!result.rows.length) throw Object.assign(new Error('This notification is no longer failed. Refresh the list.'),{status:409});
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id)
      VALUES($1,'admin','retry_registration_email','registration_email_job',$2)`,[actor,id]);
    return {success:true};
  });
}
module.exports={summary,directory,appointments,emails,activity,retryEmail,filters};

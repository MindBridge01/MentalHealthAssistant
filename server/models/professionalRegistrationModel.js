const { query, withTransaction } = require('../config/database');
const { encryptValue, decryptValue } = require('../services/encryptionService');
const { validateProfessional } = require('../services/professionalValidation');
const fail = (message, status=409) => Object.assign(new Error(message), {status});
const pack = value => JSON.stringify(encryptValue(value));
function map(row) { return {...row, data: row.version ? decryptValue(row.data) : {}, note: row.note ? decryptValue(JSON.parse(row.note)) : ''}; }
async function ensure(client, id) {
  await client.query('INSERT INTO professional_applications(user_id) VALUES ($1) ON CONFLICT DO NOTHING',[id]);
  return (await client.query('SELECT * FROM professional_applications WHERE user_id=$1 FOR UPDATE',[id])).rows[0];
}
async function get(id) {
  const result = await query('SELECT * FROM professional_applications WHERE user_id=$1',[id]);
  const docs = await query('SELECT id,kind,size_bytes FROM professional_documents WHERE user_id=$1',[id]);
  return {...(result.rows[0] ? map(result.rows[0]) : {status:'draft',version:0,data:{},note:''}), documents:docs.rows};
}
async function record(client,row,actor,note) {
  const docs = await client.query('SELECT * FROM professional_documents WHERE user_id=$1',[row.user_id]);
  await client.query(`INSERT INTO professional_application_events(user_id,actor_id,version,status,snapshot) VALUES($1,$2,$3,$4,$5)`,
    [row.user_id,actor,row.version,row.status,pack({data:decryptValue(row.data),note,documents:docs.rows})]);
  for (const audience of row.status === 'submitted' ? ['admin','patient'] : ['patient']) {
    await client.query(`INSERT INTO registration_email_jobs(registration_user_id,application_version,audience,event,application_kind)
      VALUES($1,$2,$3,$4,'professional') ON CONFLICT DO NOTHING`,[row.user_id,row.version,audience,row.status]);
  }
}
async function submit(id,input) {
  const data = validateProfessional(input);
  return withTransaction(async client => {
    const row = await ensure(client,id);
    if (!['draft','needs_information'].includes(row.status) || row.version !== input.version) throw fail('Application changed. Refresh before submitting.');
    const docs = await client.query('SELECT kind FROM professional_documents WHERE user_id=$1',[id]);
    if (docs.rows.length !== 2) throw fail('Upload your registration certificate and degree before submitting.',400);
    const result = await client.query(`UPDATE professional_applications SET data=$2,status='submitted',version=version+1,note='',updated_at=NOW() WHERE user_id=$1 RETURNING *`,[id,pack(data)]);
    await record(client,result.rows[0],id,'');
    return map(result.rows[0]);
  });
}
async function review(id,actor,input) {
  if (!['approved','needs_information','declined'].includes(input.status) || typeof input.note !== 'string' || input.note.trim().length < 10 || input.note.length > 2000) throw fail('Choose a decision and provide a note (10–2000 characters).',400);
  if (input.status === 'approved' && input.verified !== true) throw fail('Verify the professional credentials before approval.',400);
  return withTransaction(async client => {
    const row = await ensure(client,id);
    if (row.status !== 'submitted' || row.version !== input.version) throw fail('Application changed. Refresh before reviewing.');
    const result = await client.query(`UPDATE professional_applications SET status=$2,note=$3,version=version+1,updated_at=NOW() WHERE user_id=$1 RETURNING *`,[id,input.status,pack(input.note.trim())]);
    if (input.status === 'approved') {
      const d = decryptValue(row.data);
      await client.query(`INSERT INTO doctors(user_id,name,specialty,contact,qualifications,license_number) VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(user_id) DO UPDATE SET name=$2,specialty=$3,contact=$4,qualifications=$5,license_number=$6`,[id,d.name,d.specialty,d.phone,d.qualification,d.licenseNumber]);
      await client.query("UPDATE users SET role='doctor',updated_at=NOW() WHERE id=$1",[id]);
    }
    await record(client,result.rows[0],actor,input.note.trim());
    return map(result.rows[0]);
  });
}
async function upload(id,kind,file,mime) {
  if (!['registration','degree'].includes(kind)) throw fail('Invalid credential type.',400);
  return withTransaction(async client => {
    const row=await ensure(client,id);
    if (!['draft','needs_information'].includes(row.status)) throw fail('Credentials cannot change while under review or after a decision.');
    await client.query(`INSERT INTO professional_documents(user_id,kind,content,filename,media_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT(user_id,kind) DO UPDATE SET content=$3,filename=$4,media_type=$5,size_bytes=$6`,
      [id,kind,pack({base64:file.buffer.toString('base64')}),pack(String(file.originalname).replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,160)),mime,file.buffer.length]);
  });
}
async function list(status='submitted',offset=0) {
  const result=await query('SELECT a.*,u.email FROM professional_applications a JOIN users u ON u.id=a.user_id WHERE a.status=$1 ORDER BY a.updated_at LIMIT 25 OFFSET $2',[status,offset]);
  return result.rows.map(map);
}
async function history(id) {
  const result=await query('SELECT version,status,created_at,snapshot FROM professional_application_events WHERE user_id=$1 ORDER BY version DESC LIMIT 100',[id]);
  return result.rows.map(({snapshot,...row})=>({...row,note:decryptValue(snapshot).note}));
}
async function download(id,documentId,actor,role) {
  return withTransaction(async client=>{
    const row=(await client.query('SELECT * FROM professional_documents WHERE id=$1 AND user_id=$2',[documentId,id])).rows[0];
    if (!row) throw fail('Document not found.',404);
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id) VALUES($1,$2,'read_professional_credential','professional_document',$3)`,[actor,role,documentId]);
    return {buffer:Buffer.from(decryptValue(row.content).base64,'base64'),mime:row.media_type};
  });
}
module.exports={get,submit,review,upload,list,history,download};

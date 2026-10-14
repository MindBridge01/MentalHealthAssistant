const { randomUUID } = require('node:crypto');
async function bootstrapAdmin(database,hash,input) {
  const email=String(input.email || '').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof input.password!=='string' || input.password.length<15 || Buffer.byteLength(input.password)>72) {
    throw new Error('Provide a valid email and a unique password of at least 15 characters (maximum 72 UTF-8 bytes).');
  }
  const password=await hash(input.password,12);
  return database.withTransaction(async client=>{
    await client.query('SELECT pg_advisory_xact_lock(48290174)');
    const admins=await client.query("SELECT id FROM users WHERE role='admin' LIMIT 1");
    if(admins.rows.length) throw new Error('An administrator already exists. First-admin setup is disabled.');
    const existing=await client.query('SELECT id FROM users WHERE lower(email)=$1',[email]);
    if(existing.rows.length) throw new Error('This email already belongs to an account. Setup will not promote it automatically.');
    const id=randomUUID();
    await client.query(`INSERT INTO users(id,email,name,password,role) VALUES($1,$2,'Administrator',$3,'admin')`,[id,email,password]);
    await client.query(`INSERT INTO audit_logs(user_id,user_role,action,resource_type,resource_id)
      VALUES($1,'admin','bootstrap_admin','user',$1)`,[id]);
    return id;
  });
}
module.exports={bootstrapAdmin};

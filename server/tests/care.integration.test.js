const test=require('node:test'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
const {randomBytes}=require('node:crypto');
process.env.PHI_ENCRYPTION_KEY=randomBytes(32).toString('hex');
const {encryptValue}=require('../services/encryptionService');
const {createCareService}=require('../services/careService');
const {runMigrations}=require('../migrations/migrationRunner');
const {backfillRegistry}=require('../migrations/registryBackfill');
const {deliverCareNext,renderCareEmail}=require('../services/careEmailDelivery');
function adapter(pg){return {query:async(sql,params=[])=>{sql=sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;','');if(params.length)return pg.query(sql,params);return (await pg.exec(sql)).at(-1)||{rows:[]};},withTransaction:fn=>pg.transaction(tx=>fn(adapter(tx)))};}
test('hospital affiliations, profile publication, booking lifecycle and transactional email',async t=>{
 const pg=new PGlite();t.after(()=>pg.close());const db=adapter(pg),care=createCareService(db);
 await db.withTransaction(c=>runMigrations(c,backfillRegistry));
 const admin={_id:'admin',role:'admin'},doc={_id:'doc',role:'doctor'},patient={_id:'patient',role:'patient'},other={_id:'other',role:'patient'};
 for(const u of [admin,doc,patient,other,{_id:'intruder',role:'hospital'}])await db.query('INSERT INTO users(id,email,name,role) VALUES($1,$2,$1,$3)',[u._id,u._id+'@example.test',u.role]);
 await db.query("INSERT INTO professional_applications(user_id,status,version,data) VALUES('doc','approved',1,$1)",[JSON.stringify(encryptValue({name:'Demo Counsellor',profession:'counsellor',qualification:'Sample diploma',phone:'PRIVATE_PHONE',specialty:'Counselling'}))]);
 for(const id of ['patient','other']){const row=(await db.query('INSERT INTO patients(user_id) VALUES($1) RETURNING id',[id])).rows[0];await db.query("INSERT INTO patient_registrations(user_id,patient_id,details,status,consent_version) VALUES($1,$2,'{}','approved','test')",[id,row.id]);}
 const profile={bio:'Synthetic professional biography',services:'Support',languages:'English',age_groups:'Adults',published:true,accepting:true};
 await assert.rejects(care.saveProfile(doc,profile),/affiliation/);
 const hospital={name:'Fictional Demo Clinic',address:'Demo address',city:'Demo city',public_phone:'0000000000',website:'',officer_name:'Demo Officer',officer_email:'officer@example.test',officer_password:'',payment_method:'at_location',payment_instructions:'Pay at hospital',arrival_instructions:'Arrive early',cancellation_instructions:'Contact clinic',agreement_reference:'Demo only',demo:true,active:true};
 await db.query("INSERT INTO users(id,email,name,password,role) VALUES('officer','officer@example.test','Demo Officer','$2b$synthetic','hospital')");
 const h=await care.saveHospital(admin,hospital);const officerId=(await db.query('SELECT officer_id FROM care_hospitals WHERE id=$1',[h.id])).rows[0].officer_id;const officer={_id:officerId,role:'hospital'};
 assert.match((await db.query('SELECT password FROM users WHERE id=$1',[officerId])).rows[0].password,/^\$2/);
 await assert.rejects(care.saveHospital(admin,{...hospital,officer_email:'patient@example.test'}),/Invite/);
 await care.link(admin,h.id,{professionalId:'doc',active:true});await care.saveProfile(doc,profile);
 assert.equal(JSON.stringify(await care.browse()).includes('PRIVATE_PHONE'),false);
 const base=Date.now()+48*3600000;const input=(n)=>({hospitalId:h.id,startsAt:new Date(base+n*3600000).toISOString(),endsAt:new Date(base+n*3600000+1800000).toISOString(),timezone:'Asia/Colombo',fee:'LKR 1000 (demo)'});
 const s1=await care.addSlot(doc,input(0)),s2=await care.addSlot(doc,input(1));
 await assert.rejects(care.addSlot(doc,input(0)),/overlaps/);
 await assert.rejects(care.request(patient,{slotId:s1.id}),/instructions/);
 let b=await care.request(patient,{slotId:s1.id,instructionsAccepted:true});assert.equal(b.status,'pending');
 assert.equal((await care.publicSlots('doc')).length,1);
 await assert.rejects(care.request(other,{slotId:s1.id,instructionsAccepted:true}),/reserved/);
 await assert.rejects(care.removeSlot(doc,s1.id),/Cancel/);
 assert.equal((await care.bookings({_id:'intruder',role:'hospital'})).length,0);
 await assert.rejects(care.transition({_id:'intruder',role:'hospital'},b.id,{version:1,action:'confirm'}),{status:403});
 const messages=[];const config={appOrigin:'https://example.test',from:'mail@example.test',adminEmail:'admin@example.test'};
 while(await deliverCareNext({database:db,transport:{sendMail:async m=>{messages.push(m);return {accepted:[m.to],rejected:[]};}},config})){/* Drain the synthetic email queue. */}
 assert.equal(messages.length,4);assert.ok(messages.every(m=>m.subject.startsWith('[DEMO]')));assert.ok(messages.every(m=>!m.text.includes('PRIVATE_PHONE')));
 b=await care.transition(officer,b.id,{version:b.version,action:'propose',slotId:s2.id});assert.equal(b.status,'proposed');
 await assert.rejects(care.transition(officer,b.id,{version:b.version,action:'confirm'}),/not available/);
 await assert.rejects(care.transition(other,b.id,{version:b.version,action:'accept'}),{status:403});
 b=await care.transition(patient,b.id,{version:b.version,action:'accept'});assert.equal(b.status,'confirmed');
 await assert.rejects(care.transition(patient,b.id,{version:1,action:'cancel'}),/changed/);
 messages.length=0;while(await deliverCareNext({database:db,transport:{sendMail:async m=>{messages.push(m);return {accepted:[m.to]};}},config})){/* Drain the synthetic email queue. */}
 assert.equal(messages.length,4);assert.ok(messages.find(m=>m.to==='patient@example.test').text.includes('Pay at hospital'));assert.ok(!messages.find(m=>m.to==='admin@example.test').text.includes('Pay at hospital'));
 assert.equal((await db.query("SELECT count(*)::int AS n FROM care_email_jobs WHERE status='skipped'")).rows[0].n,4);
 b=await care.transition(patient,b.id,{version:b.version,action:'cancel'});assert.equal(b.status,'cancelled');
 let exp=await care.request(other,{slotId:s1.id,instructionsAccepted:true});await db.query("UPDATE care_bookings SET expires_at=NOW()-INTERVAL '1 minute' WHERE id=$1",[exp.id]);await care.maintenance();assert.equal((await db.query('SELECT status FROM care_bookings WHERE id=$1',[exp.id])).rows[0].status,'expired');
 await care.link(admin,h.id,{professionalId:'doc',active:false});assert.equal((await care.publicSlots('doc')).length,0);await assert.rejects(care.request(patient,{slotId:s1.id,instructionsAccepted:true}),/no longer/);
 await care.link(admin,h.id,{professionalId:'doc',active:true});
 // Reminder deduplication and retry/backoff are verified without a real SMTP connection.
 const soon=await care.addSlot(doc,{...input(3),startsAt:new Date(Date.now()+7200000).toISOString(),endsAt:new Date(Date.now()+9000000).toISOString()});
 let reminder=await care.request(patient,{slotId:soon.id,instructionsAccepted:true});reminder=await care.transition(officer,reminder.id,{version:1,action:'confirm'});await care.maintenance();await care.maintenance();assert.equal((await db.query("SELECT count(*)::int AS n FROM care_email_jobs WHERE event='reminder'")).rows[0].n,3);
 await db.query("UPDATE care_email_jobs SET status='sent' WHERE event<>'reminder'");await deliverCareNext({database:db,transport:{sendMail:async()=>{throw Error('SECRET_SMTP_PASSWORD');}},config});
 const retry=(await db.query("SELECT * FROM care_email_jobs WHERE last_error IS NOT NULL")).rows[0];assert.equal(retry.last_error,'delivery_failed');assert.equal(retry.attempts,1);assert.equal(retry.status,'pending');
});
test('email HTML escapes content and separates patient instructions from operational messages',()=>{
 const b={booking_id:'reference',event:'confirmed',audience:'patient',timezone:'UTC',starts_at:new Date(),updated_at:new Date(),professional_name:'<script>alert(1)</script>',hospital_name:'Demo',demo:true,address:'Address',payment_instructions:'Pay at clinic'};
 const mail=renderCareEmail(b,'https://example.test');assert.ok(!mail.html.includes('<script>'));assert.ok(mail.html.includes('&lt;script&gt;'));assert.match(mail.text,/DEMONSTRATION ONLY/);assert.match(mail.text,/Pay at clinic/);
 assert.ok(!renderCareEmail({...b,audience:'admin'},'https://example.test').text.includes('Pay at clinic'));
});


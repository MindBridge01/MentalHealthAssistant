const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const express=require('express');
const request=require('supertest');
const {PGlite}=require('@electric-sql/pglite');
process.env.PHI_ENCRYPTION_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const {runMigrations}=require('../migrations/migrationRunner');
const {backfillRegistry}=require('../migrations/registryBackfill');
const {normalizeId}=require('../models/_shared');
function load(file,deps) {
  const module={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{module,Date,exports:module.exports,require:id=>{if(id in deps)return deps[id];throw Error('Unexpected dependency '+id);}});
  return module.exports;
}
function adapter(pg){return {query:async(sql,args=[])=>{sql=sql.replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;','');return args.length?pg.query(sql,args):(await pg.exec(sql)).at(-1)||{rows:[]};},withTransaction:fn=>pg.transaction(tx=>fn(adapter(tx)))};}

test('community review migration preserves published posts and hides new submissions across both APIs until approved',async t=>{
  const pg=new PGlite();t.after(()=>pg.close());const db=adapter(pg);
  await db.query(fs.readFileSync(path.join(__dirname,'../migrations/init_schema.sql'),'utf8'));
  await db.query("INSERT INTO users(id,email,name,role) VALUES('member','member@example.test','Member','patient'),('admin','admin@example.test','Admin','admin')");
  await db.query("INSERT INTO posts(id,caption,name) VALUES('legacy','An existing published post','Member')");
  await db.withTransaction(c=>runMigrations(c,backfillRegistry));
  assert.equal((await db.withTransaction(c=>runMigrations(c,backfillRegistry))).length,0);
  const deps={'../config/database':db,'./_shared':{normalizeId}};
  const community=load('models/communityModel.js',deps),legacy=load('models/postModel.js',deps);
  assert.equal((await community.listCommunityPosts('member')).length,1);
  const post=await community.createCommunityPost({_id:'111111111111111111111111',caption:'Please review this reflection.',name:'Member',submittedBy:'member',createdAt:new Date().toISOString()});
  assert.equal(post.moderationStatus,'pending');
  assert.equal((await legacy.listPosts()).length,1);
  assert.equal(await community.findCommunityPostById(post._id,'member'),null);
  const pending=await community.listPostsForReview();assert.equal(pending.posts[0]._id,post._id);
  const approved=await community.reviewPost(post._id,'admin','approved','Suitable for the community.');
  assert.equal(approved.moderationStatus,'approved');assert.equal(approved.reviewNote,'Suitable for the community.');
  assert.equal((await community.listCommunityPosts('member')).length,2);assert.equal((await legacy.listPosts()).length,2);
  assert.equal(await community.reviewPost(post._id,'admin','rejected'),null);
  assert.equal((await db.query("SELECT count(*)::int AS count FROM audit_logs WHERE action='approve_community_post'")).rows[0].count,1);
  const another=await legacy.createPost({_id:'222222222222222222222222',caption:'Legacy client submission',submittedBy:'member'});
  assert.equal(another.moderationStatus,'pending');
  await community.reviewPost(another._id,'admin','rejected','Please revise.');
  assert.equal((await community.listPostsForReview({status:'rejected'})).posts.length,1);
  assert.equal((await legacy.listPosts()).length,2);
  // Even direct inserts default to pending, preventing alternate writers from publishing by accident.
  await db.query("INSERT INTO posts(id,caption) VALUES('direct','A direct submission')");
  assert.equal((await db.query("SELECT moderation_status FROM posts WHERE id='direct'")).rows[0].moderation_status,'pending');
  const dashboard=load('models/adminDashboardModel.js',{'../config/database':db});
  assert.equal((await dashboard.summary()).community_reviews,1);
});

test('admin-only review endpoints validate decisions and reject stale reviews',async()=>{
  for(const role of [null,'patient','admin']) {
    let reviews=0,queries=0,stale=false;
    const deps={express,
      '../models/userModel':{findUserById:async()=>({role})},
      '../services/auditLogService':{},
      '../middleware/authMiddleware':{authenticateJWT:()=> (req,res,next)=>{if(!role)return res.sendStatus(401);req.user={_id:'reviewer',role};next();},authorizeRoles:allowed=>(req,res,next)=>role===allowed?next():res.sendStatus(403)},
      '../middleware/permissionMiddleware':{requirePermission:()=> (req,res,next)=>next()},
      '../models/adminDashboardModel':{},
      '../models/communityModel':{listPostsForReview:async()=>{queries++;return {posts:[],hasMore:false};},reviewPost:async(id,admin,decision,note)=>{reviews++;return stale?null:{_id:id,moderationStatus:decision,reviewNote:note};}}
    };
    const app=express();app.use(express.json());app.use(load('routes/adminRoutes.js',deps));
    const url='/community-posts/111111111111111111111111/review';
    const response=await request(app).patch(url).send({decision:'approved'});
    assert.equal(response.status,role==='admin'?200:role?403:401);assert.equal(reviews,role==='admin'?1:0);
    const list=await request(app).get('/community-posts');assert.equal(list.status,role==='admin'?200:role?403:401);assert.equal(queries,role==='admin'?1:0);
    if(role==='admin'){
      assert.equal(response.headers['cache-control'],'no-store');
      assert.equal((await request(app).patch(url).send({decision:'publish'})).status,400);
      assert.equal((await request(app).patch(url).send({decision:'rejected',note:'x'.repeat(1001)})).status,400);
      assert.equal((await request(app).get('/community-posts?status=invalid')).status,400);
      assert.equal((await request(app).get('/community-posts?offset=-1')).status,400);
      assert.equal(reviews,1);
      stale=true;assert.equal((await request(app).patch(url).send({decision:'rejected'})).status,409);
    }
  }
});

const router = require('express').Router();
const multer = require('multer');
const { authenticateJWT } = require('../middleware/authMiddleware');
const { findUserById } = require('../models/userModel');
const model = require('../models/professionalRegistrationModel');
const { documentType, scanDocument } = require('../services/registrationDocumentService');
router.use(authenticateJWT());
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');
const credentialLimit = createRateLimiter({windowMs:60000,maxRequests:6,scope:'user-or-ip',message:'Too many credential uploads. Please wait a minute.'});
router.use(async(req,res,next)=>{
  try {
    const user=await findUserById(req.user._id);
    if (!user || !['admin','pending-doctor','doctor'].includes(user.role)) return res.status(403).json({error:'Professional or administrator access required.'});
    req.user=user;
    res.set('Cache-Control','no-store');
    next();
  } catch { res.status(503).json({error:'Registration is unavailable. Please try later.'}); }
});
const run=fn=>async(req,res,next)=>{try{await fn(req,res);}catch(e){next(e);}};
const admin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({error:'Administrator access required.'});
const applicant=(req,res,next)=>req.user.role==='pending-doctor'?next():res.status(403).json({error:'A pending professional account is required.'});
router.get('/me',run(async(req,res)=>res.json(await model.get(req.user._id))));
router.post('/me',applicant,run(async(req,res)=>res.json(await model.submit(req.user._id,req.body))));
router.post('/documents/:kind',applicant,credentialLimit,multer({storage:multer.memoryStorage(),limits:{fileSize:5242880,files:1,fields:0,parts:2}}).single('file'),run(async(req,res)=>{
  const mime=documentType(req.file?.buffer);
  if(!mime) return res.status(400).json({error:'Upload a PDF, PNG or JPEG up to 5 MB.'});
  try { await scanDocument(req.file.buffer); } catch(e) { return res.status(e.status||503).json({error:'Credential security scan failed or is unavailable. Please try later.'}); }
  await model.upload(req.user._id,req.params.kind,req.file,mime);
  res.status(201).json({success:true});
}));
router.get('/applications',admin,run(async(req,res)=>res.json(await model.list(req.query.status||'submitted',Math.max(0,Number.parseInt(req.query.offset,10)||0)))));
router.get('/applications/:id',admin,run(async(req,res)=>res.json({...await model.get(req.params.id),history:await model.history(req.params.id)})));
router.patch('/applications/:id',admin,run(async(req,res)=>res.json(await model.review(req.params.id,req.user._id,req.body))));
router.get('/documents/:owner/:id',run(async(req,res)=>{
  if(req.user.role!=='admin' && req.user._id!==req.params.owner) return res.status(403).json({error:'Access denied.'});
  if(!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(400).json({error:'Invalid document.'});
  const file=await model.download(req.params.owner,req.params.id,req.user._id,req.user.role);
  res.set({'Content-Type':file.mime,'Content-Disposition':'attachment; filename="credential.'+(file.mime==='application/pdf'?'pdf':file.mime==='image/png'?'png':'jpg')+'"','X-Content-Type-Options':'nosniff'}).send(file.buffer);
}));
router.use((e,req,res,_next)=>res.status(e.code==='LIMIT_FILE_SIZE'?413:e.status||500).json({error:e.code==='LIMIT_FILE_SIZE'?'Maximum file size is 5 MB.':e.status?e.message:'Unable to process registration. Please try again.'}));
module.exports=router;

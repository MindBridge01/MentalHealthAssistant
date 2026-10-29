const router=require('express').Router();
const {authenticateJWT,authorizeRoles}=require('../middleware/authMiddleware');
const {requireApprovedPatient}=require('../middleware/registrationMiddleware');
const {authenticatedChatRateLimiter}=require('../middleware/rateLimitMiddleware');
const {createGateway}=require('../services/chatbotGateway');
router.use(authenticateJWT(),authorizeRoles('patient','admin'),requireApprovedPatient,authenticatedChatRateLimiter);
// Browser writes require a trusted website origin; native Bearer clients have no cookies.
router.use((req,res,next)=>{
  if(['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if(req.headers.authorization?.startsWith('Bearer ')&&!req.cookies?.auth_token) return next();
  const origins=require('../config/environment').getCorsOrigins();
  if(req.headers.origin && typeof origins==='function') return origins(req.headers.origin,(error,allowed)=>error||!allowed?res.status(403).json({error:'Request origin is not allowed.'}):next());
  if(Array.isArray(origins)&&origins.includes(req.headers.origin)) return next();
  return res.status(403).json({error:'Request origin is not allowed.'});
});
router.use(createGateway());
module.exports=router;

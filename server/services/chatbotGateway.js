const http = require('node:http');
const https = require('node:https');
const {createHmac} = require('node:crypto');

function allowedPath(method, path) {
  if (method==='GET' && ['/health','/me','/conversations','/memories','/admin/documents'].includes(path)) return true;
  if (method==='POST' && ['/conversations','/memories','/feedback','/admin/documents'].includes(path)) return true;
  const id='[a-f0-9-]{36}';
  return (['GET','DELETE'].includes(method)&&new RegExp(`^/conversations/${id}$`).test(path)) ||
    (method==='DELETE'&&new RegExp(`^/memories/${id}$`).test(path)) ||
    (method==='POST'&&new RegExp(`^/conversations/${id}/messages$`).test(path)) ||
    (method==='GET'&&new RegExp(`^/admin/documents/${id}/file$`).test(path)) ||
    (method==='POST'&&new RegExp(`^/admin/documents/${id}/review$`).test(path));
}
function signIdentity(user,secret) {
  const now=Math.floor(Date.now()/1000);
  const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const body=Buffer.from(JSON.stringify({sub:String(user._id),role:user.role,mfa:user.mfa===true,iss:'mindbridge',aud:'mindbridge-chatbot',iat:now,exp:now+60})).toString('base64url');
  return `${head}.${body}.${createHmac('sha256',secret).update(`${head}.${body}`).digest('base64url')}`;
}
function createGateway({env=process.env}={}) {
  return (req,res)=>{
    res.set('Cache-Control','no-store');
    if(!allowedPath(req.method,req.path)) return res.status(404).json({error:'Chatbot endpoint not found.'});
    if(req.path.startsWith('/admin/')&&req.user.role!=='admin') return res.status(403).json({error:'Administrator access required.'});
    if(req.user.role==='admin'&&req.user.mfa!==true) return res.status(403).json({error:'MFA verification required.'});
    const secret=env.CHATBOT_AUTH_SECRET;
    if(!secret||secret.length<32) return res.status(503).json({error:'The assistant is not configured yet. Please try later.'});
    let target;
    try {
      target=new URL(env.CHATBOT_SERVICE_URL||'http://127.0.0.1:3100');
      if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.pathname!=='/'||target.search||target.hash) throw Error();
    } catch { return res.status(503).json({error:'The assistant service is not configured correctly.'}); }
    const headers={authorization:`Bearer ${signIdentity(req.user,secret)}`,'x-mindbridge-integration':'website'};
    const multipart=req.is('multipart/form-data');
    let body;
    if(!['GET','HEAD'].includes(req.method)&&!multipart){body=JSON.stringify(req.body||{});headers['content-type']='application/json';headers['content-length']=Buffer.byteLength(body);}
    if(multipart) headers['content-type']=req.headers['content-type'];
    const upstream=(target.protocol==='https:'?https:http).request(new URL('/api'+req.path,target),{method:req.method,headers},reply=>{
      // Never forward upstream cookies, redirects or authentication headers.
      res.status(reply.statusCode);
      for(const key of ['content-type','content-disposition']) if(reply.headers[key]) res.set(key,reply.headers[key]);
      reply.on('error',()=>res.destroy());
      reply.pipe(res);
    });
    upstream.setTimeout(120000,()=>upstream.destroy());
    upstream.on('error',()=>{if(!res.headersSent)res.status(503).json({error:'The assistant is temporarily unavailable. Please try again later.'});else res.destroy();});
    res.on('close',()=>upstream.destroy());
    if(multipart){let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>6*1024*1024){if(!res.headersSent)res.status(413).json({error:'Source upload is too large.'});upstream.destroy();}});req.pipe(upstream);}
    else upstream.end(body);
  };
}
module.exports={createGateway,allowedPath,signIdentity};

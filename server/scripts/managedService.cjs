const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
let frontend;
let modelProcess;
let stopping=false;
async function stop(){
  if(stopping)return;stopping=true;
  if(modelProcess){modelProcess.kill();return;}
  if(frontend){await frontend.close();process.exit(0);}
  process.emit('SIGTERM');
  setTimeout(()=>process.exit(0),7000).unref();
}
process.on('message',message=>{if(message==='shutdown')stop();});
// A watch-mode restart or terminated parent must not leave orphan services behind.
process.on('disconnect',stop);
(async()=>{
  const kind=process.argv[2];
  if(kind==='frontend'){
    const {createServer}=await import('vite');
    frontend=await createServer({root,server:{port:5173,strictPort:true}});
    await frontend.listen();frontend.printUrls();
  } else if(kind==='models'){
    const {spawn}=require('node:child_process');
    const {existsSync}=require('node:fs');
    const venv=path.join(root,'chatbot/.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
    const externalVenv=path.join(process.env.LOCALAPPDATA||root,'MindBridge/python-env/Scripts/python.exe');
    const python=process.env.CHATBOT_PYTHON||(process.platform==='win32'&&existsSync(externalVenv)?externalVenv:existsSync(venv)?venv:(process.platform==='win32'?'python':'python3'));
    modelProcess=spawn(python,['-m','uvicorn','app:app','--host','127.0.0.1','--port','8100','--no-access-log'],{cwd:path.join(root,'chatbot/model-service'),windowsHide:true,stdio:'inherit'});
    modelProcess.once('error',()=>{console.error('[startup] Install the chatbot Python environment first; see CHATBOT_INTEGRATION.md.');process.exit(1);});
    modelProcess.once('exit',code=>process.exit(stopping?0:code||1));
  } else {
    const entry={chatbot:'index.js',ingestion:'worker.js'}[kind];
    if(!entry)throw Error();
    await import(pathToFileURL(path.join(root,'chatbot/server',entry)).href);
  }
})().catch(error=>{
  const explanations={ENOSPC:'Disk is full. Free space on the project drive.',EADDRINUSE:'The service port is occupied. Close the separately started service.',ERR_MODULE_NOT_FOUND:'A required dependency is missing. Install dependencies for the project and chatbot.',ENOENT:'A required file or executable is missing.',CHATBOT_CONFIG:'Set CHATBOT_DATABASE_URL, CHATBOT_DATA_KEY (64 hex characters), and CHATBOT_AUTH_SECRET (at least 32 characters) in server/.env.'};
  console.error(`[startup] ${process.argv[2]}: ${explanations[error.code]||'Service could not start. Check configuration and dependencies.'}`);
  process.exit(1);
});

const {fork}=require('node:child_process');
const path=require('node:path');

function startProjectProcesses({env=process.env,logger=console,launch=fork,retryMs=10000}={}) {
  const children=new Set(),timers=new Set();let stopping=false;
  const root=path.resolve(__dirname,'../..');
  function start(kind){
    if(stopping)return;
    const child=launch(path.join(root,'server/scripts/managedService.cjs'),[kind],{
      cwd:root,env,execArgv:[],windowsHide:true,stdio:['ignore','inherit','inherit','ipc']
    });
    children.add(child);
    let finished=false;
    const ended=()=>{
      if(finished)return;finished=true;children.delete(child);
      if(!stopping){logger.error(`[startup] ${kind} stopped; retrying in ${retryMs/1000} seconds.`);const timer=setTimeout(()=>{timers.delete(timer);start(kind);},retryMs);timers.add(timer);}
    };
    child.once('error',ended);child.once('exit',ended);
    logger.log(`[startup] Managing ${kind}.`);
  }
  if(env.CHATBOT_AUTOSTART!=='false'){
    start('chatbot');start('ingestion');
    if(env.CHATBOT_MODELS_AUTOSTART!=='false'&&(!env.MODEL_SERVICE_URL||env.MODEL_SERVICE_URL==='http://127.0.0.1:8100'||env.MODEL_SERVICE_URL==='http://localhost:8100'))start('models');
  }
  if(env.NODE_ENV!=='production'&&env.FRONTEND_AUTOSTART!=='false')start('frontend');
  return {async stop(){
    stopping=true;for(const timer of timers)clearTimeout(timer);
    await Promise.all([...children].map(child=>new Promise(resolve=>{
      const timer=setTimeout(()=>{child.kill();resolve();},8000);
      child.once('exit',()=>{clearTimeout(timer);resolve();});
      if(child.connected)child.send('shutdown');else{child.kill();clearTimeout(timer);resolve();}
    })));
  }};
}
module.exports={startProjectProcesses};

const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {startProjectProcesses}=require('../services/projectProcesses');
test('development manages all services and shuts down owned processes',async()=>{
  const kinds=[],children=[];
  const launch=(_file,args,options)=>{kinds.push(args[0]);assert.deepEqual(options.execArgv,[]);const child=new EventEmitter();child.connected=true;child.send=message=>{assert.equal(message,'shutdown');setImmediate(()=>child.emit('exit',0));};children.push(child);return child;};
  const manager=startProjectProcesses({env:{},launch,logger:{log(){},error(){}}});
  assert.deepEqual(kinds,['chatbot','ingestion','models','frontend']);await manager.stop();
});
test('production does not launch Vite and externally managed services can be disabled',async()=>{
  const manager=startProjectProcesses({env:{NODE_ENV:'production',CHATBOT_AUTOSTART:'false'},launch:()=>assert.fail('unexpected launch')});await manager.stop();
});

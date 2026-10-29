import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {HttpError} from './security.js';
export async function scanSource(buffer, executable=process.env.CHATBOT_CLAMSCAN_PATH){
  if(!executable) throw new HttpError(503,'Knowledge upload security scanning is not configured.');
  const directory=await mkdtemp(join(tmpdir(),'mindbridge-knowledge-'));
  try {
    const file=join(directory,'source');
    await writeFile(file,buffer,{mode:0o600});
    await promisify(execFile)(executable,['--no-summary','--',file],{timeout:30000,windowsHide:true});
  } catch(error){throw new HttpError(error.code===1?422:503,error.code===1?'The source failed its security scan.':'The source security scanner is unavailable.');}
  finally {await rm(directory,{recursive:true,force:true});}
}

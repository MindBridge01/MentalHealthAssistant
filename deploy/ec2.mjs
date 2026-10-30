import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function commandPlan(env) {
  const {APP_IMAGE, MODELS_IMAGE, DEPLOY_SHA, EC2_INSTANCE_ID}=env;
  const image=/^ghcr\.io\/[a-z0-9_./-]+@sha256:[a-f0-9]{64}$/;
  if (!image.test(APP_IMAGE||'') || !image.test(MODELS_IMAGE||'')) throw Error('Digest-pinned GHCR images required.');
  if (!/^[a-f0-9]{40}$/.test(DEPLOY_SHA||'')) throw Error('Full release SHA required.');
  if (!/^i-[a-f0-9]{8,17}$/.test(EC2_INSTANCE_ID||'')) throw Error('Valid EC2 instance ID required.');
  const dir=`/opt/mindbridge/releases/${DEPLOY_SHA}`;
  const encode=s=>Buffer.from(s).toString('base64');
  const compose=readFileSync(new URL('./compose.ec2.yaml',import.meta.url),'utf8');
  const script=readFileSync(new URL('./ec2-release.sh',import.meta.url),'utf8');
  return {instance:EC2_INSTANCE_ID,commands:[
    'set -eu', 'umask 077', `mkdir -p ${dir}`,
    `printf '%s' '${encode(compose)}' | base64 -d > ${dir}/compose.yaml`,
    `printf '%s' '${encode(`APP_IMAGE=${APP_IMAGE}\nMODELS_IMAGE=${MODELS_IMAGE}\n`)}' | base64 -d > ${dir}/images.env`,
    `printf '%s' '${encode(script)}' | base64 -d > ${dir}/release.sh`,
    `bash ${dir}/release.sh ${dir}`
  ]};
}
export async function deploy(env=process.env, aws=(args)=>JSON.parse(execFileSync('aws',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']})), wait=ms=>new Promise(r=>setTimeout(r,ms))) {
  const plan=commandPlan(env);
  const result=aws(['ssm','send-command','--instance-ids',plan.instance,'--document-name','AWS-RunShellScript','--parameters',JSON.stringify({commands:plan.commands,executionTimeout:['3000']}),'--timeout-seconds','120','--output','json']);
  const id=result.Command.CommandId;
  console.log(`SSM deployment command: ${id}`);
  for(let i=0;i<330;i++) {
    await wait(10000);
    let status;
    try { status=aws(['ssm','get-command-invocation','--command-id',id,'--instance-id',plan.instance,'--output','json']).Status; }
    catch(error) { if(i<6 && String(error.stderr||'').includes('InvocationDoesNotExist')) continue; throw Error('Cannot read SSM deployment status. Inspect Systems Manager.'); }
    if(status==='Success') { console.log('EC2 deployment completed.'); return; }
    if(['Failed','Cancelled','TimedOut','Cancelling'].includes(status)) throw Error(`EC2 deployment ${status}. Inspect private SSM logs.`);
  }
  throw Error('Timed out waiting for SSM deployment; inspect its status before retrying.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  deploy().catch(()=>{console.error('EC2 deployment failed. Inspect the SSM command status and private logs.');process.exitCode=1;});
}

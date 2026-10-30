import {readFileSync} from 'node:fs';
export function databaseOptions(config,env=process.env){
 const cert=env.CHATBOT_CA_CERT||env.POSTGRES_CA_CERT;
 const timeout=Number(env.POSTGRES_CONNECT_TIMEOUT_MS||20000);
 return {connectionString:config.databaseUrl,
  connectionTimeoutMillis:Number.isFinite(timeout)&&timeout>0?timeout:20000,
  ...(cert?{ssl:{rejectUnauthorized:true,ca:readFileSync(cert,'utf8')}}:
   env.POSTGRES_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})};
}

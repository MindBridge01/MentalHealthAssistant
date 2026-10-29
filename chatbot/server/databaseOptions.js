import {readFileSync} from 'node:fs';
export function databaseOptions(config,env=process.env){
  return {connectionString:config.databaseUrl,connectionTimeoutMillis:5000,
    ...(env.CHATBOT_CA_CERT?{ssl:{rejectUnauthorized:true,ca:readFileSync(env.CHATBOT_CA_CERT,'utf8')}}:{})};
}

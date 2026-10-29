import ChatbotApp from '../../../chatbot/src/ChatbotApp.jsx';
import logo from '../../../assets/logo/logolight.png';
import {apiUrl} from '../config/api';
import '../styles/chatbot.css';

async function request(path, options={}) {
  const multipart=options.body instanceof FormData;
  const response=await fetch(apiUrl('/api/chatbot'+path),{
    ...options,credentials:'include',
    headers:multipart?{}:{'Content-Type':'application/json'},
    body:options.body ? multipart ? options.body : JSON.stringify(options.body) : undefined,
  });
  let data;
  try {data=await response.json();} catch {throw Error('The assistant is unavailable. Please try again later.');}
  if(!response.ok) throw Error(data.error||'The request could not be completed.');
  if(path==='/health'&&data.mode!=='connected') throw Error('The assistant is not connected to its knowledge service yet.');
  return data;
}
request.url=path=>apiUrl('/api/chatbot'+path);
export default function ChatbotWorkspace({initialPage='chat'}) {
  return <ChatbotApp request={request} embedded initialPage={initialPage} logoUrl={logo}/>;
}

import {useEffect,useState} from 'react';
import {useNavigate,Link} from 'react-router-dom';
import {apiRequest} from '../../lib/apiClient';
import {useAuth} from '../../context/AuthContext';
import LoginContainer from '../../components/auth/LoginContainer';
import QrCodeView from '../../components/auth/QrCodeView';
import RecoveryCodes from '../../components/auth/RecoveryCodes';
import AuthButton from '../../components/auth/AuthButton';
import '../../components/auth/auth.css';
export default function DoctorMfaSetupPage(){
 const [setup,setSetup]=useState(null),[code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[result,setResult]=useState(null);
 const {setUser}=useAuth(); const navigate=useNavigate();
 useEffect(()=>{apiRequest('/api/auth/mfa/setup',{method:'POST'}).then(setSetup).catch(e=>setError(e.message));},[]);
 async function submit(e){e.preventDefault();setBusy(true);setError('');try{const r=await apiRequest('/api/auth/mfa/verify',{method:'POST',body:{mfaCode:code}});setResult(r);}catch(e){setError(e.message);}finally{setBusy(false);}}
 function done(){const {recoveryCodes,...user}=result;setUser(user);navigate(user.role==='admin'?'/admin/dashboard':user.role==='hospital'?'/hospital/dashboard':'/doctor/dashboard');}
 return <LoginContainer>{result?<RecoveryCodes codes={result.recoveryCodes||[]} onContinue={done}/>:<div className="login-ui__form-wrap"><h1 className="login-ui__title">Protect your account</h1><p className="login-ui__subtitle">MFA is required for professionals, hospital officers and administrators before accessing patient information.</p>{setup && <form onSubmit={submit} className="login-ui__form"><h2>Add MindBridge to your authenticator</h2><QrCodeView {...setup}/><label htmlFor="setup-code">Enter the 6-digit code</label><input id="setup-code" required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)} style={{padding:14,border:'1px solid #cbd5e1',borderRadius:12,fontSize:24,textAlign:'center'}}/><AuthButton type="submit" disabled={busy}>{busy?'Verifying…':'Verify and enable MFA'}</AuthButton></form>}{error && <p role="alert" className="login-ui__message login-ui__message--error">{error}</p>}<Link to="/login">Back to sign in</Link></div>}</LoginContainer>;
}
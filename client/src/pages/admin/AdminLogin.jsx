import BrandLogo from "../../components/BrandLogo.jsx";
import React,{useState} from 'react';
import {Navigate,useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import '../patient/registration.css';
export default function AdminLogin(){
 const {login,logout,isAuthenticated,role}=useAuth();const navigate=useNavigate();const location=useLocation();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const target=typeof location.state?.from==='string'&&/^\/admin\/dashboard(?:\?|$)/.test(location.state.from)?location.state.from:'/admin/dashboard';
 if(isAuthenticated&&role==='admin')return <Navigate to={target} replace/>;
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{const user=await login({email:email.trim().toLowerCase(),password});if(user.role!=='admin'){await logout();throw new Error('This account does not have administrator access.');}navigate(target,{replace:true});}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <main className="registration-page"><header className="registration-topbar"><a className="registration-brand" href="/"><BrandLogo/></a><a href="/login">Member sign in</a></header><div className="registration-intro"><span className="registration-eyebrow">ADMINISTRATION</span><h1>Welcome to your workspace.</h1><p>Sign in with your privately provisioned administrator account.</p></div><div className="registration-layout"><aside className="registration-sidebar"><div className="registration-reassurance"><h3>Access by authorization</h3><p>Administrator accounts are created privately by the platform operator. Public registration cannot grant administrator access.</p></div></aside><form className="registration-form" onSubmit={submit}><h2>Administrator sign in</h2>{error&&<p role="alert">{error}</p>}<fieldset className="registration-fields" disabled={busy}><label className="field"><span>Email address</span><input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="field"><span>Password</span><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label></fieldset><footer className="registration-form-footer"><span className="registration-footnote">Contact your operator if you need access.</span><button className="primary-button" disabled={busy}>{busy?'Signing in…':'Sign in'}</button></footer></form></div></main>;
}

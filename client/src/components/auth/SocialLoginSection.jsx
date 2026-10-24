import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
export default function SocialLoginSection({onCredential,onError}) {
 const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID;
 return <div style={{display:'grid',justifyItems:'center',gap:12,marginTop:12}}><p style={{fontSize:13,color:'#64748b'}}>Patients can also continue with Google</p>{clientId ? <GoogleOAuthProvider clientId={clientId}><GoogleLogin onSuccess={r=>onCredential?.(r.credential)} onError={()=>onError?.('Google sign-in failed. Please try again.')} useOneTap={false}/></GoogleOAuthProvider> : <p style={{fontSize:12,color:'#64748b'}}>Google sign-in is not configured yet. Please use email and password.</p>}</div>;
}
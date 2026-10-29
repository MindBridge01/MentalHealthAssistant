import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import AuthButton from './AuthButton';

export default function SocialLoginSection({ onCredential, onError }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return (
    <div className="login-ui__social">
      <div className="login-ui__divider"><span>or</span></div>
      <div className="login-ui__google">
        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            <GoogleLogin onSuccess={r => onCredential?.(r.credential)}
              onError={() => onError?.('Google sign-in failed. Please try again.')}
              useOneTap={false} text="continue_with" shape="rectangular" size="large" />
          </GoogleOAuthProvider>
        ) : <AuthButton variant="google" disabled>Continue with Google</AuthButton>}
      </div>
      <p className="login-ui__social-note">{clientId ? 'Google sign-in is available for patients.' : 'Google sign-in is not configured yet. Please use email and password.'}</p>
    </div>
  );
}

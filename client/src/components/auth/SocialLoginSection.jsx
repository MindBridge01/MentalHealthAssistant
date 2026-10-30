import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useEffect, useRef, useState } from 'react';
import googleLogo from '../../assets/login/google-logo.svg';

export default function SocialLoginSection({ onCredential, onError, showUnavailable = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(320);
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => setButtonWidth(Math.min(400, Math.floor(entry.contentRect.width))));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  if (!clientId && !showUnavailable) return null;

  return (
    <div className="login-ui__social" ref={containerRef}>
      {clientId ? <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin
          onSuccess={(response) => onCredential?.(response.credential)}
          onError={() => onError?.("Google sign-in failed. Please try again.")}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          size="large"
          width={buttonWidth}
          locale="en"
        />
      </GoogleOAuthProvider> : <button className="login-ui__google-button" type="button" onClick={() => onError?.("Google sign-in is not configured yet. Please sign in with your email and password.")}><img src={googleLogo} width="24" height="24" alt="" />Continue with Google</button>}
      <div className="login-ui__divider">or sign in with email</div>
    </div>
  );
}

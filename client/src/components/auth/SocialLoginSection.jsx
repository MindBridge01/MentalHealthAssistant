import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function SocialLoginSection({ onCredential, onError }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className="login-ui__social">
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin
          onSuccess={(response) => onCredential?.(response.credential)}
          onError={() => onError?.("Google sign-in failed. Please try again.")}
          useOneTap={false}
        />
      </GoogleOAuthProvider>
      <div className="login-ui__divider">Or sign in with email</div>
    </div>
  );
}

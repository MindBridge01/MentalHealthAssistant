import AuthButton from "./AuthButton";

import AuthFooter from "./AuthFooter";
import InputField from "./InputField";
import SocialLoginSection from "./SocialLoginSection";

export default function LoginForm({
  onGoogleCredential, onGoogleError,
  email,
  error,
  isSubmitting,
  onEmailChange,
  onForgotPassword,
  onPasswordChange,
  onRememberChange,
  onSubmit,
  password,
  rememberMe,
  success,
  requiresMfa = false,
  mfaCode = "",
  onMfaCodeChange,
  onBackToLogin,
}) {
  if (requiresMfa) {
    return (
      <div className="login-ui__form-wrap">
        <div className="login-ui__intro">
          <div className="login-ui__mfa-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="login-ui__title">Two-Factor Authentication</h1>
          <p className="login-ui__subtitle">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password).
          </p>
        </div>

        <form className="login-ui__form" noValidate onSubmit={onSubmit}>
          <div style={{ margin: "16px 0" }}>
            <label htmlFor="mfaCode" style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
              Authenticator or recovery code
            </label>
            <input
              id="mfaCode"
              autoFocus
              autoComplete="one-time-code"
              type="text"
              inputMode="text"

              maxLength={20}
              value={mfaCode}
              onChange={onMfaCodeChange}
              placeholder="000000"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "24px",
                letterSpacing: "8px",
                textAlign: "center",
                fontWeight: "700",
                color: "#0f172a",
                border: "2px solid #cbd5e1",
                borderRadius: "12px",
                outline: "none",
                background: "#f8fafc",
              }}
            />
          </div>

          {error ? (
            <div aria-live="assertive" className="login-ui__message login-ui__message--error" role="alert">
              {error}
            </div>
          ) : null}

          <AuthButton disabled={isSubmitting || mfaCode.length < 6} type="submit">
            {isSubmitting ? "Verifying..." : "Verify & Sign In"}
          </AuthButton>

          <button
            type="button"
            onClick={onBackToLogin}
            className="login-ui__link-button"
            style={{ width: "100%", textAlign: "center", marginTop: "16px", color: "#64748b" }}
          >
            &larr; Back to email and password
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-ui__form-wrap">
      <div className="login-ui__intro">
        <h1 className="login-ui__title">Welcome Back</h1>
        <p className="login-ui__subtitle">Sign in to your account. Your dashboard will open automatically.</p>
      </div>

      <form className="login-ui__form" noValidate onSubmit={onSubmit}>
        <InputField
          autoComplete="email"
          id="email"
          label="Email address"
          onChange={onEmailChange}
          placeholder="Enter your registered email"
          type="email"
          value={email}
        />

        <InputField
          autoComplete="current-password"
          id="password"
          label="Password"
          onChange={onPasswordChange}
          placeholder="Enter your password"
          type="password"
          value={password}
        />

        <div className="login-ui__meta">
          <span style={{fontSize:12,color:"#64748b"}}>Staff accounts require MFA</span>

          <button className="login-ui__link-button" onClick={onForgotPassword} type="button">
            Forgot Password
          </button>
        </div>

        {error ? (
          <div aria-live="assertive" className="login-ui__message login-ui__message--error" role="alert">
            {error}
          </div>
        ) : null}

        {success ? (
          <div aria-live="polite" className="login-ui__message login-ui__message--success" role="status">
            {success}
          </div>
        ) : null}

        <AuthButton disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign In"}
        </AuthButton>

        <SocialLoginSection onCredential={onGoogleCredential} onError={onGoogleError}/>
      </form>

      <AuthFooter />
    </div>
  );
}


import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthButton from "./AuthButton";
import AuthFooter from "./AuthFooter";
import InputField from "./InputField";
import SocialLoginSection from "./SocialLoginSection";

export default function LoginForm({
  onGoogleCredential, onGoogleError,
  portalRole = "patient",
  email,
  error,
  isSubmitting,
  onEmailChange,
  onForgotPassword,
  onPasswordChange,
  onSubmit,
  password,
  success,
  requiresMfa = false,
  mfaCode = "",
  onMfaCodeChange,
  onBackToLogin,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  if (searchParams.get('help') === 'access') {
    return <div className="login-ui__form-wrap">
      <div className="login-ui__intro"><p className="login-ui__eyebrow">ACCOUNT ACCESS</p><h2 className="login-ui__title">Need help signing in?</h2><p className="login-ui__subtitle">Password recovery is not available in the current release.</p></div>
      <div className="registration-inline-note">Contact your account administrator for help accessing your account. Never share your password or authenticator code.</div>
      <div className="portal-recovery-action"><AuthButton onClick={() => { const next = new URLSearchParams(searchParams); next.delete('help'); setSearchParams(next); onBackToLogin?.(); }}>Back to sign in</AuthButton></div>
    </div>;
  }

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
          <h2 className="login-ui__title">Verify it’s you.</h2>
          <p className="login-ui__subtitle">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password).
          </p>
        </div>

        <form className="login-ui__form" noValidate onSubmit={onSubmit}>
          <div className="login-ui__field">
            <label htmlFor="mfaCode" className="login-ui__field-label">
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
              className="login-ui__field-input login-ui__mfa-input"
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
        {portalRole === "doctor" && <p className="login-ui__eyebrow">YOUR ACCOUNT</p>}
        <h1 className="login-ui__title">{portalRole === "doctor" ? "Welcome back, professional." : "Welcome back to Mind Bridge."}</h1>
        <p className="login-ui__subtitle">{portalRole === "doctor" ? "Sign in to manage your professional account." : "Sign in to continue your wellbeing journey."}</p>
      </div>

      <SocialLoginSection showUnavailable={portalRole === "patient"} onCredential={onGoogleCredential} onError={onGoogleError}/>
      <form className="login-ui__form" noValidate onSubmit={onSubmit}>
        <InputField
          autoComplete="email"
          id="email"
          label="Email address"
          onChange={onEmailChange}
          placeholder="you@example.com"
          type="email"
          value={email}
        />

        <InputField
          autoComplete="current-password"
          id="password"
          label="Password"
          onChange={onPasswordChange}
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={password}
        />

        <div className="login-ui__meta">
          <button
            className="login-ui__show-password"
            type="button"
            aria-controls="password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((shown) => !shown)}
          >
            {showPassword ? "Hide password" : "Show password"}
          </button>

          <button className="login-ui__link-button" onClick={() => { onForgotPassword?.(); const next = new URLSearchParams(searchParams); next.set('help', 'access'); setSearchParams(next); }} type="button">
            Forgot password?
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </AuthButton>

      </form>

      {portalRole === "doctor" ? <AuthFooter role={portalRole} /> : <p className="login-ui__professional-registration"><Link to="/signup/doctor">Mental health professional? Join our network.</Link></p>}
    </div>
  );
}

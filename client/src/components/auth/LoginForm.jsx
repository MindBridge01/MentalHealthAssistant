import AuthButton from "./AuthButton";
import AuthCheckbox from "./AuthCheckbox";
import AuthFooter from "./AuthFooter";
import InputField from "./InputField";
import SocialLoginSection from "./SocialLoginSection";

export default function LoginForm({
  currentRole,
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
}) {
  return (
    <div className="login-ui__form-wrap">
      <div className="login-ui__intro">
        <h1 className="login-ui__title">Welcome Back</h1>
        <p className="login-ui__subtitle">Welcome back ! Please enter your details.</p>
      </div>

      <form className="login-ui__form" noValidate onSubmit={onSubmit}>
        <InputField
          autoComplete="email"
          id="email"
          label="Email"
          onChange={onEmailChange}
          placeholder="Enter your email"
          type="email"
          value={email}
        />

        <InputField
          autoComplete="current-password"
          id="password"
          label="Password"
          onChange={onPasswordChange}
          placeholder="Enter your password here"
          type="password"
          value={password}
        />

        <div className="login-ui__meta">
          <AuthCheckbox
            checked={rememberMe}
            label="Remember for 30 days"
            name="rememberMe"
            onChange={onRememberChange}
          />

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
          {isSubmitting ? "Please wait..." : "Sign In"}
        </AuthButton>

        <SocialLoginSection />
      </form>

      <AuthFooter currentRole={currentRole} />
    </div>
  );
}

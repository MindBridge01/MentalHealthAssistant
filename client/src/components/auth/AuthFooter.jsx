import { Link } from 'react-router-dom';

export default function AuthFooter() {
  return (
    <div className="login-ui__footer">
      <p>New to MindBridge? Create an account</p>
      <div className="login-ui__signup-links">
        <Link to="/signup/patient">Patient sign up</Link>
        <span aria-hidden="true">·</span>
        <Link to="/signup/doctor">Professional sign up</Link>
      </div>
      <p className="login-ui__staff-note">Hospital officers join by invitation. Administrator accounts are privately provisioned.</p>
    </div>
  );
}

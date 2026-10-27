import { Link } from 'react-router-dom';
export default function AuthFooter({ role = 'patient' }) {
  return <div className="login-ui__footer"><p>New to Mind Bridge? <Link className="login-ui__footer-link" to={`/signup/${role}`}>{role === 'doctor' ? 'Join our care network' : 'Create an account'}</Link></p></div>;
}

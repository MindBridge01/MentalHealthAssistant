import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PortalShell from './PortalShell';
import LandingPolicies from '../sections/LandingExtras/LandingPolicies';
import logo from '../../assets/login/mind-bridge-logo.png';
import './login-page.css';

export default function LoginContainer({ children, role, requiresMfa = false, setup = false }) {
  const { search } = useLocation();
  const [policy, setPolicy] = useState(null);
  const portalRole = role || (new URLSearchParams(search).get('portal') === 'doctor' ? 'doctor' : 'patient');
  if (portalRole === 'patient' && !setup) {
    return <main className="login-ui login-ui--split">
      <div className="login-ui__rounded-shell">
        <aside className="login-ui__brand-panel" aria-label="Welcome to Mind Bridge">
          <p className="login-ui__brand-eyebrow">MIND BRIDGE / YOUR WELLBEING, AT YOUR PACE</p>
          <div className="login-ui__welcome">
            <Link to="/" className="login-ui__brand"><img src={logo} alt="Mind Bridge" width="160" height="171" /></Link>
            <h2>A little space.<br />A fresh start.</h2>
            <p className="login-ui__welcome-copy">Check in with yourself, find support, and take<br className="login-ui__desktop-break" /> your next step — whenever you’re ready.</p>
            <p className="login-ui__brand-footer">Small steps. Meaningful progress.</p>
          </div>
        </aside>
        <section className="login-ui__content-panel" aria-label="Sign in">
          <header className="login-ui__navigation">
            <Link to="/" className="login-ui__wordmark">mindbridge</Link>
            <p>New to Mind Bridge? <Link to="/signup/patient">Create an account</Link></p>
          </header>
          <div className="login-ui__form-region">{children}</div>
          <footer className="login-ui__legal"><span>© Mind Bridge. All rights reserved.</span><div><Link to="/">Back to home</Link><button type="button" onClick={() => setPolicy('privacy')}>Privacy policy</button><Link to="/#questions">Support</Link></div></footer>
        </section>
      </div>
      {policy && <div className="landing-page"><LandingPolicies policy={policy} onClose={() => setPolicy(null)} /></div>}
    </main>;
  }
  return <PortalShell role={portalRole} kind={new URLSearchParams(search).get('help') === 'access' ? 'recovery' : setup ? 'setup' : requiresMfa ? 'mfa' : 'login'} activeStep={requiresMfa || setup ? 1 : 0}>{children}</PortalShell>;
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingPolicies from '../sections/LandingExtras/LandingPolicies';
import logo from '../../assets/login/mind-bridge-logo.png';
import './portal-page.css';

const patientSteps = [
  ['Your account', 'Create your login credentials'],
  ['Your details', 'A little introduction'],
  ['Your care', 'Support on your terms'],
  ['Stay connected', 'Contact preferences'],
  ['Review & submit', 'You’re in control'],
];
const doctorSteps = [
  ['Your account', 'Create your professional account'],
  ['Professional details', 'Tell us about your practice'],
  ['Credentials', 'Upload your qualifications'],
  ['Review & submit', 'Check your application'],
];
const accessSteps = [['Sign in', 'Enter your account details'], ['Verify your identity', 'An extra layer of protection'], ['Your care space', 'Continue to Mind Bridge']];

function Logo({ watermark = false }) {
  return <div className={watermark ? 'portal-logo portal-logo--watermark' : 'portal-logo'} aria-hidden={watermark || undefined}><img src={logo} alt={watermark ? '' : 'Mind Bridge'} /></div>;
}

export default function PortalShell({ children, role = 'patient', kind = 'registration', activeStep = 0, long = false, onBack, backDisabled = false, accountAction }) {
  const [policy, setPolicy] = useState(null);
  const professional = role === 'doctor';
  const access = kind === 'login' || kind === 'mfa' || kind === 'setup' || kind === 'recovery';
  const steps = access ? accessSteps : professional ? doctorSteps : patientSteps;
  const otherRole = professional ? 'patient' : 'doctor';
  const otherPath = access ? `/login?portal=${otherRole}` : `/signup/${otherRole}`;

  return <main className={`portal-page${long ? ' portal-page--long' : ''}`}>
    <Link to="/" className="portal-home"><span aria-hidden="true">‹</span> Back to Home</Link>
    <header className="portal-introduction">
      <p>{kind === 'recovery' ? 'ACCOUNT ACCESS' : professional ? 'JOIN OUR CARE NETWORK' : 'YOUR CARE, AT YOUR PACE'}</p>
      <h1>{kind === 'recovery' ? 'Let’s get you back in.' : professional ? 'Care starts with trust.' : 'Your care starts here.'}</h1>
      <span>{access ? professional ? 'Access your professional account securely.' : 'A little space to reconnect with your care.' : professional ? 'Share your professional details for administrator verification.' : 'A little introduction. A step towards your care space.'}</span>
    </header>
    <div className="portal-card">
      <aside className="portal-sidebar" aria-label={access ? 'Account access progress' : 'Registration progress'}>
        <Logo watermark />
        <Link to="/" className="portal-brand"><Logo /><span>{professional ? 'PROFESSIONAL' : 'PATIENT'} PORTAL</span></Link>
        <ol className="portal-steps">
          {steps.map(([title, description], index) => <li key={title} className={index === activeStep ? 'is-active' : index < activeStep ? 'is-done' : ''} aria-current={index === activeStep ? 'step' : undefined}>
            <span className="portal-step-marker" aria-hidden="true">{index < activeStep ? '✓' : ''}</span>
            <div><strong>{title}</strong>{index === activeStep && <><small>{description}</small><span className="portal-progress-dots" aria-hidden="true"><i /><i /><i /><i /><i /></span></>}</div>
          </li>)}
        </ol>
        <div className="portal-care-note"><strong>{professional ? 'Care starts with trust.' : 'At your own pace.'}</strong><p>{access ? 'Take your next step whenever you’re ready.' : professional ? 'Administrator approval is required before accepting appointments.' : 'Share only what you feel comfortable sharing. Optional fields can be left blank.'}</p></div>
        <div className="portal-sidebar-help">{onBack ? <button type="button" onClick={onBack} disabled={backDisabled}>← Go back</button> : <Link to={access ? '/' : `/login?portal=${role}`}>← Go back</Link>}<a href="/#questions">Need help?</a></div>
      </aside>
      <section className="portal-panel" aria-label={`${professional ? 'Professional' : 'Patient'} ${access ? 'account access' : 'registration'}`}>
        <nav className="portal-navigation" aria-label="Portal navigation"><span>Mind Bridge / {professional ? 'Professional' : 'Patient'} account</span><div>{accountAction}<Link to={otherPath}>{professional ? 'Patient' : 'Professional'} portal →</Link></div></nav>
        <div className="portal-form-region"><div className="portal-form-content">{children}</div></div>
        <footer className="portal-footer"><span>© Mind Bridge</span><div><button type="button" onClick={() => setPolicy('privacy')}>Privacy policy</button><span>·</span><button type="button" onClick={() => setPolicy('terms')}>Terms of use</button></div></footer>
      </section>
    </div>
    {policy && <div className="landing-page"><LandingPolicies policy={policy} onClose={() => setPolicy(null)} /></div>}
  </main>;
}

import { Link } from 'react-router-dom';

export default function Footer({ onOpenPolicy }) {
  return <footer className="landing-footer-pro">
    <div className="landing-footer-brand"><Link to="/" aria-label="MindBridge home"><span className="landing-brand-logo" role="img" aria-label="MindBridge" /></Link><p>AI-assisted reflection, self-guided activities, and a way to connect with professional care.</p></div>
    <nav aria-label="Landing page footer"><a href="#how-it-works">How it works</a><a href="#service-scope">Our approach</a><a href="#privacy">Your information</a><a href="#questions">FAQs</a><Link to="/signup/doctor">For professionals</Link></nav>
    <div className="landing-footer-bottom"><p>© {new Date().getFullYear()} MindBridge.</p><div><button type="button" onClick={() => onOpenPolicy('privacy')}>Privacy notice draft</button><button type="button" onClick={() => onOpenPolicy('terms')}>Terms of use draft</button></div><p>Not an emergency service.</p></div>
  </footer>;
}

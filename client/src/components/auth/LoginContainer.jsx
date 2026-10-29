import BrandLogo from '../BrandLogo';
import wellbeingPhoto from '../../../../assets/login-wellbeing.jpg';

export default function LoginContainer({ children }) {
  return (
    <section className="login-ui" aria-label="MindBridge login">
      <div className="login-ui__shell">
        <div className="login-ui__content">
          <div className="login-ui__brand"><BrandLogo /></div>
          {children}
        </div>
        <aside className="login-ui__visual" aria-label="Welcome to MindBridge">
          <div className="login-ui__visual-heading">
            <span className="login-ui__eyebrow">A little support. A meaningful step.</span>
            <h2>Your wellbeing,<br />one day at a time.</h2>
            <p>A space to reflect, find support, and connect with mental health professionals.</p>
          </div>
          <img className="login-ui__photo" src={wellbeingPhoto} alt="Hands gently holding a blue smiling face" />
          <p className="login-ui__visual-note">You don’t have to take the next step alone.</p>
        </aside>
      </div>
    </section>
  );
}

import hipaaMark from '../../../assets/compliance/hipaa.svg';
import gdprMark from '../../../assets/compliance/gdpr.svg';

export default function TrustSec({ onOpenPolicy }) {
  const items = [
    ['AI conversations', 'Messages you send are processed by MindBridge’s server and its configured AI service. Public access does not mean you should share unnecessary identifying information.'],
    ['Account records', 'Signed-in chat can save conversation history. Registration details and appointment records are used to support the account and booking features.'],
    ['Sharing with others', 'Community posts are visible to other members. Appointment information is used by the relevant provider, hospital, and authorized administrative users.'],
  ];
  return <section id="privacy" className="landing-trust landing-section" aria-labelledby="landing-privacy-title">
    <p className="landing-section-label">06 / PRIVACY AND YOUR INFORMATION</p>
    <div className="landing-section-heading"><h2 id="landing-privacy-title">Know what you’re sharing.</h2><p>Understand how a feature uses information before you decide to use it.</p></div>
    <div className="landing-privacy-grid">{items.map(([title, description]) => <article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
    <div className="landing-privacy-actions"><button type="button" className="landing-text-link" onClick={() => onOpenPolicy('privacy')}>Read the privacy notice draft <span aria-hidden="true">↗</span></button><button type="button" className="landing-text-link" onClick={() => onOpenPolicy('terms')}>Read the terms draft <span aria-hidden="true">↗</span></button></div>
    <details className="landing-compliance-details"><summary>About the HIPAA and GDPR marks</summary><div className="landing-compliance"><img src={hipaaMark} alt="HIPAA compliance mark" width="244" height="80" /><img src={gdprMark} alt="GDPR compliance mark" width="244" height="80" /></div><p>These marks reflect the operator’s stated compliance. They are not independent accreditation. The finalized privacy notice and supporting compliance documentation should explain the applicable scope.</p></details>
  </section>;
}

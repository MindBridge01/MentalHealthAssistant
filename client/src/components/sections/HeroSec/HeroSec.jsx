import { Link } from 'react-router-dom';
import forest from '../../../assets/landing-stock/forest.jpg';
import connection from '../../../assets/landing-stock/connection.jpg';
import coast from '../../../assets/landing-stock/coast.jpg';

export default function HeroSec() {
  return <section className="landing-hero is-revealed landing-hero-pro" aria-labelledby="hero-heading">
    <div className="landing-hero-content">
      <div className="landing-hero-emblem" aria-hidden="true">✳</div>
      <p className="landing-eyebrow">MINDBRIDGE · REFLECT, PRACTISE, CONNECT</p>
      <h1 id="hero-heading"><span className="landing-title-line"><span>Mental-health support.</span></span><em className="landing-title-line"><span>A clear next step.</span></em></h1>
      <p className="landing-hero-description">Explore AI-assisted reflection, self-guided activities, and appointments with doctors, counsellors, and psychologists.</p>
      <div className="landing-actions"><Link className="landing-button landing-button-primary" to="/ai-chat">Try AI chat <span aria-hidden="true">↗</span></Link><Link className="landing-button" to="/patient/doctors">Find a professional <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="landing-hero-gallery" aria-hidden="true">
      <figure className="landing-hero-photo landing-hero-photo-left"><img src={coast} alt="" width="600" height="420" /></figure>
      <figure className="landing-hero-photo landing-hero-photo-center"><img src={connection} alt="" width="700" height="700" fetchPriority="high" /></figure>
      <figure className="landing-hero-photo landing-hero-photo-right"><img src={forest} alt="" width="600" height="800" /></figure>
    </div>
  </section>;
}

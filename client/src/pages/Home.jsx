import React, { useRef, useState } from 'react';
import HeroSec from '../components/sections/HeroSec/HeroSec';
import QuickOptions from '../components/sections/QuickOptions/QuickOptions';
import BreathingActivity from '../components/sections/BreathingActivity/BreathingActivity';
import TrustSec from '../components/sections/TrustSec/TrustSec';
import Footer from '../components/Footer/Footer';
import { HowItWorks, ProductTour, LandingFAQ, FinalInvite, EvidenceAndScope } from '../components/sections/LandingExtras/LandingExtras';
import LandingPolicies from '../components/sections/LandingExtras/LandingPolicies';
import useLandingMotion from '../hooks/useLandingMotion';
import './Home.css';
import './HomeExtras.css';
import './HomeProfessional.css';
import './HomeEditorial.css';

export function Home() {
  const rootRef = useRef(null);
  const [policy, setPolicy] = useState(null);
  useLandingMotion(rootRef);

  return (
    <div ref={rootRef} className="landing-page landing-professional landing-editorial relative w-full">
      <div className="relative z-10 w-full">
        <HeroSec />
        <div className="landing-sections">
          <HowItWorks />
          <QuickOptions />
          <BreathingActivity />
          <ProductTour />
          <EvidenceAndScope />
          <TrustSec onOpenPolicy={setPolicy} />
          <LandingFAQ />
          <FinalInvite />
          <Footer onOpenPolicy={setPolicy} />
          {policy && <LandingPolicies policy={policy} onClose={() => setPolicy(null)} />}
        </div>
      </div>
    </div>
  );
}

export default Home;

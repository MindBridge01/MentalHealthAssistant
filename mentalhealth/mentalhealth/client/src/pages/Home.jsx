import React, { Component } from 'react';
import HeroSec from '../components/sections/HeroSec/HeroSec';
import QuickOptions from '../components/sections/QuickOptions/QuickOptions';
import BreathingActivity from '../components/sections/BreathingActivity/BreathingActivity';
import MotivateSec from '../components/sections/MotivateSec/MotivateSec';
import TrustSec from '../components/sections/TrustSec/TrustSec';
import Footer from '../components/Footer/Footer';

export class Home extends Component {
  render() {
    return (
      <div className="relative w-full overflow-hidden">
        <div className="relative z-10 w-full">
          <HeroSec  />

          <div className="flex flex-col gap-40 items-center justify-center">
            <QuickOptions />
            <BreathingActivity />
            <TrustSec />
            <MotivateSec />
            <Footer />
          </div>
        </div>
      </div>
    );
  }
}

export default Home;

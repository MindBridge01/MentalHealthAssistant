import React, { Component } from 'react';
import HeroSec from '../components/sections/HeroSec/HeroSec';
import QuickOptions from '../components/sections/QuickOptions/QuickOptions';
import BreathingActivity from '../components/sections/BreathingActivity/BreathingActivity';
import MotivateSec from '../components/sections/MotivateSec/MotivateSec';
import TrustSec from '../components/sections/TrustSec/TrustSec';
import Footer from '../components/Footer/Footer';
import Ellipse3 from '../assets/Elipses/Ellipse3.png';
import Ellipse4 from '../assets/Elipses/Ellipse4.png';
import Ellipse5 from '../assets/Elipses/Ellipse5.png';
import hand1 from '../assets/images/hand1.png';
import hand2 from '../assets/images/hand2.png';

export class Home extends Component {
  render() {
    return (
      <div className="relative w-full overflow-hidden">
        {/* Background Design (Centered) */}
        <div className="absolute inset-0 flex justify-center items-center z-[-1] w-full overflow-hidden">
          <div
            className="relative w-[1242px] h-[1242px] bg-cover"
            style={{ backgroundImage: `url(${Ellipse5})`, top: '-200px' }}
          >
            <div
              className="relative w-[1347px] h-[1499px] top-[-1800px] left-[5%] md:left-[138px] bg-cover"
              style={{ backgroundImage: `url(${Ellipse4})`, }}
            >
              <img
                className="absolute w-full max-w-[982px] h-auto top-[300px] left-[10%] md:left-[195px]"
                alt="Ellipse"
                src={Ellipse3}
              />
            </div>
          </div>
        </div>

        {/* Hand 1 (Left) */}
        <img
          className="absolute w-[40%] max-w-[550px] h-auto top-[30%] md:top-60 left-0 opacity-70 animate-float-left"
          alt="Hand 1"
          src={hand1}
        />

        {/* Hand 2 (Right) */}
        <img
          className="absolute w-[45%] max-w-[600px] h-auto top-[10%] md:top-1 right-0 opacity-70 animate-float-right"
          alt="Hand 2"
          src={hand2}
        />

        {/* Main Content */}
        <div className="w-full max-w-screen mx-auto px-4 py-8 relative z-10">
          {/* Sections */}
          <div className="flex flex-col gap-40 items-center justify-center">
            <HeroSec />
            <QuickOptions />
            <BreathingActivity />
            <TrustSec />
            <MotivateSec />
            <Footer />
          </div>
        </div>

        {/* Inline CSS for Animations */}
        <style>{`
          @keyframes floatLeft {
            0% {
              transform: translateY(0) rotate(15deg);
            }
            50% {
              transform: translateY(-20px) rotate(20deg);
            }
            100% {
              transform: translateY(0) rotate(15deg);
            }
          }

          @keyframes floatRight {
            0% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(-5deg);
            }
            100% {
              transform: translateY(0) rotate(0deg);
            }
          }

          .animate-float-left {
            animation: floatLeft 4s ease-in-out infinite;
          }

          .animate-float-right {
            animation: floatRight 4s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }
}

export default Home;

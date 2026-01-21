import React, { Component } from 'react';
import NavBar from '../components/NavBar/NavBar';
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
  constructor(props) {
    super(props);
    this.state = {
      scrollTarget: 0,
      scrollCurrent: 0,
    };
    this.contentRef = React.createRef();
    this.animationFrame = null;
    this.maxScroll = 0;
  }

  componentDidMount() {
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    this.updateMaxScroll(); // Calculate initial maxScroll
    this.animateScroll();
    window.addEventListener('resize', this.updateMaxScroll); // Handle window resize
  }

  componentWillUnmount() {
    window.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.updateMaxScroll);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  updateMaxScroll = () => {
    if (this.contentRef.current) {
      this.maxScroll = this.contentRef.current.scrollHeight - window.innerHeight;
      this.setState(prevState => ({
        scrollTarget: Math.min(prevState.scrollTarget, this.maxScroll),
        scrollCurrent: Math.min(prevState.scrollCurrent, this.maxScroll)
      }));
    }
  };

  handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * 2; // Sensitivity
    this.setState(prevState => {
      const newTarget = prevState.scrollTarget + delta;
      return {
        scrollTarget: Math.max(0, Math.min(newTarget, this.maxScroll))
      };
    });
    if (!this.animationFrame) {
      this.animateScroll();
    }
  };

  animateScroll = () => {
    const { scrollCurrent, scrollTarget } = this.state;
    const ease = 0.08;
    const newScroll = scrollCurrent + (scrollTarget - scrollCurrent) * ease;

    if (this.contentRef.current) {
      this.contentRef.current.style.transform = `translate3d(0, ${-newScroll}px, 0)`;
    }

    this.setState({ scrollCurrent: newScroll });

    if (Math.abs(scrollTarget - newScroll) > 1) {
      this.animationFrame = requestAnimationFrame(this.animateScroll);
    } else {
      this.animationFrame = null;
    }
  };

  render() {
    return (
      <div className="relative w-full overflow-hidden">
        {/* Background Design (Centered) */}
<div className="absolute inset-0 flex justify-center items-center z-[-1] w-full overflow-hidden">
  <div
    className="relative w-[1242px] h-[1242px] bg-cover"
    style={{ backgroundImage: `url(${Ellipse5})`, top: '-200px' }} // shifted up more
  >
    <div
      className="relative w-[1347px] h-[1499px] top-[-1800px] left-[5%] md:left-[138px] bg-cover"
      style={{ backgroundImage: `url(${Ellipse4})`, }} // shifted up more
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
        <div className="w-full h-full max-w-screen overflow-hidden mx-auto px-4 py-8 relative z-10">
          {/* Sticky Navbar */}
          <div className="sticky top-[-10] z-50 flex justify-center bg-transparent">
            <NavBar />
          </div>

          {/* Sections with Smooth Scroll */}
          <div
            ref={this.contentRef}
            className="flex h-full gap-40 flex-col items-center justify-center flex-grow"
          >
            <HeroSec />
            <QuickOptions />
            <BreathingActivity />
            <TrustSec />
            <MotivateSec />
            <Footer />
          </div>
        </div>

        {/* Inline CSS for Animations */}
        <style jsx>{`
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

import React from "react";
import { useInView } from "react-intersection-observer";
import Quickoptioncard from "../../Quickoptioncard/Quickoptioncard";

import emergency from "../../../assets/images/emergency.png";
import community from "../../../assets/images/community.png";
import doctor from "../../../assets/images/doctor.png";

const QuickOptions = () => {
  const [ref1, inView1] = useInView({ triggerOnce: true });
  const [ref2, inView2] = useInView({ triggerOnce: true });
  const [ref3, inView3] = useInView({ triggerOnce: true });

  return (
    <div className="flex flex-col items-center gap-8 sm:gap-16 py-8 sm:py-12 px-4">
      {/* Title and Subtitle */}
      <div className="w-full max-w-[1107px] flex flex-col items-center gap-2 sm:gap-4">
        <h2 className="text-center font-['General_Sans'] font-semibold text-dark-blue900 text-3xl sm:text-5xl">
          Ways to Feel Better
        </h2>
        <p className="text-center font-[Satoshi] font-normal text-dark-blue900 text-lg sm:text-2xl">
          Find help that fits you safe, simple, and here for you
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-wrap justify-center gap-8 sm:gap-16">
        <div
          ref={ref1}
          className={`transition duration-1000 ${
            inView1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Quickoptioncard
            imageSrc={doctor}
            title="Talk to a Doctor"
            description="Connect with a licensed professional for a private consultation—available through video or voice, booked right from the platform."
            buttonText="Meet Doctor"
          />
        </div>
        <div
          ref={ref2}
          className={`transition duration-1000 ${
            inView2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Quickoptioncard
            imageSrc={community}
            title="Join Our Community"
            description="Share your thoughts or find strength in others’ stories—an anonymous, moderated space to connect on the Community page."
            buttonText="Join Community"
          />
        </div>
        <div
          ref={ref3}
          className={`transition duration-1000 ${
            inView3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          } border-2 rounded-[24px] border-red-300`}
        >
          <Quickoptioncard
            imageSrc={emergency}
            title="Call Help Now"
            description="Immediate support, 24/7—reach out anytime"
            buttonText="Get a Call"
          />
        </div>
      </div>
    </div>
  );
};

export default QuickOptions;
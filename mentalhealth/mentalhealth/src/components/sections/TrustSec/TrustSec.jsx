// TrustSec.jsx
import React from "react";
import TrustCard from "../../TrustCard/TrustCard";
import TrustIcon1 from "../../../assets/TrustIcos/TrustIcon1.png";
import TrustIcon2 from "../../../assets/TrustIcos/TrustIcon2.png";
import TrustIcon3 from "../../../assets/TrustIcos/TrustIcon3.png";

const TrustSec = () => {
  return (
    <div className="w-full flex flex-col justify-start items-center gap-4 sm:gap-8 md:gap-16 px-4">
      {/* Header Section */}
      <div className="w-full max-w-[952px] flex flex-col justify-start items-center gap-2 sm:gap-3 md:gap-4">
        <div className="text-center text-slate-800 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold font-['General_Sans']">
          You Can Trust Us
        </div>
        <div className="text-center text-slate-800 text-sm sm:text-base md:text-2xl font-normal font-['Satoshi']">
          We keep you safe and supported, always here for you.
        </div>
      </div>

      {/* Cards Section */}
      <div className="w-full max-w-[952px] flex flex-col justify-start items-center gap-6 sm:gap-8 md:gap-16">
        <TrustCard
          icon={<img src={TrustIcon1} alt="Care icon" className="w-16 h-16 sm:w-20 sm:h-20 md:w-40 md:h-40" />}
          title="Built on Unshaken Care"
          description="Every tool, every word is crafted to hold you gently—your peace is our foundation."
        />
        <TrustCard
          icon={<img src={TrustIcon2} alt="Strength icon" className="w-16 h-16 sm:w-20 sm:h-20 md:w-40 md:h-40" />}
          title="Guarded by Silent Strength"
          description="Your story stays safe with us, locked tight and handled with quiet respect."
        />
        <TrustCard
          icon={<img src={TrustIcon3} alt="Support icon" className="w-16 h-16 sm:w-20 sm:h-20 md:w-40 md:h-40" />}
          title="Always Here for You"
          description="Day or night, our support is steady, ready to lift you when you need it most."
        />
      </div>
    </div>
  );
};

export default TrustSec;

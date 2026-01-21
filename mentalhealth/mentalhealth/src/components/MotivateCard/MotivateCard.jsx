import React from "react";
import Ellipse7 from "../MotivateCard/Ellipse7.png"; // Decorative element

const MotivateCard = ({
  profileImage,
  backgroundImage,
  quote,
  author,
  className = "",
}) => {
  return (
    <div
      className={`relative p-[2px] bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-500 rounded-[36px] shadow-xl w-[1156px] h-[356px] mx-auto ${className}`}
    >
      {/* White inner card */}
      <div className="bg-white rounded-[34px] p-6 sm:p-10 md:p-16 flex flex-col md:flex-row items-start gap-8 relative overflow-hidden h-full">

        {/* Background Image at top-right corner */}
        <img
          src={backgroundImage}
          alt="Background Decoration"
          className="absolute top-0 right-0 w-[250px] md:w-[300px] lg:w-[350px] object-contain opacity-70 z-0"
        />

        {/* Decorative Ellipse image */}
        <img
          src={Ellipse7}
          alt="Ellipse"
          className="absolute top-0 right-10 w-[250px] opacity-30 hidden md:block z-0"
        />

        {/* Gradient light blur */}
        <div className="absolute w-[200px] h-[200px] top-10 right-20 rounded-full blur-[100px] bg-gradient-to-r from-cyan-300 via-indigo-400 to-pink-500 opacity-30 hidden md:block z-0" />

        {/* Profile Image */}
        <div className="z-10 shrink-0">
          <img
            src={profileImage}
            alt="Profile"
            className="w-[120px] h-[120px] md:w-[151px] md:h-[151px] rounded-full object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-4 text-dark-blue900 z-10 max-w-4xl">
          <div className="text-[40px] md:text-[60px] leading-none">“</div>
          <p className="text-lg md:text-2xl font-light leading-relaxed">{quote}</p>
          <div className="text-sm md:text-xl text-[#555555]">— {author}</div>
        </div>
      </div>
    </div>
  );
};

export default MotivateCard;

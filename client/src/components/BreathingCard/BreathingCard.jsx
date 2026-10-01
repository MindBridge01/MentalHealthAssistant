import React from "react";

const BreathingCard = ({ className, title, description, image }) => {
  return (
    <div
      className={`w-full max-w-[672px] flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-8 relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md ${className}`}
    >
      <img
        className="w-[42px] h-[42px] sm:w-[42px] sm:h-[42px]"
        alt="Icon"
        src={image}
      />

      <div className="flex flex-col items-start gap-2 sm:gap-4 relative">
        <p className="text-lg sm:text-2xl font-bold text-[#2d3048] tracking-[0] leading-[normal]">
          {title}
        </p>

        <p className="text-sm sm:text-lg font-[Satoshi] text-dark-blue800 tracking-[0] leading-[normal]">
          {description}
        </p>
      </div>

      <div className="absolute w-[120px] h-[120px] sm:w-[196px] sm:h-[193px] top-[-10px] sm:top-[-17px] left-[60%] sm:left-[443px] rounded-full blur-[50px] sm:blur-[100px] [background:linear-gradient(90deg,rgba(68,222,255,1)_0%,rgba(203,165,209,1)_50%,rgba(227,25,92,1)_75%)] opacity-30" />
    </div>
  );
};

export default BreathingCard;

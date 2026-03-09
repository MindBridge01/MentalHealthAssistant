// TrustCard.jsx
import React from "react";

const TrustCard = ({
  icon,
  title = "Built on Unshaken Care",
  description = "Every tool, every word is crafted to hold you gently—your peace is our foundation.",
  className,
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 md:gap-12 p-4 md:p-6 border-b border-dark-blue100 ${className}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex flex-col w-full md:w-auto items-center md:items-start gap-3 md:gap-4">
        <h3 className="font-['General_Sans'] font-medium text-dark-blue900 text-lg md:text-2xl leading-snug">
          {title}
        </h3>
        <p className="font-['Satoshi'] font-medium text-dark-blue700 text-sm md:text-base leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
};

export default TrustCard;

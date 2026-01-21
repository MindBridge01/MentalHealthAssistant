import React from "react";

const Quickoptioncard = ({
  imageSrc = "default-image.png",
  title = "Option Title",
  description = "Option description goes here.",
  buttonText = "Wanna Talk",
}) => {
  return (
    <div className="flex flex-col h-full w-full max-w-sm items-start gap-6 pt-2 px-4 pb-3 bg-white rounded-3xl shadow-[0px_8px_18px_rgba(231,179,255,0.1),0px_33px_33px_rgba(231,179,255,0.09),0px_74px_45px_rgba(231,179,255,0.05),0px_132px_53px_rgba(231,179,255,0.02)] sm:w-80">
      <img
        className="w-full h-48 object-cover rounded-2xl"
        alt={title}
        src={imageSrc}
      />
      <div className="flex flex-col items-center gap-3 px-3 py-0 w-full h-full">
        <h3 className="font-satoshi font-bold text-dark-blue900 text-xl text-center sm:text-2xl">
          {title}
        </h3>
        <p className="font-satoshi font-normal text-dark-blue900 text-sm text-center sm:text-base">
          {description}
        </p>
      </div>
      <button
        className="relative w-full px-4 py-3 bg-slate-800 rounded-2xl inline-flex justify-center items-center gap-2.5 gradient-stroke-darkblue sm:px-6 sm:py-4"
      >
        <div className="text-white text-sm font-bold font-[Satoshi] sm:text-l">
          {buttonText}
        </div>
      </button>
    </div>
  );
};

export default Quickoptioncard;
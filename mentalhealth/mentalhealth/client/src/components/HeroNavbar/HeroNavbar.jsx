import React from "react";
import { Link } from "react-router-dom";

function AlertIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HeroNavbar({ theme = "light" }) {
  const navItems = [
    { label: "Home", to: "/" },
    { label: "AI Chat", to: "/ai-chat" },
    { label: "Community", to: "/community" },
    { label: "About", to: "/about" },
  ];

  const isLight = theme === "light";
  const borderClass = isLight ? "border-white/25" : "border-black/25";
  const textClass = isLight ? "text-white" : "text-black";
  const hoverTextClass = isLight ? "hover:text-white/75" : "hover:text-black/75";
  const ringClass = isLight ? "focus-visible:ring-white" : "focus-visible:ring-black";
  const logoSrc = isLight ? "/logoBlack&White.png" : "/logoColored.png";

  return (
    <header className={`flex min-h-[101px] w-full items-center gap-6 border-y ${borderClass} ${textClass} lg:gap-[146px]`}>
      <Link to="/" className={`shrink-0 focus:outline-none focus-visible:ring-2 ${ringClass}`}>
        <img src={logoSrc} alt="MindBridge" className="h-[64px] w-[90px] object-contain lg:h-[76px] lg:w-[161px]" />
      </Link>

      <div className={`flex min-h-[101px] flex-1 flex-col gap-5 ${borderClass} py-4 lg:flex-row lg:items-center lg:justify-between lg:border-l lg:py-0`}>
        <nav
          className="flex flex-1 items-center justify-start px-0 lg:h-[101px] lg:justify-end lg:p-[10px]"
          aria-label="Primary navigation"
        >
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`font-['Helvetica_Neue',Helvetica,sans-serif] text-sm font-light leading-[16.8px] tracking-[0.42px] transition duration-200 ${textClass} ${hoverTextClass} focus:outline-none focus-visible:ring-2 ${ringClass}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-[344px] lg:flex-nowrap">
          <Link
            to="/login/patient"
            className={`flex min-h-[40px] flex-1 whitespace-nowrap items-center justify-center rounded-[4px] bg-[#2e2f6b] px-8 py-2 text-center text-base font-medium text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus-visible:ring-2 ${ringClass}`}
          >
            Log In
          </Link>
          <Link
            to="/login/patient"
            className={`inline-flex min-h-[40px] items-center justify-center gap-[10px] rounded-[4px] bg-[#fdd5d3] px-8 py-2 text-base font-medium text-red-600 transition duration-200 hover:bg-[#fac4c1] focus:outline-none focus-visible:ring-2 ${ringClass}`}
          >
            <AlertIcon className="h-6 w-6 text-red-600" />
            <span className="whitespace-nowrap text-red-600">Immediate Support</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

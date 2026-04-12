import React from "react";
import { Link } from "react-router-dom";

import closeIcon from "../../../assets/hero/close-x.svg";
import heroLogo from "../../../assets/hero/hero-logo.svg";
import starIcon from "../../../assets/hero/star.svg";
import heroPortrait from "../../../assets/images/doctor.png";
import heroBackground from "../../../assets/images/post1.jpg";

function QuickReplyButton({ children, to }) {
  return (
    <Link
      to={to}
      className="inline-flex h-[35px] items-center justify-center rounded-full bg-[#2e2f6b] px-3 text-[13px] font-light leading-none text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2e2f6b] sm:text-sm"
    >
      {children}
    </Link>
  );
}

function HeroTopRail() {
  return (
    <div className="grid min-h-[86px] grid-cols-1 border-y border-white/20 text-white md:grid-cols-[1fr_auto_1fr] lg:min-h-[101px]">
      <div className="hidden items-center border-white/20 px-6 md:flex lg:border-r lg:px-[42px]">
        <p className="max-w-[494px] text-[12px] font-light leading-[1.35] tracking-[0.03em] text-white/85 lg:text-sm">
          Private support, reflective tools, and guided next steps when you need a calmer way forward.
        </p>
      </div>

      <div className="flex items-center justify-center px-8 py-4">
        <img src={heroLogo} alt="MindBridge" className="h-[38px] w-[114px] object-contain lg:h-[54px] lg:w-[161px]" />
      </div>

      <div className="hidden items-center justify-center border-white/20 px-6 md:flex lg:border-l">
        <p className="font-serif text-[40px] font-light leading-none text-white/90 lg:text-[56px]">est 2011</p>
      </div>
    </div>
  );
}

function HeroChatCard() {
  return (
    <aside
      className="relative flex min-h-[500px] w-full max-w-[412px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#f2f6fc] px-3 py-2 shadow-[0_24px_56px_rgba(0,0,0,0.28)] sm:min-h-[560px] lg:min-h-[668px]"
      aria-label="MindBridge chat preview"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 pl-3 text-[12px] font-light">
          <span className="text-[rgba(45,46,61,0.5)]">Let’s talk us</span>
          <span className="h-[7px] w-[7px] rounded-full bg-[#2e2f6b]" aria-hidden="true" />
          <span className="text-[#2d2e3d]">Let’s talk us</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center overflow-hidden rounded-full bg-[#282724] p-2 transition duration-200 hover:bg-[#171613] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2f6b] focus-visible:ring-offset-2"
          aria-label="Close chat preview"
        >
          <span className="relative h-[18px] w-[18px]" aria-hidden="true">
            <img src={closeIcon} alt="" className="absolute left-[19.44%] top-[19.44%] h-[80.56%] w-[80.56%]" />
          </span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-[50px] h-[62%] overflow-hidden rounded-[24px]" aria-hidden="true">
        <img src={heroPortrait} alt="" className="h-full w-full object-cover object-[center_38%]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[88px] h-[58%] bg-gradient-to-b from-white/0 via-white/90 to-white" aria-hidden="true" />

      <div className="relative z-10 mt-auto flex flex-col gap-8 pb-3">
        <div className="flex flex-col gap-8 px-3">
          <div className="flex flex-col gap-3 text-[#2e2f3e]">
            <p className="text-[12px] font-light text-[#2d2e3d]">Let’s talk us</p>
            <p className="max-w-[355px] text-[18px] font-light leading-normal text-[#2d2e3d]">
              Hey there! We&apos;re so glad you&apos;re here. Let’s jump into our chat and share some fun ?
            </p>
          </div>

          <div className="flex flex-col items-start gap-[6px]">
            <div className="flex flex-wrap items-start gap-3">
              <QuickReplyButton to="/ai-chat">Where should I start?</QuickReplyButton>
              <QuickReplyButton to="/patient/doctors">What do you do ?</QuickReplyButton>
            </div>
            <QuickReplyButton to="/ai-chat">I have a project</QuickReplyButton>
          </div>
        </div>

        <Link
          to="/ai-chat"
          className="flex min-h-[52px] w-full items-center justify-between rounded-full bg-[#f3f3f3] py-[14px] pl-3 pr-6 text-[#2e2f3e] transition duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2f6b] focus-visible:ring-offset-2"
        >
          <img src={starIcon} alt="" className="h-6 w-6" aria-hidden="true" />
          <span className="text-[18px] font-medium text-[#2e2f3e]">Let’s talk us</span>
        </Link>
      </div>
    </aside>
  );
}

const HeroSec = () => {
  return (
    <section className="w-full overflow-hidden rounded-[32px] bg-white p-2 sm:p-3 lg:p-[14px]" aria-labelledby="hero-heading">
      <div className="relative min-h-[760px] overflow-hidden rounded-[24px] bg-[#282724] text-white lg:min-h-[980px]">
        <img
          src={heroBackground}
          alt="Friends jumping at sunset on a calm beach"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[rgba(40,39,36,0.52)]" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,73,59,0.38)_0%,rgba(34,32,27,0.24)_45%,rgba(0,0,0,0.58)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[760px] w-full max-w-[1593px] flex-col px-4 py-5 sm:px-6 lg:min-h-[980px] lg:px-[25px] lg:py-[22px]">
          <HeroTopRail />

          <div className="grid flex-1 items-end gap-10 py-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,412px)] md:items-center md:gap-8 lg:py-9 xl:gap-[72px]">
            <div className="max-w-[792px] self-end md:pb-8 lg:pb-[84px]">
              <p className="mb-2 text-[24px] font-normal leading-tight tracking-[-0.015em] text-white sm:text-[32px]">
                You are not alone
              </p>
              <h1
                id="hero-heading"
                className="font-serif text-[clamp(4.25rem,14vw,13.5rem)] font-light leading-[0.86] tracking-[-0.035em] text-white"
              >
                Support that feels true to you
              </h1>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/ai-chat"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-6 text-[15px] font-medium text-[#2e2f3e] transition duration-200 hover:bg-[#f3f3f3] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2e2f6b]"
                >
                  Start a chat
                </Link>
                <Link
                  to="/patient/doctors"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/45 px-6 text-[15px] font-medium text-white transition duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2e2f6b]"
                >
                  Meet a doctor
                </Link>
              </div>
            </div>

            <div className="justify-self-center md:justify-self-end">
              <HeroChatCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSec;

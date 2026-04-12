import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../../config/api";
import ChatBubble from "../../ChatBubble/ChatBubble";

import closeIcon from "../../../assets/hero/close-x.svg";
import heroLogo from "../../../assets/hero/hero-logo.svg";
import starIcon from "../../../assets/hero/star.svg";
import heroPortrait from "../../../assets/videos/aiChatVideo.mp4";
import heroVideo from "../../../assets/videos/heroVideo.mp4";

function QuickReplyButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-[35px] items-center justify-center rounded-full bg-[#2e2f6b] px-3 text-[13px] font-light leading-none text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2e2f6b] sm:text-sm"
    >
      {children}
    </button>
  );
}

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

// Layout component for the top navigation bar containing branding, dynamic links, and primary action buttons.
function HeroNavbar() {
  const navItems = [
    { label: "Home", to: "/" },
    { label: "AI Chat", to: "/ai-chat" },
    { label: "Community", to: "/community" },
    { label: "About", to: "/about" },
  ];

  return (
    <header className="flex min-h-[101px] w-full items-center gap-6 border-y border-white/25 text-white lg:gap-[146px]">
      <Link to="/" className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <img src={heroLogo} alt="MindBridge" className="h-[42px] w-[125px] object-contain lg:h-[54px] lg:w-[161px]" />
      </Link>

      <div className="flex min-h-[101px] flex-1 flex-col gap-5 border-white/25 py-4 lg:flex-row lg:items-center lg:justify-between lg:border-l lg:py-0">
        <nav
          className="flex flex-1 items-center justify-start px-0 lg:h-[101px] lg:justify-end lg:p-[10px]"
          aria-label="Primary navigation"
        >
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-['Helvetica_Neue',Helvetica,sans-serif] text-sm font-light leading-[16.8px] tracking-[0.42px] text-white transition duration-200 hover:text-white/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-[344px] lg:flex-nowrap">
          <Link
            to="/login/patient"
            className="flex min-h-[40px] flex-1 items-center justify-center rounded-[4px] bg-[#2e2f6b] px-8 py-2 text-center text-base font-medium text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Log In
          </Link>
          <Link
            to="/login/patient"
            className="inline-flex min-h-[40px] items-center justify-center gap-[10px] rounded-[4px] bg-[#fdd5d3] px-8 py-2 text-base font-medium text-[#f72b25] transition duration-200 hover:bg-[#fac4c1] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <AlertIcon className="h-6 w-6 text-[#f72b25]" />
            <span className="whitespace-nowrap">Immediate Support</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// An interactive preview card that prompts users to engage with the AI Chat.
// It includes a small looping video and an input form that triggers navigation to the chat application.
function HeroChatCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const sendMessage = async (textOverride) => {
    const messageToSend = textOverride || inputText;
    if (!messageToSend.trim()) return;

    const userMessage = { id: Date.now(), role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    const thinkingId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "thinking", content: "Thinking..." },
    ]);

    try {
      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageToSend }),
      });
      const data = await res.json();
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => msg.id !== thinkingId);
        return [...newMessages, { id: Date.now(), role: "assistant", content: data.content || "I didn't quite catch that." }];
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => msg.id !== thinkingId);
        return [...newMessages, { id: Date.now(), role: "assistant", content: "Sorry, I'm having trouble connecting to my servers right now." }];
      });
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const popInAnimation = `
    @keyframes chatPopIn {
      0% { opacity: 0; transform: scale(0.95) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes magicStarFloat {
      0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
      50% { transform: translateY(-2px) rotate(15deg) scale(1.15); }
    }
  `;

  if (!isOpen) {
    return (
      <>
        <style>{popInAnimation}</style>
        <button
          onClick={() => setIsOpen(true)}
          style={{ animation: 'chatPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'center right' }}
          className="ml-auto mt-auto flex items-center justify-center gap-[10px] rounded-full bg-white px-5 py-[14px] shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label="Open AI chat preview"
        >
          <img src={starIcon} alt="" className="h-6 w-6" style={{ animation: 'magicStarFloat 3s ease-in-out infinite' }} aria-hidden="true" />
          <span className="text-[18px] font-medium text-[#2d2e3d] whitespace-nowrap">Let’s talk us</span>
        </button>
      </>
    );
  }

  return (
    <>
      <style>{popInAnimation}</style>
      <aside
        style={{ animation: 'chatPopIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)', transformOrigin: 'bottom right' }}
        className="relative flex h-[500px] w-full max-w-[412px] 2xl:max-w-[500px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#f2f6fc] px-3 py-2 shadow-[0_24px_56px_rgba(0,0,0,0.28)] transition-all duration-500 ease-in-out sm:h-[560px] lg:h-[668px] 2xl:h-[760px]"
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
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center overflow-hidden rounded-full bg-[#282724] p-2 transition duration-200 hover:bg-[#171613] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2e2f6b] focus-visible:ring-offset-2"
            aria-label="Close chat preview"
          >
            <span className="relative h-[18px] w-[18px]" aria-hidden="true">
              <img src={closeIcon} alt="" className="absolute left-[19.44%] top-[19.44%] h-[80.56%] w-[80.56%]" />
            </span>
          </button>
        </div>

        {/* Background video and gradient that disappears when chatting starts */}
        {messages.length === 0 && (
          <div>
            <div className="pointer-events-none absolute inset-x-0 top-[50px] h-[62%] overflow-hidden rounded-[24px]">
              <video
                className="h-full w-full object-cover object-[center_38%]"
                autoPlay
                muted
                loop
                playsInline
              >
                {/* Change this to your desired video source if different from heroVideo */}
                <source src={heroPortrait} type="video/mp4" />
              </video>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-[0px] h-[80%] bg-gradient-to-b from-white/0 via-white/100 to-white" />
          </div>
        )}

        <div className="relative z-10 flex-1 flex flex-col min-h-0 pt-4 pb-3">
          <div ref={scrollContainerRef} className="flex-1 flex flex-col px-3 overflow-y-auto scrollbar-hide py-2">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-8 mt-auto">
                <div className="flex flex-col gap-3 text-[#2e2f3e]">
                  <p className="text-[12px] font-light text-[#2d2e3d]">Let’s talk us</p>
                  <p className="max-w-[355px] text-[18px] font-light leading-normal text-[#2d2e3d]">
                    Hey there! We&apos;re so glad you&apos;re here. Let’s jump into our chat and share some fun ?
                  </p>
                </div>

                <div className="flex flex-col items-start gap-[6px]">
                  <div className="flex flex-wrap items-start gap-3">
                    <QuickReplyButton onClick={() => sendMessage("Where should I start?")}>Where should I start?</QuickReplyButton>
                    <QuickReplyButton onClick={() => sendMessage("What do you do ?")}>What do you do ?</QuickReplyButton>
                  </div>
                  <QuickReplyButton onClick={() => sendMessage("I have a project")}>I have a project</QuickReplyButton>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>

          {/* Chat Input Form: Captures user input and fetches response */}
          <form onSubmit={handleChatSubmit} className="relative flex w-full items-center">
            <div className="pointer-events-none absolute left-4 z-10 flex items-center justify-center">
              <img src={starIcon} alt="" className="h-6 w-6" style={{ animation: 'magicStarFloat 3s ease-in-out infinite' }} aria-hidden="true" />
            </div>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full min-h-[52px] rounded-full bg-[#f3f3f3] py-[14px] pl-[44px] pr-[90px] text-[16px] text-[#2e2f3e] placeholder-[rgba(46,47,62,0.6)] transition duration-200 outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2e2f6b] focus:ring-offset-2"
            />
            <button
              type="submit"
              className="absolute right-2 flex min-h-[36px] items-center justify-center rounded-full bg-[#2e2f6b] px-[18px] text-[14px] font-medium text-white transition duration-200 hover:bg-[#252659] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#2e2f6b]"
            >
              Send
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

// The main landing section of the page. Sets up the full-screen cinematic video background, 
// gradient overlays, and the responsive grid layout holding the large text and the HeroChatCard.
const HeroSec = () => {
  const pageLoadAnimation = `
    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <section className="w-full overflow-hidden bg-white p-0" aria-labelledby="hero-heading">
      <style>{pageLoadAnimation}</style>
      <div
        className="relative min-h-screen md:min-h-screen overflow-hidden text-white"
        style={{ animation: 'fadeSlideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >

        {/* Main section background video */}
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          aria-label="Calming hero background video"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[rgba(40,39,36,0.52)]" aria-hidden="true" />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(74,73,59,0.38)_0%,rgba(34,32,27,0.24)_45%,rgba(0,0,0,0.58)_100%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1593px] 2xl:max-w-[1800px] flex-col px-4 sm:px-6 lg:px-[25px]">
          <div style={{ opacity: 0, animation: 'fadeSlideDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards' }}>
            <HeroNavbar />
          </div>

          <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,412px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(412px,500px)] lg:items-center lg:gap-8 lg:pt-9 lg:pb-4 xl:gap-[72px]">
            <div
              className="max-w-[792px] xl:max-w-[900px] 2xl:max-w-[1100px] self-center md:self-end md:pb-8 lg:pb-[12px]"
              style={{ opacity: 0, animation: 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards' }}
            >
              <p className="mb-2 text-2xl font-normal leading-tight tracking-[-0.015em] text-white sm:text-3xl md:text-[32px]">
                You are not alone
              </p>
              <h1
                id="hero-heading"
                className="heading-beauty text-5xl sm:text-7xl md:text-8xl lg:text-[120px] xl:text-[156px] font-thin leading-[1.05] tracking-[-0.04em] text-white"
                style={{ fontFamily: '"Editor\'s Note"', fontWeight: 50 }}
              >
                Support that feels true to you
              </h1>
            </div>

            <div
              className="justify-self-center lg:justify-self-end self-center lg:self-end w-full max-w-[412px] 2xl:max-w-[500px]"
              style={{ opacity: 0, animation: 'fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards' }}
            >
              <HeroChatCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSec;

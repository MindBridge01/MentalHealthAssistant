import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../../config/api";
import ChatBubble from "../../ChatBubble/ChatBubble";
import WelcomeScreen from "./WelcomeScreen";

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

import HeroNavbar from "../../HeroNavbar/HeroNavbar";
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
      const res = await fetch(apiUrl("/api/public-chat"), {
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
        className={`relative flex h-[500px] w-full max-w-[412px] 2xl:max-w-[500px] flex-col justify-between overflow-hidden rounded-[24px] ${messages.length > 0 ? 'bg-white' : 'bg-[#f2f6fc]'} px-3 py-2 shadow-[0_24px_56px_rgba(0,0,0,0.28)] transition-all duration-500 ease-in-out sm:h-[560px] lg:h-[668px] 2xl:h-[760px]`}
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
            <div className="pointer-events-none absolute left-4 z-20 flex items-center justify-center">
              <img src={starIcon} alt="" className="h-6 w-6" style={{ animation: 'magicStarFloat 3s ease-in-out infinite' }} aria-hidden="true" />
            </div>

            <div className="relative w-full h-[52px] group">
              {/* Outer Blurred Aura that bleeds outside the container */}
              <div className="absolute inset-0 rounded-full overflow-hidden blur-[8px] opacity-0 transition-opacity duration-300 group-focus-within:opacity-75">
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,#4f46e5_0%,#c026d3_25%,#0ea5e9_50%,#c026d3_75%,#4f46e5_100%)]" />
              </div>

              {/* Inner Sharp Border & Input Field */}
              <div className="relative w-full h-full rounded-full p-[2px] overflow-hidden bg-[#f3f3f3] focus-within:bg-white transition-colors duration-200">
                {/* Spinning gradient border layer (perfect square to prevent rotation clipping) */}
                <div className="pointer-events-none absolute top-1/2 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 -translate-y-1/2 animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,#4f46e5_0%,#c026d3_25%,#0ea5e9_50%,#c026d3_75%,#4f46e5_100%)] opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
                
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask me anything..."
                  className="relative z-10 w-full h-full rounded-full bg-[#f3f3f3] group-focus-within:bg-white py-[14px] pl-[42px] pr-[90px] text-[16px] text-[#2e2f3e] placeholder-[rgba(46,47,62,0.6)] outline-none transition-colors duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              className="absolute right-2 z-20 flex min-h-[36px] items-center justify-center rounded-full bg-[#2e2f6b] px-[18px] text-[14px] font-medium text-white transition duration-200 hover:bg-[#252659] focus:outline-none"
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);

  // Fallback reveal mechanism if the welcome screen is removed/absent later
  useEffect(() => {
    if (!showWelcome && !isRevealing) {
      setIsRevealing(true);
    }
  }, [showWelcome, isRevealing]);

  return (
    <>
      {showWelcome && <WelcomeScreen onFadeStart={() => setIsRevealing(true)} onComplete={() => setShowWelcome(false)} />}
      <section className="w-full overflow-hidden bg-white p-0" aria-labelledby="hero-heading">
        {/* The main container scales up smoothly from 0.95 to 1.0 (Zoom in) as the welcome screen vanishes */}
        <div
        className={`relative min-h-screen md:min-h-screen overflow-hidden text-white transition-all duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] ${isRevealing ? 'scale-100 opacity-100' : 'scale-[0.95] opacity-0'}`}
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
          <div className={`transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] delay-300 ${isRevealing ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'}`}>
            <HeroNavbar />
          </div>

          <div className="grid flex-1 gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,412px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(412px,500px)] lg:items-center lg:gap-8 lg:pt-9 lg:pb-4 xl:gap-[72px]">
            <div
              className={`max-w-[792px] xl:max-w-[900px] 2xl:max-w-[1100px] self-center md:self-end md:pb-8 lg:pb-[12px] transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] delay-500 ${isRevealing ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
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
              className={`justify-self-center lg:justify-self-end self-center lg:self-end w-full max-w-[412px] 2xl:max-w-[500px] transition-all duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] delay-[700ms] ${isRevealing ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            >
              <HeroChatCard />
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default HeroSec;

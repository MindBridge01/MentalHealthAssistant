import React, { useState } from "react";
import logolight from '../../assets/logo/logolight.png';

const Sidebar = ({ onNewConversation }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleNewConversation = () => {
    onNewConversation();
  };

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="w-full md:w-96 bg-transparent md:bg-gradient-to-b md:shadow-none border-r-2 border-blue-50 from-blue-50 to-purple-100 h-auto md:h-screen p-4 flex flex-col items-center fixed md:static top-0 left-0 z-10">
      <div className="animate-fadeIn flex flex-col items-center w-full">
        <div className="flex items-center justify-between mb-4 w-full">
          <span
            className="material-icons text-2xl md:text-3xl text-gray-600 cursor-pointer hover:text-gray-800 font-ge"
            onClick={() => window.location.href = '/'}
          >
            chevron_left
          </span>
          <div className="flex-1 flex justify-center">
            <img src={logolight} alt="MindBridge Logo" className="w-12 md:w-24 h-auto" />
          </div>
          <div className="md:hidden">
            <span
              className="material-icons text-2xl text-gray-600 cursor-pointer hover:text-gray-800"
              onClick={toggleNav}
            >
              {isNavOpen ? 'close' : 'menu'}
            </span>
          </div>
        </div>

        {/* New Conversation Button - Desktop Only */}
        <button
          className="hidden w-full md:flex relative px-6 py-4 bg-slate-800 rounded-2xl justify-center items-center gap-2.5 gradient-stroke-darkblue"
          onClick={handleNewConversation}
        >
          <span className="material-icons text-white text-lg">edit</span>
          <div className="text-white text-lg font-bold font-[Satoshi]">
            New Conversation !
          </div>
        </button>
      </div>

      <div className="animate-fadeIn flex-1 hidden md:block"></div>
      <nav
        className={`${isNavOpen ? 'flex' : 'hidden'} md:flex flex-col gap-3.5 items-center px-16 w-full bg-white md:bg-transparent py-2 md:py-0 md:shadow-none absolute md:static top-full left-0 z-20`}
      >
        <div className="w-full flex justify-start">
          <a
            href="#"
            className="font-regular font-[Satoshi] flex items-center gap-6 text-gray-700 hover:text-blue-600 py-2 px-4 md:px-0"
            onClick={() => setIsNavOpen(false)}
          >
            <span className="material-icons">favorite</span>
            Consultations
          </a>
        </div>
        <div className="w-full flex justify-start">
          <a
            href="#"
            className="font-regular font-[Satoshi] flex items-center gap-6 text-gray-700 hover:text-blue-600 py-2 px-4 md:px-0"
            onClick={() => setIsNavOpen(false)}
          >
            <span className="material-icons">help_outline</span>
            Questions
          </a>
        </div>
        <div className="w-full flex justify-start">
          <a
            href="#"
            className="font-regular font-[Satoshi] flex items-center gap-6 text-gray-700 hover:text-blue-600 py-2 px-4 md:px-0"
            onClick={() => setIsNavOpen(false)}
          >
            <span className="material-icons">sports_esports</span>
            Play games
          </a>
        </div>

        {/* New Conversation Button - Mobile Only */}
        <button
          className="md:hidden w-full flex items-center gap-6 text-gray-700 hover:text-blue-600 py-2 px-4"
          onClick={() => {
            handleNewConversation();
            setIsNavOpen(false);
          }}
        >
          <span className="material-icons">edit</span>
          New Conversation !
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
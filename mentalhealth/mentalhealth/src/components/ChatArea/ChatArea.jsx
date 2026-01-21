import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "../ChatBubble/ChatBubble.jsx";
import ChatInput from "../ChatInput/ChatInput.jsx";
import "./ChatArea.css";

const keywordSuggestions = [
  "I feel overwhelmed",
  "I'm anxious",
  "How do I manage stress?",
  "I need someone to talk to",
  "I feel alone",
  "Tips for better sleep?",
  "Help with anxiety",
  "Is this normal?",
  "I'm having a bad day",
];

const getRandomSuggestions = () => {
  const shuffled = [...keywordSuggestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
};

const ChatArea = ({ messages: initialMessages, className }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [showWelcome, setShowWelcome] = useState(true);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const [suggestions] = useState(getRandomSuggestions());

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const hasUserMessage = messages.some(msg => msg.role === "user");

    if (messages.length > 1 && hasUserMessage) {
      if (lastMessage.role === "user") {
        setShowWelcome(true);
      } else {
        setTimeout(() => setShowWelcome(false), 300);
      }
    } else {
      setShowWelcome(true);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (customText = null) => {
    const messageToSend = customText || inputText;
    if (!messageToSend.trim()) return;

    const userMessage = { id: Date.now(), role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    const thinkingId = Date.now() + 1;
    let messageIndex = 0;
    const positiveMessages = [
      "We’re here for you...",
      "Finding the right words...",
      "You’re not alone...",
      "Crafting a warm reply...",
      "Thinking of you...",
      "Help is on the way...",
      "Gathering some hope...",
    ];

    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "thinking", color: "white", content: positiveMessages[messageIndex] },
    ]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % positiveMessages.length;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { id: msg.id, role: "thinking", color: "white", content: positiveMessages[messageIndex] }
            : msg
        )
      );
    }, 2500);

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      clearInterval(interval);
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => msg.id !== thinkingId);
        return [...newMessages, { id: Date.now(), role: "assistant", content: data.content }];
      });
    } catch (error) {
      console.error("Chat error:", error);
      clearInterval(interval);
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => msg.id !== thinkingId);
        return [...newMessages, { id: Date.now(), role: "assistant", content: "Sorry, something went wrong!" }];
      });
    }
  };

  return (
    <div className={`relative h-full flex flex-col bg-gradient-to-b from-purple-50 to-white ${className}`} style={{ position: "relative" }}>
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-purple-50 to-transparent z-10">
<button
  className="absolute top-4 left-256 px-4 py-2 bg-red-600 rounded-2xl flex items-center gap-2.5  hover:bg-red-700"
  onClick={() => alert("SOS Triggered!")}
>

          <span className="material-icons text-white text-lg">report</span>
          <div className="text-white text-lg font-bold font-[Satoshi]">
            SOS Help
          </div>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pt-6 pb-8 space-y-4 md:px-16 lg:px-16 xl:px-32">
        {showWelcome && (
          <div
            className={`animate-fadeIn2 absolute top-1/2 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out text-center text-3xl font-bold text-gray-800 z-10
              ${!showWelcome ? 'opacity-0 -translate-y-8 pointer-events-none' : 'opacity-100 -translate-y-1/2'}`}
          >
            {messages[messages.length - 1]?.role === "user" ? (
              <>Thinking...</>
            ) : (
              <>
                Welcome!
                <br />
                How can I assist you today?
              </>
            )}
          </div>
        )}
        {messages.slice(1).map(message => (
          <ChatBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 flex-col">
        {/* ✅ Keyword Suggestions (above input) */}
        <div className="flex justify-center flex-wrap gap-2 pt-2 pb-1">
          {suggestions.map((keyword, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(keyword)}
              className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm hover:bg-blue-200 transition"
            >
              {keyword}
            </button>
          ))}
        </div>

        <div className="flex justify-center px-3 pb-4 w-full">
          <ChatInput
            className="w-full max-w-2xl animate-fadeIn1"
            messages={messages}
            setMessages={setMessages}
            inputText={inputText}
            setInputText={setInputText}
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
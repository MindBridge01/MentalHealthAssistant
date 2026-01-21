import React, { useState } from "react";
import "./ChatInput.css";

// Mood images (imported as in MoodCard)
import Mood1 from "../../assets/images/Moods/Mood1.png";
import Mood2 from "../../assets/images/Moods/Mood2.png";
import Mood3 from "../../assets/images/Moods/Mood3.png";
import Mood4 from "../../assets/images/Moods/Mood4.png";
import Mood5 from "../../assets/images/Moods/Mood5.png";

// Positive messages for thinking state
const positiveMessages = [
  "We’re here for you...",
  "Finding the right words...",
  "You’re not alone...",
  "Crafting a warm reply...",
  "Thinking of you...",
  "Help is on the way...",
  "Gathering some hope...",
];



const ChatInput = ({ setMessages, className }) => {
  // --- State ---
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // --- Demo Responses with Images ---
  /*const demoResponses = {
    default: {
      content: "Thanks for sharing! I’m here to help—let’s talk. 💙",

    },
  };*/

  // --- Extract Mood ---
 /* const getMoodFromMessages = () => {
    const systemMessage = messages.find((msg) => msg.role === "system");
    if (systemMessage && systemMessage.content.includes("Mood:")) {
      const moodMatch = systemMessage.content.match(/Mood: (\w+)/);
      return moodMatch ? moodMatch[1] : null;
    }
    return null;
  };*/

  // --- Send Message Logic (Demo Mode) ---
  const sendMessage = async () => {
  if (!inputText.trim()) return;

  const userMessage = { id: Date.now(), role: "user", content: inputText };
  setMessages((prev) => [...prev, userMessage]);
  setInputText("");
  setIsThinking(true);

  const thinkingId = Date.now() + 1;
  let messageIndex = 0;
  setMessages((prev) => [
    ...prev,
    { id: thinkingId, role: "thinking", content: positiveMessages[messageIndex] },
  ]);

  const interval = setInterval(() => {
    messageIndex = (messageIndex + 1) % positiveMessages.length;
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === thinkingId
          ? { id: msg.id, role: "thinking", content: positiveMessages[messageIndex] }
          : msg
      )
    );
  }, 2500);

  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: inputText }),
    });

    const data = await res.json();

    clearInterval(interval);
    setIsThinking(false);
    setMessages((prev) => {
      const newMessages = prev.filter((msg) => msg.id !== thinkingId);
      return [...newMessages, { id: Date.now(), role: "assistant", content: data.content }];
    });
  } catch (error) {
    console.error("Chat error:", error);
    clearInterval(interval);
    setIsThinking(false);
    setMessages((prev) => {
      const newMessages = prev.filter((msg) => msg.id !== thinkingId);
      return [...newMessages, { id: Date.now(), role: "assistant", content: "Sorry, something went wrong!" }];
    });
  }
};


  // --- Speech Recognition Logic ---
  const startSpeechRecognition = () => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        setInputText("Sorry, I couldn’t hear you. Please try again.");
      };

      recognition.start();
    } else {
      setInputText("Sorry, your browser doesn’t support voice input.");
    }
  };

  // --- Render ---
  return (
    <div className={`chat-input-container ${isThinking ? "thinking" : ""} ${className}`}>
      <div className="background w-full max-w-2xl">
        <span className="material-icons add-icon" style={{ fontSize: "36px" }}>
          add_circle
        </span>
        <div className="input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="We are here with you, Talk with us!"
            className="chat-input"
          />
        </div>
        <span
          className={`material-icons mic-icon ${isRecording ? "recording" : ""}`}
          style={{ fontSize: "36px" }}
          onClick={startSpeechRecognition}
        >
          mic
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
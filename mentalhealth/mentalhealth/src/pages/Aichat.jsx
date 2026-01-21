import React, { useState } from "react";
import Sidebar from '../components/Sidebar/Sidebar';
import ChatArea from '../components/ChatArea/ChatArea';
import ChatInput from '../components/ChatInput/ChatInput';
import MoodCard from '../components/MoodCard/MoodCard';
import "./Aichat.css"; 

function Aichat() {
  const [messages, setMessages] = useState([
    { id: Date.now(), role: "system", content: "You are a helpful assistant." },
  ]);
  const [showMoodCard, setShowMoodCard] = useState(false);
  const [mood, setMood] = useState(null); // NEW

  const handleNewConversation = async () => {
    if (messages.length > 1) {
      try {
        const response = await fetch("http://localhost:3000/save-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });
        const result = await response.json();
        if (result.success) {
          console.log(`Conversation saved with ID: ${result.conversationId}`);
        } else {
          console.log("No conversation to save");
        }
      } catch (error) {
        console.error("Error saving conversation:", error);
      }
    }
    setShowMoodCard(true);
  };

  const handleMoodSelect = (selectedMood) => {
    console.log(`Mood selected: ${selectedMood}`);
    setMood(selectedMood);
    setMessages([
      {
        id: Date.now(),
        role: "system",
        content: `You are a helpful assistant. Mood: ${selectedMood}`,
      },
    ]);
    setShowMoodCard(false);
  };

  return (
    <div className="relative flex h-screen overflow-hidden">
      <Sidebar onNewConversation={handleNewConversation}/>
      <ChatArea className="h-full w-full animate-fadeIn" messages={messages} mood={mood} />

      {showMoodCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <MoodCard
            onSelectMood={handleMoodSelect}
            onClose={() => setShowMoodCard(false)}
          />
        </div>
      )}
    </div>
  );
}

export default Aichat;

import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { wsUrl } from "../config/api";

const SOCKET_URL = wsUrl();

const CommunityChat = ({ userId, username, room }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { withCredentials: true });
    socketRef.current.emit("joinRoom", { room, userId, username });
    socketRef.current.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socketRef.current.on("roomUsers", setUsers);
    socketRef.current.on("typing", ({ username }) => setTypingUsers((prev) => [...new Set([...prev, username])]));
    socketRef.current.on("stopTyping", ({ username }) => setTypingUsers((prev) => prev.filter((u) => u !== username)));
    socketRef.current.on("roomHistory", setMessages);
    socketRef.current.emit("getRoomHistory", { room });
    return () => {
      socketRef.current.emit("leaveRoom", { room });
      socketRef.current.disconnect();
    };
  }, [room, userId, username]);

  const sendMessage = () => {
    if (input.trim()) {
      socketRef.current.emit("sendMessage", { room, message: input, userId, username });
      setInput("");
      setIsTyping(false);
      socketRef.current.emit("stopTyping", { room, userId, username });
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", { room, userId, username });
    }
    if (e.target.value === "") {
      setIsTyping(false);
      socketRef.current.emit("stopTyping", { room, userId, username });
    }
  };

  return (
    <div className="community-chat">
      <div className="chat-users">Users: {users.map((u) => u.username).join(", ")}</div>
      <div className="chat-messages" style={{ height: 300, overflowY: "auto", border: "1px solid #ccc", marginBottom: 8 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.username}:</b> {msg.message}
          </div>
        ))}
      </div>
      <div className="chat-typing">
        {typingUsers.length > 0 && (
          <span>{typingUsers.join(", ")} typing...</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Type a message..."
          style={{ width: "80%", marginRight: 12, padding: '8px' }}
        />
        <button
          onClick={sendMessage}
          style={{
            backgroundColor: '#2563eb', // Always light blue
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            opacity: input.trim() ? 1 : 0.6,
          }}
          onMouseOver={e => {
            e.target.style.backgroundColor = '#1d4ed8'; // bg-blue-700
          }}
          onMouseOut={e => {
            e.target.style.backgroundColor = '#2563eb'; // bg-blue-600
          }}
          disabled={!input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default CommunityChat;

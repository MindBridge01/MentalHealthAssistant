import React, { useEffect, useRef } from 'react';

const ChatBubble = ({ message }) => {
  const innerRef = useRef();
  
  useEffect(() => {
    innerRef.current.classList.add('fade-in');
  }, []);
  
  const { role, content } = message;
  
  if (role === 'thinking') {
    return (
      <div ref={innerRef} className="w-full max-w-2xl flex justify-start mb-4">
        <div className="max-w-xs p-3 rounded-lg bg-transparent text-blue-900">
          <span className="animate-pulse inline-block transition-opacity duration-500">{content}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={innerRef} className={`${role === 'user' ? 'flex justify-end' : 'flex justify-start'} mb-4`}>
      <div
        className={`${role === 'user' ? 'max-w-xs p-3 rounded-[32px] bg-blue-100 text-blue-900' : 'max-w-2xl p-3 rounded-lg text-blue-900'}`}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatBubble;
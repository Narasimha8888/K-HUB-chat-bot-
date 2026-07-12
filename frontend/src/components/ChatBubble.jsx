import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const ChatBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}
    >
      {isUser ? (
        <div className="bg-primary text-gray-900 px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] font-medium shadow-sm">
          {message.content}
        </div>
      ) : (
        <div className="text-gray-200 max-w-[85%] leading-relaxed pt-2">
          <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-[#0bc284] prose-strong:text-white">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatBubble;

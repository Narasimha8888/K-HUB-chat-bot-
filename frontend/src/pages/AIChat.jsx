import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, GraduationCap, Square } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatBubble from '../components/ChatBubble';
import VoiceInput from '../components/VoiceInput';
import { streamChatResponse, getChatSessionMessages } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialSessionId = searchParams.get('session_id') ? parseInt(searchParams.get('session_id')) : null;
  const [sessionId, setSessionId] = useState(initialSessionId);
  const { t } = useLanguage();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      getChatSessionMessages(initialSessionId)
        .then(data => {
          if (data && data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(console.error);
    } else {
      setSessionId(null);
      setMessages([]);
    }
  }, [initialSessionId]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { id: Date.now(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    abortControllerRef.current = new AbortController();

    await streamChatResponse(
      trimmed,
      sessionId,
      (chunk) => {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
      },
      (newSessionId) => {
        if (!sessionId && newSessionId) {
          setSessionId(newSessionId);
          navigate(`/chat?session_id=${newSessionId}`, { replace: true });
        }
        setIsLoading(false);
      },
      (error) => {
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
          console.log('Chat generation aborted.');
          setIsLoading(false);
          return;
        }
        console.error("Chat error:", error);
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === assistantMsgId 
              ? { ...msg, content: msg.content || t('chat.error') } 
              : msg
          )
        );
        setIsLoading(false);
      },
      abortControllerRef.current.signal
    );
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {messages.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="bg-[#1E1B4B] p-4 rounded-2xl mb-6 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-main mb-3">
                {t('chat.greeting')}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                {t('chat.subtitle')}
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
              {isLoading && messages.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-6">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {t('chat.thinking')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full bg-background border-t border-gray-800 p-4 shrink-0">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chat.inputPlaceholder')}
            className="w-full bg-input border border-gray-800 text-main placeholder-gray-400 rounded-2xl py-4 pl-6 pr-24 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <VoiceInput value={inputValue} onChange={setInputValue} />
            {isLoading ? (
              <button
                onClick={handleCancel}
                title="Cancel (Ctrl+D)"
                className="p-2 bg-gray-800 text-red-500 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-2 bg-primary text-[#ffffff] rounded-full hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 text-[#ffffff]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

const VoiceInput = ({ value, onChange }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const initialValueRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        onChange(initialValueRef.current + (initialValueRef.current && currentTranscript ? ' ' : '') + currentTranscript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      initialValueRef.current = value;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleListening}
      type="button"
      className={`p-2.5 rounded-full transition-colors relative ${
        isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'text-gray-400 hover:text-primary hover:bg-primary/10'
      }`}
      title={isListening ? "Stop voice input" : "Start voice input"}
    >
      {isListening && (
        <motion.div
          className="absolute inset-0 bg-red-500 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      {isListening ? <MicOff className="w-5 h-5 relative z-10" /> : <Mic className="w-5 h-5 relative z-10" />}
    </motion.button>
  );
};

export default VoiceInput;

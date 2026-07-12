import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Loader2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import { streamNotesResponse, getNote } from '../services/api';
import VoiceInput from '../components/VoiceInput';

const SmartNotes = () => {
  const [rawText, setRawText] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      getNote(parseInt(id)).then(data => {
        if (data) {
          setRawText(data.topic || '');
          setNotes(data.content || '');
        }
      }).catch(console.error);
    } else {
      setRawText('');
      setNotes('');
    }
  }, [location.search]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
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

  const handleGenerate = async () => {
    if (!rawText.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');
    setNotes('');

    abortControllerRef.current = new AbortController();

    const onChunk = (chunk) => {
      setNotes((prev) => prev + chunk);
    };

    const onDone = () => {
      setIsGenerating(false);
    };

    const onError = (errMessage) => {
      if (errMessage?.includes('aborted') || errMessage === 'AbortError') {
        console.log('Smart Notes generation aborted.');
        setIsGenerating(false);
        return;
      }
      setError(errMessage || 'Unable to generate notes right now.');
      setIsGenerating(false);
    };

    await streamNotesResponse(rawText.trim(), onChunk, onDone, onError, abortControllerRef.current.signal);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#0f2e26] p-3 rounded-full">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Smart Notes</h1>
          <p className="text-gray-400">Type rough thoughts and have AI structure them into Markdown study notes.</p>
        </div>
      </div>

      <div className="bg-gray-800/30 border border-gray-800 rounded-2xl p-6 mb-8">
        <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3 block">Rough Notes</label>
        <div className="relative mb-4">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g., mitochondria power house, ATP production, outer inner membrane..."
            rows={5}
            disabled={isGenerating || !!notes}
            className="w-full bg-input border-2 border-gray-700 text-white placeholder-gray-600 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-primary transition-colors resize-none disabled:opacity-50"
          />
          <div className="absolute right-2 top-2 flex items-start">
            <VoiceInput value={rawText} onChange={setRawText} />
          </div>
        </div>
        
        {isGenerating ? (
          <button
            onClick={handleCancel}
            title="Cancel (Ctrl+D)"
            className="w-full bg-gray-800 text-red-500 font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-5 h-5 fill-current" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!rawText.trim()}
            className="w-full bg-primary text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0bc284] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Enhance & Format Notes
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {notes && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8">
          <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-[#0bc284] prose-strong:text-white">
            <ReactMarkdown>{notes}</ReactMarkdown>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2 text-primary mt-4 text-sm animate-pulse">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartNotes;

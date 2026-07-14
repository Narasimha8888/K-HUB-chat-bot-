import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Loader2, Square, Download, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLocation, useNavigate } from 'react-router-dom';
import { streamNotesResponse, getNote } from '../services/api';
import VoiceInput from '../components/VoiceInput';

const SmartNotes = () => {
  const [rawText, setRawText] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      getNote(parseInt(id)).then(data => {
        if (data) {
          setRawText(data.topic || '');
          if (data.error) {
            setError(data.error);
            setNotes('');
          } else {
            setError('');
            setNotes(data.content || '');
          }
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

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 700);
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const match = notes.match(/^#\s+(.*)$/m);
    let topicName = match ? match[1].trim() : '';
    if (!topicName) {
      topicName = rawText.trim() ? rawText.trim() : 'smart-notes';
    }
    topicName = topicName.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 50).trim() || 'smart-notes';

    a.download = `${topicName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    const onDone = (noteId) => {
      setIsGenerating(false);
      if (noteId) {
        navigate(`/smart-notes?id=${noteId}`);
      }
    };

    const onError = (errMessage, noteId) => {
      if (errMessage?.includes('aborted') || errMessage === 'AbortError') {
        console.log('Smart Notes generation aborted.');
        setIsGenerating(false);
        return;
      }
      setError(errMessage || 'Unable to generate notes right now.');
      setIsGenerating(false);
      if (noteId) {
        navigate(`/smart-notes?id=${noteId}`);
      }
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
            disabled={isGenerating || !!notes || !!error}
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
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>{error}</p>
          <button
            onClick={() => {
              navigate('/smart-notes');
              setNotes('');
              setRawText('');
              setError('');
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap shrink-0"
          >
            Create New Notes
          </button>
        </div>
      )}

      {notes && (
        <>
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 md:p-8 relative">
            {!isGenerating && (
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <div className="relative">
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center"
                    title="Copy Notes"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {copied && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg flex items-center gap-1.5 whitespace-nowrap z-20">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="font-medium">Copied!</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDownload}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center justify-center"
                  title="Download as DOC"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="prose prose-invert max-w-none prose-headings:text-primary prose-a:text-[#0bc284] prose-strong:text-white pt-10 sm:pt-0">
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

          {!isGenerating && !error && (
            <div className="bg-gray-800/80 border border-gray-700 p-8 rounded-2xl text-center mt-8">
              <h3 className="text-2xl font-bold text-white mb-2">Smart Notes Complete!</h3>
              <p className="text-gray-400">Review your structured notes above.</p>
              <button
                onClick={() => {
                  navigate('/smart-notes');
                  setNotes('');
                  setRawText('');
                  setError('');
                }}
                className="mt-6 bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Create New Notes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SmartNotes;

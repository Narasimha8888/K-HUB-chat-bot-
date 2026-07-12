import React, { useState, useEffect, useRef } from 'react';
import { Layers, Loader2, Square } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { generateFlashcards, getFlashcardSet } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceInput from '../components/VoiceInput';

const FlashcardGenerator = () => {
  const [topic, setTopic] = useState('');
  const [numCards, setNumCards] = useState(3);
  const [flashcards, setFlashcards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const location = useLocation();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      getFlashcardSet(parseInt(id)).then(data => {
        if (data) {
          setTopic(data.topic || '');
          setFlashcards(data.cards || []);
          setNumCards(data.cards?.length || 3);
        }
      }).catch(console.error);
    } else {
      setTopic('');
      setFlashcards([]);
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
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await generateFlashcards(topic.trim(), parseInt(numCards), abortControllerRef.current.signal);
      setFlashcards(response.cards || []);
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('aborted') || err.name === 'AbortError') {
        console.log('Flashcard generation aborted.');
      } else {
        setError(t('flashcards.error'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary p-3 rounded-2xl shrink-0">
          <Layers className="w-8 h-8 text-[#ffffff]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-main mb-1">{t('flashcards.title')}</h1>
          <p className="text-gray-400 text-sm md:text-base">{t('flashcards.subtitle')}</p>
        </div>
      </div>

      {/* Main Generator Card */}
      <div className="bg-card border border-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="mb-6 relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('flashcards.inputPlaceholder')}
            disabled={isGenerating || flashcards.length > 0}
            className="w-full bg-input border border-gray-800 text-main placeholder-gray-500 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-primary transition-all shadow-sm shadow-primary/5 disabled:opacity-50"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <VoiceInput value={topic} onChange={setTopic} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-main">{t('flashcards.numCards')}</span>
          <span className="bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">{numCards}</span>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="flex-1 relative pb-4">
            <input
              type="range"
              min="3"
              max="10"
              value={numCards}
              onChange={(e) => setNumCards(e.target.value)}
              disabled={isGenerating || flashcards.length > 0}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, var(--primary) ${((numCards - 3) / (10 - 3)) * 100}%, var(--text-main) ${((numCards - 3) / (10 - 3)) * 100}%)`
              }}
            />
            <div className="flex justify-between absolute w-full top-5 text-xs text-gray-400 font-medium">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          {isGenerating ? (
            <button
              onClick={handleCancel}
              title="Cancel (Ctrl+D)"
              className="bg-gray-800 hover:bg-gray-700 text-red-500 font-medium py-3 px-8 rounded-full transition-colors shrink-0 -mt-4 shadow-lg flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              Stop
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="bg-primary hover:bg-purple-500 text-[#ffffff] font-medium py-3 px-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 -mt-4 shadow-lg shadow-primary/20"
            >
              {t('flashcards.generate')}
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {flashcards.length > 0 && (
        <div className="space-y-4">
          {flashcards.map((card, index) => (
            <div key={`${card.question}-${index}`} className="bg-card border border-gray-800 rounded-2xl p-5 hover:border-primary/30 transition-colors">
              <p className="font-semibold text-main text-lg">{card.question}</p>
              <div className="w-full h-px bg-gray-800 my-3"></div>
              <p className="text-gray-400">{card.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;

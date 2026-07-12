import React, { useState, useEffect, useRef } from 'react';
import { Layers, Loader2, Square, ChevronLeft, ChevronRight, Shuffle as ShuffleIcon, RotateCw, Bookmark, CheckCircle2, HelpCircle, XCircle, MinusCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateFlashcards, getFlashcardSet, updateFlashcardFeedback } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import VoiceInput from '../components/VoiceInput';

const FlashcardGenerator = () => {
  const [topic, setTopic] = useState('');
  const [numCards, setNumCards] = useState(3);
  const [flashcards, setFlashcards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Interactive Card State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      getFlashcardSet(parseInt(id)).then(data => {
        if (data) {
          setTopic(data.topic || '');
          if (data.error) {
            setError(data.error);
            setFlashcards([]);
          } else {
            setError('');
            setFlashcards(data.cards || []);
            setNumCards(data.cards?.length || 3);
            setCurrentIndex(0);
            setIsFlipped(false);
          }
        }
      }).catch(console.error);
    } else {
      setTopic('');
      setFlashcards([]);
      setCurrentIndex(0);
      setIsFlipped(false);
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

  const handleFeedback = async (status) => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard.id) return; // Skip if ID is missing (should not happen after reload, but just in case)
    
    // Optimistic UI update
    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = { ...currentCard, status };
    setFlashcards(updatedCards);

    try {
      await updateFlashcardFeedback(currentCard.id, { status });
    } catch (err) {
      console.error("Failed to update feedback:", err);
    }
  };

  const handleBookmark = async () => {
    const currentCard = flashcards[currentIndex];
    if (!currentCard.id) return;
    
    const newBookmarkState = !currentCard.is_bookmarked;
    
    // Optimistic UI update
    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = { ...currentCard, is_bookmarked: newBookmarkState };
    setFlashcards(updatedCards);

    try {
      await updateFlashcardFeedback(currentCard.id, { is_bookmarked: newBookmarkState });
    } catch (err) {
      console.error("Failed to update bookmark:", err);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setError('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await generateFlashcards(topic.trim(), parseInt(numCards), abortControllerRef.current.signal);
      setFlashcards(response.cards || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      if (response && response.id) {
        navigate(`/flashcards?id=${response.id}`);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('aborted') || err.name === 'AbortError') {
        console.log('Flashcard generation aborted.');
      } else {
        const errorData = err.response?.data?.error?.message;
        if (errorData && typeof errorData === 'object') {
          setError(errorData.message || t('flashcards.error'));
          if (errorData.id) navigate(`/flashcards?id=${errorData.id}`);
        } else {
          setError(errorData || err.response?.data?.detail || t('flashcards.error'));
        }
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
            disabled={isGenerating || flashcards.length > 0 || !!error}
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
              disabled={isGenerating || flashcards.length > 0 || !!error}
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

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">{error}</p>
          <button
            onClick={() => {
              navigate('/flashcards');
              setFlashcards([]);
              setTopic('');
              setError('');
            }}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap shrink-0 text-sm"
          >
            Create New Flashcards
          </button>
        </div>
      )}

      {flashcards.length > 0 && (
        <div className="flex flex-col items-center">
          {/* Card Container */}
          <div className="w-full max-w-3xl perspective-1000 mb-8">
            <div 
              className={`relative w-full transition-transform duration-500 transform-style-3d cursor-pointer min-h-[400px] ${isFlipped ? 'rotate-y-180' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front side */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col items-center justify-center text-center">
                <span className="text-red-400 font-bold tracking-widest text-sm mb-8 uppercase">Question</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-8">
                  {flashcards[currentIndex].question}
                </h2>
                <div className="mt-auto pt-8">
                  <span className="text-gray-400 text-sm">Click to reveal</span>
                </div>
              </div>

              {/* Back side */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-[#fbeeb8] border border-[#f3e198] rounded-3xl p-8 md:p-12 shadow-xl flex flex-col items-center justify-center text-center rotate-y-180 overflow-y-auto">
                <span className="text-amber-800/60 font-bold tracking-widest text-sm mb-6 uppercase">Answer</span>
                <p className="text-xl md:text-2xl text-amber-900 leading-relaxed font-medium">
                  {flashcards[currentIndex].answer}
                </p>
                <div className="mt-auto pt-6">
                  <span className="text-amber-800/40 text-sm">Click to flip back</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => {
                if (currentIndex > 0) {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
                }
              }}
              disabled={currentIndex === 0}
              className="p-3 md:px-5 md:py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-200 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-6 py-3 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcb4] text-amber-900 transition-colors border border-[#e6d5a1] flex items-center gap-2 font-medium"
            >
              <RotateCw className="w-4 h-4" /> Flip
            </button>
            
            <button 
              onClick={() => {
                setIsFlipped(false);
                setTimeout(() => {
                  const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
                  setFlashcards(shuffled);
                  setCurrentIndex(0);
                }, 150);
              }}
              className="px-6 py-3 rounded-xl bg-[#f4ebd0] hover:bg-[#ebdcb4] text-amber-900 transition-colors border border-[#e6d5a1] flex items-center gap-2 font-medium"
            >
              <ShuffleIcon className="w-4 h-4" /> Shuffle
            </button>

            <button 
              onClick={() => {
                if (currentIndex < flashcards.length - 1) {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
                }
              }}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 md:px-5 md:py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-gray-200 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Section (Visible only when flipped) */}
          <div className={`transition-all duration-300 w-full max-w-2xl ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <div className="bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-gray-400 text-sm font-medium mr-2">How was it?</span>
                    <button 
                      onClick={() => handleFeedback('Easy')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${flashcards[currentIndex].status === 'Easy' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Easy
                    </button>
                    <button 
                      onClick={() => handleFeedback('Medium')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${flashcards[currentIndex].status === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                    >
                      <MinusCircle className="w-4 h-4" /> Medium
                    </button>
                    <button 
                      onClick={() => handleFeedback('Hard')}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${flashcards[currentIndex].status === 'Hard' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                    >
                      <HelpCircle className="w-4 h-4" /> Hard
                    </button>
                    <button 
                      onClick={() => handleFeedback("Didn't Know")}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${flashcards[currentIndex].status === "Didn't Know" ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                    >
                      <XCircle className="w-4 h-4" /> Missed
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleBookmark()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors w-full md:w-auto justify-center ${flashcards[currentIndex].is_bookmarked ? 'bg-primary/20 border-primary text-primary' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                  >
                    <Bookmark className={`w-4 h-4 ${flashcards[currentIndex].is_bookmarked ? 'fill-current' : ''}`} /> 
                    {flashcards[currentIndex].is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                </div>
             </div>
          </div>

          {!isGenerating && !error && (
            <div className="w-full bg-gray-800/80 border border-gray-700 p-8 rounded-2xl text-center mt-12">
              <h3 className="text-xl font-bold text-white mb-2">Want to study another topic?</h3>
              <p className="text-gray-400 mb-6">You've completed this set of {flashcards.length} cards.</p>
              <button
                onClick={() => {
                  navigate('/flashcards');
                  setFlashcards([]);
                  setTopic('');
                  setError('');
                }}
                className="bg-gray-700 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Create New Flashcards
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardGenerator;

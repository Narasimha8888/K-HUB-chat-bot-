import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Loader2, CheckCircle2, XCircle, Square } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateQuiz, getQuiz, submitQuiz } from '../services/api';
import VoiceInput from '../components/VoiceInput';

const QuizGenerator = () => {
  const [topic, setTopic] = useState('');
  const [quizType, setQuizType] = useState('Multiple Choice Questions (MCQ)');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(5);
  
  const [quizData, setQuizData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  
  // Interactive quiz state
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      getQuiz(parseInt(id)).then(data => {
        if (data) {
          setTopic(data.topic || '');
          if (data.error) {
            setError(data.error);
            setQuizData(null);
            setUserAnswers({});
            setShowResults(false);
          } else {
            setError('');
            setQuizData(data);
            
            // Load user answers from history if they exist
            const savedAnswers = {};
            if (data.questions) {
               data.questions.forEach(q => {
                 if (q.user_answer !== undefined && q.user_answer !== null) {
                   savedAnswers[q.id] = q.user_answer;
                 }
               });
            }
            setUserAnswers(savedAnswers);
            setShowResults(data.is_submitted === 1);
          }
        }
      }).catch(console.error);
    } else {
      setTopic('');
      setQuizData(null);
      setUserAnswers({});
      setShowResults(false);
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
    setQuizData(null);
    setUserAnswers({});
    setShowResults(false);

    abortControllerRef.current = new AbortController();

    try {
      const response = await generateQuiz({
        topic: topic.trim(),
        quiz_type: quizType,
        difficulty: difficulty,
        total_questions: parseInt(totalQuestions, 10)
      }, abortControllerRef.current.signal);
      setQuizData(response);
      if (response && response.id) {
        navigate(`/quiz?id=${response.id}`);
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message?.includes('aborted') || err.name === 'AbortError') {
        console.log('Quiz generation aborted.');
      } else {
        const errorData = err.response?.data?.error?.message;
        if (errorData && typeof errorData === 'object') {
          setError(errorData.message || 'Unable to create a quiz right now.');
          if (errorData.id) navigate(`/quiz?id=${errorData.id}`);
        } else {
          setError(errorData || err.response?.data?.detail || 'Unable to create a quiz right now.');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (questionId, selectedAnswer) => {
    if (showResults) return; // Prevent changing after submission
    setUserAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }));
  };

  const handleSubmit = async () => {
    setShowResults(true);
    if (quizData && quizData.id) {
      try {
        await submitQuiz(quizData.id, userAnswers);
      } catch(err) {
        console.error("Failed to save quiz answers to history:", err);
      }
    }
  };

  const renderQuestion = (q) => {
    const isAnswered = userAnswers[q.id] !== undefined;
    const userAnswer = userAnswers[q.id];
    
    // Function to flexibly check if an option matches the correct answer
    const checkIsCorrect = (opt, correctAns) => {
      if (opt === undefined || opt === null || correctAns === undefined || correctAns === null) return false;
      const optStr = String(opt).trim();
      const ansStr = String(correctAns).trim();
      if (optStr === ansStr) return true;
      if (optStr.toLowerCase() === ansStr.toLowerCase()) return true;
      if (optStr.startsWith(ansStr + ')') || optStr.startsWith(ansStr + '.') || optStr.startsWith(ansStr + ' ')) return true;
      return false;
    };

    const isCorrect = checkIsCorrect(userAnswer, q.answer);

    return (
      <div key={q.id} className="bg-gray-800/40 border border-gray-800 rounded-xl p-5">
        <p className="font-semibold text-main mb-4 text-lg">{q.question}</p>
        
        {/* MCQ Options */}
        {q.options && q.options.length > 0 && (
          <div className="space-y-3">
            {q.options.map((option, idx) => {
              let optionClass = "border-gray-700 hover:border-primary/50 text-main";
              
              if (userAnswer === option) {
                optionClass = "border-primary bg-primary/10 text-main";
              }
              
              if (showResults) {
                const isThisOptionCorrect = checkIsCorrect(option, q.answer);

                if (isThisOptionCorrect) {
                  optionClass = "border-[#0bc284] bg-[#0bc284]/20 text-main"; // Correct answer highlighted green
                } else if (userAnswer === option && !isCorrect) {
                  optionClass = "border-red-500 bg-red-500/20 text-main"; // Wrong answer highlighted red
                } else {
                  optionClass = "border-gray-800 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(q.id, option)}
                  disabled={showResults}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${optionClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* True/False or Fill in Blanks */}
        {(!q.options || q.options.length === 0) && (
          <div className="mt-4">
            <input
              type="text"
              placeholder="Type your answer here..."
              value={userAnswer || ''}
              onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
              disabled={showResults}
              className="w-full bg-input border-2 border-gray-700 text-main rounded-xl py-3 px-4 focus:outline-none focus:border-primary"
            />
          </div>
        )}

        {/* Results / Explanations */}
        {showResults && (
          <div className={`mt-5 p-4 rounded-xl flex gap-3 items-start ${isCorrect ? 'bg-[#0bc284]/10 border border-[#0bc284]/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {isCorrect ? <CheckCircle2 className="w-6 h-6 text-[#0bc284] shrink-0" /> : <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
            <div>
              <p className={`font-semibold ${isCorrect ? 'text-[#0bc284]' : 'text-red-500'}`}>
                {isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${q.answer}`}
              </p>
              {q.explanation && (
                <p className="text-main text-sm mt-2 leading-relaxed">{q.explanation}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#0f2e26] p-3 rounded-full">
          <HelpCircle className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-main mb-1">Quiz Generator</h1>
          <p className="text-gray-400">Generate interactive quizzes on any educational topic.</p>
        </div>
      </div>

      <div className="bg-gray-800/30 border border-gray-800 rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-3">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Topic</label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter a topic (e.g. World War II, Photosynthesis)"
                disabled={isGenerating || !!quizData || !!error}
                className="w-full bg-input border-2 border-gray-700 text-main placeholder-gray-600 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                <VoiceInput value={topic} onChange={setTopic} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Quiz Type</label>
            <select
              value={quizType}
              onChange={(e) => setQuizType(e.target.value)}
              disabled={isGenerating || !!quizData || !!error}
              className="w-full bg-input border-2 border-gray-700 text-main rounded-xl py-3 px-4 focus:outline-none focus:border-primary appearance-none disabled:opacity-50"
            >
              <option value="Multiple Choice Questions (MCQ)">Multiple Choice</option>
              <option value="True / False">True / False</option>
              <option value="Fill in the Blanks">Fill in the Blanks</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={isGenerating || !!quizData || !!error}
              className="w-full bg-input border-2 border-gray-700 text-main rounded-xl py-3 px-4 focus:outline-none focus:border-primary appearance-none disabled:opacity-50"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 block">Questions</label>
            <select
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              disabled={isGenerating || !!quizData || !!error}
              className="w-full bg-input border-2 border-gray-700 text-main rounded-xl py-3 px-4 focus:outline-none focus:border-primary appearance-none disabled:opacity-50"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>
        </div>

        {isGenerating ? (
          <button
            onClick={handleCancel}
            title="Cancel (Ctrl+D)"
            className="w-full bg-gray-800 text-red-500 font-bold py-3 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <Square className="w-5 h-5 fill-current" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={!topic.trim()}
            className="w-full bg-primary text-gray-900 font-bold py-3 rounded-xl hover:bg-[#0bc284] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            Generate Quiz
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>{error}</p>
          <button
            onClick={() => {
              navigate('/quiz');
              setQuizData(null);
              setUserAnswers({});
              setShowResults(false);
              setTopic('');
              setError('');
            }}
            className="bg-gray-800 text-main px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap shrink-0"
          >
            Create New Quiz
          </button>
        </div>
      )}

      {quizData && quizData.questions && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-main">
              {quizData.topic} <span className="text-gray-500 font-normal text-base ml-2">({quizData.difficulty})</span>
            </h2>
          </div>

          <div className="space-y-6">
            {quizData.questions.map(renderQuestion)}
          </div>

          {!showResults && (
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors mt-8"
            >
              Submit Answers
            </button>
          )}

          {showResults && (
            <div className="bg-gray-800/80 border border-gray-700 p-8 rounded-2xl text-center mt-8">
              <h3 className="text-2xl font-bold text-main mb-2">Quiz Complete!</h3>
              <p className="text-main">Review your answers and explanations above.</p>
              <button
                onClick={() => {
                  navigate('/quiz');
                  setQuizData(null);
                  setUserAnswers({});
                  setShowResults(false);
                  setTopic('');
                }}
                className="mt-6 bg-gray-700 text-main px-8 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium"
              >
                Create New Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import PDFSummarizer from './pages/PDFSummarizer';
import FlashcardGenerator from './pages/FlashcardGenerator';
import QuizGenerator from './pages/QuizGenerator';
import SmartNotes from './pages/SmartNotes';

import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="chat" element={<AIChat />} />
            <Route path="pdf-summarizer" element={<PDFSummarizer />} />
            <Route path="flashcards" element={<FlashcardGenerator />} />
            <Route path="quiz" element={<QuizGenerator />} />
            <Route path="smart-notes" element={<SmartNotes />} />
            {/* Add other routes here as they are developed */}
            <Route path="*" element={
              <div className="h-full flex items-center justify-center text-gray-400">
                Page Under Construction
              </div>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

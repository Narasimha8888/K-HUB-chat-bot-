import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, FileText, Layers, HelpCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const studyTools = [
    {
      title: t('sidebar.pdfSummarizer'),
      description: t('dashboard.pdfDesc'),
      icon: <FileText className="w-6 h-6 text-main" />,
      path: '/pdf-summarizer'
    },
    {
      title: t('sidebar.flashCards'),
      description: t('dashboard.flashCardsDesc'),
      icon: <Layers className="w-6 h-6 text-main" />,
      path: '/flashcards'
    },
    {
      title: t('sidebar.quiz'),
      description: t('dashboard.quizDesc'),
      icon: <HelpCircle className="w-6 h-6 text-main" />,
      path: '/quiz'
    },
    {
      title: t('sidebar.smartNotes'),
      description: t('dashboard.smartNotesDesc'),
      icon: <BookOpen className="w-6 h-6 text-main" />,
      path: '/smart-notes'
    }
  ];

  return (
    <div className="h-full flex flex-col items-center pt-24 px-6 overflow-y-auto w-full">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center max-w-2xl text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-main mb-4 tracking-tight">
          {t('dashboard.title')} <span className="text-primary">{t('sidebar.studyMode')}</span>
        </h1>
        
        <p className="text-gray-500 mb-8 text-lg">
          {t('dashboard.subtitle')}
        </p>
        
        <button 
          onClick={() => navigate('/chat')}
          className="bg-primary hover:bg-purple-500 text-white font-semibold py-3 px-6 rounded-full transition-colors shadow-lg shadow-primary/25 flex items-center gap-2"
        >
          <GraduationCap className="w-5 h-5" />
          {t('dashboard.newChat')}
        </button>
      </motion.div>

      {/* Study Tools Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-5xl"
      >
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">
          {t('dashboard.studyTools')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
          {studyTools.map((tool, index) => (
            <div 
              key={tool.title}
              className="bg-card border border-gray-800 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 group"
            >
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                {tool.icon}
              </div>
              <h3 className="font-bold text-main text-lg mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};

export default Dashboard;

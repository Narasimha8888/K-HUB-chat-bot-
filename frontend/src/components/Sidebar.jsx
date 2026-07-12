import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, MessageSquare, FileText, Layers, HelpCircle, BookOpen, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getHistory, deleteHistoryItem } from '../services/api';

const Sidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [recents, setRecents] = useState([]);

  const handleDelete = async (e, type, id) => {
    e.stopPropagation();
    try {
      await deleteHistoryItem(type, id);
      setRecents(prev => prev.filter(item => !(item.type === type && item.id === id)));
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  useEffect(() => {
    // Fetch history when location changes to keep it updated!
    getHistory().then(setRecents).catch(console.error);
  }, [location.pathname, location.search]);

  const navItems = [
    { name: t('sidebar.aiChat'), icon: MessageSquare, path: '/chat' },
    { name: t('sidebar.pdfSummarizer'), icon: FileText, path: '/pdf-summarizer' },
    { name: t('sidebar.flashCards'), icon: Layers, path: '/flashcards' },
    { name: t('sidebar.quiz'), icon: HelpCircle, path: '/quiz' },
    { name: t('sidebar.smartNotes'), icon: BookOpen, path: '/smart-notes' },
  ];

  return (
    <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-sidebar h-full flex flex-col border-r border-gray-800 text-gray-200 shrink-0`}>
      <div 
        onClick={() => navigate('/')}
        className={`p-4 flex items-center mt-2 cursor-pointer ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}
      >
        <div className="bg-primary/20 p-2 rounded-full flex items-center justify-center shrink-0">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight text-white whitespace-nowrap">{t('sidebar.studyMode')}</h1>}
      </div>

      <div className={`mt-6 ${isSidebarOpen ? 'px-4' : 'px-3 flex justify-center'}`}>
        <button
          onClick={() => navigate('/chat')}
          className={`bg-gray-800/50 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg flex items-center justify-center transition-colors border border-gray-700
            ${isSidebarOpen ? 'w-full px-4 gap-3' : 'w-12 h-12'}`}
          title={t('sidebar.newChat')}
        >
          <Plus className={`w-5 h-5 text-gray-400 ${isSidebarOpen ? '' : 'shrink-0'}`} />
          {isSidebarOpen && <span>{t('sidebar.newChat')}</span>}
        </button>
      </div>

      <nav className={`mt-8 space-y-1 ${isSidebarOpen ? 'px-4' : 'px-3 flex flex-col items-center'}`}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.name}
            className={({ isActive }) =>
              `flex items-center rounded-lg transition-colors font-medium text-sm
              ${isSidebarOpen ? 'gap-3 px-3 py-2.5 w-full' : 'justify-center w-12 h-12 mb-1'}
              ${isActive ? 'bg-gray-800/80 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/40'}`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Recents Section */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide mt-6 ${isSidebarOpen ? 'px-4' : 'px-2 flex flex-col items-center'}`}>
        {isSidebarOpen && (
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            {t('sidebar.recents')}
          </h3>
        )}
        <div className="space-y-1">
          {recents.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer text-gray-400 hover:text-white hover:bg-gray-800/40 transition-colors
                ${isSidebarOpen ? 'w-full' : 'justify-center w-12 h-12 mb-1'}`}
              title={item.title}
            >
              {item.type === 'chat' && <MessageSquare className="w-4 h-4 shrink-0" />}
              {item.type === 'pdf-summarizer' && <FileText className="w-4 h-4 shrink-0" />}
              {item.type === 'flashcards' && <Layers className="w-4 h-4 shrink-0" />}
              {item.type === 'quiz' && <HelpCircle className="w-4 h-4 shrink-0" />}
              {item.type === 'smart-notes' && <BookOpen className="w-4 h-4 shrink-0" />}
              {isSidebarOpen && (
                <>
                  <span className="text-sm truncate flex-1">{item.title}</span>
                  <button 
                    onClick={(e) => handleDelete(e, item.type, item.id)}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700/50 rounded transition-colors shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={`p-4 border-t border-gray-800 shrink-0 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
        <p className="text-xs text-gray-600 font-medium whitespace-nowrap">
          {isSidebarOpen ? t('sidebar.version') : 'v1'}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;

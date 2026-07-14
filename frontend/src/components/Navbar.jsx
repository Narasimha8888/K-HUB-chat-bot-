import React, { useState, useRef, useEffect } from 'react';
import { PanelLeft, Sun, Moon, LogOut, Settings, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = ({ toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLangChange = (lang) => {
    changeLanguage(lang);
    setIsDropdownOpen(false);
  };

  return (
    <div className="h-14 border-b border-gray-800 bg-background flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-400 hover:text-main rounded-md hover:bg-gray-800/50 transition-colors"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-gray-400 hover:text-main rounded-md hover:bg-gray-800/50 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-8 h-8 bg-primary text-[#ffffff] rounded-full flex items-center justify-center font-bold text-sm shadow-sm hover:ring-2 ring-primary/50 transition-all"
          >
            SM
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-gray-800 rounded-lg shadow-xl py-1 z-50">
              <div className="px-4 py-3 border-b border-gray-800">
                <p className="text-sm font-medium text-main">{t('navbar.profile')}</p>
                <p className="text-xs text-gray-400 truncate">{t('navbar.guestLearner')}</p>
              </div>
              
              <div className="py-2">
                <div className="px-4 py-2 flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 mr-2" />
                  {t('navbar.language')}
                </div>
                <button 
                  onClick={() => handleLangChange('en')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center ${language === 'en' ? 'text-main bg-gray-800/30' : 'text-gray-400 hover:bg-gray-800/20'}`}
                >
                  {language === 'en' ? <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> : <span className="w-1.5 h-1.5 mr-2"></span>}
                  {t('navbar.english')}
                </button>
                <button 
                  onClick={() => handleLangChange('te')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center ${language === 'te' ? 'text-main bg-gray-800/30' : 'text-gray-400 hover:bg-gray-800/20'}`}
                >
                  {language === 'te' ? <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> : <span className="w-1.5 h-1.5 mr-2"></span>}
                  {t('navbar.telugu')}
                </button>
                <button 
                  onClick={() => handleLangChange('hi')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center ${language === 'hi' ? 'text-main bg-gray-800/30' : 'text-gray-400 hover:bg-gray-800/20'}`}
                >
                  {language === 'hi' ? <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span> : <span className="w-1.5 h-1.5 mr-2"></span>}
                  {t('navbar.hindi')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

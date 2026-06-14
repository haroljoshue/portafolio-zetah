import { useState, useEffect } from 'react';
import PublicPortfolio from './components/PublicPortfolio.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { Language } from './utils/translations.ts';

type ViewMode = 'public' | 'admin';
type ThemeMode = 'light' | 'dark';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('public');
  
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('zetah_theme');
    return (saved as ThemeMode) || 'dark';
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('zetah_lang');
    return (saved as Language) || 'es';
  });

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zetah_theme', theme);
  }, [theme]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('zetah_lang', language);
  }, [language]);

  return (
    <>
      {viewMode === 'public' ? (
        <PublicPortfolio 
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onOpenAdmin={() => setViewMode('admin')} 
        />
      ) : (
        <AdminPanel 
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          setTheme={setTheme}
          onCloseAdmin={() => setViewMode('public')} 
        />
      )}
    </>
  );
}

export default App;

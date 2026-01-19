import React, { useState, useEffect } from 'react';
import { Tracker } from './Tracker';
import { Auth } from './Auth';
import { SplashScreen } from './SplashScreen';
import { Language } from '../types';
import { Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 1. Theme
    const savedTheme = localStorage.getItem('zenfinance_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // 2. Language
    const savedLanguage = localStorage.getItem('zenfinance_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'bn')) {
      setLanguage(savedLanguage as Language);
    }
    
    // 3. Sound
    const savedSound = localStorage.getItem('zenfinance_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    // 4. Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('zenfinance_language', newLang);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('zenfinance_theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('zenfinance_sound', String(newState));
  };

  // Data Management Functions
  const handleClearAllData = async () => {
    if (!session) return;
    
    // UI Confirmation is handled in CategorySettings.tsx. 
    // Proceed directly to delete.
    const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', session.user.id);
    
    if (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data: ' + error.message);
    } else {
        // Reload to clear local state and refetch empty data
        window.location.reload();
    }
  };

  const handleExportData = () => {
    alert("Export feature coming soon for Cloud Sync.");
  };

  const handleImportData = (file: File) => {
    alert("Import feature coming soon for Cloud Sync.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
     );
  }

  // Show Auth if no session
  if (!session) {
    return <Auth />;
  }

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} soundEnabled={soundEnabled} />
      ) : (
        <Tracker 
          key={session.user.id} // Force re-render on user change
          userId={session.user.id} // Changed prop name to distinct userId from profileId
          profileName={session.user.email?.split('@')[0] || 'User'}
          onLogout={handleLogout} // Dedicated logout prop
          language={language}
          onLanguageChange={handleLanguageChange}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          onClearAllData={handleClearAllData}
          onExportData={handleExportData}
          onImportData={handleImportData}
        />
      )}
    </>
  );
};

export default App;
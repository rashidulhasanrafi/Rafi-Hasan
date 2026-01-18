import React, { useState, useEffect } from 'react';
import { Tracker } from './Tracker';
import { ProfileManager } from './ProfileManager';
import { Profile, Language } from '../types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize App: Load profiles, settings, migrate old data if needed
  useEffect(() => {
    // Load Dark Mode preference
    const savedTheme = localStorage.getItem('zenfinance_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    const savedLanguage = localStorage.getItem('zenfinance_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'bn')) {
      setLanguage(savedLanguage as Language);
    }
    
    // Load Sound Preference
    const savedSound = localStorage.getItem('zenfinance_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    const initializeData = () => {
      const savedProfilesStr = localStorage.getItem('zenfinance_profiles');
      let loadedProfiles: Profile[] = [];
      let loadedActiveId: string | null = null;

      if (savedProfilesStr) {
        try {
          loadedProfiles = JSON.parse(savedProfilesStr);
        } catch (e) {
          console.error("Failed to parse profiles", e);
          loadedProfiles = [];
        }
      }

      // If no profiles found (fresh install or corrupted storage), create default
      if (!loadedProfiles || loadedProfiles.length === 0) {
        const defaultId = crypto.randomUUID();
        const defaultProfile = { id: defaultId, name: 'Personal' };
        
        // Check for legacy data and migrate it to the new default profile
        const oldTrans = localStorage.getItem('zenfinance_transactions');
        if (oldTrans) {
          localStorage.setItem(`zenfinance_transactions_${defaultId}`, oldTrans);
          localStorage.removeItem('zenfinance_transactions'); // Cleanup
        }

        const oldCurrency = localStorage.getItem('zenfinance_currency');
        if (oldCurrency) {
          localStorage.setItem(`zenfinance_currency_${defaultId}`, oldCurrency);
          localStorage.removeItem('zenfinance_currency');
        }
        
        const oldIncCats = localStorage.getItem('zenfinance_income_categories');
        if (oldIncCats) {
          localStorage.setItem(`zenfinance_income_categories_${defaultId}`, oldIncCats);
          localStorage.removeItem('zenfinance_income_categories');
        }

        const oldExpCats = localStorage.getItem('zenfinance_expense_categories');
        if (oldExpCats) {
          localStorage.setItem(`zenfinance_expense_categories_${defaultId}`, oldExpCats);
          localStorage.removeItem('zenfinance_expense_categories');
        }

        loadedProfiles = [defaultProfile];
        loadedActiveId = defaultId;
        
        // Save new structure immediately
        localStorage.setItem('zenfinance_profiles', JSON.stringify(loadedProfiles));
        localStorage.setItem('zenfinance_active_profile_id', loadedActiveId);
      } else {
        // Profiles exist, load active ID
        const savedActiveId = localStorage.getItem('zenfinance_active_profile_id');
        if (savedActiveId && loadedProfiles.find((p: Profile) => p.id === savedActiveId)) {
          loadedActiveId = savedActiveId;
        } else {
          loadedActiveId = loadedProfiles[0].id;
          localStorage.setItem('zenfinance_active_profile_id', loadedActiveId);
        }
      }

      setProfiles(loadedProfiles);
      setActiveProfileId(loadedActiveId);
      setIsLoaded(true);
    };

    initializeData();
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

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    localStorage.setItem('zenfinance_active_profile_id', id);
    setShowProfileManager(false);
  };

  const handleAddProfile = (name: string) => {
    const newProfile = { id: crypto.randomUUID(), name };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('zenfinance_profiles', JSON.stringify(updatedProfiles));
    
    // Auto switch to new profile
    handleSwitchProfile(newProfile.id);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;

    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem('zenfinance_profiles', JSON.stringify(updatedProfiles));

    // Cleanup data for deleted profile
    localStorage.removeItem(`zenfinance_transactions_${id}`);
    localStorage.removeItem(`zenfinance_currency_${id}`);
    localStorage.removeItem(`zenfinance_income_categories_${id}`);
    localStorage.removeItem(`zenfinance_expense_categories_${id}`);

    if (activeProfileId === id) {
      handleSwitchProfile(updatedProfiles[0].id);
    }
  };

  // --- Data Management Functions ---

  const handleClearAllData = () => {
    // Unmount safely first by setting loaded to false
    setIsLoaded(false);
    
    setTimeout(() => {
        if (activeProfileId) {
            // ONLY Clear transactions for the current profile
            // We keep the profile itself, categories, and app settings
            localStorage.removeItem(`zenfinance_transactions_${activeProfileId}`);
        }
        
        // Reload to reset state effectively
        window.location.reload();
    }, 100);
  };

  const handleExportData = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('zenfinance_')) {
        const value = localStorage.getItem(key);
        if (value) data[key] = value;
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Format date for filename
    const date = new Date().toISOString().split('T')[0];
    link.download = `hisab_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also try to open email client
    const subject = encodeURIComponent("Hisab Backup File");
    const body = encodeURIComponent("Please attach the downloaded 'hisab_backup.json' file to this email for safekeeping.");
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation: check if it looks like our data map
        const hasZenKeys = Object.keys(data).some(k => k.startsWith('zenfinance_'));
        
        if (hasZenKeys) {
            setIsLoaded(false); // Show loading/prevent interaction during restore
            
            setTimeout(() => {
                // Clear current data first to avoid conflicts
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('zenfinance_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));

                // Restore new data
                Object.keys(data).forEach(key => {
                    if(key.startsWith('zenfinance_')) {
                        localStorage.setItem(key, data[key]);
                    }
                });
                
                // Reload to re-initialize the app with new data
                alert(language === 'bn' ? 'ডেটা সফলভাবে রিস্টোর করা হয়েছে!' : 'Data restored successfully!');
                window.location.reload();
            }, 100);
        } else {
            alert(language === 'bn' ? 'অকার্যকর ব্যাকআপ ফাইল।' : 'Invalid backup file format.');
        }
      } catch (error) {
        console.error('Import failed', error);
        alert(language === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে।' : 'Error reading backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Safe guard: Ensure we have data before rendering
  if (!isLoaded || !activeProfileId) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
     );
  }

  // Safe guard: Find active profile, fallback to first, fallback to null (which triggers loader or error)
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  // Final crash prevention: If somehow profiles array is empty but isLoaded is true
  if (!activeProfile) {
     // Trigger a soft reset if we are in an impossible state
     localStorage.removeItem('zenfinance_profiles');
     window.location.reload(); 
     return null;
  }

  return (
    <>
      <ProfileManager
        isOpen={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSwitchProfile={handleSwitchProfile}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        language={language}
        soundEnabled={soundEnabled}
      />
      
      {/* 
        The key={activeProfileId} ensures the Tracker component completely remounts 
        when the profile changes, forcing it to reload data from the new profile's storage keys. 
      */}
      <Tracker 
        key={activeProfileId}
        profileId={activeProfileId}
        profileName={activeProfile.name}
        onOpenProfileManager={() => setShowProfileManager(true)}
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
    </>
  );
};

export default App;
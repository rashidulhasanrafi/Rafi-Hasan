import React, { useState } from 'react';
import { Profile, TRANSLATIONS, Language } from '../types';
import { X, UserCircle, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onAddProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  language: Language;
  soundEnabled: boolean;
}

export const ProfileManager: React.FC<Props> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSwitchProfile,
  onAddProfile,
  onDeleteProfile,
  language,
  soundEnabled
}) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const t = TRANSLATIONS[language].profile;
  const tCommon = TRANSLATIONS[language].list; // Reuse common Confirm/Cancel buttons

  if (!isOpen) return null;

  const playClick = () => {
    if (soundEnabled) playSound('click');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onAddProfile(newProfileName.trim());
      setNewProfileName('');
      if (soundEnabled) playSound('income'); // Success sound
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteProfile(deleteId);
      setDeleteId(null);
      if (soundEnabled) playSound('delete');
    }
  };

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[85vh] transition-colors">
          <div className="bg-indigo-600 p-6 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserCircle size={24} className="text-indigo-200" />
                {t.title}
              </h3>
              <p className="text-indigo-100 text-sm mt-1 opacity-80">
                Manage your personal and business spaces
              </p>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white p-1">
              <X size={24} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                return (
                  <div 
                    key={profile.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                      }`}>
                        <UserCircle size={20} />
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isActive ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-200'}`}>
                          {profile.name}
                        </h4>
                        {isActive && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{t.active}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => { playClick(); onSwitchProfile(profile.id); }}
                          className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {t.switch}
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          playClick();
                          if (profiles.length <= 1) {
                            alert(t.cantDeleteLast);
                            return;
                          }
                          setDeleteId(profile.id);
                        }}
                        disabled={profiles.length <= 1}
                        className={`p-2 rounded-lg transition-colors ${
                          profiles.length <= 1 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : 'text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                        }`}
                        title={t.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!newProfileName.trim()}
                onClick={playClick}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-lg transition-colors flex items-center gap-2 font-medium text-sm"
              >
                <Plus size={18} />
                {t.create}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { playClick(); setDeleteId(null); }} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-20 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {t.deleteTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {t.confirmDelete}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { playClick(); setDeleteId(null); }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {tCommon.cancel}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  {tCommon.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
import React, { useState, useRef } from 'react';
import { TransactionType, TRANSLATIONS, Language, getLocalizedCategory } from '../types';
import { X, Plus, Settings, Trash2, AlertTriangle, Moon, Sun, Volume2, VolumeX, Globe, LayoutGrid, Sliders, MessageCircle, ArrowLeft, Download, Upload, Database, Clipboard, Share2 } from 'lucide-react';
import { playSound } from '../utils/sound';
import { safeCopy } from '../utils/clipboard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Category Props
  incomeCategories: string[];
  expenseCategories: string[];
  savingsCategories: string[];
  onAddCategory: (type: TransactionType, name: string) => void;
  onRemoveCategory: (type: TransactionType, name: string) => void;
  // General Props
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  // Data Management
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onOpenShare: () => void;
}

type MainTab = 'general' | 'categories';

export const CategorySettings: React.FC<Props> = ({
  isOpen,
  onClose,
  incomeCategories,
  expenseCategories,
  savingsCategories,
  onAddCategory,
  onRemoveCategory,
  language,
  onLanguageChange,
  darkMode,
  toggleDarkMode,
  soundEnabled,
  toggleSound,
  onClearAllData,
  onExportData,
  onImportData,
  onOpenShare
}) => {
  const [mainTab, setMainTab] = useState<MainTab>('general');
  const [categoryTab, setCategoryTab] = useState<TransactionType>(TransactionType.EXPENSE);
  const [newCategory, setNewCategory] = useState('');
  const [deleteInfo, setDeleteInfo] = useState<{ type: TransactionType, name: string } | null>(null);
  
  // Data Confirmation States
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language].settings;
  const tCommon = TRANSLATIONS[language].common;

  // Sound Helper
  const playClick = () => {
    if (soundEnabled) playSound('click');
  };

  const playDeleteSound = () => {
    if (soundEnabled) playSound('delete');
  };

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    let list: string[] = [];
    if (categoryTab === TransactionType.EXPENSE) list = expenseCategories;
    else if (categoryTab === TransactionType.INCOME) list = incomeCategories;
    else list = savingsCategories;

    if (list.includes(newCategory.trim())) {
      alert(t.exists);
      return;
    }

    onAddCategory(categoryTab, newCategory.trim());
    setNewCategory('');
    if (soundEnabled) playSound('income'); // Success sound
  };

  const handlePasteCategory = async () => {
    if (soundEnabled) playSound('click');
    
    if (!navigator.clipboard) {
        alert(language === 'bn' ? 'ক্লিপবোর্ড অ্যাক্সেস সম্ভব নয়।' : 'Clipboard API not supported.');
        categoryInputRef.current?.focus();
        return;
    }

    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setNewCategory(text);
        } else {
            categoryInputRef.current?.focus();
        }
    } catch (err) {
        console.error("Paste failed", err);
        alert(language === 'bn' 
            ? 'ক্লিপবোর্ড অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে। দয়া করে ম্যানুয়ালি পেস্ট করুন।' 
            : 'Clipboard access denied. Please paste manually.'
        );
        categoryInputRef.current?.focus();
    }
  };

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    playClick();
    // Copy to clipboard immediately as backup (if app not installed)
    await safeCopy("01570222989");
  };

  const confirmDeleteCategory = () => {
    if (deleteInfo) {
      onRemoveCategory(deleteInfo.type, deleteInfo.name);
      setDeleteInfo(null);
      playDeleteSound();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setPendingImportFile(e.target.files[0]);
        setConfirmRestoreOpen(true);
        e.target.value = ''; // Reset so same file can be selected again
        playClick();
    }
  };

  const executeRestore = () => {
      if (pendingImportFile) {
          onImportData(pendingImportFile);
          setConfirmRestoreOpen(false);
          setPendingImportFile(null);
          // Sound handled by app reload usually, but we can try
          if (soundEnabled) playSound('income');
      }
  };

  const executeClearAll = () => {
      playDeleteSound();
      onClearAllData();
      setConfirmClearOpen(false);
  };

  const getCurrentCategories = () => {
    if (categoryTab === TransactionType.INCOME) return incomeCategories;
    if (categoryTab === TransactionType.SAVINGS) return savingsCategories;
    return expenseCategories;
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { playClick(); onClose(); }} />
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md relative z-10 flex flex-col max-h-[85vh] transition-colors animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
              {t.title}
            </h3>
            <button onClick={() => { playClick(); onClose(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Main Tabs */}
          <div className="flex p-4 pb-0 gap-2 border-b border-slate-100 dark:border-slate-700">
             <button
               onClick={() => { playClick(); setMainTab('general'); }}
               className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                 mainTab === 'general'
                   ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                   : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               <Sliders size={16} />
               {t.generalTab}
             </button>
             <button
               onClick={() => { playClick(); setMainTab('categories'); }}
               className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                 mainTab === 'categories'
                   ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                   : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
               }`}
             >
               <LayoutGrid size={16} />
               {t.categoriesTab}
             </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {mainTab === 'general' ? (
              <div className="p-4 space-y-6">
                
                {/* Share & Export Link (New) */}
                <div 
                  onClick={() => { playClick(); onOpenShare(); }}
                  className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-100 dark:border-indigo-800"
                >
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 rounded-lg">
                         <Share2 size={18} />
                      </div>
                      <span className="font-medium text-indigo-900 dark:text-indigo-100">{t.shareExport}</span>
                   </div>
                   <ArrowLeft size={16} className="rotate-180 text-indigo-400" />
                </div>

                {/* Appearance */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.appearance}</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t.darkMode}</span>
                    </div>
                    <button 
                      onClick={() => { playClick(); toggleDarkMode(); }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Sound */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.sound}</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t.sound}</span>
                    </div>
                    <button 
                      onClick={() => { toggleSound(); /* sound handled in wrapper */ }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* Localization */}
                <div>
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.language}</h4>
                   
                   <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Globe size={18} />
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{t.language}</span>
                        </div>
                        <select 
                          value={language}
                          onChange={(e) => { playClick(); onLanguageChange(e.target.value as Language); }}
                          className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="en">English</option>
                          <option value="bn">বাংলা</option>
                        </select>
                      </div>
                   </div>
                </div>

                {/* Data Management Section */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t.dataManagement}</h4>
                    <div className="space-y-3">
                        {/* Backup & Restore Group */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg mt-1">
                                    <Database size={18} />
                                </div>
                                <div>
                                    <h5 className="font-medium text-slate-700 dark:text-slate-200 text-sm">{t.backupTitle}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.backupDesc}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 mt-2">
                                <button 
                                    onClick={() => { playClick(); onExportData(); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                                >
                                    <Download size={14} />
                                    {t.backupEmail}
                                </button>
                                <button 
                                    onClick={() => { playClick(); fileInputRef.current?.click(); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors"
                                >
                                    <Upload size={14} />
                                    {t.restoreData}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".json"
                                    className="hidden" 
                                />
                            </div>
                        </div>

                        {/* Clear Data */}
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                        <Trash2 size={18} />
                                    </div>
                                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{t.clearData}</span>
                                </div>
                                <button 
                                    onClick={() => { playClick(); setConfirmClearOpen(true); }}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                >
                                    {tCommon.confirm}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Developer Info Section */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-4">
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                      Developed by Rafi Hassan
                    </p>
                    <a 
                      href="https://wa.me/8801570222989" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold shadow-md shadow-green-200 dark:shadow-green-900/20 transition-all hover:scale-105 active:scale-95"
                      onClick={handleWhatsAppClick}
                    >
                      <MessageCircle size={18} />
                      <span>WhatsApp: 01570222989</span>
                    </a>
                    
                    {/* Back to App Button */}
                    <button 
                       onClick={() => { playClick(); onClose(); }}
                       className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-sm font-medium flex items-center gap-1 transition-colors mt-2"
                    >
                       <ArrowLeft size={16} />
                       {language === 'bn' ? 'ফিরে যান' : 'Back to App'}
                    </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Category Tabs */}
                <div className="flex p-4 gap-2">
                  <button
                    onClick={() => { playClick(); setCategoryTab(TransactionType.EXPENSE); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      categoryTab === TransactionType.EXPENSE
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {t.expenseTab}
                  </button>
                  <button
                    onClick={() => { playClick(); setCategoryTab(TransactionType.INCOME); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      categoryTab === TransactionType.INCOME
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {t.incomeTab}
                  </button>
                  <button
                    onClick={() => { playClick(); setCategoryTab(TransactionType.SAVINGS); }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      categoryTab === TransactionType.SAVINGS
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {t.savingsTab}
                  </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <div className="space-y-2">
                    {getCurrentCategories().map((cat) => (
                      <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg group">
                        <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{getLocalizedCategory(cat, language)}</span>
                        <button
                          onClick={() => { playClick(); setDeleteInfo({ type: categoryTab, name: cat }); }}
                          className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Remove category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Input */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 rounded-b-2xl">
                  <form onSubmit={handleAdd} className="flex gap-2">
                    <input
                      ref={categoryInputRef}
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder={t.placeholder}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {/* Paste Button for Categories */}
                    <button
                      type="button"
                      onClick={handlePasteCategory}
                      className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-500 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Paste"
                    >
                      <Clipboard size={20} />
                    </button>
                    <button
                      type="submit"
                      disabled={!newCategory.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                      onClick={playClick}
                    >
                      <Plus size={20} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {deleteInfo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { playClick(); setDeleteInfo(null); }} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-20 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {t.deleteTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {t.deleteConfirm}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { playClick(); setDeleteInfo(null); }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {tCommon.cancel}
                </button>
                <button
                  onClick={confirmDeleteCategory}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  {tCommon.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { playClick(); setConfirmClearOpen(false); }} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-20 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {t.confirmClearTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {t.confirmClearDesc}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { playClick(); setConfirmClearOpen(false); }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {tCommon.cancel}
                </button>
                <button
                  onClick={executeClearAll}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  {t.clearData}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Data Confirmation Modal */}
      {confirmRestoreOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => { playClick(); setConfirmRestoreOpen(false); setPendingImportFile(null); }} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-20 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                <Database size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {t.confirmRestoreTitle}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                {t.confirmRestoreDesc}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => { playClick(); setConfirmRestoreOpen(false); setPendingImportFile(null); }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {tCommon.cancel}
                </button>
                <button
                  onClick={executeRestore}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200 dark:shadow-none"
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
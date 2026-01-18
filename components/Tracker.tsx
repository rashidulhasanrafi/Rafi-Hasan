import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, DashboardStats, CURRENCIES, Language, convertAmount, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES, TRANSLATIONS, Goal, EXCHANGE_RATES } from '../types';
import { DashboardStats as StatsComponent } from './DashboardStats';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { ExpenseChart } from './ExpenseChart';
import { AISuggestion } from './AISuggestion';
import { CategorySettings } from './CategorySettings';
import { ShareModal } from './ShareModal';
import { CalculatorModal } from './CalculatorModal';
import { GoalModal } from './GoalModal';
import { NotebookPen, Settings, UserCircle, Calculator, Check, X, Target } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Props {
  profileId: string;
  profileName: string;
  onOpenProfileManager: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  // Data Management Props
  onClearAllData: () => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

export const Tracker: React.FC<Props> = ({ 
  profileId, 
  profileName, 
  onOpenProfileManager,
  language,
  onLanguageChange,
  darkMode,
  toggleDarkMode,
  soundEnabled,
  toggleSound,
  onClearAllData,
  onExportData,
  onImportData
}) => {
  // Key names are now dynamic based on profileId
  const STORAGE_KEY = `zenfinance_transactions_${profileId}`;
  const CURRENCY_STORAGE_KEY = `zenfinance_currency_${profileId}`;
  const INCOME_CAT_STORAGE_KEY = `zenfinance_income_categories_${profileId}`;
  const EXPENSE_CAT_STORAGE_KEY = `zenfinance_expense_categories_${profileId}`;
  const SAVINGS_CAT_STORAGE_KEY = `zenfinance_savings_categories_${profileId}`;
  const GOALS_STORAGE_KEY = `zenfinance_goals_${profileId}`;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalIncome: 0, totalExpense: 0, totalSavings: 0, balance: 0 });
  // Default currency changed to BDT
  const [currency, setCurrency] = useState('BDT');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // Category State
  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_EXPENSE_CATEGORIES);
  const [savingsCategories, setSavingsCategories] = useState<string[]>(DEFAULT_SAVINGS_CATEGORIES);
  
  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Load data when profileId changes (component mounts)
  useEffect(() => {
    // Default to BDT if nothing saved
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) || 'BDT';
    const savedTransactions = localStorage.getItem(STORAGE_KEY);
    const savedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
    const savedIncomeCats = localStorage.getItem(INCOME_CAT_STORAGE_KEY);
    const savedExpenseCats = localStorage.getItem(EXPENSE_CAT_STORAGE_KEY);
    const savedSavingsCats = localStorage.getItem(SAVINGS_CAT_STORAGE_KEY);

    setCurrency(savedCurrency);

    if (savedTransactions) {
      try {
        const parsed: any[] = JSON.parse(savedTransactions);
        const migrated = parsed.map(t => ({
          ...t,
          currency: t.currency || savedCurrency
        }));
        setTransactions(migrated);
      } catch (e) {
        console.error("Failed to parse transactions", e);
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }

    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        setGoals([]);
      }
    } else {
      setGoals([]);
    }
    
    setIncomeCategories(savedIncomeCats ? JSON.parse(savedIncomeCats) : DEFAULT_INCOME_CATEGORIES);
    setExpenseCategories(savedExpenseCats ? JSON.parse(savedExpenseCats) : DEFAULT_EXPENSE_CATEGORIES);
    setSavingsCategories(savedSavingsCats ? JSON.parse(savedSavingsCats) : DEFAULT_SAVINGS_CATEGORIES);
    setEditingTransaction(null); // Clear editing state on profile switch

  }, [profileId]); // Crucial: reload when profileId changes

  // Save to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    // Calculate stats
    // Note: Transaction amounts are already stored in the current currency
    const income = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    // Total Savings (Sum of all savings transactions, including negative withdrawals)
    const totalSavings = transactions
      .filter(t => t.type === TransactionType.SAVINGS)
      .reduce((sum, t) => sum + t.amount, 0);

    // Deducted Savings are only those that are meant to reduce the current cash balance
    const deductedSavings = transactions
      .filter(t => t.type === TransactionType.SAVINGS && !t.excludeFromBalance)
      .reduce((sum, t) => sum + t.amount, 0);

    setStats({
      totalIncome: income,
      totalExpense: expense,
      totalSavings: totalSavings,
      // Balance = Income - Expense - (Savings that affect balance)
      // Note: If t.amount is negative (withdrawal), subtracting a negative adds to balance. Correct.
      balance: income - expense - deductedSavings
    });
  }, [transactions, currency, profileId]);

  // Persist Goals
  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals, profileId]);

  // Persist Categories
  useEffect(() => {
    localStorage.setItem(INCOME_CAT_STORAGE_KEY, JSON.stringify(incomeCategories));
  }, [incomeCategories, profileId]);

  useEffect(() => {
    localStorage.setItem(EXPENSE_CAT_STORAGE_KEY, JSON.stringify(expenseCategories));
  }, [expenseCategories, profileId]);

  useEffect(() => {
    localStorage.setItem(SAVINGS_CAT_STORAGE_KEY, JSON.stringify(savingsCategories));
  }, [savingsCategories, profileId]);

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === currency) {
      setShowCurrencyModal(false);
      return;
    }

    // Hard Conversion Logic: Convert ALL existing amounts to the new currency
    const oldRate = EXCHANGE_RATES[currency] || 1;
    const newRate = EXCHANGE_RATES[newCurrency] || 1;
    
    // Conversion formula: (amount / oldRate) * newRate
    const convert = (val: number) => (val / oldRate) * newRate;

    // 1. Convert Transactions
    const updatedTransactions = transactions.map(t => ({
      ...t,
      amount: convert(t.amount),
      currency: newCurrency
    }));

    // 2. Convert Goals
    const updatedGoals = goals.map(g => ({
      ...g,
      targetAmount: convert(g.targetAmount),
      savedAmount: convert(g.savedAmount),
      currency: newCurrency
    }));

    // Batch updates
    setTransactions(updatedTransactions);
    setGoals(updatedGoals);
    setCurrency(newCurrency);
    
    // Save new currency preference
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    
    if (soundEnabled) playSound('click');
    setShowCurrencyModal(false);
  };

  const addTransaction = (amount: number, category: string, note: string, type: TransactionType, date: string, excludeFromBalance?: boolean) => {
    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      amount,
      category,
      note,
      type,
      currency: currency,
      date: date,
      excludeFromBalance: type === TransactionType.SAVINGS ? excludeFromBalance : false
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, amount: number, category: string, note: string, type: TransactionType, date: string, excludeFromBalance?: boolean) => {
    setTransactions(prev => prev.map(t => 
      t.id === id 
        ? { ...t, amount, category, note, type, date, excludeFromBalance: type === TransactionType.SAVINGS ? excludeFromBalance : false } 
        : t
    ));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (editingTransaction?.id === id) {
      setEditingTransaction(null);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    if (soundEnabled) playSound('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    if (soundEnabled) playSound('click');
  };

  const handleAddCategory = (type: TransactionType, name: string) => {
    if (type === TransactionType.INCOME) {
      setIncomeCategories(prev => [...prev, name]);
    } else if (type === TransactionType.SAVINGS) {
      setSavingsCategories(prev => [...prev, name]);
    } else {
      setExpenseCategories(prev => [...prev, name]);
    }
  };

  const handleRemoveCategory = (type: TransactionType, name: string) => {
    if (type === TransactionType.INCOME) {
      setIncomeCategories(prev => prev.filter(c => c !== name));
    } else if (type === TransactionType.SAVINGS) {
      setSavingsCategories(prev => prev.filter(c => c !== name));
    } else {
      setExpenseCategories(prev => prev.filter(c => c !== name));
    }
  };

  // --- GOAL & SAVINGS FUNCTIONS ---
  
  // General Savings Operations (Not linked to specific Goal)
  const handleGeneralDeposit = (amount: number) => {
     addTransaction(
         amount, 
         'General Savings', 
         'Deposit to General Savings', 
         TransactionType.SAVINGS, 
         new Date().toISOString().split('T')[0], 
         false
     );
  };

  const handleGeneralWithdraw = (amount: number) => {
     // Withdrawal is a negative savings transaction
     // This reduces Total Savings and Increases Balance (double negative)
     addTransaction(
         -amount, 
         'Savings Withdrawal', 
         'Withdrawal from General Savings', 
         TransactionType.SAVINGS, 
         new Date().toISOString().split('T')[0], 
         false
     );
  };

  // Specific Goal Operations
  const handleAddGoal = (name: string, targetAmount: number, category: string, isFixedDeposit?: boolean) => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      savedAmount: 0,
      currency: currency,
      category,
      isFixedDeposit
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleUpdateGoal = (id: string, name: string, targetAmount: number, category: string, isFixedDeposit?: boolean) => {
    setGoals(prev => prev.map(g => 
        g.id === id 
        ? { ...g, name, targetAmount, category, isFixedDeposit } 
        : g
    ));
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleAddFundsToGoal = (goalId: string, amount: number) => {
    // 1. Update Goal Amount
    setGoals(prev => prev.map(g => {
      if (g.id === goalId) {
        return { ...g, savedAmount: g.savedAmount + amount };
      }
      return g;
    }));

    // 2. Create Transaction for History
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    // Deduct from balance by creating a savings transaction
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: amount,
        category: goal.category || (goal.isFixedDeposit ? 'Fixed Deposit' : 'Goal Saving'),
        note: `Deposit to: ${goal.name}`,
        type: TransactionType.SAVINGS,
        currency: currency,
        date: new Date().toISOString().split('T')[0],
        excludeFromBalance: false // Deducts from Main Balance
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleWithdrawFundsFromGoal = (goalId: string, amount: number) => {
     // 1. Update Goal Amount (decrease)
     setGoals(prev => prev.map(g => {
        if (g.id === goalId) {
            return { ...g, savedAmount: Math.max(0, g.savedAmount - amount) };
        }
        return g;
     }));

     // 2. Create Transaction
     // Use negative savings amount to represent withdrawal back to wallet
     const goal = goals.find(g => g.id === goalId);
     if (!goal) return;

     const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: -amount, // Negative amount adds back to wallet balance
        category: 'Savings Withdrawal',
        note: `Withdrawal from: ${goal.name}`,
        type: TransactionType.SAVINGS, 
        currency: currency,
        date: new Date().toISOString().split('T')[0],
        excludeFromBalance: false
     };
     setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleToggleSound = () => {
    toggleSound();
    if (!soundEnabled) {
        setTimeout(() => playSound('toggle'), 50);
    }
  };

  const handleClickSound = () => {
    if (soundEnabled) playSound('click');
  };

  const currentCurrencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '$';
  const tSettings = TRANSLATIONS[language].settings;

  // We use all transactions now
  const mainTransactions = transactions;
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 flex flex-col">
      <CategorySettings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        savingsCategories={savingsCategories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        language={language}
        onLanguageChange={(lang) => { handleClickSound(); onLanguageChange(lang); }}
        darkMode={darkMode}
        toggleDarkMode={() => { handleClickSound(); toggleDarkMode(); }}
        soundEnabled={soundEnabled}
        toggleSound={handleToggleSound}
        onClearAllData={onClearAllData}
        onExportData={onExportData}
        onImportData={onImportData}
        onOpenShare={() => { setShowSettings(false); setShowShareModal(true); }}
      />

      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        transactions={transactions}
        stats={stats}
        profileName={profileName}
        currency={currency}
        language={language}
        soundEnabled={soundEnabled}
      />

      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        language={language}
        soundEnabled={soundEnabled}
      />

      <GoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        goals={goals}
        totalSavings={stats.totalSavings}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
        onAddFunds={handleAddFundsToGoal}
        onWithdrawFunds={handleWithdrawFundsFromGoal}
        onGeneralDeposit={handleGeneralDeposit}
        onGeneralWithdraw={handleGeneralWithdraw}
        language={language}
        currency={currency}
        soundEnabled={soundEnabled}
        savingsCategories={savingsCategories}
      />

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCurrencyModal(false)} />
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-10 flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                   <h3 className="font-bold text-slate-800 dark:text-white">{tSettings.selectCurrency}</h3>
                   <button onClick={() => setShowCurrencyModal(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                      <X size={20} className="text-slate-500" />
                   </button>
               </div>
               <div className="p-2 overflow-y-auto max-h-[60vh]">
                   {CURRENCIES.map(c => (
                       <button
                         key={c.code}
                         onClick={() => handleCurrencyChange(c.code)}
                         className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                             currency === c.code 
                             ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-bold' 
                             : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                         }`}
                       >
                           <div className="flex items-center gap-3">
                               <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm">
                                   {c.symbol}
                               </span>
                               <div className="text-left">
                                   <div className="text-sm">{c.code}</div>
                                   <div className="text-xs opacity-70 font-normal">{c.name}</div>
                               </div>
                           </div>
                           {currency === c.code && <Check size={18} />}
                       </button>
                   ))}
               </div>
           </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-300 animate-slideDown">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg shadow-sm animate-bounce">
              <NotebookPen className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 hidden sm:block">
              Hisab
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {/* Currency Button (Compact) */}
             <button
               onClick={() => { handleClickSound(); setShowCurrencyModal(true); }}
               className="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 flex items-center gap-1"
             >
                {currency}
             </button>

             {/* Profile Switcher Button */}
             <button 
               onClick={() => { handleClickSound(); onOpenProfileManager(); }}
               className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg transition-all active:scale-95 border border-indigo-200 dark:border-indigo-800"
             >
               <UserCircle size={18} />
               <span className="text-sm font-medium hidden sm:block">{profileName}</span>
             </button>
             
             {/* Calculator Button */}
             <button
               onClick={() => { handleClickSound(); setShowCalculator(true); }}
               className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all active:scale-90"
               title="Calculator"
             >
               <Calculator size={20} />
             </button>

             {/* Goals Button */}
             <button
               onClick={() => { handleClickSound(); setShowGoalModal(true); }}
               className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-90"
               title="Goals"
             >
               <Target size={20} />
             </button>

             {/* Settings Button */}
             <button
               onClick={() => { handleClickSound(); setShowSettings(true); }}
               className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
               title="Settings"
             >
               <Settings size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        
        {/* Top Stats Cards */}
        <StatsComponent stats={stats} currency={currency} language={language} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
             <TransactionForm 
                onAddTransaction={
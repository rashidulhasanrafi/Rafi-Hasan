import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, TRANSLATIONS, Language, getLocalizedCategory } from '../types';
import { PlusCircle, Save, XCircle, Clipboard, CheckCircle2, Circle } from 'lucide-react';
import { playSound } from '../utils/sound';

interface Props {
  onAddTransaction: (amount: number, category: string, note: string, type: TransactionType, date: string, excludeFromBalance?: boolean) => void;
  onUpdateTransaction: (id: string, amount: number, category: string, note: string, type: TransactionType, date: string, excludeFromBalance?: boolean) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  currencySymbol: string;
  language: Language;
  incomeCategories: string[];
  expenseCategories: string[];
  savingsCategories: string[];
  soundEnabled: boolean;
}

export const TransactionForm: React.FC<Props> = ({ 
  onAddTransaction,
  onUpdateTransaction,
  editingTransaction,
  onCancelEdit,
  currencySymbol, 
  language,
  incomeCategories,
  expenseCategories,
  savingsCategories,
  soundEnabled
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  // Default to deducting from balance (Standard behavior)
  const [deductFromBalance, setDeductFromBalance] = useState(true);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[language].form;

  // Formatting helper
  const formatNumber = (value: string) => {
    // Remove non-digit chars
    const raw = value.replace(/[^0-9.]/g, '');
    if (!raw) return '';
    
    // Split integer and decimal
    const parts = raw.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return formattedInteger + decimalPart;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Allow only numbers and one dot
      if (/^[0-9,]*\.?[0-9]*$/.test(val)) {
          setAmount(formatNumber(val));
      }
  };

  // Helper to get correct categories list
  const getCategories = (currentType: TransactionType) => {
    switch(currentType) {
      case TransactionType.INCOME: return incomeCategories;
      case TransactionType.SAVINGS: return savingsCategories;
      case TransactionType.EXPENSE: 
      default: return expenseCategories;
    }
  };

  // Populate form when editingTransaction changes
  useEffect(() => {
    if (editingTransaction) {
      setAmount(formatNumber(editingTransaction.amount.toString()));
      setCategory(editingTransaction.category);
      setNote(editingTransaction.note);
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      // Logic reversed: if excludedFromBalance is true, then deductFromBalance is false
      setDeductFromBalance(!editingTransaction.excludeFromBalance);
    } else {
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setDeductFromBalance(true);
      // Reset to default category based on current type if not editing
      const categories = getCategories(type);
      if (categories.length > 0) {
        setCategory(categories[0]);
      }
    }
  }, [editingTransaction, expenseCategories, incomeCategories, savingsCategories]);

  // Ensure category is valid when switching types manually
  useEffect(() => {
    if (!editingTransaction) {
        const categories = getCategories(type);
        if (categories.length > 0 && !categories.includes(category)) {
          setCategory(categories[0]);
        }
    }
  }, [type, expenseCategories, incomeCategories, savingsCategories, editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse formatted string back to number
    const rawAmount = amount.replace(/,/g, '');
    const parsedAmount = parseFloat(rawAmount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(t.alertAmount);
      return;
    }
    
    if (!category) {
      alert(t.alertCategory);
      return;
    }

    // Logic reversed: if we deduct from balance, then excluded is false
    const excludeFromBalance = type === TransactionType.SAVINGS ? !deductFromBalance : false;

    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, parsedAmount, category, note, type, date, excludeFromBalance);
    } else {
      onAddTransaction(parsedAmount, category, note, type, date, excludeFromBalance);
    }

    // Play Sound
    if (soundEnabled) {
      playSound(type === TransactionType.INCOME ? 'income' : 'expense');
    }
    
    // Reset form
    if (!editingTransaction) {
      setAmount('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setDeductFromBalance(true);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (soundEnabled) playSound('click');
    const newCategories = getCategories(newType);
    if (newCategories.length > 0) {
      setCategory(newCategories[0]);
    } else {
      setCategory('');
    }
  };

  const handlePaste = async () => {
    if (soundEnabled) playSound('click');
    
    if (!navigator.clipboard) {
        alert(language === 'bn' ? 'ক্লিপবোর্ড অ্যাক্সেস সম্ভব নয়।' : 'Clipboard API not supported.');
        amountInputRef.current?.focus();
        return;
    }

    try {
      const text = await navigator.clipboard.readText();
      // Remove any non-numeric characters except dot
      const numeric = text.replace(/[^0-9.]/g, '');
      if (numeric && !isNaN(parseFloat(numeric))) {
        setAmount(formatNumber(numeric));
      } else {
        // If pasted content isn't a number, focus anyway so user sees it didn't work
        amountInputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to paste:', err);
      alert(language === 'bn' 
        ? 'ক্লিপবোর্ড অ্যাক্সেস প্রত্যাখ্যান করা হয়েছে। দয়া করে ম্যানুয়ালি পেস্ট করুন।' 
        : 'Clipboard access denied. Please paste manually.'
      );
      amountInputRef.current?.focus();
    }
  };

  const getButtonColor = () => {
    if (editingTransaction) return 'bg-indigo-600 hover:bg-indigo-700';
    switch (type) {
        case TransactionType.INCOME: return 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500';
        case TransactionType.SAVINGS: return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500';
        case TransactionType.EXPENSE: return 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500';
        default: return 'bg-indigo-600';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${editingTransaction ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-100 dark:border-slate-700'} h-fit transition-all duration-300 animate-slideUp`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          {editingTransaction ? t.editTitle : t.title}
        </h3>
        {editingTransaction && (
          <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <XCircle size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all active:scale-95 ${
              type === TransactionType.INCOME 
                ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.income}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all active:scale-95 ${
              type === TransactionType.EXPENSE 
                ? 'bg-white dark:bg-slate-600 text-rose-600 dark:text-rose-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.expense}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.SAVINGS)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all active:scale-95 ${
              type === TransactionType.SAVINGS 
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.savings}
          </button>
        </div>

        {/* Savings specific toggle */}
        {type === TransactionType.SAVINGS && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 transition-all animate-scaleIn origin-top">
             <div 
               className="flex items-center gap-3 cursor-pointer"
               onClick={() => setDeductFromBalance(!deductFromBalance)}
             >
                <div className={`transition-all duration-300 ${deductFromBalance ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-400'}`}>
                   {deductFromBalance ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <div>
                   <p className="text-sm font-medium text-slate-800 dark:text-white">{t.deductFromBalance}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                     {deductFromBalance ? t.deductDesc : t.noDeductDesc}
                   </p>
                </div>
             </div>
          </div>
        )}

        {/* Amount */}
        <div className="group">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">{t.amount} ({currencySymbol})</label>
          <div className="flex gap-2">
            <input
              ref={amountInputRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder={t.placeholderAmount}
              className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              required
            />
            <button
              type="button"
              onClick={handlePaste}
              className="p-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
              title="Paste amount"
            >
              <Clipboard size={20} />
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="group">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">{t.date}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all text-slate-800 dark:text-white"
            required
          />
        </div>

        {/* Category */}
        <div className="group">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">{t.category}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all text-slate-800 dark:text-white appearance-none"
          >
            {getCategories(type).map((cat) => (
              <option key={cat} value={cat}>{getLocalizedCategory(cat, language)}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="group">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">{t.note}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.placeholderNote}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex gap-2">
          {editingTransaction && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-3 px-4 rounded-lg text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all active:scale-95"
            >
              {t.cancelBtn}
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none ${getButtonColor()}`}
          >
            {editingTransaction ? <Save size={18} /> : <PlusCircle size={18} />}
            {editingTransaction ? t.updateBtn : t.addBtn}
          </button>
        </div>
      </form>
    </div>
  );
};
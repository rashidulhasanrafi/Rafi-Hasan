import React, { useState } from 'react';
import { Transaction, TransactionType, TRANSLATIONS, Language, convertAmount } from '../types';
import { 
  Trash2, Coffee, Home, Bus, Zap, ShoppingBag, Stethoscope, GraduationCap, 
  DollarSign, TrendingUp, Gift, Briefcase, HelpCircle, Plane, Shield, 
  RefreshCw, Smile, Heart, Landmark, Percent, Award, Building2, RotateCcw, CreditCard, Tag, Pencil,
  AlertTriangle
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { safeCopy } from '../utils/clipboard';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  currency: string;
  language: Language;
  soundEnabled: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    // Expense
    case 'Food & Dining': return <Coffee size={18} />;
    case 'Rent & Housing': return <Home size={18} />;
    case 'Transportation': return <Bus size={18} />;
    case 'Utilities': return <Zap size={18} />;
    case 'Shopping': return <ShoppingBag size={18} />;
    case 'Healthcare': return <Stethoscope size={18} />;
    case 'Education': return <GraduationCap size={18} />;
    case 'Travel': return <Plane size={18} />;
    case 'Insurance': return <Shield size={18} />;
    case 'Subscriptions': return <RefreshCw size={18} />;
    case 'Personal Care': return <Smile size={18} />;
    case 'Gifts & Donations': return <Heart size={18} />;
    case 'Taxes': return <Landmark size={18} />;
    case 'Debt Payments': return <CreditCard size={18} />;
    
    // Income
    case 'Salary': return <DollarSign size={18} />;
    case 'Investments': return <TrendingUp size={18} />;
    case 'Gifts': return <Gift size={18} />;
    case 'Freelance': return <Briefcase size={18} />;
    case 'Dividends': return <Percent size={18} />;
    case 'Royalties': return <Award size={18} />;
    case 'Grants': return <Landmark size={18} />;
    case 'Rental Income': return <Building2 size={18} />;
    case 'Refunds': return <RotateCcw size={18} />;
    case 'Other Income': return <HelpCircle size={18} />;
    
    // Default for custom categories
    default: return <Tag size={18} />;
  }
};

export const TransactionList: React.FC<Props> = ({ transactions, onDelete, onEdit, currency, language, soundEnabled }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const t = TRANSLATIONS[language].list;
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const formatConvertedAmount = (amount: number, fromCurrency: string) => {
    const converted = convertAmount(amount, fromCurrency || 'USD', currency);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(converted);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
      if (soundEnabled) playSound('delete');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    if (soundEnabled) playSound('click');
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[300px] transition-colors">
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-full mb-3">
          <ShoppingBag size={32} className="text-slate-300 dark:text-slate-500" />
        </div>
        <h3 className="text-slate-800 dark:text-white font-medium mb-1">{t.emptyTitle}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{t.emptyDesc}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{t.title}</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
          {transactions.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  t.type === TransactionType.INCOME 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                }`}>
                  {getCategoryIcon(t.category)}
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{t.category}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.note || t.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span 
                  onClick={() => safeCopy(t.amount.toString())}
                  className={`font-semibold mr-1 cursor-pointer active:opacity-70 ${
                    t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                  title="Copy amount"
                >
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatConvertedAmount(t.amount, t.currency)}
                </span>
                
                <button 
                  onClick={() => onEdit(t)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 transition-colors"
                  aria-label="Edit transaction"
                >
                  <Pencil size={16} />
                </button>

                <button 
                  onClick={() => handleDeleteRequest(t.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-colors"
                  aria-label="Delete transaction"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6 animate-in zoom-in-95 duration-200">
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
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-700 dark:text-slate-200 font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl text-white font-medium bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 dark:shadow-none"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
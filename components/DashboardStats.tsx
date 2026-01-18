import React from 'react';
import { DashboardStats as StatsType, TRANSLATIONS, Language } from '../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

interface Props {
  stats: StatsType;
  currency: string;
  language: Language;
}

export const DashboardStats: React.FC<Props> = ({ stats, currency, language }) => {
  const t = TRANSLATIONS[language].dashboard;
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Balance */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t.balance}</p>
          <h2 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-slate-800 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(stats.balance)}
          </h2>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
          <Wallet size={24} />
        </div>
      </div>

      {/* Income */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t.income}</p>
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalIncome)}
          </h2>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
          <ArrowUpCircle size={24} />
        </div>
      </div>

      {/* Expense */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t.expense}</p>
          <h2 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.totalExpense)}
          </h2>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-full text-rose-600 dark:text-rose-400">
          <ArrowDownCircle size={24} />
        </div>
      </div>
    </div>
  );
};
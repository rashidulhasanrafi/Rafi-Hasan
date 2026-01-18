import React, { useEffect, useState, PropsWithChildren } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";

export default function PasswordGate({
  children,
}: PropsWithChildren) {
  const [input, setInput] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session storage to keep logged in on refresh
    const sessionAuth = sessionStorage.getItem('hisab_auth');
    if (sessionAuth === 'true') {
        setAllowed(true);
    }

    fetch("/password.json")
      .then((res) => res.json())
      .then((data) => {
        setPassword(data.password);
        setLoading(false);
      })
      .catch(() => {
        console.error("Password config error");
        alert("Password configuration missing or unreadable.");
        setLoading(false);
      });
  }, []);

  const handleUnlock = () => {
    if (input === password) {
      setAllowed(true);
      sessionStorage.setItem('hisab_auth', 'true');
      setError(false);
    } else {
      setError(true);
      alert("Wrong password");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleUnlock();
    }
  };

  // If already allowed, render children immediately
  if (allowed) {
    return <>{children}</>;
  }

  // Loading state while fetching password
  if (loading || password === null) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-100 dark:border-slate-700 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Welcome to Hisab</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
              Please enter the password to access your tracker.
            </p>
        </div>
        
        <div className="space-y-4">
            <div>
                <input
                  type="password"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(false); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Password"
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border ${error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-600 focus:ring-indigo-500'} rounded-xl focus:outline-none focus:ring-2 dark:text-white transition-all`}
                  autoFocus
                />
            </div>
            <button
              onClick={handleUnlock}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
            >
              Unlock <ArrowRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldCheck, Plus } from 'lucide-react';

export default function Ledger() {
  const accounts = [
    { name: 'HDFC Current Account', accountNumber: 'XXXX-XXXX-9012', balance: 142800, type: 'Current' },
    { name: 'ICICI GST Savings', accountNumber: 'XXXX-XXXX-4531', balance: 45000, type: 'Savings' }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Bank & Cash Ledger
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track bank accounts, reconcile statement entries, and link invoice settlements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((acc, idx) => (
          <div key={idx} className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{acc.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">{acc.accountNumber}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 uppercase">
                {acc.type}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Available Balance</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

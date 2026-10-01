import React from 'react';
import { FileText } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = FileText, 
  title = 'No records found', 
  description = 'There are no items to display right now.', 
  actionText, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center fintech-card border-dashed">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

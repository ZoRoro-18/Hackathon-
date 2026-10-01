import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, Bot, User, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function AskAI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your KhaataAI Financial Assistant. Ask me anything about your invoices, vendor spending, or GST liabilities (e.g., "Show me top expenses this month" or "What is my net GST payable?").'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'What is my total GST liability for this month?',
    'Show all unpaid purchase bills',
    'Which vendor did we spend the most on?'
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { role: 'user', text: textToSend }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      // Query backend Ask AI endpoint or provide structured financial insight
      const res = await api.get('/documents/dashboard');
      if (res.data?.success) {
        const k = res.data.data.kpis;
        let reply = '';
        const lower = textToSend.toLowerCase();

        if (lower.includes('gst') || lower.includes('tax')) {
          reply = `Based on your verified documents: Your Output GST collected on sales is ₹${k.gstCollected.toLocaleString('en-IN')}, Input Tax Credit paid on purchases is ₹${k.gstPaid.toLocaleString('en-IN')}. Your Net GST Payable is ₹${k.netGstPayable.toLocaleString('en-IN')}.`;
        } else if (lower.includes('unpaid') || lower.includes('pending') || lower.includes('payable') || lower.includes('receivable')) {
          reply = `You have ₹${k.receivables.toLocaleString('en-IN')} in pending receivables from sales, and ₹${k.payables.toLocaleString('en-IN')} in outstanding payables due to suppliers (${k.overdueCount} overdue bills).`;
        } else if (lower.includes('income') || lower.includes('profit') || lower.includes('sales')) {
          reply = `Your total sales income is ₹${k.income.toLocaleString('en-IN')}, total expenses are ₹${k.expenses.toLocaleString('en-IN')}, generating a net business profit of ₹${k.netProfit.toLocaleString('en-IN')}.`;
        } else {
          reply = `Here is your financial summary: Total revenue is ₹${k.income.toLocaleString('en-IN')}, expenses ₹${k.expenses.toLocaleString('en-IN')} across ${k.totalDocuments} documents. Net profit stands at ₹${k.netProfit.toLocaleString('en-IN')}.`;
        }

        setMessages([...newMsgs, { role: 'assistant', text: reply }]);
      }
    } catch (err) {
      setMessages([...newMsgs, { role: 'assistant', text: 'Sorry, I could not query your financial records at the moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          <span>Ask AI Financial Copilot</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Ask natural language questions grounded strictly in your verified accounting records
        </p>
      </div>

      {/* Chat Box */}
      <div className="fintech-card flex-1 p-6 flex flex-col justify-between overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`p-4 rounded-2xl max-w-lg text-sm ${
                  m.role === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-500 rounded-tl-none animate-pulse">
                Analyzing accounting database...
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries & Input Area */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {sampleQueries.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-400 transition"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about revenue, taxes, suppliers, or invoices..."
              className="fintech-input flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary min-h-[44px] px-4"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Percent, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Plus,
  IndianRupee,
  Building2,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { KpiSkeleton, TableSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const CATEGORY_COLORS = ['#0f766e', '#d97706', '#2563eb', '#7c3aed', '#db2777', '#059669'];

export default function Dashboard() {
  const { business } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/dashboard');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 fintech-card p-6 h-80 animate-pulse bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
          <div className="fintech-card p-6 h-80 animate-pulse bg-slate-200/50 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    income: 0,
    expenses: 0,
    netProfit: 0,
    gstCollected: 0,
    gstPaid: 0,
    netGstPayable: 0,
    receivables: 0,
    payables: 0,
    overdueCount: 0,
    totalDocuments: 0
  };

  const monthlyTrends = data?.monthlyTrends || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const recentDocuments = data?.recentDocuments || [];

  const isBrandNewUser = kpis.totalDocuments === 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and GST compliance computed from verified documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/upload" className="btn-primary shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Invoice</span>
          </Link>
        </div>
      </div>

      {isBrandNewUser ? (
        <EmptyState
          icon={Receipt}
          title="No documents extracted yet"
          description="Upload your first sales tax invoice, purchase bill, or expense receipt to start generating automated financial insights and GST calculations."
          actionText="Upload Document Now"
          onAction={() => window.location.href = '/upload'}
        />
      ) : (
        <>
          {/* 9 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 1. Total Income */}
            <div className="fintech-card p-5 border-l-4 border-l-teal-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Income
                </span>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.income)}
              </p>
              <p className="text-xs text-slate-400 mt-1">From verified sales documents</p>
            </div>

            {/* 2. Total Expenses */}
            <div className="fintech-card p-5 border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Expenses
                </span>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.expenses)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Purchases & operating costs</p>
            </div>

            {/* 3. Net Profit */}
            <div className="fintech-card p-5 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Net Profit
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold mt-3 ${kpis.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(kpis.netProfit)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Income minus Expenses</p>
            </div>

            {/* 4. GST Output (Collected) */}
            <div className="fintech-card p-5 border-l-4 border-l-sky-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  GST Output
                </span>
                <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.gstCollected)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Tax collected on sales</p>
            </div>

            {/* 5. GST Input (Paid) */}
            <div className="fintech-card p-5 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  GST Input (ITC)
                </span>
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.gstPaid)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Eligible input tax credit</p>
            </div>

            {/* 6. Net GST Payable */}
            <div className="fintech-card p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Net GST Payable
                </span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.netGstPayable)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Output tax minus Input credit</p>
            </div>

            {/* 7. Receivables */}
            <div className="fintech-card p-5 border-l-4 border-l-teal-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Receivables
                </span>
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
                {formatCurrency(kpis.receivables)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Unpaid sales invoices</p>
            </div>

            {/* 8. Payables & Overdue */}
            <div className="fintech-card p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Payables
                </span>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(kpis.payables)}
                </p>
                {kpis.overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    {kpis.overdueCount} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">Outstanding bills due</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Income vs Expenses Chart */}
            <div className="lg:col-span-2 fintech-card p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Income vs Expense Trends
              </h3>
              <p className="text-xs text-slate-400 mb-6">Monthly cash flow comparison</p>
              <div className="h-72 w-full">
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), '']}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Sales (Income)" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Purchases (Expenses)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No trend data available yet
                  </div>
                )}
              </div>
            </div>

            {/* Expense By Category Pie Chart */}
            <div className="fintech-card p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Expense Breakdown
              </h3>
              <p className="text-xs text-slate-400 mb-6">Categorized purchase distribution</p>
              <div className="h-72 w-full">
                {categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Total']}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No expense records available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Documents Section */}
          <div className="fintech-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Processed Invoices
                </h3>
                <p className="text-xs text-slate-400">Latest automated extractions and status checks</p>
              </div>
              <Link to="/documents" className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                View All Documents &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3">Document</th>
                    <th className="pb-3">Party / Contact</th>
                    <th className="pb-3">Direction</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5">
                        <Link to={`/documents/${doc.id}`} className="font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>{doc.invoice_number || `Doc #${doc.id}`}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 text-slate-700 dark:text-slate-300">
                        {doc.vendor_name || doc.customer_name || 'General Supply'}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          doc.direction === 'sales'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {doc.direction}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                        {doc.invoice_date ? new Date(doc.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(doc.total_amount)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.status === 'done'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : doc.status === 'needs_review'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {doc.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                          {doc.status === 'needs_review' && <AlertCircle className="w-3 h-3" />}
                          {doc.status === 'failed' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

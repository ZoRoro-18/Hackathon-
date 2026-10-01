import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Receipt,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoader';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete modal state
  const [deleteModalDoc, setDeleteModalDoc] = useState(null);

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('type', typeFilter);
      if (directionFilter) params.append('direction', directionFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/documents?${params.toString()}`);
      if (res.data?.success) {
        setDocuments(res.data.data.documents || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1);
  }, [typeFilter, directionFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalDoc) return;
    try {
      const res = await api.delete(`/documents/${deleteModalDoc.id}`);
      if (res.data?.success) {
        toast.success('Document deleted successfully');
        setDeleteModalDoc(null);
        fetchDocuments(pagination.page);
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Documents Ledger
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, and manage all sales tax invoices, purchase bills, and receipts
          </p>
        </div>
        <Link to="/upload" className="btn-primary shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Upload New</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="fintech-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor, invoice #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="fintech-input pl-9"
            />
          </form>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="fintech-input"
          >
            <option value="">All Document Types</option>
            <option value="tax_invoice">Tax Invoice</option>
            <option value="bill_of_supply">Bill of Supply</option>
            <option value="receipt">Receipt</option>
            <option value="credit_note">Credit Note</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="fintech-input"
          >
            <option value="">All Directions (Sales & Purchase)</option>
            <option value="sales">Sales (Income)</option>
            <option value="purchase">Purchase (Expense)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fintech-input"
          >
            <option value="">All Statuses</option>
            <option value="done">Done (Verified)</option>
            <option value="needs_review">Needs Review</option>
            <option value="failed">Failed</option>
            <option value="processing">Processing</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="fintech-card overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Receipt}
              title="No matching documents found"
              description="Try adjusting your search keywords or clearing active filters."
              actionText="Upload Document"
              onAction={() => window.location.href = '/upload'}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Party Name</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="font-semibold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>{doc.invoice_number || `Doc #${doc.id}`}</span>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {doc.vendor_name || doc.customer_name || 'General Supply'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          doc.direction === 'sales'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {doc.direction}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                        {doc.invoice_date ? new Date(doc.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {doc.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(doc.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Inspect document"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModalDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total documents)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchDocuments(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn-secondary py-1 px-2.5 text-xs min-h-[36px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    onClick={() => fetchDocuments(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-secondary py-1 px-2.5 text-xs min-h-[36px]"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteModalDoc}
        title="Delete Document"
        message={`Are you sure you want to permanently delete document "${deleteModalDoc?.invoice_number || deleteModalDoc?.id}"? This action cannot be undone.`}
        confirmText="Delete Permanently"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalDoc(null)}
      />
    </div>
  );
}

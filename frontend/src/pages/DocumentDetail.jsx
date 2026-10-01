import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash, 
  FileText,
  CreditCard,
  ArrowLeftRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // File blob preview state
  const [fileBlobUrl, setFileBlobUrl] = useState(null);
  const [fileMimeType, setFileMimeType] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchDocumentDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      if (res.data?.success) {
        const d = res.data.data;
        setDocument(d);
        setLineItems(d.line_items || []);
        setIssues(d.issues || []);
      }
    } catch (err) {
      toast.error('Failed to load document details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceFileBlob = async () => {
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: 'blob' });
      const mime = res.headers['content-type'] || 'application/pdf';
      setFileMimeType(mime);
      const url = URL.createObjectURL(res.data);
      setFileBlobUrl(url);
    } catch (err) {
      console.warn('Could not fetch source file blob preview');
    }
  };

  useEffect(() => {
    fetchDocumentDetail();
    fetchSourceFileBlob();

    return () => {
      if (fileBlobUrl) URL.revokeObjectURL(fileBlobUrl);
    };
  }, [id]);

  const handleFieldChange = (field, val) => {
    setDocument(prev => ({ ...prev, [field]: val }));
  };

  const handleLineItemChange = (index, field, val) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    
    // Auto recalculate line total if qty or unit price changes
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(field === 'quantity' ? val : updated[index].quantity || 1);
      const r = parseFloat(field === 'unit_price' ? val : updated[index].unit_price || 0);
      updated[index].total_amount = (q * r).toFixed(2);
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { description: '', hsn_sac: '', quantity: 1, unit_price: 0, tax_rate: 18, total_amount: 0 }
    ]);
  };

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndRevalidate = async () => {
    try {
      setSaving(true);
      const payload = {
        invoice_number: document.invoice_number,
        invoice_date: document.invoice_date,
        due_date: document.due_date,
        vendor_name: document.vendor_name,
        customer_name: document.customer_name,
        gstin: document.gstin,
        direction: document.direction,
        document_type: document.document_type,
        taxable_amount: parseFloat(document.taxable_amount || 0),
        cgst_amount: parseFloat(document.cgst_amount || 0),
        sgst_amount: parseFloat(document.sgst_amount || 0),
        igst_amount: parseFloat(document.igst_amount || 0),
        total_amount: parseFloat(document.total_amount || 0),
        payment_status: document.payment_status,
        notes: document.notes,
        line_items: lineItems
      };

      const res = await api.put(`/documents/${id}`, payload);
      if (res.data?.success) {
        toast.success('Document saved and re-validated!');
        setDocument(res.data.data);
        setIssues(res.data.data.issues || []);
        if (res.data.data.line_items) setLineItems(res.data.data.line_items);
      }
    } catch (err) {
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePayment = async () => {
    try {
      const nextStatus = document.payment_status === 'paid' ? 'unpaid' : 'paid';
      const res = await api.patch(`/documents/${id}/payment-status`, { payment_status: nextStatus });
      if (res.data?.success) {
        toast.success(`Marked as ${nextStatus}`);
        setDocument(prev => ({ ...prev, payment_status: nextStatus }));
      }
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleToggleDirection = async () => {
    try {
      const nextDirection = document.direction === 'sales' ? 'purchase' : 'sales';
      const res = await api.patch(`/documents/${id}/direction`, { direction: nextDirection });
      if (res.data?.success) {
        toast.success(`Direction updated to ${nextDirection}`);
        setDocument(prev => ({ ...prev, direction: nextDirection }));
      }
    } catch (err) {
      toast.error('Failed to update direction');
    }
  };

  const handleRetryAi = async () => {
    try {
      setRetrying(true);
      const res = await api.post(`/documents/${id}/retry`);
      if (res.data?.success) {
        toast.success('AI re-extraction completed!');
        setDocument(res.data.data);
        setLineItems(res.data.data.line_items || []);
        setIssues(res.data.data.issues || []);
      }
    } catch (err) {
      toast.error('AI retry failed');
    } finally {
      setRetrying(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/documents/${id}`);
      if (res.data?.success) {
        toast.success('Document deleted');
        navigate('/documents');
      }
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  if (loading || !document) {
    return (
      <div className="p-12 text-center text-slate-500 animate-pulse">
        <p className="text-sm font-semibold">Loading document details...</p>
      </div>
    );
  }

  const isPdf = fileMimeType?.includes('pdf') || document.file_path?.endsWith('.pdf');

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/documents"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {document.invoice_number || `Document #${document.id}`}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                document.status === 'done'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : document.status === 'needs_review'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {document.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Confidence: {Math.round(document.confidence_score || 0)}% • Extracted with Gemini Multimodal AI
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleToggleDirection}
            className="btn-secondary py-1.5 px-3 text-xs"
            title="Toggle between Sales and Purchase"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Switch to {document.direction === 'sales' ? 'Purchase' : 'Sales'}</span>
          </button>

          <button
            type="button"
            onClick={handleTogglePayment}
            className={`btn-secondary py-1.5 px-3 text-xs ${
              document.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Mark {document.payment_status === 'paid' ? 'Unpaid' : 'Paid'}</span>
          </button>

          <button
            type="button"
            onClick={handleRetryAi}
            disabled={retrying}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <Sparkles className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>Retry AI</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndRevalidate}
            disabled={saving}
            className="btn-primary py-1.5 px-4 text-xs shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Re-validate'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Delete document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Validation Issues Alert Banner */}
      {issues.length > 0 && (
        <div className="fintech-card p-4 border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Validation Checks ({issues.length} detected)</span>
          </div>
          <div className="space-y-1.5">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-md text-xs flex items-start gap-2 ${
                  issue.severity === 'error'
                    ? 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'bg-amber-100/70 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                }`}
              >
                <span className="font-bold uppercase">[{issue.rule}]</span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split View: Source File Preview (Left) vs Extracted Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source File Preview */}
        <div className="lg:col-span-5 fintech-card p-4 flex flex-col h-[700px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Original Source File</span>
            </div>
            {fileBlobUrl && (
              <a
                href={fileBlobUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline flex items-center gap-1 lowercase"
              >
                <span>open in tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex-1 mt-3 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
            {fileBlobUrl ? (
              isPdf ? (
                <iframe
                  src={fileBlobUrl}
                  title="Source PDF Preview"
                  className="w-full h-full border-none"
                />
              ) : (
                <img
                  src={fileBlobUrl}
                  alt="Source Document Preview"
                  className="max-h-full max-w-full object-contain"
                />
              )
            ) : (
              <div className="text-center text-xs text-slate-400 p-6">
                <p>Preview loading or unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Editable Form & Line Items */}
        <div className="lg:col-span-7 space-y-6">
          {/* General Fields */}
          <div className="fintech-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Document Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Invoice / Bill Number *
                </label>
                <input
                  type="text"
                  value={document.invoice_number || ''}
                  onChange={(e) => handleFieldChange('invoice_number', e.target.value)}
                  className="fintech-input font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={document.invoice_date ? new Date(document.invoice_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('invoice_date', e.target.value)}
                  className="fintech-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Party Name (Vendor / Supplier)
                </label>
                <input
                  type="text"
                  value={document.vendor_name || document.customer_name || ''}
                  onChange={(e) => {
                    handleFieldChange('vendor_name', e.target.value);
                    handleFieldChange('customer_name', e.target.value);
                  }}
                  className="fintech-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  GSTIN (15 Digits)
                </label>
                <input
                  type="text"
                  value={document.gstin || ''}
                  onChange={(e) => handleFieldChange('gstin', e.target.value.toUpperCase())}
                  className="fintech-input font-mono uppercase"
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Document Direction
                </label>
                <select
                  value={document.direction || 'sales'}
                  onChange={(e) => handleFieldChange('direction', e.target.value)}
                  className="fintech-input"
                >
                  <option value="sales">Sales (Income)</option>
                  <option value="purchase">Purchase (Expense)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Status
                </label>
                <select
                  value={document.payment_status || 'unpaid'}
                  onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                  className="fintech-input"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Breakdown Fields */}
          <div className="fintech-card p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Tax & Financial Totals (₹)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Taxable Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={document.taxable_amount || 0}
                  onChange={(e) => handleFieldChange('taxable_amount', e.target.value)}
                  className="fintech-input font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  CGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={document.cgst_amount || 0}
                  onChange={(e) => handleFieldChange('cgst_amount', e.target.value)}
                  className="fintech-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  SGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={document.sgst_amount || 0}
                  onChange={(e) => handleFieldChange('sgst_amount', e.target.value)}
                  className="fintech-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  IGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={document.igst_amount || 0}
                  onChange={(e) => handleFieldChange('igst_amount', e.target.value)}
                  className="fintech-input"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Grand Total Amount
              </span>
              <div className="w-48">
                <input
                  type="number"
                  step="0.01"
                  value={document.total_amount || 0}
                  onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                  className="fintech-input text-right font-extrabold text-base text-teal-700 dark:text-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="fintech-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Extracted Line Items ({lineItems.length})
              </h3>
              <button
                type="button"
                onClick={addLineItem}
                className="btn-secondary py-1 px-3 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-left">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 w-20">HSN/SAC</th>
                    <th className="pb-2 w-16 text-right">Qty</th>
                    <th className="pb-2 w-24 text-right">Rate (₹)</th>
                    <th className="pb-2 w-24 text-right">Total (₹)</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                          className="fintech-input py-1 px-2 text-xs"
                          placeholder="Item name"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={item.hsn_sac || ''}
                          onChange={(e) => handleLineItemChange(idx, 'hsn_sac', e.target.value)}
                          className="fintech-input py-1 px-2 text-xs font-mono"
                          placeholder="9983"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="1"
                          value={item.quantity || 1}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          className="fintech-input py-1 px-2 text-xs text-right font-mono"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price || 0}
                          onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                          className="fintech-input py-1 px-2 text-xs text-right font-mono"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.total_amount || 0}
                          onChange={(e) => handleLineItemChange(idx, 'total_amount', e.target.value)}
                          className="fintech-input py-1 px-2 text-xs text-right font-bold font-mono"
                        />
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Document"
        message="Are you sure you want to delete this document permanently?"
        confirmText="Delete Document"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}

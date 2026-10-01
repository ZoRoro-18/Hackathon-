import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, TrendingUp, TrendingDown, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/documents/upload', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setSelectedFile(null);
      toast.success('Document processed successfully!');
      await fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  // Demo State Data
  const demoMetrics = [
    { title: 'Total Income', amount: '₹2,45,000', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Total Expenses', amount: '₹1,12,000', icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { title: 'Net GST Payable', amount: '₹23,400', icon: FileSpreadsheet, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { title: 'Overdue Invoices', amount: '3', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', highlight: true }
  ];

  const demoDocuments = [
    { id: 1, party: 'Reliance Retail', amount: '₹14,000', status: 'Paid', date: 'Oct 24, 2026', type: 'Invoice' },
    { id: 2, party: 'Amazon Web Services', amount: '₹3,500', status: 'Needs Review', date: 'Oct 22, 2026', type: 'Receipt' },
    { id: 3, party: 'Uber India', amount: '₹840', status: 'Paid', date: 'Oct 21, 2026', type: 'Receipt' },
  ];

  return (
    <div className="bg-slate-900 text-slate-50 min-h-full p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Here's a summary of your financial health.</p>
          </div>
        </div>

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoMetrics.map((metric, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${metric.bg} ${metric.color}`}>
                  <metric.icon size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">{metric.title}</p>
                  <h3 className={`text-2xl font-bold mt-1 ${metric.highlight ? 'text-red-500' : 'text-slate-50'}`}>
                    {metric.amount}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-6 h-fit">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-teal-400">
              <Upload size={20} />
              Process Document
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Upload an invoice, receipt, or bank statement. Our Gemini AI Engine will automatically extract the data.
            </p>
            
            <form onSubmit={handleUpload}>
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center mb-4 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-600/10 file:text-teal-400 hover:file:bg-teal-600/20 cursor-pointer"
                  disabled={isUploading}
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Processing AI...
                  </>
                ) : (
                  'Extract Data'
                )}
              </button>
            </form>
          </div>

          {/* Recent Documents Section */}
          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <FileText size={20} className="text-teal-400" />
                Recent Documents
              </h3>
              <button className="text-sm text-teal-400 hover:text-teal-300 font-medium">View All</button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-medium">Document / Party</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {(!documents || documents.length === 0) ? demoDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{doc.party}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{doc.type}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{doc.date}</td>
                      <td className="px-6 py-4 font-semibold text-white">{doc.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    documents.map(doc => {
                      const meta = typeof doc.extracted_data === 'string' ? JSON.parse(doc.extracted_data) : doc.extracted_data;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-200">{meta?.partyName || doc.original_filename}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{meta?.documentType || 'Document'}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{meta?.date || new Date(doc.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-semibold text-white">
                            {meta?.currency || 'INR'} {meta?.amount?.toLocaleString('en-IN') || '0.00'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                              Processed
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

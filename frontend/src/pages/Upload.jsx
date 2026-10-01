import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { 
  UploadCloud, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import api from '../lib/api';

const STEPS = [
  { id: 1, label: 'Uploading' },
  { id: 2, label: 'Reading AI' },
  { id: 3, label: 'Validating GST' },
  { id: 4, label: 'Done' }
];

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1..4 = processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
      setExtractedResult(null);
      setErrorMsg(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleProcess = async () => {
    if (!file) {
      toast.error('Please select an invoice or receipt file first');
      return;
    }

    setIsProcessing(true);
    setCurrentStep(1); // Uploading
    setErrorMsg(null);
    setExtractedResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Advance step indicator to reading
      setTimeout(() => setCurrentStep(2), 600);
      setTimeout(() => setCurrentStep(3), 2000);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setCurrentStep(4);
        setExtractedResult(res.data.data);
        toast.success('Document extracted and validated successfully!');
      } else {
        throw new Error(res.data?.error?.message || 'Extraction failed');
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Processing failed';
      setErrorMsg(msg);
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setExtractedResult(null);
    setCurrentStep(0);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Intelligent Document Processing
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload any tax invoice, bill of supply, or photo receipt. Gemini AI extracts structured fields and validates GST rules.
        </p>
      </div>

      {/* Stepper (Active during processing or completion) */}
      {currentStep > 0 && (
        <div className="fintech-card p-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 w-full z-0" />
            {STEPS.map((step) => {
              const isDone = currentStep > step.id || currentStep === 4;
              const isCurrent = currentStep === step.id;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? 'bg-teal-700 text-white shadow-md shadow-teal-700/30'
                      : isCurrent
                      ? 'bg-amber-500 text-white animate-pulse shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${
                    isCurrent ? 'text-amber-600 dark:text-amber-400' : isDone ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upload Dropzone */}
      {!extractedResult && (
        <div className="fintech-card p-8 space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                : file
                ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-base font-bold text-teal-700 dark:text-teal-400">{file.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB • Ready to extract
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  Drag & drop your invoice PDF or photo receipt here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supports PDF, PNG, JPG, JPEG, WebP (up to 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <Camera className="w-4 h-4" />
                <span>Camera / Photo</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {file && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="btn-secondary flex-1 sm:flex-initial"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleProcess}
                disabled={!file || isProcessing}
                className="btn-primary flex-1 sm:flex-initial shadow-md"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Banner with Retry */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold">Extraction Error</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
                <button
                  onClick={handleProcess}
                  className="mt-2 text-xs font-bold underline hover:opacity-80"
                >
                  Retry Processing
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extraction Result Card */}
      {extractedResult && (
        <div className="fintech-card p-6 space-y-6 animate-fade-in border-teal-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  {extractedResult.document_type || 'Tax Invoice'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  extractedResult.status === 'done'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  Status: {extractedResult.status?.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {extractedResult.invoice_number || 'Extracted Document'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
              >
                Upload Another
              </button>
              <Link
                to={`/documents/${extractedResult.id}`}
                className="btn-primary shadow-sm"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Extracted Fields Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Vendor / Issuer</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                {extractedResult.vendor_name || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Invoice Date</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {extractedResult.invoice_date ? new Date(extractedResult.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Confidence Score</span>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-400 mt-0.5">
                {Math.round(extractedResult.confidence_score || 0)}%
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                ₹{parseFloat(extractedResult.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Validation Issues Table if any */}
          {extractedResult.issues && extractedResult.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                GST & Compliance Checks
              </h4>
              <div className="space-y-1.5">
                {extractedResult.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                      issue.severity === 'error'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold uppercase tracking-wide">[{issue.rule}]</span>{' '}
                      <span>{issue.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

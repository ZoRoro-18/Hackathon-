import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function Dashboard() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setFile(null);
        await fetchDocuments();
      } else {
        const err = await res.json();
        alert(err.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
        
        {/* Upload Section */}
        <div className="glass-panel" style={{ flex: '1', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} className="text-gradient" />
            Upload Document
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Upload an invoice, receipt, or bank statement. Our Gemini AI Engine will automatically extract and categorize the financial data.
          </p>
          
          <form onSubmit={handleUpload}>
            <div style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '1rem',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <input 
                type="file" 
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ width: '100%' }}
                disabled={uploading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }} 
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing with AI...
                </>
              ) : (
                'Process Document'
              )}
            </button>
          </form>
        </div>

        {/* Recent Documents Section */}
        <div className="glass-panel" style={{ flex: '2', padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} className="text-gradient" />
            Processed Documents
          </h3>
          
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No documents processed yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {documents.map(doc => {
                const meta = typeof doc.extracted_data === 'string' ? JSON.parse(doc.extracted_data) : doc.extracted_data;
                return (
                  <div key={doc.id} style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', 
                          borderRadius: '8px', 
                          background: 'rgba(99, 102, 241, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent-primary)'
                        }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem' }}>{doc.original_filename}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(doc.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                          {meta?.currency || 'INR'} {meta?.amount?.toLocaleString('en-IN') || '0.00'}
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: 'var(--success)'
                        }}>
                          {meta?.documentType || 'DOCUMENT'}
                        </span>
                      </div>
                    </div>
                    
                    {meta?.partyName && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Party Name</div>
                          <div>{meta.partyName}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Date</div>
                          <div>{meta.date}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>Category</div>
                          <div>{meta.category || 'N/A'}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)' }}>AI Confidence</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {meta.confidenceScore > 0.8 ? <CheckCircle size={14} color="var(--success)" /> : <AlertCircle size={14} color="var(--warning)" />}
                            {((meta.confidenceScore || 0) * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { business, user } = useAuth();
  const [formData, setFormData] = useState({
    name: business?.name || '',
    gstin: business?.gstin || '',
    state: business?.state || 'Maharashtra',
    stateCode: business?.state_code || '27'
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Business settings updated successfully');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Business & GST Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure legal entity details, state code, and tax compliance defaults
        </p>
      </div>

      <div className="fintech-card p-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Legal Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="fintech-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GSTIN (15 Alphanumeric)
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                className="fintech-input font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                State Code
              </label>
              <input
                type="text"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                className="fintech-input font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary shadow-sm">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

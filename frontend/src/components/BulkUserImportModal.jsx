import React, { useState } from 'react';
import { Upload, X, Loader2, AlertTriangle, CheckCircle2, FileJson } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api';

const BulkUserImportModal = ({ roles, onClose, onImportSuccess }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setError(null);
    if (!jsonInput.trim()) {
      setError("Please paste JSON data first.");
      return;
    }

    let parsedData = [];
    try {
      parsedData = JSON.parse(jsonInput);
      if (!Array.isArray(parsedData)) throw new Error();
    } catch {
      setError("Invalid JSON format. Expected an array of objects.");
      return;
    }

    if (parsedData.length === 0) {
      setError("Array is empty.");
      return;
    }

    // Validate structure roughly
    const invalidItem = parsedData.find(item => !item.name || !item.email || !item.password || !item.role_id);
    if (invalidItem) {
      setError("One or more items are missing required fields (name, email, password, role_id).");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/users/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ users: parsedData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');

      onImportSuccess(data.users, data.message);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleJson = `[
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "0912345678",
    "password": "password123",
    "role_id": ${roles[0]?.id || 2}
  }
]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <Upload className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em]">Bulk Operation</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Import Users via JSON</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-bold">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-500 mb-2 flex items-center space-x-2">
               <FileJson className="h-4 w-4" /> <span>Format Example</span>
            </h3>
            <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
              {sampleJson}
            </pre>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Paste JSON Array Here</label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="[\n  { ... }\n]"
              className="w-full h-48 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-none"
            />
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={loading}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{loading ? 'Importing...' : 'Import Users'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUserImportModal;

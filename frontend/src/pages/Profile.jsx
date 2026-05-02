import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api';

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      
      // Update local auth context
      login(data, token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-10">
        <div className="flex items-center space-x-2 text-purple-500 mb-1">
          <User className="h-4 w-4" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Account Settings</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
          My <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent not-italic">Profile</span>
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 space-y-6 shadow-sm">
        {error && (
          <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm font-bold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 text-sm font-bold">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <input name="name" value={form.name} onChange={handle} required className="input pr-12 pl-4" />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <input name="email" type="email" value={form.email} onChange={handle} required className="input pr-12 pl-4" />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <input name="phone" value={form.phone} onChange={handle} className="input pr-12 pl-4" />
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">New Password (leave blank to keep current)</label>
            <div className="relative">
              <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={handle} className="input pr-20 pl-4" placeholder="Min. 6 characters" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-3 text-slate-400">
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                <Lock className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="flex items-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:from-purple-400 hover:to-indigo-500 transition-all disabled:opacity-50 active:scale-95">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{loading ? 'Saving...' : 'Update Profile'}</span>
          </button>
        </div>
      </form>

      <style>{`
        .label { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: rgb(100 116 139); margin-bottom: 8px; }
        .input { width: 100%; background: rgb(248 250 252); border: 1px solid rgb(226 232 240); border-radius: 16px; padding: 12px 16px; font-size: 14px; outline: none; color: rgb(15 23 42); transition: border-color 0.2s; }
        .dark .input { background: rgb(15 23 42 / 0.5); border-color: rgb(51 65 85 / 0.6); color: white; }
        .input:focus { border-color: rgb(139 92 246); }
      `}</style>
    </div>
  );
}

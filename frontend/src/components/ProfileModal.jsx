import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  if (!isOpen) return null;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const payload = { ...form };
      if (!payload.password) delete payload.password; // Don't send empty password
      
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
      
      if (!res.ok) throw new Error(data.message || 'فشل تحديث الملف الشخصي');
      
      // Update local storage and context
      login(data, token);
      
      showToast('تم تحديث الملف الشخصي بنجاح');
      
      // Optional: close after delay
      setTimeout(onClose, 1500);
      
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#0a1020] rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-3 text-right">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">إعدادات الحساب</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تحديث البيانات الشخصية</p>
            </div>
            <div className="h-10 w-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" dir="rtl">
          
          {toast && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm font-bold border ${
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
              {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
              <p>{toast.msg}</p>
            </div>
          )}

          <form id="profileForm" onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all pr-11"
                />
                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all pl-11 text-left"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">رقم الهاتف</label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all pl-11 text-left"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5">كلمة المرور الجديدة <span className="text-slate-400 font-normal">(اتركه فارغاً لعدم التغيير)</span></label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  dir="ltr"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all pl-11 text-left"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end">
          <button
            type="submit"
            form="profileForm"
            disabled={saving}
            className="flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>حفظ التعديلات</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;

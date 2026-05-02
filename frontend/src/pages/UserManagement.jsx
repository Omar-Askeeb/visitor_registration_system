import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Save, Loader2,
  AlertTriangle, CheckCircle2, ShieldCheck, Key,
  Eye, EyeOff, UserCog, Phone, BarChart3, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BulkUserImportModal from '../components/BulkUserImportModal';

const API = import.meta.env.VITE_API_URL || '/api';

const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role_id: '' };

/* ─────── User Modal — at module level to avoid focus loss ─────── */
const TextInput = ({ label, name, type = 'text', value, onChange, placeholder = '', autoComplete }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">{label}</label>
    <input
      name={name} type={type} value={value ?? ''} onChange={onChange}
      placeholder={placeholder} autoComplete={autoComplete}
      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all"
    />
  </div>
);

const UserModal = ({ user, roles, onClose, onSave }) => {
  const [form, setForm]         = useState(user ? { ...user, password: '', role_id: user.role_id || user.role?.id } : { ...EMPTY_FORM, role_id: roles[0]?.id });
  const [showPwd, setShowPwd]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const isEdit = Boolean(user?.id);

  const handle = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url    = isEdit ? `${API}/users/${user.id}` : `${API}/users`;
      const body   = { ...form };
      if (isEdit && !body.password) delete body.password;

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'Failed'); }
      onSave(await r.json(), isEdit);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <UserCog className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em]">{isEdit ? 'Edit User' : 'New User'}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{isEdit ? user.name : 'Create User Account'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <TextInput label="Full Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Ahmed Al-Sharif" />
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Email *" name="email" type="email" value={form.email} onChange={handle} placeholder="user@digitalgroup.ly" autoComplete="off" />
            <TextInput label="Phone Number" name="phone" value={form.phone} onChange={handle} placeholder="091XXXXXXX" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
              Password {isEdit && <span className="normal-case font-normal">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                name="password" type={showPwd ? 'text' : 'password'}
                value={form.password} onChange={handle}
                placeholder={isEdit ? '••••••••' : 'Min. 6 characters'}
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all"
              />
              <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id} type="button"
                  onClick={() => setForm(prev => ({ ...prev, role_id: r.id }))}
                  className={`relative p-3 rounded-xl border text-left transition-all ${
                    form.role_id === r.id
                      ? `bg-${r.color || 'slate'}-500/10 border-${r.color || 'slate'}-500/40 text-${r.color || 'slate'}-600 dark:text-${r.color || 'slate'}-400`
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${form.role_id === r.id ? '' : 'text-slate-600 dark:text-slate-400'}`}>
                    {r.display_name}
                  </div>
                  <div className="text-[9px] leading-tight opacity-70">{r.description}</div>
                  {form.role_id === r.id && (
                    <div className={`absolute top-2 right-2 h-2 w-2 rounded-full bg-${r.color || 'slate'}-500`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button
            onClick={submit} disabled={saving}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────── Delete Confirm ─────── */
const DeleteModal = ({ user, onClose, onDelete }) => {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/users/${user.id}`, { method: 'DELETE', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error();
      onDelete(user.id);
    } catch { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0c1325] border border-red-500/20 rounded-[24px] p-8 shadow-[0_40px_80px_-20px_rgba(239,68,68,0.3)]">
        <div className="flex items-center justify-center h-14 w-14 bg-red-500/10 rounded-2xl mx-auto mb-6">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-900 dark:text-white mb-2">Delete User?</h3>
        <p className="text-center text-sm text-slate-500 mb-8">
          Remove <span className="font-black text-slate-900 dark:text-white">"{user.name}"</span> from the system?
        </p>
        <div className="flex space-x-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={go} disabled={busy} className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span>{busy ? 'Deleting…' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────── Role badge ─────── */
const RoleBadge = ({ role }) => {
  if (!role) return <span className="text-xs text-slate-400">—</span>;
  const color = role.color || 'slate';
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 border-${color}-500/20`}>
      {role.display_name}
    </span>
  );
};

/* ═══════════════════════════════════
   Main UserManagement Page
═══════════════════════════════════ */
const UserManagement = () => {
  const [users, setUsers]           = useState([]);
  const [roles, setRoles]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalUser, setModalUser]   = useState(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]           = useState(null);
  const navigate = useNavigate();

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`${API}/users`, { headers: { Accept: 'application/json' } }),
        fetch(`${API}/roles`, { headers: { Accept: 'application/json' } })
      ]);
      setUsers(await uRes.json());
      setRoles(await rRes.json());
    } catch { setUsers([]); setRoles([]); }
    finally { setLoading(false); }
  };

  const openCreate  = () => { setModalUser(null);  setModalOpen(true); };
  const openEdit    = (u) => { setModalUser(u);     setModalOpen(true); };
  const closeModal  = () => { setModalOpen(false); setModalUser(null); };

  const handleSave = (saved, isEdit) => {
    setUsers(prev => isEdit ? prev.map(u => u.id === saved.id ? saved : u) : [saved, ...prev]);
    closeModal();
    notify(isEdit ? 'User updated.' : 'User created.');
  };

  const handleDelete = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteTarget(null);
    notify('User deleted.', 'error');
  };

  const counts = roles.reduce((acc, r) => {
    acc[r.name] = users.filter(u => u.role?.id === r.id).length;
    return acc;
  }, {});

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 min-h-full transition-colors duration-300">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold text-white ${toast.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'}`}>
          <CheckCircle2 className="h-4 w-4" /><span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
        <div className="absolute -top-20 -left-20 h-40 w-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Personnel Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic mb-2">
            Manage <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent not-italic">Personnel</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm max-w-xl">
            Manage system users and their access roles. Each user role controls what they can see and do.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <Users className="h-4 w-4" /><span>Bulk Import</span>
          </button>
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-400 hover:to-cyan-400 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-4 w-4" /><span>New User</span>
          </button>
        </div>
      </header>

      {/* Role summary pills */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Total Users',  value: users.length,        color: 'slate' },
          { label: 'Training Sessions', value: users.reduce((acc, u) => acc + (parseInt(u.training_count) || 0), 0), color: 'purple' },
          { label: 'Data Entry',   value: counts['data_entry'] || 0,   color: 'emerald' },
          { label: 'Auditors',     value: counts['auditor'] || 0,      color: 'purple' },
        ].map(s => (
          <div key={s.label} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3">
            <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{s.value}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Role legend cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {roles.map(r => (
          <div key={r.id} className={`bg-${r.color || 'slate'}-500/5 border border-${r.color || 'slate'}-500/20 rounded-2xl p-4`}>
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className={`h-4 w-4 text-${r.color || 'slate'}-500`} />
              <span className={`text-xs font-black uppercase tracking-widest text-${r.color || 'slate'}-600 dark:text-${r.color || 'slate'}-400`}>{r.display_name}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{r.description || 'Custom role'}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Personnel…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-700" />
          </div>
          <div className="text-center">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">No Users Yet</h3>
            <p className="text-sm text-slate-400 max-w-xs">Create the first user account to get started.</p>
          </div>
          <button onClick={openCreate} className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg transition-all">
            <Plus className="h-4 w-4" /><span>Create First User</span>
          </button>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[24px] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/30 text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500">
                <th className="px-6 py-5">Name / Phone</th>
                <th className="px-6 py-5">Email</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Practice Score</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5">Joined</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-blue-500/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/20">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {u.phone || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">{u.email}</td>
                  <td className="px-6 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">⏱️ Avg</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {u.avg_fill_time ? `${Math.round(u.avg_fill_time)}s` : '—'}
                          </span>
                       </div>
                       <div className="flex flex-col border-r border-slate-100 dark:border-slate-800/50 pr-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">⚡ Best</span>
                          <span className="text-sm font-black text-emerald-500">
                            {u.best_fill_time ? `${Math.round(u.best_fill_time)}s` : '—'}
                          </span>
                       </div>
                       <div className="flex flex-col border-r border-slate-100 dark:border-slate-800/50 pr-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">🐢 Slowest</span>
                          <span className="text-sm font-black text-amber-500">
                            {u.worst_fill_time ? `${Math.round(u.worst_fill_time)}s` : '—'}
                          </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-4">
                      {/* Records Created (Data Entry Metric) */}
                      {(u.role?.name === 'admin' || u.role?.name === 'data_entry') && (
                        <div className="flex flex-col">
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-tighter">Created</span>
                          <span className="font-black text-slate-900 dark:text-white leading-none">{u.visitors_created_count || 0}</span>
                        </div>
                      )}
 
                      {/* Records Verified (Auditor Metric) */}
                      {(u.role?.name === 'admin' || u.role?.name === 'auditor') && (
                         <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/50 pl-3">
                           <span className="text-slate-400 font-bold uppercase text-[8px] tracking-tighter">Verified</span>
                           <span className="font-black text-cyan-600 dark:text-cyan-400 leading-none">{u.verified_records_count || 0}</span>
                         </div>
                      )}
 
                      {/* Quality Score (Accuracy) */}
                      {(u.role?.name === 'admin' || u.role?.name === 'data_entry') && (
                        <div className="flex flex-col border-l border-slate-100 dark:border-slate-800/50 pl-3">
                          <span className="text-slate-400 font-bold uppercase text-[8px] tracking-tighter">Accuracy</span>
                          {(() => {
                            if (!u.visitors_created_count || u.visitors_created_count === 0) {
                              return <div className="font-black leading-none text-emerald-500">100%</div>;
                            }
                            const accuracy = Math.max(0, Math.round(((u.visitors_created_count - (u.fixed_records_count || 0)) / u.visitors_created_count) * 100));
                            const color = accuracy > 95 ? 'emerald' : accuracy > 85 ? 'amber' : 'red';
                            return (
                              <div className={`font-black leading-none ${
                                color === 'emerald' ? 'text-emerald-500' :
                                color === 'amber' ? 'text-amber-500' :
                                'text-red-500'
                              }`}>{accuracy}%</div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <button 
                        onClick={() => navigate(`/reviews?creator_id=${u.id}`)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-purple-500 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                        title="Inspect Work"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(u)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen   && <UserModal   user={modalUser} roles={roles} onClose={closeModal} onSave={handleSave} />}
      {deleteTarget && <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDelete={handleDelete} />}
      {bulkModalOpen && (
        <BulkUserImportModal
          roles={roles}
          onClose={() => setBulkModalOpen(false)}
          onImportSuccess={(newUsers, msg) => {
            setUsers(prev => [...newUsers, ...prev]);
            notify(msg);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;

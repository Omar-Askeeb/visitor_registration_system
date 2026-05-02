import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, X, Save, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || '/api';

const COLORS = ['slate', 'blue', 'cyan', 'emerald', 'amber', 'purple', 'pink', 'rose'];

const RoleModal = ({ role, permissions, onClose, onSave }) => {
  const [form, setForm] = useState(role ? { ...role, permissions: role.permissions?.map(p => p.id) || [] } : { name: '', display_name: '', color: 'slate', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(role?.id);
  const isDefault = ['admin', 'data_entry', 'auditor', 'self_service_device'].includes(form.name);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const togglePerm = (id) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id]
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `${API}/roles/${role.id}` : `${API}/roles`;
      // Ensure name is safe
      const payload = { ...form, name: form.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') };

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'Failed'); }
      onSave(await r.json(), isEdit);
    } catch(err) { setError(err.message); }
    finally { setSaving(false); }
  };

  // Group permissions for UI
  const groupedPerms = permissions.reduce((acc, p) => {
    const group = p.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em]">{isEdit ? 'Edit Role' : 'New Role'}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{isEdit ? role.display_name : 'Create Role'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="roleForm" onSubmit={submit} className="px-8 py-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          {isDefault && (
            <div className="flex items-center space-x-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm font-bold mb-4">
              <AlertTriangle className="h-4 w-4 shrink-0" /><span>This is a system default role. Modify with caution.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Display Name *</label>
              <input name="display_name" value={form.display_name} onChange={handle} required
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">System Name (ID) *</label>
              <input name="name" value={form.name} onChange={handle} disabled={isEdit} required placeholder="e.g. manager"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white disabled:opacity-50" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Description</label>
            <input name="description" value={form.description} onChange={handle}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white disabled:opacity-50" />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Color Label</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm(prev => ({...prev, color: c}))}
                  className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${form.color === c ? `border-${c}-500 shadow-md shadow-${c}-500/30 scale-110` : 'border-transparent scale-100'}`}>
                  <div className={`h-6 w-6 rounded-full bg-${c}-500`} />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">{group}</div>
                  <div className="space-y-2">
                    {perms.map(p => (
                      <label key={p.id} className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${form.permissions.includes(p.id) ? 'bg-cyan-500/5' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
                        <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => togglePerm(p.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                        <div>
                          <div className={`text-xs font-bold ${form.permissions.includes(p.id) ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>{p.display_name}</div>
                          <div className="text-[9px] text-slate-400">{p.name}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </form>

        <div className="px-8 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end space-x-3 shrink-0">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button form="roleForm" type="submit" disabled={saving} className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:from-purple-400 hover:to-indigo-500 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isEdit ? 'Update Role' : 'Create Role'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RolesManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalRole, setModalRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`${API}/roles`, { headers: { Accept: 'application/json' } }),
        fetch(`${API}/roles/permissions`, { headers: { Accept: 'application/json' } })
      ]);
      setRoles(await rRes.json());
      setPermissions(await pRes.json());
    } catch {}
    setLoading(false);
  };

  const handleSave = (saved, isEdit) => {
    setRoles(prev => isEdit ? prev.map(r => r.id === saved.id ? saved : r) : [...prev, saved]);
    setModalOpen(false);
  };

  if (loading) return <div className="flex p-10 justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-slate-500">Configure access levels and permissions for users.</p>
        </div>
        <button onClick={() => { setModalRole(null); setModalOpen(true); }} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-colors">
          <Plus className="h-4 w-4" /><span>New Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(r => {
          const isSystem = ['admin', 'data_entry', 'auditor', 'self_service_device'].includes(r.name);
          return (
            <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-xl bg-${r.color || 'slate'}-500/10 flex items-center justify-center`}>
                    <ShieldCheck className={`h-5 w-5 text-${r.color || 'slate'}-500`} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{r.display_name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{r.name} {isSystem && '(System)'}</span>
                  </div>
                </div>
                <button onClick={() => { setModalRole(r); setModalOpen(true); }} className="action-btn btn-purple p-2 text-slate-400 rounded-xl">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6 flex-1">{r.description || 'No description provided.'}</p>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center text-xs">
                <span className="font-black text-slate-400 uppercase tracking-widest">{r.permissions?.length || 0} Permissions</span>
                <span className={`px-2 py-1 rounded bg-${r.color || 'slate'}-500/10 text-${r.color || 'slate'}-500 font-bold uppercase text-[9px] tracking-widest`}>Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <RoleModal role={modalRole} permissions={permissions} onClose={() => setModalOpen(false)} onSave={handleSave} />}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Shield, User2, RefreshCw, Search, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ACTION_LABELS = {
  login:          { label: 'تسجيل دخول',      color: 'emerald' },
  logout:         { label: 'تسجيل خروج',      color: 'slate' },
  create_visitor: { label: 'إضافة زائر',       color: 'cyan' },
  update_visitor: { label: 'تعديل زائر',       color: 'amber' },
};

const Badge = ({ action }) => {
  const cfg = ACTION_LABELS[action] || { label: action, color: 'slate' };
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    slate:   'bg-slate-500/10  text-slate-400   border-slate-500/20',
    cyan:    'bg-cyan-500/10   text-cyan-400    border-cyan-500/20',
    amber:   'bg-amber-500/10  text-amber-400   border-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[cfg.color]}`}>
      {cfg.label}
    </span>
  );
};

const ActivityLogs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filterAction ? `?action=${filterAction}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/logs${qs}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('خطأ في تحميل السجلات');
      setLogs(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterAction]);

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.user?.name?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.ip_address?.includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">سجل النشاط</h1>
            <p className="text-xs text-slate-400 font-medium">جميع إجراءات النظام</p>
          </div>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-cyan-500 transition-colors">
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الوصف..."
            className="w-full bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all appearance-none"
          >
            <option value="">كل الإجراءات</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className="col-span-3">المستخدم</span>
          <span className="col-span-2">الإجراء</span>
          <span className="col-span-4">الوصف</span>
          <span className="col-span-2">عنوان IP</span>
          <span className="col-span-1">الوقت</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-bold">{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-bold">لا توجد سجلات.</div>
        ) : (
          filtered.map(log => (
            <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors text-sm">
              <div className="col-span-3 flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                  {log.user?.name?.[0] ?? '?'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight">{log.user?.name ?? 'محذوف'}</div>
                  <div className="text-[9px] text-slate-400 uppercase">{log.user?.role ?? '—'}</div>
                </div>
              </div>
              <div className="col-span-2 flex items-center"><Badge action={log.action} /></div>
              <div className="col-span-4 flex items-center text-slate-500 dark:text-slate-400 text-xs truncate">{log.description ?? '—'}</div>
              <div className="col-span-2 flex items-center text-slate-400 text-xs font-mono">{log.ip_address ?? '—'}</div>
              <div className="col-span-1 flex items-center text-slate-400 text-[10px]">
                {new Date(log.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Printer, 
  Edit3, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ArrowRight,
  User,
  History,
  Loader2,
  X,
  ShieldCheck,
  Check,
  UserCheck,
  Calendar,
  Fingerprint,
  Mail,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { openPrintWindow } from '../utils/printBadge';

const API = import.meta.env.VITE_API_URL || '/api';

const VERIFICATION_META = {
  pending: { label: 'Pending Audit', color: 'slate', icon: History },
  direct:  { label: 'Audited (Good)', color: 'emerald', icon: ShieldCheck },
  fixed:   { label: 'Audited (Fixed)', color: 'amber', icon: AlertCircle },
};

const ReviewForms = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // States
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [events, setEvents]     = useState([]);
  const [users, setUsers]       = useState([]);
  
  // Filters
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCreatorId, setSelectedCreatorId] = useState('');
  const [selectedAuditorId, setSelectedAuditorId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, verified
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [processing, setProcessing]   = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [evRes, userRes] = await Promise.all([
        fetch(`${API}/events`),
        fetch(`${API}/users`)
      ]);
      const evs = await evRes.json();
      const usr = await userRes.json();
      setEvents(evs);
      setUsers(usr);
      
      const creatorId = searchParams.get('creator_id');
      const auditorId = searchParams.get('verified_by_id');
      const eventId   = searchParams.get('event_id');

      if (eventId) setSelectedEventId(eventId);
      else if (evs.length > 0) setSelectedEventId(evs[0].id);

      if (creatorId) setSelectedCreatorId(creatorId);
      if (auditorId) setSelectedAuditorId(auditorId);
    } catch (e) { console.error(e); }
  };

  const loadVisitors = async () => {
    if (!selectedEventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let url = `${API}/events/${selectedEventId}/visitors?per_page=100`;
      if (selectedCreatorId) url += `&creator_id=${selectedCreatorId}`;
      if (selectedAuditorId) url += `&verified_by_id=${selectedAuditorId}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setVisitors(data.data || []);
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, [selectedEventId, selectedCreatorId, selectedAuditorId, statusFilter]);

  // Actions
  const handleVerify = async (visitorId, type = 'direct') => {
    setProcessing(true);
    try {
      const r = await fetch(`${API}/events/${selectedEventId}/visitors/${visitorId}/verify?type=${type}`, {
        method: 'POST',
        headers: { Accept: 'application/json' }
      });
      if (r.ok) {
        const updated = await r.json();
        setVisitors(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
      }
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  const handleBatchVerify = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      const r = await fetch(`${API}/events/${selectedEventId}/visitors/batch-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (r.ok) loadVisitors();
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  const handlePrint = async (v) => {
    try {
      await fetch(`${API}/events/${selectedEventId}/visitors/${v.id}/increment-print`, { method: 'POST' });
      const evt = events.find(e => e.id == selectedEventId);
      openPrintWindow(v, v.badgeID, evt?.name || '');
    } catch (e) { console.error(e); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visitors.length) setSelectedIds([]);
    else setSelectedIds(visitors.map(v => v.id));
  };

  // Status Badge Helper
  const getStatusBadge = (v) => {
    const status = v.is_verified ? (v.verification_type || 'direct') : 'pending';
    const meta = VERIFICATION_META[status];
    const Icon = meta.icon;
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest bg-${meta.color}-500/10 text-${meta.color}-600 dark:text-${meta.color}-400 border-${meta.color}-500/20 shadow-sm`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{meta.label}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 transition-colors duration-300 min-h-full">
      
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="absolute -top-20 -left-20 h-40 w-40 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div>
           <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Quality Assuarance</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic mb-2">Form <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent not-italic">Review</span> Queue</h1>
          <p className="text-slate-500 font-medium text-sm max-w-xl">Audit and verify visitor data. Compare original entries with auditor corrections.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBatchVerify}
              disabled={processing}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all text-[10px] uppercase tracking-[0.2em]"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Verify Selected ({selectedIds.length})</span>
            </button>
          )}
          <button 
            onClick={loadVisitors}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-purple-500 transition-all"
          >
            <History className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Advanced Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Search */}
        <div className="md:col-span-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-purple-500 transition-colors" />
          <input 
            type="text" dir="rtl"
            placeholder="Search Name, Phone, ID..."
            className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-6 focus:outline-none focus:border-purple-500 transition-all text-[11px] font-bold text-right"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Exhibition Filter */}
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none transition-all"
          >
            <option value="">All Exhibitions</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>

        {/* Personnel Filter */}
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedCreatorId}
            onChange={(e) => setSelectedCreatorId(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none transition-all text-emerald-600 dark:text-emerald-400"
          >
            <option value="">By Personnel (All)</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        {/* Auditor Filter */}
        <div className="relative">
          <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <select
            value={selectedAuditorId}
            onChange={(e) => setSelectedAuditorId(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold focus:outline-none transition-all text-indigo-600 dark:text-indigo-400"
          >
            <option value="">By Auditor (All)</option>
            {users.filter(u => u.role !== 'data_entry').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Verification Status Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'all',     label: 'All Records',   color: 'slate' },
          { id: 'pending', label: 'Pending Only',  color: 'amber' },
          { id: 'verified', label: 'Audited Only',  color: 'emerald' },
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setStatusFilter(p.id)}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              statusFilter === p.id 
                ? (p.id === 'all' ? 'bg-slate-900 text-white shadow-lg' : 
                   p.id === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 
                   'bg-emerald-500 text-white shadow-lg')
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/50 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 dark:text-slate-600 text-[10px] uppercase font-black tracking-[0.2em] bg-slate-50 dark:bg-slate-950/20">
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    checked={visitors.length > 0 && selectedIds.length === visitors.length} 
                    onChange={toggleSelectAll}
                    className="h-4 w-4 accent-purple-500 rounded border-slate-300" 
                  />
                </th>
                <th className="px-6 py-5">FORM ID</th>
                <th className="px-6 py-5">Visitor Details</th>
                <th className="px-6 py-5">PERSONNEL (Creator)</th>
                <th className="px-6 py-5">EXHIBITION</th>
                <th className="px-6 py-5">Audit Status</th>
                <th className="px-6 py-5">Email Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
              {loading ? (
                <tr><td colSpan="7" className="py-24 text-center">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-500/50 mb-3" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Loading queue…</span>
                </td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan="7" className="py-24 text-center">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800">
                    <Check className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">All Clear</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">No records matching your filters.</p>
                </td></tr>
              ) : visitors.filter(v => v.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) || (v.formID && v.formID.includes(searchTerm))).map((v) => (
                <tr key={v.id} className={`hover:bg-purple-500/[0.01] transition-all group ${selectedIds.includes(v.id) ? 'bg-purple-500/[0.03]' : ''}`}>
                  <td className="px-6 py-6">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(v.id)} 
                      onChange={() => toggleSelect(v.id)}
                      className="h-4 w-4 accent-purple-500 rounded border-slate-300" 
                    />
                  </td>
                  <td className="px-6 py-6 font-mono text-[11px] font-black text-purple-600 dark:text-purple-400 flex items-center space-x-2">
                    <Fingerprint className="h-3 w-3 opacity-30" />
                    <span>{v.formID}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-black text-slate-900 dark:text-white text-[13px] leading-none mb-1.5">{v.visitorName}</div>
                    <div className="flex items-center space-x-2">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.organisation || 'N/A'}</span>
                       {v.phone1 && (
                         <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-md font-mono">{v.phone1}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center space-x-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs">
                        {v.creator?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-slate-900 dark:text-white leading-none mb-0.5">{v.creator?.name || 'System'}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          {new Date(v.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     {(() => {
                        const evt = events.find(e => e.id == v.event_id);
                        return <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-2 py-1 rounded-md">{evt?.name || 'Unknown'}</span>;
                     })()}
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-1.5">
                      {getStatusBadge(v)}
                      {v.verified_by_id && (
                        <div className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-tighter">
                          by {v.verifiedBy?.name || v.verified_by?.name || 'Auditor'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6 font-bold text-[10px] uppercase">
                    {v.email_send_status === 'sent' && (
                       <div className="flex flex-col items-center">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
                             <Mail className="h-3 w-3" />
                             <span>Sent</span>
                          </div>
                          <span className="text-[8px] text-slate-400 mt-1 tabular-nums">
                             {v.email_sent_at ? new Date(v.email_sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                       </div>
                    )}
                    {v.email_send_status === 'failed' && (
                       <div className="flex flex-col items-center" title={v.email_send_error}>
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg cursor-help">
                             <AlertCircle className="h-3 w-3" />
                             <span>Failed</span>
                          </div>
                          <span className="text-[8px] text-red-400 mt-1 truncate max-w-[80px] text-center">
                             {v.email_send_error}
                          </span>
                       </div>
                    )}
                    {(!v.email_send_status || v.email_send_status === 'pending') && (
                       <div className="flex justify-center">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg">
                             <History className="h-3 w-3" />
                             <span>Pending</span>
                          </div>
                       </div>
                    )}
                    {v.email_send_status === 'skipped' && (
                       <div className="flex justify-center">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg opacity-50">
                             <X className="h-3 w-3" />
                             <span>Skipped</span>
                          </div>
                       </div>
                    )}
                  </td>

                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/registration?event_id=${selectedEventId}&edit_id=${v.id}`)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-purple-500 hover:border-purple-500/30 transition-all"
                        title="Quick Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handlePrint(v)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 transition-all"
                        title="Print Badge"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      {!v.is_verified && (
                        <button 
                          onClick={() => handleVerify(v.id, 'direct')}
                          disabled={processing}
                          className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          title="Verify (Good)"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/audit-correction?event_id=${v.event_id}&form_id=${v.formID}`)}
                        className="p-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 transition-all shadow-md group/btn"
                        title="Deep Audit Correction"
                      >
                        <ShieldCheck className="h-4 w-4 text-cyan-400 group-hover/btn:text-cyan-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReviewForms;

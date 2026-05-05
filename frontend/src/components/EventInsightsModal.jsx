import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  CalendarDays, 
  TrendingUp, 
  UserCheck, 
  Repeat, 
  Activity,
  FileText,
  Loader2,
  Globe,
  MapPin,
  MonitorSmartphone,
  Wifi,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const SourceBadge = ({ label, count, icon: Icon, colorClass, bgClass, borderClass }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bgClass} ${borderClass}`}>
    <Icon className={`h-3.5 w-3.5 ${colorClass} shrink-0`} />
    <div>
      <div className={`text-base font-black tabular-nums ${colorClass}`}>{count.toLocaleString()}</div>
      <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</div>
    </div>
  </div>
);

const EventInsightsModal = ({ event, onClose, onRefresh }) => {
  const [cleaningDate, setCleaningDate] = useState(null);
  const [missingScans, setMissingScans] = useState(null); // null = not loaded, [] = none, [...] = list
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [fixingMissing, setFixingMissing] = useState(false);
  const [fixFlag, setFixFlag] = useState('');
  const [realMissingCount, setRealMissingCount] = useState(null);
  const [fullEvent, setFullEvent] = useState(event);
  const [fetchingFull, setFetchingFull] = useState(!event.daily_stats);

  useEffect(() => {
    if (!event.daily_stats && event.id) {
      setFetchingFull(true);
      fetch(`${API_BASE}/events/${event.id}/insights`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setFullEvent(data);
      })
      .finally(() => setFetchingFull(false));
    } else {
      setFullEvent(event);
      setFetchingFull(false);
    }
  }, [event.id, event.daily_stats]);

  const displayEvent = fullEvent || event;

  useEffect(() => {
    if (displayEvent?.id) {
       fetch(`${API_BASE}/events/${displayEvent.id}/missing-scans`, {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
       })
       .then(r => r.ok ? r.json() : [])
       .then(d => setRealMissingCount(d.length))
       .catch(() => setRealMissingCount(0));
    }
  }, [displayEvent?.id]);

  if (!fullEvent || fetchingFull || event.loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
        <div className="relative w-full max-w-4xl bg-white dark:bg-[#0c1325] rounded-[32px] overflow-hidden shadow-2xl border border-white/10 p-12 flex flex-col items-center justify-center space-y-4 text-center">
           <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse leading-loose">
             Loading Detailed Statistics...<br/>
             <span className="text-[10px] opacity-50">Fetching visitor data, daily scans, and source breakdowns</span>
           </p>
        </div>
      </div>
    );
  }

  const attendanceRate = Math.round(((displayEvent.total_attendance || 0) / (displayEvent.registered_count || 1)) * 100);
  const targetRate    = Math.round(((displayEvent.registered_count || 0) / (displayEvent.target_visitors || 1)) * 100);

  const onlineAttended   = displayEvent.online_attended    ?? 0;
  const onsiteCount      = displayEvent.onsite_count       ?? 0;
  const selfServiceCount = displayEvent.self_service_count ?? 0;

  const handleCleanDay = async (scanDate) => {
    try {
      setCleaningDate(scanDate);
      const res = await fetch(`${API_BASE}/events/${displayEvent.id}/clean-scans-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ scan_date: scanDate })
      });
      if (res.ok && onRefresh) await onRefresh();
    } catch(e) {
      console.error(e);
    } finally {
      setCleaningDate(null);
    }
  };

  const loadMissingScans = async () => {
    setLoadingMissing(true);
    try {
      const res = await fetch(`${API_BASE}/events/${displayEvent.id}/missing-scans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setMissingScans(data);
    } catch (e) {
      console.error(e);
      setMissingScans([]);
    } finally {
      setLoadingMissing(false);
    }
  };

  const handleFixMissing = async () => {
    if (!missingScans || missingScans.length === 0) return;
    setFixingMissing(true);
    try {
      const res = await fetch(`${API_BASE}/events/${displayEvent.id}/fix-missing-scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          visitor_ids: missingScans.map(v => v.id),
          flag: fixFlag
        })
      });
      if (res.ok) {
        setMissingScans([]);
        if (onRefresh) await onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFixingMissing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-[0.4em]">Analytics Node</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
              Detailed <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent not-italic">Insights</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group"
          >
            <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 pt-36 h-[85vh] overflow-y-auto custom-scrollbar space-y-8">

          {/* Event Banner */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <FileText className="h-32 w-32" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-cyan-500/20 shrink-0">
                {displayEvent.name?.[0] || '?'}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{displayEvent.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <CalendarDays className="h-3 w-3 text-cyan-500" />
                    <span>{new Date(displayEvent.start_date).toLocaleDateString()} — {new Date(displayEvent.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 shadow-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span>{displayEvent.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 1: Performance + Source Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: Summary Metrics */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Total Performance</h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Visitors</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic tabular-nums">{(displayEvent.registered_count || 0).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${targetRate}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-cyan-500">{targetRate}% of Target</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Attendees</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic tabular-nums">{(displayEvent.unique_visitors_count || 0).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${Math.round(((displayEvent.unique_visitors_count || 0) / (displayEvent.registered_count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-indigo-500">{Math.round(((displayEvent.unique_visitors_count || 0) / (displayEvent.registered_count || 1)) * 100)}% Conversion</span>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Visits (Scans)</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic tabular-nums">{(displayEvent.total_attendance || 0).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${attendanceRate}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-emerald-500">{attendanceRate}% Daily Average</span>
                  </div>
                </div>
              </div>

              {/* Visit Frequency / Return Visitors */}
              <div className="mt-8 space-y-4">
                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Visit Frequency Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => {
                    const count = displayEvent.visit_frequency?.[num] || 0;
                    const totalUniques = displayEvent.total_attendance || 1;
                    const percent = Math.round((count / totalUniques) * 100);
                    const label = num === 4 ? '4+ Day Visits' : `${num} Day Visit${num > 1 ? 's' : ''}`;
                    const color = num === 1 ? 'text-cyan-400' : num === 2 ? 'text-amber-400' : num === 3 ? 'text-orange-400' : 'text-rose-400';
                    const bgColor = num === 1 ? 'bg-cyan-500/10' : num === 2 ? 'bg-amber-500/10' : num === 3 ? 'bg-orange-500/10' : 'bg-rose-500/10';
                    const borderColor = num === 1 ? 'border-cyan-500/20' : num === 2 ? 'border-amber-500/20' : num === 3 ? 'border-orange-500/20' : 'border-rose-500/20';

                    return (
                      <div key={num} className={`p-4 rounded-2xl border ${bgColor} ${borderColor} flex flex-col items-center justify-center text-center space-y-1`}>
                        <div className={`text-2xl font-black italic tabular-nums ${color}`}>{count.toLocaleString()}</div>
                        <div className="text-[9px] font-black uppercase tracking-tighter text-slate-500 leading-none">{label}</div>
                        <div className="text-[8px] font-bold text-slate-400 opacity-60">({percent}% of unique visitors)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Visitor Source Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Visitor Source Breakdown</h4>

              {/* Online Pre-Registered & Attended */}
              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 rounded-2xl border border-blue-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Online Pre-Reg</div>
                      <div className="text-[9px] text-slate-500 font-medium">Attended (badge printed)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-blue-400 italic tabular-nums">{onlineAttended.toLocaleString()}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">
                      {Math.round((onlineAttended / (displayEvent.registered_count || 1)) * 100)}% of total
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-blue-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((onlineAttended / (displayEvent.registered_count || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Onsite */}
              <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Onsite Registration</div>
                      <div className="text-[9px] text-slate-500 font-medium">Registered at the venue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-emerald-400 italic tabular-nums">{onsiteCount.toLocaleString()}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">
                      {Math.round((onsiteCount / (displayEvent.registered_count || 1)) * 100)}% of total
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((onsiteCount / (displayEvent.registered_count || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Self-Service */}
              <div className="p-5 bg-gradient-to-br from-purple-500/10 to-violet-500/5 rounded-2xl border border-purple-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                      <MonitorSmartphone className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Self-Service Kiosk</div>
                      <div className="text-[9px] text-slate-500 font-medium">Self-registered at kiosk</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-purple-400 italic tabular-nums">{selfServiceCount.toLocaleString()}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">
                      {Math.round((selfServiceCount / (displayEvent.registered_count || 1)) * 100)}% of total
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full bg-purple-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((selfServiceCount / (displayEvent.registered_count || 1)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Kiosk Prints */}
              <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-2xl border border-cyan-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Kiosk Badge Prints</div>
                      <div className="text-[9px] text-slate-500 font-medium">Printed by self-service devices</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-cyan-400 italic tabular-nums">{(displayEvent.kiosk_print_count || 0).toLocaleString()}</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-tight">
                       Source: System Role ID 4
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Daily Breakdown Table (full width) ── */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-800/50 p-6">
            <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Daily Visit Breakdown</span>
            </h4>

            {/* Column headers */}
            {displayEvent.daily_stats?.length > 0 && (
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 px-4 mb-2">
                <div className="w-10" />
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</div>
                <div className="text-[9px] font-black text-cyan-500 uppercase tracking-widest text-right">Scans</div>
                <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest text-right">Online</div>
                <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest text-right">Onsite</div>
                <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest text-right min-w-[60px]">Self-Svc</div>
                <div className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest text-right min-w-[70px]">Total</div>
              </div>
            )}

            <div className="space-y-2">
              {displayEvent.daily_stats?.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  No Scan Data Detected
                </div>
              ) : (
                displayEvent.daily_stats.map((day, i) => {
                  const hasDuplicates   = day.raw_count > day.unique_count;
                  const duplicatesCount = day.raw_count - day.unique_count;
                  const isCleaningThis  = cleaningDate === day.scan_date;
                  const dayOnline       = day.online_attended  ?? 0;
                  const dayOnsite       = day.onsite_count     ?? 0;
                  const daySelf         = day.self_service_count ?? 0;

                  return (
                    <div
                      key={i}
                      className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 p-4 bg-white dark:bg-slate-800/40 rounded-2xl border ${
                        hasDuplicates
                          ? 'border-orange-500/30 dark:border-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)]'
                          : 'border-slate-200 dark:border-slate-700/30'
                      } hover:-translate-y-0.5 transition-all group`}
                    >
                      {/* Day number */}
                      <div className={`h-9 w-9 flex items-center justify-center rounded-xl text-xs font-black shrink-0 ${
                        hasDuplicates
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>

                      {/* Date label */}
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Day of Event</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase">
                          {new Date(day.scan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      {/* Scan unique count */}
                      <div className="text-right">
                        <div className="text-[8px] font-black text-cyan-500 uppercase tracking-widest mb-0.5">Unique Visitors</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums italic group-hover:text-cyan-500 transition-colors">
                          {day.unique_count.toLocaleString()}
                        </div>
                        {hasDuplicates && (
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <span className="text-[8px] font-black text-orange-500">{duplicatesCount} dupes</span>
                            <button
                              onClick={() => handleCleanDay(day.scan_date)}
                              disabled={isCleaningThis}
                              className="h-6 px-2 rounded-lg flex items-center justify-center text-[8px] font-black uppercase tracking-widest text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-all"
                            >
                              {isCleaningThis ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Clean'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Online attended */}
                      <div className="text-right">
                        <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                          <Globe className="h-2.5 w-2.5" /> Online
                        </div>
                        <div className={`text-lg font-black tabular-nums italic ${dayOnline > 0 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {dayOnline.toLocaleString()}
                        </div>
                      </div>

                      {/* Onsite */}
                      <div className="text-right">
                        <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                          <MapPin className="h-2.5 w-2.5" /> Onsite
                        </div>
                        <div className={`text-lg font-black tabular-nums italic ${dayOnsite > 0 ? 'text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {dayOnsite.toLocaleString()}
                        </div>
                      </div>

                      {/* Self-service */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                          <MonitorSmartphone className="h-2.5 w-2.5" /> Self
                        </div>
                        <div className={`text-lg font-black tabular-nums italic ${daySelf > 0 ? 'text-purple-400' : 'text-slate-400 dark:text-slate-600'}`}>
                          {daySelf.toLocaleString()}
                        </div>
                      </div>

                      {/* Day Total */}
                      <div className="text-right min-w-[70px]">
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sum</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums italic">
                          {(Number(dayOnline) + Number(dayOnsite) + Number(daySelf)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Table Footer / Totals Row */}
              {displayEvent.daily_stats?.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-4 p-4 mt-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl text-xs font-black bg-white/10 text-white">
                      Σ
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Summary</div>
                      <div className="text-sm font-black uppercase text-white">Event Totals</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Total Scans</div>
                      <div className="text-lg font-black text-cyan-400 tabular-nums italic">
                        {(displayEvent.daily_stats || []).reduce((acc, d) => Number(acc) + Number(d.unique_count || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Total Online</div>
                      <div className="text-lg font-black text-blue-400 tabular-nums italic">
                        {(displayEvent.daily_stats || []).reduce((acc, d) => Number(acc) + Number(d.online_attended || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Total Onsite</div>
                      <div className="text-lg font-black text-emerald-400 tabular-nums italic">
                        {(displayEvent.daily_stats || []).reduce((acc, d) => Number(acc) + Number(d.onsite_count || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-0.5">Total Self</div>
                      <div className="text-lg font-black text-purple-400 tabular-nums italic">
                        {(displayEvent.daily_stats || []).reduce((acc, d) => Number(acc) + Number(d.self_service_count || 0), 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className="text-[8px] font-black text-white uppercase tracking-widest mb-0.5">Grand Total</div>
                      <div className="text-lg font-black text-white tabular-nums italic">
                        {(displayEvent.daily_stats || []).reduce((acc, d) => Number(acc) + Number(d.online_attended || 0) + Number(d.onsite_count || 0) + Number(d.self_service_count || 0), 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Data Integrity Warning & Fix */}
                  {(() => {
                    const diff = realMissingCount ?? 0;

                    if (diff > 0 || missingScans?.length > 0) {
                      return (
                        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[28px] flex flex-col md:flex-row items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                                 <AlertCircle className="h-6 w-6" />
                              </div>
                              <div>
                                 <h5 className="text-sm font-black text-amber-500 uppercase tracking-tight">Data Integrity Warning</h5>
                                 <p className="text-[10px] text-slate-500 font-medium">Found {diff} records that were printed/registered but never scanned at gates.</p>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                              {!missingScans && (
                                <button 
                                  onClick={loadMissingScans}
                                  disabled={loadingMissing}
                                  className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center gap-2"
                                >
                                  {loadingMissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="h-3.5 w-3.5" />}
                                  Analyze Discrepancy
                                </button>
                              )}

                              {missingScans && missingScans.length > 0 && (
                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                   <div className="max-h-60 overflow-y-auto bg-white dark:bg-slate-950/40 rounded-xl border border-amber-500/20 overflow-hidden mb-2">
                                      <table className="w-full text-left text-[9px] font-mono">
                                         <thead className="bg-amber-500/10 text-amber-600 dark:text-amber-500">
                                            <tr>
                                               <th className="px-3 py-2 uppercase tracking-widest font-black">Visitor</th>
                                               <th className="px-3 py-2 uppercase tracking-widest font-black">Badge ID</th>
                                               <th className="px-3 py-2 uppercase tracking-widest font-black">Target Flag</th>
                                            </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {missingScans.map(v => (
                                              <tr key={v.id} className="hover:bg-amber-500/5 transition-colors">
                                                 <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-bold">{v.visitorName} {v.surName}</td>
                                                 <td className="px-3 py-2 text-amber-500 font-black">{v.badgeID}</td>
                                                 <td className="px-3 py-2">
                                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
                                                       {fixFlag || 'None'}
                                                    </span>
                                                 </td>
                                              </tr>
                                            ))}
                                         </tbody>
                                      </table>
                                   </div>
                                   
                                   <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-2">
                                      <div className="flex items-center justify-between mb-3">
                                         <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Specify Scan Flag</span>
                                         <div className="flex gap-2">
                                            {['System', 'Recovered', 'Manual'].map(tag => (
                                               <button 
                                                  key={tag}
                                                  onClick={() => setFixFlag(tag)}
                                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${fixFlag === tag ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500 border border-slate-200 dark:border-slate-700'}`}
                                               >
                                                  {tag}
                                               </button>
                                            ))}
                                         </div>
                                      </div>
                                      <div className="relative">
                                        <input 
                                          type="text"
                                          placeholder="Type custom tag or choose above..."
                                          value={fixFlag}
                                          onChange={(e) => setFixFlag(e.target.value)}
                                          className="w-full bg-white dark:bg-slate-900 border border-amber-500/20 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
                                        />
                                      </div>
                                   </div>
                                   <button 
                                      onClick={handleFixMissing}
                                      disabled={fixingMissing}
                                      className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center gap-2 justify-center shadow-lg shadow-emerald-500/20 group"
                                   >
                                      {fixingMissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                      Finalize & Recover {missingScans.length} Scans
                                   </button>
                                </div>
                              )}

                              {missingScans && missingScans.length === 0 && (
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                   <ShieldCheck className="h-4 w-4" /> All Clear!
                                </div>
                              )}
                           </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventInsightsModal;

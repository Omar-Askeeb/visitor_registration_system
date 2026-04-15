import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw, 
  CloudRain, 
  Database, 
  ArrowDownCircle, 
  CheckCircle2, 
  AlertTriangle,
  Terminal,
  CalendarDays,
  Target,
  Zap,
  Activity,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

const SyncRecords = () => {
  const [seconds, setSeconds] = useState(120);
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [data, setData] = useState({ logs: [], stats: { local_total: 0, synced_total: 0, cloud_total: 0 } });
  const [loading, setLoading] = useState(true);

  // Update countdown when event changes
  useEffect(() => {
    const ev = events.find(e => e.id == selectedEventId);
    if (ev) {
      setSeconds(ev.sync_countdown || 120);
    }
  }, [selectedEventId, events]);

  // Initialize countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev > 0) return prev - 1;
        return 0; // Trigger reset logic in separate useEffect
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedEventId, events]);

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API}/events`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        const json = await response.json();
        const syncEnabled = json.filter(e => e.sync_enabled || e.online_slug);
        setEvents(syncEnabled);
        if (syncEnabled.length > 0) {
          setSelectedEventId(syncEnabled[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch events', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch data for selected event
  useEffect(() => {
    if (!selectedEventId) return;
    loadSyncData();
  }, [selectedEventId]);

  const loadSyncData = async () => {
    try {
      const response = await fetch(`${API}/events/${selectedEventId}/sync-logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const json = await response.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch sync logs', e);
    }
  };

  const handleSyncNow = async () => {
    if (!selectedEventId) return;
    
    setIsSyncing(true);
    const toastId = toast.loading('Initializing Cloud Reconcile Protocol...', { id: 'manual-sync' });
    
    try {
      const response = await fetch(`${API}/events/${selectedEventId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Sync Success: ${result.added} new records added!`, { id: toastId });
        
        const ev = events.find(e => e.id == selectedEventId);
        setSeconds(ev?.sync_countdown || 120);
        
        loadSyncData(); // Refresh history
      } else {
        throw new Error(result.message || 'Sync failed');
      }
    } catch (e) {
      toast.error(`Sync Failed: ${e.message}`, { id: toastId });
    } finally {
      setIsSyncing(false);
      // Reset timer regardless of success/fail to prevent infinite retry loops
      const ev = events.find(e => e.id == selectedEventId);
      setSeconds(ev?.sync_countdown || 120);
    }
  };

  // Handle auto-sync trigger and reset
  useEffect(() => {
    if (seconds === 0 && !isSyncing && selectedEventId) {
      handleSyncNow();
    }
  }, [seconds, isSyncing, selectedEventId]);

  if (loading) {
     return (
       <div className="flex-1 bg-white dark:bg-[#020617] h-screen flex flex-col items-center justify-center">
          <RefreshCcw className="h-8 w-8 text-amber-500 animate-spin mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Initializing Sync Node...</span>
       </div>
     );
  }

  const selectedEvent = events.find(e => e.id == selectedEventId);

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 selection:bg-cyan-500/30">
      
      <header className="mb-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 blur-[100px] rounded-full" />
        <div className="relative">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
            <RefreshCcw className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Data reconciliation</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Cloud <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Synchronization</span></h1>
          <p className="text-slate-500 font-medium max-w-xl">Coordinate real-time dataset parity between regional nodes and master cloud storage.</p>
        </div>

        {/* Event Selector */}
        <div className="relative z-10 w-full md:w-80">
           <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Active Sync context</label>
           <select 
             value={selectedEventId}
             onChange={(e) => setSelectedEventId(e.target.value)}
             className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none appearance-none transition-all cursor-pointer"
           >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name} {ev.online_slug ? `(${ev.online_slug})` : ''}</option>
              ))}
              {events.length === 0 && <option value="">No sync enabled events</option>}
           </select>
           <div className="absolute right-4 bottom-4 pointer-events-none opacity-40">
              <CalendarDays className="h-4 w-4" />
           </div>
        </div>
      </header>

      {/* Hero Sync Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800/50 flex items-center justify-between shadow-lg relative overflow-hidden group">
           <div className="absolute -left-12 -bottom-12 opacity-5 scale-150 rotate-12 group-hover:scale-125 transition-transform duration-1000">
              <RefreshCcw className="h-48 w-48 text-amber-500" />
           </div>
           
           <div className="relative">
              <div className="flex items-center space-x-3 mb-4">
                 <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500">Auto-Sync Protocol Active</span>
              </div>
              <div className="text-6xl font-black text-slate-900 dark:text-white tracking-widest flex items-baseline space-x-2 tabular-nums">
                 <span>{seconds}</span>
                 <span className="text-sm uppercase tracking-widest text-slate-400 dark:text-slate-600">sec</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-4 italic">Next automated reconcile countdown triggered.</p>
           </div>

           <button 
             onClick={handleSyncNow}
             disabled={isSyncing || !selectedEventId}
             className={`h-28 w-28 rounded-full flex items-center justify-center transition-all relative overflow-hidden group/btn ${isSyncing ? 'bg-slate-200 dark:bg-slate-800 cursor-wait' : 'bg-gradient-to-tr from-amber-500 to-orange-600 hover:scale-105 active:scale-95 shadow-xl shadow-amber-900/30'}`}
           >
              <RefreshCcw className={`h-10 w-10 text-white ${isSyncing ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-700'}`} />
              <div className={`absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity`} />
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800/50 flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <Database className="h-6 w-6 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
                <div className="text-[8px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">Event Log</div>
              </div>
              <div>
                 <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-widest">{data.stats.local_total.toLocaleString()}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-1">Local Records</div>
              </div>
           </div>

           <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800/50 flex flex-col justify-between group hover:border-amber-500/30 transition-colors">
              <div className="flex justify-between items-start mb-6">
                <CloudRain className="h-6 w-6 text-slate-400 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
                <div className="text-[8px] font-black uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-md">API Master</div>
              </div>
              <div>
                 <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-widest">{data.stats.cloud_total.toLocaleString()}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mt-1">Cloud Dataset</div>
              </div>
           </div>

           <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-8 rounded-[32px] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                 <Target className="h-16 w-16" />
              </div>
              <Activity className="h-6 w-6 text-amber-400 dark:text-amber-500 mb-6" />
              <div className="relative">
                 <div className="text-3xl font-black tabular-nums tracking-widest">{data.stats.synced_total.toLocaleString()}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Total Synced</div>
              </div>
           </div>
        </div>
      </div>

      {/* Detailed Node Logs */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[40px] overflow-hidden shadow-xl">
        <div className="p-10 border-b border-slate-200 dark:border-slate-800/30 flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white block leading-none mb-1">Synchronizer System Ledger</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Chronological parity verification logs</span>
              </div>
           </div>
           <button 
             onClick={() => setData(prev => ({ ...prev, logs: [] }))}
             className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-amber-500 transition-colors flex items-center gap-2"
           >
             <span>Clear Stream Log</span>
             <ArrowRight className="h-3 w-3" />
           </button>
        </div>
        
        <div className="p-10 font-mono text-[11px] overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-800">
           {data.logs.map((log, i) => (
             <div key={log.id} className="flex flex-col md:flex-row md:items-center py-3 border-b border-slate-200/50 dark:border-slate-800/30 last:border-0 hover:bg-slate-100/30 dark:hover:bg-slate-800/10 px-4 -mx-4 transition-colors">
                <span className="text-slate-400 dark:text-slate-600 font-bold w-48 shrink-0 tracking-tight">[{log.created_at}]</span>
                <div className="flex items-center w-40 shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full mr-3 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className={`${log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'} font-black tracking-widest uppercase italic`}>
                    {log.status === 'success' ? 'SYNC_OK' : 'SYNC_FAIL'}
                  </span>
                </div>
                <div className="flex-1 text-slate-600 dark:text-slate-400 md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-6 uppercase font-bold text-[10px] tracking-wide">
                  {log.status === 'success' ? (
                    `Operation completed. Fetched: ${log.records_fetched} | Unified: ${log.records_added} new entries recorded.`
                  ) : (
                    `System Alert: ${log.error_message}`
                  )}
                </div>
             </div>
           ))}
           
           {data.logs.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <Zap className="h-8 w-8 mb-4 opacity-20" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">No activity detected in ledger</span>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default SyncRecords;

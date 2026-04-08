import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  CalendarDays, 
  User as UserIcon, 
  Target, 
  Loader2, 
  ChevronRight,
  Filter,
  BarChart3,
  Award
} from 'lucide-react';

const PersonnelStatsModal = ({ userId, events, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/users/${userId}/performance${selectedEventId ? `?event_id=${selectedEventId}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedEventId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <UserIcon className="h-6 w-6" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-[0.3em] text-cyan-600 dark:text-cyan-400">Node Performance Analytics</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                  {stats?.user?.name || 'Loading Profile...'}
                </h2>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-slate-50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
             <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Filter Dataset</span>
             </div>
             <div className="flex-1 w-full md:max-w-xs relative">
                <select 
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all appearance-none"
                >
                   <option value="">All Exhibitions</option>
                   {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
             </div>
          </div>

          {loading ? (
             <div className="py-24 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Analyzing Performance Stream...</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               
               {/* Creations Stats */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span>Registration Velocity</span>
                     </h3>
                     <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg uppercase tracking-tighter">Daily Breakdown</span>
                  </div>
                  
                  <div className="space-y-3">
                     {stats.created?.length === 0 ? (
                        <div className="p-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No entries recorded in this period</div>
                     ) : (
                        stats.created.map((day, i) => (
                           <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                                    {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit' })}
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{new Date(day.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase">Daily Record Log</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xl font-black text-slate-900 dark:text-white italic tabular-nums group-hover:text-emerald-500 transition-colors uppercase">{day.count}<span className="text-[10px] ml-1 not-italic opacity-40">Regs</span></div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* Verification Stats */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-500" />
                        <span>Auditor Oversight</span>
                     </h3>
                     <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-500 px-2 py-1 rounded-lg uppercase tracking-tighter">Verification Flux</span>
                  </div>

                  <div className="space-y-3">
                     {stats.verified?.length === 0 ? (
                        <div className="p-12 text-center rounded-[32px] border-2 border-dashed border-slate-100 dark:border-slate-800/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest">No audit actions recorded</div>
                     ) : (
                        stats.verified.map((day, i) => (
                           <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-900 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                                    {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit' })}
                                 </div>
                                 <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{new Date(day.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</div>
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase">Audit Flux Node</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-xl font-black text-slate-900 dark:text-white italic tabular-nums group-hover:text-cyan-500 transition-colors uppercase">{day.count}<span className="text-[10px] ml-1 not-italic opacity-40">Checks</span></div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>

            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-8 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <Award className="h-3 w-3" />
              <span>Real-time parity with regional nodes maintained</span>
           </div>
           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Hash: PERF_{new Date().getTime().toString(16).toUpperCase()}</div>
        </div>

      </div>
    </div>
  );
};

export default PersonnelStatsModal;

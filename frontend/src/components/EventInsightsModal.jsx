import React from 'react';
import { 
  X, 
  Users, 
  CalendarDays, 
  TrendingUp, 
  UserCheck, 
  Repeat, 
  ChevronRight,
  TrendingDown,
  Activity,
  History,
  AlertCircle,
  FileText
} from 'lucide-react';

const EventInsightsModal = ({ event, onClose }) => {
  if (!event) return null;

  const attendanceRate = Math.round((event.total_attendance / (event.registered_count || 1)) * 100);
  const targetRate = Math.round((event.registered_count / (event.target_visitors || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 scale-100"
      >
        {/* Header Section */}
        <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10">
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

        {/* Content Layout */}
        <div className="p-8 pt-32 h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Top Banner Event Info */}
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-800/50 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <FileText className="h-32 w-32" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8 relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-cyan-500/20">
                {event.name[0]}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{event.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                   <div className="flex items-center space-x-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <CalendarDays className="h-3 w-3 text-cyan-500" />
                      <span>{new Date(event.start_date).toLocaleDateString()} — {new Date(event.end_date).toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <span>{event.status}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Summary Metrics */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">Total Performance</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Visitors</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic tabular-nums">{event.registered_count.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-cyan-500" style={{ width: `${targetRate}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-cyan-500">{targetRate}% of Target</span>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/30">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Attendance (Scans)</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic tabular-nums">{event.total_attendance.toLocaleString()}</div>
                   <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500" style={{ width: `${attendanceRate}%` }}></div>
                    </div>
                    <span className="text-[9px] font-black text-emerald-500">{attendanceRate}% Attendance Rate</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 dark:bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                 <div className="flex items-center justify-between relative mb-2">
                    <div className="flex items-center space-x-2 text-cyan-400">
                       <Repeat className="h-4 w-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Redundancy Scrutiny</span>
                    </div>
                    <span className="text-2xl font-black text-white italic">{event.redundant_visits.toLocaleString()}</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Number of unique visitors who attended the event on more than one distinct day.</p>
              </div>
            </div>

            {/* Right: Daily Breakdown Table */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-slate-100 dark:border-slate-800/50 p-6">
              <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center space-x-2">
                <CalendarDays className="h-4 w-4" />
                <span>Daily Visit Breakdown</span>
              </h4>

              <div className="space-y-3">
                {event.daily_stats?.length === 0 ? (
                   <div className="py-20 text-center text-slate-400 text-xs font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      No Scan Data Detected
                   </div>
                ) : (
                  event.daily_stats.map((day, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/30 hover:-translate-y-1 transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-black text-slate-500">
                          {i + 1}
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Day of Event</div>
                          <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{new Date(day.scan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-0.5">Unique Visitors</div>
                         <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums group-hover:text-cyan-500 transition-colors italic">{day.unique_count.toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInsightsModal;

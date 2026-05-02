import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import { 
  History,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Repeat,
  UserCheck,
  Award,
  ArrowRight,
  Users,
  CalendarDays,
  Activity,
  ArrowUpRight,
  Mail,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EventInsightsModal from '../components/EventInsightsModal';
import PersonnelStatsModal from '../components/PersonnelStatsModal';
import CustomSelect from '../components/CustomSelect';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ 
    events: [], 
    totals: { registered_count: 0, target_visitors: 0, total_attendance: 0 }, 
    top_personnel: [] 
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statsEventId, setStatsEventId] = useState('all');
  const [performanceUserId, setPerformanceUserId] = useState(null);

  const load = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load dashboard');
      setData(json);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredEventsForStats = statsEventId === 'all' 
    ? data.events 
    : data.events.filter(e => e.id.toString() === statsEventId);

  const filteredTotals = {
    registered_count: filteredEventsForStats.reduce((acc, ev) => acc + (ev.registered_count || 0), 0),
    total_attendance: filteredEventsForStats.reduce((acc, ev) => acc + (ev.total_attendance || 0), 0),
    redundant_visits: filteredEventsForStats.reduce((acc, ev) => acc + (ev.redundant_visits || 0), 0),
    target_visitors: filteredEventsForStats.reduce((acc, ev) => acc + (ev.target_visitors || 0), 0),
    emails_sent: filteredEventsForStats.reduce((acc, ev) => acc + (ev.emails_sent || 0), 0),
  };

  const activeEvents = data.events.filter(e => e.status?.toLowerCase() !== 'completed' && e.status?.toLowerCase() !== 'archived');

  if (loading) {
    return (
      <div className="flex-1 bg-white dark:bg-[#020617] h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-cyan-500 animate-spin" />
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Loading Local Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white dark:bg-[#020617] h-screen flex flex-col items-center justify-center space-y-4 p-8">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Retry Connection</button>
        </div>
      </div>
    );
  }

  const eventOptions = [
    { value: 'all', label: 'All Events Combined' },
    ...data.events.map(ev => ({ value: ev.id.toString(), label: ev.name }))
  ];

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 selection:bg-cyan-500/30 selection:text-white transition-colors duration-300">
      
      {/* Premium Header */}
      <header className="mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative">
        <div className="absolute -top-24 -left-24 h-48 w-48 bg-cyan-500/10 blur-[100px] rounded-full" />
        <div>
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Operational Overview</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 italic">Digital Group <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent not-italic">Events Hub</span></h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm italic">Enterprise-grade monitoring of registrations and personnel performance.</p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="w-64">
            <CustomSelect 
              label="Global Filter"
              value={statsEventId}
              onChange={setStatsEventId}
              options={eventOptions}
              placeholder="Select Event..."
              icon={CalendarDays}
            />
          </div>
          <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block mt-6" />
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 px-6 py-3 rounded-2xl flex items-center space-x-4 backdrop-blur-xl shadow-xl dark:shadow-2xl relative group overflow-hidden mt-6">
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">LIVE STATUS</span>
          </div>
        </div>
      </header>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <StatsCard label="إجمالي المسجلين" value={filteredTotals.registered_count} icon={Users} trend="Registered" color="from-blue-500 to-cyan-500" />
        <StatsCard label="إجمالي الحضور" value={filteredTotals.total_attendance} icon={UserCheck} trend="Attendance" color="from-emerald-500 to-teal-500" />
        <StatsCard label="زيارات متكررة" value={filteredTotals.redundant_visits} icon={Repeat} trend="Redundant" color="from-purple-500 to-indigo-500" />
        <StatsCard label="نسبة الإنجاز" value={`${Math.round((filteredTotals.registered_count / (filteredTotals.target_visitors || 1)) * 100)}%`} icon={TrendingUp} color="from-amber-500 to-orange-500" />
        <StatsCard label="رسائل البريد" value={filteredTotals.emails_sent} total={filteredTotals.registered_count} icon={Mail} trend="Delivered" color="from-cyan-500 to-blue-500" />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        <div className="absolute -bottom-24 -right-24 h-64 w-64 bg-blue-500/5 blur-[120px] rounded-full" />
        
        {/* Main Performance Table Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[32px] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">إحصائيات الفعاليات النشطة</h2>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-full tracking-widest">Live Tracks</div>
            </div>
            
            <div className="space-y-6">
              {activeEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => setSelectedEvent(event)}
                  className="group p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                        {event.name[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{event.name}</h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{event.status}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums">{event.registered_count} مسجل</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-black text-cyan-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                       <span>عرض التفاصيل</span>
                       <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-end gap-1 h-12 mb-2">
                    {event.daily_stats?.map((day, i) => (
                      <div 
                        key={i}
                        title={`${day.scan_date}: ${day.unique_count} visits`}
                        className="flex-1 bg-cyan-500/20 rounded-t-sm hover:bg-cyan-500/40 transition-all cursor-help"
                        style={{ height: `${Math.min((day.unique_count / (event.registered_count || 1)) * 100 + 10, 100)}%` }}
                      ></div>
                    ))}
                    {(event.daily_stats?.length === 0) && <div className="text-[10px] text-slate-500 italic">لا توجد بيانات حضور بعد</div>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">الحضور (الفردي لكل يوم)</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] text-emerald-500 font-black uppercase">الإجمالي: {event.total_attendance || 0}</span>
                       <div className="h-1.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${Math.min((event.registered_count / (event.target_visitors || 1)) * 100, 100)}%` }}></div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Capture Stats Section */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[32px] p-8 shadow-xl mt-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">إحصائيات التقاط البيانات (Capture Statistics)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeEvents.map(ev => (
                 <div key={ev.id} className="p-6 bg-slate-50 dark:bg-slate-900/60 rounded-[28px] border border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ev.name}</span>
                       <Activity className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{ev.synced_count || 0}</div>
                          <div className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Total Captured Logs</div>
                       </div>
                       <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
                          <div className="text-2xl font-black text-emerald-500 tabular-nums">
                            {ev.today_synced_count || 0}
                          </div>
                          <div className="text-[8px] font-black uppercase text-slate-500 tracking-tighter">Day Pulse (Live)</div>
                       </div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Action Column */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[32px] p-8 text-white shadow-[0_20px_40px_-10px_rgba(6,182,212,0.3)] group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Award className="h-32 w-32" />
             </div>
             <h3 className="text-xl font-black mb-6 tracking-tight flex items-center space-x-2 relative">
                <Zap className="h-5 w-5 fill-white" />
                <span>Personnel Top Score</span>
             </h3>
             
             <div className="space-y-6 relative mb-8">
               {data.top_personnel?.map((p, i) => (
                 <div key={p.id} className="flex items-center justify-between group/row">
                   <div className="flex items-center gap-3">
                     <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${
                       i === 0 ? 'bg-amber-400 text-amber-900' : 
                       i === 1 ? 'bg-slate-300 text-slate-800' : 
                       'bg-orange-400 text-orange-900'
                     }`}>
                       {i + 1}
                     </div>
                     <div>
                       <div className="text-xs font-black uppercase leading-none mb-1">{p.name}</div>
                       <div className="text-[8px] font-bold text-cyan-200 uppercase tracking-widest">{p.role}</div>
                     </div>
                   </div>
                   <button 
                     onClick={() => setPerformanceUserId(p.id)}
                     className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group-hover/row:scale-110"
                   >
                     <ArrowUpRight className="h-4 w-4" />
                   </button>
                 </div>
               ))}
               {(!data.top_personnel || data.top_personnel.length === 0) && (
                 <div className="text-xs italic opacity-50">Calculating rankings...</div>
               )}
             </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-[32px] p-8 backdrop-blur-xl group hover:border-slate-300 dark:hover:border-slate-500/50 transition-all duration-500">
            <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center space-x-2">
              <Mail className="h-4 w-4 text-cyan-500" />
              <span>Email Notification Pulse</span>
            </h3>
            
            <div className="space-y-4">
               {[
                 { label: 'Delivered', value: data.totals.emails_sent, color: 'text-emerald-500', bg: 'bg-emerald-500' },
                 { label: 'Pending', value: data.totals.emails_pending, color: 'text-amber-500', bg: 'bg-amber-500' },
                 { label: 'Failed', value: data.totals.emails_failed, color: 'text-red-500', bg: 'bg-red-500' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/30">
                    <div>
                       <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.label}</div>
                       <div className="text-xl font-black text-slate-900 dark:text-white">{item.value || 0}</div>
                    </div>
                    <div className={`h-2 w-12 ${item.bg} rounded-full opacity-20`} />
                 </div>
               ))}
               <button 
                 onClick={() => navigate('/reviews')}
                 className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 hover:text-cyan-400 transition-colors"
               >
                 View All Records →
               </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30 rounded-[32px] p-8 backdrop-blur-xl group hover:border-slate-300 dark:hover:border-slate-500/50 transition-all duration-500">
            <h3 className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Network Infrastructure</span>
            </h3>

            
            <div className="space-y-4">
               {[
                 { label: 'Local Server', status: 'Active', color: 'emerald', rate: 'Local Database' }
               ].map((node, i) => (
                 <div key={i} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/30 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{node.label}</span>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400`}>{node.status}</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-slate-900 dark:text-white font-black text-sm italic">{node.rate}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 opacity-50 rounded-full animate-pulse" style={{ width: '100%' }} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Analytics Modal */}
      {selectedEvent && (
        <EventInsightsModal 
          event={data.events.find(e => e.id === selectedEvent.id) || selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          onRefresh={load}
        />
      )}

      {/* Personnel Performance Modal */}
      {performanceUserId && (
        <PersonnelStatsModal 
          userId={performanceUserId}
          events={data.events}
          onClose={() => setPerformanceUserId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;

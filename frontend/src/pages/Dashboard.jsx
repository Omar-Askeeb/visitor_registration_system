import React, { useState, useEffect } from 'react';
import StatsCard from '../components/StatsCard';
import { 
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
  AlertCircle,
  Globe,
  MapPin,
  MonitorSmartphone
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
  const [insightsData, setInsightsData] = useState(null);
  const [statsEventId, setStatsEventId] = useState('all');
  const [performanceUserId, setPerformanceUserId] = useState(null);

  const load = async (eventId = 'all') => {
    try {
      const url = eventId !== 'all' ? `${import.meta.env.VITE_API_URL}/dashboard?event_id=${eventId}` : `${import.meta.env.VITE_API_URL}/dashboard`;
      const res = await fetch(url, {
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
    load(statsEventId);
  }, [statsEventId]);

  const openInsights = async (event) => {
    try {
      setInsightsData({ ...event, loading: true });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/events/${event.id}/insights`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setInsightsData(data);
    } catch (err) {
      console.error(err);
      setInsightsData(event);
    }
  };

  const filteredEventsForStats = statsEventId === 'all' 
    ? data.events 
    : data.events.filter(e => e.id.toString() === statsEventId);

  const filteredTotals = {
    registered_count:   filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.registered_count   || 0), 0),
    total_attendance:   filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.total_attendance   || 0), 0),
    redundant_visits:   filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.redundant_visits   || 0), 0),
    target_visitors:    filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.target_visitors    || 0), 0),
    emails_sent:        filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.emails_sent        || 0), 0),
    online_attended:    filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.online_attended    || 0), 0),
    onsite_count:       filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.onsite_count       || 0), 0),
    self_service_count: filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.self_service_count || 0), 0),
    kiosk_print_count:  filteredEventsForStats.reduce((acc, ev) => Number(acc) + Number(ev.kiosk_print_count  || 0), 0),
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
    ...(data.all_events || data.events).map(ev => ({ value: ev.id.toString(), label: ev.name }))
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
                  onClick={() => openInsights(event)}
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

                  {/* Source Breakdown Pills */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Globe className="h-3 w-3 text-blue-400" />
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-wider tabular-nums">{event.online_attended ?? 0} Online</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <MapPin className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider tabular-nums">{event.onsite_count ?? 0} Onsite</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <MonitorSmartphone className="h-3 w-3 text-purple-400" />
                      <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider tabular-nums">{event.self_service_count ?? 0} Self-Svc</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-end gap-1 h-10 mb-2">
                    {event.daily_stats?.map((day, i) => (
                      <div 
                        key={i}
                        title={`${day.scan_date}: ${day.unique_count} scans | Online: ${day.online_attended ?? 0} | Onsite: ${day.onsite_count ?? 0} | Self: ${day.self_service_count ?? 0}`}
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

          {/* Source Capture Stats Section */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[32px] p-8 shadow-xl mt-8">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Visitor Source Statistics</h2>
            
            {/* Global totals row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0"><Globe className="h-4 w-4 text-blue-400" /></div>
                <div>
                  <div className="text-xl font-black text-blue-400 tabular-nums">{filteredTotals.online_attended}</div>
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Online Attended</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-x border-slate-200 dark:border-slate-800 px-4">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-emerald-400" /></div>
                <div>
                  <div className="text-xl font-black text-emerald-400 tabular-nums">{filteredTotals.onsite_count}</div>
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Onsite Registered</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4">
                <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0"><MonitorSmartphone className="h-4 w-4 text-purple-400" /></div>
                <div>
                  <div className="text-xl font-black text-purple-400 tabular-nums">{filteredTotals.self_service_count}</div>
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Self-Service Kiosk</div>
                </div>
              </div>
              <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0"><ShieldCheck className="h-4 w-4 text-cyan-400" /></div>
                <div>
                  <div className="text-xl font-black text-cyan-400 tabular-nums">{filteredTotals.kiosk_print_count}</div>
                  <div className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Kiosk Prints</div>
                </div>
              </div>
            </div>

            {/* Per-event breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeEvents.map(ev => (
                <div key={ev.id} className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-[24px] border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate pr-2">{ev.name}</span>
                    <Activity className="h-4 w-4 text-cyan-500 shrink-0" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-center">
                      <Globe className="h-3.5 w-3.5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-black text-blue-400 tabular-nums">{ev.online_attended ?? 0}</div>
                      <div className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Online</div>
                    </div>
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl text-center">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400 mx-auto mb-1" />
                      <div className="text-lg font-black text-emerald-400 tabular-nums">{ev.onsite_count ?? 0}</div>
                      <div className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Onsite</div>
                    </div>
                    <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl text-center">
                      <MonitorSmartphone className="h-3.5 w-3.5 text-purple-400 mx-auto mb-1" />
                      <div className="text-lg font-black text-purple-400 tabular-nums">{ev.self_service_count ?? 0}</div>
                      <div className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Self-Svc</div>
                    </div>
                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/15 rounded-xl text-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 mx-auto mb-1" />
                      <div className="text-lg font-black text-cyan-400 tabular-nums">{ev.kiosk_print_count ?? 0}</div>
                      <div className="text-[7px] font-black uppercase text-slate-500 tracking-widest">Kiosk Prints</div>
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
      {insightsData && (
        <EventInsightsModal 
          event={insightsData} 
          onClose={() => setInsightsData(null)} 
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

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Globe, 
  Shield, 
  Bell, 
  User, 
  Save, 
  ChevronRight, 
  Layout, 
  Lock, 
  Server,
  Zap,
  MousePointer2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Cloud Handshake');

  const handleSave = () => {
    const loadingToast = toast.loading('Synchronizing Configuration...', {
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' },
    });
    
    setTimeout(() => {
      toast.success('Terminal Parameters Synchronized!', {
        id: loadingToast,
        icon: '⚙️',
        style: { borderRadius: '16px', background: '#0f172a', color: '#fff', border: '1px solid #1e293b' },
      });
    }, 1500);
  };

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 pt-20 lg:pt-8 transition-colors duration-300 selection:bg-cyan-500/30">
      
      <header className="mb-12 relative flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="absolute top-0 left-0 h-48 w-48 bg-slate-500/5 blur-[100px] rounded-full" />
        <div>
           <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <SettingsIcon className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">System Configuration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Terminal <span className="bg-gradient-to-r from-slate-400 to-slate-600 bg-clip-text text-transparent">Settings</span></h1>
          <p className="text-slate-500 font-medium">Fine-tune the registration environment, database connections, and security protocols.</p>
        </div>
        
        <button 
          onClick={handleSave}
          className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black px-10 py-4 rounded-2xl shadow-xl transition-all flex items-center space-x-3 text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 group"
        >
          <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span>Commit Changes</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Col: Navigation Options */}
        <div className="lg:col-span-1 space-y-3">
           {[
             { label: 'Cloud Handshake', icon: Globe },
             { label: 'Database Node', icon: Database },
             { label: 'Security Clearance', icon: Shield },
             { label: 'Layout Protocols', icon: Layout },
             { label: 'Notification HUB', icon: Bell },
           ].map((opt, i) => (
             <button 
               key={i} 
               onClick={() => setActiveTab(opt.label)}
               className={`flex items-center justify-between w-full p-5 rounded-2xl border transition-all ${activeTab === opt.label ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-white dark:border-slate-800 shadow-xl' : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50 text-slate-500 hover:border-slate-400 dark:hover:border-slate-700'}`}
             >
                <div className="flex items-center space-x-4">
                   <opt.icon className={`h-5 w-5 ${activeTab === opt.label ? 'text-cyan-400' : 'text-slate-500'}`} />
                   <span className="text-[10px] uppercase font-black tracking-widest">{opt.label}</span>
                </div>
                <ChevronRight className="h-4 w-4" />
             </button>
           ))}
        </div>

        {/* Center / Right: Form Fields */}
        <div className="lg:col-span-2 space-y-8 p-10 bg-slate-50 dark:bg-slate-900/40 rounded-[40px] border border-slate-200 dark:border-slate-800/50 min-h-[500px]">
           {activeTab === 'Cloud Handshake' && (
             <>
               <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                     <Server className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Connection Strings</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Master API Endpoint</label>
                        <input 
                          type="text" 
                          defaultValue="https://api.digitalgroup.com/v2/events"
                          className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 focus:outline-none focus:border-cyan-500 transition-all text-xs font-bold font-mono"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Database Table Prefix</label>
                        <input 
                          type="text" 
                          defaultValue="v2_"
                          className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 focus:outline-none focus:border-cyan-500 transition-all text-xs font-bold font-mono uppercase tracking-widest"
                        />
                     </div>
                  </div>
               </section>

               <section className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                     <Zap className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Event Selection</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {[
                       { label: 'Libya Build', active: true },
                       { label: 'R&F Expo', active: true },
                       { label: 'Pharma Expo', active: false },
                     ].map((ev, i) => (
                       <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between ${ev.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest">{ev.label}</span>
                          <div className={`h-2 w-2 rounded-full ${ev.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                       </div>
                     ))}
                  </div>
               </section>
             </>
           )}

           {activeTab === 'Database Node' && (
             <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                   <Database className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                   <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Node Infrastructure</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Local Node IP</label>
                      <input 
                        type="text" 
                        defaultValue="192.168.1.105"
                        className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 focus:outline-none focus:border-cyan-500 transition-all text-xs font-bold font-mono"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sync Port</label>
                      <input 
                        type="text" 
                        defaultValue="3306"
                        className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 focus:outline-none focus:border-cyan-500 transition-all text-xs font-bold font-mono"
                      />
                   </div>
                </div>
                <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                   <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-relaxed tracking-widest">Nodes are synchronized every 60 seconds. Manual override is enabled only for root administrators.</p>
                </div>
             </section>
           )}

           {activeTab === 'Security Clearance' && (
             <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                   <Shield className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                   <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Authorization Matrix</h3>
                </div>
                <div className="space-y-4">
                   {[
                     { event: 'Root Login', user: 'Admin-01', time: '2 mins ago', status: 'Verified' },
                     { event: 'Config Change', user: 'Admin-01', time: '1 hour ago', status: 'Logged' },
                     { event: 'Node Sync', user: 'System', time: 'Continuous', status: 'Active' },
                   ].map((log, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white">{log.event}</span>
                           <span className="text-[8px] font-bold text-slate-500 uppercase">{log.user} • {log.time}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{log.status}</span>
                     </div>
                   ))}
                </div>
                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                   <div className="flex items-start space-x-4">
                      <Lock className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase leading-relaxed tracking-widest">Root access levels are monitored. Adjusting operational parameters requires double-hash verification from the master terminal.</p>
                   </div>
                </div>
             </section>
           )}

           {!['Cloud Handshake', 'Database Node', 'Security Clearance'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                 <MousePointer2 className="h-12 w-12 text-slate-400" />
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{activeTab} Parameters Coming Soon</h3>
                 <p className="text-[10px] font-bold uppercase text-slate-500">Module expansion currently under development in the V2.4 kernel.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

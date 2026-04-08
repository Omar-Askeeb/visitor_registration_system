import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw, 
  CloudRain, 
  Database, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Timer,
  Terminal,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const SyncRecords = () => {
  const [seconds, setSeconds] = useState(120);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncNow = () => {
    setIsSyncing(true);
    toast.loading('Initializing Cloud Reconcile Protocol...', { id: 'sync' });
    
    setTimeout(() => {
      toast.success('15 New Records Synchronized Successfully!', { id: 'sync' });
      setIsSyncing(false);
      setSeconds(120);
    }, 2500);
  };

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 selection:bg-cyan-500/30">
      
      <header className="mb-12 relative">
        <div className="absolute top-0 right-0 h-48 w-48 bg-amber-500/10 blur-[100px] rounded-full" />
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
          <RefreshCcw className="h-4 w-4" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Data reconciliation</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Cloud <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Synchronization</span></h1>
        <p className="text-slate-500 font-medium">Coordinate real-time dataset parity between regional nodes and master cloud storage.</p>
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
             disabled={isSyncing}
             className={`h-24 w-24 rounded-full flex items-center justify-center transition-all relative overflow-hidden group/btn ${isSyncing ? 'bg-slate-200 dark:bg-slate-800 cursor-wait' : 'bg-gradient-to-tr from-amber-500 to-orange-600 hover:scale-110 active:scale-95 shadow-xl shadow-amber-900/20'}`}
           >
              <RefreshCcw className={`h-8 w-8 text-white ${isSyncing ? 'animate-spin' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} />
              <div className={`absolute inset-0 bg-white opacity-0 group-hover/btn:opacity-10 transition-opacity`} />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800/50 flex flex-col justify-between">
              <Database className="h-6 w-6 text-slate-400 dark:text-slate-600 mb-6" />
              <div>
                 <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-widest">12,400</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">Local Records</div>
              </div>
           </div>
           <div className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 p-8 rounded-[32px] flex flex-col justify-between shadow-xl">
              <CloudRain className="h-6 w-6 text-amber-400 dark:text-amber-500 mb-6" />
              <div>
                 <div className="text-3xl font-black tabular-nums tracking-widest">12,223</div>
                 <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Cloud Dataset</div>
              </div>
           </div>
        </div>
      </div>

      {/* Detailed Node Logs */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-slate-200 dark:border-slate-800/30 flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <Terminal className="h-5 w-5 text-slate-400 dark:text-slate-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white italic">Synchronizer System Ledger</span>
           </div>
           <button className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-amber-500 transition-colors">Clear Stream Log</button>
        </div>
        <div className="p-8 font-mono text-[10px] space-y-3">
           <div className="flex space-x-4">
              <span className="text-slate-400 dark:text-slate-600 font-bold">[19:42:01.04]</span>
              <span className="text-emerald-500 font-black tracking-widest uppercase italic">Node_Status</span>
              <span className="text-slate-600 dark:text-slate-400 border-l border-slate-800 pl-4 uppercase font-bold italic">Integrity Check Complete: Parity Maintained.</span>
           </div>
           <div className="flex space-x-4">
              <span className="text-slate-400 dark:text-slate-600 font-bold">[19:38:15.89]</span>
              <span className="text-amber-500 font-black tracking-widest uppercase italic">Data_PUSH</span>
              <span className="text-slate-600 dark:text-slate-400 border-l border-slate-800 pl-4 uppercase font-bold italic">Pushed 12 Encrypted Records to Cloud_01.</span>
           </div>
           <div className="flex space-x-4">
              <span className="text-slate-400 dark:text-slate-600 font-bold">[19:35:00.22]</span>
              <span className="text-purple-500 font-black tracking-widest uppercase italic">Handshake</span>
              <span className="text-slate-600 dark:text-slate-400 border-l border-slate-800 pl-4 uppercase font-bold italic">Secure TLS session initialized with remote cluster.</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SyncRecords;

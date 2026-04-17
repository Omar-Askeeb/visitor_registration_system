import React, { useState, useEffect } from 'react';
import { 
  Zap, Layout, Globe, Database, Shield, Bell, Save, 
  ChevronRight, MousePointer2, Server, Lock, 
  Settings as SettingsIcon, Printer, RefreshCw, Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { openPrintWindow } from '../utils/printBadge';

const API = import.meta.env.VITE_API_URL || '/api';

const DEFAULT_LAYOUT = {
  pageWidth: 21,
  pageHeight: 27,
  name: { y: 6.5, x: '', show: true },
  barcode: { y: 9.5, x: '', show: true, widthFactor: 1.8, height: 50 },
  qrCode: { y: 13.5, x: '', show: true, size: 30, template: '{onlineRegID}' }
};

/** 
 * Deeply merges a saved layout with defaults to ensure all fields exist 
 */
const mergeLayout = (saved) => {
  if (!saved || typeof saved !== 'object') return DEFAULT_LAYOUT;
  return {
    pageWidth:  saved.pageWidth  || DEFAULT_LAYOUT.pageWidth,
    pageHeight: saved.pageHeight || DEFAULT_LAYOUT.pageHeight,
    name:       { ...DEFAULT_LAYOUT.name,    ...(saved.name    || {}) },
    barcode:    { ...DEFAULT_LAYOUT.barcode, ...(saved.barcode || {}) },
    qrCode:     { ...DEFAULT_LAYOUT.qrCode,  ...(saved.qrCode  || {}) },
  };
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('Cloud Handshake');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [testData, setTestData] = useState({
    visitorName: 'عمر اسكيب',
    badgeID: '110102062600001'
  });

  // 1. Initial Load
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/events`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      
      setEvents(data);
      
      if (data.length > 0) {
        // Try to restore previous selection from localStorage
        const storedId = localStorage.getItem('last_settings_event_id');
        const initialEvent = data.find(e => e.id.toString() === storedId) || data[0];
        
        setSelectedEventId(initialEvent.id);
        setLayout(mergeLayout(initialEvent.badge_layout));
      }
    } catch (e) {
      console.error('Fetch Events Error:', e);
      toast.error('Identity Verification Failed. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventSelect = (id) => {
    setSelectedEventId(id);
    localStorage.setItem('last_settings_event_id', id);
    const ev = events.find(e => e.id === id);
    if (ev) {
      setLayout(mergeLayout(ev.badge_layout));
    }
  };

  const handleLayoutChange = (section, field, value) => {
    if (section === 'root') {
      setLayout(prev => ({ ...prev, [field]: value }));
    } else {
      setLayout(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    }
  };

  const handleSave = async () => {
    if (!selectedEventId) return;
    setSaving(true);
    const loadingToast = toast.loading('Synchronizing Layout Matrix...', {
      style: { borderRadius: '16px', background: '#0f172a', color: '#fff' },
    });
    
    try {
      const resp = await fetch(`${API}/events/${selectedEventId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ badge_layout: layout }),
        credentials: 'include'
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${resp.status}`);
      }

      const updatedEvent = await resp.json();
      
      toast.success('Protocols Synchronized Successfully!', {
        id: loadingToast,
        icon: '⚙️',
        style: { borderRadius: '16px', background: '#0f172a', color: '#fff', border: '1px solid #1e293b' },
      });

      // Update local state without full reload
      setEvents(prev => prev.map(e => e.id === selectedEventId ? updatedEvent : e));
    } catch (e) {
      console.error('Save Layout Error:', e);
      toast.error(e.message || 'Failed to commit changes', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = () => {
    const mockVisitor = {
      visitorName: testData.visitorName,
      surName: '',
      onlineRegID: 'ONL-TEST-QR',
    };
    const evName = events.find(e => e.id === selectedEventId)?.name || 'Test Event';
    openPrintWindow(mockVisitor, testData.badgeID, evName, true, layout, true);
  };

  const handleReset = () => {
    if (window.confirm('Reset this event\'s protocols to system defaults?')) {
      setLayout(DEFAULT_LAYOUT);
      toast.success('Layout reset internally. Click "Commit Changes" to persist.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#020617]">
         <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mb-4" />
         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Initializing Kernel...</p>
      </div>
    );
  }

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
          <p className="text-slate-500 font-medium text-sm">Fine-tune the registration environment, badge protocols, and security clusters.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving || !selectedEventId}
          className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black px-10 py-4 rounded-2xl shadow-xl transition-all flex items-center space-x-3 text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
          <span>{saving ? 'Synchronizing...' : 'Commit Changes'}</span>
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
                          readOnly
                          defaultValue={`${window.location.protocol}//${window.location.hostname}:8000/api`}
                          className="w-full bg-slate-200/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 text-[10px] font-bold font-mono opacity-80"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Database Table Prefix</label>
                        <input 
                          type="text" 
                          readOnly
                          defaultValue="v2_"
                          className="w-full bg-slate-200/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 text-[10px] font-bold font-mono uppercase tracking-widest opacity-80"
                        />
                     </div>
                  </div>
               </section>
               <section className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                     <Zap className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                     <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Exhbition Focus</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {events.map((ev) => (
                       <button 
                         key={ev.id} 
                         onClick={() => handleEventSelect(ev.id)}
                         className={`p-5 rounded-2xl border flex items-center justify-between transition-all group ${selectedEventId === ev.id ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/20' : 'bg-slate-100 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/50 text-slate-500 hover:border-slate-400 dark:hover:border-slate-700'}`}
                       >
                          <div className="flex flex-col items-start overflow-hidden">
                             <span className="text-[10px] font-black uppercase tracking-widest truncate w-full group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">{ev.name}</span>
                             <span className="text-[8px] font-bold uppercase opacity-50">{ev.visitors_count || 0} Records</span>
                          </div>
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 ml-4 ${selectedEventId === ev.id ? 'bg-cyan-500 animate-pulse shadow-glow' : 'bg-slate-300 dark:bg-slate-800'}`} />
                       </button>
                     ))}
                  </div>
                </section>
             </>
           )}

           {activeTab === 'Layout Protocols' && (
              <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
                    <div className="flex items-center space-x-3">
                       <Layout className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                       <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Badge Layout Matrix</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 bg-slate-100/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                       <button 
                         onClick={handleReset}
                         className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-2 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest h-10 border border-slate-300 dark:border-slate-700"
                       >
                         <RefreshCw className="h-3.5 w-3.5" />
                         <span>Reset</span>
                       </button>

                       <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />

                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Test Name</label>
                          <input 
                             type="text" 
                             value={testData.visitorName} 
                             onChange={e => setTestData(p => ({...p, visitorName: e.target.value}))}
                             className="w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-[10px] font-bold outline-none focus:border-cyan-500 transition-colors" 
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">Test ID</label>
                          <input 
                             type="text" 
                             value={testData.badgeID} 
                             onChange={e => setTestData(p => ({...p, badgeID: e.target.value}))}
                             className="w-28 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 px-3 text-[10px] font-bold outline-none focus:border-cyan-500 transition-colors" 
                          />
                       </div>
                       <button 
                         onClick={handleTestPrint}
                         className="flex items-center space-x-2 bg-cyan-500 text-white px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest h-10"
                       >
                         <Printer className="h-3.5 w-3.5" />
                         <span>Print Test</span>
                       </button>
                    </div>
                 </div>

                 {/* Physical Properties */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Physical Canvas</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Width (cm)</label>
                             <input type="number" step="0.1" value={layout.pageWidth} onChange={e => handleLayoutChange('root', 'pageWidth', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Height (cm)</label>
                             <input type="number" step="0.1" value={layout.pageHeight} onChange={e => handleLayoutChange('root', 'pageHeight', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                          </div>
                       </div>
                    </div>

                    {/* Visitor Name */}
                    <div className="space-y-4 p-6 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl">
                        <div className="flex items-center justify-between mb-4">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Visitor Name</h4>
                           <input type="checkbox" checked={layout.name.show} onChange={e => handleLayoutChange('name', 'show', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos Y (cm)</label>
                              <input type="number" step="0.1" value={layout.name.y} onChange={e => handleLayoutChange('name', 'y', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos X (cm)</label>
                              <input type="text" placeholder="Auto" value={layout.name.x} onChange={e => handleLayoutChange('name', 'x', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Barcode Properties */}
                 <div className="space-y-4 p-6 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Barcode Protocol</h4>
                       <input type="checkbox" checked={layout.barcode.show} onChange={e => handleLayoutChange('barcode', 'show', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos Y (cm)</label>
                          <input type="number" step="0.1" value={layout.barcode.y} onChange={e => handleLayoutChange('barcode', 'y', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos X (cm)</label>
                          <input type="text" placeholder="Auto" value={layout.barcode.x} onChange={e => handleLayoutChange('barcode', 'x', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Width Factor</label>
                          <input type="number" step="0.1" value={layout.barcode.widthFactor} onChange={e => handleLayoutChange('barcode', 'widthFactor', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Height (px)</label>
                          <input type="number" value={layout.barcode.height} onChange={e => handleLayoutChange('barcode', 'height', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                       </div>
                    </div>
                 </div>

                 {/* QR Code Matrix */}
                 <div className="space-y-4 p-6 bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">QR Code Matrix</h4>
                       <input type="checkbox" checked={layout.qrCode.show} onChange={e => handleLayoutChange('qrCode', 'show', e.target.checked)} className="h-4 w-4 accent-cyan-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos Y (cm)</label>
                             <input type="number" step="0.1" value={layout.qrCode.y} onChange={e => handleLayoutChange('qrCode', 'y', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pos X (cm)</label>
                             <input type="text" placeholder="Auto" value={layout.qrCode.x} onChange={e => handleLayoutChange('qrCode', 'x', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Size (mm)</label>
                             <input type="number" value={layout.qrCode.size} onChange={e => handleLayoutChange('qrCode', 'size', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-xs font-bold" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Content Template</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                             {[
                               '{name}', '{badgeID}', '{onlineRegID}', 
                               '{formID}', '{middleName}', '{surName}', 
                               '{phone1}', '{phone2}', '{email}'
                             ].map((v) => (
                               <button 
                                 key={v}
                                 onClick={() => handleLayoutChange('qrCode', 'template', layout.qrCode.template + v)}
                                 className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-[8px] font-black text-slate-500 hover:text-cyan-500 hover:border-cyan-500/30 transition-all uppercase tracking-tighter"
                               >
                                 {v}
                               </button>
                             ))}
                          </div>
                          <input 
                            type="text" 
                            value={layout.qrCode.template} 
                            onChange={e => handleLayoutChange('qrCode', 'template', e.target.value)} 
                            placeholder="e.g. {onlineRegID}" 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-4 px-4 text-xs font-mono font-bold" 
                          />
                       </div>
                    </div>
                 </div>
              </section>
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
                         readOnly
                         value={window.location.hostname}
                         className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 text-xs font-bold font-mono opacity-80"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sync Port</label>
                       <input 
                         type="text" 
                         readOnly
                         defaultValue="3306"
                         className="w-full bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 rounded-xl py-4 px-6 text-xs font-bold font-mono opacity-80"
                       />
                    </div>
                 </div>
                 <div className="p-6 bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">The registration node is currently synchronized with the master database. Auto-replication is active.</p>
                 </div>
              </section>
           )}

           {activeTab === 'Security Clearance' && (
              <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                    <Shield className="h-5 w-5 text-slate-400 dark:text-slate-600" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Authorization Log</h3>
                 </div>
                 <div className="space-y-4">
                    {[
                      { event: 'Protocols Sync', user: 'Admin', time: 'Just now', status: 'Success' },
                      { event: 'Kernel Load', user: 'System', time: '2 mins ago', status: 'Verified' },
                      { event: 'Node Auth', user: 'Admin', time: '5 mins ago', status: 'Active' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
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
                       <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase leading-relaxed tracking-widest">Operational parameters are locked to your administrative ID. External modification attempts will trigger a security lock.</p>
                    </div>
                 </div>
              </section>
           )}

           {!['Cloud Handshake', 'Database Node', 'Security Clearance', 'Layout Protocols'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                 <MousePointer2 className="h-12 w-12 text-slate-400" />
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{activeTab} parameters locked</h3>
                 <p className="text-[10px] font-bold uppercase text-slate-500">This sector is under encryption in the current kernel version.</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

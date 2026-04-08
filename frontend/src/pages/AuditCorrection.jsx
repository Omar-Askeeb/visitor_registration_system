import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  User, 
  Printer, 
  Save, 
  ArrowRight,
  Loader2,
  X,
  MapPin,
  CalendarDays,
  BadgeCheck
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';

const GENDERS    = ['ذكر', 'أنثى'];
const COUNTRIES  = [
  'ليبيا','مصر','تونس','الجزائر','المغرب','السودان','موريتانيا',
  'الأردن','السعودية','الإمارات','الكويت','قطر','البحرين','عُمان',
  'العراق','سوريا','لبنان','اليمن','الصومال','جيبوتي','تركيا','إيران',
  'باكستان','الهند','الصين','الولايات المتحدة','المملكة المتحدة',
  'ألمانيا','فرنسا','إيطاليا','إسبانيا','روسيا','أخرى',
];

const AuditCorrection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('event_id') || '');
  const [formIDInput, setFormIDInput] = useState(searchParams.get('form_id') || '');
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [visitor, setVisitor] = useState(null);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load active events
  useEffect(() => {
    fetch(`${API}/events?status=active`)
      .then(r => r.json())
      .then(data => {
        setEvents(data);
        if (!selectedEventId && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Look up function
  const lookup = async (fid = formIDInput) => {
    let finalFid = fid.trim();
    if (!finalFid || !selectedEventId) return;

    // Auto-prefix if 5 digits
    if (finalFid.length === 5 && /^\d+$/.test(finalFid) && activeEvent?.form_id_prefix) {
      finalFid = activeEvent.form_id_prefix + finalFid;
      setFormIDInput(finalFid);
    }
    
    setSearching(true);
    setVisitor(null);
    setForm(null);
    setMessage(null);
    
    try {
      const res = await fetch(`${API}/events/${selectedEventId}/visitors/check-form-id?formID=${encodeURIComponent(finalFid)}`);
      const data = await res.json();
      if (data.exists) {
        setVisitor(data.visitor);
        setForm({ ...data.visitor });
        setSearchParams({ event_id: selectedEventId, form_id: finalFid });
      } else {
        setMessage({ type: 'error', text: 'Form ID not found for this event.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to search for record.' });
    } finally {
      setSearching(false);
    }
  };

  // Initial lookup if params exist
  useEffect(() => {
    if (searchParams.get('form_id') && selectedEventId) {
      lookup(searchParams.get('form_id'));
    }
  }, [selectedEventId]);

  const handleUpdate = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleOption = (field, opt) => {
    setForm(prev => {
      const list = Array.isArray(prev[field]) ? prev[field] : [];
      return {
        ...prev,
        [field]: list.includes(opt) ? list.filter(i => i !== opt) : [...list, opt]
      };
    });
  };

  const saveAudit = async (verifyOnly = false) => {
    if (!visitor || !form) return;
    setSaving(true);
    try {
      const url = `${API}/events/${selectedEventId}/visitors/${visitor.id}`;
      const payload = verifyOnly ? { is_verified: true, verification_type: 'direct' } : { ...form, is_verified: true, verification_type: 'fixed' };
      
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: verifyOnly ? 'Record approved as good!' : 'Record corrected and verified.' });
        // Clear search or keep? Let's keep for review
        const updated = await res.json();
        setVisitor(updated);
        setForm(updated);
      } else {
        throw new Error();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save audit results.' });
    } finally {
      setSaving(false);
    }
  };

  const activeEvent = events.find(e => e.id == selectedEventId);

  return (
    <div className="flex-1 bg-white dark:bg-[#020617] p-4 md:p-8 min-h-full">
      
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Auditor Correction Flow</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Audit <span className="text-cyan-500">Correction</span></h1>

        <div className="flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
          <div className="md:w-1/3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Exhibition</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all cursor-pointer"
            >
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>
          <div className="flex-1 relative">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">Form ID / Scanner</label>
            <div className="relative">
              <input
                value={formIDInput}
                onChange={(e) => setFormIDInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookup()}
                placeholder="Scan or type Form ID..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-12 py-3.5 text-lg font-black tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all uppercase"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-500 animate-spin" />}
            </div>
          </div>
          <div className="md:pt-6">
             <button
               onClick={() => lookup()}
               disabled={searching || !formIDInput}
               className="w-full md:w-auto h-full px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
             >
               Find
             </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`max-w-4xl mx-auto mb-6 p-4 rounded-2xl border flex items-center space-x-4 ${
          message.type === 'error' ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 text-red-600' : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-600'
        }`}>
          {message.type === 'error' ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}
          <span className="text-xs font-black uppercase tracking-widest leading-none">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-1.5 hover:bg-black/5 rounded-lg"><X className="h-4 w-4" /></button>
        </div>
      )}

      {visitor && form && (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm">
                 <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-6">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Record Correction</h2>
                    {visitor.is_verified && (
                      <div className={`px-4 py-1.5 rounded-xl border flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest ${
                        visitor.verification_type === 'fixed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}>
                         <BadgeCheck className="h-3.5 w-3.5" />
                         <span>Already {visitor.verification_type === 'fixed' ? 'Corrected' : 'Verified'}</span>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-6 mb-6">
                    <Field label="Visitor Name" name="visitorName" value={form.visitorName} onChange={handleUpdate} dir="rtl" />
                    <Field label="Surname" name="surName" value={form.surName} onChange={handleUpdate} dir="rtl" />
                 </div>

                 <div className="grid grid-cols-2 gap-6 mb-6">
                    <Field label="Organisation" name="organisation" value={form.organisation} onChange={handleUpdate} dir="rtl" />
                    <Field label="Email Address" name="email" value={form.email} onChange={handleUpdate} type="email" />
                 </div>

                 <div className="grid grid-cols-2 gap-6 mb-8">
                    <Field label="Phone 1" name="phone1" value={form.phone1} onChange={handleUpdate} />
                    <Field label="Phone 2" name="phone2" value={form.phone2} onChange={handleUpdate} />
                 </div>

                 <div className="space-y-6">
                    <SelectionGroup label="Work Field" options={activeEvent?.workfield_options || []} selected={form.workfield} onToggle={(opt) => toggleOption('workfield', opt)} />
                    <SelectionGroup label="How did you find us?" options={activeEvent?.howexpo_options || []} selected={form.howexpo} onToggle={(opt) => toggleOption('howexpo', opt)} color="indigo" />
                 </div>
              </div>
            </div>

            {/* Meta/Action Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Creator Info */}
              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Original Personnel</label>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 font-black text-lg">
                    {visitor.creator?.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">{visitor.creator?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{new Date(visitor.created_at).toLocaleDateString()} at {new Date(visitor.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  </div>
                </div>
              </div>

              {/* Action Stack */}
              <div className="space-y-3">
                <button
                  onClick={() => saveAudit(false)}
                  disabled={saving}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-5 rounded-3xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Corrections & Verify</span>
                </button>

                <button
                  onClick={() => saveAudit(true)}
                  disabled={saving}
                  className="w-full bg-emerald-500 text-white font-black py-5 rounded-3xl shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Approve as Good</span>
                </button>

                <button
                  onClick={() => { setVisitor(null); setForm(null); setFormIDInput(''); setMessage(null); setSearchParams({}); }}
                  className="w-full bg-slate-100 dark:bg-slate-900 text-slate-500 font-black py-5 rounded-3xl hover:bg-red-500/10 hover:text-red-500 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  Clear & Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!visitor && !searching && (
        <div className="max-w-4xl mx-auto py-32 text-center text-slate-300 dark:text-slate-700">
           <Search className="h-20 w-20 mx-auto mb-6 opacity-20" />
           <div className="text-xl font-black uppercase tracking-widest opacity-30 italic">Ready for Scanning...</div>
        </div>
      )}
    </div>
  );
};

// Internal Helpers
const Field = ({ label, name, value, onChange, type = "text", dir = 'ltr' }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2 ml-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      dir={dir}
      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all ${dir === 'rtl' ? 'text-right' : ''}`}
    />
  </div>
);

const SelectionGroup = ({ label, options, selected, onToggle, color = 'cyan' }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 ml-1">
      {label}
    </label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            selected?.includes(opt)
              ? (color === 'indigo'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30')
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default AuditCorrection;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays, MapPin, ArrowRight, Loader2, Search,
  CheckCircle2, AlertTriangle, X, Printer,
  Save, Eraser, RefreshCw
} from 'lucide-react';
import { openPrintWindow } from '../utils/printBadge';

const API = import.meta.env.VITE_API_URL || '/api';

/* ─────── Static data ─────── */
const GENDERS    = ['ذكر', 'أنثى'];
const COUNTRIES  = ['ليبيا']; 

const EMPTY_FORM = {
  first_name: '', last_name: '', position: '', organisation: '',
  email: '', phone1: '', has_whatsapp: false, phone2: '',
  gender: 'ذكر', nationality: 'ليبيا', resident: 'ليبيا',
};

/* ═══════════════════════════════════════════════════
   PHASE A — Event Selector
═══════════════════════════════════════════════════ */
const EventSelector = ({ onSelect }) => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/events`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data.filter(e => e.status === 'active'));
        } else {
          setEvents([]);
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-48 space-y-4">
      <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Events…</span>
    </div>
  );

  return (
    <div className="p-8 min-h-full bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] transition-colors duration-300">
      <div className="mb-10 text-right space-y-2">
        <div className="flex items-center justify-end space-x-2 text-cyan-600 dark:text-cyan-400 mb-1 space-x-reverse">
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Media Agent Registration</span>
          <CalendarDays className="h-4 w-4" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
          Select <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent not-italic">Event</span>
        </h1>
        <p className="mt-2 text-slate-500 text-sm font-medium">Select an active event to register media agents.</p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-400 font-bold">No active events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => onSelect(ev)}
              className="group text-right bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[24px] p-6 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 transition-all rounded-[24px]" />
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">{ev.name}</h3>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Event</span>
                <ArrowRight className="h-4 w-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────── Reusable UI Components ─────── */
const ArabicInput = ({ label, name, type = 'text', value, onChange, onKeyDown, disabled, inputRef, placeholder = '', restrict }) => {
  const handleKeyDownLocal = (e) => {
    if (restrict === 'numbers') {
       const isAllowed = /^\d$/.test(e.key) || ['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key);
       if (!isAllowed) { e.preventDefault(); return; }
    }
    if (restrict === 'letters') {
       const isAllowed = /^[a-zA-Z\s\u0600-\u06FF]$/.test(e.key) || ['Backspace', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key);
       if (!isAllowed) { e.preventDefault(); return; }
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div>
      <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5 text-right">
        {label}:
      </label>
      <input
        ref={inputRef}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        onKeyDown={handleKeyDownLocal}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white text-right placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
};

const ArabicSelect = ({ label, name, value, onChange, onKeyDown, disabled, inputRef, options }) => (
  <div>
    <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 mb-1.5 text-right">
      {label}:
    </label>
    <select
      ref={inputRef}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/* ═══════════════════════════════════════════════════
   PHASE B — Registration Form
═══════════════════════════════════════════════════ */
const RegistrationForm = ({ event, onBack, countryOptions = [] }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const refs = {
    first_name: useRef(), last_name: useRef(), position: useRef(), organisation: useRef(),
    email: useRef(), phone1: useRef(), phone2: useRef(), gender: useRef(),
    nationality: useRef(), resident: useRef(),
  };

  const FIELD_ORDER = [
    'first_name', 'last_name', 'position', 'organisation',
    'email', 'phone1', 'phone2', 'gender', 'nationality', 'resident'
  ];

  const focusNext = useCallback((currentName) => {
    const idx = FIELD_ORDER.indexOf(currentName);
    if (idx !== -1 && idx + 1 < FIELD_ORDER.length) {
      const nextName = FIELD_ORDER[idx + 1];
      refs[nextName]?.current?.focus();
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const makeKeyDown = useCallback((name) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(name); }
  }, [focusNext]);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClear = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedAgent(null);
  };

  const handleSelectAgent = (agent) => {
     setSelectedAgent(agent);
     setForm({
        ...EMPTY_FORM,
        ...agent,
        has_whatsapp: agent.has_whatsapp === 1 || agent.has_whatsapp === true
     });
     notify('تم تحميل بيانات الإعلامي');
  };

  const handlePrintOnly = async (agent) => {
    const target = agent || selectedAgent;
    if (!target) return;
    try {
      const printData = {
         visitorName: target.first_name,
         surName: target.last_name,
      };
      
      openPrintWindow(printData, null, event.name, false, {
         ...event.badge_layout,
         name: { ...(event.badge_layout?.name || {}), show: true },
         barcode: { ...(event.badge_layout?.barcode || {}), show: false },
         qrCode: { ...(event.badge_layout?.qrCode || {}), show: false }
      });

      await fetch(`${API}/events/${event.id}/media-agents/${target.id}/increment-print`, {
         method: 'POST',
         headers: { Accept: 'application/json' }
      });
      
      notify('تم أمر الطباعة وتحديث التكرار');
    } catch (e) {
      notify('فشل تحديث عداد الطباعة', 'error');
    }
  };

  const validateForm = () => {
    const { first_name, last_name, phone1 } = form;
    const letterRegex = /^[a-zA-Z\s\u0600-\u06FF]+$/;
    if (!letterRegex.test(first_name)) return 'الاسم الأول يجب أن يحتوي على حروف فقط';
    if (!letterRegex.test(last_name)) return 'اللقب يجب أن يحتوي على حروف فقط';
    const numberRegex = /^\d+$/;
    if (!numberRegex.test(phone1)) return 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
    const prefixes = ['091', '092', '093', '094', '095'];
    const start = phone1.substring(0, 3);
    if (prefixes.includes(start) && phone1.length !== 10) {
      return 'رقم الهاتف لهذه الشركة يجب أن يكون 10 أرقام';
    }
    return null;
  };

  const handleSave = async (print = false) => {
    if (!form.first_name || !form.last_name || !form.organisation || !form.phone1) {
      notify('يرجى ملء الحقول المطلوبة (الاسم، الجهة، الهاتف)', 'error');
      return;
    }
    const error = validateForm();
    if (error) { notify(error, 'error'); return; }

    setSaving(true);
    try {
      const isUpdate = !!selectedAgent;
      const url = isUpdate 
        ? `${API}/events/${event.id}/media-agents/${selectedAgent.id}`
        : `${API}/events/${event.id}/media-agents`;
      
      const r = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, print_count: print ? (isUpdate ? (selectedAgent.print_count||0)+1 : 1) : (selectedAgent?.print_count||0) }),
      });

      const data = await r.json();
      if (!r.ok) {
         throw new Error(data.errors ? Object.values(data.errors).flat()[0] : (data.message || 'فشل الحفظ'));
      }
      
      notify(isUpdate ? 'تم التحديث بنجاح' : 'تم الحفظ بنجاح');

      if (print) {
        const printData = { visitorName: data.first_name, surName: data.last_name };
        openPrintWindow(printData, null, event.name, false, {
           ...event.badge_layout,
           name: { ...(event.badge_layout?.name || {}), show: true },
           barcode: { ...(event.badge_layout?.barcode || {}), show: false },
           qrCode: { ...(event.badge_layout?.qrCode || {}), show: false }
        });
      }

      setTimeout(() => {
         handleClear();
         refs.first_name.current?.focus();
      }, 1500);

    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API}/events/${event.id}/media-agents/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Accept: 'application/json' }
        });
        const data = await r.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, event.id]);

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-[#020617] transition-colors duration-300" dir="rtl">
      
      {/* ── Toast (Consistent with Registration.jsx) ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold text-white border ${
          toast.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
        }`} dir="ltr">
          {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  LEFT (RTL Layout First): Search panel                   ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <aside className="w-[340px] shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#0a1020] overflow-hidden">
        
        {/* Back + event badge (Consistent) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/50">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-3"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            <span>Back to Events</span>
          </button>
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-3">
            <div className="flex items-center justify-between mb-0.5">
              <div className="text-[9px] text-cyan-100 font-black uppercase tracking-widest">Active Event</div>
              <RefreshCw className="h-3 w-3 text-cyan-100/50" />
            </div>
            <div className="text-white font-black text-sm leading-tight">{event.name}</div>
            {event.location && <div className="text-cyan-200 text-[10px] mt-0.5">{event.location}</div>}
          </div>
        </div>

        {/* Search header (Consistent) */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/50">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 text-right">
            بحث عن إعلامي
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => {
                let val = e.target.value;
                if (val.includes('/api/attendance/')) {
                  val = val.split('/').pop().trim();
                }
                setSearchQuery(val);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  let val = searchQuery;
                  if (val.includes('http://') || val.includes('https://')) {
                    val = val.split('/').filter(Boolean).pop();
                    setSearchQuery(val);
                  }
                }
              }}
              placeholder="ابحث بالاسم، الجهة، أو رقم الهاتف..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all text-right"
            />
          </div>
        </div>

        {/* Search results list */}
        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8">
               <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
            </div>
          )}
          {searchResults.map(a => (
            <button 
              key={a.id} 
              onClick={() => handleSelectAgent(a)}
              className="w-full p-4 border-b border-slate-100 dark:border-slate-800/50 hover:bg-cyan-500/5 transition-colors group relative text-right"
            >
              <div className="font-bold text-slate-900 dark:text-white text-xs">{a.first_name} {a.last_name}</div>
              <div className="text-[10px] text-slate-500">{a.organisation}</div>
              <div className="text-[10px] text-slate-400 mt-1">{a.phone1}</div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <CheckCircle2 className="h-4 w-4 text-cyan-500" />
              </div>
              {a.print_count > 0 && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 dark:text-slate-600">
                  {a.print_count}x
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  RIGHT (RTL Layout Second): Main Form Area               ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-row-reverse mb-8">
             <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-right">
                   {selectedAgent ? 'تعديل بيانات الإعلامي' : 'تسجيل إعلامي جديد'}
                </h2>
                {selectedAgent && <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest text-right mt-1">المعرف: {selectedAgent.badgeID}</div>}
             </div>
             {selectedAgent && (
                <button onClick={handleClear} className="flex items-center space-x-1.5 space-x-reverse text-[10px] font-black text-red-500 uppercase hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all">
                   <Eraser className="h-3.5 w-3.5" />
                   <span>إلغاء التحديد</span>
                </button>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <ArabicInput label="الاسم الأول" name="first_name" value={form.first_name} onChange={handleChange} onKeyDown={makeKeyDown('first_name')} inputRef={refs.first_name} restrict="letters" />
             <ArabicInput label="اللقب" name="last_name" value={form.last_name} onChange={handleChange} onKeyDown={makeKeyDown('last_name')} inputRef={refs.last_name} restrict="letters" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <ArabicInput label="الصفة" name="position" value={form.position} onChange={handleChange} onKeyDown={makeKeyDown('position')} inputRef={refs.position} />
             <ArabicInput label="جهة العمل" name="organisation" value={form.organisation} onChange={handleChange} onKeyDown={makeKeyDown('organisation')} inputRef={refs.organisation} />
          </div>

          <ArabicInput label="البريد الإلكتروني" name="email" value={form.email} onChange={handleChange} onKeyDown={makeKeyDown('email')} inputRef={refs.email} />

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
                <ArabicInput label="الهاتف 1" name="phone1" value={form.phone1} onChange={handleChange} onKeyDown={makeKeyDown('phone1')} inputRef={refs.phone1} restrict="numbers" />
                <label className="absolute left-0 top-0 flex items-center space-x-1.5 space-x-reverse cursor-pointer mt-1">
                   <input type="checkbox" name="has_whatsapp" checked={form.has_whatsapp} onChange={handleChange} className="h-3.5 w-3.5 accent-emerald-500 rounded focus:ring-emerald-500" />
                   <span className="text-[10px] font-bold text-slate-400">واتساب</span>
                </label>
             </div>
             <ArabicInput label="الهاتف 2" name="phone2" value={form.phone2} onChange={handleChange} onKeyDown={makeKeyDown('phone2')} inputRef={refs.phone2} restrict="numbers" />
          </div>

          <div className="grid grid-cols-3 gap-4">
             <ArabicSelect label="الجنس" name="gender" value={form.gender} onChange={handleChange} options={GENDERS} inputRef={refs.gender} />
             <ArabicSelect label="الجنسية" name="nationality" value={form.nationality} onChange={handleChange} options={countryOptions.length > 0 ? countryOptions : COUNTRIES} inputRef={refs.nationality} />
             <ArabicSelect label="بلد الإقامة" name="resident" value={form.resident} onChange={handleChange} options={countryOptions.length > 0 ? countryOptions : COUNTRIES} inputRef={refs.resident} />
          </div>

          {/* ── Action Buttons (Consistent with Registration.jsx) ── */}
          <div className="flex items-center justify-between gap-3 pt-8 pb-8" dir="ltr">
            <button
               onClick={handleClear}
               className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all font-black text-xs uppercase tracking-widest"
            >
               <Eraser className="h-4 w-4" />
               <span>مسح</span>
            </button>

            <div className="flex items-center gap-3">
              {/* Persistent Print Button */}
              <button
                onClick={() => handlePrintOnly()}
                disabled={!selectedAgent}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة</span>
              </button>

              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-blue-500/20"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{selectedAgent ? 'تحديث' : 'حفظ'}</span>
              </button>

              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-cyan-500/25"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                <span>{selectedAgent ? 'تحديث وطباعة' : 'حفظ وطباعة'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Main Component Wrapper
═══════════════════════════════════════════════════ */
const MediaRegistration = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [countryOptions, setCountryOptions] = useState([]);

  useEffect(() => {
    fetch(`${API}/countries`)
      .then(r => r.json())
      .then(data => {
        const names = Array.isArray(data) ? data.map(c => c.arabic_name) : [];
        setCountryOptions(names);
      })
      .catch(() => setCountryOptions([]));
  }, []);

  if (!selectedEvent) return <EventSelector onSelect={setSelectedEvent} />;

  return (
    <RegistrationForm 
      event={selectedEvent} 
      onBack={() => setSelectedEvent(null)} 
      countryOptions={countryOptions} 
    />
  );
};

export default MediaRegistration;

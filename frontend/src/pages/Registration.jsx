import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CalendarDays, MapPin, ArrowRight, Loader2, Search,
  CheckCircle2, AlertTriangle, X, RefreshCw, Printer,
  Save, Eraser, BadgeCheck, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { openPrintWindow } from '../utils/printBadge';

const API = import.meta.env.VITE_API_URL || '/api';

/* ─────── Static data ─────── */
const GENDERS    = ['ذكر', 'أنثى'];
const COUNTRIES  = [
  'ليبيا','مصر','تونس','الجزائر','المغرب','السودان','موريتانيا',
  'الأردن','السعودية','الإمارات','الكويت','قطر','البحرين','عُمان',
  'العراق','سوريا','لبنان','اليمن','الصومال','جيبوتي','تركيا','إيران',
  'باكستان','الهند','الصين','الولايات المتحدة','المملكة المتحدة',
  'ألمانيا','فرنسا','إيطاليا','إسبانيا','روسيا','أخرى',
];
const EMPTY_FORM = {
  formID:'', visitorName:'', midleName:'', surName:'',
  organisation:'', email:'', phone1:'', phone2:'',
  gender:'ذكر', nationality:'ليبيا', resident:'ليبيا',
  workfield:[], howexpo:[], print_count:0,
};

/* ─────── Print badge silently using hidden iframe ─────── */
// Removed local openPrintWindow, using shared utility instead.

/* ═══════════════════════════════════════════════════
   PHASE A — Event Selector
═══════════════════════════════════════════════════ */
const EventSelector = ({ onSelect }) => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/events`, { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(data => setEvents(data.filter(e => e.status === 'active')))
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
      <div className="mb-10">
        <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
          <CalendarDays className="h-4 w-4" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Registration</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
          Select an <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent not-italic">Event</span>
        </h1>
        <p className="mt-2 text-slate-500 text-sm font-medium">Click on an active event to open the registration form.</p>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-400 font-bold">No active events found.</p>
          <p className="text-xs text-slate-400">Go to Event Management and set an event to "Active".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map(ev => (
            <button
              key={ev.id}
              onClick={() => onSelect(ev)}
              className="group text-left bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[24px] p-6 hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
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
              {ev.location && (
                <div className="flex items-center space-x-1.5 text-slate-400 mb-3">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="text-xs font-bold">{ev.location}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {(ev.visitors_count || 0).toLocaleString()} Registered
                </span>
                <ArrowRight className="h-4 w-4 text-cyan-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   PHASE B — Registration Form
═══════════════════════════════════════════════════ */

/* — Reusable input, defined OUTSIDE the form to avoid focus loss — */
const ArabicInput = ({ label, name, type = 'text', value, onChange, onKeyDown, disabled, inputRef, placeholder = '' }) => (
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
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white text-right placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    />
  </div>
);

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
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

/* ——————————————————————————————————————————————————————— */
const RegistrationForm = ({ event, onBack }) => {
  /* Form state */
  const [form, setForm]                   = useState({ ...EMPTY_FORM });
  const [fieldsEnabled, setFieldsEnabled] = useState(false);
  const [formIDStatus, setFormIDStatus]   = useState(null); // null | 'checking' | 'duplicate' | 'ok'
  const [editingId, setEditingId]         = useState(null); // visitor ID if editing

  /* Badge ID state */
  const [prePrinted, setPrePrinted]     = useState(false);
  const [autoBadgeID, setAutoBadgeID]   = useState('');
  const [manualBadge, setManualBadge]   = useState('');

  /* Search state */
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);

  /* Saving/feedback */
  const [saving, setSaving]             = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [toast, setToast]               = useState(null);
  const [startTime, setStartTime]       = useState(null);

  const [searchParams] = useSearchParams();

  /* Load badge preference safely */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('badge_pref_preprinted');
      if (saved !== null) {
        setPrePrinted(saved === 'true');
      }
    } catch (e) {
      console.warn('Could not load badge preference from localStorage', e);
    }
  }, []);

  // Load record if edit_id is in URL
  useEffect(() => {
    const editId = searchParams.get('edit_id');
    if (editId && event.id) {
       fetch(`${API}/events/${event.id}/visitors/${editId}`)
         .then(r => r.json())
         .then(v => fillFromResult(v))
         .catch(e => console.error(e));
    }
  }, [searchParams, event.id]);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const r = await fetch(`${API}/events/${event.id}/sync`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const d = await r.json();
      if (r.ok) {
        notify(`تمت المزامنة بنجاح: تم إضافة ${d.added} زائر جديد`);
      } else {
        throw new Error(d.message || d.error || 'فشل المزامنة');
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  /* Field refs for Enter navigation */
  const refs = {
    formID:       useRef(),
    visitorName:  useRef(),
    midleName:    useRef(),
    surName:      useRef(),
    organisation: useRef(),
    email:        useRef(),
    phone1:       useRef(),
    phone2:       useRef(),
    gender:       useRef(),
    nationality:  useRef(),
    resident:     useRef(),
    manualBadge:  useRef(),
  };

  const FIELD_ORDER = [
    'formID','visitorName','midleName','surName',
    'organisation','email','phone1','phone2',
    'gender','nationality','resident',
  ];

  /* Focus next field by index */
  const focusNext = useCallback((currentName) => {
    const idx = FIELD_ORDER.indexOf(currentName);
    if (idx !== -1 && idx + 1 < FIELD_ORDER.length) {
      const nextName = FIELD_ORDER[idx + 1];
      refs[nextName]?.current?.focus();
    }
  }, []);

  /* Fetch next badge ID for event */
  const fetchNextBadge = useCallback(async () => {
    try {
      const r = await fetch(`${API}/events/${event.id}/visitors/next-badge-id`, {
        headers: { Accept: 'application/json' },
      });
      const d = await r.json();
      setAutoBadgeID(d.badgeID || '');
    } catch { setAutoBadgeID(''); }
  }, [event.id]);

  /* Generic field change handler with robust restrictions */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (value === undefined || value === null) return;
    
    let finalValue = value;

    // Restrictions: Names (Arabic/English characters and space only)
    if (['visitorName', 'midleName', 'surName'].includes(name)) {
      // Filter out everything except letters and spaces
      // \u0621-\u064A covers most common Arabic characters
      finalValue = value.replace(/[^a-zA-Z\u0621-\u064A\s]/g, '');
    }
    // Restrictions: Phone (Numbers and + only)
    else if (['phone1', 'phone2'].includes(name)) {
      finalValue = value.replace(/[^\d+]/g, '');
    }

    setForm(prev => ({ ...prev, [name]: finalValue }));
  }, []);

  /* Toggle checkbox arrays */
  const toggleArray = useCallback((field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  }, []);

  /* Enter handler for formID field */
  const handleFormIDKeyDown = useCallback(async (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    let fid = form.formID.trim();
    if (!fid) return;

    if (fid.length === 5 && /^\d+$/.test(fid)) {
      fid = (event.form_id_prefix || '') + fid;
      setForm(prev => ({ ...prev, formID: fid }));
    } else if (event.form_id_prefix && !fid.startsWith(event.form_id_prefix)) {
      notify('يرجى ادخال رقم نموذج تسجيل صحيح', 'error');
      return;
    }

    setFormIDStatus('checking');
    try {
      const r = await fetch(
        `${API}/events/${event.id}/visitors/check-form-id?formID=${encodeURIComponent(fid)}`,
        { headers: { Accept: 'application/json' } }
      );
      const { exists } = await r.json();
      if (exists && !event.is_training) {
        setFormIDStatus('duplicate');
      } else {
        setFormIDStatus('ok');
        setFieldsEnabled(true);
        setStartTime(Date.now()); // Start timer
        setTimeout(() => refs.visitorName.current?.focus(), 60);
      }
    } catch {
      setFormIDStatus(null);
    }
  }, [form.formID, event.id, event.form_id_prefix]);

  /* Generic Enter → next field */
  const makeKeyDown = useCallback((name) => (e) => {
    if (e.key === 'Enter') { e.preventDefault(); focusNext(name); }
  }, [focusNext]);

  /* Search */
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(
          `${API}/events/${event.id}/visitors/search?q=${encodeURIComponent(searchQuery)}`,
          { headers: { Accept: 'application/json' } }
        );
        setSearchResults(await r.json());
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery, event.id]);

  /* Fill form from search result (edit mode) */
  const fillFromResult = useCallback((v) => {
    setForm({
      formID:       v.formID       || '',
      visitorName:  v.visitorName  || '',
      midleName:    v.midleName    || '',
      surName:      v.surName      || '',
      organisation: v.organisation || '',
      email:        v.email        || '',
      phone1:       v.phone1       || '',
      phone2:       v.phone2       || '',
      gender:       v.gender       || 'ذكر',
      nationality:  v.nationality  || 'ليبيا',
      resident:     v.resident     || 'ليبيا',
      workfield:    v.workfield    || [],
      howexpo:      v.howexpo      || [],
      print_count:  v.print_count  || 0,
    });
    setFormIDStatus('ok');
    setFieldsEnabled(true);
    setManualBadge(v.badgeID || '');
    setPrePrinted(Boolean(v.badgeID));
    setEditingId(v.id);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  /* Clear form */
  const handleClear = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setFieldsEnabled(false);
    setFormIDStatus(null);
    
    // Respect badge preference from localStorage instead of resetting to false
    try {
      const saved = localStorage.getItem('badge_pref_preprinted');
      if (saved !== null) setPrePrinted(saved === 'true');
    } catch (e) {}

    setAutoBadgeID('');
    setManualBadge('');
    setEditingId(null);
    setStartTime(null);
    setTimeout(() => refs.formID.current?.focus(), 50);
  }, []);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* Determine effective badge ID */
  const effectiveBadgeID = prePrinted ? manualBadge : autoBadgeID;

  /* Save or update */
  const doSave = async (isPrinting = false) => {
    let finalFid = form.formID.trim();
    if (!finalFid) { notify('أدخل رقم النموذج أولاً', 'error'); return null; }
    setSaving(true);
    try {
      let finalBadgeID = effectiveBadgeID;
      if (!prePrinted && !finalBadgeID) {
         const br = await fetch(`${API}/events/${event.id}/visitors/next-badge-id`, { headers: { Accept: 'application/json' } });
         const bd = await br.json();
         finalBadgeID = bd.badgeID;
         setAutoBadgeID(bd.badgeID);
      }

      const nextPrintCount = isPrinting ? (form.print_count || 0) + 1 : (form.print_count || 0);

      const payload = { 
        ...form, 
        formID: finalFid, 
        badgeID: finalBadgeID || undefined,
        print_count: nextPrintCount,
        fill_duration: startTime ? (Date.now() - startTime) / 1000 : null,
      };
      
      let url, method;
      if (editingId) {
        url    = `${API}/events/${event.id}/visitors/${editingId}`;
        method = 'PUT';
      } else if (event.is_training) {
        url    = `${API}/events/${event.id}/visitors/training-records`;
        method = 'POST';
      } else {
        url    = `${API}/events/${event.id}/visitors`;
        method = 'POST';
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.message || 'فشل الحفظ');
      }
      const saved = await r.json();
      setEditingId(saved.id);
      notify(editingId ? 'تم تحديث السجل بنجاح' : 'تم حفظ السجل بنجاح');
      return { saved, badgeID: finalBadgeID, isFirstPrint: (form.print_count || 0) === 0 };
    } catch (err) {
      notify(err.message, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave         = async () => { 
    const res = await doSave(false); 
    if (res?.saved) handleClear();
  };
  const handlePrint        = async () => {
    const res = await doSave(true);
    if (res?.saved) {
      let printBarcode = false;
      if (res.isFirstPrint) {
         printBarcode = !prePrinted;
      } else {
         printBarcode = true;
      }
      openPrintWindow(form, res.badgeID, event.name, printBarcode);
      handleClear();
    }
  };
  const handleSaveAndPrint = async () => {
    const res = await doSave(true);
    if (res?.saved) {
      let printBarcode = false;
      if (res.isFirstPrint) {
         printBarcode = !prePrinted;
      } else {
         printBarcode = true;
      }
      openPrintWindow(form, res.badgeID, event.name, printBarcode);
      handleClear();
    }
  };

  /* ─ Render ─ */
  const inputDisabled = !fieldsEnabled;

  return (
    <div className="flex h-full overflow-hidden bg-white dark:bg-[#020617] transition-colors duration-300" dir="rtl">

      {/* ── Toast ── */}
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
        {/* Back + event badge */}
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
              {event.online_slug && (
                <button 
                  onClick={handleSync}
                  disabled={syncing}
                  className="text-cyan-100 hover:text-white transition-colors disabled:opacity-50"
                  title="المزامنة مع الرابط الخارجي"
                >
                  <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="text-white font-black text-sm leading-tight">{event.name}</div>
            {event.location && <div className="text-cyan-200 text-[10px] mt-0.5">{event.location}</div>}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800/50">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 text-right">
            بحث عن الزائر
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="اكتب الاسم أو الهاتف أو البريد..."
              dir="rtl"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all text-right"
            />
          </div>
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto">
          {searching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />
            </div>
          )}
          {!searching && searchResults.length === 0 && searchQuery.trim() && (
            <div className="p-4 text-center text-xs text-slate-400">لا توجد نتائج</div>
          )}
          {!searching && searchResults.length > 0 && (
            <div>
              {/* header */}
              <div className="grid grid-cols-5 gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-600 text-right">
                <span className="col-span-2">الاسم</span>
                <span>اللقب</span>
                <span>الهاتف</span>
                <span>إجراء</span>
              </div>
              {searchResults.map(v => (
                <button
                  key={v.id}
                  onClick={() => fillFromResult(v)}
                  className="w-full grid grid-cols-5 gap-1 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/50 hover:bg-cyan-500/5 text-right text-[11px] transition-colors group"
                >
                  <span className="col-span-2 font-bold text-slate-900 dark:text-white truncate">{v.visitorName}</span>
                  <span className="text-slate-500 truncate">{v.surName}</span>
                  <span className="text-slate-400 truncate">{v.phone1}</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-black text-[10px] group-hover:underline">اختر</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ╔══════════════════════════════════════════════════════════╗
          ║  RIGHT (RTL Layout Second): The Arabic registration form ║
          ╚══════════════════════════════════════════════════════════╝ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-5">

          {/* Form title */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">نموذج الزائر</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              {event.is_training && (
                <span className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase animate-pulse">
                  <RefreshCw className="h-3 w-3" />
                  <span>وضع التدريب نشط</span>
                </span>
              )}
              {editingId && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                  وضع التعديل
                </span>
              )}
            </div>
          </div>

          {/* ── رقم النموذج ── */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex-1">
                <ArabicInput
                  label="رقم النموذج"
                  name="formID"
                  value={form.formID}
                  onChange={handleChange}
                  onKeyDown={handleFormIDKeyDown}
                  inputRef={refs.formID}
                  placeholder="امسح رقم النموذج ثم اضغط Enter..."
                  disabled={!!editingId}
                />
              </div>
              {formIDStatus === 'checking' && (
                <Loader2 className="h-5 w-5 text-cyan-500 animate-spin mt-5 shrink-0" />
              )}
              {formIDStatus === 'ok' && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-5 shrink-0" />
              )}
            </div>
            {formIDStatus === 'duplicate' && (
              <div className="flex items-center space-x-2 space-x-reverse text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold">رقم النموذج موجود بالفعل</span>
              </div>
            )}
          </div>

          {/* ── Name row ── */}
          <div className="grid grid-cols-3 gap-4">
            <ArabicInput label="اسم الزائر" name="visitorName" value={form.visitorName}
              onChange={handleChange} onKeyDown={makeKeyDown('visitorName')}
              inputRef={refs.visitorName} disabled={inputDisabled} />
            <ArabicInput label="الاسم الأوسط" name="midleName" value={form.midleName}
              onChange={handleChange} onKeyDown={makeKeyDown('midleName')}
              inputRef={refs.midleName} disabled={inputDisabled} />
            <ArabicInput label="اللقب" name="surName" value={form.surName}
              onChange={handleChange} onKeyDown={makeKeyDown('surName')}
              inputRef={refs.surName} disabled={inputDisabled} />
          </div>

          {/* ── Org + Email ── */}
          <div className="grid grid-cols-2 gap-4">
            <ArabicInput label="جهة العمل" name="organisation" value={form.organisation}
              onChange={handleChange} onKeyDown={makeKeyDown('organisation')}
              inputRef={refs.organisation} disabled={inputDisabled} />
            <ArabicInput label="البريد الإلكتروني" name="email" type="email" value={form.email}
              onChange={handleChange} onKeyDown={makeKeyDown('email')}
              inputRef={refs.email} disabled={inputDisabled} />
          </div>

          {/* ── Phone row ── */}
          <div className="grid grid-cols-2 gap-4">
            <ArabicInput label="الهاتف 1" name="phone1" value={form.phone1}
              onChange={handleChange} onKeyDown={makeKeyDown('phone1')}
              inputRef={refs.phone1} disabled={inputDisabled} />
            <ArabicInput label="الهاتف 2" name="phone2" value={form.phone2}
              onChange={handleChange} onKeyDown={makeKeyDown('phone2')}
              inputRef={refs.phone2} disabled={inputDisabled} />
          </div>

          {/* ── Gender / Nationality / Resident ── */}
          <div className="grid grid-cols-3 gap-4">
            <ArabicSelect label="الجنس" name="gender" value={form.gender}
              onChange={handleChange} onKeyDown={makeKeyDown('gender')}
              inputRef={refs.gender} disabled={inputDisabled} options={GENDERS} />
            <ArabicSelect label="الجنسية" name="nationality" value={form.nationality}
              onChange={handleChange} onKeyDown={makeKeyDown('nationality')}
              inputRef={refs.nationality} disabled={inputDisabled} options={COUNTRIES} />
            <ArabicSelect label="بلد الإقامة" name="resident" value={form.resident}
              onChange={handleChange} onKeyDown={makeKeyDown('resident')}
              inputRef={refs.resident} disabled={inputDisabled} options={COUNTRIES} />
          </div>

          {/* ── Checkboxes ── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Workfield */}
            <div className={`bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-opacity ${inputDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-3 text-right">مجالات العمل</div>
              <div className="space-y-2" dir="rtl">
                {(event.workfield_options || []).map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(form.workfield || []).includes(opt)}
                      onChange={() => toggleArray('workfield', opt)}
                      className="h-4 w-4 accent-cyan-500 rounded"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{opt}</span>
                  </label>
                ))}
                {(event.workfield_options || []).length === 0 && <span className="text-[10px] italic text-slate-400">لا توجد خيارات متاحة</span>}
              </div>
            </div>

            {/* How Expo */}
            <div className={`bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-opacity ${inputDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-3 text-right">كيف علمت بالمعرض؟</div>
              <div className="space-y-2" dir="rtl">
                {(event.howexpo_options || []).map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(form.howexpo || []).includes(opt)}
                      onChange={() => toggleArray('howexpo', opt)}
                      className="h-4 w-4 accent-cyan-500 rounded"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{opt}</span>
                  </label>
                ))}
                {(event.howexpo_options || []).length === 0 && <span className="text-[10px] italic text-slate-400">لا توجد خيارات متاحة</span>}
              </div>
            </div>
          </div>

          {/* ── Badge ID section ── */}
          <div className={`bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-opacity ${inputDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 mb-3 text-right flex items-center justify-end space-x-2 space-x-reverse">
              <BadgeCheck className="h-4 w-4 text-purple-500" />
              <span>رقم البادج</span>
            </div>

            {/* Toggle */}
            <div className={`flex items-center justify-end space-x-4 space-x-reverse mb-4 ${editingId ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <span className={`text-xs font-bold ${!prePrinted ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}>توليد تلقائي</span>
                <input 
                  type="radio" 
                  checked={!prePrinted} 
                  onChange={() => {
                    setPrePrinted(false);
                    try { localStorage.setItem('badge_pref_preprinted', 'false'); } catch(e) {}
                  }} 
                  className="accent-cyan-500" 
                  disabled={!!editingId} 
                />
              </label>
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <span className={`text-xs font-bold ${prePrinted ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>بادج مطبوع مسبقاً</span>
                <input 
                  type="radio" 
                  checked={prePrinted} 
                  onChange={() => {
                    setPrePrinted(true);
                    try { localStorage.setItem('badge_pref_preprinted', 'true'); } catch(e) {}
                  }} 
                  className="accent-purple-500" 
                  disabled={!!editingId} 
                />
              </label>
            </div>

            {prePrinted ? (
              <ArabicInput
                label="رقم البادج المطبوع"
                name="manualBadge"
                value={manualBadge}
                onChange={e => setManualBadge(e.target.value)}
                onKeyDown={() => {}}
                inputRef={refs.manualBadge}
                placeholder="امسح رقم البادج..."
                disabled={!!editingId}
              />
            ) : (
              <div className="flex items-center justify-end">
                <div className={`font-mono text-lg font-black bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-5 py-2.5 tracking-widest ${autoBadgeID ? 'text-cyan-600 dark:text-cyan-400' : 'text-cyan-600/50 dark:text-cyan-400/50 text-sm'}`}>
                  {autoBadgeID || 'سيتم توليد الرقم عند الحفظ'}
                </div>
              </div>
            )}
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-8" dir="ltr">
            <button
              onClick={handleClear}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all font-black text-xs uppercase tracking-widest"
            >
              <Eraser className="h-4 w-4" />
              <span>مسح</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={!effectiveBadgeID}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !fieldsEnabled}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl border border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-blue-500/20"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>حفظ</span>
              </button>

              <button
                onClick={handleSaveAndPrint}
                disabled={saving || !fieldsEnabled}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-cyan-500/25"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                <span>حفظ وطباعة</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Registration = () => {
  const [searchParams] = useSearchParams();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const evId = searchParams.get('event_id');
    if (evId) {
      // Auto-load event
      fetch(`${API}/events/${evId}`)
        .then(r => r.json())
        .then(data => {
          setSelectedEvent(data);
          setInitialLoading(false);
        })
        .catch(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [searchParams]);

  if (initialLoading) return (
    <div className="flex items-center justify-center min-h-full">
      <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
    </div>
  );

  if (!selectedEvent) {
    return <EventSelector onSelect={setSelectedEvent} />;
  }

  return <RegistrationForm event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
};

export default Registration;

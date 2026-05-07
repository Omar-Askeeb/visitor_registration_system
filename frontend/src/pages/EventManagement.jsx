import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Fingerprint,
  Globe,
  BadgeCheck,
  Clock,
  Users,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCcw,
  Timer,
  UploadCloud,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import EventInsightsModal from '../components/EventInsightsModal';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const STATUS_STYLES = {
  active:    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  upcoming:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  completed: 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-500/20',
};

const EMPTY_FORM = {
  name: '',
  location: '',
  start_date: '',
  end_date: '',
  duration: '',
  badge_id_prefix: '',
  form_id_prefix: '',
  online_reg_prefix: '',
  self_service_prefix: '',
  target_visitors: '',
  status: 'upcoming',
  notes: '',
  online_slug: '',
  sync_enabled: false,
  sync_url: '',
  sync_interval: 1,
  sync_countdown: 120,
  workfield_options: [
    {"ar": "العمارة", "en": "Architecture"},
    {"ar": "مواد البناء", "en": "Building Materials"},
    {"ar": "الصناديق والمؤسسات المالية", "en": "Funds & Financial Institutions"},
    {"ar": "ديكور داخلي", "en": "Interior Design"},
    {"ar": "أعمال ميكانيكية", "en": "Mechanical Works"},
    {"ar": "عقارات", "en": "Real Estate"}
  ],
  howexpo_options: [
    {"ar": "البريد الإلكتروني", "en": "Email"},
    {"ar": "الفيسبوك", "en": "Facebook"},
    {"ar": "تويتر", "en": "Twitter"},
    {"ar": "الانستقرام", "en": "Instagram"},
    {"ar": "الرسائل القصيرة / وتس اب", "en": "SMS / WhatsApp"},
    {"ar": "محركات البحث", "en": "Search Engines"},
    {"ar": "التلفزيون / الراديو", "en": "TV / Radio"}
  ],
  is_training: false,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Field — MUST be defined OUTSIDE any component that uses it.
   If defined inside, React recreates it every render and the input loses
   focus on every keystroke.
═══════════════════════════════════════════════════════════════════════════ */
const Field = ({ label, name, type = 'text', placeholder = '', icon: Icon, hint, value, onChange }) => (
  <div>
    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 pointer-events-none" />
      )}
      <input
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
    {hint && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-600">{hint}</p>}
  </div>
);

const DateField = ({ label, name, value, onChange, icon: Icon }) => {
  const displayValue = value ? value.split('-').reverse().join('/') : '';
  const inputRef = React.useRef();

  return (
    <div className="w-full">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-600 pointer-events-none z-10" />
        )}
        <div className="relative">
          <input
            type="text"
            readOnly
            value={displayValue}
            onClick={() => inputRef.current?.showPicker()}
            placeholder="DD/MM/YYYY"
            className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-all cursor-pointer ${Icon ? 'pl-10 pr-10' : 'px-4'}`}
          />
          <input
            type="date"
            name={name}
            ref={inputRef}
            value={value || ''}
            onChange={onChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            style={{ pointerEvents: 'none', visibility: 'hidden', position: 'absolute' }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-cyan-500 transition-colors pointer-events-none">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ListEditor = ({ label, items = [], onUpdate, placeholder = "Add new..." }) => {
  const [arValue, setArValue] = useState('');
  const [enValue, setEnValue] = useState('');
  const safeItems = Array.isArray(items) ? items : [];

  const addItem = () => {
    const ar = arValue.trim();
    const en = enValue.trim();
    if (ar && en) {
      if (!safeItems.find(i => (typeof i === 'object' && (i.ar === ar || i.en === en)) || i === ar)) {
        onUpdate([...safeItems, { ar, en }]);
        setArValue('');
        setEnValue('');
      }
    }
  };

  const removeItem = (item) => {
    onUpdate(safeItems.filter(i => i !== item));
  };

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        {safeItems.length === 0 && <span className="text-xs text-slate-400 italic">No items added yet.</span>}
        {safeItems.map((item, idx) => {
          const isObj = typeof item === 'object' && item !== null;
          const arLabel = isObj ? item.ar : item;
          const enLabel = isObj ? item.en : '';
          return (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-cyan-500">{arLabel}</span>
              {enLabel && (
                <>
                  <span className="text-slate-400 mx-1">|</span>
                  <span>{enLabel}</span>
                </>
              )}
              <button type="button" onClick={() => removeItem(item)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input
          value={arValue}
          onChange={(e) => setArValue(e.target.value)}
          placeholder="Arabic..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
        <input
          value={enValue}
          onChange={(e) => setEnValue(e.target.value)}
          placeholder="English..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EventModal
═══════════════════════════════════════════════════════════════════════════ */
const EventModal = ({ event, onClose, onSave }) => {
  const [form, setForm]   = useState(() => {
    const parseList = (val, fallback) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return fallback; }
      }
      return fallback;
    };

    if (!event) return { ...EMPTY_FORM };
    return {
      ...EMPTY_FORM,
      ...event,
      start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '',
      end_date:   event.end_date   ? new Date(event.end_date).toISOString().split('T')[0] : '',
      workfield_options: parseList(event.workfield_options, EMPTY_FORM.workfield_options),
      howexpo_options:   parseList(event.howexpo_options,   EMPTY_FORM.howexpo_options),
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const isEdit = Boolean(event?.id);
  const eventName = event?.name || 'New Event';

  // Stable handler — won't change between renders
  const handle = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  }, []);

  const handleSkipSync = async () => {
    if (!event?.id) return;
    if (!window.confirm('Are you sure you want to mark all remaining unsynced records as skipped? This cannot be undone.')) return;
    
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/events/${event.id}/visitors/skip-external`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to skip sync');
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url    = isEdit ? `${API_BASE}/events/${event.id}` : `${API_BASE}/events`;
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save event');
      }
      const saved = await res.json();
      onSave(saved, isEdit);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800/50 shrink-0">
          <div>
            <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
              <CalendarDays className="h-4 w-4" />
              <span className="text-[10px] uppercase font-black tracking-[0.3em]">
                {isEdit ? 'Edit Event' : 'New Event'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEdit ? `Editing: ${eventName}` : 'Create New Event'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={submit} className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Event Info ── */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-500 mb-4">
              Event Details
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Event Name *" name="name" icon={CalendarDays} placeholder="e.g. Libya Build 2026"
                     value={form.name} onChange={handle} />
              <Field label="Location" name="location" icon={MapPin} placeholder="e.g. Tripoli International Fairground"
                     value={form.location} onChange={handle} />
              <div className="grid grid-cols-2 gap-4">
                <DateField label="Start Date" name="start_date" icon={Calendar}
                       value={form.start_date} onChange={handle} />
                <DateField label="End Date"   name="end_date"   icon={Calendar}
                       value={form.end_date} onChange={handle} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Duration (days)" name="duration" type="number" icon={Clock} placeholder="e.g. 5"
                       value={form.duration} onChange={handle} />
                <Field label="Target Visitors" name="target_visitors" type="number" icon={Users} placeholder="e.g. 12000"
                       value={form.target_visitors} onChange={handle} />
              </div>

              {/* Status select */}
              <CustomSelect
                label="Status"
                value={form.status}
                options={[
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' }
                ]}
                onChange={val => setForm(prev => ({ ...prev, status: val }))}
              />

              {/* Notes textarea */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes || ''}
                  onChange={handle}
                  rows={3}
                  placeholder="Any additional notes about this event..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ── ID Format Prefixes ── */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400 mb-1">
              ID Format Prefixes
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
              These prefixes are prepended when generating IDs for this event.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="Badge ID Prefix *" name="badge_id_prefix" icon={BadgeCheck} placeholder="e.g. LB-"
                hint="Used for physical badge IDs at entry. Generated format: LB-0001"
                value={form.badge_id_prefix} onChange={handle}
              />
              <Field
                label="Form ID Prefix *" name="form_id_prefix" icon={Fingerprint} placeholder="e.g. F-"
                hint="Used for registration form IDs. Generated format: F-0001"
                value={form.form_id_prefix} onChange={handle}
              />
              <Field
                label="Online Registration Prefix *" name="online_reg_prefix" icon={Globe} placeholder="e.g. ON-"
                hint="Used for online pre-registered visitors. Generated format: ON-0001"
                value={form.online_reg_prefix} onChange={handle}
              />
              <Field
                label="Self-Service Prefix" name="self_service_prefix" icon={Fingerprint} placeholder="e.g. SS-"
                hint="Used by self-service app for visitor formIDs. Generated format: SS-0001"
                value={form.self_service_prefix} onChange={handle}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ── Synchronization Engine ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-500">
                Synchronization Settings
              </div>
              <label className="flex items-center cursor-pointer group">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-3 group-hover:text-slate-300 transition-colors">Enabled</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    name="sync_enabled" 
                    checked={form.sync_enabled} 
                    onChange={handle}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${form.sync_enabled ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.sync_enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="Online Slug" name="online_slug" icon={Globe} placeholder="e.g. libya-build-2026"
                hint="External slug used for API identification."
                value={form.online_slug} onChange={handle}
              />
              <Field
                label="Sync API URL" name="sync_url" icon={RefreshCcw} placeholder="https://eventxcrm.com/api/get-visitors/..."
                hint="Full API endpoint for visitor synchronization."
                value={form.sync_url} onChange={handle}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Sync Frequency (min)" name="sync_interval" type="number" icon={Clock} placeholder="e.g. 1"
                  hint="How often to trigger background sync."
                  value={form.sync_interval} onChange={handle}
                />
                <Field
                  label="Dashboard Timer (sec)" name="sync_countdown" type="number" icon={Timer} placeholder="e.g. 120"
                  hint="Seconds for the UI countdown."
                  value={form.sync_countdown} onChange={handle}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

            {/* ── Push Synchronization ── */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-500">
                Push Synchronization (Outgoing)
              </div>
              <label className="flex items-center cursor-pointer group">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-3 group-hover:text-slate-300 transition-colors">Enabled</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    name="sync_push_enabled" 
                    checked={form.sync_push_enabled || false} 
                    onChange={handle}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${form.sync_push_enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.sync_push_enabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Field
                label="Push API URL" name="sync_push_url" icon={ArrowRight} placeholder="https://eventxcrm.com/api/register-visitor-onsite"
                hint="API endpoint to send on-site registrations to."
                value={form.sync_push_url || ''} onChange={handle}
              />
              
              {isEdit && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleSkipSync}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    <span>Mark Remaining as Skipped</span>
                  </button>
                  <p className="mt-1.5 text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed italic">
                    Prevents records from being pushed to the external CRM. Useful if you want to stop syncing for this event.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ── Training Mode ── */}
          <div>
            <div className="flex items-center justify-between p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400 mb-1">
                  Training Mode
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enables practice sessions for data entry. Isolation from real data.
                </p>
              </div>
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    name="is_training" 
                    checked={form.is_training} 
                    onChange={handle}
                    className="sr-only" 
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${form.is_training ? 'bg-purple-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${form.is_training ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* ── Dynamic Registration Options ── */}
          <div className="space-y-6">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-500">
              Registration Categories
            </div>
            <ListEditor
              label="Work Field Options"
              items={form.workfield_options}
              onUpdate={(newItems) => setForm(f => ({ ...f, workfield_options: newItems }))}
              placeholder="e.g. IT, Construction..."
            />
            <ListEditor
              label="Marketing Channel Options"
              items={form.howexpo_options}
              onUpdate={(newItems) => setForm(f => ({ ...f, howexpo_options: newItems }))}
              placeholder="e.g. Social Media, SMS..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 shrink-0 flex items-center justify-end space-x-3">
          <button
            type="button" onClick={onClose}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   DeleteModal
═══════════════════════════════════════════════════════════════════════════ */
const DeleteModal = ({ event, onClose, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/events/${event.id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed');
      onDelete(event.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-[#0c1325] border border-red-500/20 rounded-[24px] p-8 shadow-[0_40px_80px_-20px_rgba(239,68,68,0.3)]">
        <div className="flex items-center justify-center h-14 w-14 bg-red-500/10 rounded-2xl mx-auto mb-6">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-900 dark:text-white mb-2">Delete Event?</h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-1">
          You are about to delete <span className="font-black text-slate-900 dark:text-white">"{event.name}"</span>.
        </p>
        <p className="text-center text-xs text-red-500 font-bold mb-8">
          All associated visitor records will also be deleted.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={deleting}
            className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span>{deleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   EventCard
═══════════════════════════════════════════════════════════════════════════ */
const EventCard = ({ event, onEdit, onDelete, onInsights, isReadOnly, onNotify }) => {
  const progress = event.target_visitors > 0
    ? Math.min((event.visitors_count / event.target_visitors) * 100, 100)
    : 0;

  const [resyncing, setResyncing]         = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(null);
  const [missingScanCount, setMissingScanCount] = useState(null);
  const [fixingScans, setFixingScans] = useState(false);

  // Fetch unsynced count on mount (skip training events)
  useEffect(() => {
    if (event.is_training) return;
    fetch(`${API_BASE}/events/${event.id}/visitors/unsynced-count`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUnsyncedCount(d.count); })
      .catch(() => {});

    // Fetch missing scans count
    fetch(`${API_BASE}/events/${event.id}/missing-scans`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json' 
      },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setMissingScanCount(d.length))
      .catch(() => setMissingScanCount(0));
  }, [event.id, event.is_training]);

  const handleResync = async () => {
    if (resyncing) return;
    setResyncing(true);
    try {
      const res = await fetch(`${API_BASE}/events/${event.id}/visitors/resync-external`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        onNotify(`CRM Resync queued: ${data.queued} records.`);
        setUnsyncedCount(0);
      } else {
        onNotify(data.message || 'Resync failed.', 'error');
      }
    } catch {
      onNotify('Resync request failed.', 'error');
    } finally {
      setResyncing(false);
    }
  };

  const handleFixMissing = async () => {
    if (fixingScans || !missingScanCount) return;
    onInsights(event);
  };
    


  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[24px] p-6 hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/3 group-hover:to-blue-600/3 transition-all duration-500 rounded-[24px]" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex-1 min-w-0 mr-3">
          <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight truncate">{event.name}</h3>
          {event.location && (
            <div className="flex items-center space-x-1.5 mt-1.5">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold truncate">{event.location}</span>
            </div>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[event.status] || STATUS_STYLES.upcoming}`}>
          {event.status}
        </span>
        {event.is_training && (
          <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            🎓 Training
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center space-x-4 mb-4 relative">
        <div className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold">{formatDate(event.start_date)}</span>
        </div>
        {event.end_date && (
          <>
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{formatDate(event.end_date)}</span>
          </>
        )}
        {event.duration && (
          <span className="ml-auto text-[10px] font-black text-slate-400 dark:text-slate-600 flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{event.duration}d</span>
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5 relative">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 flex items-center space-x-1.5">
            <Users className="h-3 w-3" />
            <span>Registered</span>
          </span>
          <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
            {(event.visitors_count || 0).toLocaleString()}
            {event.target_visitors > 0 && (
              <span className="text-slate-400 dark:text-slate-600 font-bold"> / {Number(event.target_visitors).toLocaleString()}</span>
            )}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prefix tags */}
      <div className="flex flex-wrap gap-2 mb-5 relative">
        {event.badge_id_prefix && (
          <div className="flex items-center space-x-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
            <BadgeCheck className="h-3 w-3 text-purple-500" />
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 tracking-widest">{event.badge_id_prefix}####</span>
          </div>
        )}
        {event.form_id_prefix && (
          <div className="flex items-center space-x-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-1.5">
            <Fingerprint className="h-3 w-3 text-cyan-500" />
            <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-widest">{event.form_id_prefix}####</span>
          </div>
        )}
        {event.online_reg_prefix && (
          <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
            <Globe className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest">{event.online_reg_prefix}####</span>
          </div>
        )}
        {event.self_service_prefix && (
          <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
            <Fingerprint className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-widest text-amber-600">{event.self_service_prefix}####</span>
          </div>
        )}
      </div>

      {/* Actions — hidden for data_entry read-only view */}
      {!isReadOnly && (
        <div className="flex items-center space-x-2 relative">
          <button
            onClick={() => onEdit(event)}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          {/* CRM Resync button — only for non-training events and enabled push sync */}
          {!event.is_training && event.sync_push_enabled && (
            <button
              onClick={handleResync}
              disabled={resyncing || unsyncedCount === 0}
              title={unsyncedCount === 0 ? 'All records synced' : `${unsyncedCount ?? '?'} unsynced records`}
              className="relative flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-500/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {resyncing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <UploadCloud className="h-3.5 w-3.5" />
              }
              {unsyncedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unsyncedCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => onInsights(event)}
            className="flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
            title="Detailed Insights"
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </button>

          {/* Missing Scans Recovery Button */}
          {missingScanCount > 0 && (
            <button
              onClick={handleFixMissing}
              disabled={fixingScans}
              className="relative flex items-center justify-center px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 transition-all animate-pulse hover:animate-none"
              title={`Recover ${missingScanCount} missing scans`}
            >
              {fixingScans ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {missingScanCount}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════════════════ */
const EventManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isReadOnly = user?.role === 'data_entry';

  const [events, setEvents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalEvent, setModalEvent]     = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [insightsEvent, setInsightsEvent] = useState(null);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/events`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      setEvents(await res.json());
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate  = () => { setModalEvent(null);  setModalOpen(true); };
  const openEdit    = (ev) => { setModalEvent(ev);   setModalOpen(true); };
  const closeModal  = () => { setModalOpen(false); setModalEvent(null); };
  const openDelete  = (ev) => setDeleteTarget(ev);
  const closeDelete = () => setDeleteTarget(null);
  const openInsights = async (ev) => {
    try {
      // Show basic data first to open the modal immediately if possible
      // or we can set a loading state
      setInsightsEvent({ ...ev, loading: true });
      const res = await fetch(`${API_BASE}/events/${ev.id}/insights`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setInsightsEvent(data);
    } catch (err) {
      console.error(err);
      notify('Failed to load detailed statistics.', 'error');
      setInsightsEvent(ev);
    }
  };
  const closeInsights = () => setInsightsEvent(null);

  const handleSave = (saved, isEdit) => {
    setEvents((prev) => isEdit ? prev.map((e) => e.id === saved.id ? saved : e) : [saved, ...prev]);
    closeModal();
    notify(isEdit ? 'Event updated successfully.' : 'New event created.');
  };

  const handleDelete = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    closeDelete();
    notify('Event deleted.', 'error');
  };

  const statusCounts = {
    active:    events.filter((e) => e.status === 'active').length,
    upcoming:  events.filter((e) => e.status === 'upcoming').length,
    completed: events.filter((e) => e.status === 'completed').length,
  };

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] text-slate-900 dark:text-slate-300 p-8 selection:bg-cyan-500/30 selection:text-white transition-colors duration-300 min-h-full">

      {/* Toast */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold ${
          notification.type === 'error'
            ? 'bg-red-600 border-red-500 text-white'
            : 'bg-emerald-600 border-emerald-500 text-white'
        }`}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
        <div className="absolute -top-20 -left-20 h-40 w-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div>
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400 mb-1">
            <CalendarDays className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Event Management</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 italic">
            Manage <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent not-italic">Events</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-sm">
            Create and configure exhibitions. Each event has its own ID format prefixes for badges, forms, and online registrations.
          </p>
        </div>
        {/* New Event button — admin only */}
        {!isReadOnly && (
          <button
            onClick={openCreate}
            className="shrink-0 flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-blue-500 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Event</span>
          </button>
        )}
      </header>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Total',     value: events.length },
          { label: 'Active',    value: statusCounts.active },
          { label: 'Upcoming',  value: statusCounts.upcoming },
          { label: 'Completed', value: statusCounts.completed },
        ].map((s) => (
          <div key={s.label} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-3">
            <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{s.value}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
          <span className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest animate-pulse">Loading Events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
            <CalendarDays className="h-10 w-10 text-slate-300 dark:text-slate-700" />
          </div>
          <div className="text-center">
            <h3 className="font-black text-slate-900 dark:text-white text-lg mb-2">No Events Yet</h3>
            <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs">
              Create your first event to start managing visitors, badges, and registrations.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isReadOnly={isReadOnly}
              onEdit={openEdit}
              onDelete={openDelete}
              onInsights={openInsights}
              onNotify={notify}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <EventModal event={modalEvent} onClose={closeModal} onSave={handleSave} />
      )}
      {deleteTarget && (
        <DeleteModal event={deleteTarget} onClose={closeDelete} onDelete={handleDelete} />
      )}
      {insightsEvent && (
        <EventInsightsModal 
          event={insightsEvent} 
          onClose={closeInsights} 
          onRefresh={fetchEvents}
        />
      )}
    </div>
  );
};

export default EventManagement;

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Filter, Printer, CheckCircle2, Zap,
  Upload, Edit3, Trash2, X, Loader2, ChevronDown, Globe2, MapPin
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { printExhibitorBadge, bulkPrintExhibitorBadges } from '../utils/printExhibitorBadge';

const API = import.meta.env.VITE_API_URL || '/api';
const token = () => localStorage.getItem('token');
const hdr = () => ({ 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token()}` });

// ── Toast ──────────────────────────────────────────────────────────
const Toast = ({ toast }) => !toast ? null : (
  <div className={`fixed bottom-6 right-6 z-[999] flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border text-sm font-bold transition-all
    ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
    <span>{toast.msg}</span>
  </div>
);

// ── ExhibitorModal ─────────────────────────────────────────────────
const ExhibitorModal = ({ exhibitor, events, onClose, onSave }) => {
  const isEdit = Boolean(exhibitor?.id);
  const [form, setForm] = useState({
    event_id: '', type: 'local', nationality: '', company_name_ar: '', company_name_en: '',
    number_of_badges: 1,
    receiver_name: '', receiver_phone: '', extra_badges: 0,
    number_of_vip_cards: 0, vip_cards_received: false,
    employees: [],
    ...exhibitor
  });
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [empInput, setEmpInput] = useState('');

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const r = await fetch(`${API}/countries`, { headers: hdr() });
        if (r.ok) setCountries(await r.json());
      } catch (err) { console.error('Failed to fetch countries', err); }
      finally { setLoadingCountries(false); }
    };
    fetchCountries();
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addEmployee = () => {
    if (!empInput.trim()) return;
    setForm(p => ({ ...p, employees: [...(p.employees || []), { name: empInput.trim() }] }));
    setEmpInput('');
  };
  const removeEmployee = (i) => setForm(p => ({ ...p, employees: p.employees.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const url  = isEdit ? `${API}/exhibitors/${exhibitor.id}` : `${API}/exhibitors`;
      const meth = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, { method: meth, headers: hdr(), body: JSON.stringify(form) });
      if (!r.ok) throw new Error((await r.json()).message || 'Failed');
      onSave(await r.json(), isEdit);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100 dark:border-slate-800/50">
          <div>
            <div className="text-[10px] uppercase font-black tracking-[0.3em] text-purple-500 mb-1">{isEdit ? 'Edit Exhibitor' : 'New Exhibitor'}</div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{isEdit ? form.company_name_en : 'Add Exhibitor'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="h-5 w-5" /></button>
        </div>

        <form id="exhForm" onSubmit={submit} className="px-8 py-6 space-y-5 overflow-y-auto">
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Event"
              value={form.event_id}
              options={events.map(ev => ({ value: ev.id, label: ev.name }))}
              onChange={val => set('event_id', val)}
              required
              placeholder="Select event"
            />
            <CustomSelect
              label="Type"
              value={form.type}
              options={[
                { value: 'local', label: 'Local' },
                { value: 'international', label: 'International' }
              ]}
              onChange={val => set('type', val)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Company (Arabic)</label>
              <input dir="rtl" value={form.company_name_ar} onChange={e => set('company_name_ar', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Company (English) *</label>
              <input value={form.company_name_en} onChange={e => set('company_name_en', e.target.value)} required className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Hall Number</label>
              <input type="number" value={form.hall_number} onChange={e => set('hall_number', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Stand Number</label>
              <input value={form.stand_number} onChange={e => set('stand_number', e.target.value)} className="input" />
            </div>
          </div>

          {form.type === 'international' && (
            <CustomSelect
              label="Nationality"
              value={form.nationality}
              options={countries.map(c => ({ value: c.english_name, label: `${c.english_name} (${c.arabic_name})` }))}
              onChange={val => set('nationality', val)}
              placeholder="Select nationality"
              loading={loadingCountries}
            />
          )}

          <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">VIP Cards (Preprinted)</div>
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className={`w-10 h-5 rounded-full transition-all duration-300 relative ${form.vip_cards_received ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${form.vip_cards_received ? 'left-6' : 'left-1'}`} />
                </div>
                <input type="checkbox" checked={form.vip_cards_received} onChange={e => set('vip_cards_received', e.target.checked)} className="hidden" />
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">Received</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="label">Number of VIP Cards</label>
                <input type="number" min="0" value={form.number_of_vip_cards} onChange={e => set('number_of_vip_cards', +e.target.value)} className="input" placeholder="0" />
              </div>
              <div className="text-[9px] text-slate-500 italic pb-2">
                Static cards allocated to this exhibitor.
              </div>
            </div>
          </div>

          {form.type === 'local' ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Number of Badges</label>
                  <input type="number" min="1" value={form.number_of_badges} onChange={e => set('number_of_badges', +e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Extra Badges</label>
                  <input type="number" min="0" value={form.extra_badges} onChange={e => set('extra_badges', +e.target.value)} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Receiver Name</label>
                  <input value={form.receiver_name} onChange={e => set('receiver_name', e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Receiver Phone</label>
                  <input value={form.receiver_phone} onChange={e => set('receiver_phone', e.target.value)} className="input" />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="label">Employees</label>
              <div className="flex space-x-2 mb-3">
                <input value={empInput} onChange={e => setEmpInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmployee())}
                  placeholder="Employee name, press Enter" className="input flex-1" />
                <button type="button" onClick={addEmployee} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-black">Add</button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(form.employees || []).map((emp, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{emp.name}</span>
                    <button type="button" onClick={() => removeEmployee(i)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="px-8 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button form="exhForm" type="submit" disabled={saving} className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:from-purple-400 hover:to-indigo-500 transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            <span>{isEdit ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── BulkImportModal ────────────────────────────────────────────────
const BulkImportModal = ({ event_id, onClose, onImport }) => {
  const [data, setData] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    if (!data.trim()) return;
    setImporting(true); setError(null);
    try {
      let exhibitors;
      try { exhibitors = JSON.parse(data); } catch { throw new Error('Invalid JSON format'); }
      
      const r = await fetch(`${API}/exhibitors/bulk-import`, {
        method: 'POST',
        headers: hdr(),
        body: JSON.stringify({ event_id, exhibitors })
      });
      if (!r.ok) throw new Error((await r.json()).message || 'Import failed');
      const res = await r.json();
      onImport(res.exhibitors);
    } catch (err) { setError(err.message); }
    finally { setImporting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0c1325] border border-slate-200 dark:border-slate-700/50 rounded-[28px] shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Bulk Import</h2>
          <button onClick={onClose} className="p-2 text-slate-400"><X className="h-5 w-5" /></button>
        </div>
        <div className="text-[10px] text-slate-500 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Expected JSON Format Example:</p>
          <pre className="overflow-auto text-[9px] leading-relaxed text-indigo-600 dark:text-indigo-400 max-h-60 p-2 bg-indigo-500/5 rounded-lg">
{`[
  {
    "type": "local", // "local" or "international"
    "company_name_en": "Example Co",
    "company_name_ar": "شركة مثال",
    "hall_number": "1",
    "stand_number": "A10",
    "number_of_vip_cards": 2,
    "vip_cards_received": false,
    
    // For Local Exhibitors:
    "number_of_badges": 5,
    "extra_badges": 0,
    "receiver_name": "John Doe",
    "receiver_phone": "123456789",

    // For International Exhibitors:
    "nationality": "United Kingdom",
    "employees": [
      { "name": "Alice Smith" },
      { "name": "Bob Jones" }
    ]
  }
]`}
          </pre>
        </div>
        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold mb-4">{error}</div>}
        <textarea value={data} onChange={e => setData(e.target.value)}
          placeholder='[{"type":"local", "company_name_en":"...", ...}]'
          className="input h-64 font-mono text-[10px] mb-6 resize-none" />
        
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase">Cancel</button>
          <button onClick={handleImport} disabled={importing || !data} className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase shadow-lg disabled:opacity-50">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>Import</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────
export default function Exhibitors() {
  const [exhibitors, setExhibitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [printFilter, setPrintFilter] = useState('');
  const [toast, setToast] = useState(null);

  const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, evRes] = await Promise.all([
        fetch(`${API}/exhibitors?event_id=${selectedEvent}&type=${typeFilter}&search=${search}&is_printed=${printFilter}`, { headers: hdr() }),
        fetch(`${API}/events`, { headers: hdr() }),
      ]);
      setExhibitors(await eRes.json());
      setEvents(await evRes.json());
    } catch { setExhibitors([]); }
    setLoading(false);
  }, [selectedEvent, typeFilter, search, printFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = (saved, isEdit) => {
    setExhibitors(prev => isEdit ? prev.map(e => e.id === saved.id ? saved : e) : [saved, ...prev]);
    setModalOpen(false); setEditTarget(null);
    notify(isEdit ? 'Exhibitor updated.' : 'Exhibitor created.');
  };

  const handleImport = (newExh) => {
    setExhibitors(prev => [...newExh, ...prev]);
    setImportOpen(false);
    notify(`Imported ${newExh.length} exhibitors.`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exhibitor?')) return;
    await fetch(`${API}/exhibitors/${id}`, { method: 'DELETE', headers: hdr() });
    setExhibitors(prev => prev.filter(e => e.id !== id));
    notify('Deleted.');
  };

  const handleMarkReceived = async (exh) => {
    const r = await fetch(`${API}/exhibitors/${exh.id}/mark-received`, { method: 'POST', headers: hdr() });
    const updated = await r.json();
    setExhibitors(prev => prev.map(e => e.id === updated.id ? updated : e));
    notify('Marked as received.');
  };

  const handleToggleVIPReceived = async (exh) => {
    const r = await fetch(`${API}/exhibitors/${exh.id}/toggle-vip-received`, { method: 'POST', headers: hdr() });
    const updated = await r.json();
    setExhibitors(prev => prev.map(e => e.id === updated.id ? updated : e));
    notify(updated.vip_cards_received ? 'VIP Cards marked as received.' : 'VIP Cards marked as pending.');
  };

  const getEventLayout = () => {
    const ev = events.find(e => String(e.id) === String(selectedEvent));
    return ev?.badge_layout || null;
  };

  const handlePrintSelected = async () => {
    const toBePrinted = exhibitors.filter(e => selected.includes(e.id));
    bulkPrintExhibitorBadges(toBePrinted, getEventLayout());
    // Mark as printed
    await fetch(`${API}/exhibitors/mark-printed`, { method: 'POST', headers: hdr(), body: JSON.stringify({ ids: selected }) });
    setExhibitors(prev => prev.map(e => selected.includes(e.id) ? { ...e, is_printed: true } : e));
    notify(`Printing ${selected.length} exhibitor(s)…`);
    setSelected([]);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  
  const unprintedExhibitors = exhibitors.filter(e => !e.is_printed);
  const toggleAll = () => {
    if (selected.length === unprintedExhibitors.length && unprintedExhibitors.length > 0) {
      setSelected([]);
    } else {
      setSelected(unprintedExhibitors.map(e => e.id));
    }
  };

  return (
    <div className="p-8 min-h-full bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617]">
      <Toast toast={toast} />

      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-500 mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Exhibitors</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
            Exhibitor <span className="bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent not-italic">Badges</span>
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {selected.length > 0 && (
            <button onClick={handlePrintSelected} className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-colors">
              <Printer className="h-4 w-4" /><span>Print ({selected.length})</span>
            </button>
          )}
          <button onClick={() => setImportOpen(true)} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
            <Upload className="h-4 w-4" /><span>Import</span>
          </button>
          <button onClick={() => { setEditTarget(null); setModalOpen(true); }} className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg hover:from-purple-400 hover:to-indigo-500 transition-all">
            <Plus className="h-4 w-4" /><span>Add Exhibitor</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company, receiver…"
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-purple-500 transition-all" />
        </div>
        <CustomSelect
          value={selectedEvent}
          options={[{ value: '', label: 'All Events' }, ...events.map(ev => ({ value: ev.id, label: ev.name }))]}
          onChange={val => setSelectedEvent(val)}
        />
        <CustomSelect
          value={typeFilter}
          options={[
            { value: '', label: 'All Types' },
            { value: 'local', label: 'Local' },
            { value: 'international', label: 'International' }
          ]}
          onChange={val => setTypeFilter(val)}
        />
        <CustomSelect
          value={printFilter}
          options={[
            { value: '', label: 'All Print Status' },
            { value: '1', label: 'Printed' },
            { value: '0', label: 'Not Printed' }
          ]}
          onChange={val => setPrintFilter(val)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-4 py-4 text-left w-10">
                  <input type="checkbox" checked={selected.length === unprintedExhibitors.length && unprintedExhibitors.length > 0} onChange={toggleAll}
                    className="h-4 w-4 accent-purple-500 rounded cursor-pointer" />
                </th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">Company</th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">Type</th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">Hall / Stand</th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">Badges</th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">VIP Cards</th>
                <th className="px-4 py-4 text-left text-[10px] uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-4 py-4 text-right text-[10px] uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exhibitors.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-bold">No exhibitors found.</td></tr>
              )}
              {exhibitors.map(exh => (
                <tr key={exh.id} className={`exhibitor-row border-b border-slate-100 dark:border-slate-800/50 group relative ${selected.includes(exh.id) ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.includes(exh.id)} onChange={() => toggleSelect(exh.id)} className="h-4 w-4 accent-purple-500 rounded" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{exh.company_name_en}</div>
                    <div className="flex items-center gap-2">
                      {exh.company_name_ar && <span dir="rtl" className="text-[11px] text-slate-400 font-bold">{exh.company_name_ar}</span>}
                      {exh.nationality && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase font-black">{exh.nationality}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest
                      ${exh.type === 'local' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                      {exh.type === 'local' ? <MapPin className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}
                      <span>{exh.type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-xs font-bold">
                    {exh.hall_number ? `Hall ${exh.hall_number}` : '—'} {exh.stand_number ? `/ ${exh.stand_number}` : ''}
                  </td>
                  <td className="px-4 py-4">
                    {exh.type === 'local' ? (
                      <div className="text-xs">
                        <span className="font-black text-slate-900 dark:text-white">{exh.number_of_badges}</span>
                        {exh.extra_badges > 0 && <span className="text-slate-400"> +{exh.extra_badges} extra</span>}
                        {exh.receiver_name && <div className="text-[10px] text-slate-400">{exh.receiver_name}</div>}
                      </div>
                    ) : (
                      <span className="text-xs font-black text-slate-900 dark:text-white">{(exh.employees || []).length} badges</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {exh.number_of_vip_cards > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{exh.number_of_vip_cards} Cards</span>
                        <button 
                          onClick={() => handleToggleVIPReceived(exh)}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase w-fit transition-all hover:scale-105 active:scale-95
                          ${exh.vip_cards_received ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                          {exh.vip_cards_received ? 'Received' : 'Pending'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">None</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase
                        ${exh.is_printed ? 'bg-cyan-500/10 text-cyan-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {exh.is_printed ? '✓ Printed' : 'Not Printed'}
                      </span>
                      {exh.type === 'local' && (
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase
                            ${exh.badges_received ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {exh.badges_received ? '✓ Received' : 'Pending'}
                          </span>
                          {exh.badges_received_at && (
                            <span className="text-[8px] text-slate-400 mt-0.5 ml-1">
                              {new Date(exh.badges_received_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end space-x-1">
                      <button onClick={() => { printExhibitorBadge(exh, getEventLayout()); }} title="Print"
                        className="action-btn btn-purple p-2 rounded-xl text-slate-400">
                        <Printer className="h-4 w-4" />
                      </button>
                      {exh.type === 'local' && !exh.badges_received && (
                        <button onClick={() => handleMarkReceived(exh)} title="Mark badges received"
                          className="action-btn btn-emerald p-2 rounded-xl text-slate-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {exh.number_of_vip_cards > 0 && !exh.vip_cards_received && (
                        <button onClick={() => handleToggleVIPReceived(exh)} title="Mark VIP received"
                          className="action-btn btn-amber p-2 rounded-xl text-slate-400">
                          <Zap className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => { setEditTarget(exh); setModalOpen(true); }} title="Edit"
                        className="action-btn btn-blue p-2 rounded-xl text-slate-400">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(exh.id)} title="Delete"
                        className="action-btn btn-red p-2 rounded-xl text-slate-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ExhibitorModal
          exhibitor={editTarget}
          events={events}
          onClose={() => { setModalOpen(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}

      {importOpen && (
        <BulkImportModal
          event_id={selectedEvent}
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
        />
      )}

      <style>{`
        .label { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: rgb(100 116 139); margin-bottom: 6px; }
        .input { width: 100%; background: rgb(248 250 252); border: 1px solid rgb(226 232 240); border-radius: 12px; padding: 10px 14px; font-size: 13px; outline: none; color: rgb(15 23 42); transition: border-color 0.2s; }
        .dark .input { background: rgb(15 23 42 / 0.5); border-color: rgb(51 65 85 / 0.6); color: white; }
        .input:focus { border-color: rgb(139 92 246); }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Search, ArrowLeft, Loader2, CheckCircle2, AlertTriangle,
  User, Clock, Target, FileText, ChevronRight, Save, X, Edit3, UserCheck,
  CalendarDays
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const API = import.meta.env.VITE_API_URL || '/api';

const TrainingResults = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchRecord, setSearchRecord] = useState('');

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [auditForm, setAuditForm] = useState(null);
  const [savingAudit, setSavingAudit] = useState(false);
  const [toast, setToast] = useState(null);

  // For checkbox options from the event
  const [eventOptions, setEventOptions] = useState({ workfield: [], howexpo: [] });
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [events, setEvents] = useState([]);

  const [sortConfig, setSortConfig] = useState({ key: 'forms_inserted_count', direction: 'desc' });

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API}/events`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      // Only show events that are training or have records
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async (eventId = '') => {
    setLoadingUsers(true);
    try {
      const url = eventId ? `${API}/training-results?event_id=${eventId}` : `${API}/training-results`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      notify('Failed to fetch users data', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
  }, []);

  const handleEventFilter = (eventId) => {
    setSelectedEventId(eventId);
    fetchUsers(eventId);
  };

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const fetchUserRecords = async (userId) => {
    setLoadingRecords(true);
    try {
      const url = selectedEventId 
        ? `${API}/training-results/${userId}?event_id=${selectedEventId}` 
        : `${API}/training-results/${userId}`;
        
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      setRecords(data.records || []);
    } catch (e) {
      console.error(e);
      notify('Failed to fetch records', 'error');
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchUserRecords(user.id);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setRecords([]);
    setSearchRecord('');
    fetchUsers(selectedEventId); // Refresh stats with current filter
  };

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAuditModal = async (record) => {
    setSelectedRecord(record);
    setAuditForm({
      ...record,
      workfield: Array.isArray(record.workfield) ? record.workfield : [],
      howexpo: Array.isArray(record.howexpo) ? record.howexpo : []
    });

    // Fetch event options for checkboxes
    setLoadingOptions(true);
    try {
      const res = await fetch(`${API}/events/${record.event_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      setEventOptions({
        workfield: data.workfield_options || [],
        howexpo: data.howexpo_options || []
      });
    } catch (e) {
      console.error('Failed to fetch event options', e);
    } finally {
      setLoadingOptions(false);
    }
  };

  const closeAuditModal = () => {
    setSelectedRecord(null);
    setAuditForm(null);
    setEventOptions({ workfield: [], howexpo: [] });
  };

  const handleAuditChange = (e) => {
    const { name, value } = e.target;
    setAuditForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleArray = (field, val) => {
    setAuditForm(prev => {
      const current = prev[field] || [];
      const next = current.includes(val)
        ? current.filter(v => v !== val)
        : [...current, val];
      return { ...prev, [field]: next };
    });
  };

  const submitAudit = async (isChanged) => {
    setSavingAudit(true);
    try {
      const payload = { ...auditForm, audit_changed: isChanged };
      const res = await fetch(`${API}/training-records/${selectedRecord.id}/audit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Save failed');
      
      const data = await res.json();
      
      // Update local record state
      setRecords(prev => prev.map(r => r.id === selectedRecord.id ? data.record : r));
      notify('Audit saved successfully');
      closeAuditModal();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSavingAudit(false);
    }
  };

  // Filtered and Sorted lists
  const filteredUsers = users
    .filter(u => 
      (u.name && u.name.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchUser.toLowerCase())) ||
      (u.phone && u.phone.includes(searchUser))
    )
    .sort((a, b) => {
      let aVal, bVal;
      
      if (sortConfig.key === 'speed') {
        aVal = a.speed.average || 99999;
        bVal = b.speed.average || 99999;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-30 ml-1 rotate-90" />;
    return sortConfig.direction === 'asc' ? <ChevronRight className="h-3 w-3 ml-1 rotate-[-90deg] text-cyan-500" /> : <ChevronRight className="h-3 w-3 ml-1 rotate-90 text-cyan-500" />;
  };

  const filteredRecords = records.filter(r => 
    (r.visitorName && r.visitorName.toLowerCase().includes(searchRecord.toLowerCase())) ||
    (r.formID && r.formID.toLowerCase().includes(searchRecord.toLowerCase())) ||
    (r.phone1 && r.phone1.includes(searchRecord)) ||
    (r.email && r.email.toLowerCase().includes(searchRecord.toLowerCase()))
  );

  return (
    <div className="p-8 min-h-full bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white" dir="ltr">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold text-white border ${
          toast.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-emerald-600 border-emerald-500'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight mb-2">Training Results & Auditing</h1>
        <p className="text-slate-500 text-sm">Review operator performance and audit data entry accuracy during training mode.</p>
      </div>

      {/* Main Content Area */}
      {!selectedUser ? (
        /* USER LIST VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-cyan-500" />
              User List
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <CustomSelect
                  value={selectedEventId}
                  onChange={handleEventFilter}
                  options={[
                    { value: '', label: 'All Events' },
                    ...events.map(ev => ({ value: ev.id.toString(), label: ev.name }))
                  ]}
                  placeholder="Select Event..."
                  icon={CalendarDays}
                />
              </div>

              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  placeholder="Search by name, email or phone..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20 text-slate-500">No users found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('forms_inserted_count')}>
                      <div className="flex items-center justify-center">
                        Entries <SortIcon column="forms_inserted_count" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">Audits</th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('accuracy')}>
                      <div className="flex items-center justify-center">
                        Accuracy <SortIcon column="accuracy" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group" onClick={() => requestSort('speed')}>
                      <div className="flex items-center justify-center">
                        Speed (sec) <SortIcon column="speed" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-base">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {u.forms_inserted_count}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-emerald-500 font-bold">{u.audited_count}</span>
                        <span className="text-slate-400 text-xs mx-1">/</span>
                        <span className="text-red-400 text-xs">{u.changed_count} errors</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex px-3 py-1 rounded-lg font-black ${
                          u.accuracy >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                          u.accuracy >= 75 ? 'bg-amber-500/10 text-amber-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {u.accuracy}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-slate-500">Avg: <span className="font-bold text-slate-700 dark:text-slate-300">{u.speed.average || '-'}</span></span>
                          <span className="text-slate-400 text-[10px]">Fastest: {u.speed.fastest || '-'} | Slowest: {u.speed.slowest || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleSelectUser(u)}
                          className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-bold flex items-center justify-end w-full gap-1"
                        >
                          <span>View Records</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* RECORDS DETAIL VIEW */
        <div className="space-y-6">
          <button 
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </button>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-black">{selectedUser.name}</h2>
                <p className="text-sm text-slate-500">Review training records</p>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchRecord}
                  onChange={e => setSearchRecord(e.target.value)}
                  placeholder="Search by name, form ID..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loadingRecords ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-20 text-slate-500">No training records found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-4">Form ID</th>
                      <th className="px-6 py-4">Visitor</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4 text-center">Duration (s)</th>
                      <th className="px-6 py-4 text-center">Audit Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{r.formID || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{r.visitorName} {r.surName}</div>
                          <div className="text-xs text-slate-400">{r.organisation}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">{r.phone1 || '-'}</td>
                        <td className="px-6 py-4 text-center font-bold">{r.fill_duration || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          {!r.is_audited ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          ) : r.audit_changed ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold">
                              <AlertTriangle className="h-3 w-3" /> Fixed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                              <CheckCircle2 className="h-3 w-3" /> Accurate
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => openAuditModal(r)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                          >
                            Audit & Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT MODAL */}
      {selectedRecord && auditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950" dir="rtl">
              <div>
                <h3 className="text-xl font-black">تقييم السجل: {selectedRecord.formID}</h3>
                <p className="text-sm text-slate-500 mt-1">الرجاء مراجعة البيانات. هل يوجد أخطاء إملائية أو بيانات مفقودة؟</p>
              </div>
              <button onClick={closeAuditModal} className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1" dir="rtl">
              <div className="space-y-6">
                
                {/* Form ID Section */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">رقم النموذج</label>
                  <input 
                    name="formID" 
                    value={auditForm.formID || ''} 
                    onChange={handleAuditChange} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold focus:ring-2 focus:ring-cyan-500 outline-none text-right" 
                  />
                </div>

                {/* Name Row (3 columns) - RTL order: First, Middle, Surname */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">اسم الزائر</label>
                    <input name="visitorName" value={auditForm.visitorName || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">الاسم الأوسط</label>
                    <input name="midleName" value={auditForm.midleName || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">اللقب</label>
                    <input name="surName" value={auditForm.surName || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                </div>

                {/* Organization & Email Row (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">جهة العمل</label>
                    <input name="organisation" value={auditForm.organisation || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">البريد الإلكتروني</label>
                    <input name="email" type="email" value={auditForm.email || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                </div>

                {/* Phone Numbers Row (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">الهاتف 1</label>
                    <input name="phone1" value={auditForm.phone1 || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">الهاتف 2</label>
                    <input name="phone2" value={auditForm.phone2 || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" dir="ltr" />
                  </div>
                </div>

                {/* Gender / Nationality / Resident Row (3 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">الجنس</label>
                    <CustomSelect
                      value={auditForm.gender === 'Male' ? 'ذكر' : (auditForm.gender === 'Female' ? 'أنثى' : (auditForm.gender || 'ذكر'))}
                      onChange={(val) => setAuditForm(prev => ({ ...prev, gender: val }))}
                      options={[
                        { value: 'ذكر', label: 'ذكر' },
                        { value: 'أنثى', label: 'أنثى' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">الجنسية</label>
                    <input name="nationality" value={auditForm.nationality || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">بلد الإقامة</label>
                    <input name="resident" value={auditForm.resident || ''} onChange={handleAuditChange} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 outline-none text-right" />
                  </div>
                </div>

                {/* Checkboxes Row (2 columns) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Workfields */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">مجالات العمل</label>
                    {loadingOptions ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {eventOptions.workfield.map((opt, idx) => {
                          const val = typeof opt === 'object' ? opt.ar : opt;
                          const label = typeof opt === 'object' ? opt.ar : opt;
                          return (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={auditForm.workfield.includes(val)} 
                                onChange={() => toggleArray('workfield', val)}
                                className="h-4 w-4 accent-cyan-500 rounded" 
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* How Expo */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 text-right">كيف علمت بالمعرض؟</label>
                    {loadingOptions ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {eventOptions.howexpo.map((opt, idx) => {
                          const val = typeof opt === 'object' ? opt.ar : opt;
                          const label = typeof opt === 'object' ? opt.ar : opt;
                          return (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={auditForm.howexpo.includes(val)} 
                                onChange={() => toggleArray('howexpo', val)}
                                className="h-4 w-4 accent-cyan-500 rounded" 
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-4" dir="ltr">
              <button 
                onClick={() => submitAudit(false)}
                disabled={savingAudit}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingAudit ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Approve As-Is (No Changes)
              </button>
              
              <button 
                onClick={() => submitAudit(true)}
                disabled={savingAudit}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
              >
                {savingAudit ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit3 className="h-5 w-5" />}
                Save Corrections (Fixed)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingResults;

import React, { useState, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FileJson, Database, 
  CalendarDays, CheckCircle2, X, Loader2, CheckSquare, 
  Square, ChevronRight, FileText, Activity
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const API = import.meta.env.VITE_API_URL || '/api';

const VISITOR_COLUMNS = [
  { id: 'formID', label: 'Form ID' },
  { id: 'badgeID', label: 'Badge ID' },
  { id: 'visitorName', label: 'First Name' },
  { id: 'midleName', label: 'Middle Name' },
  { id: 'surName', label: 'Last Name' },
  { id: 'organisation', label: 'Organization' },
  { id: 'email', label: 'Email' },
  { id: 'phone1', label: 'Phone 1' },
  { id: 'has_whatsapp', label: 'Has WhatsApp' },
  { id: 'phone2', label: 'Phone 2' },
  { id: 'gender', label: 'Gender' },
  { id: 'nationality', label: 'Nationality' },
  { id: 'resident', label: 'Resident' },
  { id: 'print_count', label: 'Print Count' },
  { id: 'print_date', label: 'Print Date' },
  { id: 'onlineRegID', label: 'Online Reg ID' },
  { id: 'online_source', label: 'Online Source' },
  { id: 'visitor_source', label: 'Visitor Source' },
  { id: 'online_created_at', label: 'Online Created At' },
  { id: 'created_at', label: 'Created At' },
  { id: 'workfield', label: 'Work Field' },
  { id: 'howexpo', label: 'How Heard' },
];

const SCAN_COLUMNS = [
  { id: 'barcode', label: 'Barcode' },
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'gate_details', label: 'Gate' },
];

const EXPORT_TYPES = [
  { id: 'all', label: 'All Visitors', icon: FileText, desc: 'Every record in the event' },
  { id: 'online_all', label: 'Online (All)', icon: Database, desc: 'Every visitor registered online' },
  { id: 'online_attended', label: 'Online (Attended)', icon: CheckCircle2, desc: 'Registered online and printed badge' },
  { id: 'onsite', label: 'Onsite Visitors', icon: CalendarDays, desc: 'Registered at the venue' },
  { id: 'self_service', label: 'Self-Service', icon: Database, desc: 'Registered via kiosks' },
  { id: 'scans', label: 'Visit Scans', icon: Activity, desc: 'Gate entrance history' },
];

const DataExport = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [exportType, setExportType] = useState('all');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Default columns based on type
    if (exportType === 'scans') {
      setSelectedColumns(SCAN_COLUMNS.map(c => c.id));
    } else {
      setSelectedColumns([
        'formID', 'badgeID', 'visitorName', 'midleName', 'surName', 
        'email', 'phone1', 'phone2', 'organisation', 
        'nationality', 'resident', 'gender', 'howexpo', 'workfield'
      ]);
    }
  }, [exportType]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/events`, { headers: { Accept: 'application/json' } });
      setEvents(await r.json());
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const toggleColumn = (id) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const cols = exportType === 'scans' ? SCAN_COLUMNS : VISITOR_COLUMNS;
    setSelectedColumns(cols.map(c => c.id));
  };

  const selectNone = () => {
    setSelectedColumns([]);
  };

  const handleExport = async (format) => {
    if (!selectedEventId) return;
    if (selectedColumns.length === 0) {
      alert('Please select at least one column.');
      return;
    }

    setDownloading(true);
    try {
      const isScans = exportType === 'scans';
      const endpoint = isScans ? 'scans' : 'visitors';
      const url = `${API}/events/${selectedEventId}/export/${endpoint}`;
      
      // We use a POST-like approach for columns if many, or just query string
      // But browser downloads are easier with window.open or a form
      // Since it's a GET, we build the query string
      const params = new URLSearchParams();
      params.append('format', format);
      if (!isScans) params.append('type', exportType);
      selectedColumns.forEach(c => params.append('columns[]', c));

      // Trigger download
      const fullUrl = `${url}?${params.toString()}`;
      
      // Fetch and download
      const r = await fetch(fullUrl, {
          headers: { 
              'Accept': 'application/json',
              // Add auth header if needed, but the current backend is using sanctum session
          }
      });

      if (!r.ok) {
        let errorMsg = 'Export failed';
        try {
          const errorData = await r.json();
          errorMsg = errorData.message || errorMsg;
        } catch (e) {
          try {
            errorMsg = await r.text() || errorMsg;
          } catch (e2) {}
        }
        throw new Error(errorMsg);
      }

      const blob = await r.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${exportType}_export.${format === 'sql' ? 'sql' : format === 'json' ? 'json' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert(`Failed to download file: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const currentColumns = exportType === 'scans' ? SCAN_COLUMNS : VISITOR_COLUMNS;

  return (
    <div className="flex-1 bg-white dark:bg-gradient-to-br dark:from-[#020617] dark:via-[#0f172a] dark:to-[#020617] p-8 min-h-full">
      <header className="mb-10">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
          <Download className="h-4 w-4" />
          <span className="text-[10px] uppercase font-black tracking-[0.3em]">Data Management</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic mb-2">
          Data <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent not-italic">Export</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          Extract and download your event data in multiple formats for reporting and analysis.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Selection Area */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">1. Select Event</h3>
            <CustomSelect
              value={selectedEventId}
              onChange={setSelectedEventId}
              placeholder="Choose an event..."
              loading={loading}
              options={events.map(e => ({ label: e.name, value: e.id }))}
            />
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">2. Export Type</h3>
            <div className="space-y-2">
              {EXPORT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setExportType(type.id)}
                  className={`w-full flex items-center p-3 rounded-2xl border transition-all ${
                    exportType === type.id
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <type.icon className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="text-xs font-black uppercase tracking-wider">{type.label}</div>
                    <div className="text-[10px] opacity-70 leading-none mt-0.5">{type.desc}</div>
                  </div>
                  {exportType === type.id && <ChevronRight className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration Area */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">3. Select Columns</h3>
                <p className="text-xs text-slate-500 mt-1">Choose the fields you want to include in the file.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={selectAll}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Select All
                </button>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                <button 
                  onClick={selectNone}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Unselect All
                </button>
              </div>
            </div>

            <div className="p-8 flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentColumns.map(col => (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all text-left ${
                      selectedColumns.includes(col.id)
                        ? 'bg-slate-50 dark:bg-slate-800 border-blue-500/30 text-slate-900 dark:text-white'
                        : 'border-slate-100 dark:border-slate-800/50 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    {selectedColumns.includes(col.id) 
                      ? <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" />
                      : <Square className="h-4 w-4 shrink-0" />
                    }
                    <span className="text-xs font-bold truncate">{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    {selectedColumns.length} <span className="text-slate-400 text-xs font-medium uppercase ml-1">Columns Selected</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button
                    disabled={!selectedEventId || downloading}
                    onClick={() => handleExport('csv')}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-emerald-500/20"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                    <span>CSV</span>
                  </button>
                  <button
                    disabled={!selectedEventId || downloading}
                    onClick={() => handleExport('json')}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-blue-500/20"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                    <span>JSON</span>
                  </button>
                  <button
                    disabled={!selectedEventId || downloading}
                    onClick={() => handleExport('sql')}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 shadow-lg shadow-purple-500/20"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    <span>SQL</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;

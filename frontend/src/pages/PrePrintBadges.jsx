import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import { 
  Printer, 
  Settings2, 
  Download, 
  Loader2, 
  AlertTriangle, 
  FileDown,
  History,
  CheckCircle2,
  CalendarDays,
  LayoutTemplate
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const PrePrintBadges = () => {
  const { user, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    eventId: '',
    startCode: '1000',
    endCode: '1100',
    batchSize: '100',
    barcodeWidth: '1.8',
    barcodeHeight: '50',
    barcodeY: '6.5',
    barcodeX: '',
    pageWidth: '21',
    pageHeight: '27'
  });
  
  const [activeHistory, setActiveHistory] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authHeaders = { 
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        };

        const [evRes, histRes] = await Promise.all([
          fetch(`${API_BASE}/events`, { headers: authHeaders }),
          fetch(`${API_BASE}/pre-print-history?type=badge`, { headers: authHeaders })
        ]);

        if (evRes.ok) {
          const evData = await evRes.json();
          setEvents(evData);
          if (evData.length > 0) setForm(f => ({ ...f, eventId: evData[0].id }));
        }

        if (histRes.ok) {
          const histData = await histRes.json();
          setHistoryList(histData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleSaveAndCalculate = async (e) => {
    e.preventDefault();
    const start = parseInt(form.startCode, 10);
    const end = parseInt(form.endCode, 10);
    const size = parseInt(form.batchSize, 10);

    if (isNaN(start) || isNaN(end) || isNaN(size) || size <= 0 || start > end) {
      alert("Invalid range or batch size");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        event_id: form.eventId,
        type: 'badge',
        start_code: start,
        end_code: end,
        batch_size: size,
        barcode_width: form.barcodeWidth,
        barcode_height: form.barcodeHeight,
        barcode_x: form.barcodeX,
        barcode_y: form.barcodeY,
        page_width: form.pageWidth,
        page_height: form.pageHeight
      };

      const res = await fetch(`${API_BASE}/pre-print-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save history');
      
      const newHistory = await res.json();
      setHistoryList([newHistory, ...historyList]);
      setActiveHistory(newHistory);
    } catch (err) {
      console.error(err);
      alert("Error saving generation setup.");
    } finally {
      setSaving(false);
    }
  };

  const getChunksFromHistory = (hist) => {
    const chunks = [];
    for (let current = hist.start_code; current <= hist.end_code; current += hist.batch_size) {
      const batchEnd = Math.min(current + hist.batch_size - 1, hist.end_code);
      chunks.push({ start: current, end: batchEnd });
    }
    return chunks;
  };

  const generatePDF = async (chunkStart, chunkEnd, chunkIndex, histConfig) => {
    setProcessingId(chunkIndex);
    await new Promise(resolve => setTimeout(resolve, 50)); 
    
    try {
      const eventPrefix = histConfig.event?.badge_id_prefix || '';

      const pWidth = parseFloat(histConfig.page_width) || 21;
      const pHeight = parseFloat(histConfig.page_height) || 27;

      const doc = new jsPDF({
        orientation: pWidth > pHeight ? 'landscape' : 'portrait',
        unit: 'cm',
        format: [pWidth, pHeight]
      });

      const widthNum = parseFloat(histConfig.barcode_width) || 1.8;
      const heightNum = parseFloat(histConfig.barcode_height) || 50;

      const canvas = document.createElement('canvas');
      let isFirstPage = true;

      for (let i = chunkStart; i <= chunkEnd; i++) {
        const formattedCode = `${eventPrefix}${String(i).padStart(4, '0')}`;
        
        JsBarcode(canvas, formattedCode, {
          format: 'CODE128',
          displayValue: true,
          width: widthNum,
          height: heightNum,
          margin: 0,
          lineColor: '#000',
          background: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const wCm = canvas.width * 0.026458333;
        const hCm = canvas.height * 0.026458333;

        if (!isFirstPage) doc.addPage();
        
        // Calculate X and Y coordinates
        let x = parseFloat(histConfig.barcode_x);
        if (isNaN(x)) {
          x = (pWidth - wCm) / 2; // Auto Center
        }
        
        const y = parseFloat(histConfig.barcode_y) || 6.5;

        doc.addImage(imgData, 'PNG', x, y, wCm, hCm);
        isFirstPage = false;
      }

      doc.save(`PrePrinted_${eventPrefix || 'Event'}_${chunkStart}-${chunkEnd}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
     return <div className="p-8"><Loader2 className="animate-spin text-cyan-500" /></div>;
  }

  return (
    <div className="p-8 bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-300 min-h-full transition-colors duration-300 flex flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight flex items-center space-x-3">
          <Printer className="h-8 w-8 text-cyan-500" />
          <span>Pre-Print Badges</span>
        </h1>
        <p className="text-slate-500 mt-2">Design, save, and chunk physical barcode sequences.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: FORM */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">New Generation Setting</h3>
            <form onSubmit={handleSaveAndCalculate} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Select Target Event</label>
                <select 
                  value={form.eventId} 
                  onChange={e => setForm({...form, eventId: e.target.value})}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} (Prefix: {ev.badge_id_prefix})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Code</label>
                  <input type="number" required value={form.startCode} onChange={e => setForm({...form, startCode: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Code</label>
                  <input type="number" required value={form.endCode} onChange={e => setForm({...form, endCode: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Pages Per File Chunk</label>
                <input type="number" required value={form.batchSize} onChange={e => setForm({...form, batchSize: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
              </div>

              <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400">
                  <LayoutTemplate className="h-3 w-3" />
                  <span>Physical Properties</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Page Width (cm)</label>
                    <input type="number" step="0.1" value={form.pageWidth} onChange={e => setForm({...form, pageWidth: e.target.value})} placeholder="21" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Page Height (cm)</label>
                    <input type="number" step="0.1" value={form.pageHeight} onChange={e => setForm({...form, pageHeight: e.target.value})} placeholder="27" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">BC Width factor</label>
                    <input type="number" step="0.1" value={form.barcodeWidth} onChange={e => setForm({...form, barcodeWidth: e.target.value})} placeholder="1.8" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">BC Height (px)</label>
                    <input type="number" value={form.barcodeHeight} onChange={e => setForm({...form, barcodeHeight: e.target.value})} placeholder="50" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pos Y (cm)</label>
                    <input type="number" step="0.1" value={form.barcodeY} onChange={e => setForm({...form, barcodeY: e.target.value})} placeholder="6.5" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Pos X (cm)</label>
                    <input type="number" step="0.1" value={form.barcodeX} onChange={e => setForm({...form, barcodeX: e.target.value})} placeholder="Auto" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg flex justify-center items-center">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save & Prepare Chunks</span>}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORY & CURRENT CHUNKS */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-6">
          
          {/* Active Generation Chunks */}
          {activeHistory ? (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col max-h-[60vh]">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-1 flex items-center space-x-2">
                    <FileDown className="h-4 w-4 text-cyan-500" />
                    <span>Download Sequence</span>
                  </h3>
                  <div className="text-xs text-slate-500">{activeHistory.event?.name} | {activeHistory.start_code} to {activeHistory.end_code}</div>
                </div>
                <button onClick={() => setActiveHistory(null)} className="text-xs uppercase font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Close</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {getChunksFromHistory(activeHistory).map((chunk, idx) => {
                   const isProcessing = processingId === idx;
                   return (
                     <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                       <div>
                         <div className="text-xs font-black uppercase text-slate-400 mb-0.5">Part {idx + 1}</div>
                         <div className="font-bold text-sm tracking-widest">
                           {chunk.start} – {chunk.end}
                         </div>
                       </div>
                       <button
                          onClick={() => generatePDF(chunk.start, chunk.end, idx, activeHistory)}
                          disabled={processingId !== null}
                          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-50 font-bold text-xs"
                       >
                          {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                          <span>{isProcessing ? 'Working...' : 'Download PDF'}</span>
                       </button>
                     </div>
                   );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 shadow-sm flex flex-col h-[500px]">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <History className="h-4 w-4 text-purple-500" />
                <span>Generation History</span>
              </h3>
              
              {historyList.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <History className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-xs font-medium">No previous generation runs found.</p>
                 </div>
              ) : (
                 <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                   {historyList.map(hist => (
                     <div key={hist.id} onClick={() => setActiveHistory(hist)} className="flex items-center p-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl cursor-pointer hover:border-cyan-500/40 hover:shadow-lg transition-all group">
                       <div className="flex-1 min-w-0 mr-4">
                         <div className="flex items-center space-x-2 mb-1">
                           <span className="text-sm font-black text-slate-900 dark:text-white truncate">{hist.event?.name}</span>
                           <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{hist.event?.badge_id_prefix || '#'}</span>
                         </div>
                         <div className="text-xs text-slate-500 flex items-center space-x-4">
                            <span>Codes: <b className="text-slate-700 dark:text-slate-300">{hist.start_code} - {hist.end_code}</b></span>
                            <span>Chunk: <b className="text-slate-700 dark:text-slate-300">{hist.batch_size}</b></span>
                         </div>
                       </div>
                       <div className="shrink-0 text-right">
                         <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{new Date(hist.created_at).toLocaleDateString()}</div>
                         <div className="text-[10px] text-purple-500 font-bold">{hist.user?.name || 'Admin'}</div>
                       </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PrePrintBadges;

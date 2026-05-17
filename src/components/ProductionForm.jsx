import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Loader2, X, ChefHat, CalendarDays, AlertCircle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// 🌍 STATIC POOL CONFIGURATION (Dilempar ke luar untuk menghemat alokasi RAM)
// ============================================================================
const COLOR_PALETTE_POOL = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/50 dark:text-lime-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300',
];

// ============================================================================
// 🧠 MEMOIZED PRODUCTION ENTRY FORM COMPONENT
// ============================================================================
const ProductionForm = ({ 
  initialData, 
  onClose, 
  onSaveSuccess, 
  masterKueList = [], 
  archiveData = {}, 
  normalizeDate,
  selectedDate 
}) => {
  const [formData, setFormData] = useState([]);
  
  // STATUS LOADING MODERN: 'idle' | 'loading' | 'success'
  const [statusSave, setStatusSave] = useState('idle');
  const [isClosing, setIsClosing] = useState(false);
  
  const [tanggalProduksi, setTanggalProduksi] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // Pelacak Validasi Keberadaan Laporan Harian
  const isDateAlreadyExists = useMemo(() => {
    if (!tanggalProduksi || !normalizeDate) return false;
    const tglKey = normalizeDate(tanggalProduksi);
    
    const dataDiArsip = archiveData[tglKey] || [];
    const hasDataInArchive = dataDiArsip.length > 0;

    const isNewEntry = initialData.length === 0;
    const isDifferentBatch = !isNewEntry && dataDiArsip.length > 0 && dataDiArsip[0].idTransaksi !== initialData[0]?.idTransaksi;

    return (hasDataInArchive && isNewEntry) || isDifferentBatch;
  }, [tanggalProduksi, archiveData, normalizeDate, initialData]);

  // Synchronizer Data Existing dengan Akselerasi O(1) Index Lookup Map
  useEffect(() => {
    const tglKey = normalizeDate(tanggalProduksi);
    const dataExisting = archiveData[tglKey] || [];

    // 🔥 HIGH OPTIMASI: Bangun peta indeks objek untuk memutus loop bersarang .find()
    const existingLookupMap = Object.create(null);
    for (let i = 0; i < dataExisting.length; i++) {
      existingLookupMap[dataExisting[i].jenisKue] = dataExisting[i];
    }

    const activeList = masterKueList || [];
    const mergedData = activeList.map(namaKue => {
      const found = existingLookupMap[namaKue];
      const valStok = found ? Number(found.stokBaru) : 0;
      const valBorongan = found && found.stokBorongan ? Number(found.stokBorongan) : 0; 
      
      return { 
        jenisKue: namaKue, 
        stokBaru: valStok === 0 ? '' : valStok,
        stokBorongan: valBorongan === 0 ? '' : valBorongan
      };
    });

    setFormData(mergedData);
  }, [tanggalProduksi, archiveData, masterKueList, normalizeDate]);

  const handleSave = async () => {
    if (isDateAlreadyExists || statusSave !== 'idle') return;
    setStatusSave('loading');

    const uniqueId = initialData.length > 0 ? initialData[0].idTransaksi : `PRD-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    const dataToSave = formData.map(item => ({
      ...item,
      idTransaksi: uniqueId,
      tanggal: tanggalProduksi, 
      stokBaru: item.stokBaru === '' ? 0 : item.stokBaru,
      stokBorongan: item.stokBorongan === '' ? 0 : item.stokBorongan
    }));

    try {
      await onSaveSuccess(dataToSave); 
      setStatusSave('success'); 
      
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => { onClose(); }, 300);
      }, 1200);

    } catch (error) {
      setStatusSave('idle');
    }
  };

  // Handler Perubahan Nilai Input yang Ter-memoisasi Sempurna
  const handleChange = useCallback((index, fieldName, value) => {
    if (isDateAlreadyExists) return;
    setFormData(prev => {
      const updated = [...prev];
      updated[index] = { 
        ...updated[index], 
        [fieldName]: value === '' ? '' : Math.max(0, Number(value)) 
      };
      return updated;
    });
  }, [isDateAlreadyExists]);

  const totalEtalase = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < formData.length; i++) {
      sum += (Number(formData[i].stokBaru) || 0);
    }
    return sum;
  }, [formData]);

  const totalBorongan = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < formData.length; i++) {
      sum += (Number(formData[i].stokBorongan) || 0);
    }
    return sum;
  }, [formData]);

  const totalSemua = totalEtalase + totalBorongan;

  const initiateClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 300);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      
      {/* Blurry Backdrop Sheet */}
      <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={() => statusSave === 'idle' && initiateClose()}></div>
      
      {/* Main Sheet Form Modal */}
      <div className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl p-5 pb-28 md:pb-8 border-t border-slate-200 dark:border-slate-800 flex flex-col ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        
        {/* iOS Header Context */}
        <div className="flex justify-between items-center mb-4 mt-2 px-1 shrink-0">
          <div className="italic">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Production Unit</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Entry Produksi</h3>
          </div>
          <button onClick={initiateClose} disabled={statusSave !== 'idle'} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 active:scale-90 transition-all shadow-sm disabled:opacity-30">
            <X size={18} />
          </button>
        </div>

        {/* Date Input Node Control */}
        <div className="mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={14} className="text-blue-500" />
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Tanggal Laporan</label>
          </div>
          <input type="date" value={tanggalProduksi} onChange={(e) => setTanggalProduksi(e.target.value)} disabled={statusSave !== 'idle'} className={`w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all disabled:opacity-50 ${isDateAlreadyExists ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'}`} />
          {isDateAlreadyExists && (
            <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-fade-in">
              <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-rose-600 uppercase leading-relaxed">Waduh Bang! Tanggal ini sudah ada laporannya. Silakan pilih tanggal lain atau edit data yang sudah ada di tabel.</p>
            </div>
          )}
        </div>
        
        {/* 📦 GRID KOTAK INPUT UTAMA DENGAN DUKUNGAN ANTI-LAG 📦 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-h-[35vh] overflow-y-auto custom-scrollbar pr-1">
          {formData.map((item, idx) => {
            const labelColorClass = COLOR_PALETTE_POOL[idx % COLOR_PALETTE_POOL.length];
            return (
              <div key={item.jenisKue} className={`flex flex-col bg-white dark:bg-slate-950/40 rounded-[1.2rem] border shadow-sm overflow-hidden transition-all ${isDateAlreadyExists ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-100 dark:border-slate-800'}`}>
                
                <div className={`w-full px-3 py-2 border-b border-white/10 ${labelColorClass}`}>
                  <label className="text-[13px] font-black uppercase block truncate">{item.jenisKue}</label>
                </div>
                
                <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
                  {/* KOLOM INPUT 1: ETALASE */}
                  <div className="flex-1 flex flex-col p-2 focus-within:bg-blue-50/30 dark:focus-within:bg-blue-900/10 transition-colors">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Etalase</span>
                    <input 
                      type="number" 
                      inputMode="numeric" 
                      value={item.stokBaru} 
                      onChange={(e) => handleChange(idx, 'stokBaru', e.target.value)} 
                      disabled={isDateAlreadyExists || statusSave !== 'idle'} 
                      className="w-full bg-transparent border-none p-0 font-black text-blue-600 dark:text-blue-400 outline-none text-xl text-center disabled:opacity-50" 
                      placeholder="0" 
                    />
                  </div>

                  {/* KOLOM INPUT 2: ORDERAN (BORONGAN) */}
                  <div className="flex-1 flex flex-col p-2 focus-within:bg-purple-50/30 dark:focus-within:bg-purple-900/10 transition-colors">
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1 text-center">Orderan</span>
                    <input 
                      type="number" 
                      inputMode="numeric" 
                      value={item.stokBorongan} 
                      onChange={(e) => handleChange(idx, 'stokBorongan', e.target.value)} 
                      disabled={isDateAlreadyExists || statusSave !== 'idle'} 
                      className="w-full bg-transparent border-none p-0 font-black text-purple-600 dark:text-purple-400 outline-none text-xl text-center disabled:opacity-50" 
                      placeholder="0" 
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* BOTTOM REKAP & ACTION BUTTON CORES */}
        <div className="space-y-3 shrink-0">
          <div className="flex justify-between items-center px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] border border-blue-100/50">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <ChefHat size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Produksi</span>
            </div>
            <div className="flex items-end gap-1.5 text-right">
              <div className="flex flex-col items-end mr-2 pr-2 border-r border-blue-200 dark:border-blue-800">
                <span className="text-[9px] font-black text-slate-500 uppercase">Etalase: {totalEtalase}</span>
                <span className="text-[9px] font-black text-purple-500 uppercase">Orderan: {totalBorongan}</span>
              </div>
              <span className="text-xl font-black text-blue-600 tracking-tighter leading-none">{totalSemua}</span>
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={statusSave !== 'idle' || formData.length === 0 || isDateAlreadyExists} 
            className={`w-full py-4.5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 
              ${isDateAlreadyExists ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 
                statusSave === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 
                'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
              }
            `}
          >
            {statusSave === 'loading' ? <><Loader2 className="animate-spin" size={20} /> Mengamankan...</> : 
             statusSave === 'success' ? <><CheckCircle2 size={20} className="animate-in zoom-in" /> Berhasil Masuk!</> : 
             <><Save size={20} /> {isDateAlreadyExists ? 'Tanggal Sudah Ada' : 'Simpan Production'}</>}
          </button>
        </div>

      </div>
    </div>
  );
};

// 🔥 SINKRONISASI AKHIR LOCK RAM PERFORMA MENGGUNAKAN REACT.MEMO MURNI 🔥
export default React.memo(ProductionForm);
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, X, ChefHat, CalendarDays, AlertCircle } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [tanggalProduksi, setTanggalProduksi] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // 1. LOGIKA VALIDASI TANGGAL DUPLIKAT
  const isDateAlreadyExists = useMemo(() => {
    if (!tanggalProduksi || !normalizeDate) return false;
    const tglKey = normalizeDate(tanggalProduksi);
    
    // Cek apakah di arsip sudah ada data untuk tanggal ini
    const dataDiArsip = archiveData[tglKey] || [];
    const hasDataInArchive = dataDiArsip.length > 0;

    // Jika ada data, kita cek apakah ID Transaksinya sama dengan yang sedang dibuka?
    // Kalau ID-nya beda, berarti itu milik batch lain (Duplikat)
    const isNewEntry = initialData.length === 0;
    const isDifferentBatch = !isNewEntry && dataDiArsip.length > 0 && dataDiArsip[0].idTransaksi !== initialData[0]?.idTransaksi;

    return (hasDataInArchive && isNewEntry) || isDifferentBatch;
  }, [tanggalProduksi, archiveData, normalizeDate, initialData]);

  // 2. 🟢 SOLUSI UTAMA: Sinkronisasi Data saat Tanggal Berubah 🟢
  useEffect(() => {
    const tglKey = normalizeDate(tanggalProduksi);
    // Cari apakah di tanggal yang baru dipilih ini sudah ada datanya di arsip?
    const dataExisting = archiveData[tglKey] || [];

    const activeList = masterKueList || [];
    const mergedData = activeList.map(namaKue => {
      // Cek di data existing untuk tanggal tersebut
      const found = dataExisting.find(d => d.jenisKue === namaKue);
      const val = found ? Number(found.stokBaru) : 0;
      
      return { 
        jenisKue: namaKue, 
        stokBaru: val === 0 ? '' : val 
      };
    });

    setFormData(mergedData);
  }, [tanggalProduksi, archiveData, masterKueList, normalizeDate]);

  // --- Logika Lainnya Tetap Sama ---

  const handleSave = () => {
    if (isDateAlreadyExists) return;

    setIsSubmitting(true);
    // Tetap buat Unique ID baru jika ini adalah input baru
    const uniqueId = initialData.length > 0 ? initialData[0].idTransaksi : `PRD-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    const dataToSave = formData.map(item => ({
      ...item,
      idTransaksi: uniqueId,
      tanggal: tanggalProduksi, 
      stokBaru: item.stokBaru === '' ? 0 : item.stokBaru
    }));

    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onSaveSuccess(dataToSave);
        setIsSubmitting(false);
      }, 300);
    }, 1000);
  };

  const handleChange = (index, value) => {
    if (isDateAlreadyExists) return;
    const updated = [...formData];
    updated[index].stokBaru = value === '' ? '' : Math.max(0, Number(value));
    setFormData(updated);
  };

  const totalHarian = useMemo(() => {
    return formData.reduce((acc, curr) => acc + (Number(curr.stokBaru) || 0), 0);
  }, [formData]);

  const initiateClose = () => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 300);
  };

  const colorPalette = [
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

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={initiateClose}></div>
      <div className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl p-5 pb-28 md:pb-8 border-t border-slate-200 dark:border-slate-800 flex flex-col ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        <div className="flex justify-between items-center mb-4 mt-2 px-1 shrink-0">
          <div className="italic">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Production Unit</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Entry Produksi</h3>
          </div>
          <button onClick={initiateClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 active:scale-90 transition-all shadow-sm">
            <X size={18} />
          </button>
        </div>
        <div className="mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={14} className="text-blue-500" />
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Tanggal Laporan</label>
          </div>
          <input type="date" value={tanggalProduksi} onChange={(e) => setTanggalProduksi(e.target.value)} className={`w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${isDateAlreadyExists ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/10' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'}`} />
          {isDateAlreadyExists && (
            <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 animate-fade-in">
              <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-[10px] font-bold text-rose-600 uppercase leading-relaxed">Waduh Bang! Tanggal ini sudah ada laporannya. Silakan pilih tanggal lain atau edit data yang sudah ada di tabel.</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-5 max-h-[35vh] overflow-y-auto custom-scrollbar pr-1">
          {formData.map((item, idx) => {
            const labelColorClass = colorPalette[idx % colorPalette.length];
            return (
              <div key={item.jenisKue} className={`flex flex-col bg-white dark:bg-slate-950/40 rounded-[1.2rem] border shadow-sm overflow-hidden transition-all ${isDateAlreadyExists ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/30'}`}>
                <div className={`w-full px-3 py-2 border-b border-white/10 ${labelColorClass}`}><label className="text-[13px] font-black uppercase block truncate">{item.jenisKue}</label></div>
                <div className="flex items-center p-3 py-2.5"><input type="number" inputMode="numeric" value={item.stokBaru} onChange={(e) => handleChange(idx, e.target.value)} disabled={isDateAlreadyExists} className="w-full bg-transparent border-none p-0 font-black text-blue-600 dark:text-blue-400 outline-none text-2xl" placeholder="0" /></div>
              </div>
            );
          })}
        </div>
        <div className="space-y-3 shrink-0">
          <div className="flex justify-between items-center px-5 py-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] border border-blue-100/50">
            <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400"><ChefHat size={18} /><span className="text-[11px] font-black uppercase tracking-widest">Total Produksi</span></div>
            <span className="text-2xl font-black text-blue-600 tracking-tighter">{totalHarian} <small className="text-[12px] opacity-50">Pcs</small></span>
          </div>
          <button onClick={handleSave} disabled={isSubmitting || formData.length === 0 || isDateAlreadyExists} className={`w-full py-4.5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${isDateAlreadyExists ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}`}>{isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}{isDateAlreadyExists ? 'Tanggal Sudah Ada' : isSubmitting ? 'Mengamankan...' : 'Simpan Produksi'}</button>
        </div>
      </div>
    </div>
  );
};

export default ProductionForm;
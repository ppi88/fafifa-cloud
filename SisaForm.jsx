import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Loader2, X, Archive, CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// 🧠 MEMOIZED END-OF-DAY INVENTORY FORM COMPONENT
// ============================================================================
const SisaForm = ({ 
  initialData = [], 
  onClose, 
  onSaveSuccess, 
  masterKueList = [], 
  selectedDate 
}) => {
  const [formData, setFormData] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Tanggal otomatis mengikuti yang sedang dibuka di halaman
  const [tanggalSisa, setTanggalSisa] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // Siapkan data form berdasarkan master kue dengan akselerasi O(1) Lookup
  useEffect(() => {
    const activeList = masterKueList || [];
    
    // 🔥 OPTIMASI: Bangun peta indeks objek untuk memutus loop bersarang .find()
    const existingLookupMap = Object.create(null);
    for (let i = 0; i < initialData.length; i++) {
      existingLookupMap[initialData[i].jenisKue] = initialData[i];
    }

    const mergedData = activeList.map(namaKue => {
      const existing = existingLookupMap[namaKue];
      return { 
        jenisKue: namaKue, 
        sisa: existing ? Number(existing.sisa) : '',
        rusak: existing ? Number(existing.rusak) : ''
      };
    });
    setFormData(mergedData);
  }, [initialData, masterKueList, selectedDate]);

  // Validasi: Cegah simpan kalau kosong semua
  const isFormEmpty = useMemo(() => {
    return formData.every(item => 
      (!item.sisa || Number(item.sisa) === 0) && 
      (!item.rusak || Number(item.rusak) === 0)
    );
  }, [formData]);

  // --- 🔥 MEMOIZED HANDLERS PIPELINE 🔥 ---
  const initiateClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 300);
  }, [onClose]);

  const handleChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updated = [...prev];
      // Pastikan angka tidak negatif
      updated[index] = {
        ...updated[index],
        [field]: value === '' ? '' : Math.max(0, Number(value))
      };
      return updated;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (isFormEmpty) return;
    setIsSubmitting(true);
    
    // Generate ID unik untuk transaksi sisa
    const uniqueId = `SISA-${Date.now()}-${Math.floor(Math.random() * 100)}`;

    const dataToSave = formData.map(item => ({
      ...item,
      idTransaksi: uniqueId,
      tanggal: tanggalSisa, 
      sisa: item.sisa === '' ? 0 : item.sisa,
      rusak: item.rusak === '' ? 0 : item.rusak
    }));

    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onSaveSuccess(dataToSave);
        setIsSubmitting(false);
      }, 300);
    }, 1000); // Simulasi loading agar terasa natural
  }, [isFormEmpty, formData, tanggalSisa, onSaveSuccess]);

  const { totalSisa, totalRusak } = useMemo(() => {
    let tSisa = 0;
    let tRusak = 0;
    for (let i = 0; i < formData.length; i++) {
      tSisa += (Number(formData[i].sisa) || 0);
      tRusak += (Number(formData[i].rusak) || 0);
    }
    return { totalSisa: tSisa, totalRusak: tRusak };
  }, [formData]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div 
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} 
        onClick={initiateClose}
      ></div>

      <div className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl p-5 pb-28 md:pb-8 border-t border-slate-200 dark:border-slate-800 flex flex-col transition-all ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
        
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>

        <div className="flex justify-between items-center mb-4 mt-2 px-1 shrink-0">
          <div className="italic">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Inventory Unit</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Entry Sisa Kue</h3>
          </div>
          <button onClick={initiateClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-90 transition-all shadow-sm">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 px-1 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={14} className="text-amber-500" />
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Tanggal Tutup Buku</label>
          </div>
          <input 
            type="date"
            value={tanggalSisa}
            readOnly // Sengaja dikunci agar sinkron dengan UI kalender
            className="w-full border rounded-2xl px-4 py-3 text-sm font-bold outline-none bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-80 cursor-not-allowed"
          />
        </div>

        {/* HEADER KETERANGAN KOLOM */}
        <div className="flex justify-between px-3 mb-2 shrink-0">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/2">Nama Kue</span>
          <div className="flex w-1/2 gap-2 text-center">
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest w-1/2">Sisa</span>
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest w-1/2">Rusak</span>
          </div>
        </div>

        {/* GRID INPUT KUE (Diperluas area scroll-nya) */}
        <div className="flex flex-col gap-2.5 mb-5 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1 pb-2">
          {formData.map((item, idx) => {
            // 👇 Logika UI: Cek apakah baris ini sudah diisi
            const hasInput = (item.sisa !== '' && item.sisa > 0) || (item.rusak !== '' && item.rusak > 0);
            
            return (
              <div 
                key={item.jenisKue} 
                className={`flex items-center rounded-2xl border shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/30 transition-all duration-300 ${
                  hasInput 
                  ? 'bg-amber-50/40 dark:bg-amber-900/20 border-amber-300/50 dark:border-amber-700/50' 
                  : 'bg-white dark:bg-slate-950/40 border-slate-100 dark:border-slate-800'
                }`}
              >
                {/* Nama Kue */}
                <div className={`w-1/2 px-4 py-3 border-r transition-colors ${hasInput ? 'border-amber-200/50 dark:border-amber-800/50' : 'border-slate-100 dark:border-slate-800'}`}>
                  <label className="text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase truncate flex items-center gap-1.5">
                    {item.jenisKue}
                    {hasInput && <CheckCircle2 size={12} className="text-amber-500 shrink-0" />}
                  </label>
                </div>

                {/* Input Sisa & Rusak */}
                <div className="w-1/2 flex p-1.5 gap-1.5">
                  <input 
                    type="number" 
                    inputMode="numeric" 
                    value={item.sisa} 
                    onChange={(e) => handleChange(idx, 'sisa', e.target.value)} 
                    className="w-1/2 bg-amber-50 dark:bg-amber-900/30 rounded-xl border-none p-2 font-black text-amber-600 dark:text-amber-400 outline-none text-center text-lg placeholder-amber-200 dark:placeholder-amber-900 focus:bg-amber-100 dark:focus:bg-amber-900/50 transition-colors" 
                    placeholder="0" 
                  />
                  <input 
                    type="number" 
                    inputMode="numeric" 
                    value={item.rusak} 
                    onChange={(e) => handleChange(idx, 'rusak', e.target.value)} 
                    className="w-1/2 bg-red-50 dark:bg-red-900/20 rounded-xl border-none p-2 font-black text-red-500 dark:text-red-400 outline-none text-center text-lg placeholder-red-200 dark:placeholder-red-900/50 focus:bg-red-100 dark:focus:bg-red-900/40 transition-colors" 
                    placeholder="0" 
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3 shrink-0 mt-auto">
          <div className="flex justify-between items-center px-5 py-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-[1.5rem] border border-amber-100/50 dark:border-amber-900/30">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <Archive size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Total Sisa</span>
            </div>
            <div className="flex items-center gap-3 text-right">
              {totalRusak > 0 && (
                <div className="flex items-center gap-1 text-red-500 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-lg animate-fade-in">
                  <AlertTriangle size={10} />
                  <span className="text-[10px] font-bold">{totalRusak} Rsk</span>
                </div>
              )}
              <span className="text-2xl font-black text-amber-600 tracking-tighter">
                {totalSisa} <small className="text-[12px] opacity-50 ml-0.5">Pcs</small>
              </span>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSubmitting || isFormEmpty}
            className={`w-full py-4.5 rounded-full font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
              isFormEmpty
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none dark:bg-slate-800 dark:text-slate-500' 
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isFormEmpty ? 'Isi Angka Sisa/Rusak' : isSubmitting ? 'Merekap Data...' : 'Simpan & Tutup Buku'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔥 SINKRONISASI AKHIR PERFORMA TINGGI: Kunci Siklus Menggunakan React.memo 🔥
export default React.memo(SisaForm);
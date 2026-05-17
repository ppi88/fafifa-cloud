import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader2, X, Database, Tag, Scale, Hash } from 'lucide-react';

// ============================================================================
// 🌍 STATIC UTILS POOL (Dilempar ke luar untuk menghemat alokasi referensi RAM)
// ============================================================================
const formatTitleCase = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// ============================================================================
// 🧠 MEMOIZED ADD INVENTORY INGREDIENT FORM COMPONENT
// ============================================================================
const MasterAddBahanForm = ({ onClose, onSaveSuccess }) => {
  const [namaBahan, setNamaBahan] = useState("");
  const [harga, setHarga] = useState("");
  const [kuantitas, setKuantitas] = useState(""); 
  const [satuan, setSatuan] = useState("Kg");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAnimateIn, setIsAnimateIn] = useState(false);
  const [isAnimateOut, setIsAnimateOut] = useState(false);
  
  // Ref untuk menampung timeout agar bisa di-clear (mencegah memory leak)
  const timeoutRefs = useRef([]);

  useEffect(() => {
    let raf;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setIsAnimateIn(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      // Bersihkan semua timeout saat komponen ditutup
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const initiateClose = useCallback(() => {
    setIsAnimateOut(true);
    const t = setTimeout(() => { onClose(); }, 450);
    timeoutRefs.current.push(t);
  }, [onClose]);

  const handleSave = () => {
    if (!namaBahan.trim() || !harga || !kuantitas || isSubmitting) return;
    setIsSubmitting(true);
    
    const dataToSave = {
      namaBahan: formatTitleCase(namaBahan.trim()),
      harga: Number(harga),
      kuantitas: Number(kuantitas),
      satuan: satuan
    };

    const t1 = setTimeout(() => {
      setIsAnimateOut(true);
      const t2 = setTimeout(() => {
        onSaveSuccess(dataToSave);
        setIsSubmitting(false);
      }, 450);
      timeoutRefs.current.push(t2);
    }, 600);
    timeoutRefs.current.push(t1);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center overflow-hidden md:p-4">
      
      {/* Backdrop Blur Overlay */}
      <div 
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] transition-opacity duration-500 ease-out
          ${isAnimateIn && !isAnimateOut ? 'opacity-100' : 'opacity-0'}
        `} 
        onClick={initiateClose}
      ></div>

      {/* Main Form Container Sheet */}
      <div 
        className={`relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl p-5 md:p-8 pb-32 md:pb-8 border-t md:border border-slate-200/50 dark:border-slate-800 flex flex-col 
          transition-all duration-[500ms] will-change-transform
          ${isAnimateIn && !isAnimateOut ? 'translate-y-0 md:scale-100 md:opacity-100' : 'translate-y-full md:translate-y-0 md:scale-95 md:opacity-0'}
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        
        {/* Indikator Swipe HP (Hanya Muncul di Mobile) */}
        <div className="md:hidden absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>

        {/* Form Header */}
        <div className="flex justify-between items-center mb-6 mt-2 md:mt-0 px-1 shrink-0">
          <div className="italic">
            <p className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Inventory Unit</p>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Input Bahan</h3>
          </div>
          <button onClick={initiateClose} className="p-3 md:p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-500 hover:text-rose-500 active:scale-90 transition-all">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        {/* Input Fields Stack */}
        <div className="space-y-4 mb-8">
          
          {/* 1. Nama Bahan */}
          <div className="group flex flex-col bg-slate-50 dark:bg-slate-950/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="px-4 py-2.5 bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-b border-white/20 dark:border-slate-800 rounded-t-[1.5rem]">
              <label className="text-[11px] font-black uppercase flex items-center gap-2">
                <Database size={14} /> Nama Bahan
              </label>
            </div>
            <input 
              autoFocus
              value={namaBahan} 
              onChange={(e) => setNamaBahan(e.target.value)} 
              className="w-full bg-transparent p-5 pt-4 font-black text-slate-800 dark:text-white outline-none text-xl md:text-2xl placeholder:text-slate-300 dark:placeholder:text-slate-700" 
              placeholder="Contoh: Pasta pandan" 
            />
          </div>

          {/* 2. Harga Beli */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <div className="px-4 py-2.5 bg-slate-100/80 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-white/20 dark:border-slate-800 rounded-t-[1.5rem]">
              <label className="text-[10px] font-black uppercase flex items-center gap-2">
                <Tag size={13} /> Harga Total Beli
              </label>
            </div>
            <div className="flex items-center px-4 py-4">
              <span className="text-sm md:text-base font-black text-slate-300 dark:text-slate-600 mr-2">Rp</span>
              <input 
                type="number" 
                value={harga} 
                onChange={(e) => setHarga(e.target.value)} 
                className="w-full bg-transparent font-black text-emerald-600 dark:text-emerald-400 outline-none text-2xl md:text-3xl placeholder:text-slate-200 dark:placeholder:text-slate-700/50" 
                placeholder="0" 
              />
            </div>
          </div>

          {/* Grid Layout untuk Volume & Satuan */}
          <div className="grid grid-cols-2 gap-4">
            {/* 3. Kuantitas / Isi */}
            <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <div className="px-4 py-2.5 bg-slate-100/80 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-white/20 dark:border-slate-800 rounded-t-[1.5rem]">
                <label className="text-[10px] font-black uppercase flex items-center gap-2">
                  <Hash size={13} /> Isi / Volume
                </label>
              </div>
              <input 
                type="number" 
                value={kuantitas} 
                onChange={(e) => setKuantitas(e.target.value)} 
                className="w-full bg-transparent p-4 font-black text-slate-800 dark:text-white outline-none text-xl md:text-2xl placeholder:text-slate-200 dark:placeholder:text-slate-700/50" 
                placeholder="0" 
              />
            </div>

            {/* 4. Satuan */}
            <div className="flex flex-col bg-slate-50 dark:bg-slate-950/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <div className="px-4 py-2.5 bg-slate-100/80 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-white/20 dark:border-slate-800 rounded-t-[1.5rem]">
                <label className="text-[10px] font-black uppercase flex items-center gap-2">
                  <Scale size={13} /> Satuan
                </label>
              </div>
              <select 
                value={satuan} 
                onChange={(e) => setSatuan(e.target.value)} 
                className="w-full bg-transparent p-4 font-black text-slate-800 dark:text-white outline-none text-lg md:text-xl appearance-none uppercase cursor-pointer"
              >
                {/* 🔥 SUNTIKAN SINKRONISASI DARK MODE: Memastikan tulisan menu drop-down terbaca di Android WebView apa pun */}
                <option value="Kg" className="dark:bg-slate-900 text-slate-800 dark:text-white">Kg</option>
                <option value="Gr" className="dark:bg-slate-900 text-slate-800 dark:text-white">Gr</option>
                <option value="Ltr" className="dark:bg-slate-900 text-slate-800 dark:text-white">Ltr</option>
                <option value="ml" className="dark:bg-slate-900 text-slate-800 dark:text-white">ml</option>
                <option value="cc" className="dark:bg-slate-900 text-slate-800 dark:text-white">cc</option>
                <option value="Keping" className="dark:bg-slate-900 text-slate-800 dark:text-white">Keping</option>
                <option value="pcs" className="dark:bg-slate-900 text-slate-800 dark:text-white">pcs</option>
                <option value="btr" className="dark:bg-slate-900 text-slate-800 dark:text-white">btr</option>
              </select>
            </div>
          </div>

          {/* 5. Live Preview Harga Satuan */}
          {harga && kuantitas && kuantitas > 0 ? (
            <div className="px-5 py-3 md:py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 animate-fade-in flex justify-between items-center">
              <div>
                <p className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 md:mb-1">Estimasi Harga Satuan</p>
                <p className="text-base md:text-xl font-black text-emerald-700 dark:text-emerald-400 italic">
                  Rp {(harga / kuantitas).toLocaleString('id-ID')} <span className="text-xs md:text-sm font-bold opacity-60 uppercase">/ {satuan}</span>
                </p>
              </div>
            </div>
          ) : null}

        </div>

        {/* Action Button */}
        <div className="shrink-0 mt-auto md:mt-4">
          <button 
            onClick={handleSave} 
            disabled={isSubmitting || !namaBahan || !harga || !kuantitas} 
            className={`w-full py-5 rounded-[2rem] font-black uppercase text-[13px] md:text-[14px] tracking-[0.25em] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 
              ${(!namaBahan || !harga || !kuantitas) 
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 shadow-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 dark:shadow-emerald-900/40'
              }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Bahan'}
          </button>
        </div>

      </div>
    </div>
  );
};

// 🔥 SINKRONISASI AKHIR PERFORMA TINGGI: Kunci Siklus Menggunakan React.memo 🔥
export default React.memo(MasterAddBahanForm);
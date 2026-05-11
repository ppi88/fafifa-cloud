import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader2, ChevronLeft, X } from 'lucide-react';

const MasterAddKueForm = ({ onClose, onSaveSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKue, setNewKue] = useState({ jenisKue: '', harga: '' });
  
  // State untuk animasi masuk/keluar
  const [isMounted, setIsMounted] = useState(false);
  
  // ⚡ TURBO OPTIMASI: Ref untuk menampung timeout agar tidak bocor memori (memory leak)
  const timeoutRefs = useRef([]);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setIsMounted(true);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      // Bersihkan semua antrean timer saat komponen ditutup paksa
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const handleSave = async () => {
    if (!newKue.jenisKue || !newKue.harga) {
      alert("Isi nama kue dan harganya dulu, Bang!");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSaveSuccess(newKue); 
      // Komponen ini akan otomatis di-unmount oleh parent (MasterPage) saat success
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Gagal menghubungi server. Silakan coba lagi.");
      setIsSubmitting(false); 
    }
  };

  // Fungsi untuk menjalankan animasi KELUAR sebelum halaman benar-benar ditutup
  const closeWithAnimation = useCallback(() => {
    setIsMounted(false);
    const t = setTimeout(() => {
      onClose(); 
    }, 400); // Sinkron dengan durasi transisi
    timeoutRefs.current.push(t);
  }, [onClose]);

  return (
    // 👇 Penyesuaian layout: md:items-center agar di Desktop melayang di tengah 👇
    <div className="fixed inset-0 z-[300] flex md:items-center justify-center overflow-hidden md:p-4">
      
      {/* Backdrop (Hanya muncul di mode Desktop/Tablet) */}
      <div 
        className={`hidden md:block absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] transition-opacity duration-500 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`} 
        onClick={closeWithAnimation}
      ></div>

      {/* 👇 EFEK ANIMASI CERDAS 👇
        Mobile: Meluncur dari kanan (translate-x)
        Desktop: Fade in dari tengah (scale & opacity)
      */}
      <div 
        className={`
          absolute inset-0 md:relative md:inset-auto w-full h-full md:h-auto md:max-w-md flex flex-col 
          bg-[#f2f2f7] dark:bg-[#000000] md:bg-white md:dark:bg-slate-900 
          md:rounded-[2rem] md:shadow-2xl md:border md:border-slate-200/50 md:dark:border-slate-800
          px-5 pt-[70px] md:pt-8 pb-32 md:pb-8 overflow-hidden 
          transform transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${isMounted ? 'translate-x-0 md:scale-100 md:opacity-100' : 'translate-x-full md:translate-x-0 md:scale-95 md:opacity-0'}
        `}
      >
        
        {/* Header Ala iOS (Clean & Centered logic) */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          
          {/* Tombol Back Mobile */}
          <button 
            onClick={closeWithAnimation} 
            className="md:hidden flex items-center gap-1 text-blue-600 dark:text-blue-400 active:opacity-50 transition-all"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
            <span className="text-[17px] font-medium">Kembali</span>
          </button>
          
          {/* Judul Modal */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none md:static md:translate-x-0 md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Master Data</p>
            <h3 className="text-[17px] md:text-2xl font-bold text-slate-900 dark:text-white leading-none">Kue Baru</h3>
          </div>

          {/* Tombol Close Desktop */}
          <button 
            onClick={closeWithAnimation} 
            className="hidden md:flex p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-500 active:scale-90 transition-all"
          >
            <X size={20} />
          </button>

          {/* Dummy div untuk penyeimbang flex di Mobile */}
          <div className="w-16 md:hidden"></div>
        </div>

        {/* Kontainer Form (iOS Grouped List Style) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-[#1c1c1e] md:dark:bg-slate-950/50 rounded-[14px] md:rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/5 md:dark:border-slate-800">
            
            {/* Row 1: Nama Kue */}
            <div className="px-4 py-3.5 md:py-4 flex flex-col gap-1 border-b border-slate-100 dark:border-white/5 md:dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Nama Jenis Kue</label>
              <input 
                type="text" 
                autoFocus // Kursor otomatis ngetik di sini saat dibuka
                value={newKue.jenisKue}
                onChange={(e) => setNewKue({...newKue, jenisKue: e.target.value})}
                className="w-full bg-transparent border-none p-0 text-[17px] md:text-lg font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                placeholder="Contoh: Risoles"
              />
            </div>

            {/* Row 2: Harga */}
            <div className="px-4 py-3.5 md:py-4 flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Harga Jual (Pcs)</label>
              <div className="flex items-center gap-1">
                 <span className="text-[17px] md:text-lg font-semibold text-slate-400 md:mr-1">Rp</span>
                 <input 
                  type="number" 
                  inputMode="numeric"
                  value={newKue.harga}
                  onChange={(e) => setNewKue({...newKue, harga: e.target.value})}
                  className="w-full bg-transparent border-none p-0 text-[17px] md:text-lg font-bold text-blue-600 dark:text-blue-400 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-4 md:mt-5 px-4 text-[12px] text-slate-400 dark:text-slate-600 text-center md:text-left italic">
            Data akan disinkronkan langsung ke database utama.
          </p>
        </div>

        {/* Tombol Simpan (Sticky & Floating style iOS) */}
        <div className="shrink-0 pt-4 md:pt-6 relative mt-auto">
          {/* Gradient Blur Effect (Hanya di Mobile) */}
          <div className="md:hidden absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-[#f2f2f7] dark:from-[#000000] to-transparent pointer-events-none"></div>
          
          <button 
            onClick={handleSave}
            disabled={isSubmitting || !newKue.jenisKue || !newKue.harga}
            className={`relative w-full h-[54px] md:h-[60px] rounded-[14px] md:rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] z-10 shadow-lg ${
              isSubmitting || !newKue.jenisKue || !newKue.harga
              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 shadow-none' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Save size={20} strokeWidth={2.5} />
                <span className="uppercase tracking-widest text-[13px] md:text-[14px] font-black">Simpan Kue Baru</span>
              </>
            )}
          </button>
        </div>

      </div> 
    </div>
  );
};

export default MasterAddKueForm;
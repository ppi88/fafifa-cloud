import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Loader2, ChevronLeft, X } from 'lucide-react';

// ============================================================================
// 🌍 STATIC UTILS POOL (Dilempar ke luar untuk menghemat alokasi memori RAM)
// ============================================================================
const formatTitleCase = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const sanitizeInputName = (str) => {
  if (!str) return "";
  return str
    .split(' ')
    .map(word => formatTitleCase(word))
    .join(' ')
    .trim();
};

// ============================================================================
// 🍏 MEMOIZED ADD MENU MODAL COMPONENT (iOS STYLE DESIGN)
// ============================================================================
const MasterAddKueForm = ({ onClose, onSaveSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newKue, setNewKue] = useState({ jenisKue: '', harga: '' });
  
  // State untuk animasi masuk/keluar
  const [isMounted, setIsMounted] = useState(false);
  
  // ⚡ TURBO OPTIMASI: Ref untuk menampung timeout & input focus
  const timeoutRefs = useRef([]);
  const inputNamaRef = useRef(null);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setIsMounted(true);
        // Fokuskan kursor setelah animasi modal selesai (300ms)
        const t = setTimeout(() => {
          if (inputNamaRef.current) inputNamaRef.current.focus();
        }, 300);
        timeoutRefs.current.push(t);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Memoisasi Pengetikan Nama Kue
  const handleNamaKueChange = useCallback((e) => {
    const val = e.target.value;
    setNewKue(prev => ({ ...prev, jenisKue: val }));
  }, []);

  // Memoisasi Pengetikan Harga Kue
  const handleHargaKueChange = useCallback((e) => {
    const val = e.target.value;
    setNewKue(prev => ({ ...prev, harga: val }));
  }, []);

  const handleSave = async () => {
    // 🛡️ SANITASI INPUT ENTERPRISE: Ubah otomatis menjadi Title Case Standar
    const cleanedNama = sanitizeInputName(newKue.jenisKue);
    const cleanedHarga = Number(newKue.harga);

    if (!cleanedNama || !cleanedHarga || cleanedHarga <= 0) {
      alert("Isi nama produk dan harganya dengan benar dulu, Bang!");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSaveSuccess({ jenisKue: cleanedNama, harga: cleanedHarga }); 
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

  // ⌨️ FITUR ENTER: Tekan Enter untuk langsung simpan
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting && newKue.jenisKue && newKue.harga) {
        handleSave();
      }
    }
  }, [isSubmitting, newKue]);

  return (
    <div className="fixed inset-0 z-[300] flex md:items-center justify-center overflow-hidden md:p-4">
      
      {/* Backdrop (Hanya muncul di mode Desktop/Tablet) */}
      <div 
        className={`hidden md:block absolute inset-0 bg-slate-950/40 backdrop-blur-[4px] transition-opacity duration-500 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`} 
        onClick={closeWithAnimation}
      ></div>

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
        
        {/* Header Ala iOS */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          
          <button 
            onClick={closeWithAnimation} 
            className="md:hidden flex items-center gap-1 text-blue-600 dark:text-blue-400 active:opacity-50 transition-all"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
            <span className="text-[17px] font-medium">Kembali</span>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none md:static md:translate-x-0 md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">Master Data</p>
            <h3 className="text-[17px] md:text-2xl font-bold text-slate-900 dark:text-white leading-none">Produk Baru</h3>
          </div>

          <button 
            onClick={closeWithAnimation} 
            className="hidden md:flex p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-rose-500 active:scale-90 transition-all"
          >
            <X size={20} />
          </button>

          <div className="w-16 md:hidden"></div>
        </div>

        {/* Kontainer Form Input Fields */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="bg-white dark:bg-[#1c1c1e] md:dark:bg-slate-950/50 rounded-[14px] md:rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/5 md:dark:border-slate-800">
            
            {/* Row 1: Nama Produk */}
            <div className="px-4 py-3.5 md:py-4 flex flex-col gap-1 border-b border-slate-100 dark:border-white/5 md:dark:border-slate-800">
              <label htmlFor="namaKue" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight cursor-pointer">
                Nama Produk
              </label>
              <input 
                id="namaKue"
                ref={inputNamaRef}
                type="text" 
                value={newKue.jenisKue}
                onChange={handleNamaKueChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none p-0 text-[17px] md:text-lg font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                placeholder="Contoh: Risoles Sayur"
              />
            </div>

            {/* Row 2: Harga */}
            <div className="px-4 py-3.5 md:py-4 flex flex-col gap-1">
              <label htmlFor="hargaKue" className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight cursor-pointer">
                Harga Jual (Pcs)
              </label>
              <div className="flex items-center gap-1">
                 <span className="text-[17px] md:text-lg font-semibold text-slate-400 md:mr-1">Rp</span>
                 <input 
                  id="hargaKue"
                  type="number" 
                  inputMode="numeric"
                  min="0"
                  value={newKue.harga}
                  onChange={handleHargaKueChange}
                  onKeyDown={handleKeyDown}
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

        {/* Action Button Save Stack */}
        <div className="shrink-0 pt-4 md:pt-6 relative mt-auto">
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
                <span className="uppercase tracking-widest text-[13px] md:text-[14px] font-black">Simpan Produk</span>
              </>
            )}
          </button>
        </div>

      </div> 
    </div>
  );
};

// 🔥 SINKRONISASI AKHIR PERFORMA TINGGI: Kunci Siklus Menggunakan React.memo 🔥
export default React.memo(MasterAddKueForm);
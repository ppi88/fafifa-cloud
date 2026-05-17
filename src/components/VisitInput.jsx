import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, X, Clock, Calendar, Loader2, CheckCircle2 } from 'lucide-react';

const VisitInput = ({ onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jumlah, setJumlah] = useState(1);
  const [inputJam, setInputJam] = useState("");
  const [inputTanggal, setInputTanggal] = useState(""); 
  
  // 🔥 STATUS LOADING MODERN: 'idle' | 'loading' | 'success'
  const [statusSave, setStatusSave] = useState('idle');
  
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setInputJam(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setInputTanggal(now.toISOString().split('T')[0]);
      setStatusSave('idle'); // Reset status saat modal dibuka
    }
  }, [isOpen]);

  const triggerShow = () => {
    setIsActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsActive(false);
    }, 10000); 
  };

  const handleSubmit = async () => {
    if (!inputTanggal || !inputJam) {
      alert("Tanggal dan Jam harus diisi, Bang!");
      return;
    }

    setStatusSave('loading'); // Putar tombol loading

    const data = {
      tanggal: inputTanggal, 
      jam: inputJam,         
      jumlah: Number(jumlah)
    };

    const success = await onSave(data);
    
    if (success) {
      setStatusSave('success'); // Tampilkan tanda Berhasil
      // Tahan 1.2 detik biar mantap dilihat, lalu tutup otomatis
      setTimeout(() => {
        setIsOpen(false);
        setJumlah(1);
        setStatusSave('idle');
      }, 1200); 
    } else {
      setStatusSave('idle');
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      onMouseEnter={triggerShow}
      onTouchStart={triggerShow}
      className={`
        fixed bottom-28 right-6 w-14 h-14 rounded-full flex items-center justify-center z-[90] 
        transition-all duration-700 border-2
        ${isActive 
          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg opacity-100' 
          : 'bg-emerald-500/50 text-white/80 border-emerald-500/30 dark:bg-emerald-600/40 dark:border-emerald-600/20 opacity-50 hover:opacity-100 hover:bg-emerald-500 hover:border-emerald-400'
        }
      `}
    >
      <Users size={24} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => statusSave === 'idle' && setIsOpen(false)}></div>
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <button onClick={() => setIsOpen(false)} disabled={statusSave !== 'idle'} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 disabled:opacity-30">
          <X size={20}/>
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter text-center">Konsumen Datang</h3>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-emerald-500 transition-all">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <input 
                type="date" 
                value={inputTanggal}
                onChange={(e) => setInputTanggal(e.target.value)}
                disabled={statusSave !== 'idle'}
                className="bg-transparent text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none w-full text-center disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/50 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm focus-within:border-emerald-500 transition-all">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <input 
                type="time" 
                value={inputJam}
                onChange={(e) => setInputJam(e.target.value)}
                disabled={statusSave !== 'idle'}
                className="bg-transparent text-[13px] font-bold text-slate-700 dark:text-slate-200 outline-none w-full text-center disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
            <button onClick={() => setJumlah(Math.max(1, jumlah-1))} disabled={statusSave !== 'idle'} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl font-black text-xl text-slate-700 dark:text-slate-200 shadow-sm active:scale-90 transition-transform disabled:opacity-50">-</button>
            <span className="text-3xl font-black text-slate-800 dark:text-white">{jumlah}</span>
            <button onClick={() => setJumlah(jumlah+1)} disabled={statusSave !== 'idle'} className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl font-black text-xl text-slate-700 dark:text-slate-200 shadow-sm active:scale-90 transition-transform disabled:opacity-50">+</button>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={statusSave !== 'idle'}
            className={`w-full py-4 rounded-2xl text-white font-black uppercase text-[12px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
              ${statusSave === 'success' ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-emerald-500 shadow-emerald-500/30 hover:bg-emerald-600'}
            `}
          >
            {statusSave === 'loading' ? <><Loader2 className="animate-spin" size={18} /> Menyimpan...</> : 
             statusSave === 'success' ? <><CheckCircle2 size={18} className="animate-in zoom-in" /> Berhasil Masuk!</> : 
             <><Send size={18} /> Catat Kunjungan</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitInput;
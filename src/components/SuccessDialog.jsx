import React from 'react';
import { Check } from 'lucide-react';

const SuccessDialog = ({ isOpen, onClose, title = "Berhasil", message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center px-8 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Box Dialog - Gaya iOS Success */}
      <div className="relative w-full max-w-[260px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[1.8rem] overflow-hidden shadow-2xl animate-ios-pop border border-white/20 dark:border-slate-800/50">
        
        <div className="p-6 text-center">
          {/* Ikon Centang Hijau */}
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Check size={32} strokeWidth={3} />
          </div>

          <h3 className="text-[17px] font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tighter">
            {title}
          </h3>
          
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Tombol Tunggal (Bukan dua tombol) */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="w-full py-4 text-[15px] font-black text-blue-600 dark:text-blue-400 active:bg-slate-100 dark:active:bg-slate-800 transition-colors uppercase tracking-widest"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessDialog;
import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi", 
  message = "Apakah Anda yakin?", 
  confirmText = "Hapus", 
  cancelText = "Batal",
  variant = "danger" 
}) => {
  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center px-8 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-[280px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[1.8rem] overflow-hidden shadow-2xl animate-ios-pop border border-white/20 dark:border-slate-800/50">
        <div className="p-6 text-center">
          {/* Ikon Tanda Seru Merah */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isDanger ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
          }`}>
            {isDanger ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
          </div>

          <h3 className="text-[17px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">
            {title}
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Dua Tombol (Grid Style) */}
        <div className="flex border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-[13px] font-bold text-slate-400 dark:text-slate-500 active:bg-slate-50 border-r border-slate-200 dark:border-slate-800 uppercase"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-4 text-[13px] font-black active:opacity-80 uppercase ${
              isDanger ? 'text-rose-500' : 'text-blue-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
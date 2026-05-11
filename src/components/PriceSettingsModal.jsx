import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const PriceSettingsModal = ({ priceList, onClose, onUpdate }) => {
  // State lokal agar perubahan tidak langsung terkirim ke server sebelum ditekan 'Simpan'
  const [prices, setPrices] = useState(priceList);

  const handleSave = () => {
    // Ubah objek prices kembali menjadi format array yang dibutuhkan Google Script
    const dataToSave = Object.keys(prices).map(kue => ({
      jenisKue: kue,
      harga: prices[kue]
    }));
    onUpdate(dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800">
        
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center mb-8">
          <div className="italic">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Konfigurasi Sistem</p>
            <h3 className="font-black uppercase italic text-lg tracking-tighter text-slate-800 dark:text-white">Update Harga Kue</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIST INPUT HARGA */}
        <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(prices).map(kue => (
            <div key={kue} className="flex items-center justify-between gap-4 p-1">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight block mb-1">
                  {kue}
                </span>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-400">Rp</span>
                  </div>
                  <input 
                    type="number" 
                    value={prices[kue]} 
                    onChange={(e) => setPrices({...prices, [kue]: Number(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500/30 rounded-2xl pl-10 pr-4 py-3.5 text-xs font-black text-blue-600 dark:text-blue-400 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* INFO BOX */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 mb-8">
          <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-relaxed">
            Perubahan harga ini akan berdampak pada perhitungan Net Sales di seluruh laporan riwayat dan rangkuman.
          </p>
        </div>

        {/* TOMBOL AKSI */}
        <button 
          onClick={handleSave} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
        >
          <Save size={18} /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
};

export default PriceSettingsModal;
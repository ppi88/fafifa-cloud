import React from 'react';
import { Activity, Grip } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, loading }) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-[90] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 pt-[env(safe-area-inset-top)]">
      
      {/* 👇 Kunci tinggi di 68px agar flex box otomatis mencari titik tengah (simetris) 👇 */}
      <div className="flex justify-between items-center px-5 h-[68px]">
        
        {/* Logo & Judul */}
        <div className="flex items-center gap-3">
          {/* Kotak Logo (Efek denyut saat loading) */}
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Activity size={20} strokeWidth={2.5} className={loading ? "animate-pulse" : ""} />
          </div>
          
          {/* Teks Judul & Versi */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-1">
              <h1 className="text-[17px] font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">
                FaFiFa<span className="text-sky-500">_Report</span>
              </h1>
              {/* 🔥 LABEL VERSI APLIKASI 🔥 */}
              <span className="bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-wider">
                V.1.0
              </span>
            </div>
            
            {/* 🔥 INDIKATOR SWR SILUMAN (Berubah Otomatis) 🔥 */}
            <p className={`text-[9px] font-black uppercase tracking-[0.15em] leading-none transition-colors duration-300 ${
              loading ? 'text-amber-500 animate-pulse' : 'text-green-500'
            }`}>
              ● {loading ? 'Menyinkronkan...' : 'Live Database'}
            </p>
          </div>
        </div>

        {/* Tombol Pengaturan Pusat Kendali */}
        <button 
          type="button" 
          onClick={() => setActiveTab('Master')} 
          className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all active:scale-90 border shrink-0 ${
            activeTab === 'Master' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
          }`}
        >
          <Grip size={18} className={loading ? "animate-spin text-amber-500" : ""} />
        </button>

      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { Package, ChefHat, Database, TrendingUp, X } from 'lucide-react';

import MasterAddKueForm from '../components/MasterAddKueForm';
import MasterKueListModal from '../components/MasterKueListModal';
import SuccessDialog from '../components/SuccessDialog'; 

import MasterBahanListModal from '../components/MasterBahanListModal';
import MasterAddBahanForm from '../components/MasterAddBahanForm';

import MasterResepModal from '../components/MasterResepModal';

const MasterPage = ({ 
  setActiveTab, 
  setIsSubViewOpen, 
  onAddNewKue, 
  onDeleteKue, 
  onUpdateKue, 
  priceList,
  bahanList = {}, 
  onAddNewBahan,
  onDeleteBahan,
  onUpdateBahan,
  resepData = {},
  targetYieldData = {}, 
  onSaveResep,
  hiddenKueList = [], 
  onToggleHideKue
}) => {
  const [activeView, setActiveView] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // --- 📱 SINKRONISASI STATUS VIEW KE APP.JSX ---
  useEffect(() => {
    if (setIsSubViewOpen) {
      setIsSubViewOpen(activeView !== null || showSuccess); 
    }
  }, [activeView, showSuccess, setIsSubViewOpen]);

  // --- 📱 LOGIKA HARDWARE BACK BUTTON (ANTI-JEBOL) ---
  useEffect(() => {
    const handleBackView = () => {
      // 1. Jika ada pesan sukses, cukup tutup pesan suksesnya
      if (showSuccess) {
        setShowSuccess(false);
        return;
      }

      // 2. Navigasi berjenjang untuk menutup modal/lembar demi lembar
      if (activeView === 'add_kue') {
        setActiveView('kue_list');
      } 
      else if (activeView === 'add_bahan') {
        setActiveView('bahan');
      }
      else if (activeView !== null) {
        // Jika berada di menu utama (kue_list, bahan, resep), kembali ke Pusat Kendali
        setActiveView(null);
      }
    };

    // 🔥 SEMUA pushState DIHAPUS DARI SINI AGAR TIDAK BENTROK DENGAN APP.JS 🔥
    window.addEventListener('popstate', handleBackView);
    return () => window.removeEventListener('popstate', handleBackView);
  }, [activeView, showSuccess]);

  const adminMenus = [
    { id: 'kue_list', title: 'Menu Kue', desc: 'Daftar & harga', icon: <Package size={28} className="text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/30' },
    { id: 'bahan', title: 'Bahan Baku', desc: 'Stok gudang', icon: <Database size={28} className="text-emerald-500" />, color: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { id: 'resep', title: 'Resep', desc: 'Bahan per kue', icon: <ChefHat size={28} className="text-amber-500" />, color: 'bg-amber-50 dark:bg-amber-900/30' },
    { id: 'target', title: 'Target', desc: 'Sales bulanan', icon: <TrendingUp size={28} className="text-rose-500" />, color: 'bg-rose-50 dark:bg-rose-900/30' },
  ];

  // --- HANDLERS ---
  const handleKueSaved = async (data) => {
    if (onAddNewKue) await onAddNewKue(data);
    setSuccessMsg(`Menu ${data.jenisKue.toUpperCase()} berhasil didaftarkan!`);
    setShowSuccess(true);
    setActiveView('kue_list'); 
  };

  const handleBahanSaved = async (data) => {
    if (onAddNewBahan) await onAddNewBahan(data);
    setSuccessMsg(`Bahan ${data.namaBahan} berhasil disimpan!`);
    setShowSuccess(true);
    setActiveView('bahan'); 
  };

  const handleResepSaved = async (namaKue, resepArray, yieldResult) => {
    if (onSaveResep) await onSaveResep(namaKue, resepArray, yieldResult);
    setSuccessMsg(`Resep untuk ${namaKue.toUpperCase()} berhasil diupdate!`);
    setShowSuccess(true);
  };

  return (
    <div className="absolute inset-0 z-10 overflow-hidden">
      
      {/* LAYER 1: TAMPILAN PUSAT KENDALI */}
      <div 
        className={`absolute inset-0 flex flex-col items-center bg-[#f8fafc] dark:bg-[#020617] px-5 pt-[80px] pb-32 md:pt-16 md:pb-12 lg:pt-20 transition-all duration-300 ease-in-out
          ${activeView !== null ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
        `}
      >
        {/* Kontainer Lebar Maksimal untuk Desktop & Tablet */}
        <div className="flex flex-col h-full w-full max-w-md md:max-w-3xl lg:max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center mb-6 md:mb-10 shrink-0">
            <div className="italic">
              <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Administrator</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">Pusat Kendali</h2>
            </div>
            {/* Tombol X yang memicu hardware back logic secara mulus */}
            <button onClick={() => window.history.back()} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-all shadow-sm">
              <X size={20} />
            </button>
          </div>

          {/* 🖥️ GRID RESPONSIF: 2 Kolom di HP, 4 Kolom di Tablet/Desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-5 shrink-0 mb-6 md:mb-10">
            {adminMenus.map((menu) => (
              <button 
                key={menu.id}
                onClick={() => setActiveView(menu.id)}
                className="group flex flex-col items-center justify-center p-4 py-6 md:py-8 bg-white dark:bg-slate-900 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md active:scale-95 transition-all text-center aspect-square md:aspect-auto md:h-48"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.2rem] ${menu.color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-translate-y-1 mb-3 md:mb-4`}>
                  {menu.icon}
                </div>
                <h3 className="text-sm md:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{menu.title}</h3>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase italic mt-1 tracking-tight">{menu.desc}</p>
              </button>
            ))}
          </div>

          <div className="relative p-4 md:p-6 bg-slate-900 dark:bg-blue-600 rounded-[1.5rem] text-center italic overflow-hidden shadow-sm shrink-0 mt-auto md:mt-0 border border-white/5">
            <p className="relative z-10 text-[8px] md:text-[9px] font-black text-slate-400 dark:text-blue-100 uppercase tracking-[0.3em] mb-0.5 md:mb-1">System Security Active</p>
            <p className="relative z-10 text-[9px] md:text-[10px] text-white/60 dark:text-white/80 uppercase font-bold leading-tight">Data Master terenkripsi & sinkron otomatis ke Cloud.</p>
          </div>
        </div>
      </div>

      {/* LAYER 2: MENU KUE */}
      {activeView === 'kue_list' && (
        <MasterKueListModal 
          priceList={priceList} 
          hiddenKueList={hiddenKueList} 
          onToggleHideKue={onToggleHideKue} 
          onClose={() => window.history.back()} 
          onAddNewClick={() => setActiveView('add_kue')}
          onDeleteKue={onDeleteKue}
          onUpdateKue={onUpdateKue}
        />
      )}
      {activeView === 'add_kue' && (
        <MasterAddKueForm onClose={() => window.history.back()} onSaveSuccess={handleKueSaved} />
      )}

      {/* LAYER 2: MENU BAHAN BAKU */}
      {activeView === 'bahan' && (
        <MasterBahanListModal 
          bahanList={bahanList}
          onClose={() => window.history.back()}
          onAddNewClick={() => setActiveView('add_bahan')}
          onDeleteBahan={onDeleteBahan}
          onUpdateBahan={onUpdateBahan}
        />
      )}
      {activeView === 'add_bahan' && (
        <MasterAddBahanForm 
          onClose={() => window.history.back()} 
          onSaveSuccess={handleBahanSaved} 
        />
      )}

      {/* LAYER 2: MENU RESEP */}
      {activeView === 'resep' && (
        <MasterResepModal 
          priceList={priceList}
          bahanList={bahanList}
          resepData={resepData}
          targetYieldData={targetYieldData} 
          onClose={() => window.history.back()}
          onSaveResep={handleResepSaved}
        />
      )}

      {/* LAYER 3: DIALOG SUKSES */}
      <SuccessDialog 
        isOpen={showSuccess} 
        onClose={() => setShowSuccess(false)} 
        title="Berhasil"
        message={successMsg} 
      />
      
    </div>
  );
};

export default MasterPage;
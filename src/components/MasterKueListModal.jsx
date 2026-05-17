import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ChevronLeft, Plus, LayoutList, Trash2, Edit3, Check, X, Database, Eye, EyeOff } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

// ============================================================================
// 🧠 MEMOIZED MASTER KUE LIST MODAL COMPONENT
// ============================================================================
const MasterKueListModal = ({ priceList, hiddenKueList = [], onToggleHideKue, onClose, onAddNewClick, onDeleteKue, onUpdateKue }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({ jenisKue: '', harga: '' });
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [kueToDel, setKueToDel] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let raf;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        setIsMounted(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const kueArray = useMemo(() => Object.entries(priceList), [priceList]);

  // --- 🔥 MEMOIZED HANDLERS PIPELINE (Strict Reference Memory Guard) 🔥 ---
  const handleStartEdit = useCallback((nama, harga) => {
    setEditingKey(nama);
    setEditForm({ jenisKue: nama, harga: harga });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingKey(null);
  }, []);

  const handleSaveEdit = useCallback((oldName) => {
    // Membaca snapshot state terbaru secara terisolasi tanpa memicu re-creation
    setEditForm(currentForm => {
      if (currentForm.jenisKue.trim() && !isNaN(currentForm.harga) && currentForm.harga >= 0) {
        onUpdateKue(oldName, currentForm);
        setEditingKey(null);
      }
      return currentForm;
    });
  }, [onUpdateKue]);

  const handleKeyDown = useCallback((e, oldName) => {
    if (e.key === 'Enter') handleSaveEdit(oldName);
    if (e.key === 'Escape') handleCancelEdit();
  }, [handleSaveEdit, handleCancelEdit]);

  const triggerDelete = useCallback((nama) => {
    setKueToDel(nama);
    setIsDelOpen(true);
  }, []);

  const closeWithAnimation = useCallback(() => {
    setIsMounted(false);
    const t = setTimeout(() => {
      onClose(); 
    }, 300);
    return () => clearTimeout(t);
  }, [onClose]);

  const addKueWithAnimation = useCallback(() => {
    setIsMounted(false);
    const t = setTimeout(() => {
      onAddNewClick();
    }, 300);
    return () => clearTimeout(t);
  }, [onAddNewClick]);

  // Handler Pengetikan Nama Kue Terisolasi RAM
  const handleEditJenisKueChange = useCallback((e) => {
    const val = e.target.value;
    setEditForm(prev => ({ ...prev, jenisKue: val }));
  }, []);

  // Handler Pengetikan Harga Kue Terisolasi RAM
  const handleEditHargaChange = useCallback((e) => {
    const val = e.target.value;
    setEditForm(prev => ({ ...prev, harga: val }));
  }, []);

  return (
    <div 
      className={`absolute inset-0 z-20 flex flex-col bg-[#f8fafc] dark:bg-[#020617] transform transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      
      {/* 🚀 HEADER UTAMA (FULL WIDTH 100% LAYAR & STICKY TOP) 🚀 */}
      <div className="w-full shrink-0 pt-[70px] md:pt-6 lg:pt-8 pb-3 md:pb-4 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm relative z-30 px-4">
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]"></div>

        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={closeWithAnimation}
              className="p-2.5 md:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-90 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="italic">
              <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Database</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Daftar Menu</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={addKueWithAnimation}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[12px] tracking-wider shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
            >
              <Plus size={18} /> Menu Baru
            </button>
            
            <div className="p-2.5 md:p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <LayoutList size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 🖥️ KOTAK KONTEN UTAMA (Tabel & Scroll Area) */}
      <div className="flex flex-col flex-1 w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative px-4 pb-32 md:pb-8 mt-4 md:mt-5 overflow-hidden">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative z-10">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm mb-4">
            
            {/* JUDUL TABEL STICKY */}
            <div className="flex items-center px-4 md:px-8 py-3 md:py-4 bg-indigo-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-indigo-100/50 dark:border-slate-700 sticky top-0 z-30 transition-colors">
              <div className="w-8 md:w-16 text-[10px] md:text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest shrink-0">No</div>
              <div className="flex-1 text-[10px] md:text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest px-2 min-w-0">Nama Kue</div>
              <div className="w-24 md:w-32 text-[10px] md:text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest text-right shrink-0">Harga</div>
              <div className="w-24 md:w-28 ml-4 text-[10px] md:text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest text-center shrink-0">Aksi</div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {kueArray.map(([namaKue, harga], index) => {
                const isEditing = editingKey === namaKue;
                const isHidden = hiddenKueList.includes(namaKue); 

                return (
                  <div 
                    key={index} 
                    className={`flex items-center px-4 md:px-8 h-[54px] md:h-[64px] transition-colors duration-200 ${isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${isHidden && !isEditing ? 'opacity-50 grayscale bg-slate-50 dark:bg-slate-900' : ''}`}
                  >
                    <div className="w-8 md:w-12 text-[13px] md:text-[14px] font-bold text-slate-400 shrink-0">
                      {index + 1}
                    </div>

                    {isEditing ? (
                      <>
                        <div className="flex-1 px-1 min-w-0">
                          <input 
                            autoFocus
                            className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-md md:rounded-lg px-2 py-1.5 md:py-2 text-[13px] md:text-[14px] font-black outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={editForm.jenisKue}
                            onKeyDown={(e) => handleKeyDown(e, namaKue)}
                            onChange={handleEditJenisKueChange}
                          />
                        </div>
                        <div className="w-24 md:w-32 ml-2 flex items-center bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-md md:rounded-lg px-2 shrink-0">
                          <span className="text-[10px] md:text-[11px] font-bold text-slate-300">Rp</span>
                          <input 
                            type="number"
                            className="w-full bg-transparent py-1.5 md:py-2 text-[13px] md:text-[14px] font-black text-right outline-none min-w-0"
                            value={editForm.harga}
                            onKeyDown={(e) => handleKeyDown(e, namaKue)}
                            onChange={handleEditHargaChange}
                          />
                        </div>
                        <div className="w-24 md:w-28 ml-2 flex justify-end md:justify-center gap-1 shrink-0">
                          <button onClick={() => handleSaveEdit(namaKue)} className="p-1.5 md:p-2 text-green-600 bg-green-50 dark:bg-green-900/30 rounded-lg md:rounded-xl active:scale-90 transition-all hover:bg-green-100">
                            <Check size={18} />
                          </button>
                          <button onClick={handleCancelEdit} className="p-1.5 md:p-2 text-rose-600 bg-rose-50 dark:bg-rose-900/30 rounded-lg md:rounded-xl active:scale-90 transition-all hover:bg-rose-100">
                            <X size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-[13px] md:text-[14px] font-black text-slate-700 dark:text-slate-100 tracking-tight px-2 truncate flex items-center gap-2 min-w-0">
                          <span className={`truncate ${isHidden ? "line-through" : ""}`}>{namaKue}</span>
                          {isHidden && <span className="text-[8px] md:text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-widest leading-none mt-0.5 shrink-0">Hidden</span>}
                        </div>
                        <div className="w-24 md:w-32 text-[13px] md:text-[15px] font-black text-blue-600 dark:text-blue-400 text-right shrink-0">
                          {harga.toLocaleString('id-ID')}
                        </div>
                        
                        <div className="w-24 md:w-28 ml-2 flex justify-end md:justify-center gap-1.5 md:gap-2 shrink-0">
                          <button onClick={() => onToggleHideKue(namaKue, !isHidden)} className={`p-1.5 md:p-2 rounded-lg transition-all active:scale-90 ${isHidden ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 hover:text-blue-600' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}>
                            {isHidden ? <EyeOff size={16} className="md:w-5 md:h-5" /> : <Eye size={16} className="md:w-5 md:h-5" />}
                          </button>
                          <button onClick={() => handleStartEdit(namaKue, harga)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all active:scale-90" disabled={isHidden}>
                            <Edit3 size={16} className="md:w-5 md:h-5" />
                          </button>
                          <button onClick={() => triggerDelete(namaKue)} className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all active:scale-90" disabled={isHidden}>
                            <Trash2 size={16} className="md:w-5 md:h-5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {kueArray.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 md:p-20 text-slate-300 dark:text-slate-700">
                  <Database size={40} strokeWidth={1} className="mb-2 opacity-20" />
                  <p className="italic text-[11px] font-bold uppercase tracking-widest">Database Kosong</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOMBOL TAMBAH MENU PANELS MOBILE */}
        <div className="md:hidden shrink-0 pt-4 relative z-0">
          <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-[#f8fafc] dark:from-[#020617] to-transparent pointer-events-none"></div>
          <button 
            onClick={addKueWithAnimation}
            className="relative w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-full font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 active:scale-95 transition-all z-10"
          >
            <Plus size={20} />
            Input Menu Baru
          </button>
        </div>

      </div> 

      <ConfirmDialog 
        isOpen={isDelOpen}
        onClose={() => setIsDelOpen(false)}
        onConfirm={() => {
          onDeleteKue(kueToDel);
          setIsDelOpen(false); 
        }}
        title="Hapus Menu"
        message={`Yakin mau hapus "${kueToDel}"? Data ini akan hilang selamanya dari Cloud.`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
};

// 🔥 SINKRONISASI AKHIR PERFORMA TINGGI: Kunci Siklus Menggunakan React.memo 🔥
export default React.memo(MasterKueListModal);
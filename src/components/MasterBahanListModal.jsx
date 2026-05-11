import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Plus, Tag, Trash2, Edit3, Check, X, Database } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const MasterBahanListModal = ({ bahanList = {}, onClose, onAddNewClick, onDeleteBahan, onUpdateBahan }) => {
  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({ namaBahan: '', harga: '', kuantitas: '', satuan: 'Kg' });
  const [isDelOpen, setIsDelOpen] = useState(false);
  const [bahanToDel, setBahanToDel] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => { setIsMounted(true); });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const bahanArray = useMemo(() => Object.entries(bahanList), [bahanList]);

  const handleStartEdit = (nama, detail) => {
    setEditingKey(nama);
    setEditForm({ 
      namaBahan: nama, 
      harga: detail.harga, 
      kuantitas: detail.kuantitas || 1, 
      satuan: detail.satuan || 'Kg'
    });
  };

  const handleSaveEdit = (oldName) => {
    if (!editForm.namaBahan.trim() || !editForm.harga || !editForm.kuantitas) return;
    
    onUpdateBahan(oldName, {
      namaBahan: editForm.namaBahan.trim(),
      harga: Number(editForm.harga),
      kuantitas: Number(editForm.kuantitas),
      satuan: editForm.satuan
    });
    setEditingKey(null);
  };

  const triggerDelete = (nama) => {
    setBahanToDel(nama);
    setIsDelOpen(true);
  };

  const closeWithAnimation = () => {
    setIsMounted(false);
    setTimeout(() => { onClose(); }, 300);
  };

  return (
    <div className={`absolute inset-0 z-20 flex flex-col bg-[#f8fafc] dark:bg-[#020617] transform transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      
      {/* HEADER UTAMA (FULL WIDTH 100% LAYAR) */}
      <div className="w-full shrink-0 pt-[70px] md:pt-6 lg:pt-8 pb-3 md:pb-4 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm relative z-30 px-4">
        
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]"></div>

        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={closeWithAnimation} className="p-2.5 md:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 active:scale-90 transition-all shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <div className="italic">
              <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Database</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Harga Bahan</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setIsMounted(false);
                setTimeout(() => onAddNewClick(), 300);
              }}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[12px] tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
            >
              <Plus size={18} /> Bahan Baru
            </button>

            <div className="p-2.5 md:p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <Tag size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* KOTAK KONTEN UTAMA */}
      <div className="flex flex-col flex-1 w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative px-4 pb-32 md:pb-8 mt-4 md:mt-5 overflow-hidden">
        
        {/* 👇 FIX: Pisahkan scrollable area langsung ke bagian list datanya saja 👇 */}
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-4 overflow-hidden">
            
            {/* 🎯 JUDUL TABEL FIXED (DIJAMIN ANTI GAGAL STICKY) 🎯 */}
            <div className="shrink-0 flex items-center px-4 md:px-8 py-3 md:py-4 bg-emerald-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-emerald-100/50 dark:border-slate-700 z-30 transition-colors">
              <div className="w-8 md:w-16 text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shrink-0">No</div>
              <div className="flex-1 text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-2 min-w-0">Nama Bahan Baku</div>
              <div className="w-24 md:w-40 text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right shrink-0">Harga Total</div>
              <div className="w-24 md:w-28 ml-4 md:ml-8 text-[10px] md:text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-center shrink-0">Aksi</div>
            </div>

            {/* 📜 AREA SCROLL KHUSUS BARIS DATA 📜 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {bahanArray.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 md:p-20 text-slate-300 dark:text-slate-700">
                    <Database size={48} strokeWidth={1} className="mb-3 md:mb-4 opacity-20" />
                    <p className="italic text-[11px] md:text-[13px] font-bold uppercase tracking-widest">Belum ada bahan baku</p>
                  </div>
                ) : (
                  bahanArray.map(([namaBahan, detail], index) => {
                    const isEditing = editingKey === namaBahan;
                    
                    return (
                      <div key={index} className={`transition-colors duration-200 ${isEditing ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center px-4 md:px-8 h-[64px] md:h-[72px]'}`}>
                        
                        {isEditing ? (
                          // FORM EDIT
                          <div className="flex flex-col w-full px-5 py-4 border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10">
                            <div className="mb-3">
                              <label className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 block">Nama Bahan Baku</label>
                              <input 
                                autoFocus
                                className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-2.5 text-[13px] md:text-[14px] font-black outline-none focus:ring-2 focus:ring-emerald-500/30"
                                value={editForm.namaBahan}
                                onKeyDown={(e) => { if (e.key === 'Escape') setEditingKey(null); }}
                                onChange={(e) => setEditForm({...editForm, namaBahan: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-4">
                              <div>
                                <label className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 block">Harga Beli</label>
                                <div className="flex items-center bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-2">
                                  <span className="text-[10px] font-bold text-slate-300">Rp</span>
                                  <input 
                                    type="number"
                                    className="w-full bg-transparent py-2.5 text-[13px] md:text-[14px] font-black outline-none text-right focus:ring-2 focus:ring-emerald-500/30"
                                    value={editForm.harga}
                                    onChange={(e) => setEditForm({...editForm, harga: e.target.value})}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 block">Isi / Qty</label>
                                <input 
                                  type="number"
                                  className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-3 py-2.5 text-[13px] md:text-[14px] font-black outline-none focus:ring-2 focus:ring-emerald-500/30"
                                  value={editForm.kuantitas}
                                  onChange={(e) => setEditForm({...editForm, kuantitas: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 block">Satuan</label>
                                <select 
                                  className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-2 py-2.5 text-[13px] md:text-[14px] font-black outline-none focus:ring-2 focus:ring-emerald-500/30 appearance-none uppercase"
                                  value={editForm.satuan}
                                  onChange={(e) => setEditForm({...editForm, satuan: e.target.value})}
                                >
                                  <option value="Kg">Kg</option>
                                  <option value="Gr">Gr</option>
                                  <option value="Ltr">Ltr</option>
                                  <option value="ml">ml</option>
                                  <option value="cc">cc</option>
                                  <option value="Keping">Keping</option>
                                  <option value="pcs">pcs</option>
                                  <option value="btr">btr</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingKey(null)} className="px-5 py-2.5 md:py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs md:text-sm font-black active:scale-95 transition-transform uppercase tracking-wider hover:bg-slate-300">Batal</button>
                              <button onClick={() => handleSaveEdit(namaBahan)} className="px-5 py-2.5 md:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-black active:scale-95 transition-transform flex items-center gap-1.5 uppercase tracking-wider shadow-lg shadow-emerald-500/30"><Check size={16} /> Simpan</button>
                            </div>
                          </div>
                        ) : (
                          // TAMPILAN BARIS NORMAL
                          <>
                            <div className="w-8 md:w-16 text-[13px] md:text-[15px] font-bold text-slate-400 shrink-0">{index + 1}</div>
                            <div className="flex-1 px-2 min-w-0">
                              <p className="text-[14px] md:text-[15px] font-black text-slate-700 dark:text-slate-100 tracking-tight truncate">{namaBahan}</p>
                              <p className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase mt-0.5">Isi: {detail.kuantitas || 1} {detail.satuan}</p>
                            </div>
                            <div className="w-24 md:w-40 text-right shrink-0">
                              <p className="text-[14px] md:text-[16px] font-black text-emerald-600 dark:text-emerald-500">Rp {detail.harga?.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="w-24 md:w-28 ml-4 md:ml-8 flex justify-center gap-3 shrink-0">
                              <button onClick={() => handleStartEdit(namaBahan, detail)} className="text-slate-300 hover:text-emerald-500 active:scale-90 transition-all"><Edit3 size={18} className="md:w-5 md:h-5" /></button>
                              <button onClick={() => triggerDelete(namaBahan)} className="text-slate-300 hover:text-rose-500 active:scale-90 transition-all"><Trash2 size={18} className="md:w-5 md:h-5" /></button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TOMBOL TAMBAH (KHUSUS MOBILE) */}
        <div className="md:hidden shrink-0 pt-4 relative z-0">
          <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-[#f8fafc] dark:from-[#020617] to-transparent pointer-events-none"></div>
          <button 
            onClick={() => {
              setIsMounted(false);
              setTimeout(() => onAddNewClick(), 300);
            }}
            className="relative w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-full font-black uppercase text-[12px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all z-10"
          >
            <Plus size={20} /> Tambah Daftar Harga
          </button>
        </div>
      </div>

      <ConfirmDialog isOpen={isDelOpen} onClose={() => setIsDelOpen(false)} onConfirm={() => { onDeleteBahan(bahanToDel); setIsDelOpen(false); }} title="Hapus Bahan" message={`Hapus "${bahanToDel}" dari daftar harga? Peringatan: Resep yang menggunakan bahan ini mungkin akan error!`} />
    </div>
  );
};

export default MasterBahanListModal;
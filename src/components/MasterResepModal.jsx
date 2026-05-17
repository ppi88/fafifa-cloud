import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChefHat, Edit3, Check, X, Plus } from 'lucide-react';

// Shared Styling Class Contract
const TABLE_CELL_CLASS = "px-3 md:px-4 py-2.5 text-[12px] md:text-[13px] whitespace-nowrap align-middle border-x border-slate-100 dark:border-slate-800/50";
const TABLE_HEAD_CLASS = "px-3 md:px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-x border-slate-200/50 dark:border-slate-700/60";

// ============================================================================
// 🧠 MEMOIZED PRODUCTION RECIPE DESIGNER MODAL
// ============================================================================
const MasterResepModal = ({ priceList = {}, bahanList = {}, resepData = {}, targetYieldData = {}, onClose, onSaveResep }) => {
  const [editingKue, setEditingKue] = useState(null);
  const [localResep, setLocalResep] = useState([]); 
  const [localYield, setLocalYield] = useState(""); 
  const [newBahan, setNewBahan] = useState("");
  const [newQty, setNewQty] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => { setIsMounted(true); });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // ⚡ TURBO OPTIMASI: useMemo agar tidak membuat array baru berulang kali
  const kueArray = useMemo(() => Object.entries(priceList), [priceList]);
  const bahanArray = useMemo(() => Object.entries(bahanList), [bahanList]);

  // --- 🔥 MEMOIZED CORE CALCULATORS (Mencegah Overhead Pembuatan Ulang Fungsi) 🔥 ---
  const hitungModalBahan = useCallback((namaBahan, qty) => {
    const dataBahan = bahanList[namaBahan];
    if (!dataBahan || !dataBahan.harga || !dataBahan.kuantitas) return 0;
    return (dataBahan.harga / dataBahan.kuantitas) * Number(qty);
  }, [bahanList]);

  const hitungTotalModal = useCallback((resepArray) => {
    return resepArray.reduce((total, item) => total + hitungModalBahan(item.namaBahan, item.qty), 0);
  }, [hitungModalBahan]);

  // --- HANDLER EDIT FORM PIPELINE ---
  const handleStartEdit = useCallback((namaKue) => {
    setEditingKue(namaKue);
    setLocalResep(resepData[namaKue] || []);
    setLocalYield(targetYieldData[namaKue] || 1); 
    setNewBahan("");
    setNewQty("");
  }, [resepData, targetYieldData]);

  const handleAddBahanToResep = useCallback(() => {
    if (!newBahan || !newQty || newQty <= 0) return;
    
    const existingIndex = localResep.findIndex(b => b.namaBahan === newBahan);
    let updatedResep = [...localResep];
    
    if (existingIndex >= 0) {
      updatedResep[existingIndex].qty += Number(newQty);
    } else {
      updatedResep.push({ namaBahan: newBahan, qty: Number(newQty) });
    }
    
    setLocalResep(updatedResep);
    setNewBahan("");
    setNewQty("");
  }, [newBahan, newQty, localResep]);

  const handleRemoveBahanFromResep = useCallback((indexToRemove) => {
    setLocalResep(prevResep => prevResep.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const handleSaveResep = useCallback((namaKue) => {
    if (newBahan && newQty) {
      alert("Tunggu Bang! Bahannya belum dimasukkan ke resep. Klik tombol (+) dulu ya!");
      return;
    }
    if (onSaveResep) {
      onSaveResep(namaKue, localResep, Number(localYield));
    }
    setEditingKue(null);
  }, [newBahan, newQty, onSaveResep, localResep, localYield]);

  const closeWithAnimation = useCallback(() => {
    setIsMounted(false);
    const t = setTimeout(() => { onClose(); }, 300);
    return () => clearTimeout(t);
  }, [onClose]);

  // Isolated Typing Input Handlers 
  const handleYieldInputChange = useCallback((e) => setLocalYield(e.target.value), []);
  const handleNewBahanSelectChange = useCallback((e) => setNewBahan(e.target.value), []);
  const handleNewQtyInputChange = useCallback((e) => setNewQty(e.target.value), []);

  return (
    <div className={`absolute inset-0 z-20 flex flex-col bg-[#f8fafc] dark:bg-[#020617] transform transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      
      {/* 🚀 HEADER UTAMA (FULL WIDTH 100% LAYAR) 🚀 */}
      <div className="w-full shrink-0 pt-[70px] md:pt-6 lg:pt-8 pb-3 md:pb-4 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm relative z-30 px-4">
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]"></div>

        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={closeWithAnimation} 
              className="p-2.5 md:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-90 shadow-sm transition-transform hover:text-rose-500"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="italic">
              <p className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Production Unit</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Formula Resep</h3>
            </div>
          </div>
          <div className="p-2.5 md:p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <ChefHat size={20} />
          </div>
        </div>
      </div>

      {/* 🖥️ KOTAK KONTEN UTAMA (Tabel & Scroll Area) */}
      <div className="flex flex-col flex-1 w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative px-4 pb-32 md:pb-8 mt-4 md:mt-5 overflow-hidden">
        
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-4 overflow-hidden">
            
            {/* 🎯 HEADER TABEL STICKY DENGAN TEMA AMBER SOFT 🎯 */}
            <div className="shrink-0 flex items-center px-4 md:px-6 py-3 md:py-4 bg-amber-50/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-amber-100/50 dark:border-slate-700 z-30 transition-colors">
              <div className="w-8 md:w-10 text-[9px] md:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest shrink-0">No</div>
              <div className="w-24 md:w-40 text-[9px] md:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest px-1 shrink-0">Kue</div>
              <div className="flex-1 text-[9px] md:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest px-1 min-w-0">Komposisi</div>
              <div className="w-24 md:w-32 text-[9px] md:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest text-right shrink-0">Modal & HPP</div>
              <div className="w-10 md:w-16 ml-4 text-[9px] md:text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest text-center shrink-0">Aksi</div>
            </div>

            {/* 📜 AREA SCROLL KHUSUS BARIS DATA 📜 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-2">
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {kueArray.map(([namaKue, hargaJual], index) => {
                  const isEditing = editingKue === namaKue;
                  const activeResep = isEditing ? localResep : (resepData[namaKue] || []);
                  const currentYield = targetYieldData[namaKue] || 1;
                  const totalModal = hitungTotalModal(activeResep);
                  const hpp = totalModal / (isEditing ? (Number(localYield) || 1) : currentYield);

                  return (
                    <div key={index} className={`transition-colors duration-200 ${isEditing ? 'bg-amber-50/30 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center px-4 md:px-6 py-3 min-h-[64px] md:min-h-[72px]'}`}>
                      
                      {isEditing ? (
                        /* 👇 FORM EDIT RESEP ACCORDING TO CONTRACT 👇 */
                        <div className="flex flex-col w-full px-5 py-4 border-l-4 border-amber-500 bg-amber-50/10 dark:bg-amber-900/5 animate-fade-in">
                          
                          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-4 border-b border-amber-200 dark:border-amber-800/30 pb-3 gap-3">
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Edit Resep</p>
                              <h4 className="text-lg md:text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight">{namaKue}</h4>
                              
                              {/* INPUT TARGET HASIL / YIELD */}
                              <div className="mt-3 flex items-center gap-2">
                                <label className="text-[10px] md:text-[11px] font-bold text-slate-500 dark:text-slate-400">Hasil Produksi (Pcs/Pack):</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={localYield} 
                                  onChange={handleYieldInputChange}
                                  className="w-16 md:w-20 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/50 rounded-lg px-2 py-1.5 text-xs md:text-sm font-black outline-none focus:ring-2 focus:ring-amber-500/30 text-center text-slate-800 dark:text-white shadow-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="text-left md:text-right shrink-0 mt-2 md:mt-0 bg-amber-50 dark:bg-amber-900/20 p-2.5 md:p-0 md:bg-transparent rounded-xl md:rounded-none">
                              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Modal</p>
                              <p className="text-base md:text-lg font-black text-rose-500">Rp {Math.round(totalModal).toLocaleString('id-ID')}</p>
                              <div className="mt-1 bg-amber-100 dark:bg-amber-900/40 md:px-2 md:py-1 rounded inline-block md:block">
                                <p className="text-[8px] md:text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase">Est. HPP / Satuan</p>
                                <p className="text-[11px] md:text-[12px] font-black text-amber-700 dark:text-amber-400">Rp {Math.round(hpp).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          </div>

                          {/* Daftar Komposisi yang Terdaftar */}
                          <div className="space-y-2 mb-4">
                            {localResep.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-2.5 md:p-3 shadow-sm">
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="text-[12px] md:text-[13px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">{item.namaBahan}</p>
                                  <p className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-0.5">
                                    {item.qty} {bahanList[item.namaBahan]?.satuan} <span className="mx-1">•</span> Rp {Math.round(hitungModalBahan(item.namaBahan, item.qty)).toLocaleString('id-ID')}
                                  </p>
                                </div>
                                <button onClick={() => handleRemoveBahanFromResep(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                                  <X size={18} strokeWidth={3} />
                                </button>
                              </div>
                            ))}
                            {localResep.length === 0 && (
                              <div className="text-center py-6 border border-dashed border-amber-200 dark:border-amber-800/50 rounded-xl">
                                <p className="text-[11px] font-bold text-amber-500/70 uppercase">Belum ada bahan</p>
                              </div>
                            )}
                          </div>

                          {/* Input Selector Pengisi Bahan ke Formula */}
                          <div className="flex flex-col md:flex-row gap-2 mb-6 p-3 md:p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                            <div className="flex-1">
                              <select 
                                className="w-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2.5 md:py-3 text-[12px] md:text-[13px] font-black outline-none focus:ring-2 focus:ring-amber-500/30 uppercase text-slate-700 dark:text-slate-200 appearance-none"
                                value={newBahan}
                                onChange={handleNewBahanSelectChange}
                              >
                                <option value="" className="dark:bg-slate-900">-- PILIH BAHAN --</option>
                                {bahanArray.map(([nBahan]) => (
                                  <option key={nBahan} value={nBahan} className="dark:bg-slate-900 text-slate-800 dark:text-white">{nBahan}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-24 md:w-32 relative">
                                <input 
                                  type="number"
                                  className="w-full bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2.5 md:py-3 text-[12px] md:text-[14px] font-black outline-none focus:ring-2 focus:ring-amber-500/30"
                                  placeholder="Qty"
                                  value={newQty}
                                  onChange={handleNewQtyInputChange}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase pointer-events-none">
                                  {newBahan ? bahanList[newBahan]?.satuan : ''}
                                </span>
                              </div>
                              <button 
                                onClick={handleAddBahanToResep}
                                disabled={!newBahan || !newQty}
                                className="w-12 md:w-16 flex justify-center items-center bg-amber-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg active:scale-95 transition-transform hover:bg-amber-600"
                              >
                                <Plus size={20} strokeWidth={3} />
                              </button>
                            </div>
                          </div>

                          {/* Action Controller Footer */}
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingKue(null)} className="px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs md:text-sm font-black active:scale-95 transition-transform uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700">Batal</button>
                            <button onClick={() => handleSaveResep(namaKue)} className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs md:text-sm font-black active:scale-95 transition-transform flex items-center gap-1.5 uppercase tracking-wider shadow-lg shadow-amber-500/30">
                              <Check size={18} /> Simpan Resep
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* 👇 TAMPILAN BARIS DATA NORMAL INDEKS 👇 */
                        <>
                          <div className="w-8 md:w-10 text-[12px] md:text-[13px] font-bold text-slate-400 shrink-0">{index + 1}</div>
                          
                          <div className="w-24 md:w-40 px-1 shrink-0">
                            <p className="text-[13px] md:text-[14px] font-black text-slate-700 dark:text-slate-100 tracking-tight leading-tight md:truncate">{namaKue}</p>
                            {currentYield > 1 && (
                              <span className="inline-block mt-1 md:mt-1.5 px-1.5 py-0.5 md:px-2 md:py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] md:text-[9px] font-bold rounded uppercase tracking-wider border border-indigo-100 dark:border-indigo-800">
                                Yield: {currentYield}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 px-1 min-w-0 md:px-4">
                            {activeResep.length > 0 ? (
                              <p className="text-[9px] md:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-3 md:line-clamp-2">
                                {activeResep.map(b => `${b.namaBahan} (${b.qty}${bahanList[b.namaBahan]?.satuan || ''})`).join(', ')}
                              </p>
                            ) : (
                              <p className="text-[9px] md:text-[11px] font-bold text-rose-400/80 italic bg-rose-50 dark:bg-rose-900/20 inline-block px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">Belum ada resep</p>
                            )}
                          </div>
                          
                          <div className="w-24 md:w-32 text-right shrink-0">
                            <p className="text-[13px] md:text-[14px] font-black text-rose-500 dark:text-rose-400">Rp {Math.round(totalModal).toLocaleString('id-ID')}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                              HPP: Rp {Math.round(hpp).toLocaleString('id-ID')}
                            </p>
                          </div>
                          
                          <div className="w-10 md:w-16 ml-2 md:ml-4 flex justify-center shrink-0">
                            <button onClick={() => handleStartEdit(namaKue)} className="p-2 md:p-2.5 text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 active:scale-90 transition-all shadow-sm">
                              <Edit3 size={16} className="md:w-5 md:h-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔥 LOCK ENGINE: Bungkus Rantai Akhir Menggunakan React.memo Murni 🔥
export default React.memo(MasterResepModal);
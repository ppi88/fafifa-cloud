import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, PlusCircle, Calendar as CalendarIcon, Save, Loader2, ArrowRight, AlertTriangle, MessageSquare, Sigma, Droplets, Plus, X, Trash2 } from 'lucide-react';

// --- KOMPONEN MODAL INPUT BAHAN BAKU ---
const InputBahanModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({ nama: '', jumlah: '', satuan: 'kg', harga: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama) return;
    onAdd(formData);
    setFormData({ nama: '', jumlah: '', satuan: 'kg', harga: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">Tambah Bahan Baku</h3>
            <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Nama Bahan Baku</label>
              <input 
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Masukkan nama bahan..."
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Jumlah</label>
                <input 
                  type="number"
                  inputMode="numeric"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Satuan</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                  value={formData.satuan}
                  onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                >
                  {['kg', 'ml', 'pcs', 'keping', 'butir'].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Harga (Rp)</label>
              <input 
                type="number"
                inputMode="numeric"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500 text-amber-600 font-black"
                placeholder="0"
                value={formData.harga}
                onChange={(e) => setFormData({...formData, harga: e.target.value})}
              />
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all uppercase text-[11px] tracking-widest active:scale-95">
              Simpan Bahan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN TABEL BAHAN BAKU ---
const RawMaterialView = ({ materials, handleInputChange, removeMaterial }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <th className="py-3 px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest w-8">No</th>
            <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Bahan</th>
            <th className="py-3 px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
            <th className="py-3 px-1 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Sat</th>
            <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Harga</th>
            <th className="py-3 px-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {materials.map((item, index) => (
            <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
              <td className="py-3 px-3 text-[10px] font-bold text-slate-400 italic">{index + 1}</td>
              <td className="py-3 px-2">
                <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase leading-tight truncate w-20">{item.nama || item.jenisKue}</p>
              </td>
              <td className="py-3 px-1 text-center">
                <input 
                  type="number"
                  inputMode="numeric"
                  value={item.jumlahBahan || ''}
                  onChange={(e) => handleInputChange(item.id, e.target.value, 'jumlahBahan')}
                  placeholder="0"
                  className="w-10 bg-slate-50 dark:bg-slate-800 rounded-md py-1 text-center font-black text-[12px] text-blue-600 outline-none border border-transparent focus:border-blue-300 transition-all"
                />
              </td>
              <td className="py-3 px-1 text-center">
                <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">
                  {item.satuan || 'kg'}
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[9px] font-bold text-slate-300 italic">Rp</span>
                  <input 
                    type="number"
                    inputMode="numeric"
                    value={item.bahanBaku === 0 ? '' : item.bahanBaku}
                    onChange={(e) => handleInputChange(item.id, e.target.value, 'bahanBaku')}
                    placeholder="0"
                    className="w-16 bg-transparent text-right font-black text-[12px] text-amber-600 outline-none focus:text-amber-500"
                  />
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <button 
                  onClick={() => removeMaterial(item.id)}
                  className="text-slate-200 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {materials.length === 0 && (
            <tr>
              <td colSpan="6" className="py-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                Belum ada data bahan baku
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// --- KOMPONEN UTAMA ---
const StockView = ({ data, onSave, selectedDate, setSelectedDate }) => {
  const [subTab, setSubTab] = useState('baru');
  const [draftData, setDraftData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [penyesuaian, setPenyesuaian] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const lastLoadedDate = useRef(null);

  useEffect(() => {
    if (data && (lastLoadedDate.current !== selectedDate)) {
      setDraftData(data);
      setPenyesuaian(Number(data[0]?.penyesuaian) || 0);
      setKeterangan(data[0]?.keterangan || '');
      lastLoadedDate.current = selectedDate;
    }
  }, [data, selectedDate]);

  const currentField = useMemo(() => {
    if (subTab === 'baru') return 'stokBaru';
    if (subTab === 'sisa') return 'sisa';
    return 'bahanBaku'; 
  }, [subTab]);

  const handleInputChange = (id, val, fieldName = null) => {
    const targetField = fieldName || currentField;
    const numVal = val === '' ? 0 : parseInt(val, 10);
    const safeVal = isNaN(numVal) ? 0 : Math.max(0, numVal);

    setDraftData(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [targetField]: safeVal };
        if (targetField === 'stokBaru' || targetField === 'sisaKemarin') {
            updated.jumlah = (Number(updated.sisaKemarin) || 0) + (Number(updated.stokBaru) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleAddBahan = (newBahan) => {
    const newItem = {
      id: Date.now(),
      nama: newBahan.nama,
      jumlahBahan: Number(newBahan.jumlah) || 0,
      satuan: newBahan.satuan,
      bahanBaku: Number(newBahan.harga) || 0,
      sisaKemarin: 0,
      stokBaru: 0,
      sisa: 0
    };
    setDraftData(prev => [newItem, ...prev]);
  };

  const removeMaterial = (id) => {
    setDraftData(prev => prev.filter(item => item.id !== id));
  };

  const totals = useMemo(() => {
    return draftData.reduce((acc, curr) => ({
      sisaKemarin: acc.sisaKemarin + (Number(curr.sisaKemarin) || 0),
      stokBaru: acc.stokBaru + (Number(curr.stokBaru) || 0),
      sisa: acc.sisa + (Number(curr.sisa) || 0),
      bahanBaku: acc.bahanBaku + (Number(curr.bahanBaku) || 0),
    }), { sisaKemarin: 0, stokBaru: 0, sisa: 0, bahanBaku: 0 });
  }, [draftData]);

  const handleProcessSave = async () => {
    if (draftData.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      const success = await onSave(selectedDate, draftData, penyesuaian, keterangan);
      if (success && window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-1.5 animate-in fade-in duration-500 text-left pb-10 px-1 relative">
      
      {/* HEADER STICKY */}
      <div className="sticky top-[-1px] z-30 bg-[#f8fafc] dark:bg-[#020617] pt-2 pb-2 space-y-2 border-b border-slate-100 dark:border-slate-900 -mx-4 px-4 shadow-sm">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Update Stock</span>
           </div>
           
           <div className="bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 shadow-sm min-h-[44px]">
              <CalendarIcon size={16} className="text-blue-500" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-black text-slate-800 dark:text-white outline-none text-[13px] cursor-pointer"
              />
           </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl flex border border-slate-200/50 dark:border-slate-700/30 gap-1">
          {[
            { id: 'baru', label: 'Stok Baru', icon: <PlusCircle size={14} />, activeColor: 'bg-green-500' },
            { id: 'sisa', label: 'Sisa Toko', icon: <Package size={14} />, activeColor: 'bg-blue-600' },
            { id: 'bahan', label: 'Bahan Baku', icon: <Droplets size={14} />, activeColor: 'bg-amber-500' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${
                subTab === tab.id ? `${tab.activeColor} text-white shadow-md active:scale-95` : 'text-slate-400'
              }`}
            >
              {tab.icon} <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KONTEN */}
      {subTab === 'bahan' ? (
        <RawMaterialView 
          materials={draftData} 
          handleInputChange={handleInputChange} 
          removeMaterial={removeMaterial}
        />
      ) : (
        <div className="grid gap-1 pt-1">
          {draftData.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2 flex justify-between items-center shadow-sm">
              <div className="flex-1 overflow-hidden">
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-[11px] tracking-tight uppercase leading-tight truncate mb-1">{item.jenisKue || item.nama}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-slate-400 uppercase font-bold leading-none mb-0.5">Lalu</span>
                    <span className="text-[11px] font-bold text-slate-500 leading-none">{item.sisaKemarin || 0}</span>
                  </div>
                  <ArrowRight size={8} className="text-slate-200 mt-1" />
                  <div className="flex flex-col">
                    <span className={`text-[7px] uppercase font-black leading-none mb-0.5 ${
                      subTab === 'baru' ? 'text-green-500' : 'text-blue-500'
                    }`}>
                      {subTab === 'baru' ? 'Baru' : 'Sisa'}
                    </span>
                    <span className={`text-[11px] font-black leading-none ${
                      subTab === 'baru' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {item[currentField] || 0}
                    </span>
                  </div>
                </div>
              </div>
              <input 
                type="number"
                inputMode="numeric"
                value={item[currentField] === 0 ? '' : item[currentField]}
                onChange={(e) => handleInputChange(item.id, e.target.value)}
                className={`w-12 h-9 rounded-lg text-center font-black text-base outline-none border-2 transition-all ${
                  subTab === 'baru' ? 'bg-slate-50 dark:bg-slate-800/50 text-green-600 border-transparent focus:border-green-500 focus:bg-white' : 
                  'bg-slate-50 dark:bg-slate-800/50 text-blue-600 border-transparent focus:border-blue-500 focus:bg-white'
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* FOOTER KONDISIONAL */}
      {subTab !== 'bahan' && (
        <>
          <div className="bg-slate-800 dark:bg-slate-950 border border-white/5 dark:border-slate-800 rounded-xl p-2.5 flex justify-between items-center mt-1 shadow-md">
            <div className="flex items-center gap-2">
              <Sigma size={14} className="text-blue-400" />
              <span className="text-[9px] font-black text-white uppercase italic">Total</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[7px] text-slate-400 block uppercase font-bold">Lalu</span>
                <p className="text-[11px] font-bold text-slate-300 leading-none">{totals.sisaKemarin}</p>
              </div>
              <div className={`px-3 py-1 rounded-lg border flex flex-col items-center ${
                subTab === 'baru' ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <span className={`text-[7px] uppercase font-black ${
                  subTab === 'baru' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {subTab === 'baru' ? 'Baru' : 'Sisa'}
                </span>
                <span className={`text-[14px] font-black leading-none mt-0.5 ${
                  subTab === 'baru' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {subTab === 'baru' ? totals.stokBaru : totals.sisa}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 mt-1">
            <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100/30 rounded-xl p-2 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <span className="text-[10px] font-black text-red-600 uppercase italic">BS / Rusak</span>
              </div>
              <input 
                type="number"
                inputMode="numeric"
                value={penyesuaian === 0 ? '' : penyesuaian}
                onChange={(e) => setPenyesuaian(Number(e.target.value))}
                className="w-10 bg-white dark:bg-slate-800 text-center font-black text-red-600 outline-none text-sm py-1 rounded-lg border border-red-100 min-h-[36px]"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5 text-amber-500">
                <MessageSquare size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Keterangan Catatan</span>
              </div>
              <textarea 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Tulis info tambahan..."
                className="bg-slate-50/50 dark:bg-slate-800/40 p-2 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-300 outline-none resize-none h-12 w-full border border-transparent focus:border-slate-100 dark:focus:border-slate-700"
              />
            </div>
          </div>
        </>
      )}

      {/* FLOATING ACTION BUTTON */}
      {subTab === 'bahan' && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 bg-amber-500 hover:bg-amber-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/40 active:scale-90 transition-all z-50 border-4 border-white dark:border-slate-900"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      )}

      {/* BUTTON SIMPAN */}
      <div className="pt-2 pb-6">
        <button 
          onClick={handleProcessSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 rounded-xl flex items-center justify-center gap-2 text-white font-black text-[12px] uppercase tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{isSaving ? "Menyimpan..." : "Simpan Laporan"}</span>
        </button>
      </div>

      <InputBahanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddBahan} 
      />
    </div>
  );
};

export default StockView;
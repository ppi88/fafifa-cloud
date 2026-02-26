import React, { useState, useEffect, useRef } from 'react';
import { Package, PlusCircle, Droplets, Calendar as CalendarIcon, Save, X, Loader2, ArrowRight, AlertTriangle, MessageSquare } from 'lucide-react';

const StockView = ({ data, onSave, selectedDate, setSelectedDate }) => {
  const [subTab, setSubTab] = useState('baru'); // 'baru' = Produksi, 'sisa' = Sisa Toko
  const [draftData, setDraftData] = useState([]);
  const [penyesuaian, setPenyesuaian] = useState(0); 
  const [keterangan, setKeterangan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const loadedDateRef = useRef(null);

  // Sinkronisasi data saat tanggal berubah atau data cloud masuk
  useEffect(() => {
    if (loadedDateRef.current !== selectedDate || draftData.length === 0) {
      if (data && data.length > 0) {
        setDraftData(data);
        // Ambil penyesuaian & keterangan dari baris pertama (karena nilainya global per tanggal)
        const firstRow = data[0];
        setPenyesuaian(Number(firstRow?.penyesuaian) || 0);
        setKeterangan(firstRow?.keterangan || '');
        loadedDateRef.current = selectedDate;
      }
    }
  }, [selectedDate, data]); 

  const getFieldByTab = () => {
    if (subTab === 'baru') return 'stokBaru';
    if (subTab === 'sisa') return 'sisa';
    return null;
  };

  const handleInputChange = (id, val) => {
    const field = getFieldByTab();
    if (!field) return;

    // Menangani input kosong agar tidak langsung jadi 0 saat user sedang menghapus
    const numVal = val === '' ? 0 : parseInt(val, 10);
    const newValue = isNaN(numVal) ? 0 : Math.max(0, numVal);

    setDraftData(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: newValue };
        // Hitung stok total otomatis: Sisa Kemarin + Produksi Baru
        const sisaLalu = Number(updatedItem.sisaKemarin) || 0;
        const stokBaru = Number(updatedItem.stokBaru) || 0;
        updatedItem.jumlah = sisaLalu + stokBaru;
        return updatedItem;
      }
      return item;
    }));
  };

  const handleProcessSave = async () => {
    if (draftData.length === 0) return;
    setIsSaving(true);
    try {
      // Kirim data lengkap ke App.js
      const success = await onSave(selectedDate, draftData, penyesuaian, keterangan);
      if (success) {
        // Feedback visual untuk browser HP
        if (window.navigator.vibrate) window.navigator.vibrate(50); 
      }
    } catch (error) {
      alert("❌ Gagal menyimpan. Periksa koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 text-left">
      
      {/* TABS MENU: Switch Mode Input */}
      <div className="px-2">
        <div className="bg-slate-200/50 dark:bg-slate-900/50 p-1.5 rounded-2xl flex border border-white/10 shadow-inner">
          {[
            { id: 'baru', label: 'Produksi', icon: <PlusCircle size={14} />, color: 'text-green-600' },
            { id: 'sisa', label: 'Sisa Toko', icon: <Package size={14} />, color: 'text-blue-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${
                subTab === tab.id 
                ? `bg-white dark:bg-slate-800 ${tab.color} shadow-sm border border-black/5` 
                : 'text-slate-400 opacity-60'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* METADATA: Tanggal, Penyesuaian, Keterangan */}
      <div className="px-2 space-y-2">
        {/* Input Tanggal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon size={16} className="text-blue-600" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-black text-slate-800 dark:text-white outline-none text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
            {/* Input Penyesuaian (BS/Rusak) */}
            <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">Penyesuaian</p>
                  <p className="text-[10px] text-slate-400 italic">BS / Rusak / Hilang</p>
                </div>
              </div>
              <input 
                type="number"
                inputMode="numeric"
                value={penyesuaian === 0 ? '' : penyesuaian}
                placeholder="0"
                onChange={(e) => setPenyesuaian(Number(e.target.value))}
                className="w-16 bg-transparent text-right font-black text-red-600 outline-none text-xl"
              />
            </div>

            {/* Input Keterangan Catatan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare size={14} className="text-blue-500" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Catatan Hari Ini</p>
              </div>
              <textarea 
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Pastel sisa 2 karena rusak di pengiriman..."
                className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-[12px] font-medium text-slate-600 dark:text-slate-300 outline-none resize-none h-16 w-full border border-transparent focus:border-blue-500/20 transition-all"
              />
            </div>
        </div>
      </div>

      {/* LIST KUE */}
      <div className="grid gap-2 px-2 pb-56">
        {draftData.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all">
            <div className="text-left">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{item.jenisKue}</h3>
              
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-400 font-bold uppercase">Lalu</span>
                  <span className="text-[11px] font-black text-slate-500">{item.sisaKemarin || 0}</span>
                </div>
                <ArrowRight size={10} className="text-slate-300" />
                <div className="flex flex-col">
                  <span className={`text-[7px] font-bold uppercase ${subTab === 'baru' ? 'text-green-500' : 'text-slate-400'}`}>Produksi</span>
                  <span className={`text-[11px] font-black ${subTab === 'baru' ? 'text-green-600' : 'text-slate-600'}`}>{item.stokBaru || 0}</span>
                </div>
                <div className="flex flex-col border-l border-slate-100 dark:border-slate-800 pl-3 ml-1">
                  <span className={`text-[7px] font-bold uppercase ${subTab === 'sisa' ? 'text-blue-500' : 'text-slate-400'}`}>Sisa</span>
                  <span className={`text-[11px] font-black ${subTab === 'sisa' ? 'text-blue-600' : 'text-slate-600'}`}>{item.sisa || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <input 
                type="number"
                inputMode="numeric"
                // Trik agar input kosong saat 0, memudahkan penghapusan di HP
                value={item[getFieldByTab()] === 0 ? '' : item[getFieldByTab()]}
                placeholder="0"
                onChange={(e) => handleInputChange(item.id, e.target.value)}
                className={`w-20 py-4 rounded-2xl text-center font-black text-lg outline-none transition-all shadow-inner ${
                  subTab === 'baru' 
                  ? 'bg-green-50 text-green-600 border border-green-200 focus:ring-2 focus:ring-green-500' 
                  : 'bg-blue-50 text-blue-600 border border-blue-200 focus:ring-2 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto pointer-events-none">
        <button 
          onClick={handleProcessSave}
          disabled={isSaving}
          className="w-full pointer-events-auto bg-blue-600 hover:bg-blue-700 py-5 rounded-[2rem] flex items-center justify-center gap-3 text-white font-black text-[13px] uppercase shadow-2xl shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? "Menyimpan ke Cloud..." : `Simpan Semua Data`}
        </button>
      </div>
    </div>
  );
};

export default StockView;
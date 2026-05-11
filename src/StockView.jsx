import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Package, PlusCircle, Calendar as CalendarIcon, Droplets } from 'lucide-react';
import { InputBahanModal } from './BahanBaku';
import StockFormModal from './StockFormModal';

const StockView = ({ data, onSave, selectedDate, setSelectedDate }) => {
  const [viewMode, setViewMode] = useState('none'); 
  const [draftData, setDraftData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const lastProcessedRef = useRef(""); 
  const URL_GOOGLE_SCRIPT = "https://script.google.com/macros/s/AKfycbwc7CictChQ1mE5ROd_5Pt0Z7bdRTy6c0-fPr6MyDj_NUNyctqGg_Tcz7BJylTQT_LhgA/exec";

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0];
  };

  // LOGIKA SINKRONISASI DATA (AUTO-SISA)
  useEffect(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return;

    const processKey = `${selectedDate}-${data.length}`;
    if (lastProcessedRef.current === processKey) return;

    try {
      const current = new Date(selectedDate);
      current.setDate(current.getDate() - 1);
      const yesterdayStr = formatDate(current);

      // Filter record kemarin & hari ini berdasarkan string tanggal
      const yesterdayRecords = data.filter(item => {
        const itemTgl = item.tanggal ? item.tanggal.toString().trim() : "";
        // Cek format dd/mm/yyyy atau yyyy-mm-dd
        return itemTgl.includes(yesterdayStr) || itemTgl === yesterdayStr;
      });

      // Ambil daftar jenis kue unik (Filter nama yang tidak valid)
      const uniqueProducts = [...new Set(data.filter(i => i.jenisKue && i.jenisKue !== "Tanpa Tanggal").map(item => item.jenisKue))];

      const cleanKueData = uniqueProducts.map(productName => {
        const existingDataToday = data.find(item => 
          item.jenisKue === productName && (item.tanggal?.toString().includes(selectedDate))
        );
        const matchingPrevDay = yesterdayRecords.find(y => y.jenisKue === productName);
        
        return {
          id: `kue-${productName.replace(/\s+/g, '')}`,
          jenisKue: productName,
          // Prioritas: Record hari ini > Record kemarin > 0
          sisaKemarin: matchingPrevDay ? (Number(matchingPrevDay.sisa) || 0) : (Number(existingDataToday?.sisaKemarin) || 0),
          stokBaru: Number(existingDataToday?.stokBaru) || 0,
          sisa: Number(existingDataToday?.sisa) || 0,
          penyesuaian: Number(existingDataToday?.penyesuaian) || 0,
          isBahan: false
        };
      });

      setDraftData(cleanKueData);
      const existingKeterangan = data.find(k => k.keterangan && k.keterangan !== "")?.keterangan;
      setKeterangan(existingKeterangan || '');
      
      lastProcessedRef.current = processKey;

    } catch (err) {
      console.error("Gagal sinkronisasi sisa:", err);
    }
  }, [data, selectedDate]);

  const handleInputChange = (id, val, fieldName = null) => {
    // Tentukan field mana yang diubah berdasarkan viewMode jika fieldName tidak dikirim
    const targetField = fieldName || (viewMode === 'baru' ? 'stokBaru' : 'sisa');
    const safeVal = val === '' ? 0 : parseFloat(val) || 0;
    
    setDraftData(prev => prev.map(item => 
      item.id === id ? { ...item, [targetField]: safeVal } : item
    ));
  };

  const totals = useMemo(() => {
    return draftData.reduce((acc, curr) => ({
      stokBaru: acc.stokBaru + (Number(curr.stokBaru) || 0),
      sisa: acc.sisa + (Number(curr.sisa) || 0),
    }), { stokBaru: 0, sisa: 0 });
  }, [draftData]);

  const handleProcessSave = async () => {
    if (draftData.length === 0 || isSaving) return;
    
    const confirmSave = window.confirm(`Simpan data untuk tanggal ${selectedDate}?`);
    if (!confirmSave) return;

    setIsSaving(true);
    try {
      const isBahanMode = viewMode === 'bahan';
      
      // Filter hanya data kue untuk STOK, atau data bahan untuk BAHAN_BAKU
      const finalData = draftData
        .filter(item => isBahanMode ? item.isBahan : !item.isBahan)
        .map(item => ({ 
            ...item, 
            tanggal: selectedDate,
            keterangan: isBahanMode ? item.keterangan : keterangan 
        }));

      const payload = {
        action: 'SAVE',
        tanggal: selectedDate,
        data: finalData,
        target: isBahanMode ? 'BAHAN_BAKU' : 'STOK'
      };

      await fetch(URL_GOOGLE_SCRIPT, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify(payload) 
      });

      alert("✅ Data Berhasil Terkirim ke Cloud!");
      setViewMode('none'); 
      if(onSave) onSave(); // Trigger refresh di App.jsx
      
    } catch (e) { 
      console.error(e);
      alert("❌ Gagal Simpan. Periksa koneksi internet."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617] text-left px-4 font-sans overflow-hidden">
      {/* HEADER SECTION */}
      <div className="pt-6 pb-4 space-y-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter italic">Fafifa <span className="text-blue-600">Cloud</span></h2>
            <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">● Live Database</p>
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <CalendarIcon size={14} className="text-blue-500" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="bg-transparent font-bold text-white outline-none text-[11px] w-28 cursor-pointer"
            />
          </div>
        </div>

        {/* MAIN NAVIGATION BUTTONS */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setViewMode('baru')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 active:scale-95 transition-all hover:bg-slate-800/50">
            <div className="p-2 bg-blue-600/20 text-blue-500 rounded-lg w-fit"><PlusCircle size={22} /></div>
            <p className="text-white font-black text-[11px] uppercase tracking-wide">Input Stok Baru</p>
          </button>
          <button onClick={() => setViewMode('sisa')} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 active:scale-95 transition-all hover:bg-slate-800/50">
            <div className="p-2 bg-amber-600/20 text-amber-500 rounded-lg w-fit"><Package size={22} /></div>
            <p className="text-white font-black text-[11px] uppercase tracking-wide">Lapor Sisa Rak</p>
          </button>
        </div>

        <button onClick={() => setViewMode('bahan')} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-slate-800/50">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-600/20 text-emerald-500 rounded-lg"><Droplets size={18} /></div>
                <span className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Log Belanja Bahan</span>
            </div>
            <span className="text-slate-700 text-[10px] font-black uppercase tracking-widest">Detail →</span>
        </button>
      </div>

      {/* MODAL INPUT FORM (STOK KUE) */}
      <StockFormModal 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        draftData={draftData} 
        handleInputChange={handleInputChange}
        totals={totals} 
        keterangan={keterangan} 
        setKeterangan={setKeterangan}
        handleProcessSave={handleProcessSave} 
        isSaving={isSaving}
        onOpenBahanModal={() => setIsModalOpen(true)}
      />

      {/* MODAL INPUT BAHAN (ADDITIONAL) */}
      <InputBahanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={(newB) => {
            setDraftData(prev => [
                {
                    ...newB, 
                    id: `bahan-${Date.now()}`, 
                    isBahan: true, 
                    jenisKue: newB.namaBahan, // Map nama bahan ke kolom jenisKue agar masuk Sheets
                    stokBaru: newB.jumlah,
                    sisa: 0,
                    harga: newB.totalHarga
                }, 
                ...prev
            ]);
            setIsModalOpen(false); // Otomatis tutup setelah tambah
        }} 
      />
    </div>
  );
};

export default StockView;
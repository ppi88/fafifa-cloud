import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, CalendarDays, RefreshCw, Archive, ChevronDown, PackageOpen } from 'lucide-react';
import ProductionForm from '../components/ProductionForm';
import ProductionTable from '../components/ProductionTable';
import SisaForm from '../../SisaForm';
import ConfirmDialog from '../components/ConfirmDialog';
import SuccessDialog from '../components/SuccessDialog';

const ProductionPage = ({ 
  archiveData = {}, 
  sisaArchive = {}, 
  priceList = {}, 
  bahanList = {}, 
  resepData = {}, 
  targetYieldData = {}, 
  normalizeDate, 
  selectedDate, 
  setSelectedDate, 
  formatTanggal, 
  fetchData, 
  masterKueList = [],
  onSaveProduksi,
  onSaveSisa, 
  onDeleteDate, 
  setIsSubViewOpen 
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSisaSheetOpen, setIsSisaSheetOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [filterMode, setFilterMode] = useState('harian'); 
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [activeAction, setActiveAction] = useState('stok');

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(selectedDate);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i); 

  const parseDateKey = useCallback((dateKey) => {
    if (!dateKey) return new Date(0);
    const parts = dateKey.split('/');
    return parts.length === 3 ? new Date(parts[2], parts[1] - 1, parts[0]) : new Date(0);
  }, []);

  const getFilterDateRange = useCallback(() => {
    if (filterMode === 'bulan') {
      const s = new Date(selectedYear, selectedMonthIdx, 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(selectedYear, Number(selectedMonthIdx) + 1, 0);
      e.setHours(23, 59, 59, 999);
      return { sDate: s, eDate: e };
    } else {
      const sParts = startDate.split('-');
      const s = new Date(sParts[0], Number(sParts[1]) - 1, sParts[2]);
      s.setHours(0, 0, 0, 0);
      const eParts = endDate.split('-');
      const e = new Date(eParts[0], Number(eParts[1]) - 1, eParts[2]);
      e.setHours(23, 59, 59, 999);
      return { sDate: s, eDate: e };
    }
  }, [filterMode, selectedMonthIdx, selectedYear, startDate, endDate]);

  const { idxArchive, idxSisa } = useMemo(() => {
    const iA = {}; const iS = {};
    Object.keys(archiveData).forEach(k => {
      iA[k] = {};
      (archiveData[k] || []).forEach(item => { iA[k][item.jenisKue] = item; });
    });
    Object.keys(sisaArchive).forEach(k => {
      iS[k] = {};
      (sisaArchive[k] || []).forEach(item => { iS[k][item.jenisKue] = item; });
    });
    return { idxArchive: iA, idxSisa: iS };
  }, [archiveData, sisaArchive]);

  const getCombinedKueListForDate = useCallback((dateStr) => {
    const tglKey = normalizeDate(dateStr);
    const currentTglObj = parseDateKey(tglKey);
    const yesterdayObj = new Date(currentTglObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayKey = normalizeDate(`${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`);

    const activeCakes = new Set(masterKueList);
    if (idxArchive[tglKey]) Object.keys(idxArchive[tglKey]).forEach(k => activeCakes.add(k));
    if (idxSisa[yesterdayKey]) Object.keys(idxSisa[yesterdayKey]).forEach(k => activeCakes.add(k));
    if (idxSisa[tglKey]) Object.keys(idxSisa[tglKey]).forEach(k => activeCakes.add(k));
    return Array.from(activeCakes);
  }, [normalizeDate, parseDateKey, masterKueList, idxArchive, idxSisa]);

  const getDailyData = useCallback((tglKey) => {
    const currentTglObj = parseDateKey(tglKey);
    const yesterdayObj = new Date(currentTglObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayKey = normalizeDate(`${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`);

    const historicalCakes = new Set(masterKueList);
    if (idxArchive[tglKey]) Object.keys(idxArchive[tglKey]).forEach(k => historicalCakes.add(k));
    if (idxSisa[yesterdayKey]) Object.keys(idxSisa[yesterdayKey]).forEach(k => historicalCakes.add(k));
    if (idxSisa[tglKey]) Object.keys(idxSisa[tglKey]).forEach(k => historicalCakes.add(k));

    const result = [];
    historicalCakes.forEach(namaKue => {
      const prodItem = idxArchive[tglKey]?.[namaKue];
      const sisaLalu = idxSisa[yesterdayKey]?.[namaKue];
      const sisaKini = idxSisa[tglKey]?.[namaKue];
      const hrgJual = (prodItem && prodItem.hargaJual !== undefined && prodItem.hargaJual !== "") ? Number(prodItem.hargaJual) : (Number(priceList[namaKue]) || 0);
      const sKemarin = sisaLalu ? Number(sisaLalu.sisa) : 0;
      const sBaru = prodItem ? Number(prodItem.stokBaru) : 0;
      const sAkhir = sisaKini ? Number(sisaKini.sisa) : 0;
      const rusakVal = sisaKini ? Number(sisaKini.rusak) : 0;

      if (masterKueList.includes(namaKue) || sKemarin > 0 || sBaru > 0 || sAkhir > 0 || rusakVal > 0) {
        result.push({
          jenisKue: namaKue,
          idTransaksi: prodItem?.idTransaksi || '-',
          sisaKemarin: sKemarin, 
          stokBaru: sBaru,
          sisaAkhir: sAkhir,
          rusak: rusakVal,
          hargaJual: hrgJual 
        });
      }
    });
    return result;
  }, [parseDateKey, normalizeDate, masterKueList, idxArchive, idxSisa, priceList]);

  const triggerDelete = (tgl) => {
    setDateToDelete(tgl);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!dateToDelete) return;
    try {
      await onDeleteDate(dateToDelete);
      setSuccessMsg(`Laporan tanggal ${dateToDelete} berhasil dibersihkan.`);
      setShowSuccess(true);
      setIsDeleteModalOpen(false);
    } catch (e) { alert("Gagal menghapus data!"); }
  };

  const handleFinalSave = async (dataDariForm) => {
    try { 
      await onSaveProduksi(dataDariForm); 
      setIsSheetOpen(false); 
      setSuccessMsg("Data produksi berhasil diperbarui.");
      setShowSuccess(true);
    } catch (error) { alert("Gagal simpan!"); }
  };

  const handleFinalSaveSisa = async (dataSisa) => {
    try { 
      await onSaveSisa(dataSisa); 
      setIsSisaSheetOpen(false); 
      setSuccessMsg("Tutup buku berhasil dilakukan.");
      setShowSuccess(true);
    } catch (error) { alert("Gagal simpan!"); }
  };

  const totalQtyPeriode = useMemo(() => {
    if (filterMode === 'all') {
      let total = 0;
      Object.entries(idxArchive).forEach(([_, itemsObj]) => {
        Object.values(itemsObj).forEach(item => { total += Number(item.stokBaru || 0); });
      });
      return total;
    }

    const { sDate, eDate } = getFilterDateRange();
    let total = 0;
    Object.entries(idxArchive).forEach(([dateKey, itemsObj]) => {
      const itemDate = parseDateKey(dateKey);
      if (itemDate >= sDate && itemDate <= eDate) {
        Object.values(itemsObj).forEach(item => {
          total += Number(item.stokBaru || 0);
        });
      }
    });
    return total;
  }, [idxArchive, getFilterDateRange, parseDateKey, filterMode]);

  const totalQtyHarian = useMemo(() => {
    const tglKey = normalizeDate(selectedDate);
    let total = 0;
    if (idxArchive[tglKey]) {
      Object.values(idxArchive[tglKey]).forEach(item => {
        total += Number(item.stokBaru || 0);
      });
    }
    return total;
  }, [idxArchive, selectedDate, normalizeDate]);

  const displayTotal = filterMode === 'harian' ? totalQtyHarian : totalQtyPeriode;
  const isDateFilled = totalQtyHarian > 0;
  const isSisaFilled = Object.keys(idxSisa[normalizeDate(selectedDate)] || {}).length > 0;

  const renderTables = useMemo(() => {
    if (filterMode === 'harian') {
      const tglKey = normalizeDate(selectedDate);
      return (
        <ProductionTable 
          date={selectedDate}
          data={getDailyData(tglKey)} 
          masterKueList={getCombinedKueListForDate(selectedDate)} 
          onDeleteAll={() => triggerDelete(selectedDate)} 
          onEditStok={() => { setActiveAction('stok'); setIsSheetOpen(true); }}
          onEditSisa={() => { setActiveAction('sisa'); setIsSisaSheetOpen(true); }}
          showSummary={true} 
        />
      );
    } else {
      let dateKeys = Object.keys(idxArchive);

      if (filterMode !== 'all') {
        const { sDate, eDate } = getFilterDateRange();
        dateKeys = dateKeys.filter(key => {
          const d = parseDateKey(key);
          return d >= sDate && d <= eDate;
        });
      }
      
      dateKeys.sort((a, b) => parseDateKey(b) - parseDateKey(a));

      if (dateKeys.length === 0) return <div className="text-center py-20 opacity-40 font-black uppercase tracking-widest text-xs text-slate-500">Belum Ada Data Produksi</div>;

      return dateKeys.map(tgl => {
        const parts = tgl.split('/');
        const tglStandard = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        return (
          <div key={tgl} className="mb-10 animate-in fade-in slide-in-from-bottom-2">
            <ProductionTable 
              date={tglStandard}
              data={getDailyData(tgl)} 
              masterKueList={getCombinedKueListForDate(tglStandard)} 
              onDeleteAll={() => triggerDelete(tglStandard)} 
              onEditStok={() => { setSelectedDate(tglStandard); setActiveAction('stok'); setIsSheetOpen(true); }}
              onEditSisa={() => { setSelectedDate(tglStandard); setActiveAction('sisa'); setIsSisaSheetOpen(true); }}
            />
          </div>
        );
      });
    }
  }, [filterMode, selectedDate, getDailyData, getCombinedKueListForDate, getFilterDateRange, idxArchive, parseDateKey, setSelectedDate]);

  useEffect(() => {
    if (setIsSubViewOpen) setIsSubViewOpen(isSheetOpen || isSisaSheetOpen || isDeleteModalOpen || showSuccess);
  }, [isSheetOpen, isSisaSheetOpen, isDeleteModalOpen, showSuccess, setIsSubViewOpen]);

  return (
    <div className="relative pb-48 font-sans w-full min-h-screen bg-[#f8fafc] dark:bg-[#020617]">
      
      {/* 🚀 SEAMLESS STICKY HEADER */}
      <div className="sticky top-0 z-[70] -mx-4 px-4 pt-2 pb-3 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-3">
        
        {/* Cover shadow */}
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]"></div>
        
        {/* Baris Judul & Informasi Total */}
        <div className="flex items-center justify-between relative z-10 pt-1">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase">
              Produksi
            </h1>
            <div className="h-1.5 w-8 bg-sky-500 mt-1.5 rounded-full shadow-sm shadow-sky-500/30"></div>
          </div>

          <div className={`text-right transition-all duration-500 ${displayTotal > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Prod</p>
            <p className="text-lg sm:text-xl font-black text-sky-600 dark:text-sky-400 tracking-tighter leading-none">
              {displayTotal} <span className="text-[10px] font-bold">Pcs</span>
            </p>
          </div>
        </div>

        {/* 🎛️ FILTER KONTROL (Menggunakan GRID Agar Merenggang Maksimal Penuh ke Kanan) */}
        <div className="grid grid-cols-[auto_1fr] gap-1.5 sm:gap-2 relative z-10 pt-1 w-full">
          
          {/* Segmented Control Mode (KIRI - Menyesuaikan Isi) */}
          <div className="bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-1 flex items-center border border-slate-200/60 dark:border-slate-700/50 h-[42px] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {['all', 'harian', 'bulan', 'periode'].map(mode => {
              const label = mode === 'all' ? 'ALL' : mode === 'harian' ? 'HARI' : mode === 'bulan' ? 'BULAN' : 'RENTANG';
              return (
                <button 
                  key={mode} 
                  type="button" 
                  onClick={() => setFilterMode(mode)} 
                  className={`px-2.5 sm:px-3 h-full text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center shrink-0 ${
                    filterMode === mode ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Kotak Input Waktu (KANAN - Memaksa Mengisi Seluruh Sisa Ruang Kanan Layar) */}
          <div className="flex items-center w-full min-w-0 bg-white dark:bg-slate-950 px-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[42px]">
            
            {filterMode === 'all' && (
              <div className="flex items-center justify-center w-full h-full gap-2 px-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">Master Database</span>
              </div>
            )}

            {filterMode === 'harian' && (
              <div className="flex items-center w-full h-full gap-1 px-1 min-w-0">
                <CalendarDays size={13} className="text-blue-500 shrink-0 hidden sm:block" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="flex-1 w-full h-full min-w-0 bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-200 outline-none text-center sm:text-left uppercase cursor-pointer" 
                />
              </div>
            )}

            {filterMode === 'bulan' && (
              <div className="flex items-center w-full h-full gap-1.5 min-w-0">
                <CalendarDays size={13} className="text-blue-500 shrink-0 hidden sm:block ml-1" />
                <div className="relative flex-[1.2] h-[28px] min-w-0">
                  <select 
                    value={selectedMonthIdx} 
                    onChange={(e) => setSelectedMonthIdx(e.target.value)} 
                    className="w-full h-full bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded border border-slate-200 dark:border-slate-700 pl-2 pr-6 appearance-none cursor-pointer truncate"
                  >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative flex-[0.8] h-[28px] min-w-0">
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)} 
                    className="w-full h-full bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded border border-slate-200 dark:border-slate-700 pl-2 pr-6 appearance-none cursor-pointer truncate"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {filterMode === 'periode' && (
              <div className="flex items-center w-full h-full gap-1 min-w-0">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="flex-1 w-full h-full min-w-0 bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none text-center uppercase cursor-pointer" 
                />
                <span className="text-slate-400 font-bold shrink-0">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="flex-1 w-full h-full min-w-0 bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none text-center uppercase cursor-pointer" 
                />
              </div>
            )}

          </div>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-6 pt-4">{renderTables}</div>

      {/* FLOATING ACTION BAR - Diturunkan ke bottom-[105px] dan icon refresh transparan */}
      <div className="fixed bottom-[105px] md:bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <div className="flex items-center gap-1 p-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          {filterMode === 'harian' ? (
            <>
              <button type="button" onClick={() => { setActiveAction('sisa'); setIsSisaSheetOpen(true); }} className={`relative flex items-center gap-2 px-5 h-12 rounded-full transition-all duration-300 active:scale-95 ${activeAction === 'sisa' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800'}`}>
                <Archive size={18} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest">Sisa</span>
                {isSisaFilled && <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${activeAction === 'sisa' ? 'bg-white' : 'bg-amber-500'}`}></div>}
              </button>

              {/* TOMBOL REFRESH (HARIAN) - IKON SAJA & TRANSPARAN SAAT IDLE */}
              <button type="button" onClick={() => { setActiveAction('refresh'); fetchData(); setTimeout(() => setActiveAction('stok'), 500); }} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 group ${activeAction === 'refresh' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'bg-transparent text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                <RefreshCw size={18} strokeWidth={2.5} className={activeAction === 'refresh' ? 'animate-spin' : 'group-hover:animate-spin'} />
              </button>

              <button type="button" onClick={() => { setActiveAction('stok'); setIsSheetOpen(true); }} className={`relative flex items-center gap-2 px-6 h-12 rounded-full transition-all duration-300 active:scale-95 ${activeAction === 'stok' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'}`}>
                <Plus size={18} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-widest">Stok</span>
                {isDateFilled && <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-white dark:border-slate-900 ${activeAction === 'stok' ? 'bg-emerald-400' : 'bg-blue-600'}`}></div>}
              </button>
            </>
          ) : (
            /* TOMBOL REFRESH (PERIODE) - IKON SAJA & TRANSPARAN SAAT IDLE */
            <button type="button" onClick={() => { setActiveAction('refresh-periode'); fetchData(); setTimeout(() => setActiveAction('stok'), 500); }} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 active:scale-95 group ${activeAction === 'refresh-periode' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg' : 'bg-transparent text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400'}`}>
              <RefreshCw size={18} strokeWidth={2.5} className={activeAction === 'refresh-periode' ? 'animate-spin' : 'group-hover:animate-spin'} />
            </button>
          )}
        </div>
      </div>

      {/* MODALS ACTION */}
      {isSheetOpen && <ProductionForm initialData={archiveData[normalizeDate(selectedDate)] || []} masterKueList={getCombinedKueListForDate(selectedDate)} archiveData={archiveData} normalizeDate={normalizeDate} selectedDate={selectedDate} onClose={() => setIsSheetOpen(false)} onSaveSuccess={handleFinalSave} />}
      {isSisaSheetOpen && <SisaForm initialData={sisaArchive[normalizeDate(selectedDate)] || []} masterKueList={getCombinedKueListForDate(selectedDate)} selectedDate={selectedDate} onClose={() => setIsSisaSheetOpen(false)} onSaveSuccess={handleFinalSaveSisa} />}
      <ConfirmDialog isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={executeDelete} title="Hapus Laporan?" message="Data produksi dan sisa pada tanggal ini akan dihapus permanen dari sistem." />
      <SuccessDialog isOpen={showSuccess} onClose={() => setShowSuccess(false)} message={successMsg} />
    </div>
  );
};

export default ProductionPage;
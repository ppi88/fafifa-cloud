import React, { useState, useEffect, useCallback } from 'react';
import { Home, ShoppingCart, Package, FileText, PieChart, Bell, TrendingUp } from 'lucide-react';
import ReportTable from './ReportTable';
import BottomNav from './BottomNav';
import StockView from './StockView';

// URL Apps Script Anda
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc7CictChQ1mE5ROd_5Pt0Z7bdRTy6c0-fPr6MyDj_NUNyctqGg_Tcz7BJylTQT_LhgA/exec";

function App() {
  const [activeTab, setActiveTab] = useState('Laporan');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [archiveData, setArchiveData] = useState({});
  const [loading, setLoading] = useState(true);

  // --- HELPER FUNCTIONS ---
  const formatTanggalIndonesia = (dateStr) => {
    if (!dateStr) return "";
    try {
      let date;
      if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        date = new Date(y, m - 1, d);
      } else {
        date = new Date(dateStr);
      }
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(date);
    } catch (e) { return dateStr; }
  };

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes('-')) {
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(d)}/${parseInt(m)}/${y}`;
    }
    return dateStr;
  };

  const parseSheetDate = (sheetDate) => {
    if (!sheetDate || !sheetDate.includes('/')) return new Date();
    const [d, m, y] = sheetDate.split('/');
    return new Date(y, m - 1, d);
  };

  // --- LOGIKA UTAMA SINKRONISASI (ESTAFET STOK) ---
  const processChainedData = (groupedData) => {
    const sortedDates = Object.keys(groupedData).sort((a, b) => parseSheetDate(a) - parseSheetDate(b));
    const trackerSisa = {};
    const chainedData = {};

    sortedDates.forEach(dateStr => {
      chainedData[dateStr] = groupedData[dateStr].map(item => {
        const namaKue = item.jenisKue;
        const sisaLalu = trackerSisa[namaKue] !== undefined 
          ? trackerSisa[namaKue] 
          : (Number(item.sisaKemarin) || 0);

        trackerSisa[namaKue] = Number(item.sisa) || 0;

        return {
          ...item,
          sisaKemarin: sisaLalu,
          jumlah: sisaLalu + (Number(item.stokBaru) || 0)
        };
      });
    });

    return chainedData;
  };

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      
      const grouped = data.reduce((acc, curr) => {
        let tglKey = curr.tanggal ? curr.tanggal.toString().trim() : "Tanpa Tanggal";
        if (!acc[tglKey]) acc[tglKey] = [];
        acc[tglKey].push(curr);
        return acc;
      }, {});
      
      setArchiveData(grouped);
    } catch (err) { 
      console.error("Gagal mengambil data:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  const updateStockData = async (date, updatedList, penyesuaianValue = 0, catatan = "") => {
    const finalData = updatedList.map(item => ({
      ...item,
      tanggal: normalizeDate(date),
      sisaKemarin: Number(item.sisaKemarin) || 0,
      stokBaru: Number(item.stokBaru) || 0,
      sisa: Number(item.sisa) || 0,
      jumlah: (Number(item.sisaKemarin) || 0) + (Number(item.stokBaru) || 0),
      penyesuaian: Number(penyesuaianValue) || 0,
      keterangan: catatan 
    }));

    try {
      setArchiveData(prev => ({ ...prev, [normalizeDate(date)]: finalData }));
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(finalData),
      });
      setTimeout(fetchData, 1500); 
      return true;
    } catch (err) { 
      alert("Koneksi gagal.");
      return false; 
    }
  };

  const deleteData = async (dateStr) => {
    if (!window.confirm(`Hapus permanen data ${formatTanggalIndonesia(dateStr)}?`)) return;
    setLoading(true);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'DELETE', tanggal: dateStr }),
      });
      fetchData();
    } catch (err) { 
      alert("Gagal menghapus."); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const menuItems = [
    { id: 'Home', icon: <Home size={22} />, label: 'Home' },
    { id: 'Transaksi', icon: <ShoppingCart size={22} />, label: 'Order' },
    { id: 'Stok', icon: <Package size={22} />, label: 'Stock' },
    { id: 'Laporan', icon: <FileText size={22} />, label: 'Report' },
    { id: 'Analisa', icon: <PieChart size={22} />, label: 'Stats' },
  ];

  const renderContent = () => {
    const defaultList = [
      { id: 1, jenisKue: 'Bolu Kukus', sisaKemarin: 0, stokBaru: 0, sisa: 0, unit: 'Biji' },
      { id: 2, jenisKue: 'Roti Gabin', sisaKemarin: 0, stokBaru: 0, sisa: 0, unit: 'Mika' },
      { id: 3, jenisKue: 'Pastel', sisaKemarin: 0, stokBaru: 0, sisa: 0, unit: 'Biji' },
      { id: 4, jenisKue: 'M. Telur', sisaKemarin: 0, stokBaru: 0, sisa: 0, unit: 'Biji' },
      { id: 5, jenisKue: 'Lain-Lain', sisaKemarin: 0, stokBaru: 0, sisa: 0, unit: 'Biji' },
    ];

    const getAutoStock = () => {
      const targetDateStr = normalizeDate(selectedDate);
      const existingData = archiveData[targetDateStr];
      
      const previousDates = Object.keys(archiveData)
        .filter(d => parseSheetDate(d) < parseSheetDate(targetDateStr))
        .sort((a, b) => parseSheetDate(b) - parseSheetDate(a));
      
      const lastReport = previousDates.length > 0 ? archiveData[previousDates[0]] : null;

      return defaultList.map(item => {
        const prevItem = lastReport ? lastReport.find(p => p.jenisKue === item.jenisKue) : null;
        const autoSisaKemarin = prevItem ? (Number(prevItem.sisa) || 0) : 0;
        const currentEntry = existingData ? existingData.find(c => c.jenisKue === item.jenisKue) : null;

        return {
          ...item,
          sisaKemarin: autoSisaKemarin,
          stokBaru: currentEntry ? (Number(currentEntry.stokBaru) || 0) : 0,
          sisa: currentEntry ? (Number(currentEntry.sisa) || 0) : 0,
          jumlah: autoSisaKemarin + (currentEntry ? Number(currentEntry.stokBaru) : 0),
          penyesuaian: currentEntry ? (Number(currentEntry.penyesuaian) || 0) : 0,
          keterangan: currentEntry ? (currentEntry.keterangan || "") : ""
        };
      });
    };

    const currentData = getAutoStock();

    switch (activeTab) {
      case 'Laporan':
        const chainedArchive = processChainedData(archiveData);
        const allDates = Object.keys(chainedArchive).sort((a, b) => parseSheetDate(b) - parseSheetDate(a));
        
        return (
          /* Fokus perubahan: space-y-4 & pt-0 */
          <div className="space-y-4 animate-in fade-in duration-700">
            <div className="px-2 flex justify-between items-end pt-0">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase italic leading-none">Laporan Cloud</h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase mt-2 tracking-widest flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                  {loading ? "Sinkronisasi..." : "Terhubung"}
                </p>
              </div>
              <button onClick={fetchData} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-blue-600 shadow-sm active:scale-90 transition-all">
                <TrendingUp size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="space-y-4">
              {allDates.length > 0 ? (
                allDates.map((dateStr) => (
                  <ReportTable 
                    key={dateStr} 
                    tanggal={formatTanggalIndonesia(dateStr)} 
                    isToday={dateStr === normalizeDate(selectedDate)}
                    data={chainedArchive[dateStr]}
                    onDelete={() => deleteData(dateStr)} 
                  />
                ))
              ) : (
                <div className="text-center py-24 opacity-30">
                  <FileText size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Belum Ada Data</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'Stok':
        return (
          /* Fokus perubahan: space-y-1 & pt-0 */
          <div className="space-y-1">
            <div className="px-2 pt-0">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Entry Manager</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 italic leading-tight">{formatTanggalIndonesia(selectedDate)}</h3>
            </div>
            <StockView 
              key={selectedDate} 
              data={currentData} 
              onSave={updateStockData} 
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          </div>
        );

      case 'Home':
        const summaryStok = currentData.reduce((a, b) => a + (Number(b.sisaKemarin) + Number(b.stokBaru)), 0);
        const summarySisa = currentData.reduce((a, b) => a + Number(b.sisa), 0);
        return (
          <div className="space-y-6 px-2 pt-0 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase italic">Dashboard</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-blue-500/30">
                <TrendingUp size={28} className="mb-4 opacity-50" />
                <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Siap Jual</p>
                <h3 className="text-3xl font-black">{summaryStok}</h3>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
                <Package size={28} className="mb-4 text-blue-500 opacity-50" />
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Sisa Rak</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{summarySisa}</h3>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="mt-40 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Segera Hadir</div>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#020617] font-sans tracking-tight">
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 py-4 border-b border-slate-100 dark:border-slate-900 pt-[env(safe-area-inset-top,1rem)]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">AF</div>
            <div>
              <h1 className="text-base font-black text-slate-800 dark:text-slate-100 italic tracking-tighter">Fafifa <span className="text-blue-600">Cloud</span></h1>
              <p className="text-[9px] text-green-500 font-black uppercase tracking-[0.2em]">● Live Database</p>
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Bell size={18} className="text-slate-400" />
          </div>
        </div>
      </header>
      <div className="max-w-md mx-auto relative">
        {/* PERUBAHAN UTAMA: Ubah pt-28 menjadi pt-[72px] (melekat pada header) */}
        <main className="p-4 pt-[72px] pb-40">
          {renderContent()}
        </main>
      </div>
      <BottomNav menuItems={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
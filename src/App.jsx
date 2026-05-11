import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, ChefHat, Package, FileText, Grip, Activity, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 

// Import Komponen & Pages
import Header from './components/Header'; 
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import ProductionPage from './pages/ProductionPage';
import AnalisaPage from './pages/AnalisaPage'; 
import ReportPage from './pages/ReportPage';
import MasterPage from './pages/MasterPage'; 
import VisitInput from './components/VisitInput'; 

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyk7m7xIMnHRIsW8nDcouYcq7OvzyftceSbprOvB8lamBshKT3GxN55jVeRD8JeQ4Bb/exec";

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [renderedTabs, setRenderedTabs] = useState({ Home: true }); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [archiveData, setArchiveData] = useState({});
  const [sisaArchive, setSisaArchive] = useState({}); 
  const [priceList, setPriceList] = useState({});
  const [bahanList, setBahanList] = useState({}); 
  const [resepData, setResepData] = useState({}); 
  const [targetYieldData, setTargetYieldData] = useState({}); 
  const [hiddenKueList, setHiddenKueList] = useState([]); 
  const [visitData, setVisitData] = useState([]); 
  
  const [loading, setLoading] = useState(true);
  const [isSubViewOpen, setIsSubViewOpen] = useState(false);
  
  // State untuk Dialog Konfirmasi Keluar Aplikasi
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Reference cerdas untuk selalu menangkap state terbaru di event listener
  const appStateRef = useRef({ activeTab, isSubViewOpen, showExitConfirm });

  useEffect(() => {
    setRenderedTabs(prev => ({ ...prev, [activeTab]: true }));
  }, [activeTab]);

  // Selalu perbarui ref dengan state terkini
  useEffect(() => {
    appStateRef.current = { activeTab, isSubViewOpen, showExitConfirm };
  }, [activeTab, isSubViewOpen, showExitConfirm]);

  // 🔥 ENGINE DOUBLE BACK & SMART ROUTING ANTI-JEBOL 🔥
  useEffect(() => {
    // 1. Suntikkan 1 riwayat palsu saat aplikasi baru pertama dibuka
    window.history.pushState({ page: 'fafifa-app' }, '', window.location.href);

    const handlePopState = (event) => {
      const state = appStateRef.current;

      // Kasus A: Jika Form Lembar Data (Sisa/Produksi) sedang terbuka
      if (state.isSubViewOpen) {
        window.history.pushState({ page: 'fafifa-app' }, '', window.location.href);
        return;
      }

      // Kasus B: Jika bukan di halaman Beranda (Home)
      if (state.activeTab !== 'Home') {
        setActiveTab('Home');
        window.history.pushState({ page: 'fafifa-app' }, '', window.location.href);
        return;
      }

      // Kasus C: Sudah di Home, TAPI dialog keluar belum muncul
      if (!state.showExitConfirm) {
        setShowExitConfirm(true);
        window.history.pushState({ page: 'fafifa-app' }, '', window.location.href);
        return;
      }

      // Kasus D: Dialog keluar sudah muncul, dan ditekan BACK lagi (DOUBLE BACK)
      if (state.showExitConfirm) {
        setShowExitConfirm(false);
        window.history.back(); // Mundur satu langkah murni untuk keluar
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // Cukup dijalankan sekali saat aplikasi dimuat berkat bantuan useRef

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const formatTanggalIndonesia = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(d);
    } catch (e) { return dateStr; }
  };

  const sendToSheets = async (action, data) => {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data })
      });
      const resJson = await response.json();
      if (resJson.status === 'Error') throw new Error(resJson.message);
      return resJson;
    } catch (err) {
      console.error(`Gagal: ${action}`, err);
      throw err;
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?t=${new Date().getTime()}`);
      const resJson = await response.json();
      
      if (resJson.prices) {
        const pObj = resJson.prices.reduce((acc, curr) => {
          acc[curr.jenisKue] = Number(curr.harga) || 0;
          return acc;
        }, {});
        setPriceList(pObj);
      }

      if (resJson.bahan) {
        const bObj = resJson.bahan.reduce((acc, curr) => {
          acc[curr.namaBahan] = { harga: Number(curr.harga) || 0, kuantitas: Number(curr.kuantitas) || 1, satuan: curr.satuan };
          return acc;
        }, {});
        setBahanList(bObj);
      }

      if (resJson.resep) {
        const rObj = resJson.resep.reduce((acc, curr) => {
          if (!acc[curr.namaKue]) acc[curr.namaKue] = [];
          acc[curr.namaKue].push({ namaBahan: curr.namaBahan, qty: Number(curr.qty) });
          return acc;
        }, {});
        setResepData(rObj);
      }

      const defaultYields = { GABIN: 28, PASTEL: 10, MTELUR: 10, BOLUKUKUS: 10, PASTELMINI: 5 };
      if (resJson.yields) {
        const yObj = resJson.yields.reduce((acc, curr) => {
          acc[curr.namaKue] = Number(curr.yield) || 1;
          return acc;
        }, {});
        setTargetYieldData({ ...defaultYields, ...yObj });
      } else {
        setTargetYieldData(defaultYields);
      }

      setHiddenKueList(resJson.hiddenKue || []);
      setVisitData(resJson.kunjungan || []);

      const rawData = resJson.data || [];
      const grouped = rawData.reduce((acc, curr) => {
        if (!curr.tanggal) return acc;
        let tglKey = normalizeDate(curr.tanggal);
        if (!acc[tglKey]) acc[tglKey] = [];
        acc[tglKey].push(curr);
        return acc;
      }, {});
      setArchiveData(grouped);

      const rawSisa = resJson.sisa || [];
      const groupedSisa = rawSisa.reduce((acc, curr) => {
        if (!curr.tanggal) return acc;
        let tglKey = normalizeDate(curr.tanggal);
        if (!acc[tglKey]) acc[tglKey] = [];
        acc[tglKey].push(curr);
        return acc;
      }, {});
      setSisaArchive(groupedSisa);

    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSaveProduksi = async (dataProduksi) => {
    setLoading(true);
    try {
      const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
      const dataArray = Array.isArray(dataProduksi) ? dataProduksi : [dataProduksi];

      const finalData = dataArray.map(curr => {
        const kue = curr.jenisKue;
        let hrgJual = Array.isArray(priceList) ? (priceList.find(x => x.jenisKue === kue)?.harga || 0) : (priceList[kue] || 0);
        let resepKue = Array.isArray(resepData) ? resepData.filter(x => x.namaKue === kue) : (resepData[kue] || []);

        const modalResep = resepKue.reduce((sum, item) => {
          let b = Array.isArray(bahanList) ? bahanList.find(x => x.namaBahan === item.namaBahan) : bahanList[item.namaBahan];
          let hargaBhn = b ? Number(b.harga) : 0;
          let qtyBhn = b ? (Number(b.kuantitas) || 1) : 1;
          return sum + (hargaBhn / qtyBhn) * item.qty;
        }, 0);

        const currentYield = targetYieldData[kue] || targetYieldData[cleanKey(kue)] || 1;
        const modalPcs = modalResep / currentYield;

        return { ...curr, modalPcs: isNaN(modalPcs) ? 0 : modalPcs, hargaJual: isNaN(hrgJual) ? 0 : hrgJual };
      });

      await sendToSheets('ADD_PRODUKSI', finalData);
      await fetchData(); 
      return true;
    } catch (e) { 
      setLoading(false);
      throw e; 
    }
  };

  const onSaveSisa = async (dataSisa) => {
    setLoading(true);
    try { await sendToSheets('ADD_SISA', dataSisa); await fetchData(); return true; } 
    catch (e) { setLoading(false); throw e; }
  };

  const onDeleteDate = async (tanggalMentah) => {
    if (!window.confirm(`Hapus SELURUH data pada tanggal ${tanggalMentah}?`)) return;
    setLoading(true);
    try { await sendToSheets('DELETE_BY_DATE', { tanggal: tanggalMentah }); await fetchData(); } 
    catch (e) { alert("Gagal menghapus data harian!"); setLoading(false); }
  };

  const onAddNewKue = async (newKue) => {
    setLoading(true); setPriceList(prev => ({ ...prev, [newKue.jenisKue]: Number(newKue.harga) }));
    try { await sendToSheets('ADD_NEW_KUE', newKue); await fetchData(); } catch (e) { fetchData(); }
  };

  const onUpdateKue = async (oldName, updatedData) => {
    setLoading(true);
    const newPriceList = { ...priceList };
    if (oldName !== updatedData.jenisKue) delete newPriceList[oldName];
    newPriceList[updatedData.jenisKue] = Number(updatedData.harga);
    setPriceList(newPriceList);
    try { await sendToSheets('UPDATE_KUE', { oldJenisKue: oldName, jenisKue: updatedData.jenisKue, harga: Number(updatedData.harga) }); await fetchData(); } 
    catch (e) { fetchData(); }
  };

  const onDeleteKue = async (namaKue) => {
    setLoading(true); const newPriceList = { ...priceList }; delete newPriceList[namaKue]; setPriceList(newPriceList);
    try { await sendToSheets('DELETE_KUE', { jenisKue: namaKue }); await fetchData(); } catch (e) { fetchData(); }
  };

  const onToggleHideKue = async (namaKue, isHidden) => {
    setLoading(true); setHiddenKueList(prev => isHidden ? [...prev, namaKue] : prev.filter(k => k !== namaKue));
    try { await sendToSheets('TOGGLE_HIDE_KUE', { jenisKue: namaKue, isHidden }); await fetchData(); } catch (e) { fetchData(); }
  };

  const onAddNewBahan = async (newBahan) => {
    setLoading(true);
    setBahanList(prev => ({ ...prev, [newBahan.namaBahan]: { harga: Number(newBahan.harga), kuantitas: Number(newBahan.kuantitas), satuan: newBahan.satuan } }));
    try { await sendToSheets('ADD_BAHAN', newBahan); await fetchData(); } catch (e) { fetchData(); }
  };

  const onUpdateBahan = async (oldName, updatedData) => {
    setLoading(true);
    const newBahanList = { ...bahanList };
    if (oldName !== updatedData.namaBahan) delete newBahanList[oldName];
    newBahanList[updatedData.namaBahan] = { harga: Number(updatedData.harga), kuantitas: Number(updatedData.kuantitas), satuan: updatedData.satuan };
    setBahanList(newBahanList);
    try { await sendToSheets('UPDATE_BAHAN', { oldNamaBahan: oldName, namaBahan: updatedData.namaBahan, harga: Number(updatedData.harga), kuantitas: Number(updatedData.kuantitas), satuan: updatedData.satuan }); await fetchData(); } 
    catch (e) { fetchData(); }
  };

  const onDeleteBahan = async (namaBahan) => {
    setLoading(true); const newBahanList = { ...bahanList }; delete newBahanList[namaBahan]; setBahanList(newBahanList);
    try { await sendToSheets('DELETE_BAHAN', { namaBahan }); await fetchData(); } catch (e) { fetchData(); }
  };

  const onSaveResep = async (namaKue, resepArray, yieldResult = 1) => {
    setLoading(true); setResepData(prev => ({ ...prev, [namaKue]: resepArray })); setTargetYieldData(prev => ({ ...prev, [namaKue]: yieldResult }));
    try { await sendToSheets('SAVE_RESEP', { namaKue, resep: resepArray, targetYield: yieldResult }); await fetchData(); } catch (e) { fetchData(); }
  };

  const onSaveKunjungan = async (dataK) => {
    setLoading(true);
    try { await sendToSheets('ADD_KUNJUNGAN', dataK); await fetchData(); return true; } 
    catch (e) { alert("Gagal catat kunjungan!"); setLoading(false); return false; }
  };

  const commonProps = {
    archiveData, sisaArchive, normalizeDate, selectedDate, setSelectedDate, fetchData, 
    loading, priceList, formatTanggal: formatTanggalIndonesia,
    masterKueList: Object.keys(priceList).filter(kue => !hiddenKueList.includes(kue)),
    onAddNewKue, onDeleteKue, onUpdateKue, onSaveProduksi, onSaveSisa, onDeleteDate,
    setIsSubViewOpen, openPriceModal: () => setActiveTab('Master'), bahanList, 
    onAddNewBahan, onDeleteBahan, onUpdateBahan, resepData, targetYieldData, 
    onSaveResep, hiddenKueList, onToggleHideKue, visitData, 
  };

  const menuItems = [
    { id: 'Home', icon: <Home size={22} />, label: 'Beranda' },
    { id: 'Produksi', icon: <ChefHat size={22} />, label: 'Produksi' },
    { id: 'Laporan', icon: <FileText size={22} />, label: 'Laporan' }, 
    { id: 'Analisa', icon: <Activity size={22} />, label: 'Analisa' }, 
  ];

  return (
    <div className="fixed inset-0 flex w-full h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] font-sans tracking-tight overflow-hidden transition-colors duration-500 transform-gpu">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-[100]">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Activity size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">FaFiFa<span className="text-sky-500">_Report</span></h1>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-[0.2em]">● Live Database</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all font-bold ${activeTab === item.id ? 'bg-blue-600 shadow-lg text-white' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
              {item.icon} <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
          
          <button onClick={() => setActiveTab('Master')} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold mt-8 border border-dashed transition-all ${activeTab === 'Master' ? 'bg-slate-800 text-blue-400 border-blue-500' : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
            <Grip size={22} /> <span className="text-sm tracking-wide">Pusat Kendali</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* HEADER UTAMA */}
        <Header activeTab={activeTab} setActiveTab={setActiveTab} loading={loading} />

        <main className={`flex-1 overflow-y-auto custom-scrollbar md:pt-6 pb-32 md:pb-12 max-w-5xl w-full mx-auto ${activeTab === 'Home' ? 'pt-[64px] px-0' : 'pt-[68px] px-4'}`}>
          {renderedTabs['Home'] && (
            <div className={activeTab === 'Home' ? 'block' : 'hidden'}>
              <Dashboard {...commonProps} />
            </div>
          )}
          {renderedTabs['Produksi'] && (
            <div className={activeTab === 'Produksi' ? 'block' : 'hidden'}>
              <ProductionPage {...commonProps} />
            </div>
          )}
          {renderedTabs['Laporan'] && (
            <div className={activeTab === 'Laporan' ? 'block' : 'hidden'}>
              <ReportPage {...commonProps} />
            </div>
          )}
          {renderedTabs['Analisa'] && (
            <div className={activeTab === 'Analisa' ? 'block' : 'hidden'}>
              <AnalisaPage {...commonProps} />
            </div>
          )}
          {renderedTabs['Master'] && (
            <div className={activeTab === 'Master' ? 'block' : 'hidden'}>
              <MasterPage {...commonProps} setActiveTab={setActiveTab} />
            </div>
          )}
        </main>
      </div>

      <BottomNav menuItems={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />
      <VisitInput onSave={onSaveKunjungan} />

      {/* OVERLAY LOADING */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 dark:bg-black/50 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-[3px] border-white/40 dark:border-slate-600/50"></div>
                <div className="w-12 h-12 rounded-full border-[3px] border-sky-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Activity size={18} className="text-sky-500 absolute animate-pulse" />
              </div>
              <p className="text-[10px] font-black tracking-widest text-slate-800 dark:text-slate-100 uppercase drop-shadow-md">
                Menyinkronkan
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔥 KOTAK DIALOG KELUAR APLIKASI 🔥 */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm px-6"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <LogOut size={32} strokeWidth={2.5} className="-ml-1" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Keluar Aplikasi?</h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Anda yakin ingin keluar dari FaFiFa Report? <br/><span className="text-rose-500">Tekan "Kembali" sekali lagi untuk keluar langsung.</span>
                </p>
                
                <div className="flex w-full gap-3">
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      // Mengembalikan riwayat agar back button sistem kembali netral
                      window.history.pushState({ page: 'fafifa-app' }, '', window.location.href);
                    }}
                    className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      setShowExitConfirm(false);
                      window.history.go(-2); // Paksa exit browser/PWA jika ditekan tombol "Keluar"
                    }}
                    className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
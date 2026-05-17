import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { Home, ChefHat, Package, FileText, Grip, Activity, LogOut, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; 

// Core Components (Loaded Instantly)
import Header from './components/Header'; 
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import ProductionPage from './pages/ProductionPage';
import VisitInput from './components/VisitInput'; 

// LAZY LOADING COMPONENT
const ReportPage = lazy(() => import('./pages/ReportPage'));
const AnalisaPage = lazy(() => import('./pages/AnalisaPage'));
const MasterPage = lazy(() => import('./pages/MasterPage'));

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyk7m7xIMnHRIsW8nDcouYcq7OvzyftceSbprOvB8lamBshKT3GxN55jVeRD8JeQ4Bb/exec";

// ============================================================================
// ⚙️ STATIC PRODUCTION UTILS & NON-BLOCKING CACHE 
// ============================================================================

const parseSafeDate = (str) => {
  if (!str) return null;
  const s = String(str).trim();
  if (s.includes('T')) {
    const [datePart] = s.split('T');
    const [y, m, d] = datePart.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const [y, m, d] = s.includes('-') ? s.split('-') : s.includes('/') ? s.split('/').reverse() : [];
  return y ? new Date(Number(y), Number(m) - 1, Number(d)) : new Date(s);
};

const saveChunkedCache = (key, data) => {
  const task = () => {
    try {
      localStorage.setItem(`fafifa_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`[Cache Warning] LocalStorage penuh:`, e);
    }
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(task);
  else setTimeout(task, 0);
};

const fetchWithTimeout = async (url, options = {}, timeout = 25000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

const TabLoader = () => (
  <div className="flex h-48 w-full items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
    <Loader2 className="animate-spin" size={20} />
    <span className="text-xs font-black uppercase tracking-widest">Membuka Tab...</span>
  </div>
);

// ============================================================================
// 🧠 ULTIMATE HIGH-PERFORMANCE INTERFACE
// ============================================================================
function App() {
  const [activeTab, setActiveTab] = useState('Home');

  // State Data Core
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]); 
  const [archiveData, setArchiveData] = useState({});
  const [sisaArchive, setSisaArchive] = useState({}); 
  const [priceList, setPriceList] = useState({});
  const [bahanList, setBahanList] = useState({}); 
  const [resepData, setResepData] = useState({}); 
  const [targetYieldData, setTargetYieldData] = useState({}); 
  const [hiddenKueList, setHiddenKueList] = useState([]); 
  const [visitData, setVisitData] = useState([]); 
  
  // Granular Blocking States
  const [isSyncing, setIsSyncing] = useState(false);   
  const [isGlobalBlocking, setIsGlobalBlocking] = useState(false); 
  
  const [isSubViewOpen, setIsSubViewOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const appStateRef = useRef({ activeTab, isSubViewOpen, showExitConfirm });
  
  const dataCoreRef = useRef({});
  useEffect(() => {
    dataCoreRef.current = { priceList, archiveData, sisaArchive, bahanList, resepData, targetYieldData };
  }, [priceList, archiveData, sisaArchive, bahanList, resepData, targetYieldData]);

  useEffect(() => {
    appStateRef.current = { activeTab, isSubViewOpen, showExitConfirm };
  }, [activeTab, isSubViewOpen, showExitConfirm]);

  // Anti-Spam History Sentinel dengan ReplaceState
  useEffect(() => {
    window.history.replaceState({ page: 'fafifa-main' }, '', window.location.href);

    const handlePopState = () => {
      const state = appStateRef.current;
      if (state.isSubViewOpen) {
        window.history.replaceState({ page: 'fafifa-main' }, '', window.location.href);
        return;
      }
      if (state.activeTab !== 'Home') {
        setActiveTab('Home');
        window.history.replaceState({ page: 'fafifa-main' }, '', window.location.href);
        return;
      }
      if (!state.showExitConfirm) {
        setShowExitConfirm(true);
        window.history.replaceState({ page: 'fafifa-main' }, '', window.location.href);
        return;
      }
      if (state.showExitConfirm) {
        setShowExitConfirm(false);
        window.history.back(); 
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const normalizeDate = useCallback((dateStr) => {
    if (!dateStr) return "";
    const d = parseSafeDate(dateStr);
    return d ? `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` : dateStr;
  }, []);

  const formatTanggalIndonesia = useCallback((dateStr) => {
    if (!dateStr) return "";
    try {
      const d = parseSafeDate(dateStr);
      if (!d) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(d);
    } catch (e) { return dateStr; }
  }, []);

  // Non-Blocking Chunked Local Storage Loader 
  useEffect(() => {
    const loadCacheClusterAsync = () => {
      try {
        const cPrices = localStorage.getItem('fafifa_prices');
        const cArchive = localStorage.getItem('fafifa_archive');
        const cSisa = localStorage.getItem('fafifa_sisa');
        const cMetadata = localStorage.getItem('fafifa_metadata');

        if (cPrices) setPriceList(JSON.parse(cPrices));
        if (cArchive) setArchiveData(JSON.parse(cArchive));
        if (cSisa) setSisaArchive(JSON.parse(cSisa));
        if (cMetadata) {
          const meta = JSON.parse(cMetadata);
          setBahanList(meta.bahanList || {});
          setResepData(meta.resepData || {});
          setTargetYieldData(meta.targetYieldData || {});
          setHiddenKueList(meta.hiddenKueList || []);
          setVisitData(meta.visitData || []);
        }
      } catch (err) {
        console.warn('[Cache Engine] Sandbox load bypass', err);
      }
    };

    if ('requestIdleCallback' in window) window.requestIdleCallback(loadCacheClusterAsync);
    else setTimeout(loadCacheClusterAsync, 0);
  }, []);

  const fetchDataFresh = useCallback(async (targetEndpoint = 'ALL') => {
    setIsSyncing(true); 

    try {
      const response = await fetchWithTimeout(`${SCRIPT_URL}?type=${targetEndpoint}&t=${Date.now()}`, {}, 20000);
      const resJson = await response.json();
      
      const currentSnapshot = dataCoreRef.current;
      let pObj = currentSnapshot.priceList || {}; 
      let bObj = currentSnapshot.bahanList || {}; 
      let rObj = currentSnapshot.resepData || {}; 
      let finalYields = currentSnapshot.targetYieldData || {};
      let grouped = currentSnapshot.archiveData || {};
      let groupedSisa = currentSnapshot.sisaArchive || {};

      if (resJson.prices || targetEndpoint === 'ALL') {
        pObj = (resJson.prices || []).reduce((acc, curr) => { acc[curr.jenisKue] = Number(curr.harga) || 0; return acc; }, {});
        setPriceList(pObj);
        saveChunkedCache('prices', pObj);
      }

      // 🔥 FIX LOGIKA REDUCE: Mendeklarasikan konstanta penampung tanggal secara aman guna memutus eerror ReferenceError dObj
      if (resJson.data || targetEndpoint === 'ALL') {
        grouped = (resJson.data || []).reduce((acc, curr) => {
          if (!curr.tanggal) return acc;
          const parsed = parseSafeDate(curr.tanggal);
          if (!parsed) return acc;
          const tglKey = `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
          if (!acc[tglKey]) acc[tglKey] = [];
          acc[tglKey].push(curr); return acc;
        }, {});
        setArchiveData(grouped);
        saveChunkedCache('archive', grouped);
      }

      if (resJson.sisa || targetEndpoint === 'ALL') {
        groupedSisa = (resJson.sisa || []).reduce((acc, curr) => {
          if (!curr.tanggal) return acc;
          const parsed = parseSafeDate(curr.tanggal);
          if (!parsed) return acc;
          const tglKey = `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
          if (!acc[tglKey]) acc[tglKey] = [];
          acc[tglKey].push(curr); return acc;
        }, {});
        setSisaArchive(groupedSisa);
        saveChunkedCache('sisa', groupedSisa);
      }

      if (resJson.bahan || resJson.resep || targetEndpoint === 'ALL') {
        if (resJson.bahan) bObj = resJson.bahan.reduce((acc, curr) => { acc[curr.namaBahan] = { harga: Number(curr.harga) || 0, kuantitas: Number(curr.kuantitas) || 1, satuan: curr.satuan }; return acc; }, {});
        if (resJson.resep) rObj = resJson.resep.reduce((acc, curr) => { if (!acc[curr.namaKue]) acc[curr.namaKue] = []; acc[curr.namaKue].push({ namaBahan: curr.namaBahan, qty: Number(curr.qty) }); return acc; }, {});
        
        const defaultYields = { GABIN: 28, PASTEL: 10, MTELUR: 10, BOLUKUKUS: 10, PASTELMINI: 5 };
        if (resJson.yields) {
          const yObj = resJson.yields.reduce((acc, curr) => { acc[curr.namaKue] = Number(curr.yield) || 1; return acc; }, {});
          finalYields = { ...defaultYields, ...yObj };
        } else { finalYields = defaultYields; }

        setBahanList(bObj); setResepData(rObj); setTargetYieldData(finalYields);
        setHiddenKueList(resJson.hiddenKue || []); setVisitData(resJson.kunjungan || []);

        saveChunkedCache('metadata', {
          bahanList: bObj, resepData: rObj, targetYieldData: finalYields,
          hiddenKueList: resJson.hiddenKue || [], visitData: resJson.kunjungan || []
        });
      }

    } catch (err) { 
      console.error("Lazy Data Pipeline Sync Gagal:", err); 
    } finally { 
      setIsSyncing(false);
      setIsGlobalBlocking(false);
    }
  }, []);

  useEffect(() => { fetchDataFresh('ALL'); }, [fetchDataFresh]);

  // --- ACTIONS HANDLERS PIPELINE ---
  const onSaveProduksi = useCallback(async (dataProduksi) => {
    setIsGlobalBlocking(true);
    try {
      const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
      const dataArray = Array.isArray(dataProduksi) ? dataProduksi : [dataProduksi];

      const finalData = dataArray.map(curr => {
        const kue = curr.jenisKue;
        let hrgJual = priceList[kue] || 0;
        let resepKue = resepData[kue] || [];

        const modalResep = resepKue.reduce((sum, item) => {
          let b = bahanList[item.namaBahan];
          return sum + ((b ? Number(b.harga) : 0) / (b ? (Number(b.kuantitas) || 1) : 1)) * item.qty;
        }, 0);

        const modalPcs = modalResep / (targetYieldData[kue] || targetYieldData[cleanKey(kue)] || 1);
        return { ...curr, modalPcs: isNaN(modalPcs) ? 0 : modalPcs, hargaJual: isNaN(hrgJual) ? 0 : hrgJual };
      });

      await fetchWithTimeout(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ADD_PRODUKSI', data: finalData })
      }, 25000);
      
      await fetchDataFresh('PRODUKSI'); 
      return true;
    } catch (e) { setIsGlobalBlocking(false); throw e; }
  }, [priceList, resepData, bahanList, targetYieldData, fetchDataFresh]);

  const onSaveSisa = useCallback(async (dataSisa) => {
    setIsGlobalBlocking(true);
    try { 
      await fetchWithTimeout(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ADD_SISA', data: dataSisa })
      }, 25000);
      await fetchDataFresh('SISA'); 
      return true; 
    } catch (e) { setIsGlobalBlocking(false); throw e; }
  }, [fetchDataFresh]);

  const onDeleteDate = useCallback(async (tanggalMentah) => {
    if (!window.confirm(`Hapus SELURUH data pada tanggal ${tanggalMentah}?`)) return;
    setIsGlobalBlocking(true);
    try { 
      await fetchWithTimeout(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'DELETE_BY_DATE', data: { tanggal: tanggalMentah } })
      }, 25000);
      await fetchDataFresh('ALL'); 
    } catch (e) { alert("Gagal menghapus data harian!"); setIsGlobalBlocking(false); }
  }, [fetchDataFresh]);

  const onAddNewKue = useCallback(async (newKue) => {
    setIsSyncing(true); 
    setPriceList(prev => ({ ...prev, [newKue.jenisKue]: Number(newKue.harga) }));
    try { 
      await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'ADD_NEW_KUE', data: newKue }) }, 20000);
      await fetchDataFresh('PRICES'); 
    } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onUpdateKue = useCallback(async (oldName, updatedData) => {
    setIsSyncing(true);
    setPriceList(prev => { const next = { ...prev }; if (oldName !== updatedData.jenisKue) delete next[oldName]; next[updatedData.jenisKue] = Number(updatedData.harga); return next; });
    try { 
      await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'UPDATE_KUE', data: { oldJenisKue: oldName, jenisKue: updatedData.jenisKue, harga: Number(updatedData.harga) } }) }, 20000);
      await fetchDataFresh('ALL'); 
    } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onDeleteKue = useCallback(async (namaKue) => {
    setIsSyncing(true); setPriceList(prev => { const next = { ...prev }; delete next[namaKue]; return next; });
    try { 
      await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'DELETE_KUE', data: { jenisKue: namaKue } }) }, 20000);
      await fetchDataFresh('ALL'); 
    } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onToggleHideKue = useCallback(async (namaKue, isHidden) => {
    setHiddenKueList(prev => isHidden ? [...prev, namaKue] : prev.filter(k => k !== namaKue));
    try { 
      await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'TOGGLE_HIDE_KUE', data: { jenisKue: namaKue, isHidden } }) }, 20000);
      await fetchDataFresh('ALL'); 
    } catch (e) { console.error(e); }
  }, [fetchDataFresh]);

  const onAddNewBahan = useCallback(async (newBahan) => {
    setIsSyncing(true);
    setBahanList(prev => ({ ...prev, [newBahan.namaBahan]: { harga: Number(newBahan.harga), kuantitas: Number(newBahan.kuantitas), satuan: newBahan.satuan } }));
    try { await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'ADD_BAHAN', data: newBahan }) }, 20000); await fetchDataFresh('ALL'); } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onUpdateBahan = useCallback(async (oldName, updatedData) => {
    setIsSyncing(true);
    setBahanList(prev => { const next = { ...prev }; if (oldName !== updatedData.namaBahan) delete next[oldName]; next[updatedData.namaBahan] = { harga: Number(updatedData.harga), kuantitas: Number(updatedData.kuantitas), satuan: updatedData.satuan }; return next; });
    try { await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'UPDATE_BAHAN', data: { oldNamaBahan: oldName, namaBahan: updatedData.namaBahan, harga: Number(updatedData.harga), kuantitas: Number(updatedData.kuantitas), satuan: updatedData.satuan } }) }, 20000); await fetchDataFresh('ALL'); } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onDeleteBahan = useCallback(async (namaBahan) => {
    setIsSyncing(true); setBahanList(prev => { const next = { ...prev }; delete next[namaBahan]; return next; });
    try { await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'DELETE_BAHAN', data: { namaBahan } }) }, 20000); await fetchDataFresh('ALL'); } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onSaveResep = useCallback(async (namaKue, resepArray, yieldResult = 1) => {
    setIsSyncing(true); setResepData(prev => ({ ...prev, [namaKue]: resepArray })); setTargetYieldData(prev => ({ ...prev, [namaKue]: yieldResult }));
    try { await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'SAVE_RESEP', data: { namaKue, resep: resepArray, targetYield: yieldResult } }) }, 20000); await fetchDataFresh('ALL'); } catch (e) { setIsSyncing(false); }
  }, [fetchDataFresh]);

  const onSaveKunjungan = useCallback(async (dataK) => {
    try { 
      await fetchWithTimeout(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'ADD_KUNJUNGAN', data: dataK }) }, 20000); 
      await fetchDataFresh('ALL'); return true; 
    } catch (e) { return false; }
  }, [fetchDataFresh]);

  const masterKueList = useMemo(() => {
    const hiddenSet = new Set(hiddenKueList);
    const keys = Object.keys(priceList);
    const result = [];
    for (let i = 0; i < keys.length; i++) {
      if (!hiddenSet.has(keys[i])) result.push(keys[i]);
    }
    return result;
  }, [priceList, hiddenKueList]);

  const menuItems = useMemo(() => [
    { id: 'Home', icon: <Home size={22} />, label: 'Beranda' },
    { id: 'Produksi', icon: <ChefHat size={22} />, label: 'Produksi' },
    { id: 'Laporan', icon: <FileText size={22} />, label: 'Laporan' }, 
    { id: 'Analisa', icon: <Activity size={22} />, label: 'Analisa' }, 
  ], []);

  return (
    <div className="fixed inset-0 flex w-full h-[100dvh] bg-[#f8fafc] dark:bg-[#020617] font-sans tracking-tight overflow-hidden transition-colors duration-500 transform-gpu">
      
      {/* Sidebar Desktop */}
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
        <Header activeTab={activeTab} strokeWidth={2.5} loading={isSyncing} />

        <main className={`flex-1 overflow-y-auto custom-scrollbar md:pt-6 pb-32 md:pb-12 max-w-5xl w-full mx-auto ${activeTab === 'Home' ? 'pt-[64px] px-0' : 'pt-[68px] px-4'}`}>
          
          {/* A. CORE HIGH-FREQUENCY TABS */}
          <div className={activeTab === 'Home' ? 'block' : 'hidden'}>
            <Dashboard 
              archiveData={archiveData} sisaArchive={sisaArchive} priceList={priceList} bahanList={bahanList} resepData={resepData} targetYieldData={targetYieldData}
              normalizeDate={normalizeDate} formatTanggal={formatTanggalIndonesia} visitData={visitData} setIsSubViewOpen={setIsSubViewOpen}
            />
          </div>

          <div className={activeTab === 'Produksi' ? 'block' : 'hidden'}>
            <ProductionPage 
              archiveData={archiveData} selectedDate={selectedDate} setSelectedDate={setSelectedDate} normalizeDate={normalizeDate} masterKueList={masterKueList} onSaveProduksi={onSaveProduksi} onDeleteDate={onDeleteDate}
            />
          </div>

          {/* B. HEAVY ANALYSIS TABS (DIBUNGKUS SUSPENSE DENGAN OPERAN DATA PROPS FINAL LENGKAP) */}
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'Laporan' && (
              <ReportPage 
                archiveData={archiveData} 
                sisaArchive={sisaArchive} 
                priceList={priceList}        
                bahanList={bahanList}        
                resepData={resepData}        
                targetYieldData={targetYieldData} 
                normalizeDate={normalizeDate} 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate} 
                onDeleteDate={onDeleteDate}  
              />
            )}

            {activeTab === 'Analisa' && (
              <AnalisaPage 
                archiveData={archiveData} sisaArchive={sisaArchive} priceList={priceList} bahanList={bahanList} resepData={resepData} targetYieldData={targetYieldData} normalizeDate={normalizeDate} visitData={visitData} localSelectedDate={selectedDate}
              />
            )}

            {activeTab === 'Master' && (
              <MasterPage 
                priceList={priceList} hiddenKueList={hiddenKueList} bahanList={bahanList} resepData={resepData} targetYieldData={targetYieldData}
                onAddNewKue={onAddNewKue} onDeleteKue={onDeleteKue} onUpdateKue={onUpdateKue} onToggleHideKue={onToggleHideKue}
                onAddNewBahan={onAddNewBahan} onDeleteBahan={onDeleteBahan} onUpdateBahan={onUpdateBahan} onSaveResep={onSaveResep} setActiveTab={setActiveTab} setIsSubViewOpen={setIsSubViewOpen}
              />
            )}
          </Suspense>

        </main>
      </div>

      <BottomNav menuItems={menuItems} activeTab={activeTab} setActiveTab={setActiveTab} />
      <VisitInput onSave={onSaveKunjungan} />

      {/* Global Blocking Spinner Overlay */}
      <AnimatePresence>
        {isGlobalBlocking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 dark:bg-black/50 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-[3px] border-white/40 dark:border-slate-600/50"></div>
                <div className="w-12 h-12 rounded-full border-[3px] border-sky-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                <Activity size={18} className="text-sky-500 absolute animate-pulse" />
              </div>
              <p className="text-[10px] font-black tracking-widest text-slate-800 dark:text-slate-100 uppercase drop-shadow-md">Menyinkronkan</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog Konfirmasi Keluar Aplikasi */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm px-6" onClick={() => setShowExitConfirm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <LogOut size={32} strokeWidth={2.5} className="-ml-1" />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tighter">Keluar Aplikasi?</h3>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Anda yakin ingin keluar dari FaFiFa Report? <br/><span className="text-rose-500">Tekan "Kembali" sekali lagi untuk keluar langsung.</span></p>
                <div className="flex w-full gap-3">
                  <button onClick={() => { setShowExitConfirm(false); window.history.replaceState({ page: 'fafifa-main' }, '', window.location.href); }} className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                  <button onClick={() => { setShowExitConfirm(false); window.history.go(-2); }} className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all flex items-center justify-center gap-2">Keluar</button>
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
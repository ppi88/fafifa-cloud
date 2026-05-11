import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, PieChart, CalendarDays, DollarSign, 
  BarChart3, Activity, AlertTriangle, ChevronDown, Check, 
  Clock, Sparkles, ArrowRight, Users, Package, AlertCircle, Zap, Info, ShieldAlert
} from 'lucide-react';
import { useAnalisaBisnis } from '../hooks/useAnalisaBisnis';
import { generateAnalisaPrompt } from '../utils/aiPrompts'; 

const AnalisaPage = ({ 
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
  visitData = [] 
}) => {
  
  // 🔥 Default diubah ke 'bulan'
  const [filterMode, setFilterMode] = useState('bulan'); 
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  const [pickerType, setPickerType] = useState(null); 
  const [isCopied, setIsCopied] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  const [showLostTooltip, setShowLostTooltip] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i); 
  const namaHariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  const formatPeriode = (dateStr) => {
    if (!dateStr) return "";
    const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')} ${monthsName[d.getMonth()]} ${d.getFullYear()}`;
  };

  const parseDateKey = (dKey) => {
    if (!dKey) return new Date(0);
    if (dKey.includes('/')) {
      const p = dKey.split('/');
      if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]);
    }
    if (dKey.includes('-')) {
      const p = dKey.split('-');
      if (p.length === 3) return new Date(p[0], p[1] - 1, p[2]);
    }
    return new Date(dKey);
  };

  const allDataRangeText = useMemo(() => {
    const allDates = [...new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)])].filter(k => !isNaN(parseDateKey(k).getTime()));
    if (allDates.length === 0) return "BELUM ADA DATA";
    allDates.sort((a, b) => parseDateKey(a) - parseDateKey(b));
    return `${formatPeriode(parseDateKey(allDates[0]))} - ${formatPeriode(parseDateKey(allDates[allDates.length - 1]))}`;
  }, [archiveData, sisaArchive]);

  // 🚀 Panggil Hook AI Enterprise 
  const { 
    trendData, profitData, dayTrendData, insightCerdas, 
    trafficData, peakTrafficText, formatRp, aiReadyData 
  } = useAnalisaBisnis({
    archiveData, 
    sisaArchive, 
    priceList, 
    bahanList, 
    resepData, 
    targetYieldData, 
    normalizeDate, 
    localSelectedDate: selectedDate, 
    filterMode: filterMode === 'all' ? 'periode' : filterMode, 
    selectedMonthIdx, 
    selectedYear, 
    startDate: filterMode === 'all' ? '2020-01-01' : startDate, 
    endDate: filterMode === 'all' ? '2050-12-31' : endDate, 
    visitData
  });

  const { productStats = {}, weeklyTargets = {}, totalLostOpportunityRp = 0 } = insightCerdas || {};

  const donutColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#eab308'];
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const totalAvgVisits = aiReadyData?.structuredTraffic?.averageVisitorsPerDay || 0;

  const totalOmzetGlobal = useMemo(() => {
    let total = 0;
    if (trendData && trendData.list) {
      trendData.list.forEach(item => {
        const hargaJualItem = priceList[item.namaKue] || 0;
        total += (item.terjual || 0) * hargaJualItem;
      });
    }
    return total;
  }, [trendData, priceList]);

  // 🚨 AI ACTION CENTER DATA
  const produkBermasalah = Object.entries(productStats)
    .filter(([_, stat]) => stat.category === 'CASH_FLOW_DANGER')
    .sort((a, b) => (b[1]?.riskIndex || 0) - (a[1]?.riskIndex || 0));
    
  const hiddenGems = Object.entries(productStats)
    .filter(([_, stat]) => stat.category === 'HIGH_MARGIN_LOW_VOLUME')
    .sort((a, b) => (b[1]?.labaPcs || 0) - (a[1]?.labaPcs || 0));
    
  const anomalies = Object.entries(productStats)
    .filter(([_, stat]) => stat.anomaly && stat.anomaly !== 'NORMAL');

  const lostOpportunityCakes = Object.entries(productStats)
    .filter(([_, stat]) => {
        const adaLost = (stat?.lostPcs || 0) > 0;
        const aslinyaSeringSisa = (stat?.sisa || 0) > ((stat?.terjual || 0) * 0.1); 
        return adaLost && !aslinyaSeringSisa;
    })
    .sort((a, b) => (b[1]?.lostPcs || 0) - (a[1]?.lostPcs || 0))
    .slice(0, 3) 
    .map(([nama]) => nama);

  const lostCakesNames = lostOpportunityCakes.length > 0 ? lostOpportunityCakes.join(', ') : '';

  // 🔥 UPDATE: Traffic Chart Setup (Model Garis Solid + Gradasi Amber)
  const safeTrafficData = trafficData?.length ? trafficData : [{ hour: 7, total: 0 }, { hour: 8, total: 0 }];
  const maxTraffic = Math.max(...safeTrafficData.map(d => d.total), 1);
  const svgWidth = 800;
  const svgHeight = 200; 
  const paddingY = 40;
  const xStep = safeTrafficData.length > 1 ? svgWidth / (safeTrafficData.length - 1) : svgWidth;
  const trafficPoints = safeTrafficData.map((d, i) => ({ 
    x: i * xStep, 
    y: svgHeight - paddingY - ((d.total / maxTraffic) * (svgHeight - paddingY * 2)), 
    ...d 
  }));

  const createSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`;
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      path += ` C ${xMid},${points[i].y} ${xMid},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`;
    }
    return path;
  };
  
  const smoothLine = createSmoothPath(trafficPoints);
  const smoothArea = trafficPoints.length > 1 
    ? `${smoothLine} L ${trafficPoints[trafficPoints.length - 1].x},${svgHeight - paddingY} L ${trafficPoints[0].x},${svgHeight - paddingY} Z` 
    : '';

  const bestSalesKue = trendData?.list?.[0];
  const bestProfitKue = profitData?.list?.[0];
  const bestDay = dayTrendData?.topDays?.[0];

  const handleCopyForAI = async () => {
    try {
      const periodeText = filterMode === 'all' 
        ? allDataRangeText 
        : filterMode === 'bulan' 
          ? `${months[selectedMonthIdx]} ${selectedYear}` 
          : `${formatPeriode(startDate)} - ${formatPeriode(endDate)}`;

      const productDetailsJSON = JSON.stringify(aiReadyData?.structuredProducts || [], null, 2);
      const trafficInfoJSON = JSON.stringify(aiReadyData?.structuredTraffic || {}, null, 2);
      const weeklyTargetsJSON = JSON.stringify(aiReadyData?.structuredWeeklyTargets || {}, null, 2);

      const textPrompt = generateAnalisaPrompt({
        periodeText, 
        totalSalesVol: trendData?.totalSalesVol || 0, 
        totalOmzet: formatRp(totalOmzetGlobal), 
        totalLaba: formatRp(profitData?.totalLaba || 0),
        totalSisa: trendData?.totalSisa || 0, 
        totalRusak: trendData?.totalRusak || 0,
        productDetails: productDetailsJSON, 
        trafficInfo: trafficInfoJSON, 
        weeklyTargets: weeklyTargetsJSON
      });
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textPrompt);
      } else { 
        const textArea = document.createElement("textarea"); 
        textArea.value = textPrompt; 
        document.body.appendChild(textArea); 
        textArea.select(); 
        document.execCommand('copy'); 
        textArea.remove(); 
      }
      
      setIsCopied(true); 
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) { 
      alert("Maaf, gagal menyiapkan data untuk AI. Pastikan data sudah selesai dimuat."); 
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-32 mb-8 font-sans relative bg-[#f8fafc] dark:bg-[#020617] min-h-screen w-full">
      
      {/* Background Overlay untuk Modal */}
      {pickerType && (
        <div className="fixed inset-0 z-[60]" onClick={() => setPickerType(null)}></div>
      )}

      {/* 🚀 HEADER & FILTER (Sticky & Margin Tembus Kiri-Kanan) */}
      <div className="sticky top-0 z-[70] -mx-4 sm:-mx-6 px-2 sm:px-6 pt-2 pb-3 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)]">
        
        {/* Cover atas biar nggak bocor saat scroll */}
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]"></div>
        
        {/* JUDUL & INFO TANGGAL & TOMBOL AI */}
        <div className="flex items-center justify-between relative z-10 mb-3 mt-1">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase">
              Analisa AI
            </h1>
            <div className="h-1.5 w-8 bg-sky-500 mt-1.5 rounded-full shadow-sm shadow-sky-500/30"></div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Indikator Tanggal/Filter Aktif */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/60 backdrop-blur-md shadow-sm">
              <CalendarDays size={11} className="text-sky-500 dark:text-sky-400" />
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap uppercase tracking-widest">
                {filterMode === 'all' 
                  ? 'ALL DATA' 
                  : filterMode === 'bulan' 
                    ? `${months[selectedMonthIdx].substring(0,3)} ${selectedYear}` 
                    : `${formatPeriode(startDate)}`}
              </span>
            </div>
            
            {/* Tombol Copy AI */}
            <button 
              onClick={handleCopyForAI} 
              className={`flex items-center justify-center sm:justify-start gap-2 h-7 w-7 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-xl shadow-sm active:scale-95 transition-all border ${
                isCopied 
                  ? 'bg-emerald-500 border-emerald-400 text-white' 
                  : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {isCopied ? <Check size={12} strokeWidth={3} /> : <Sparkles size={12} className={isCopied ? "" : "text-amber-500"} />}
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                {isCopied ? 'Tersalin' : 'Copy AI Prompt'}
              </span>
            </button>
          </div>
        </div>

        {/* 🎨 FILTER KONTROL (1 Baris Sejajar, Lebar Menyesuaikan Layar Maksimal) */}
        <div className="relative z-[80] w-full mt-2">
          <div className="flex flex-row gap-1.5 items-center w-full pb-1">
            
            {/* Segmented Control Mode (Fixed Width Secukupnya) */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-lg flex items-center shrink-0 shadow-sm h-[36px]">
              {['all', 'bulan', 'periode'].map(mode => {
                const label = mode === 'all' ? 'ALL' : mode === 'periode' ? 'RENTANG' : 'BULAN';
                return (
                  <button 
                    key={mode} 
                    type="button" 
                    onClick={() => setFilterMode(mode)} 
                    className={`px-3 sm:px-4 py-1.5 h-full text-[9px] font-black uppercase tracking-widest rounded-md transition-all duration-300 ${
                      filterMode === mode 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Kotak Input Waktu (Sisa Layar Disikat Habis / flex-1 w-full) */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 flex items-center flex-1 w-full h-[36px] shadow-sm min-w-0">
              
              {filterMode === 'all' && (
                <div className="px-3 flex items-center gap-2 w-full justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] truncate">
                    Master Database
                  </span>
                </div>
              )}

              {filterMode === 'bulan' && (
                <div className="flex items-center w-full gap-1 px-1">
                  <CalendarDays size={12} className="text-blue-500 shrink-0 ml-1 hidden sm:block" />
                  <div className="relative flex-1 min-w-0">
                    <select 
                      value={selectedMonthIdx} 
                      onChange={(e) => setSelectedMonthIdx(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-md border border-slate-200 dark:border-slate-700 pl-2 pr-5 py-1 appearance-none cursor-pointer truncate shadow-sm"
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative w-[35%] min-w-[65px]">
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-md border border-slate-200 dark:border-slate-700 pl-2 pr-5 py-1 appearance-none cursor-pointer shadow-sm"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {filterMode === 'periode' && (
                <div className="flex items-center w-full gap-1 px-1">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-md border border-slate-200 dark:border-slate-700 px-1 py-1 uppercase cursor-pointer text-center shadow-sm" 
                  />
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-[10px] shrink-0">-</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-md border border-slate-200 dark:border-slate-700 px-1 py-1 uppercase cursor-pointer text-center shadow-sm" 
                  />
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>

      {/* 🔝 1. EXECUTIVE SUMMARY (Margin Kiri-Kanan Diperkecil Ekstrem: -mx-3) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 relative z-10 mt-4 -mx-3 px-3 sm:mx-0 sm:px-0">
        
        {/* Omzet */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/40 rounded-[1rem] p-3 shadow-sm flex flex-col justify-center transition-colors">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">
            <DollarSign size={12}/> Omzet
          </span>
          <span className="text-sm sm:text-base font-black text-blue-900 dark:text-blue-100 truncate">
            {formatRp(totalOmzetGlobal)}
          </span>
        </div>
        
        {/* Laba Bersih */}
        <div className={`border rounded-[1rem] p-3 shadow-sm flex flex-col justify-center transition-colors ${
            (profitData?.totalLaba || 0) < 0 
            ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/60 dark:border-rose-800/40' 
            : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-800/40'
        }`}>
          <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-1 ${
              (profitData?.totalLaba || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <Activity size={12}/> Laba Bersih
          </span>
          <div className="flex items-end justify-between gap-1">
            <span className={`text-sm sm:text-base font-black truncate ${
              (profitData?.totalLaba || 0) < 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}>
              {formatRp(profitData?.totalLaba || 0)}
            </span>
            <span className={`text-[8px] font-bold mb-0.5 px-1.5 py-0.5 rounded-md ${
              (profitData?.marginPct||0) >= 40 ? 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200' 
              : 'bg-amber-200/50 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200'
            }`}>
              {Math.max(0, profitData?.marginPct||0).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Volume & Sisa Rollover */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[1rem] p-3 shadow-sm flex items-center justify-between transition-colors">
          <div className="flex flex-col w-[45%]">
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
              <TrendingUp size={10}/> Volume
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-white truncate">
              {trendData?.totalSalesVol || 0}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col text-right w-[45%]">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 dark:text-amber-400 mb-1">
              Sisa Rollover
            </span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 truncate">
              {trendData?.totalSisa || 0}
            </span>
          </div>
        </div>

        {/* 💡 LOST OPPORTUNITY */}
        <div 
          className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200/60 dark:border-purple-800/40 rounded-[1rem] p-3 shadow-sm flex flex-col justify-center relative group cursor-pointer transition-colors"
          onClick={() => setShowLostTooltip(!showLostTooltip)}
          onMouseLeave={() => setShowLostTooltip(false)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
              <TrendingUp size={10} className="rotate-180"/> Lost Opp.
            </span>
            <div className="bg-purple-200/50 dark:bg-purple-800/60 rounded-full p-0.5 animate-pulse">
              <Info size={10} className="text-purple-600 dark:text-purple-300"/>
            </div>
          </div>
          <span className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-300 truncate">
            {formatRp(totalLostOpportunityRp)}
          </span>

          {/* Tooltip Pop-up Info */}
          <div 
            className={`absolute top-full right-0 mt-2 w-[240px] sm:w-[280px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-3.5 shadow-2xl transition-all duration-300 z-[100] cursor-default ${
              showLostTooltip ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2 lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0'
            }`}
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex flex-col gap-2.5">
               <div>
                 <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <AlertCircle size={10}/> Kenapa Terjadi?
                 </span>
                 <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                   Sistem mendeteksi uang kasir melayang karena kue kehabisan stok sebelum jam tutup.
                   {lostCakesNames && (
                     <span className="block mt-1.5 text-amber-600 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/10 p-1.5 rounded border border-amber-200 dark:border-amber-500/20">
                       ⚠️ Sering Ludes: {lostCakesNames}
                     </span>
                   )}
                 </p>
               </div>
               <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700/50"></div>
               <div>
                 <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                   <Sparkles size={10}/> Saran Tindakan AI
                 </span>
                 <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-relaxed">
                   Segera naikkan target produksi untuk {lostCakesNames ? <strong className="text-slate-900 dark:text-white">kue-kue tersebut</strong> : 'kue berpotensi'}. Cek tabel <strong className="text-sky-500 dark:text-sky-400">Target Produksi AI</strong> di bawah berlogo <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold">🔥</span>.
                 </p>
               </div>
            </div>
            <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white/95 dark:bg-slate-900/95 border-l border-t border-slate-200/50 dark:border-slate-700/50 rotate-45 backdrop-blur-xl"></div>
          </div>
        </div>
      </div>

      {/* 🤖 2. AI ACTION CENTER (THE CHIEF MANAGER) */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 mt-6">
        <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-2xl rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 shadow-sm border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} className="text-sky-500"/></div>
          
          <h2 className="text-slate-800 dark:text-white text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
            <Sparkles size={16} className="text-sky-500 dark:text-sky-400"/> AI Action Center
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 relative z-10">
            
            {/* Pangkas (Dead Cash) */}
            <div className="bg-white/80 dark:bg-rose-500/10 border border-slate-200/50 dark:border-rose-500/20 shadow-sm rounded-xl p-3">
              <h3 className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle size={12}/> Pangkas (Dead Cash)
              </h3>
              <div className="space-y-2">
                {produkBermasalah.length === 0 ? <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 italic">Aman. Tidak ada produk nyangkut.</p> : null}
                {produkBermasalah.slice(0,3).map(([nama, stat], i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50/80 dark:bg-black/20 border border-slate-100 dark:border-transparent p-2 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{nama}</span>
                    <div className="text-right">
                      <span className="block text-[9px] text-rose-500 dark:text-rose-300 font-bold">Tertahan: {formatRp(stat?.modalTertahan || 0)}</span>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400">Risk: {(stat?.riskIndex || 0).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Push Promo */}
            <div className="bg-white/80 dark:bg-emerald-500/10 border border-slate-200/50 dark:border-emerald-500/20 shadow-sm rounded-xl p-3">
              <h3 className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <TrendingUp size={12}/> Push Promo (Hidden Gem)
              </h3>
              <div className="space-y-2">
                {hiddenGems.length === 0 ? <p className="text-[10px] text-slate-500 dark:text-slate-400/80 italic">Belum ada produk potensial terdeteksi.</p> : null}
                {hiddenGems.slice(0,3).map(([nama, stat], i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50/80 dark:bg-black/20 border border-slate-100 dark:border-transparent p-2 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{nama}</span>
                    <div className="text-right">
                      <span className="block text-[9px] text-emerald-600 dark:text-emerald-300 font-bold">Laba: {formatRp(stat?.labaPcs || 0)}/pcs</span>
                      <span className="text-[8px] text-slate-500 dark:text-slate-400">Vol: Rendah ({stat?.terjual || 0} pcs)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomali Terdeteksi */}
            <div className="bg-white/80 dark:bg-amber-500/10 border border-slate-200/50 dark:border-amber-500/20 shadow-sm rounded-xl p-3">
              <h3 className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <ShieldAlert size={12}/> Anomali Terdeteksi
              </h3>
              <div className="space-y-2">
                {anomalies.length === 0 ? <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 italic">Pergerakan data normal & stabil.</p> : null}
                {anomalies.slice(0,3).map(([nama, stat], i) => {
                  const avgAll = (stat?.terjual || 0) / (stat?.hariAktif || 1);
                  const avg14Hari = (stat?.recentAktif || 0) > 0 ? ((stat?.recentTerjual || 0) / stat.recentAktif) : avgAll;

                  return (
                    <div key={i} className="flex flex-col bg-slate-50/80 dark:bg-black/20 border border-slate-100 dark:border-transparent p-2 rounded-lg gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{nama}</span>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                          stat?.anomaly === 'SUDDEN_DROP' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300'
                        }`}>
                          {stat?.anomaly === 'SUDDEN_DROP' ? 'Drop Tiba-tiba' : 'Spike Lonjakan'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-white/5 pt-1">
                        <span>Rerata Lama: <strong className="text-slate-700 dark:text-slate-300">{avgAll.toFixed(1)}</strong></span>
                        <ArrowRight size={10} className="text-slate-400 dark:text-slate-500" />
                        <span>Rerata Baru: <strong className={stat?.anomaly === 'SUDDEN_DROP' ? 'text-rose-500 dark:text-rose-400' : 'text-sky-500 dark:text-sky-400'}>{avg14Hari.toFixed(1)}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 🚀 3. THE DECISION ENGINE: JADWAL & TARGET PRODUKSI (XAI ENABLED) 🚀 */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 mt-6">
        <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 shadow-sm flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-500/10 p-1.5 rounded-lg">
                <Package size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 leading-none mb-0.5">Target Produksi AI</h3>
                <p className="text-[9px] text-slate-500 font-medium">Geser untuk melihat hari lain. Perhatikan angka Multiplier.</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar-hide pb-2 snap-x snap-mandatory -mx-1 px-1">
            {namaHariList.map((day, idx) => {
              const items = weeklyTargets?.[day] || [];
              const totalTargetDay = items.reduce((sum, it) => sum + (Number(it.target) || 0), 0);
              
              return (
                <div key={idx} className="min-w-[280px] sm:min-w-[340px] shrink-0 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-[1.2rem] overflow-hidden shadow-sm flex flex-col snap-start">
                  <div className="py-2 flex items-center justify-center border-b bg-slate-50 dark:bg-slate-950/50 border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{day}</span>
                  </div>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50 flex-1 max-h-[350px] overflow-y-auto custom-scrollbar p-1">
                    {items.length === 0 ? (
                      <div className="p-8 text-center text-slate-400"><p className="text-[10px] font-bold">Belum ada data cukup</p></div>
                    ) : (
                      items.map((item, i) => {
                        const isNaik = item.type === 'naik';
                        const isTurun = item.type === 'turun';
                        const colorText = isNaik ? 'text-emerald-600 dark:text-emerald-400' : isTurun ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500';
                        const bgRow = isNaik ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10' : isTurun ? 'hover:bg-rose-50/50 dark:hover:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30';
                        
                        return (
                          <div key={i} className={`p-2.5 flex items-center justify-between gap-2 transition-colors ${bgRow}`}>
                            <div className="flex flex-col flex-1 min-w-0 pr-2">
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.kue}</span>
                              <span className={`text-[8px] font-black uppercase truncate mt-0.5 ${colorText}`}>{item.reason}</span>
                            </div>
                            
                            <div className="flex flex-col items-end shrink-0 w-[65px] sm:w-[70px] border-r border-slate-200 dark:border-slate-700 pr-2">
                               <span className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">Base/Avg</span>
                               <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{item.explain?.baseTarget || item.rerata}</span>
                               <span className="text-[8px] font-black text-sky-500 mt-0.5 cursor-help" 
                                     title={`Trend: ${item.explain?.factors?.trend}\nTraffic: ${item.explain?.factors?.traffic}\nRisk Pen: ${item.explain?.factors?.riskPenalty}\nRollover Pen: ${item.explain?.factors?.rolloverPenalty}\nAge Pen: ${item.explain?.factors?.agingPenalty}\nConf: ${item.explain?.factors?.confidence}`}>
                                 × {item.explain?.appliedMultiplier || '1.00'}
                               </span>
                            </div>

                            <div className="flex flex-col items-center shrink-0 w-[45px] sm:w-[50px] pl-1">
                              <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Target</span>
                              <span className={`text-[16px] font-black leading-none ${colorText}`}>{item.target}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         <div className="bg-blue-500/10 p-1 rounded-md"><Package size={10} className="text-blue-600 dark:text-blue-400" /></div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Produksi</span>
                      </div>
                      <div className="text-right">
                         <span className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">{totalTargetDay}</span>
                         <span className="text-[8px] font-bold text-slate-400 ml-1 uppercase">Pcs</span>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Evaluasi Resep */}
          {weeklyTargets?.['Evaluasi Resep'] && weeklyTargets['Evaluasi Resep'].length > 0 && (
            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm border border-slate-100/50 dark:border-slate-800/80 rounded-[1rem] overflow-hidden shadow-sm flex flex-col sm:col-span-2 mt-4">
              <div className="bg-slate-800 text-white py-1.5 flex items-center justify-center border-b border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest">🚨 KANDIDAT EVALUASI HARGA / RESEP</span>
              </div>
              <div className="divide-y divide-slate-100/50 dark:divide-slate-800/50 flex-1 grid grid-cols-1 sm:grid-cols-2">
                {weeklyTargets['Evaluasi Resep'].map((item, i) => (
                  <div key={i} className="p-2.5 flex items-center justify-between gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 leading-tight truncate mb-px">{item.kue}</span>
                      <span className="text-[7px] font-medium text-slate-500 truncate">Kendala: <span className="text-rose-500 font-bold">{item.reason}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📊 4. CORE VISUALIZATIONS (Grafik Market Share & Laba) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 mt-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        
        {/* MARKET SHARE */}
        <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-sky-500/10 p-1.5 rounded-lg"><PieChart size={14} className="text-sky-500" /></div>
              <h3 className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Kue Terlaris (Market Share)</h3>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className={`w-full h-full -rotate-90 transition-all duration-1000 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                  {trendData?.list?.map((item, idx) => {
                    const pct = trendData.totalSalesVol > 0 ? (item.terjual / trendData.totalSalesVol) : 0;
                    const strokeLength = (pct * circumference); const offset = cumulativePercent * circumference; cumulativePercent += pct;
                    return <circle key={idx} cx="50" cy="50" r={radius} fill="transparent" stroke={donutColors[idx % donutColors.length]} strokeWidth="12" strokeDasharray={`${strokeLength} ${circumference}`} strokeDashoffset={-offset} strokeLinecap="round" className="transition-all duration-1000" />;
                  })}
                </svg>
                <div className="absolute flex flex-col items-center mt-0.5">
                  <span className="text-[14px] font-black text-slate-800 dark:text-white leading-none">{trendData?.totalSalesVol || 0}</span>
                </div>
              </div>
              <div className={`flex-1 w-full space-y-2 ${trendData?.list?.length > 5 ? 'max-h-[130px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
                {trendData?.list?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between mb-1.5 border-b border-slate-100/50 dark:border-slate-800/50 pb-1">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: donutColors[idx % donutColors.length] }}></span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.namaKue}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{item.terjual} pcs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-sky-500 mt-0.5">💡</span>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
              {bestSalesKue ? `Kue Terlaris saat ini adalah ${bestSalesKue.namaKue} (${bestSalesKue.terjual} pcs). Jaga ketersediaan stoknya agar pelanggan tidak lari.` : 'Belum ada data penjualan.'}
            </p>
          </div>
        </div>

        {/* KONTRIBUSI LABA */}
        <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-500/10 p-1.5 rounded-lg"><DollarSign size={14} className="text-emerald-600 dark:text-emerald-400" /></div>
              <h3 className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Kontribusi Laba</h3>
            </div>
            <div className={`space-y-3.5 flex-1 ${profitData?.list?.length > 5 ? 'max-h-[140px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
              {profitData?.list?.map((item, idx) => {
                const widthPct = profitData.maxProfit > 0 ? (item.laba / profitData.maxProfit) * 100 : 0;
                const isLoss = item.laba < 0; 
                return (
                  <div key={idx} className="flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className={`text-[10px] font-bold truncate ${isLoss ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{idx + 1}. {item.namaKue}</span>
                      <span className={`text-[11px] font-black shrink-0 ml-2 ${isLoss ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{formatRp(item.laba)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${isLoss ? 'bg-rose-500' : idx === 0 ? 'bg-emerald-500' : 'bg-emerald-400/60'}`} style={{ width: `${Math.max(3, isLoss ? 5 : widthPct)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg p-2.5 flex items-start gap-2">
            <span className="text-emerald-500 mt-0.5">💰</span>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
              {bestProfitKue ? `Penyumbang laba bersih terbesar adalah ${bestProfitKue.namaKue} (${formatRp(bestProfitKue.laba)}). Ini adalah "Sapi Perah" utama toko Anda.` : 'Belum ada data laba.'}
            </p>
          </div>
        </div>
      </div>

      {/* 🕒 5. TRAFFIC & HARI TERAMAI (Gabungan yang Efisien) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10 mt-6 -mx-3 px-3 sm:mx-0 sm:px-0">
        
        {/* JAM SIBUK TRAFFIC DESIGN PRO (SESUAI GAMBAR) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0b1120] backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col">
          
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-500/20 p-2.5 rounded-xl"><Clock size={20} className="text-amber-500" /></div>
            <div>
              <h3 className="text-[13px] font-black text-slate-800 dark:text-white">Rerata Traffic Toko</h3>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">±{totalAvgVisits} PENGUNJUNG</span>
            </div>
          </div>
          
          {peakTrafficText && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-3.5 mb-2 flex items-start gap-3">
              <span className="text-lg">🔥</span>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{peakTrafficText}</p>
            </div>
          )}

          <div className="h-56 w-full mt-2 overflow-x-auto [&::-webkit-scrollbar]:hidden -mx-2 px-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[550px] h-full overflow-visible">
              <defs>
                <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                </linearGradient>
              </defs>
              
              {/* Garis Grid Latar Belakang (Horizontal) */}
              {[0, 0.33, 0.66, 1].map(r => (
                <line 
                  key={r} 
                  x1="0" 
                  y1={svgHeight - paddingY - (r * (svgHeight - paddingY * 2))} 
                  x2={svgWidth} 
                  y2={svgHeight - paddingY - (r * (svgHeight - paddingY * 2))} 
                  stroke="currentColor" 
                  className="text-slate-200 dark:text-[#334155]"
                  strokeOpacity="0.5" 
                  strokeWidth="1" 
                  strokeDasharray="5,5" 
                />
              ))}
              
              {/* Gradien & Garis Area Traffic */}
              {smoothArea && <path d={smoothArea} fill="url(#gAmber)" className="animate-in fade-in duration-1000" />}
              {smoothLine && <path d={smoothLine} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-in slide-in-from-left-4 duration-1000" />}
              
              {/* Ticks, Lines & Tooltips Permanen */}
              {trafficPoints.map((p, i) => {
                const hasData = p.total > 0;
                return (
                  <g key={i}>
                    {/* Garis Putus-putus Vertikal ke Bawah */}
                    {hasData && (
                      <line 
                        x1={p.x} 
                        y1={p.y} 
                        x2={p.x} 
                        y2={svgHeight - paddingY} 
                        stroke="#f59e0b" 
                        strokeOpacity="0.3" 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                      />
                    )}
                    
                    {/* Lingkaran Putih Border Kuning */}
                    {hasData && (
                      <circle cx={p.x} cy={p.y} r="5" className="fill-white dark:fill-slate-900" stroke="#f59e0b" strokeWidth="3" />
                    )}
                    
                    {/* Kotak Angka Tampil Permanen (Di atas grafik) */}
                    {hasData && (
                      <g transform={`translate(${p.x - 14}, ${p.y - 30})`}>
                        <rect width="28" height="18" rx="5" className="fill-white dark:fill-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"/>
                        <text x="14" y="13" textAnchor="middle" fontSize="10" fontWeight="900" className="fill-slate-800 dark:fill-slate-100">{p.total}</text>
                      </g>
                    )}
                    
                    {/* Teks Label Jam */}
                    <text x={p.x} y={svgHeight - paddingY + 22} textAnchor="middle" fontSize="10" fontWeight="bold" className="fill-slate-500 dark:fill-slate-400">
                      {String(p.hour).padStart(2, '0')}:00
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* HARI TERAMAI */}
        <div className="lg:col-span-1 bg-white/50 dark:bg-slate-900/30 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 px-1 sm:px-3">
              <div className="bg-indigo-500/10 p-1.5 rounded-lg"><BarChart3 size={14} className="text-indigo-500" /></div>
              <h3 className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Hari Teramai</h3>
            </div>
            <div className="flex items-end justify-between h-[120px] mt-auto px-1 sm:px-3 relative mb-4">
              {dayTrendData?.list?.map((item, idx) => {
                const isWinner = item.avg === dayTrendData.maxDayAvg && item.avg > 0;
                const heightPct = dayTrendData.maxDayAvg > 0 ? (item.avg / dayTrendData.maxDayAvg) * 100 : 0;
                return (
                  <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group">
                    <div className="w-full max-w-[1.5rem] relative flex justify-center items-end h-full mb-2">
                      <div className={`w-full rounded-md transition-all duration-1000 ${isWinner ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ height: item.avg > 0 ? `${Math.max(10, heightPct)}%` : '0%' }}></div>
                    </div>
                    <span className={`text-[8px] font-bold uppercase ${isWinner ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{item.name.substring(0,3)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-1 sm:px-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-2.5 flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">📅</span>
              <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                {bestDay ? `Secara umum, Hari ${bestDay.name} adalah hari tersibuk dengan rata-rata terjual ${bestDay.avg} pcs. Jangan sampai telat produksi!` : 'Belum ada tren hari.'}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 📊 6. MATRIKS KESEHATAN PRODUK (ADAPTIF DARK/LIGHT MODE) */}
      <div className="-mx-3 px-3 sm:mx-0 sm:px-0 mt-6">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200/50 dark:border-slate-800 overflow-hidden shadow-sm relative z-10">
          <div className="p-4 border-b border-slate-200/50 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-[12px] font-black uppercase text-slate-800 dark:text-white">Matriks Kesehatan Produk</h2>
            <span className="text-[10px] text-slate-400 font-medium">Berdasarkan AI Engine</span>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-3 pl-5">Nama Kue</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Laku</th>
                  <th className="p-3">Margin</th>
                  <th className="p-3">Sell Through</th>
                  <th className="p-3">Risk Index</th>
                  <th className="p-3">AI Trend</th>
                  <th className="p-3 pr-5">Data Conf.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-200">
                {Object.entries(productStats).sort((a,b) => b[1].terjual - a[1].terjual).map(([n, s], i) => {
                  const safeCategory = s?.category || 'NORMAL';
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150">
                      <td className="p-3 pl-5 font-bold text-slate-900 dark:text-slate-100">{n}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[8px] rounded font-black ${
                          safeCategory === 'CASH_FLOW_DANGER' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' 
                          : safeCategory === 'HIGH_MARGIN_LOW_VOLUME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {safeCategory.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{s?.terjual || 0}</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                        {(((s?.labaPcs || 0) / (((s?.labaPcs || 0) + (s?.modalPcs || 0))||1)) * 100).toFixed(0)}%
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${(s?.sellThrough || 0) > 80 ? 'bg-emerald-400' : (s?.sellThrough || 0) < 50 ? 'bg-rose-400' : 'bg-amber-400'}`} style={{ width: `${Math.min(100, (s?.sellThrough || 0))}%` }}/>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{(s?.sellThrough || 0).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold">
                        <span className={`${(s?.riskIndex || 0) > 1.5 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>{(s?.riskIndex || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {(s?.trendMultiplier || 1) > 1.1 ? <span className="text-emerald-500">📈 Naik</span> : (s?.trendMultiplier || 1) < 0.9 ? <span className="text-rose-500">📉 Turun</span> : <span className="text-slate-500 dark:text-slate-400">➡️ Stabil</span>}
                      </td>
                      <td className="p-3 pr-5 font-bold text-sky-600 dark:text-sky-400">
                        {((s?.confidence || 0) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL PILIH TANGGAL (BULAN/TAHUN) */}
      {pickerType === 'month' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={() => setPickerType(null)}>
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl w-full max-w-xs p-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e=>e.stopPropagation()}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 text-center">Pilih Bulan</h4>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {months.map((m, i) => (
                <button 
                  key={i} 
                  type="button" 
                  onClick={() => { setSelectedMonthIdx(i); setPickerType(null); }} 
                  className={`py-2 text-[10px] font-bold rounded-xl transition-all ${Number(selectedMonthIdx) === i ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPickerType(null)} className="w-full mt-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Tutup</button>
          </div>
        </div>
      )}
      
      {pickerType === 'year' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={() => setPickerType(null)}>
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl w-full max-w-xs p-4 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800" onClick={e=>e.stopPropagation()}>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 text-center">Pilih Tahun</h4>
            <div className="flex flex-col gap-2">
              {years.map(y => (
                <button 
                  key={y} 
                  type="button" 
                  onClick={() => { setSelectedYear(y); setPickerType(null); }} 
                  className={`py-2 text-[10px] font-bold rounded-xl transition-all ${Number(selectedYear) === y ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95'}`}
                >
                  {y}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPickerType(null)} className="w-full mt-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalisaPage;
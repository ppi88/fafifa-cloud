import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Package, Star, Award, AlertTriangle, 
  CalendarDays, Clock, Archive, Target, 
  ArrowUpRight, ArrowDownRight, ChefHat, Sparkles, 
  Users, PieChart, ChevronDown 
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats'; 

const Dashboard = ({ 
  archiveData, sisaArchive, priceList, bahanList, resepData, targetYieldData, 
  normalizeDate, selectedDate, formatTanggal, visitData,
  setIsSubViewOpen // 👈 DITAMBAHKAN UNTUK SINKRONISASI TOMBOL BACK
}) => {

  // 🔥 FUNGSI AMBIL TANGGAL LOKAL PERANGKAT (ANTI-MELESET ZONA WAKTU)
  const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🚀 BERDIRI SENDIRI: Default selalu hari ini di perangkat, tidak peduli page lain
  const [localDate, setLocalDate] = useState(getLocalToday);
  
  // 🔥 UBAH DEFAULT FILTER KE 'bulan'
  const [filterMode, setFilterMode] = useState('bulan'); 
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [pickerType, setPickerType] = useState(null); 
  const [startDate, setStartDate] = useState(() => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const [endDate, setEndDate] = useState(() => localDate);

  const [isMounted, setIsMounted] = useState(false);

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i); 

  useEffect(() => { setIsMounted(true); }, []);

  // 👇 SINKRONISASI MODAL PICKER KE APP.JS (MENCEGAH KELUAR APLIKASI SAAT DI-BACK) 👇
  useEffect(() => {
    if (setIsSubViewOpen) {
      setIsSubViewOpen(pickerType !== null);
    }
  }, [pickerType, setIsSubViewOpen]);

  // 👇 TANGKAP TOMBOL BACK HARDWARE UNTUK MENUTUP MODAL PICKER 👇
  useEffect(() => {
    const handleBackView = () => {
      if (pickerType !== null) {
        setPickerType(null);
      }
    };
    window.addEventListener('popstate', handleBackView);
    return () => window.removeEventListener('popstate', handleBackView);
  }, [pickerType]);

  const {
    snapshotHariIni, marketShareData, targetBesokList, tomorrowDateStr,
    trafficData, totalAvgVisits, currentDayName, peakTrafficText
  } = useDashboardStats({
    archiveData, sisaArchive, priceList, bahanList, resepData, targetYieldData, localDate, visitData, normalizeDate,
    filterMode, selectedMonthIdx, selectedYear, startDate, endDate
  });

  const donutColors = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6', '#eab308', '#f43f5e', '#84cc16'];
  const radius = 38; const circumference = 2 * Math.PI * radius; let cumulativePercent = 0;

  const safeTrafficData = trafficData?.length ? trafficData : [{ hour: 7, total: 0 }, { hour: 8, total: 0 }];
  const maxTraffic = Math.max(...safeTrafficData.map(d => d.total), 1);
  const svgWidth = 1000; const svgHeight = 220; const paddingY = 40; 
  const xStep = safeTrafficData.length > 1 ? svgWidth / (safeTrafficData.length - 1) : svgWidth;
  const trafficPoints = safeTrafficData.map((d, i) => ({ x: i * xStep, y: svgHeight - paddingY - ((d.total / maxTraffic) * (svgHeight - paddingY * 2)), ...d }));
  
  const createSmoothPath = (points) => {
    if (points.length === 0) return '';
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i].x + points[i + 1].x) / 2;
      path += ` C ${xMid},${points[i].y} ${xMid},${points[i + 1].y} ${points[i + 1].x},${points[i + 1].y}`;
    }
    return path;
  };
  const smoothLine = createSmoothPath(trafficPoints);
  const smoothArea = trafficPoints.length > 1 ? `${smoothLine} L ${trafficPoints[trafficPoints.length - 1].x},${svgHeight - paddingY} L ${trafficPoints[0].x},${svgHeight - paddingY} Z` : '';

  const bestSalesKue = marketShareData?.list?.[0];

  // 🔥 Mengambil Data Rincian Produksi (Input) Hari Ini
  const todayProduction = useMemo(() => {
    const tglKey = normalizeDate(localDate);
    const dataHariIni = archiveData[tglKey] || [];
    return dataHariIni
      .filter(item => Number(item.stokBaru) > 0)
      .map(item => ({ kue: item.jenisKue, qty: Number(item.stokBaru) }));
  }, [archiveData, localDate, normalizeDate]);

  return (
    <div className="relative pb-32">
      
      {/* 🚀 STICKY HEADER ASLI (Tidak Diubah Margin/Padding-nya) 🚀 */}
      <div className="sticky top-0 z-[60] px-4 pt-4 pb-3 bg-white/95 dark:bg-[#020617]/95 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col gap-y-3">
        
        {/* Cover shadow untuk menyamarkan batas blur saat di-scroll */}
        <div className="absolute -top-20 left-0 right-0 h-20 bg-white/95 dark:bg-[#020617]/95 backdrop-blur-2xl"></div>
        
        {/* Baris Judul & Kalender */}
        <div className="flex items-center justify-between relative z-10 pt-1">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase">Dashboard</h1>
            <div className="h-1.5 w-8 bg-sky-500 mt-1.5 rounded-full shadow-sm shadow-sky-500/30"></div>
          </div>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 shadow-sm relative overflow-hidden active:scale-95 transition-transform">
            <CalendarDays size={12} className="text-sky-500 dark:text-sky-400" />
            <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest truncate max-w-[140px] sm:max-w-[200px] pointer-events-none">
              {formatTanggal(localDate)}
            </span>
            <input type="date" value={localDate} onChange={(e) => setLocalDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
        </div>

        {/* 📦 SNAPSHOT FISIK HARI INI */}
        <div className="grid grid-cols-4 gap-1.5 relative z-10">
          {[
            { label: 'Sisa Lalu', val: snapshotHariIni?.totalSisaSebelumnya || 0, color: 'text-slate-500', icon: Archive, isImportant: false },
            { label: 'Masuk', val: snapshotHariIni?.totalProduksi || 0, color: 'text-sky-500', icon: Star, isImportant: true },
            { label: 'Laku', val: snapshotHariIni?.totalTerjual || 0, color: 'text-emerald-500', icon: Award, isImportant: true },
            { label: 'Sisa Akhir', val: snapshotHariIni?.totalSisaAkhir || 0, color: 'text-amber-500', icon: Package, isImportant: true }
          ].map((item, i) => {
            const showWarning = !snapshotHariIni?.hasInputToday && item.isImportant;
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-[12px] p-2 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
                <item.icon size={13} className={`${item.color} mx-auto mb-1`} />
                <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate w-full">{item.label}</p>
                {showWarning ? (
                  <span className="text-[8px] font-black text-rose-500 animate-pulse leading-none uppercase">Input!</span>
                ) : (
                  <p className={`text-[13px] sm:text-sm font-black ${item.color} leading-none`}>{item.val}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* 👇 RINCIAN INPUT KUE HARI INI (1 Baris, Scroll Menyamping, Sangat Compact) 👇 */}
        {todayProduction.length > 0 && (
          <div className="relative z-10 -mt-1">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {todayProduction.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 shrink-0 bg-sky-50/50 dark:bg-sky-900/20 px-2 py-1 rounded-md border border-sky-100/50 dark:border-sky-800/30">
                  <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{item.kue}</span>
                  <span className="text-[9px] font-black text-sky-500 border-l border-sky-200/50 dark:border-sky-700 pl-1.5">{item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🎛️ FILTER CONTROLS */}
        <div className="relative z-10 bg-slate-100/50 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-1 flex flex-row gap-1 items-center shadow-sm w-full">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-lg p-0.5 flex items-center shrink-0 shadow-inner">
            {['all', 'bulan', 'periode'].map(mode => (
              <button key={mode} type="button" onClick={() => setFilterMode(mode)} className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${filterMode === mode ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>
                {mode === 'periode' ? 'Rentang' : mode}
              </button>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-end min-w-0">
            
            {/* 🔥 PENAMBAHAN TAMPILAN MASTER DATA UNTUK MODE 'ALL' */}
            {filterMode === 'all' && (
              <div className="flex items-center justify-center w-full gap-2 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] truncate">Master Database</span>
              </div>
            )}

            {filterMode === 'bulan' && (
              <div className="flex items-center w-full gap-1">
                <button onClick={() => setPickerType(pickerType === 'month' ? null : 'month')} className="w-full flex justify-between items-center bg-white/90 dark:bg-slate-950/90 text-[10px] font-bold text-slate-800 dark:text-slate-200 rounded-md px-2 py-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="truncate pr-1">{months[selectedMonthIdx]}</span> <ChevronDown size={10} className="text-slate-400" />
                </button>
                <button onClick={() => setPickerType(pickerType === 'year' ? null : 'year')} className="w-[55px] flex justify-between items-center bg-white/90 dark:bg-slate-950/90 text-[10px] font-bold text-slate-800 dark:text-slate-200 rounded-md px-2 py-1.5 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span>{selectedYear}</span> <ChevronDown size={10} className="text-slate-400" />
                </button>
              </div>
            )}
            
            {filterMode === 'periode' && (
              <div className="flex items-center gap-1 w-full min-w-0">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full flex-1 min-w-0 bg-white/90 dark:bg-slate-950/90 text-[9px] font-bold text-slate-800 dark:text-slate-200 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm outline-none text-center uppercase" />
                <span className="text-slate-400 font-black text-[8px]">-</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full flex-1 min-w-0 bg-white/90 dark:bg-slate-950/90 text-[9px] font-bold text-slate-800 dark:text-slate-200 p-1.5 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm outline-none text-center uppercase" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 px-4 space-y-4">
        {/* ALERT RUSAK */}
        {snapshotHariIni?.totalRusak > 0 && (
          <div className="bg-rose-500/10 dark:bg-rose-500/20 border border-rose-200/50 dark:border-rose-900/30 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-in zoom-in-95 z-10 relative">
            <div className="flex items-center gap-3">
              <div className="bg-rose-100 dark:bg-rose-900/50 p-2 rounded-lg"><AlertTriangle size={16} className="text-rose-500" /></div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-widest">Kue Basi/Rusak</span>
            </div>
            <span className="text-base font-black text-rose-600">{snapshotHariIni.totalRusak} Pcs</span>
          </div>
        )}

        {/* 🍰 MARKET SHARE */}
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] p-5 shadow-sm relative overflow-hidden flex flex-col z-10">
          <div className="flex items-center gap-2.5 mb-5 px-1">
            <div className="bg-sky-500/10 p-2 rounded-xl"><PieChart size={18} className="text-sky-500" /></div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none mb-1.5">Rata-Rata Terlaris Hari {currentDayName}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {filterMode === 'all' ? 'All-Time' : filterMode === 'bulan' ? `Bulan ${months[selectedMonthIdx]}` : 'Rentang Waktu'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8 mb-2">
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className={`w-full h-full -rotate-90 transition-all duration-1000 ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {marketShareData?.list?.map((item, idx) => {
                  const pct = marketShareData.totalTerjual > 0 ? (item.terjual / marketShareData.totalTerjual) : 0;
                  const strokeLength = (pct * circumference);
                  const offset = cumulativePercent * circumference;
                  cumulativePercent += pct;
                  return <circle key={idx} cx="50" cy="50" r={radius} fill="transparent" stroke={donutColors[idx % donutColors.length]} strokeWidth="12" strokeDasharray={`${strokeLength} ${circumference}`} strokeDashoffset={-offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />;
                })}
              </svg>
              <div className="absolute flex flex-col items-center mt-0.5">
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{marketShareData?.totalTerjual || 0}</span>
                <span className="text-[10px] font-bold text-sky-500 mt-1 uppercase tracking-tighter">Avg Laku</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-2.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 pb-1">
              {!marketShareData?.list || marketShareData.list.length === 0 ? (
                <div className="text-center text-[11px] text-slate-400 font-bold py-4">Belum ada data penjualan</div>
              ) : (
                marketShareData.list.map((item, idx) => {
                  const pct = marketShareData.totalTerjual > 0 ? ((item.terjual / marketShareData.totalTerjual) * 100).toFixed(1) : 0;
                  return (
                    <div key={idx} className="flex flex-col mb-1.5 border-b border-slate-200/80 dark:border-slate-700/80 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: donutColors[idx % donutColors.length] }}></span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{item.namaKue}</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm shrink-0">
                           <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">
                             {item.terjual} <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">pcs</span>
                           </span>
                           <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 border-l border-slate-300 dark:border-slate-600 pl-2 leading-none">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* 📈 GRAFIK TRAFFIC */}
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 rounded-[2rem] p-5 shadow-sm relative overflow-hidden flex flex-col z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1">
            <div className="flex items-center gap-2.5">
              <div className="bg-amber-500/10 dark:bg-amber-500/20 p-2 rounded-xl"><Clock size={18} className="text-amber-500" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none mb-1.5">Rerata Traffic Hari {currentDayName}</h3>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                  <Users size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">±{totalAvgVisits} Pengunjung</span>
                </div>
              </div>
            </div>
          </div>

          {peakTrafficText && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3 mb-3 mx-1 flex items-start gap-2.5">
               <span className="text-amber-500 mt-0.5">🔥</span>
               <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{peakTrafficText}</p>
            </div>
          )}

          <div className="h-44 w-full mt-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full min-w-[600px] h-full overflow-visible">
              <defs><linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" /></linearGradient></defs>
              {[0, 0.5, 1].map(ratio => {
                const yLine = svgHeight - paddingY - (ratio * (svgHeight - paddingY * 2));
                return <line key={ratio} x1="0" y1={yLine} x2={svgWidth} y2={yLine} stroke="#cbd5e1" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4,4" />
              })}
              {smoothArea && <path d={smoothArea} fill="url(#gradAmber)" className="animate-in fade-in duration-1000" />}
              {smoothLine && <path d={smoothLine} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-in slide-in-from-left-4 duration-1000" />}
              {trafficPoints.map((p, i) => (
                <g key={i} className="transition-all hover:opacity-80">
                  <line x1={p.x} y1={p.y} x2={p.x} y2={svgHeight - paddingY + 5} stroke="#f59e0b" strokeOpacity={p.total > 0 ? "0.4" : "0.1"} strokeWidth="1" strokeDasharray="3,3" />
                  <text x={p.x} y={svgHeight - paddingY + 22} textAnchor="middle" fontSize="12" fontWeight="bold" className="fill-slate-500 dark:fill-slate-400">{String(p.hour).padStart(2, '0')}:00</text>
                  {p.total > 0 && (
                    <>
                      <circle cx={p.x} cy={p.y} r="5.5" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" className="drop-shadow-sm" />
                      <rect x={p.x - 15} y={p.y - 30} width="30" height="20" rx="7" className="fill-slate-800 dark:fill-slate-100 shadow-lg" />
                      <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="12" fontWeight="900" className="fill-white dark:fill-slate-900">{p.total}</text>
                    </>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* 🎯 TARGET PRODUKSI BESOK */}
        <div className="bg-white/40 dark:bg-sky-950/20 backdrop-blur-xl border border-white/60 dark:border-sky-900/30 rounded-[2.5rem] p-5 shadow-sm relative overflow-hidden z-10">
          <div className="absolute -right-6 -top-6 opacity-[0.05] dark:opacity-[0.1] text-sky-600 rotate-12 pointer-events-none"><ChefHat size={140} /></div>
          <div className="flex items-center justify-between mb-5 relative z-10 px-1">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 text-white p-2.5 rounded-xl shadow-lg"><Target size={18} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none mb-1.5">Target Produksi Besok</h3>
                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">
                  {formatTanggal(tomorrowDateStr)}
                </p>
              </div>
            </div>
            <div className="bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-500/20 hidden sm:flex">
               <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
               <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">AI Optimized</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 relative z-10 max-h-[350px] overflow-y-auto custom-scrollbar pr-1 pb-2">
            {!targetBesokList || targetBesokList.length === 0 ? (
                <div className="col-span-full p-6 text-center text-slate-400"><p className="text-xs font-bold uppercase tracking-widest">Data belum memadai</p></div>
            ) : (
                targetBesokList.map((item, i) => (
                <div key={i} className={`p-4 rounded-3xl border flex flex-col justify-between shadow-sm transition-all hover:scale-[1.02] ${item.type==='naik'?'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50':item.type==='turun'?'bg-rose-50/80 dark:bg-rose-900/20 border-rose-200/50':'bg-white/80 dark:bg-slate-950/80 border-slate-100/50 dark:border-slate-800'}`}>
                    <div className="flex flex-col mb-4">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate flex items-center gap-1.5">
                        {item.type==='naik'?'🔥':item.type==='turun'?'📉':<span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>} {item.kue}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1">Laku: {item.rerata} | Sisa: {item.avgSisa || 0}</span>
                    
                    <div className="mt-2 flex">
                        <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider truncate max-w-full ${item.type==='naik'?'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300':item.type==='turun'?'bg-rose-500/20 text-rose-700 dark:text-rose-300':'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {item.reason || 'Normal'}
                        </span>
                    </div>
                    </div>

                    <div className="flex items-end justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3">
                    <div className="flex items-end gap-1">
                        <span className={`text-2xl font-black leading-none ${item.type==='naik'?'text-emerald-600 dark:text-emerald-400':item.type==='turun'?'text-rose-600 dark:text-rose-400':'text-slate-700 dark:text-slate-300'}`}>{item.target}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Pcs</span>
                    </div>
                    {item.type==='naik'?<ArrowUpRight size={18} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />:item.type==='turun'?<ArrowDownRight size={18} strokeWidth={3} className="text-rose-600 dark:text-rose-400" />:<TrendingUp size={16} className="text-slate-300 dark:text-slate-600" />}
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Picker Popups */}
      {pickerType === 'month' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={() => setPickerType(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xs p-4 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-xs font-black text-slate-400 mb-3 text-center uppercase tracking-widest">Pilih Bulan</h4>
            <div className="grid grid-cols-2 gap-2">
              {months.map((m, i) => (
                <button key={i} type="button" onClick={() => { setSelectedMonthIdx(i); setPickerType(null); }} className={`py-2.5 text-[10px] font-bold rounded-xl transition-all ${Number(selectedMonthIdx) === i ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {pickerType === 'year' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-6" onClick={() => setPickerType(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xs p-4 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-xs font-black text-slate-400 mb-3 text-center uppercase tracking-widest">Pilih Tahun</h4>
            <div className="flex flex-col gap-2">
              {years.map(y => (
                <button key={y} type="button" onClick={() => { setSelectedYear(y); setPickerType(null); }} className={`py-2.5 text-[10px] font-bold rounded-xl transition-all ${Number(selectedYear) === y ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95'}`}>
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
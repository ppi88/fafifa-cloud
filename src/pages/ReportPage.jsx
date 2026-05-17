import React, { useState, useMemo, useCallback } from 'react';
import { CalendarDays, ChevronDown, Clock3, AlertTriangle } from 'lucide-react';
import ReportTable from '../components/ReportTable';

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

const ReportPage = ({
  archiveData = {},
  sisaArchive = {},
  priceList = {},
  bahanList = {},
  resepData = {},
  targetYieldData = {},
  selectedDate,
  setSelectedDate,
  normalizeDate,
  onDeleteDate // 🔥 1. WAJIB DI-DESTRUCTURE DI SINI
}) => {

  const [filterMode, setFilterMode] = useState('harian');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  const dateKey = useMemo(() => normalizeDate(selectedDate), [selectedDate, normalizeDate]);

  const months = useMemo(() => [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ], []);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i), []);

  const { idxArchive, idxSisa } = useMemo(() => {
    const iA = {}; const iS = {};
    const aKeys = Object.keys(archiveData);
    for (let i = 0; i < aKeys.length; i++) {
      const k = aKeys[i]; iA[k] = {};
      const arr = archiveData[k] || [];
      for (let j = 0; j < arr.length; j++) { iA[k][arr[j].jenisKue] = arr[j]; }
    }
    const sKeys = Object.keys(sisaArchive);
    for (let i = 0; i < sKeys.length; i++) {
      const k = sKeys[i]; iS[k] = {};
      const arr = sisaArchive[k] || [];
      for (let j = 0; j < arr.length; j++) { iS[k][arr[j].jenisKue] = arr[j]; }
    }
    return { idxArchive: iA, idxSisa: iS };
  }, [archiveData, sisaArchive]);

  const reportPayload = useMemo(() => {
    const sDateSafe = parseSafeDate(startDate); if (sDateSafe) sDateSafe.setHours(0,0,0,0);
    const eDateSafe = parseSafeDate(endDate); if (eDateSafe) eDateSafe.setHours(23,59,59,999);

    let datesToProcess = [];
    const allUniqueDates = Array.from(new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)]));

    if (filterMode === 'harian') {
      datesToProcess = [dateKey];
    } else if (filterMode === 'bulan') {
      const sBulan = new Date(selectedYear, selectedMonthIdx, 1, 0, 0, 0);
      const eBulan = new Date(selectedYear, Number(selectedMonthIdx) + 1, 0, 23, 59, 59);
      datesToProcess = tyrannicalDateFilter(allUniqueDates, sBulan, eBulan);
    } else if (filterMode === 'periode') {
      datesToProcess = tyrannicalDateFilter(allUniqueDates, sDateSafe, eDateSafe);
    } else {
      datesToProcess = allUniqueDates.sort(sortDatesDescending);
    }

    let globalOmzet = 0; let globalModal = 0; let globalLaba = 0;
    let globalProd = 0; let globalRusak = 0; let globalLaku = 0;
    const feedDailyReports = [];

    const listHargaKue = Object.keys(priceList);

    const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
    const cachedModalMap = {};
    listHargaKue.forEach(kue => {
      const resep = resepData[kue] || [];
      const modalResep = resep.reduce((sum, item) => {
        const b = bahanList[item.namaBahan];
        return sum + (((b?.harga || 0) / (b?.kuantitas || 1)) * item.qty);
      }, 0);
      const currentYield = targetYieldData[kue] || targetYieldData[cleanKey(kue)] || 1;
      cachedModalMap[kue] = modalResep / currentYield;
    });

    for (let d = 0; d < datesToProcess.length; d++) {
      const tgl = datesToProcess[d];
      const dObj = parseSafeDate(tgl); if (!dObj) continue;

      const y = new Date(dObj); y.setDate(y.getDate() - 1);
      const yKey = normalizeDate(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`);

      const dailyRows = [];
      const activeKueThisDay = new Set([
        ...Object.keys(idxArchive[tgl] || {}),
        ...Object.keys(idxSisa[tgl] || {}),
        ...Object.keys(idxSisa[yKey] || {})
      ]);

      Array.from(activeKueThisDay).forEach(kue => {
        if (!priceList.hasOwnProperty(kue)) return;

        const prodItem = idxArchive[tgl]?.[kue];
        const sisaItem = idxSisa[tgl]?.[kue];
        const sisaKemarinItem = idxSisa[yKey]?.[kue];

        const sisaKemarin = Number(sisaKemarinItem?.sisa || 0);
        const stokBaru = Number(prodItem?.stokBaru || 0);
        const stokBorongan = Number(prodItem?.stokBorongan || 0);
        const sisaAkhir = sisaItem ? Number(sisaItem.sisa) : '-';
        const rusak = sisaItem ? Number(sisaItem.rusak) : 0;
        const hargaJual = prodItem?.hargaJual ? Number(prodItem.hargaJual) : (priceList[kue] || 0);
        const modalPcs = prodItem?.modalPcs ? Number(prodItem.modalPcs) : (cachedModalMap[kue] || 0);

        const prodTotalBaru = stokBaru + stokBorongan;
        const totalStok = sisaKemarin + prodTotalBaru;
        
        let laku = 0;
        if (sisaAkhir !== '-') {
          laku = Math.max(0, totalStok - Number(sisaAkhir) - rusak);
          globalOmzet += (laku * hargaJual);
          globalModal += ((laku + rusak) * modalPcs);
          globalRusak += rusak;
          globalLaku += laku;
        }

        globalProd += prodTotalBaru;

        dailyRows.push({
          jenisKue: kue,
          sisaKemarin,
          stokBaru,
          stokBorongan,
          sisaAkhir,
          rusak,
          hargaJual
        });
      });

      if (dailyRows.length > 0) {
        feedDailyReports.push({ tanggalStr: tgl, rowData: dailyRows });
      }
    }

    globalLaba = globalOmzet - globalModal;

    return {
      cards: { omzet: globalOmzet, modal: globalModal, labaBersih: globalLaba, prod: globalProd, rusak: globalRusak, terjual: globalLaku },
      feedDailyReports
    };

    function tyrannicalDateFilter(arr, sBounds, eBounds) {
      if (!sBounds || !eBounds) return arr;
      return arr.filter(k => {
        const target = parseSafeDate(k);
        return target && target >= sBounds && target <= eBounds;
      }).sort(sortDatesDescending);
    }
    function sortDatesDescending(a, b) { return parseSafeDate(b) - parseSafeDate(a); }

  }, [filterMode, dateKey, selectedMonthIdx, selectedYear, startDate, endDate, archiveData, sisaArchive, priceList, resepData, bahanList, targetYieldData, idxArchive, idxSisa, normalizeDate]);

  const formatRp = useCallback((num) => `Rp ${Math.round(num).toLocaleString('id-ID')}`, []);

  return (
    <div className="relative pb-32 font-sans w-full min-h-screen bg-[#f8fafc] dark:bg-[#020617]">

      {/* STICKY HEADER */}
      <div className="sticky top-0 z-[70] -mx-4 px-4 pt-2 pb-3 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-3">
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]" />

        <div className="flex items-center justify-between relative z-10 pt-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase">
            Laporan Keuangan
          </h1>
        </div>

        <div className="relative z-[80] w-full">
          <div className="flex flex-row gap-1.5 items-center w-full pb-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 rounded-xl flex items-center shrink-0 shadow-sm h-[38px]">
              {['all', 'harian', 'bulan', 'periode'].map((mode) => {
                const label = mode === 'all' ? 'ALL' : mode === 'harian' ? 'HARI' : mode === 'bulan' ? 'BULAN' : 'RENTANG';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 sm:px-4 py-1.5 h-full text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                      filterMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center flex-1 w-full min-w-[150px] h-[38px] shadow-sm">
              {filterMode === 'all' && (
                <div className="px-3 flex items-center gap-2 w-full justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] truncate">Master Database</span>
                </div>
              )}
              {filterMode === 'harian' && (
                <div className="flex items-center w-full gap-1 px-1">
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 uppercase cursor-pointer text-center shadow-sm"
                  />
                </div>
              )}
              {filterMode === 'bulan' && (
                <div className="flex items-center w-full gap-1 px-1">
                  <div className="relative flex-1 min-w-0">
                    <select
                      value={selectedMonthIdx}
                      onChange={(e) => setSelectedMonthIdx(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-lg border border-slate-200 dark:border-slate-700 pl-2 pr-5 py-1 appearance-none cursor-pointer truncate shadow-sm"
                    >
                      {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative w-[35%] min-w-[65px]">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-lg border border-slate-200 dark:border-slate-700 pl-2 pr-5 py-1 appearance-none cursor-pointer shadow-sm"
                    >
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
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
                    className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-1 uppercase cursor-pointer text-center shadow-sm"
                  />
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-[10px] shrink-0">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 min-w-0 w-full bg-white dark:bg-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-200 outline-none rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-1 uppercase cursor-pointer text-center shadow-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REKAP KEUANGAN ATAS */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 relative z-10 pt-1">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-2xl p-2.5 shadow-sm border border-white/10 flex flex-col justify-center">
            <p className="text-[8px] font-bold text-blue-100/80 uppercase tracking-widest mb-0.5 leading-none">Total Estimasi Laba</p>
            <span className="text-[14px] sm:text-[16px] font-black tracking-tight text-white truncate leading-none">
              {reportPayload.cards.labaBersih >= 0 ? '+' : ''}{formatRp(reportPayload.cards.labaBersih)}
            </span>
          </div>

          <div className="bg-blue-50/80 dark:bg-blue-900/30 p-2.5 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5 leading-none">Omzet</p>
            <p className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-slate-100 tracking-tight truncate leading-none">
              {formatRp(reportPayload.cards.omzet)}
            </p>
          </div>

          <div className="bg-amber-50/80 dark:bg-amber-900/30 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-800/50 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5 leading-none">Modal</p>
            <p className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-slate-100 tracking-tight truncate leading-none">
              {formatRp(reportPayload.cards.modal)}
            </p>
          </div>
        </div>

        {/* SUB-FISIK RINGKASAN */}
        <div className="bg-white/80 dark:bg-slate-900/80 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between text-center divide-x divide-slate-100 dark:divide-slate-800 relative z-10 backdrop-blur-sm">
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Produksi</p>
            <p className="text-[14px] font-black text-slate-700 dark:text-slate-200 leading-none">{reportPayload.cards.prod}</p>
          </div>
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Rusak/Basi</p>
            <p className="text-[14px] font-black text-rose-600 leading-none">{reportPayload.cards.rusak}</p>
          </div>
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Laku Bersih</p>
            <p className="text-[14px] font-black text-emerald-600 leading-none">{reportPayload.cards.terjual}</p>
          </div>
        </div>

      </div>

      {/* CHRONOLOGICAL REPORT FEED CONTEXT */}
      <div className="mt-4 px-1 space-y-6">
        {reportPayload.feedDailyReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/40 rounded-[1.2rem] border border-slate-200/60 dark:border-slate-800/60 p-8 text-center shadow-sm">
            <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
              Tidak ada aktivitas finansial di periode ini
            </p>
          </div>
        ) : (
          reportPayload.feedDailyReports.map((dayData) => (
            <ReportTable
              key={dayData.tanggalStr}
              tanggal={dayData.tanggalStr}
              isToday={normalizeDate(new Date()) === dayData.tanggalStr}
              data={dayData.rowData}
              // 🔥 2. SUNTIKKAN PINDAHAN DARI INDUK KE COMPONENT ANAK DI SINI:
              onDelete={onDeleteDate ? () => onDeleteDate(dayData.tanggalStr) : undefined}
            />
          ))
        )}
      </div>

    </div>
  );
};

export default React.memo(ReportPage);
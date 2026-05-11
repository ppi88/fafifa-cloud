import React, { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays,
  Sigma,
  ChevronDown,
  Clock3
} from 'lucide-react';

import PerformanceTable from '../components/PerformanceTable';

const ReportPage = ({
  archiveData = {},
  sisaArchive = {},
  priceList = {},
  bahanList = {},
  resepData = {},
  targetYieldData = {},
  hiddenKueList = [],
  selectedDate,
  setSelectedDate,
  normalizeDate,
  formatTanggal
}) => {

  // ======================================================
  // FILTER MODE (DEFAULT JADI 'harian')
  // ======================================================
  const [filterMode, setFilterMode] = useState('harian');

  const [selectedMonthIdx, setSelectedMonthIdx] = useState(
    () => new Date().getMonth()
  );

  const [selectedYear, setSelectedYear] = useState(
    () => new Date().getFullYear()
  );

  const [startDate, setStartDate] = useState(() =>
    `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}-01`
  );

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  });

  // ======================================================
  // DATE
  // ======================================================
  const dateKey = normalizeDate(selectedDate);

  // 🔥 OPTIMASI: Dibungkus useCallback agar memori tidak bocor
  const parseDateKey = useCallback((dKey) => {
    if (!dKey) return new Date(0);
    const split = dKey.split('/');
    return new Date(
      split[2],
      split[1] - 1,
      split[0]
    );
  }, []);

  // 🔥 OPTIMASI: Dibungkus useCallback
  const formatHeaderDate = useCallback((dateString) => {
    if (!dateString) return 'Tanggal belum dipilih';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  // ======================================================
  // MONTHS
  // ======================================================
  const months = useMemo(() => [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ], []);

  const years = useMemo(() => Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  ), []);

  // ======================================================
  // INDEXING
  // ======================================================
  const {
    idxArchive,
    idxSisa
  } = useMemo(() => {
    const iA = {};
    const iS = {};

    Object.keys(archiveData).forEach((k) => {
      iA[k] = {};
      (archiveData[k] || []).forEach((item) => {
        iA[k][item.jenisKue] = item;
      });
    });

    Object.keys(sisaArchive).forEach((k) => {
      iS[k] = {};
      (sisaArchive[k] || []).forEach((item) => {
        iS[k][item.jenisKue] = item;
      });
    });

    return {
      idxArchive: iA,
      idxSisa: iS
    };
  }, [archiveData, sisaArchive]);

  // ======================================================
  // GET SISA KEMARIN
  // ======================================================
  // 🔥 OPTIMASI: Dibungkus useCallback
  const getSisaKemarinFast = useCallback((currentDateObj, namaKue) => {
    let y = new Date(currentDateObj);
    y.setDate(y.getDate() - 1);
    const yKey = normalizeDate(
      `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
    );
    return Number(idxSisa[yKey]?.[namaKue]?.sisa || 0);
  }, [idxSisa, normalizeDate]);

  // ======================================================
  // CLEAN KEY
  // ======================================================
  // 🔥 OPTIMASI: Dibungkus useCallback
  const cleanKey = useCallback((str) => str ? str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '', []);

  // ======================================================
  // REPORT STATS
  // ======================================================
  const reportStats = useMemo(() => {
    let stats = {
      omzet: 0, modal: 0, prod: 0, terjual: 0, rusak: 0,
      sisaKemarin: 0, sisaAkhir: 0, detailKue: [], dataPeriode: []
    };

    const sDateSafe = new Date(startDate);
    sDateSafe.setHours(0, 0, 0, 0);
    const eDateSafe = new Date(endDate);
    eDateSafe.setHours(23, 59, 59, 999);

    let datesToProcess = [];

    // ==================================================
    // FILTER MODE
    // ==================================================
    if (filterMode === 'all') {
      datesToProcess = [...new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)])]
        .filter((k) => !isNaN(parseDateKey(k).getTime()))
        .sort((a, b) => parseDateKey(b) - parseDateKey(a));
    } else if (filterMode === 'harian') {
      datesToProcess = [dateKey];
    } else if (filterMode === 'bulan') {
      const sBulan = new Date(selectedYear, selectedMonthIdx, 1);
      sBulan.setHours(0, 0, 0, 0);
      const eBulan = new Date(selectedYear, Number(selectedMonthIdx) + 1, 0);
      eBulan.setHours(23, 59, 59, 999);
      datesToProcess = [...new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)])]
        .filter((k) => {
          let d = parseDateKey(k);
          return d >= sBulan && d <= eBulan;
        })
        .sort((a, b) => parseDateKey(b) - parseDateKey(a));
    } else {
      datesToProcess = [...new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)])]
        .filter((k) => {
          let d = parseDateKey(k);
          return d >= sDateSafe && d <= eDateSafe;
        })
        .sort((a, b) => parseDateKey(b) - parseDateKey(a));
    }

    let kueMap = {};
    const listHargaKue = Object.keys(priceList);

    datesToProcess.forEach((tgl) => {
      let rincianHariIni = [];
      let hariOmzet = 0; let hariModal = 0; let hariProd = 0; let hariNetSale = 0;
      const dObj = parseDateKey(tgl);

      listHargaKue.forEach((kue) => {
        const prodItem = idxArchive[tgl]?.[kue];
        const prodBaru = Number(prodItem?.stokBaru || 0);
        const hrgJual = (prodItem && prodItem.hargaJual !== undefined && prodItem.hargaJual !== '') 
            ? Number(prodItem.hargaJual) : (Number(priceList[kue]) || 0);

        let modalPcs = 0;
        if (prodItem && prodItem.modalPcs !== undefined && prodItem.modalPcs !== '') {
          modalPcs = Number(prodItem.modalPcs);
        } else {
          const resep = resepData[kue] || [];
          const modalResep = resep.reduce((sum, item) => {
            return sum + (((bahanList[item.namaBahan]?.harga || 0) / (bahanList[item.namaBahan]?.kuantitas || 1)) * item.qty);
          }, 0);
          const currentYield = targetYieldData[kue] || targetYieldData[cleanKey(kue)] || 1;
          modalPcs = modalResep / currentYield;
        }

        const sisaAkhirObj = idxSisa[tgl]?.[kue];
        const sisaAkhir = sisaAkhirObj ? Number(sisaAkhirObj.sisa) : 0;
        const rusak = sisaAkhirObj ? Number(sisaAkhirObj.rusak) : 0;
        const sisaLalu = getSisaKemarinFast(dObj, kue);

        if (prodBaru === 0 && sisaAkhir === 0 && rusak === 0 && sisaLalu === 0) return;

        const netSale = Math.max(0, (sisaLalu + prodBaru) - sisaAkhir - rusak);

        stats.sisaKemarin += sisaLalu;
        stats.prod += prodBaru;
        stats.sisaAkhir += sisaAkhir;
        stats.rusak += rusak;

        if (prodBaru > 0 || netSale > 0 || sisaAkhir > 0 || rusak > 0) {
          const omzet = netSale * hrgJual;
          const modal = (netSale + rusak) * modalPcs;

          if (!kueMap[kue]) {
            kueMap[kue] = { namaKue: kue, terjual: 0, omzetKue: 0, modalKue: 0, hrgJual, modalPcs };
          }
          kueMap[kue].terjual += netSale;
          kueMap[kue].omzetKue += omzet;
          kueMap[kue].modalKue += modal;
          hariOmzet += omzet; hariModal += modal; hariProd += prodBaru; hariNetSale += netSale;

          rincianHariIni.push({
            namaKue: kue, hrgJual, modalPcs, prodBaru, netSale, omzet, modal, laba: omzet - modal
          });
        }
      });

      if ((filterMode === 'all' || filterMode === 'periode' || filterMode === 'bulan' || filterMode === 'harian') && rincianHariIni.length > 0) {
        stats.dataPeriode.push({
          tgl, hariProd, hariNetSale, hariOmzet, hariModal, hariLaba: hariOmzet - hariModal,
          rincianKue: rincianHariIni.sort((a, b) => b.laba - a.laba)
        });
      }
    });

    stats.detailKue = Object.values(kueMap)
      .map((k) => ({ ...k, labaKue: k.omzetKue - k.modalKue }))
      .sort((a, b) => b.labaKue - a.labaKue);

    stats.omzet = stats.detailKue.reduce((s, k) => s + k.omzetKue, 0);
    stats.modal = stats.detailKue.reduce((s, k) => s + k.modalKue, 0);
    stats.labaBersih = stats.omzet - stats.modal;
    stats.terjual = stats.detailKue.reduce((s, k) => s + k.terjual, 0);

    return stats;
  }, [filterMode, dateKey, selectedMonthIdx, selectedYear, startDate, endDate, archiveData, sisaArchive, priceList, bahanList, resepData, targetYieldData, hiddenKueList, idxArchive, idxSisa, normalizeDate, parseDateKey, cleanKey, getSisaKemarinFast]);

  // 🔥 OPTIMASI: Dibungkus useCallback agar PerformanceTable tidak re-render tanpa alasan
  const formatRp = useCallback((num) => `Rp ${Math.round(num).toLocaleString('id-ID')}`, []);

  // 🔥 OPTIMASI: Di-memo agar kalkulasi tidak berulang
  const labelLaba = useMemo(() => {
    if (filterMode === 'all') return 'All Time';
    if (filterMode === 'bulan') return 'Bulanan';
    if (filterMode === 'periode') return 'Rentang';
    return 'Harian';
  }, [filterMode]);

  return (
    <div className="relative pb-32 font-sans w-full min-h-screen bg-[#f8fafc] dark:bg-[#020617]">

      {/* ================================================== */}
      {/* STICKY HEADER */}
      {/* ================================================== */}
      <div className="sticky top-0 z-[70] -mx-4 px-4 pt-2 pb-3 bg-[#f8fafc]/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm space-y-3">
        <div className="absolute -top-20 left-0 right-0 h-20 bg-[#f8fafc] dark:bg-[#020617]" />

        {/* TITLE */}
        <div className="flex items-center justify-between relative z-10 pt-1">
          <div className="flex flex-col justify-center">
            
            {/* Ikon Sparkles sudah dihilangkan */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none uppercase">
                Laporan Keuangan
              </h1>
              <div className="h-1.5 w-10 bg-sky-500 mt-1.5 rounded-full shadow-sm shadow-sky-500/30" />
            </div>

          </div>
        </div>

        {/* FILTER */}
        <div className="relative z-[80] w-full">
          <div className="flex flex-row gap-1.5 items-center w-full pb-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* MODE */}
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

            {/* INPUT */}
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center flex-1 w-full min-w-[150px] h-[38px] shadow-sm">
              {filterMode === 'all' && (
                <div className="px-3 flex items-center gap-2 w-full justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] truncate">Master Database</span>
                </div>
              )}
              {filterMode === 'harian' && (
                <div className="flex items-center w-full gap-1 px-1">
                  <CalendarDays size={12} className="text-blue-500 shrink-0 ml-1 hidden sm:block" />
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
                  <CalendarDays size={12} className="text-blue-500 shrink-0 ml-1 hidden sm:block" />
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

        {/* HARIAN DATE INFO */}
        {filterMode === 'harian' && (
          <div className="relative z-10 flex items-center justify-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 backdrop-blur-sm shadow-sm">
            <Clock3 size={13} className="text-blue-500" />
            <span className="text-[10px] sm:text-[11px] font-black tracking-wide uppercase text-slate-700 dark:text-slate-200 text-center">
              {formatHeaderDate(selectedDate)}
            </span>
          </div>
        )}

        {/* 🔥 KOTAK REKAPITULASI KEUANGAN (GABUNGAN 1 BARIS) 🔥 */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 relative z-10 pt-1">
          
          {/* TOTAL LABA (UTAMA KIRI) */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-2xl p-2.5 shadow-sm border border-white/10 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent_40%)] pointer-events-none" />
            <p className="text-[8px] font-bold text-blue-100/80 uppercase tracking-widest mb-0.5 leading-none">Total Laba</p>
            <span className="text-[14px] sm:text-[16px] font-black tracking-tight text-white drop-shadow-sm truncate leading-none">
              {reportStats.labaBersih >= 0 ? '+' : ''}{formatRp(reportStats.labaBersih)}
            </span>
          </div>

          {/* TOTAL OMZET (TENGAH) */}
          <div className="bg-blue-50/80 dark:bg-blue-900/30 p-2.5 rounded-2xl border border-blue-100 dark:border-blue-800/50 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5 leading-none">Omzet</p>
            <p className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-slate-100 tracking-tight truncate leading-none">
              {formatRp(reportStats.omzet)}
            </p>
          </div>

          {/* TOTAL MODAL (KANAN) */}
          <div className="bg-amber-50/80 dark:bg-amber-900/30 p-2.5 rounded-2xl border border-amber-100 dark:border-amber-800/50 shadow-sm flex flex-col justify-center">
            <p className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5 leading-none">Modal</p>
            <p className="text-[11px] sm:text-[12px] font-black text-slate-800 dark:text-slate-100 tracking-tight truncate leading-none">
              {formatRp(reportStats.modal)}
            </p>
          </div>

        </div>

        {/* ================================================== */}
        {/* FISIK */}
        {/* ================================================== */}
        <div className="bg-white/80 dark:bg-slate-900/80 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between text-center divide-x divide-slate-100 dark:divide-slate-800 relative z-10 backdrop-blur-sm">
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Produksi</p>
            <p className="text-[14px] font-black text-slate-700 dark:text-slate-200 leading-none">{reportStats.prod}</p>
          </div>
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Rusak/Basi</p>
            <p className="text-[14px] font-black text-rose-600 leading-none">{reportStats.rusak}</p>
          </div>
          <div className="w-1/3 flex flex-col justify-center">
            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Laku Bersih</p>
            <p className="text-[14px] font-black text-emerald-600 leading-none">{reportStats.terjual}</p>
          </div>
        </div>

      </div>

      {/* ================================================== */}
      {/* TABLE */}
      {/* ================================================== */}
      <div className="pt-2 mt-2 -mx-2 px-2 sm:mx-0 sm:px-0">
        <PerformanceTable
          mode={filterMode === 'harian' ? 'harian' : 'periode'}
          stats={reportStats}
          formatRp={formatRp}
        />
      </div>

    </div>
  );
};

export default ReportPage;
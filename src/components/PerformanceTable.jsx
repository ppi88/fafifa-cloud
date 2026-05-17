import React, { useMemo, useCallback, memo } from 'react';
import { AlertOctagon, Sigma } from 'lucide-react';

// ============================================================================
// 🌍 STATIC POOL CONFIGURATION (Dilempar ke luar untuk menghemat alokasi RAM)
// ============================================================================
const COLOR_PALETTE = [
  'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-lime-500', 'bg-fuchsia-500'
];

const TABLE_HEAD_CLASS = 'px-3 md:px-4 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest sticky top-0 backdrop-blur-xl whitespace-nowrap z-20 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]';
const TABLE_CELL_CLASS = 'px-3 md:px-4 py-2.5 text-[12px] md:text-[13px] whitespace-nowrap border-t border-slate-100 dark:border-slate-800/40';

// Absolute Timezone Safety Engine untuk Android WebView
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

// Static Table Header (Bebas Re-render)
const TableHeader = memo(() => (
  <thead>
    <tr className="bg-indigo-50/95 dark:bg-slate-800/95">
      <th className={`${TABLE_HEAD_CLASS} text-indigo-500 dark:text-slate-300 left-0 z-30 bg-indigo-50/95 dark:bg-slate-800/95 shadow-[1px_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_1px_0_0_rgba(255,255,255,0.02)]`}>
        Kue
      </th>
      <th className={`${TABLE_HEAD_CLASS} text-indigo-400 dark:text-slate-400 text-center bg-indigo-50/95 dark:bg-slate-800/95`}>
        Laku
      </th>
      <th className={`${TABLE_HEAD_CLASS} text-indigo-400 dark:text-slate-400 text-right bg-indigo-50/95 dark:bg-slate-800/95`}>
        Omzet
      </th>
      <th className={`${TABLE_HEAD_CLASS} text-indigo-400 dark:text-slate-400 text-right bg-indigo-50/95 dark:bg-slate-800/95`}>
        Modal
      </th>
      <th className={`${TABLE_HEAD_CLASS} text-indigo-500 dark:text-sky-400 text-right bg-indigo-50/95 dark:bg-slate-800/95`}>
        Laba
      </th>
    </tr>
  </thead>
));

// 🔥 HOISTING FIX: KueRow Ditendang Keluar dari Parent Body Komponen Utama 🔥
const KueRow = memo(({ item, dotColor, formatRp, isPeriode = false }) => {
  const qty = isPeriode ? item.netSale : item.terjual;
  const omzet = isPeriode ? item.omzet : item.omzetKue;
  const modal = isPeriode ? item.modal : item.modalKue;
  const laba = isPeriode ? item.laba : item.labaKue;

  return (
    <tr className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-3 md:px-4 py-2.5 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/50 whitespace-nowrap z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.03)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)] border-t border-slate-100 dark:border-slate-800/40 transition-colors">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[11px] md:text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase truncate leading-none mb-0.5">
              {item.namaKue}
            </p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">
              J: {formatRp(item.hrgJual)} / M: {formatRp(item.modalPcs)}
            </p>
          </div>
        </div>
      </td>
      <td className={`${TABLE_CELL_CLASS} font-black text-center text-emerald-600 dark:text-emerald-400`}>
        {qty} <span className="text-[9px] font-bold opacity-60 ml-1">Pcs</span>
      </td>
      <td className={`${TABLE_CELL_CLASS} font-black text-right text-slate-800 dark:text-slate-100`}>
        {formatRp(omzet)}
      </td>
      <td className={`${TABLE_CELL_CLASS} font-medium text-right text-slate-500 dark:text-slate-400`}>
        {formatRp(modal)}
      </td>
      <td className={`${TABLE_CELL_CLASS} font-black text-right ${laba >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {laba >= 0 ? '+' : ''}{formatRp(laba)}
      </td>
    </tr>
  );
});

// ============================================================================
// 📊 PERFORMANCE DATA INTERFACE COMPONENT
// ============================================================================
const PerformanceTable = ({ mode, stats, formatRp }) => {

  const isBulanan = mode === 'bulan';
  const isHarian = mode === 'harian';
  const isAggregate = isBulanan || isHarian;

  const hasData = useMemo(() => {
    return isAggregate ? stats?.detailKue?.length > 0 : stats?.dataPeriode?.length > 0;
  }, [isAggregate, stats]);

  // Penangkal displacement penanggalan Android WebView
  const getHariTanggal = useCallback((tglStr) => {
    if (!tglStr) return '-';
    try {
      const dObj = parseSafeDate(tglStr);
      if (!dObj || isNaN(dObj.getTime())) return tglStr;

      const namaHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dObj);
      const tanggalFormatted = dObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

      return `${namaHari}, ${tanggalFormatted}`;
    } catch {
      return tglStr;
    }
  }, []);

  // Map Cluster indexing penentu palet warna baris kue
  const { fullDetailKue, colorMap } = useMemo(() => {
    const namesSet = new Set();
    const details = [];

    if (isAggregate) {
      const arr = stats?.detailKue || [];
      for (let i = 0; i < arr.length; i++) {
        namesSet.add(arr[i].namaKue);
        details.push(arr[i]);
      }
    } else {
      const periode = stats?.dataPeriode || [];
      for (let i = 0; i < periode.length; i++) {
        const rincian = periode[i]?.rincianKue || [];
        for (let j = 0; j < rincian.length; j++) {
          namesSet.add(rincian[j].namaKue);
        }
      }
    }

    const uniqueNames = Array.from(namesSet);
    const cMap = Object.create(null);

    for (let i = 0; i < uniqueNames.length; i++) {
      cMap[uniqueNames[i]] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    }

    return { fullDetailKue: details, colorMap: cMap };
  }, [isAggregate, stats]);

  if (!hasData) {
    return (
      <div className="py-16 mt-4 flex flex-col items-center justify-center text-center px-10 opacity-70 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <AlertOctagon size={38} className="text-slate-300 mb-3" />
        <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Belum Ada Data</p>
      </div>
    );
  }

  // CONTAINER RENDERING STRATEGY 1: MODE AGGREGATE (HARIAN & BULANAN)
  if (isAggregate) {
    return (
      <div className="space-y-3">
        {isHarian && stats?.tanggal && (
          <div className="flex items-center gap-3 px-2">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
            <div className="flex items-center gap-2 py-1 px-3 rounded-full border bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight whitespace-nowrap">
                {getHariTanggal(stats.tanggal)}
              </span>
            </div>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
          </div>
        )}

        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm transition-all relative">
          <div className="overflow-x-auto overflow-y-auto max-h-[500px] md:max-h-[600px] custom-scrollbar transform-gpu will-change-scroll relative">
            <table className="w-full min-w-[450px] text-left border-collapse">
              <TableHeader />
              <tbody className="bg-white dark:bg-slate-900">
                {fullDetailKue.map((item, idx) => (
                  <KueRow key={`${item.namaKue}-${idx}`} item={item} dotColor={colorMap[item.namaKue]} formatRp={formatRp} />
                ))}
              </tbody>
              <tfoot className="bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/60 dark:border-slate-700/60 sticky bottom-0 z-20 backdrop-blur-xl">
                <tr className="font-black text-[11px]">
                  <td className="px-3 py-3 sticky left-0 bg-slate-100/95 dark:bg-slate-800/95 uppercase text-slate-500 flex items-center gap-1.5 z-30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">
                    <Sigma size={14} />
                    {isBulanan ? 'Subtotal Bulan' : 'Total Harian'}
                  </td>
                  <td className="px-3 py-3 text-center text-emerald-600 dark:text-emerald-400">
                    {stats.terjual} <span className="text-[9px] opacity-60 ml-1">Pcs</span>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-800 dark:text-slate-100">{formatRp(stats.omzet)}</td>
                  <td className="px-3 py-3 text-right text-slate-800 dark:text-slate-100">{formatRp(stats.modal)}</td>
                  <td className={`px-3 py-3 text-right ${stats.labaBersih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatRp(stats.labaBersih)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // CONTAINER RENDERING STRATEGY 2: MODE PERIODE (CHRONOLOGICAL FEED)
  return (
    <div className="space-y-6 pt-2">
      {stats.dataPeriode.map((hari, idxHari) => (
        <section key={`${hari.tgl}-${idxHari}`} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          <div className="flex items-center gap-3 px-2 mb-2.5">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
            <div className="flex items-center gap-2 py-0.5 px-3 rounded-full border bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                {getHariTanggal(hari.tgl)}
              </span>
            </div>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
          </div>

          <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm relative">
            <div className="overflow-x-auto custom-scrollbar transform-gpu will-change-scroll">
              <table className="w-full min-w-[450px] text-left border-collapse">
                <TableHeader />
                <tbody className="bg-white dark:bg-slate-900">
                  {hari.rincianKue.map((kue, idxKue) => (
                    <KueRow key={`${kue.namaKue}-${idxKue}`} item={kue} dotColor={colorMap[kue.namaKue]} formatRp={formatRp} isPeriode />
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 dark:bg-slate-800/90 border-t border-slate-200/60 dark:border-slate-700/60 font-black text-[10px] backdrop-blur-xl">
                  <tr>
                    <td className="px-3 py-2.5 sticky left-0 bg-slate-100/95 dark:bg-slate-800/95 uppercase text-slate-500 dark:text-slate-400 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">Total</td>
                    <td className="px-2 py-2.5 text-center text-emerald-600 dark:text-emerald-400">
                      {hari.hariNetSale} <span className="text-[8px] opacity-60 ml-0.5">Pcs</span>
                    </td>
                    <td className="px-2 py-2.5 text-right text-slate-800 dark:text-slate-100">{formatRp(hari.hariOmzet)}</td>
                    <td className="px-2 py-2.5 text-right text-slate-800 dark:text-slate-100">{formatRp(hari.hariModal)}</td>
                    <td className={`px-3 py-2.5 text-right ${hari.hariLaba >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatRp(hari.hariLaba)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default memo(PerformanceTable);
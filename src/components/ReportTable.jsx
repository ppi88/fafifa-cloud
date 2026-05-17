import React, { useMemo } from 'react';
import { Trash2, Calculator, Info, AlertTriangle } from 'lucide-react';

// ============================================================================
// 🌍 STATIC UTILS POOL (Dilempar ke luar untuk menghemat alokasi memori RAM)
// ============================================================================

const safeNumber = (value) => {
  if (value === null || value === undefined || value === '' || value === '-' || Number.isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
};

const formatRp = (angka) => {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(safeNumber(angka));
  } catch {
    return 'Rp 0';
  }
};

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

const formatHariTanggal = (input) => {
  if (!input) return 'Tanggal Tidak Valid';
  try {
    const date = parseSafeDate(input);
    if (!date || isNaN(date.getTime())) return 'Tanggal Tidak Valid';

    const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hari = namaHari[date.getDay()];
    const tanggalFormatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${hari}, ${tanggalFormatted}`;
  } catch (error) {
    console.error('ERROR FORMAT TANGGAL:', error);
    return 'Tanggal Error';
  }
};

const tableGridLayout = {
  gridTemplateColumns: 'minmax(100px,2.5fr) 0.7fr 0.8fr 0.8fr 0.9fr 0.8fr 0.8fr 1fr'
};

// ============================================================================
// 📊 MEMOIZED FINANCIAL CHRONO-FEED TABLE COMPONENT
// ============================================================================
const ReportTable = ({
  tanggal,
  isToday = false,
  data = [],
  onDelete
}) => {

  // SINGLE-PASS INVENTORY DATA PIPELINE REDUCTION
  const { normalizedData, totals, isTutupBuku, hasData } = useMemo(() => {
    const initialTotals = {
      totalLalu: 0, totalEtalase: 0, totalBorongan: 0, totalBaru: 0,
      totalJumlah: 0, totalSisa: 0, totalRusak: 0, totalTerjual: 0, totalOmzet: 0
    };

    if (!Array.isArray(data) || data.length === 0) {
      return { normalizedData: [], totals: initialTotals, isTutupBuku: false, hasData: false };
    }

    let tutupBukuStatus = false;

    const normalized = data.map((row, index) => {
      const sisaKemarin = safeNumber(row?.sisaKemarin);
      const stokBaru = safeNumber(row?.stokBaru);         
      const stokBorongan = safeNumber(row?.stokBorongan); 

      const prodTotalBaru = stokBaru + stokBorongan;      
      const totalStokHariIni = sisaKemarin + prodTotalBaru; 

      const rusak = safeNumber(row?.rusak);
      const isBelumTutupBuku = row?.sisaAkhir === '-' || row?.sisaAkhirLabel === '-';
      const sisaAkhir = isBelumTutupBuku ? 0 : safeNumber(row?.sisaAkhir);

      const terjual = isBelumTutupBuku ? 0 : Math.max(0, totalStokHariIni - sisaAkhir - rusak);
      const omzet = terjual * safeNumber(row?.hargaJual);

      if (!isBelumTutupBuku) {
        tutupBukuStatus = true;
      }

      initialTotals.totalLalu += sisaKemarin;
      initialTotals.totalEtalase += stokBaru;
      initialTotals.totalBorongan += stokBorongan;
      initialTotals.totalBaru += prodTotalBaru;
      initialTotals.totalJumlah += totalStokHariIni;
      initialTotals.totalSisa += sisaAkhir;
      initialTotals.totalRusak += rusak;
      initialTotals.totalTerjual += terjual;
      initialTotals.totalOmzet += omzet;

      return {
        id: `${row?.jenisKue || 'kue'}-${index}`,
        jenisKue: row?.jenisKue || 'Tanpa Nama',
        sisaKemarin,
        stokBaru,
        stokBorongan,
        jumlah: totalStokHariIni,
        rusak,
        terjual,
        omzet,
        sisaAkhir,
        sisaAkhirLabel: row?.sisaAkhir ?? '-',
        isBelumTutupBuku
      };
    });

    return {
      normalizedData: normalized,
      totals: initialTotals,
      isTutupBuku: tutupBukuStatus,
      hasData: true
    };
  }, [data]);

  if (!hasData) {
    return (
      <section className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
          <div className="px-4 py-2 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              {formatHariTanggal(tanggal)}
            </span>
          </div>
          <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
          <p className="text-sm font-bold text-slate-500">Tidak ada data laporan</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5 animate-in fade-in duration-300">

      {/* HEADER FEED TIMELINE SECTION */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <div className={`h-[1px] flex-1 ${isToday ? 'bg-blue-500/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
        <div className={`flex items-center gap-2 py-1.5 pl-4 pr-2 rounded-2xl border shadow-sm transition-all ${isToday ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <span className={`text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${isToday ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
            {formatHariTanggal(tanggal)}
          </span>
          {onDelete && (
            <button onClick={onDelete} className={`p-1.5 rounded-lg transition-all active:scale-90 ${isToday ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <div className={`h-[1px] flex-1 ${isToday ? 'bg-blue-500/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
      </div>

      {/* TABLE DATA CONTAINER GRID */}
      <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar transform-gpu will-change-scroll">
          <div className="min-w-[600px] flex flex-col w-full">

            {/* GRID TABLE HEADER CELL ROWS */}
            <div className="grid gap-1 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 w-full" style={tableGridLayout}>
              <div className="px-3 py-3 text-[8px] font-black uppercase text-slate-400 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/70 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">
                Nama Kue
              </div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-slate-400">Awal</div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-slate-400">Etalase</div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-purple-400">Orderan</div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-blue-500">Total</div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-slate-400">Sisa</div>
              <div className="px-1 py-3 text-[8px] font-black uppercase text-center text-rose-500">Rusak</div>
              <div className="pr-3 py-3 text-[8px] font-black uppercase text-right text-emerald-500">Laku</div>
            </div>

            {/* GRID TABLE BODY RECORDS ITEM ROWS */}
            <div className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800/60">
              {normalizedData.map((row) => (
                <div key={row.id} className="grid gap-1 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group w-full" style={tableGridLayout}>
                  <div className="px-3 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 transition-colors shadow-[1px_0_0_0_rgba(0,0,0,0.03)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)] truncate">
                    <span className="truncate pr-1 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">
                      {row.jenisKue}
                    </span>
                  </div>

                  <div className="px-1 py-3 text-center text-[10px] text-slate-500">{row.sisaKemarin}</div>
                  <div className="px-1 py-3 text-center text-[10px] font-medium text-slate-600 dark:text-slate-300">{row.stokBaru > 0 ? row.stokBaru : '-'}</div>
                  <div className="px-1 py-3 text-center text-[10px] font-bold text-purple-600 dark:text-purple-400">{row.stokBorongan > 0 ? row.stokBorongan : '-'}</div>
                  <div className="px-1 py-3 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-[10px] font-black text-blue-600 dark:text-blue-400">
                      {row.jumlah}
                    </span>
                  </div>
                  {/* 🔥 FIX BUG VISUAL: Render Langsung Properti dari Label Tanpa Assignment Berbahaya (=) 🔥 */}
                  <div className="px-1 py-3 text-center text-[10px] font-bold text-slate-500">{row.sisaAkhirLabel}</div>
                  <div className="px-1 py-3 text-center">
                    <span className="px-1 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-[10px] font-black text-rose-500">
                      {row.isBelumTutupBuku ? '-' : (row.rusak > 0 ? row.rusak : '-')}
                    </span>
                  </div>
                  <div className="pr-3 py-3 text-right text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    {row.isBelumTutupBuku ? '-' : row.terjual}
                  </div>
                </div>
              ))}
            </div>

            {/* GRID TABLE SUM TOTAL SUMMARY ROW */}
            <div className="grid gap-1 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-700 w-full" style={tableGridLayout}>
              <div className="px-3 py-3 text-[8px] font-black uppercase text-slate-400 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/70 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">
                Total
              </div>
              <div className="px-1 py-3 text-center text-[10px] font-bold text-slate-500">{totals.totalLalu}</div>
              <div className="px-1 py-3 text-center text-[10px] font-medium text-slate-600 dark:text-slate-300">{totals.totalEtalase}</div>
              <div className="px-1 py-3 text-center text-[10px] font-bold text-purple-600 dark:text-purple-400">{totals.totalBorongan}</div>
              <div className="px-1 py-3 text-center text-[10px] font-black text-blue-600 dark:text-blue-400">{totals.totalJumlah}</div>
              <div className="px-1 py-3 text-center text-[10px] font-black text-slate-500">{isTutupBuku ? totals.totalSisa : '-'}</div>
              <div className="px-1 py-3 text-center text-[10px] font-black text-rose-500">{isTutupBuku ? totals.totalRusak : '-'}</div>
              <div className="pr-3 py-3 text-right text-[11px] font-black text-emerald-600 dark:text-emerald-400">{isTutupBuku ? totals.totalTerjual : '-'}</div>
            </div>

          </div>
        </div>
      </div>

      {/* REVENUE STATS WIDGET SUMMARY CARD */}
      <div className="mt-3 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calculator size={16} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-400">Estimasi</p>
              <p className="text-lg font-black tracking-tight text-blue-600 dark:text-blue-400 uppercase">Omzet</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
              {isTutupBuku ? formatRp(totals.totalOmzet) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* OPERATIONS LOG BOOK BRIEF */}
      {isTutupBuku && (
        <div className="mt-3 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
          <div className="flex items-start gap-3">
            <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
              <p className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Ringkasan Perhitungan</p>
              <p className="font-medium">Total Masuk (Etalase + Orderan): <span className="font-black ml-1 text-slate-800 dark:text-slate-100">{totals.totalBaru}</span></p>
              <p className="font-medium">Total Akumulasi Stok: <span className="font-black ml-1 text-slate-800 dark:text-slate-100">{totals.totalJumlah}</span></p>
              <p className="font-medium">Rusak/Basi: <span className="font-black text-rose-500 ml-1">{totals.totalRusak}</span></p>
              <p className="font-medium">Laku Bersih: <span className="font-black text-emerald-600 ml-1">{totals.totalTerjual}</span></p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

// 🔥 SINKRONISASI AKHIR PRODUCTION-GRADE: Kunci Re-render Loop Menggunakan React.memo 🔥
export default React.memo(ReportTable);
import React, { useMemo, useCallback } from 'react';
import { ChefHat, Sigma, Trash2, PieChart, Edit3, Edit, AlertTriangle } from 'lucide-react';

const ProductionTable = ({ date, data = [], masterKueList = [], onDeleteAll, onEditSisa, onEditStok, showSummary = false }) => {
  const colorPalette = [
    'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500',
    'bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-lime-500', 'bg-fuchsia-500'
  ];

  const formatRp = (num) => {
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  };

  // ======================================================
  // 🔥 FORMAT HARI + TANGGAL (SUPER ANTI-GAGAL)
  // ======================================================
  const formatHariTanggal = useCallback((input) => {
    if (!input) return 'Tanggal Tidak Valid';
    try {
      let dObj;
      if (input instanceof Date) { dObj = input; } 
      else if (typeof input === 'string') {
        const cleanInput = input.trim();
        if (cleanInput.includes('/')) {
          const [d, m, y] = cleanInput.split('/');
          dObj = new Date(y, m - 1, d);
        } else if (cleanInput.includes('-')) {
          const parts = cleanInput.split('T')[0].split('-');
          if (parts[0]?.length === 4) { dObj = new Date(parts[0], parts[1] - 1, parts[2]); } 
          else { dObj = new Date(parts[2], parts[1] - 1, parts[0]); }
        } else { dObj = new Date(cleanInput); }
      } else { return 'Tanggal Tidak Valid'; }

      if (!(dObj instanceof Date) || isNaN(dObj.getTime())) { return 'Tanggal Tidak Valid'; }

      const namaHari = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(dObj);
      const tanggalFormatted = dObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

      return `${namaHari}, ${tanggalFormatted}`;
    } catch (error) {
      console.error('ERROR FORMAT TANGGAL:', error);
      return 'Tanggal Error';
    }
  }, []);

  // Cek apakah tanggal = hari ini
  const isToday = useMemo(() => {
    if (!date) return false;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let inputStr = date;
      if (date.includes('/')) {
        const [d, m, y] = date.split('/');
        inputStr = `${y}-${m}-${d}`;
      }
      return todayStr === inputStr;
    } catch { return false; }
  }, [date]);

  // ⚡ TURBO OPTIMASI
  const { 
    totalSisaKemarin, 
    totalProdHariIni, 
    totalJumlah, 
    totalSisaAkhir, 
    totalRusak, 
    totalTerjual, 
    totalOmzetGlobal 
  } = useMemo(() => {
    let tKemarin = 0; let tBaru = 0; let tAkhir = 0; 
    let tRusak = 0; let tTerjual = 0; let tOmzet = 0;

    data.forEach(curr => {
      const sLalu = Number(curr.sisaKemarin) || 0;
      const pBaru = Number(curr.stokBaru) || 0;
      const sAkhir = Number(curr.sisaAkhir) || 0;
      const rusakVal = Number(curr.rusak) || 0;
      const hrgJual = Number(curr.hargaJual) || 0;
      
      const laku = Math.max(0, (sLalu + pBaru) - sAkhir - rusakVal);

      tKemarin += sLalu;
      tBaru += pBaru;
      tAkhir += sAkhir;
      tRusak += rusakVal;
      tTerjual += laku;
      tOmzet += (laku * hrgJual);
    });

    return {
      totalSisaKemarin: tKemarin,
      totalProdHariIni: tBaru,
      totalJumlah: tKemarin + tBaru,
      totalSisaAkhir: tAkhir,
      totalRusak: tRusak,
      totalTerjual: tTerjual,
      totalOmzetGlobal: tOmzet
    };
  }, [data]);

  // JIKA DATA KOSONG
  if (data.length === 0) {
    return (
      <section className="mb-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
          <div className="flex items-center gap-2 py-1 px-4 rounded-full border bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{formatHariTanggal(date)}</span>
          </div>
          <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
        </div>
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.2rem] border border-slate-200/60 dark:border-slate-800/60 p-8 text-center shadow-sm">
          <AlertTriangle size={28} className="mx-auto mb-3 text-amber-500" />
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
            Tidak ada data produksi
          </p>
        </div>
      </section>
    );
  }

  const TABLE_CELL_CLASS = "px-3 md:px-4 py-2.5 text-[12px] md:text-[13px] whitespace-nowrap align-middle";
  const TABLE_HEAD_CLASS = "px-3 md:px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap";

  return (
    <section className="mb-6 animate-in fade-in duration-300">
      
      {/* ================================================== */}
      {/* HEADER TANGGAL (GAYA REPORT: PILL TENGAH + TRASH) */}
      {/* ================================================== */}
      <div className="flex items-center gap-3 px-2 mb-3">
        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
        
        <div className={`flex items-center gap-2 py-1 pl-4 pr-1.5 rounded-full border shadow-sm transition-all backdrop-blur-xl ${isToday ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${isToday ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
            {formatHariTanggal(date)}
          </span>

          {onDeleteAll && (
            <button
              onClick={onDeleteAll}
              className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 transition-all active:scale-90 ml-1"
            >
              <Trash2 size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 opacity-50" />
      </div>

      <div className="space-y-2">
        {/* TOMBOL AKSI STOK & SISA DI KANAN ATAS TABEL */}
        <div className="flex justify-between items-center px-1 mb-1.5">
          <h4 className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate ml-1">
            Rincian Produksi & Inventory
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEditStok && (
              <button 
                onClick={onEditStok}
                className="flex items-center gap-1 px-2.5 py-1 h-7 rounded-md bg-white dark:bg-slate-800 text-blue-500 hover:text-blue-600 dark:text-blue-400 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Edit size={12} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-widest">Stok</span>
              </button>
            )}
            {onEditSisa && (
              <button 
                onClick={onEditSisa}
                className="flex items-center gap-1 px-2.5 py-1 h-7 rounded-md bg-white dark:bg-slate-800 text-amber-500 hover:text-amber-600 dark:text-amber-400 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Edit3 size={12} strokeWidth={2.5} />
                <span className="text-[9px] font-black uppercase tracking-widest">Sisa</span>
              </button>
            )}
          </div>
        </div>

        {/* TABEL UTAMA (GAYA REPORT: OVERFLOW-X, BORDER RADIUS, HOVER) */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[1.2rem] border border-slate-200/60 dark:border-slate-800/60 overflow-hidden shadow-sm transition-all">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              
              {/* THEAD */}
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/50 dark:border-slate-700/60">
                  <th className={`${TABLE_HEAD_CLASS} text-indigo-500 dark:text-indigo-400 sticky left-0 z-20 bg-slate-50/95 dark:bg-slate-800/95 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]`}>Kue</th>
                  <th className={`${TABLE_HEAD_CLASS} text-slate-400 text-center`}>Awal</th>
                  <th className={`${TABLE_HEAD_CLASS} text-slate-400 text-center`}>Baru</th>
                  <th className={`${TABLE_HEAD_CLASS} text-blue-500 dark:text-blue-400 text-center`}>Total</th>
                  <th className={`${TABLE_HEAD_CLASS} text-slate-400 text-center`}>Sisa</th>
                  <th className={`${TABLE_HEAD_CLASS} text-rose-500 dark:text-rose-400 text-center`}>Rusak</th>
                  <th className={`${TABLE_HEAD_CLASS} text-emerald-500 dark:text-emerald-400 text-center`}>Laku</th>
                  <th className={`${TABLE_HEAD_CLASS} text-indigo-500 dark:text-indigo-400 text-right`}>Omzet</th>
                </tr>
              </thead>

              {/* TBODY */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {data.map((item, idx) => {
                  const colorIdx = masterKueList.indexOf(item.jenisKue);
                  const dotColor = colorPalette[colorIdx % colorPalette.length] || 'bg-slate-300';
                  
                  const sisaLalu = Number(item.sisaKemarin) || 0;
                  const prodBaru = Number(item.stokBaru) || 0;
                  const sisaAkhir = Number(item.sisaAkhir) || 0;
                  const rusak = Number(item.rusak) || 0;
                  const hrgJual = Number(item.hargaJual) || 0;
                  
                  const totalStok = sisaLalu + prodBaru;
                  const laku = Math.max(0, totalStok - sisaAkhir - rusak);
                  const omzet = laku * hrgJual;

                  return (
                    <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 md:px-4 py-2.5 sticky left-0 bg-white/95 dark:bg-slate-900/95 whitespace-nowrap z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.03)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">
                        <div className="flex items-center gap-2 pr-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                          <p className="text-[11px] md:text-[12px] font-black text-slate-700 dark:text-slate-200 uppercase truncate">
                            {item.jenisKue}
                          </p>
                        </div>
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-center font-medium text-slate-400 dark:text-slate-500`}>{sisaLalu}</td>
                      <td className={`${TABLE_CELL_CLASS} text-center font-black text-slate-700 dark:text-slate-200`}>{prodBaru}</td>
                      <td className={`${TABLE_CELL_CLASS} text-center`}>
                         <span className="text-[11px] md:text-[12px] font-black text-blue-600 dark:text-blue-400">{totalStok}</span>
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-center font-bold text-slate-500 dark:text-slate-400`}>{sisaAkhir}</td>
                      <td className={`${TABLE_CELL_CLASS} text-center font-black text-rose-500 dark:text-rose-400`}>{rusak > 0 ? rusak : '-'}</td>
                      <td className={`${TABLE_CELL_CLASS} text-center font-black text-emerald-600 dark:text-emerald-400`}>
                        {laku} <span className="text-[8px] font-bold opacity-60 ml-0.5">Pcs</span>
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-right font-black text-slate-800 dark:text-slate-100`}>
                        {formatRp(omzet)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* TFOOT */}
              <tfoot className="bg-slate-100/30 dark:bg-slate-800/30 border-t border-slate-200/50 dark:border-slate-700/50 font-black text-[11px]">
                <tr>
                  <td className="px-3 md:px-4 py-3 sticky left-0 bg-slate-100/80 dark:bg-slate-800/80 uppercase text-slate-500 dark:text-slate-400 z-10 shadow-[1px_0_0_0_rgba(0,0,0,0.03)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.02)]">
                    TOTAL
                  </td>
                  <td className="px-2 py-3 text-center text-slate-500 dark:text-slate-400">{totalSisaKemarin}</td>
                  <td className="px-2 py-3 text-center text-slate-700 dark:text-slate-200">{totalProdHariIni}</td>
                  <td className="px-2 py-3 text-center text-blue-600 dark:text-blue-400">{totalJumlah}</td>
                  <td className="px-2 py-3 text-center text-slate-500 dark:text-slate-400">{totalSisaAkhir}</td>
                  <td className="px-2 py-3 text-center text-rose-500 dark:text-rose-400">{totalRusak}</td>
                  <td className="px-2 py-3 text-center text-emerald-600 dark:text-emerald-400">{totalTerjual}</td>
                  <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400">{formatRp(totalOmzetGlobal)}</td>
                </tr>
              </tfoot>

            </table>
          </div>

          {/* WIDGET RINGKASAN TAMBAHAN (Tetap dipertahankan agar showSummary jalan) */}
          {showSummary && (
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border-t border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
              <div className="flex items-center px-4 py-1.5 border-b border-slate-100/60 dark:border-slate-800/60 bg-transparent">
                <PieChart size={13} className="text-blue-500 mr-1.5" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ringkasan Operasional</span>
              </div>
              
              <div className="grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-800/60">
                <div className="py-2 px-1 text-center flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0">Stok</p>
                  <p className="text-[15px] font-black text-slate-700 dark:text-slate-200 leading-none">{totalJumlah}</p>
                </div>
                <div className="py-2 px-1 text-center flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0">Sisa</p>
                  <p className="text-[15px] font-black text-amber-500 leading-none">{totalSisaAkhir}</p>
                </div>
                <div className="py-2 px-1 text-center flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0">Rsk</p>
                  <p className="text-[15px] font-black text-rose-500 leading-none">{totalRusak > 0 ? totalRusak : '-'}</p>
                </div>
                <div className="py-2 px-1 text-center flex flex-col justify-center bg-emerald-50/50 dark:bg-emerald-900/10">
                  <p className="text-[8px] font-black text-emerald-600 uppercase mb-0">Laku</p>
                  <p className="text-[15px] font-black text-emerald-600 leading-none">{totalTerjual}</p>
                </div>
                <div className="py-2 px-1 text-center bg-gradient-to-br from-indigo-600 to-blue-700 flex flex-col justify-center shadow-inner">
                  <p className="text-[8px] font-black text-indigo-100 uppercase mb-0 drop-shadow-sm">Omzet</p>
                  <p className="text-[14px] font-black text-white leading-none tracking-tighter drop-shadow-md">
                    {formatRp(totalOmzetGlobal)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductionTable;
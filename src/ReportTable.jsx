import React from 'react';
import { Trash2, Calculator, MessageSquare, AlertCircle } from 'lucide-react';

const ReportTable = ({ tanggal, isToday, data, onDelete }) => {
  // --- KALKULASI TOTAL STOK ---
  const totalLalu = data.reduce((a, b) => a + (Number(b.sisaKemarin) || 0), 0);
  const totalBaru = data.reduce((a, b) => a + (Number(b.stokBaru) || 0), 0);
  const totalSisa = data.reduce((a, b) => a + (Number(b.sisa) || 0), 0);
  
  // Total Jumlah adalah gabungan Stok Kemarin + Stok Baru
  const totalJumlah = totalLalu + totalBaru;

  // --- LOGIKA PERHITUNGAN AKHIR ---
  const totalKotor = totalJumlah - totalSisa; 
  const penyesuaian = Number(data[0]?.penyesuaian) || 0; 
  const netSales = totalKotor - penyesuaian;
  const catatan = data[0]?.keterangan || "";

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- HEADER TANGGAL --- */}
      <div className="flex items-center gap-3 px-2">
        <div className={`h-[1px] flex-1 ${isToday ? 'bg-blue-600/30' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
        
        <div className={`flex items-center gap-3 py-1.5 pl-4 pr-2 rounded-2xl border transition-all shadow-sm ${
          isToday 
          ? 'bg-blue-600 border-blue-500 ring-4 ring-blue-600/10' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
            isToday ? 'text-white' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {tanggal}
          </span>

          <button 
            onClick={onDelete}
            className={`p-2 rounded-xl transition-all active:scale-90 ${
              isToday 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:text-red-700'
            }`}
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className={`h-[1px] flex-1 ${isToday ? 'bg-blue-600/30' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
      </div>

      {/* --- BODY TABEL --- */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden text-left">
        {/* Header Kolom */}
        <div className="grid grid-cols-12 bg-slate-50/50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="col-span-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">Kue</div>
          <div className="col-span-2 text-[8px] font-black text-slate-400 uppercase text-center">Lalu</div>
          <div className="col-span-2 text-[8px] font-black text-slate-400 uppercase text-center">Baru</div>
          <div className="col-span-2 text-[8px] font-black text-blue-500 uppercase text-center">Total</div>
          <div className="col-span-2 text-[8px] font-black text-slate-400 uppercase text-right">Sisa</div>
        </div>

        {/* Baris Data */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
          {data.map((row, i) => {
            const valLalu = Number(row.sisaKemarin) || 0;
            const valBaru = Number(row.stokBaru) || 0;
            const valSisa = Number(row.sisa) || 0;
            const valJml = valLalu + valBaru;
            
            return (
              <div key={i} className="grid grid-cols-12 px-5 py-4 items-center">
                <div className="col-span-4 text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-1">
                  {row.jenisKue}
                </div>
                <div className="col-span-2 text-center text-[11px] font-medium text-slate-400">{valLalu}</div>
                <div className="col-span-2 text-center text-[11px] font-medium text-slate-400">{valBaru}</div>
                <div className="col-span-2 text-center">
                  <span className="text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                    {valJml}
                  </span>
                </div>
                <div className="col-span-2 text-right text-xs font-black text-slate-800 dark:text-slate-100">{valSisa}</div>
              </div>
            );
          })}
        </div>

        {/* --- FOOTER SUBTOTAL --- */}
        <div className="grid grid-cols-12 bg-slate-50/30 dark:bg-slate-800/20 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="col-span-4 text-[9px] font-black text-slate-400 uppercase tracking-tighter">Subtotal</div>
          <div className="col-span-2 text-center text-[10px] font-bold text-slate-400">{totalLalu}</div>
          <div className="col-span-2 text-center text-[10px] font-bold text-slate-400">{totalBaru}</div>
          <div className="col-span-2 text-center text-[11px] font-black text-blue-600">{totalJumlah}</div>
          <div className="col-span-2 text-right text-[11px] font-black text-slate-800 dark:text-slate-100">{totalSisa}</div>
        </div>

        {/* --- AREA CALCULATOR & CATATAN --- */}
        <div className="p-6 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-800/30 space-y-4">
          
          {/* Ringkasan Angka */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              <span>Total</span>
              <span className="text-slate-800 dark:text-slate-200 font-black">{totalKotor}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-red-500 uppercase tracking-wide">
              <span className="flex items-center gap-1"><AlertCircle size={10} /> Penyesuaian</span>
              <span className="font-black">-{penyesuaian}</span>
            </div>
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Calculator size={18} />
                </div>
                <span className="text-2xl font-black text-blue-600 italic tracking-tighter uppercase">Net</span>
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                {netSales}
              </div>
            </div>
          </div>

          {/* Bagian Catatan (Hanya tampil jika ada isi) */}
          {catatan && (
            <div className="mt-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare size={12} className="text-amber-600" />
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Catatan</span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "{catatan}"
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReportTable;
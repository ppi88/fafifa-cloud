import React, { useState, useMemo } from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle, Calculator, Wallet, Filter, ChevronRight, ClipboardList } from 'lucide-react';

const Rangkuman = ({ archiveData, parseSheetDate, priceList }) => {
  // Default: Dari tanggal 1 bulan ini sampai hari ini
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Helper untuk format rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  // Fungsi shortcut periode
  const setQuickFilter = (type) => {
    const now = new Date();
    if (type === 'month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'today') {
      setStartDate(now.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const { stats, detailKue } = useMemo(() => {
    let terjual = 0;
    let bs = 0;
    let sisaRakTerakhir = 0;
    let totalProduksiBaru = 0;
    let totalOmzetRupiah = 0;
    const summaryPerKue = {};

    if (!archiveData || Object.keys(archiveData).length === 0) {
      return { stats: { terjual, bs, sisa: 0, produksi: 0, totalOmzetRupiah: 0 }, detailKue: [] };
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // 1. Ambil & Urutkan tanggal yang masuk dalam filter
    const filteredDates = Object.keys(archiveData)
      .filter(dateStr => {
        const d = parseSheetDate(dateStr);
        return d >= start && d <= end;
      })
      .sort((a, b) => parseSheetDate(a) - parseSheetDate(b));

    if (filteredDates.length === 0) {
      return { stats: { terjual: 0, bs: 0, sisa: 0, produksi: 0, totalOmzetRupiah: 0 }, detailKue: [] };
    }

    // 2. Ringkas data per jenis kue selama periode terpilih
    filteredDates.forEach((dateStr) => {
      const dayData = archiveData[dateStr];
      const dataKue = dayData.filter(i => !i.isBahanBaku && i.jenisKue);

      dataKue.forEach(item => {
        const nama = item.jenisKue;
        if (!summaryPerKue[nama]) {
          // KUNCI PERBAIKAN: Mengambil sisaKemarin (Lalu) dari hari pertama filter
          summaryPerKue[nama] = { 
            awal: Number(item.sisaKemarin) || 0, 
            masuk: 0, 
            akhir: 0, 
            rusak: 0 
          };
        }
        
        summaryPerKue[nama].masuk += (Number(item.stokBaru) || 0);
        summaryPerKue[nama].rusak += (Number(item.penyesuaian) || 0);
        summaryPerKue[nama].akhir = (Number(item.sisa) || 0);
      });
    });

    // 3. Hitung Kalkulasi Akhir dan Detail Tabel
    const daftarDetail = Object.keys(summaryPerKue).map(nama => {
      const k = summaryPerKue[nama];
      
      // RUMUS: (Lalu + Baru) - Sisa Akhir = Terjual
      const itemTerjual = (k.awal + k.masuk) - k.akhir;
      const harga = (priceList && priceList[nama]) ? priceList[nama] : 0;
      const subTotal = itemTerjual * harga;

      terjual += itemTerjual;
      bs += k.rusak;
      sisaRakTerakhir += k.akhir;
      totalProduksiBaru += (k.awal + k.masuk);
      totalOmzetRupiah += subTotal;

      return { nama, itemTerjual, harga, subTotal };
    });

    return { 
      stats: { terjual, bs, sisa: sisaRakTerakhir, produksi: totalProduksiBaru, totalOmzetRupiah },
      detailKue: daftarDetail
    };
  }, [archiveData, startDate, endDate, parseSheetDate, priceList]);

  return (
    <div className="space-y-5 px-1 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 text-slate-800 dark:text-slate-100 italic">
      
      {/* SECTION 1: FILTER TANGGAL */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                <Filter size={12} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Periode Laporan</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setQuickFilter('today')} className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full active:scale-90 transition-all">Hari Ini</button>
            <button onClick={() => setQuickFilter('month')} className="text-[8px] font-black uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-3 py-1.5 rounded-full active:scale-90 transition-all">Bulan Ini</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent focus-within:border-blue-500/30 transition-all">
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-1">Mulai Dari</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[11px] font-black outline-none text-blue-600 dark:text-blue-400" 
            />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-transparent focus-within:border-blue-500/30 transition-all">
            <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-1">Sampai Dengan</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-transparent border-none p-0 text-[11px] font-black outline-none text-blue-600 dark:text-blue-400" 
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: ESTIMASI PENDAPATAN */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-7 rounded-[3rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Wallet size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-70 uppercase font-black text-[9px] tracking-[0.2em]">
              <TrendingUp size={14} /> Omzet Terfilter
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">
              {formatRupiah(stats.totalOmzetRupiah)}
            </h2>
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-tight">{stats.terjual} Unit Terjual</span>
            </div>
        </div>
      </div>

      {/* SECTION 3: MINI STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <ShoppingBag className="text-amber-500" size={18} />
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Sisa di Rak Akhir</span>
          <p className="text-3xl font-black mt-1 tracking-tighter">{stats.sisa}</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <AlertTriangle className="text-red-500" size={18} />
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">Total Kue Rusak</span>
          <p className="text-3xl font-black mt-1 tracking-tighter">{stats.bs}</p>
        </div>
      </div>

      {/* SECTION 4: TABEL RINCIAN PER ITEM (AUDIT) */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-600" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rincian Penjualan Kue</h3>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {detailKue.map((kue, idx) => (
            <div key={idx} className="p-4 flex justify-between items-center active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
              <div className="flex flex-col">
                <p className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-100 leading-none">{kue.nama}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1">
                  {kue.itemTerjual} terjual x {kue.harga.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-black text-blue-600">{formatRupiah(kue.subTotal)}</p>
              </div>
            </div>
          ))}
          {detailKue.length === 0 && (
            <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase">Tidak ada data di periode ini</div>
          )}
        </div>
      </div>

      {/* SECTION 5: PRODUCTION RATE */}
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6 opacity-40 uppercase font-black text-[9px] tracking-[0.3em]">
          <Calculator size={14} /> Efisiensi Laku
        </div>
        
        <div className="flex justify-between items-end mb-4">
            <div>
                <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Modal Stok (Lalu + Baru)</p>
                <p className="text-2xl font-black tracking-tighter">{stats.produksi} <span className="text-[10px] font-normal opacity-40 italic">Pcs</span></p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold opacity-30 uppercase mb-1">Rate Laku</p>
                <p className="text-4xl font-black text-green-400 tracking-tighter">
                    {stats.produksi > 0 ? ((stats.terjual / stats.produksi) * 100).toFixed(1) : 0}%
                </p>
            </div>
        </div>
        
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
                className="h-full bg-green-500 transition-all duration-1000" 
                style={{ width: `${stats.produksi > 0 ? (stats.terjual / stats.produksi) * 100 : 0}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default Rangkuman;
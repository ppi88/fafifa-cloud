import { useMemo } from 'react';

// ============================================================================
// 🌍 GLOBAL UTILS & CACHE (Mencegah Memory Leak & Re-render Loop)
// ============================================================================

const parsedDateCache = new Map();

export const formatRp = (num) => {
  const isNegative = num < 0;
  const absVal = Math.abs(Math.round(num));
  return `${isNegative ? '-' : ''}Rp ${absVal.toLocaleString('id-ID')}`;
};

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";

const toDateKey = (date) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const safeDateCached = (dKey) => {
  if (!dKey) return null;
  if (parsedDateCache.has(dKey)) return parsedDateCache.get(dKey);

  let s = String(dKey).trim().split(' ')[0]; 
  let result = null;
  
  if (s.includes('-')) {
    const [datePart] = s.split('T');
    const [y, m, d] = datePart.split('-');
    result = new Date(toNum(y), toNum(m) - 1, toNum(d));
  } else if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    result = new Date(toNum(y), toNum(m) - 1, toNum(d));
  } else {
    const parsed = new Date(`${s}T00:00:00`);
    result = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  
  if (parsedDateCache.size > 10000) {
    const firstKey = parsedDateCache.keys().next().value;
    parsedDateCache.delete(firstKey);
  }
  parsedDateCache.set(dKey, result);
  
  return result;
};

const getHourFromJam = (jamStr) => {
  if (!jamStr) return -1;
  const s = String(jamStr).trim();
  if (s.includes('T')) return new Date(s).getHours();
  if (s.includes(':')) {
    let hour = parseInt(s.split(':')[0], 10);
    if (s.toUpperCase().includes('PM') && hour < 12) hour += 12;
    if (s.toUpperCase().includes('AM') && hour === 12) hour = 0;
    return hour;
  }
  return -1;
};

// ============================================================================
// 🧩 1. CONFIG ENGINE (Mencegah Dependency Explosion)
// ============================================================================
const useFilterConfig = (props) => {
  return useMemo(() => {
    let sDate, eDate;
    if (props.filterMode === 'harian') {
      const dObj = safeDateCached(props.normalizeDate(props.baseDate)) || new Date();
      sDate = new Date(dObj); sDate.setHours(0, 0, 0, 0);
      eDate = new Date(dObj); eDate.setHours(23, 59, 59, 999);
    } else if (props.filterMode === 'bulan') {
      sDate = new Date(props.selectedYear, props.selectedMonthIdx, 1, 0, 0, 0);
      eDate = new Date(props.selectedYear, toNum(props.selectedMonthIdx) + 1, 0, 23, 59, 59);
    } else if (props.filterMode === 'periode') {
      const d1 = safeDateCached(props.normalizeDate(props.startDate)) || new Date();
      const d2 = safeDateCached(props.normalizeDate(props.endDate)) || new Date();
      sDate = new Date(d1); sDate.setHours(0, 0, 0, 0);
      eDate = new Date(d2); eDate.setHours(23, 59, 59, 999);
    } else {
      sDate = new Date(2020, 0, 1, 0, 0, 0);
      eDate = new Date(2050, 11, 31, 23, 59, 59);
    }

    const thresholdDateObj = new Date(props.filterMode === 'harian' ? (safeDateCached(props.normalizeDate(props.baseDate)) || new Date()) : eDate);
    thresholdDateObj.setDate(thresholdDateObj.getDate() - 14);

    return { 
      filterMode: props.filterMode, baseDate: props.baseDate, sDate, eDate, thresholdDateObj, normalizeDate: props.normalizeDate 
    };
  }, [props.filterMode, props.baseDate, props.selectedMonthIdx, props.selectedYear, props.startDate, props.endDate, props.normalizeDate]);
};

// ============================================================================
// 🧩 2. CORE INDEXING ENGINE (Pemisahan Jalur Data UI vs AI)
// ============================================================================
const useBIEngineCore = (props, config) => {
  return useMemo(() => {
    const archiveData = props.archiveData || {};
    const sisaArchive = props.sisaArchive || {};
    const priceList = props.priceList || {};
    const bahanList = props.bahanList || {};
    const resepData = props.resepData || {};
    const targetYieldData = props.targetYieldData || {};
    const visitData = props.visitData || [];

    const iA = {}; const iS = {}; const dModal = {}; const dPrice = {};
    const kueSet = new Set(Object.keys(priceList));
    
    const archKeys = Object.keys(archiveData);
    for (let i = 0; i < archKeys.length; i++) {
      const k = archKeys[i]; iA[k] = {};
      const arr = archiveData[k] || [];
      for (let j = 0; j < arr.length; j++) { iA[k][arr[j].jenisKue] = arr[j]; kueSet.add(arr[j].jenisKue); }
    }
    
    const sisaKeys = Object.keys(sisaArchive);
    for (let i = 0; i < sisaKeys.length; i++) {
      const k = sisaKeys[i]; iS[k] = {};
      const arr = sisaArchive[k] || [];
      for (let j = 0; j < arr.length; j++) { iS[k][arr[j].jenisKue] = arr[j]; kueSet.add(arr[j].jenisKue); }
    }

    const allKueList = Array.from(kueSet);

    for (let i = 0; i < allKueList.length; i++) {
      const kue = allKueList[i];
      dPrice[kue] = toNum(priceList[kue]);
      const resepArr = resepData[kue] || [];
      let mResep = 0;
      for (let r = 0; r < resepArr.length; r++) {
         const bahan = bahanList[resepArr[r].namaBahan];
         mResep += ((toNum(bahan?.harga)) / (toNum(bahan?.kuantitas) || 1)) * toNum(resepArr[r].qty);
      }
      dModal[kue] = mResep / (toNum(targetYieldData[kue]) || toNum(targetYieldData[cleanKey(kue)]) || 1);
    }

    const hourMap = {}; const uniqueDaysTraffic = new Set();
    let totalVisitorsGlobal = 0;
    const trafficByDayName = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set(), 0: new Set() };
    const visitorsByDayName = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

    for (let i = 0; i < visitData.length; i++) {
      const v = visitData[i];
      if (!v.tanggal) continue;
      const normStr = config.normalizeDate(v.tanggal);
      const dObj = safeDateCached(normStr);
      if (!dObj) continue; 
      
      uniqueDaysTraffic.add(normStr);
      totalVisitorsGlobal += toNum(v.jumlah);
      
      const dayIdx = dObj.getDay();
      trafficByDayName[dayIdx].add(normStr);
      visitorsByDayName[dayIdx] += toNum(v.jumlah);

      if (dObj >= config.sDate && dObj <= config.eDate) {
        const h = getHourFromJam(v.jam);
        hourMap[h] = (hourMap[h] || 0) + toNum(v.jumlah);
      }
    }

    if (config.filterMode === 'harian') uniqueDaysTraffic.add(config.normalizeDate(config.baseDate));
    const daysCount = Math.max(1, uniqueDaysTraffic.size);
    const trafficData = Array.from({ length: 15 }, (_, i) => ({ hour: i + 7, total: Math.round((hourMap[i + 7] || 0) / daysCount) }));
    
    const baselineTraffic = totalVisitorsGlobal / Math.max(1, uniqueDaysTraffic.size);
    const dayTrafficBoost = {};
    for (let idx = 0; idx <= 6; idx++) {
      const avgForThisDay = visitorsByDayName[idx] / Math.max(1, trafficByDayName[idx].size);
      if (baselineTraffic > 0) {
          if (avgForThisDay > baselineTraffic * 1.1) dayTrafficBoost[idx] = 1.1;
          else if (avgForThisDay < baselineTraffic * 0.9) dayTrafficBoost[idx] = 0.95;
          else dayTrafficBoost[idx] = 1.0;
      } else dayTrafficBoost[idx] = 1.0;
    }

    // 🔥 FIX UTAMA: Pisah jalur Tanggal untuk UI View dan Tanggal Historis Full untuk AI 🔥
    let viewDates = [];
    let historyDates = Array.from(new Set([...Object.keys(iA), ...Object.keys(iS)])); // Otak AI dapat data full abadi

    if (config.filterMode === 'harian') {
      const tglKey = config.normalizeDate(config.baseDate);
      if (iA[tglKey] || iS[tglKey]) viewDates.push(tglKey);
    } else {
      for (let i = 0; i < historyDates.length; i++) {
        const dObj = safeDateCached(historyDates[i]);
        if (dObj && dObj >= config.sDate && dObj <= config.eDate) viewDates.push(historyDates[i]);
      }
    }

    return { 
      idxArchive: iA, 
      idxSisa: iS, 
      allKueList, 
      allKueSet: kueSet,
      defaultModalMap: dModal, 
      defaultPriceMap: dPrice, 
      trafficData, 
      dayTrafficBoost, 
      viewDates,
      viewDatesSet: new Set(viewDates),
      historyDates
    };
  }, [props.archiveData, props.sisaArchive, props.priceList, props.bahanList, props.resepData, props.targetYieldData, props.visitData, config]);
};

// ============================================================================
// 🧩 3. ANALYTICS ENGINE (Kombinasi Hitungan UI View & Akumulasi AI History)
// ============================================================================
const useBIAnalytics = (core, config) => {
  return useMemo(() => {
    const salesMap = {}; const profitMap = {}; const productStats = {};
    let totalGlobalOmzet = 0; let totalGlobalLaba = 0; let totalGlobalRusak = 0; let totalGlobalSisa = 0; let totalGlobalProduksi = 0;

    const daysMap = {
      1: { name: 'Senin', total: 0, count: new Set(), cakes: {}, stats: {} },
      2: { name: 'Selasa', total: 0, count: new Set(), cakes: {}, stats: {} },
      3: { name: 'Rabu', total: 0, count: new Set(), cakes: {}, stats: {} },
      4: { name: 'Kamis', total: 0, count: new Set(), cakes: {}, stats: {} },
      5: { name: 'Jumat', total: 0, count: new Set(), cakes: {}, stats: {} },
      6: { name: 'Sabtu', total: 0, count: new Set(), cakes: {}, stats: {} },
      0: { name: 'Minggu', total: 0, count: new Set(), cakes: {}, stats: {} },
    };

    for (let j = 0; j < core.allKueList.length; j++) {
      const kue = core.allKueList[j];
      productStats[kue] = { terjual: 0, laba: 0, rusak: 0, sisa: 0, produksi: 0, labaPcs: 0, modalPcs: 0, sellingPricePerUnit: 0, hariAktif: 0, hariSisa: 0, recentTerjual: 0, recentAktif: 0, sisaLalu: 0, modalTertahan: 0, freshSold: 0, rolloverSold: 0, daysSoldOut: 0, soldOutLakuTotal: 0 };
    }

    // Looping menggunakan historyDates agar pondasi kalkulasi AI tidak kelaparan data
    for (let i = 0; i < core.historyDates.length; i++) {
      const tgl = core.historyDates[i];
      const d = safeDateCached(tgl); 
      if (!d) continue; 
      
      const dayIndex = d.getDay(); 
      const isRecent = d >= config.thresholdDateObj; 
      const isInsideViewFilter = core.viewDatesSet.has(tgl); // Cek O(1) apakah masuk filter UI screen
      
      const y = new Date(d); y.setDate(y.getDate() - 1);
      const yKeyRaw = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      const yKey = config.normalizeDate(yKeyRaw);

      const activeMap = {};
      Object.assign(activeMap, core.idxArchive[tgl], core.idxSisa[tgl], core.idxSisa[yKey]);
      const kueKeys = Object.keys(activeMap);

      for (let j = 0; j < kueKeys.length; j++) {
        const kue = kueKeys[j];
        if (!core.allKueSet.has(kue)) continue;

        const prodItem = core.idxArchive[tgl]?.[kue];
        const sisaItem = core.idxSisa[tgl]?.[kue];
        const sisaKemarinItem = core.idxSisa[yKey]?.[kue];

        const pEtalase = toNum(prodItem?.stokBaru);
        const pBorongan = toNum(prodItem?.stokBorongan);
        const prodTotalBaru = pEtalase + pBorongan;

        const sisaAkhir = sisaItem ? toNum(sisaItem.sisa) : 0;
        const rusak = sisaItem ? toNum(sisaItem.rusak) : 0;
        const sisaLalu = toNum(sisaKemarinItem?.sisa);

        const hrgJual = prodItem?.hargaJual ? toNum(prodItem.hargaJual) : core.defaultPriceMap[kue];
        const modalPcs = prodItem?.modalPcs ? toNum(prodItem.modalPcs) : core.defaultModalMap[kue];
        
        const totalStokHarian = sisaLalu + prodTotalBaru;
        const lakuTotal = Math.max(0, totalStokHarian - sisaAkhir - rusak);
        const lakuEtalase = Math.max(0, lakuTotal - pBorongan); 
        
        const totalBebanSisa = sisaAkhir + rusak; 
        const rolloverSold = Math.min(sisaLalu, lakuEtalase);
        const freshSold = Math.max(0, lakuEtalase - rolloverSold);

        // Update Statistik Dasar AI Global
        const statKue = productStats[kue];
        statKue.sellingPricePerUnit = hrgJual; statKue.modalPcs = modalPcs; statKue.labaPcs = hrgJual - modalPcs;
        statKue.produksi += prodTotalBaru; statKue.rusak += rusak; statKue.sisa += sisaAkhir; statKue.sisaLalu += sisaLalu;
        statKue.modalTertahan += (sisaAkhir * modalPcs);
        statKue.freshSold += freshSold; statKue.rolloverSold += rolloverSold; statKue.terjual += lakuEtalase; 
        
        if (totalStokHarian > 0) {
            statKue.hariAktif++;
            if (isRecent) { statKue.recentAktif++; statKue.recentTerjual += lakuEtalase; }
        }
        if (totalBebanSisa > 0) statKue.hariSisa++;

        // Akumulasi data kecenderungan Hari (Day-of-Week Patterns) untuk AI
        if (!daysMap[dayIndex].stats[kue]) daysMap[dayIndex].stats[kue] = { laku: 0, sisa: 0, rusak: 0, aktif: 0, freshLaku: 0, rolloverLaku: 0 };
        if (totalStokHarian > 0) {
            const dStat = daysMap[dayIndex].stats[kue];
            dStat.aktif++; dStat.laku += lakuEtalase; dStat.sisa += sisaAkhir; dStat.rusak += rusak;
            dStat.freshLaku += freshSold; dStat.rolloverLaku += rolloverSold;
        }

        // 📊 SELEKSI: Hanya masukkan ke matriks dashboard jika lolos kriteria Filter UI View
        if (isInsideViewFilter && (prodTotalBaru > 0 || lakuTotal > 0 || sisaAkhir > 0 || rusak > 0)) {
          const omzet = lakuTotal * hrgJual;
          const modal = (lakuTotal + rusak) * modalPcs; 
          const laba = omzet - modal;

          salesMap[kue] = (salesMap[kue] || 0) + lakuEtalase;
          profitMap[kue] = (profitMap[kue] || 0) + laba;
          statKue.laba += laba; 
          
          totalGlobalOmzet += omzet; totalGlobalLaba += laba;
          totalGlobalRusak += rusak; totalGlobalProduksi += prodTotalBaru; totalGlobalSisa += sisaAkhir;

          if (lakuEtalase > 0) {
            daysMap[dayIndex].total += lakuEtalase;
            daysMap[dayIndex].count.add(tgl); 
            daysMap[dayIndex].cakes[kue] = (daysMap[dayIndex].cakes[kue] || 0) + lakuEtalase;
          }
        }
      }
    }

    return { productStats, salesMap, profitMap, daysMap, totalGlobalLaba, totalGlobalOmzet, totalGlobalProduksi, totalGlobalRusak, totalGlobalSisa };
  }, [core, config]);
};

// ============================================================================
// 🧩 4. FORECASTING ENGINE (AI Target Heuristic - Desimal Murni & Stabil)
// ============================================================================
const useBIForecast = (core, analytics) => {
  return useMemo(() => {
    let totalLostOpportunityPcs = 0; let totalLostOpportunityRp = 0;
    
    const pKeys = Object.keys(analytics.productStats);
    for (let i = 0; i < pKeys.length; i++) {
        const p = analytics.productStats[pKeys[i]];
        const avgDaily = p.terjual / Math.max(1, p.hariAktif);
        const recentAvg = p.recentAktif > 0 ? (p.recentTerjual / p.recentAktif) : avgDaily;
        p.confidence = Math.min(1, p.hariAktif / 21) * Math.min(1, p.terjual / 50); 
        p.sellThrough = (p.produksi + p.sisaLalu) > 0 ? (p.terjual / (p.produksi + p.sisaLalu)) * 100 : 0;
        
        p.anomaly = 'NORMAL';
        if (avgDaily > 3 && recentAvg === 0 && p.hariAktif > 7) p.anomaly = 'SUDDEN_DROP';
        else if (recentAvg > (avgDaily * 3) && p.recentAktif > 0 && recentAvg >= 5) p.anomaly = 'ABNORMAL_SPIKE';

        const trendDiff = avgDaily > 0 ? ((recentAvg - avgDaily) / avgDaily) : 0;
        p.trendMultiplier = 1 + (Math.max(-0.5, Math.min(0.5, trendDiff)) * p.confidence);
        p.rolloverRatio = p.produksi > 0 ? (p.sisaLalu / p.produksi) : (p.sisaLalu > 0 ? 1 : 0);
        p.stockAgeRisk = p.hariAktif > 0 ? (p.hariSisa / p.hariAktif) : 0;
        
        const decay = p.produksi > 0 ? (p.sisa / p.produksi) : 0;
        const lowSellThrough = Math.max(0, 1 - (p.sellThrough / 100));
        p.riskIndex = ((decay * 0.4) + (p.rolloverRatio * 0.3) + (lowSellThrough * 0.3)) * 100;
        
        let dScore = 0;
        if (p.modalTertahan > Math.max(0, p.laba)) dScore += 2;
        if (p.sellThrough < 60) dScore += 1;
        if (p.stockAgeRisk > 0.5) dScore += 1;
        
        const marginPersen = p.labaPcs / ((p.labaPcs + p.modalPcs) || 1);
        p.category = dScore >= 3 ? 'CASH_FLOW_DANGER' : (marginPersen > 0.4 && avgDaily < 3) ? 'HIGH_MARGIN_LOW_VOLUME' : 'NORMAL';
    }

    const weeklyTargets = { 'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': [], 'Sabtu': [], 'Minggu': [] };
    const dayNameMap = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu' };

    [1, 2, 3, 4, 5, 6, 0].forEach(dayIdx => {
      const dayName = dayNameMap[dayIdx];
      const trafficBoost = core.dayTrafficBoost[dayIdx] || 1.0;

      for (let i = 0; i < core.allKueList.length; i++) {
         const kue = core.allKueList[i];
         const statHarian = analytics.daysMap[dayIdx].stats[kue];
         if (!statHarian || statHarian.aktif === 0) continue;

         const rawAvgLaku = statHarian.laku / statHarian.aktif;
         const rawAvgFreshLaku = statHarian.freshLaku / statHarian.aktif;
         const rawAvgSisa = statHarian.sisa / statHarian.aktif;
         const rawAvgRusak = statHarian.rusak / statHarian.aktif;

         const p = analytics.productStats[kue];
         const modalPerPcs = p?.modalPcs || 0;
         const marginPerPcs = p?.labaPcs || 0;
         const statAnomali = p?.anomaly || 'NORMAL'; 
         const trendMult = p?.trendMultiplier || 1;
         const sellThrough = p?.sellThrough || 0;
         const rolloverRatio = p?.rolloverRatio || 0;
         const stockAgeRisk = p?.stockAgeRisk || 0;

         let type = 'tetap', reason = 'Aman';
         
         const blendedDemand = (rawAvgFreshLaku * 0.85) + (rawAvgLaku * 0.15);
         let baseTarget = blendedDemand; 

         const sellOutRatio = rawAvgLaku / Math.max(1, rawAvgLaku + rawAvgSisa + rawAvgRusak);

         // 🔥 STRATEGI AI BAKERY MODEL: Penyesuaian Target yang Stabil Anti-Anjlok 🔥
         if (sellOutRatio >= 0.85 && rawAvgSisa === 0 && rawAvgLaku > 0) { 
            type = 'naik'; baseTarget = rawAvgLaku * 1.20; // Naikkan buffer produksi 20%
         } 
         else if (rawAvgSisa > (rawAvgLaku * 0.3) || rawAvgRusak > (rawAvgLaku * 0.2) || sellThrough < 75) { 
            type = 'turun'; baseTarget = blendedDemand * 0.85; // Turunkan rem 15%
         }

         let appliedMult = 1.0;
         if (statAnomali === 'SUDDEN_DROP') appliedMult = 0.7;
         else if (statAnomali === 'ABNORMAL_SPIKE') appliedMult = 1.3;
         else {
             let riskPenalty = 1, rolloverPenalty = 1, agingPenalty = 1;
             if (sellThrough < 75) riskPenalty = 0.75;
             else if (sellThrough < 85) riskPenalty = 0.9;
             if (rolloverRatio > 0.3) rolloverPenalty = 0.75;
             if (stockAgeRisk > 0.5 && sellThrough < 80) agingPenalty = 0.8;
             const weightedAdjustment = 1 + ((trendMult - 1) * 0.35) + ((trafficBoost - 1) * 0.20) + ((riskPenalty - 1) * 0.25) + ((rolloverPenalty - 1) * 0.10) + ((agingPenalty - 1) * 0.10);
             appliedMult = Math.max(0.75, Math.min(1.25, weightedAdjustment));
         }

         // Pembulatan dilakukan HANYA di baris paling ujung kalkulasi
         let target = Math.round(baseTarget * appliedMult);
         target = Math.max(target, Math.ceil(rawAvgLaku * 0.5));
         
         if (rawAvgLaku > 0.2) {
           target = Math.max(1, target); // Jaga agar kue aktif minimal diproduksi 1 pcs, bukan lenyap ke 0
         }
         
         const dynamicCap = rawAvgLaku < 10 ? rawAvgLaku + 3 : rawAvgLaku * 1.5;
         target = Math.min(target, Math.ceil(dynamicCap));

         const displayAvgLaku = Math.round(rawAvgLaku);
         const displayAvgSisa = Math.round(rawAvgSisa);

         if (target > 0 || rawAvgLaku > 0) {
             const gap = Math.abs(target - displayAvgLaku);
             let score = 0;
             if (statAnomali === 'SUDDEN_DROP') { score = (displayAvgLaku * marginPerPcs) * 2; reason = '⚠️ Anomaly Drop (Pangkas)'; } 
             else if (statAnomali === 'ABNORMAL_SPIKE') { score = (gap * marginPerPcs) * 2; reason = '🚀 Spike Lonjakan (Gas)'; } 
             else if (type === 'naik') { score = gap * marginPerPcs; reason = score > 50000 ? `Lost Profit Rp${(score/1000).toFixed(0)}k! Tambah` : 'Sering Ludes'; } 
             else if (type === 'turun') {
                 const totalSisaBeban = displayAvgSisa + Math.round(rawAvgRusak); score = totalSisaBeban * modalPerPcs * (2 - appliedMult); 
                 if (rolloverRatio > 0.3) reason = '⚠️ Rollover Tinggi! Tekan Target';
                 else if (sellThrough < 75) reason = '⚠️ Dead Stock! Tekan Produksi';
                 else reason = score > 50000 ? `Rugi Modal Rp${(score/1000).toFixed(0)}k! Kurangi` : (rawAvgRusak > (rawAvgLaku * 0.2) ? 'Rawan Basi' : 'Sering Sisa');
             } else reason = 'Normal (Pertahankan)';

             weeklyTargets[dayName].push({ 
               type, kue, rerata: displayAvgLaku, rerataFresh: Math.round(rawAvgFreshLaku), avgSisa: displayAvgLaku > 0 ? displayAvgSisa : 0, selisih: gap, target, reason, score 
             });
         }
      }
      
      weeklyTargets[dayName] = weeklyTargets[dayName].sort((a, b) => b.score - a.score).slice(0, 100);
    });

    return { weeklyTargets, totalLostOpportunityPcs, totalLostOpportunityRp };
  }, [core, analytics]);
};

// ============================================================================
// 🧩 5. THE MASTER WRAPPER (Facade Hook)
// ============================================================================
export const useBIEngine = (props) => {
  const config = useFilterConfig(props);
  const core = useBIEngineCore(props, config);
  const analytics = useBIAnalytics(core, config);
  const forecast = useBIForecast(core, analytics);

  return useMemo(() => {
    const listSales = Object.entries(analytics.salesMap).map(([namaKue, terjual]) => ({ namaKue, terjual })).sort((a, b) => b.terjual - a.terjual); 
    const listProfit = Object.entries(analytics.profitMap).map(([namaKue, laba]) => ({ namaKue, laba, marginPct: analytics.totalGlobalLaba > 0 ? (laba/analytics.totalGlobalLaba)*100 : 0 })).sort((a, b) => b.laba - a.laba); 
    
    let maxDayAvg = 0;
    const dayList = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
      const dayObj = analytics.daysMap[dayIndex];
      const hariTercatat = dayObj.count.size; 
      const sortedCakes = Object.entries(dayObj.cakes).map(([cake, total]) => ({ cake, total, avg: hariTercatat > 0 ? Math.round(total / hariTercatat) : 0 })).sort((a, b) => b.total - a.total);
      const avg = sortedCakes.reduce((sum, item) => sum + item.avg, 0); 
      if (avg > maxDayAvg) { maxDayAvg = avg; }
      return { name: dayObj.name, avg, topCakes: sortedCakes };
    });

    const d = safeDateCached(config.normalizeDate(config.baseDate)) || new Date();
    const targetDayOfWeek = d.getDay();
    const tomorrowObj = new Date(d); tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const tomorrowDayName = dayNames[tomorrowObj.getDay()];
    
    const tglToday = config.normalizeDate(toDateKey(d));
    const dYest = new Date(d); dYest.setDate(dYest.getDate() - 1);
    const yestKey = config.normalizeDate(toDateKey(dYest));
    
    let tSisaLalu = 0, tProduksi = 0, tSisaAkhir = 0, tRusak = 0, tTerjual = 0;
    
    const activeKueToday = {};
    Object.assign(activeKueToday, core.idxArchive[tglToday], core.idxSisa[tglToday]);
    const kueKeysToday = Object.keys(activeKueToday);
    
    for (let i = 0; i < kueKeysToday.length; i++) {
       const kue = kueKeysToday[i];
       const prod = toNum(core.idxArchive[tglToday]?.[kue]?.stokBaru) + toNum(core.idxArchive[tglToday]?.[kue]?.stokBorongan);
       const sisaA = toNum(core.idxSisa[tglToday]?.[kue]?.sisa);
       const rusakA = toNum(core.idxSisa[tglToday]?.[kue]?.rusak);
       const sisaL = toNum(core.idxSisa[yestKey]?.[kue]?.sisa); 
       
       tSisaLalu += sisaL; tProduksi += prod; tSisaAkhir += sisaA; tRusak += rusakA;
       const laku = Math.max(0, (sisaL + prod) - sisaA - rusakA);
       tTerjual += laku;
    }

    const marketShareList = (dayList.find(x => x.name === dayNames[targetDayOfWeek])?.topCakes || [])
        .map(item => ({ namaKue: item.cake, terjual: item.avg }))
        .filter(item => item.terjual > 0);
    const marketShareTotal = dayList.find(x => x.name === dayNames[targetDayOfWeek])?.avg || 0;

    return {
      formatRp,
      snapshotHariIni: { totalSisaSebelumnya: tSisaLalu, totalProduksi: tProduksi, totalSisaAkhir: tSisaAkhir, totalRusak: tRusak, totalTerjual: tTerjual, hasInputToday: kueKeysToday.length > 0 },
      marketShareData: { list: marketShareList, totalTerjual: marketShareTotal },
      targetBesokList: forecast.weeklyTargets[tomorrowDayName] || [],
      tomorrowDateStr: toDateKey(tomorrowObj),
      tomorrowDayName, currentDayName: dayNames[targetDayOfWeek],
      trafficData: core.trafficData,
      totalAvgVisits: core.trafficData.reduce((a,b) => a+b.total, 0),
      trendData: { list: listSales, totalSalesVol: listSales.reduce((s,i)=>s+i.terjual,0), bestCake: listSales[0]?.namaKue, totalSisa: analytics.totalGlobalSisa, totalRusak: analytics.totalGlobalRusak, totalProduksi: analytics.totalGlobalProduksi },
      profitData: { list: listProfit, maxProfit: listProfit[0]?.laba || 0, bestCake: listProfit[0]?.namaKue, totalLaba: analytics.totalGlobalLaba, marginPct: analytics.totalGlobalOmzet > 0 ? (analytics.totalGlobalLaba/analytics.totalGlobalOmzet)*100 : 0 },
      dayTrendData: { list: dayList, maxDayAvg, topDays: [...dayList].filter(x => x.avg > 0).sort((a,b) => b.avg - a.avg) },
      insightCerdas: { productStats: analytics.productStats, weeklyTargets: forecast.weeklyTargets }
    };
  }, [core, analytics, forecast, config]);
};
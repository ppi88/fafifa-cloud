import { useMemo } from 'react';

export const useAnalisaBisnis = ({ 
  archiveData = {}, sisaArchive = {}, priceList = {}, bahanList = {}, resepData = {}, targetYieldData = {}, 
  normalizeDate, localSelectedDate, selectedMonthIdx, selectedYear, startDate, endDate, filterMode = 'bulan', visitData = [] 
}) => {

  const toNum = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";

  // 🛠️ BUG FIX: Pelindung Tanggal Gabung Jam & Format Aman (Mencegah Error Google Sheets)
  const safeDate = (dKey) => {
    if (!dKey) return new Date(0);
    let s = String(dKey).trim().split(' ')[0]; 
    if (s.includes('-')) {
      const [datePart] = s.split('T');
      const [y, m, d] = datePart.split('-');
      return new Date(toNum(y), toNum(m) - 1, toNum(d));
    }
    if (s.includes('/')) {
      const [d, m, y] = s.split('/');
      return new Date(toNum(y), toNum(m) - 1, toNum(d));
    }
    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
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

  const formatRp = (num) => {
    const isNegative = num < 0;
    const absVal = Math.abs(Math.round(num));
    return `${isNegative ? '-' : ''}Rp ${absVal.toLocaleString('id-ID')}`;
  };

  const getFilterBounds = () => {
    let sDate, eDate;
    if (filterMode === 'harian') {
      const dObj = safeDate(normalizeDate(localSelectedDate));
      sDate = new Date(dObj); sDate.setHours(0, 0, 0, 0);
      eDate = new Date(dObj); eDate.setHours(23, 59, 59, 999);
    } else if (filterMode === 'bulan') {
      sDate = new Date(selectedYear, selectedMonthIdx, 1, 0, 0, 0);
      eDate = new Date(selectedYear, toNum(selectedMonthIdx) + 1, 0, 23, 59, 59);
    } else {
      const d1 = safeDate(normalizeDate(startDate));
      const d2 = safeDate(normalizeDate(endDate));
      sDate = new Date(d1); sDate.setHours(0, 0, 0, 0);
      eDate = new Date(d2); eDate.setHours(23, 59, 59, 999);
    }
    return { sDate, eDate };
  };

  // --- 🚀 LIGHTWEIGHT FILTERS ---
  const filteredVisits = useMemo(() => {
    const { sDate, eDate } = getFilterBounds();
    const result = [];
    
    for (let i = 0; i < visitData.length; i++) {
      const v = visitData[i];
      if (!v.tanggal) continue;
      const normStr = normalizeDate(v.tanggal); 
      const dObj = safeDate(normStr);
      if (dObj >= sDate && dObj <= eDate) result.push(v);
    }
    return result;
  }, [visitData, filterMode, localSelectedDate, selectedMonthIdx, selectedYear, startDate, endDate, normalizeDate]);

  const trafficData = useMemo(() => {
    const hourMap = {};
    const uniqueDays = new Set(); 
    
    for (let i = 0; i < filteredVisits.length; i++) {
      const v = filteredVisits[i];
      if (v.tanggal) uniqueDays.add(normalizeDate(v.tanggal));
      const h = getHourFromJam(v.jam);
      hourMap[h] = (hourMap[h] || 0) + toNum(v.jumlah);
    }

    if (filterMode === 'harian') {
      uniqueDays.add(normalizeDate(localSelectedDate));
    }
    
    const daysCount = Math.max(1, uniqueDays.size); 
    
    const result = [];
    for (let i = 0; i < 15; i++) {
      const hour = i + 7;
      result.push({ hour, total: Math.round((hourMap[hour] || 0) / daysCount) });
    }
    return result;
  }, [filteredVisits, normalizeDate, localSelectedDate, filterMode]);

  const peakTrafficText = useMemo(() => {
    let maxRange = 0; let start = 7;
    for (let i = 0; i <= trafficData.length - 3; i++) {
      const total = trafficData[i].total + trafficData[i+1].total + trafficData[i+2].total;
      if (total > maxRange) { maxRange = total; start = trafficData[i].hour; }
    }
    if (maxRange === 0) return null;
    const end = start + 2;
    return `Kesimpulan Data: Kunjungan toko paling padat terpusat antara jam ${String(start).padStart(2, '0')}:00 s/d ${String(end).padStart(2, '0')}:00. Selalu siapkan stok dan kasir!`;
  }, [trafficData]);


  // --- 🚀 THE HEAVY LIFTING: TURBO DATA ENGINE ---
  const masterData = useMemo(() => {
    const salesMap = {};
    const profitMap = {};
    const productStats = {}; 
    let maxProfit = 0;
    
    let totalGlobalOmzet = 0;
    let totalGlobalLaba = 0;
    let totalGlobalRusak = 0;
    let totalGlobalSisa = 0; 
    let totalGlobalProduksi = 0; 
    let totalLostOpportunityPcs = 0;
    let totalLostOpportunityRp = 0;

    const daysMap = {
      1: { name: 'Senin', total: 0, count: new Set(), cakes: {}, stats: {} },
      2: { name: 'Selasa', total: 0, count: new Set(), cakes: {}, stats: {} },
      3: { name: 'Rabu', total: 0, count: new Set(), cakes: {}, stats: {} },
      4: { name: 'Kamis', total: 0, count: new Set(), cakes: {}, stats: {} },
      5: { name: 'Jumat', total: 0, count: new Set(), cakes: {}, stats: {} },
      6: { name: 'Sabtu', total: 0, count: new Set(), cakes: {}, stats: {} },
      0: { name: 'Minggu', total: 0, count: new Set(), cakes: {}, stats: {} },
    };

    const { sDate, eDate } = getFilterBounds();
    let datesToProcess = [];
    
    const allKeysArr = Array.from(new Set([...Object.keys(archiveData), ...Object.keys(sisaArchive)]));

    if (filterMode === 'harian') {
      const tglKey = normalizeDate(localSelectedDate); 
      if (archiveData[tglKey] || sisaArchive[tglKey]) datesToProcess.push(tglKey);
    } else {
      for (let i = 0; i < allKeysArr.length; i++) {
        const dObj = safeDate(allKeysArr[i]); 
        if (dObj >= sDate && dObj <= eDate) datesToProcess.push(allKeysArr[i]);
      }
    }

    const indexedArchive = {};
    const indexedSisa = {};
    const allKueNamesSet = new Set(Object.keys(priceList));
    const yesterdayKeyCache = {};

    for (let i = 0; i < datesToProcess.length; i++) {
      const tgl = datesToProcess[i];
      indexedArchive[tgl] = {}; 
      indexedSisa[tgl] = {};
      
      const archArr = archiveData[tgl] || [];
      for (let j = 0; j < archArr.length; j++) {
        indexedArchive[tgl][archArr[j].jenisKue] = archArr[j];
        allKueNamesSet.add(archArr[j].jenisKue);
      }

      const sisaArr = sisaArchive[tgl] || [];
      for (let j = 0; j < sisaArr.length; j++) {
        indexedSisa[tgl][sisaArr[j].jenisKue] = sisaArr[j];
        allKueNamesSet.add(sisaArr[j].jenisKue);
      }
      
      const y = safeDate(tgl); 
      y.setDate(y.getDate() - 1);
      const yKey = normalizeDate(`${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`);
      yesterdayKeyCache[tgl] = yKey;

      if (!indexedSisa[yKey]) indexedSisa[yKey] = {};
      const sisaYesterdayArr = sisaArchive[yKey] || [];
      for (let j = 0; j < sisaYesterdayArr.length; j++) {
        indexedSisa[yKey][sisaYesterdayArr[j].jenisKue] = sisaYesterdayArr[j];
        allKueNamesSet.add(sisaYesterdayArr[j].jenisKue);
      }
    }

    const kueListToProcess = Array.from(allKueNamesSet);
    
    // 🔥 TITIK JANGKAR DINAMIS UNTUK ANOMALI 14 HARI 🔥
    const thresholdRef = filterMode === 'harian' ? safeDate(normalizeDate(localSelectedDate)) : eDate;
    const thresholdDateObj = new Date(thresholdRef);
    thresholdDateObj.setDate(thresholdDateObj.getDate() - 14);

    // ⚡ PRE-CALCULATION ENGINE (Eksekusi 1 Kali Saja di Luar Loop) ⚡
    const defaultModalMap = {};
    const defaultPriceMap = {};

    for (let j = 0; j < kueListToProcess.length; j++) {
      const kue = kueListToProcess[j];
      defaultPriceMap[kue] = toNum(priceList[kue]);
      
      productStats[kue] = { 
        terjual: 0, laba: 0, rusak: 0, sisa: 0, produksi: 0, lostPcs: 0, 
        labaPcs: 0, modalPcs: 0, sellingPricePerUnit: 0,
        hariAktif: 0, hariSisa: 0, recentTerjual: 0, 
        recentAktif: 0, sisaLalu: 0, modalTertahan: 0,
        freshSold: 0, rolloverSold: 0, daysSoldOut: 0, soldOutLakuTotal: 0
      };

      const resepArr = resepData[kue] || [];
      let modalResep = 0;
      for (let r = 0; r < resepArr.length; r++) {
        const item = resepArr[r];
        const bahan = bahanList[item.namaBahan];
        modalResep += ((toNum(bahan?.harga)) / (toNum(bahan?.kuantitas) || 1)) * toNum(item.qty);
      }
      const currentYield = toNum(targetYieldData[kue]) || toNum(targetYieldData[cleanKey(kue)]) || 1;
      defaultModalMap[kue] = modalResep / currentYield;
    }

    // 🔥 MAIN HEAVY LOOP (Dengan Fast Math & O(1) Lookup) 🔥
    for (let i = 0; i < datesToProcess.length; i++) {
      const tgl = datesToProcess[i];
      const d = safeDate(tgl);
      const dayIndex = d.getDay(); 
      const isRecent = d >= thresholdDateObj; 
      const yKey = yesterdayKeyCache[tgl];

      for (let j = 0; j < kueListToProcess.length; j++) {
        const kue = kueListToProcess[j];
        const prodItem = indexedArchive[tgl]?.[kue];
        const sisaItem = indexedSisa[tgl]?.[kue];
        const sisaKemarinItem = indexedSisa[yKey]?.[kue];

        const prodBaru = toNum(prodItem?.stokBaru);
        const sisaAkhir = toNum(sisaItem?.sisa);
        const rusak = toNum(sisaItem?.rusak);
        const sisaLalu = toNum(sisaKemarinItem?.sisa);

        const hrgJual = (prodItem && prodItem.hargaJual !== undefined && prodItem.hargaJual !== "") 
          ? toNum(prodItem.hargaJual) : defaultPriceMap[kue];
        const modalPcs = (prodItem && prodItem.modalPcs !== undefined && prodItem.modalPcs !== "") 
          ? toNum(prodItem.modalPcs) : defaultModalMap[kue];
        
        const totalStokHarian = sisaLalu + prodBaru;
        
        // ⚡ Fast Math
        const rawLaku = totalStokHarian - sisaAkhir - rusak;
        const laku = rawLaku > 0 ? rawLaku : 0;
        const totalBebanSisa = sisaAkhir + rusak; 
        
        const rolloverSold = sisaLalu < laku ? sisaLalu : laku;
        const rawFresh = laku - rolloverSold;
        const freshSold = rawFresh > 0 ? rawFresh : 0;

        totalGlobalRusak += rusak;
        totalGlobalProduksi += prodBaru;
        totalGlobalSisa += sisaAkhir; 

        const statKue = productStats[kue];
        const modalTertahanHariIni = sisaAkhir * modalPcs;

        statKue.sellingPricePerUnit = hrgJual; 
        statKue.modalPcs = modalPcs;
        statKue.labaPcs = hrgJual - modalPcs;
        statKue.produksi += prodBaru;
        statKue.rusak += rusak;
        statKue.sisa += sisaAkhir; 
        statKue.sisaLalu += sisaLalu;
        statKue.modalTertahan += modalTertahanHariIni;
        statKue.freshSold += freshSold;
        statKue.rolloverSold += rolloverSold;
        
        if (totalStokHarian > 0) {
            statKue.hariAktif++;
            if (isRecent) {
                statKue.recentAktif++;
                statKue.recentTerjual += laku;
            }
        }
        if (totalBebanSisa > 0) statKue.hariSisa++;

        if (laku >= 5 && sisaAkhir === 0 && rusak === 0 && totalStokHarian > 0) {
            statKue.daysSoldOut++;
            statKue.soldOutLakuTotal += laku;
        }

        if (!daysMap[dayIndex].stats[kue]) {
            daysMap[dayIndex].stats[kue] = { laku: 0, sisa: 0, rusak: 0, aktif: 0, freshLaku: 0, rolloverLaku: 0 };
        }
        if (totalStokHarian > 0) {
            const dStat = daysMap[dayIndex].stats[kue];
            dStat.aktif++;
            dStat.laku += laku;
            dStat.sisa += sisaAkhir;
            dStat.rusak += rusak;
            dStat.freshLaku += freshSold;
            dStat.rolloverLaku += rolloverSold;
        }

        if (prodBaru > 0 || laku > 0 || sisaAkhir > 0 || rusak > 0) {
          const omzet = laku * hrgJual;
          const modal = (laku + rusak) * modalPcs; 
          const laba = omzet - modal;

          salesMap[kue] = (salesMap[kue] || 0) + laku;
          profitMap[kue] = (profitMap[kue] || 0) + laba;
          
          statKue.terjual += laku;
          statKue.laba += laba;

          totalGlobalOmzet += omzet;
          totalGlobalLaba += laba;

          if (laku > 0) {
            daysMap[dayIndex].total += laku;
            daysMap[dayIndex].count.add(tgl); 
            daysMap[dayIndex].cakes[kue] = (daysMap[dayIndex].cakes[kue] || 0) + laku;
          }
        }
      }
    }

    const listSales = Object.entries(salesMap)
      .map(([namaKue, terjual]) => ({ namaKue, terjual }))
      .sort((a, b) => b.terjual - a.terjual); 
    
    let totalSalesVol = 0;
    for (let i = 0; i < listSales.length; i++) totalSalesVol += listSales[i].terjual;

    const productKeys = Object.keys(productStats);
    for (let i = 0; i < productKeys.length; i++) {
        const kue = productKeys[i];
        const p = productStats[kue];
        const avgDaily = p.terjual / Math.max(1, p.hariAktif);
        const recentAvg = p.recentAktif > 0 ? (p.recentTerjual / p.recentAktif) : avgDaily;
        
        p.confidence = Math.min(1, p.hariAktif / 21) * Math.min(1, p.terjual / 50); 
        p.sellThrough = (p.produksi + p.sisaLalu) > 0 ? (p.terjual / (p.produksi + p.sisaLalu)) * 100 : 0;
        
        p.anomaly = 'NORMAL';
        if (avgDaily > 3 && recentAvg === 0 && p.hariAktif > 7) {
            p.anomaly = 'SUDDEN_DROP';
        } else if (recentAvg > (avgDaily * 3) && p.recentAktif > 0 && recentAvg >= 5) {
            p.anomaly = 'ABNORMAL_SPIKE';
        }

        const trendDiff = avgDaily > 0 ? ((recentAvg - avgDaily) / avgDaily) : 0;
        p.trendMultiplier = 1 + (Math.max(-0.5, Math.min(0.5, trendDiff)) * p.confidence);

        if (p.daysSoldOut > 0) {
            const baseLost = p.soldOutLakuTotal * 0.05; 
            p.lostPcs = Math.ceil(baseLost * p.trendMultiplier * Math.max(0.5, p.confidence)); 
            totalLostOpportunityPcs += p.lostPcs;
            totalLostOpportunityRp += (p.lostPcs * p.labaPcs);
        }

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
        
        p.dailyCashEngineScore = (totalGlobalLaba > 0 && totalSalesVol > 0)
            ? ((Math.max(0, p.laba) / totalGlobalLaba) * (p.terjual / totalSalesVol)) * 100
            : 0;
    }

    const listProfit = Object.entries(profitMap).map(([namaKue, laba]) => ({ 
      namaKue, laba, marginPct: totalGlobalLaba > 0 ? (laba/totalGlobalLaba)*100 : 0 
    })).sort((a, b) => b.laba - a.laba); 
    
    if (listProfit.length > 0 && listProfit[0].laba > 0) maxProfit = listProfit[0].laba;

    let maxDayAvg = 0;
    const dayList = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
      const dayObj = daysMap[dayIndex];
      const hariTercatat = dayObj.count.size; 
      const avg = hariTercatat > 0 ? Math.round(dayObj.total / hariTercatat) : 0;
      const sortedCakes = Object.entries(dayObj.cakes).map(([cake, total]) => ({ cake, total, avg: hariTercatat > 0 ? Math.round(total / hariTercatat) : 0 })).sort((a, b) => b.total - a.total);
      if (avg > maxDayAvg) { maxDayAvg = avg; }
      return { name: dayObj.name, avg, topCakes: sortedCakes };
    });

    const topDays = [...dayList].filter(d => d.avg > 0).sort((a, b) => b.avg - a.avg);

    // AI Traffic Booster Calculation
    const uniqueDaysSetGlobal = new Set();
    for (let i = 0; i < filteredVisits.length; i++) {
        if (filteredVisits[i].tanggal) uniqueDaysSetGlobal.add(normalizeDate(filteredVisits[i].tanggal));
    }
    if (filterMode === 'harian') uniqueDaysSetGlobal.add(normalizeDate(localSelectedDate));
    
    const uniqueDaysSizeGlobal = Math.max(1, uniqueDaysSetGlobal.size);

    let totalVisitorsGlobal = 0;
    for (let i = 0; i < filteredVisits.length; i++) totalVisitorsGlobal += toNum(filteredVisits[i].jumlah);
    
    const baselineTraffic = totalVisitorsGlobal / uniqueDaysSizeGlobal;

    const trafficByDayName = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set(), 0: new Set() };
    const visitorsByDayName = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

    for (let i = 0; i < filteredVisits.length; i++) {
      const v = filteredVisits[i];
      if(v.tanggal) {
        const normTgl = normalizeDate(v.tanggal);
        const dObj = safeDate(normTgl);
        const dayIdx = dObj.getDay();
        trafficByDayName[dayIdx].add(normTgl);
        visitorsByDayName[dayIdx] += toNum(v.jumlah);
      }
    }

    const dayTrafficBoost = {};
    for (let idx = 0; idx <= 6; idx++) {
      const daysCount = trafficByDayName[idx].size || 1;
      const avgForThisDay = visitorsByDayName[idx] / daysCount;
      if (baselineTraffic > 0) {
          if (avgForThisDay > baselineTraffic * 1.1) dayTrafficBoost[idx] = 1.1;
          else if (avgForThisDay < baselineTraffic * 0.9) dayTrafficBoost[idx] = 0.95;
          else dayTrafficBoost[idx] = 1.0;
      } else {
          dayTrafficBoost[idx] = 1.0;
      }
    }

    const weeklyTargets = { 'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': [], 'Sabtu': [], 'Minggu': [] };
    const dayNameMap = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu' };

    [1, 2, 3, 4, 5, 6, 0].forEach(dayIdx => {
      const dayName = dayNameMap[dayIdx];
      const trafficBoost = dayTrafficBoost[dayIdx] || 1.0;

      for (let i = 0; i < kueListToProcess.length; i++) {
         const kue = kueListToProcess[i];
         const statHarian = daysMap[dayIdx].stats[kue];
         if (!statHarian || statHarian.aktif === 0) continue;

         const avgLaku = Math.round(statHarian.laku / statHarian.aktif);
         const avgFreshLaku = Math.round(statHarian.freshLaku / statHarian.aktif);
         const avgSisa = Math.round(statHarian.sisa / statHarian.aktif);
         const avgRusak = Math.round(statHarian.rusak / statHarian.aktif);

         const p = productStats[kue];
         const modalPerPcs = p?.modalPcs || 0;
         const marginPerPcs = p?.labaPcs || 0;
         const statAnomali = p?.anomaly || 'NORMAL'; 
         const trendMult = p?.trendMultiplier || 1;
         const conf = p?.confidence || 1;
         const rolloverRatio = p?.rolloverRatio || 0;
         const sellThrough = p?.sellThrough || 0;
         const stockAgeRisk = p?.stockAgeRisk || 0;

         let type = 'tetap';
         const blendedDemand = (avgFreshLaku * 0.7) + (avgLaku * 0.3);
         let baseTarget = Math.round(blendedDemand); 
         let reason = 'Aman';

         if (avgSisa === 0 && avgRusak === 0 && avgLaku > 0) {
            type = 'naik';
            baseTarget = avgLaku + Math.ceil(avgLaku * 0.15); 
         } else if (avgSisa > (avgLaku * 0.3) || avgRusak > (avgLaku * 0.2) || sellThrough < 75) {
            type = 'turun';
            baseTarget = Math.floor(blendedDemand * 0.85); 
         }

         let appliedMult = 1.0;
         let riskPenalty = 1;
         let rolloverPenalty = 1;
         let agingPenalty = 1;

         if (statAnomali === 'SUDDEN_DROP') {
             appliedMult = 0.7;
         } else if (statAnomali === 'ABNORMAL_SPIKE') {
             appliedMult = 1.3;
         } else {
             if (sellThrough < 75) riskPenalty = 0.75;
             else if (sellThrough < 85) riskPenalty = 0.9;
             if (rolloverRatio > 0.3) rolloverPenalty = 0.75;
             if (stockAgeRisk > 0.5 && sellThrough < 80) agingPenalty = 0.8;

             const weightedAdjustment = 1 + 
               ((trendMult - 1) * 0.35) + 
               ((trafficBoost - 1) * 0.20) + 
               ((riskPenalty - 1) * 0.25) + 
               ((rolloverPenalty - 1) * 0.10) + 
               ((agingPenalty - 1) * 0.10);

             appliedMult = Math.max(0.75, Math.min(1.25, weightedAdjustment));
         }

         let target = Math.round(baseTarget * appliedMult);
         const minTargetByDemand = Math.ceil(avgLaku * 0.5);
         target = Math.max(target, minTargetByDemand);

         const isHighMargin = (marginPerPcs / ((marginPerPcs + modalPerPcs) || 1)) > 0.4;
         if (isHighMargin && avgLaku > 0) {
             target = Math.max(5, target);
         } else if (avgLaku >= 3) {
             target = Math.max(3, target);
         }

         const dynamicCap = avgLaku < 10 ? avgLaku + 3 : avgLaku * 1.5;
         target = Math.min(target, Math.ceil(dynamicCap));

         if (target > 0 || avgLaku > 0) {
             const gap = Math.abs(target - avgLaku);
             let score = 0;

             if (statAnomali === 'SUDDEN_DROP') {
                 score = (avgLaku * marginPerPcs) * 2; 
                 reason = '⚠️ Anomaly Drop (Pangkas)';
             } else if (statAnomali === 'ABNORMAL_SPIKE') {
                 score = (gap * marginPerPcs) * 2; 
                 reason = '🚀 Spike Lonjakan (Gas)';
             } else if (type === 'naik') {
                 score = gap * marginPerPcs; 
                 reason = score > 50000 ? `Lost Profit Rp${(score/1000).toFixed(0)}k! Tambah` : 'Sering Ludes';
             } else if (type === 'turun') {
                 const totalSisaBeban = avgSisa + avgRusak; 
                 score = totalSisaBeban * modalPerPcs * (2 - appliedMult); 
                 if (rolloverRatio > 0.3) reason = '⚠️ Rollover Tinggi! Tekan Target';
                 else if (sellThrough < 75) reason = '⚠️ Dead Stock! Tekan Produksi';
                 else reason = score > 50000 ? `Rugi Modal Rp${(score/1000).toFixed(0)}k! Kurangi` : (avgRusak > (avgLaku * 0.2) ? 'Rawan Basi' : 'Sering Sisa');
             } else {
                 reason = 'Normal (Pertahankan)';
             }

             weeklyTargets[dayName].push({
                 type, kue, 
                 rerata: avgLaku, rerataFresh: avgFreshLaku,
                 selisih: gap, target, reason, score,
                 explain: { 
                    appliedMultiplier: appliedMult.toFixed(2), 
                    factors: { 
                        trend: trendMult.toFixed(2), traffic: trafficBoost.toFixed(2),
                        riskPenalty: riskPenalty.toFixed(2), rolloverPenalty: rolloverPenalty.toFixed(2),
                        agingPenalty: agingPenalty.toFixed(2), confidence: conf.toFixed(2) 
                    }, 
                    baseTarget 
                 }
             });
         }
      }
      weeklyTargets[dayName].sort((a, b) => b.score - a.score);
    });

    return { 
      trendData: { list: listSales, totalSalesVol, bestCake: listSales[0]?.namaKue, totalSisa: totalGlobalSisa, totalRusak: totalGlobalRusak, totalProduksi: totalGlobalProduksi }, 
      profitData: { 
        list: listProfit, maxProfit, bestCake: listProfit[0]?.namaKue, totalLaba: totalGlobalLaba, 
        marginPct: totalGlobalOmzet > 0 ? (totalGlobalLaba / totalGlobalOmzet) * 100 : 0 
      }, 
      dayTrendData: { list: dayList, maxDayAvg, topDays },
      insightCerdas: { productStats, totalLostOpportunityPcs, totalLostOpportunityRp, weeklyTargets } 
    };
  }, [filterMode, localSelectedDate, selectedMonthIdx, selectedYear, startDate, endDate, archiveData, sisaArchive, priceList, bahanList, resepData, normalizeDate, targetYieldData, filteredVisits]);

  // --- 🚀 TAHAP 3: JSON READY ---
  const aiReadyData = useMemo(() => {
    const structuredProducts = Object.entries(masterData.insightCerdas.productStats).map(([name, p]) => ({
      name, sold: p.terjual, freshSold: p.freshSold, rolloverSold: p.rolloverSold,
      leftover: p.sisa, damaged: p.rusak, 
      totalProduced: p.produksi + p.sisaLalu,
      sellingPricePerUnit: Math.round(p.sellingPricePerUnit),
      profit: Math.round(p.laba), profitPerUnit: Math.round(p.labaPcs), costPerUnit: Math.round(p.modalPcs),
      sellThrough: toNum(p.sellThrough.toFixed(2)), rolloverRatio: toNum(p.rolloverRatio.toFixed(2)),
      stockAgeRisk: toNum(p.stockAgeRisk.toFixed(2)), riskIndex: toNum(p.riskIndex.toFixed(2)),
      dailyCashEngineScore: toNum(p.dailyCashEngineScore.toFixed(2)), 
      anomaly: p.anomaly, category: p.category, trendMultiplier: toNum(p.trendMultiplier.toFixed(2)),
      confidence: toNum(p.confidence.toFixed(2)), lockedCapital: Math.round(p.modalTertahan),
      activeDays: p.hariAktif, leftoverDays: p.hariSisa, recentSales: p.recentTerjual, lostOpportunityPcs: p.lostPcs
    }));

    const structuredWeeklyTargets = Object.entries(masterData.insightCerdas.weeklyTargets).flatMap(
      ([day, items]) => items.map(item => ({
        day, product: item.kue, target: item.target, currentAverage: item.rerata, currentFreshAverage: item.rerataFresh,
        adjustmentType: item.type, reason: item.reason, score: Math.round(item.score),
        aiFactors: {
          confidence: toNum(item.explain?.factors?.confidence), trend: toNum(item.explain?.factors?.trend),
          traffic: toNum(item.explain?.factors?.traffic), riskPenalty: toNum(item.explain?.factors?.riskPenalty),
          rolloverPenalty: toNum(item.explain?.factors?.rolloverPenalty), agingPenalty: toNum(item.explain?.factors?.agingPenalty),
          multiplier: toNum(item.explain?.appliedMultiplier)
        }
      }))
    );

    const uniqueDaysSetJSON = new Set();
    for (let i = 0; i < filteredVisits.length; i++) {
        if (filteredVisits[i].tanggal) uniqueDaysSetJSON.add(normalizeDate(filteredVisits[i].tanggal));
    }
    if (filterMode === 'harian') uniqueDaysSetJSON.add(normalizeDate(localSelectedDate));
    const uniqueDaysSize = Math.max(1, uniqueDaysSetJSON.size);

    let totalVisitors = 0;
    for (let i = 0; i < filteredVisits.length; i++) totalVisitors += toNum(filteredVisits[i].jumlah);
    
    const averageVisitorsPerDay = Math.round(totalVisitors / uniqueDaysSize);
    
    const structuredTraffic = {
      averageVisitorsPerDay, peakHours: peakTrafficText,
      hourlyTraffic: trafficData.map(t => ({ hour: `${t.hour}:00`, avgTransactions: t.total }))
    };

    return { structuredProducts, structuredWeeklyTargets, structuredTraffic };
  }, [masterData.insightCerdas, filteredVisits, trafficData, peakTrafficText, normalizeDate, localSelectedDate, filterMode]);

  return { 
    trendData: masterData.trendData, profitData: masterData.profitData,
    dayTrendData: masterData.dayTrendData, insightCerdas: masterData.insightCerdas,
    trafficData: trafficData, peakTrafficText: peakTrafficText,
    formatRp: formatRp, aiReadyData: aiReadyData 
  };
};
import { useMemo } from 'react';

export const useDashboardStats = ({
  archiveData = {}, sisaArchive = {}, priceList = {}, bahanList = {}, resepData = {}, targetYieldData = {}, 
  localDate, visitData = [], normalizeDate,
  filterMode = 'all', selectedMonthIdx, selectedYear, startDate, endDate
}) => {

  const toNum = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const cleanKey = (str) => str ? str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";

  // 🛡️ Pelindung Tanggal Aman
  const safeDate = (dKey) => {
    if (!dKey) return new Date(0);
    let s = String(dKey).trim();
    s = s.split(' ')[0]; 
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

  const parseNormalizedToDate = (normStr) => {
    if (!normStr) return new Date(0);
    const p = normStr.split('/');
    if (p.length === 3) return new Date(toNum(p[2]), toNum(p[1]) - 1, toNum(p[0]));
    return new Date(0);
  };

  const getFilterBounds = () => {
    let sDate, eDate;
    if (filterMode === 'harian' || filterMode === 'all') {
      if (filterMode === 'all') {
        sDate = new Date(2020, 0, 1, 0, 0, 0);
        eDate = new Date(2050, 11, 31, 23, 59, 59);
      } else {
        const [y, m, d] = (localDate || '').split('-');
        sDate = new Date(toNum(y), toNum(m) - 1, toNum(d), 0, 0, 0);
        eDate = new Date(toNum(y), toNum(m) - 1, toNum(d), 23, 59, 59);
      }
    } else if (filterMode === 'bulan') {
      sDate = new Date(selectedYear, selectedMonthIdx, 1, 0, 0, 0);
      eDate = new Date(selectedYear, toNum(selectedMonthIdx) + 1, 0, 23, 59, 59);
    } else {
      const [sy, sm, sd] = (startDate || '').split('-');
      sDate = new Date(sy, sm - 1, sd, 0, 0, 0);
      const [ey, em, ed] = (endDate || '').split('-');
      eDate = new Date(ey, em - 1, ed, 23, 59, 59);
    }
    return { sDate, eDate };
  };

  // 🔥 1. KAMUS PINTAR 🔥
  const { idxArchive, idxSisa, allKueList, defaultModalMap, defaultPriceMap } = useMemo(() => {
    const iA = {}; const iS = {}; 
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

    const kueArr = Array.from(kueSet);
    const dModal = {}; const dPrice = {};

    for (let i = 0; i < kueArr.length; i++) {
      const kue = kueArr[i];
      dPrice[kue] = toNum(priceList[kue]);
      // 🔥 FIX TYPO DI SINI 🔥
      const resepArr = resepData[kue] || [];
      let mResep = 0;
      for (let r = 0; r < resepArr.length; r++) {
         const bahan = bahanList[resepArr[r].namaBahan];
         mResep += ((toNum(bahan?.harga)) / (toNum(bahan?.kuantitas) || 1)) * toNum(resepArr[r].qty);
      }
      dModal[kue] = mResep / (toNum(targetYieldData[kue]) || toNum(targetYieldData[cleanKey(kue)]) || 1);
    }
    return { idxArchive: iA, idxSisa: iS, allKueList: kueArr, defaultModalMap: dModal, defaultPriceMap: dPrice };
  }, [archiveData, sisaArchive, priceList, bahanList, resepData, targetYieldData]);

  const filteredVisits = useMemo(() => {
    const { sDate, eDate } = getFilterBounds();
    const result = [];
    for (let i = 0; i < visitData.length; i++) {
      const v = visitData[i];
      if (!v.tanggal) continue;
      const dObj = parseNormalizedToDate(normalizeDate(v.tanggal));
      if (dObj >= sDate && dObj <= eDate) result.push(v);
    }
    return result;
  }, [visitData, filterMode, localDate, selectedMonthIdx, selectedYear, startDate, endDate, normalizeDate]);

  // -------------------------------------------------------------
  // 🚀 MASTER DATA ENGINE (IDENTIK 100% DENGAN ANALISAPAGE)
  // -------------------------------------------------------------
  const masterData = useMemo(() => {
    const productStats = {}; 
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
      const tglKey = normalizeDate(localDate);
      if (archiveData[tglKey] || sisaArchive[tglKey]) datesToProcess.push(tglKey);
    } else {
      for (let i = 0; i < allKeysArr.length; i++) {
        const dObj = parseNormalizedToDate(allKeysArr[i]);
        if (dObj >= sDate && dObj <= eDate) datesToProcess.push(allKeysArr[i]);
      }
    }

    const yesterdayKeyCache = {};
    for (let i = 0; i < datesToProcess.length; i++) {
      const tgl = datesToProcess[i];
      const y = parseNormalizedToDate(tgl); 
      y.setDate(y.getDate() - 1);
      yesterdayKeyCache[tgl] = `${y.getDate()}/${y.getMonth() + 1}/${y.getFullYear()}`;
    }

    const [ly, lm, ld] = (localDate || '').split('-');
    const thresholdDateObj = new Date(toNum(ly), toNum(lm) - 1, toNum(ld), 0, 0, 0);
    thresholdDateObj.setDate(thresholdDateObj.getDate() - 14);

    for (let j = 0; j < allKueList.length; j++) {
      const kue = allKueList[j];
      productStats[kue] = { terjual: 0, laba: 0, rusak: 0, sisa: 0, produksi: 0, lostPcs: 0, labaPcs: 0, modalPcs: 0, sellingPricePerUnit: 0, hariAktif: 0, hariSisa: 0, recentTerjual: 0, recentAktif: 0, sisaLalu: 0, modalTertahan: 0, freshSold: 0, rolloverSold: 0, daysSoldOut: 0, soldOutLakuTotal: 0 };
    }

    for (let i = 0; i < datesToProcess.length; i++) {
      const tgl = datesToProcess[i];
      const d = parseNormalizedToDate(tgl);
      const dayIndex = d.getDay(); 
      const isRecent = d >= thresholdDateObj; 
      const yKey = yesterdayKeyCache[tgl];

      for (let j = 0; j < allKueList.length; j++) {
        const kue = allKueList[j];
        const prodItem = idxArchive[tgl]?.[kue];
        const sisaItem = idxSisa[tgl]?.[kue];
        const sisaKemarinItem = idxSisa[yKey]?.[kue];

        const prodBaru = toNum(prodItem?.stokBaru);
        const sisaAkhir = toNum(sisaItem?.sisa);
        const rusak = toNum(sisaItem?.rusak);
        const sisaLalu = toNum(sisaKemarinItem?.sisa);

        const hrgJual = (prodItem && prodItem.hargaJual !== undefined && prodItem.hargaJual !== "") ? toNum(prodItem.hargaJual) : defaultPriceMap[kue];
        const modalPcs = (prodItem && prodItem.modalPcs !== undefined && prodItem.modalPcs !== "") ? toNum(prodItem.modalPcs) : defaultModalMap[kue];
        
        const totalStokHarian = sisaLalu + prodBaru;
        const laku = Math.max(0, totalStokHarian - sisaAkhir - rusak);
        const totalBebanSisa = sisaAkhir + rusak; 
        const rolloverSold = Math.min(sisaLalu, laku);
        const freshSold = Math.max(0, laku - rolloverSold);

        const statKue = productStats[kue];
        statKue.sellingPricePerUnit = hrgJual; statKue.modalPcs = modalPcs; statKue.labaPcs = hrgJual - modalPcs;
        statKue.produksi += prodBaru; statKue.rusak += rusak; statKue.sisa += sisaAkhir; statKue.sisaLalu += sisaLalu;
        statKue.freshSold += freshSold; statKue.rolloverSold += rolloverSold; statKue.terjual += laku;
        
        if (totalStokHarian > 0) {
            statKue.hariAktif++;
            if (isRecent) { statKue.recentAktif++; statKue.recentTerjual += laku; }
        }
        if (totalBebanSisa > 0) statKue.hariSisa++;

        if (!daysMap[dayIndex].stats[kue]) daysMap[dayIndex].stats[kue] = { laku: 0, sisa: 0, rusak: 0, aktif: 0, freshLaku: 0, rolloverLaku: 0 };
        if (totalStokHarian > 0) {
            const dStat = daysMap[dayIndex].stats[kue];
            dStat.aktif++; dStat.laku += laku; dStat.sisa += sisaAkhir; dStat.rusak += rusak;
            dStat.freshLaku += freshSold; dStat.rolloverLaku += rolloverSold;
        }

        if (laku > 0) { 
            daysMap[dayIndex].total += laku; 
            daysMap[dayIndex].count.add(tgl);
            daysMap[dayIndex].cakes[kue] = (daysMap[dayIndex].cakes[kue] || 0) + laku; 
        }
      }
    }

    for (let i = 0; i < allKueList.length; i++) {
        const kue = allKueList[i];
        const p = productStats[kue];
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
    }

    const uniqueDaysSetGlobal = new Set();
    for (let i = 0; i < filteredVisits.length; i++) {
        if (filteredVisits[i].tanggal) uniqueDaysSetGlobal.add(normalizeDate(filteredVisits[i].tanggal));
    }
    if (filterMode === 'harian') uniqueDaysSetGlobal.add(normalizeDate(localDate));
    
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
        const dObj = parseNormalizedToDate(normTgl);
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
      } else dayTrafficBoost[idx] = 1.0;
    }

    const weeklyTargets = { 'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': [], 'Sabtu': [], 'Minggu': [] };
    const dayNameMap = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu' };

    [1, 2, 3, 4, 5, 6, 0].forEach(dayIdx => {
      const dayName = dayNameMap[dayIdx];
      const trafficBoost = dayTrafficBoost[dayIdx] || 1.0;

      for (let i = 0; i < allKueList.length; i++) {
         const kue = allKueList[i];
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
         const rolloverRatio = p?.rolloverRatio || 0;
         const sellThrough = p?.sellThrough || 0;
         const stockAgeRisk = p?.stockAgeRisk || 0;

         let type = 'tetap', reason = 'Aman';
         const blendedDemand = (avgFreshLaku * 0.7) + (avgLaku * 0.3);
         let baseTarget = Math.round(blendedDemand); 

         if (avgSisa === 0 && avgRusak === 0 && avgLaku > 0) { type = 'naik'; baseTarget = avgLaku + Math.ceil(avgLaku * 0.15); } 
         else if (avgSisa > (avgLaku * 0.3) || avgRusak > (avgLaku * 0.2) || sellThrough < 75) { type = 'turun'; baseTarget = Math.floor(blendedDemand * 0.85); }

         let appliedMult = 1.0, riskPenalty = 1, rolloverPenalty = 1, agingPenalty = 1;

         if (statAnomali === 'SUDDEN_DROP') appliedMult = 0.7;
         else if (statAnomali === 'ABNORMAL_SPIKE') appliedMult = 1.3;
         else {
             if (sellThrough < 75) riskPenalty = 0.75;
             else if (sellThrough < 85) riskPenalty = 0.9;
             if (rolloverRatio > 0.3) rolloverPenalty = 0.75;
             if (stockAgeRisk > 0.5 && sellThrough < 80) agingPenalty = 0.8;
             const weightedAdjustment = 1 + ((trendMult - 1) * 0.35) + ((trafficBoost - 1) * 0.20) + ((riskPenalty - 1) * 0.25) + ((rolloverPenalty - 1) * 0.10) + ((agingPenalty - 1) * 0.10);
             appliedMult = Math.max(0.75, Math.min(1.25, weightedAdjustment));
         }

         let target = Math.round(baseTarget * appliedMult);
         target = Math.max(target, Math.ceil(avgLaku * 0.5));
         const isHighMargin = (marginPerPcs / ((marginPerPcs + modalPerPcs) || 1)) > 0.4;
         if (isHighMargin && avgLaku > 0) target = Math.max(5, target);
         else if (avgLaku >= 3) target = Math.max(3, target);
         target = Math.min(target, Math.ceil(avgLaku < 10 ? avgLaku + 3 : avgLaku * 1.5));

         if (target > 0 || avgLaku > 0) {
             const gap = Math.abs(target - avgLaku);
             let score = 0;
             if (statAnomali === 'SUDDEN_DROP') { score = (avgLaku * marginPerPcs) * 2; reason = '⚠️ Anomaly Drop (Pangkas)'; } 
             else if (statAnomali === 'ABNORMAL_SPIKE') { score = (gap * marginPerPcs) * 2; reason = '🚀 Spike Lonjakan (Gas)'; } 
             else if (type === 'naik') { score = gap * marginPerPcs; reason = score > 50000 ? `Lost Profit Rp${(score/1000).toFixed(0)}k! Tambah` : 'Sering Ludes'; } 
             else if (type === 'turun') {
                 const totalSisaBeban = avgSisa + avgRusak; score = totalSisaBeban * modalPerPcs * (2 - appliedMult); 
                 if (rolloverRatio > 0.3) reason = '⚠️ Rollover Tinggi! Tekan Target';
                 else if (sellThrough < 75) reason = '⚠️ Dead Stock! Tekan Produksi';
                 else reason = score > 50000 ? `Rugi Modal Rp${(score/1000).toFixed(0)}k! Kurangi` : (avgRusak > (avgLaku * 0.2) ? 'Rawan Basi' : 'Sering Sisa');
             } else reason = 'Normal (Pertahankan)';

             weeklyTargets[dayName].push({ type, kue, rerata: avgLaku, rerataFresh: avgFreshLaku, selisih: gap, target, reason, score });
         }
      }
      weeklyTargets[dayName].sort((a, b) => b.score - a.score);
    });

    return { daysMap, weeklyTargets };
  }, [filterMode, localDate, selectedMonthIdx, selectedYear, startDate, endDate, archiveData, sisaArchive, priceList, bahanList, resepData, targetYieldData, filteredVisits, idxArchive, idxSisa, allKueList, defaultModalMap, defaultPriceMap, normalizeDate]);

  // -------------------------------------------------------------
  // 🎯 DASHBOARD EXTRACTOR 
  // -------------------------------------------------------------
  
  const [ly, lm, ld] = (localDate || '').split('-');
  const todayObj = new Date(toNum(ly), toNum(lm) - 1, toNum(ld), 0, 0, 0);
  const targetDayOfWeek = todayObj.getDay(); 

  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const tomorrowDayName = dayNames[tomorrowObj.getDay()];
  const currentDayName = dayNames[targetDayOfWeek];

  const tomorrowDateStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

  const targetBesokList = masterData.weeklyTargets[tomorrowDayName] || [];

  const marketShareData = useMemo(() => {
     const dayObj = masterData.daysMap[targetDayOfWeek];
     if (!dayObj) return { list: [], totalTerjual: 0 };

     const hariTercatat = dayObj.count.size;

     const list = Object.entries(dayObj.cakes).map(([kue, total]) => {
        return { namaKue: kue, terjual: hariTercatat > 0 ? Math.round(total / hariTercatat) : 0 };
     }).filter(k => k.terjual > 0).sort((a,b) => b.terjual - a.terjual);

     const totalTerjual = list.reduce((sum, item) => sum + item.terjual, 0);
     return { list, totalTerjual };
  }, [masterData.daysMap, targetDayOfWeek]);

  // 🔥 SNAPSHOT FISIK HARI INI (TIME-BASED LOOKUP ANTI-MELESET) 🔥
  const snapshotHariIni = useMemo(() => {
    const timeToday = todayObj.getTime();

    const dYest = new Date(todayObj);
    dYest.setDate(dYest.getDate() - 1);
    const timeYest = dYest.getTime();

    const findDataByTime = (dict, targetTime) => {
      if (!dict) return {};
      for (let k in dict) {
        if (safeDate(k).getTime() === targetTime) return dict[k]; 
      }
      return {}; 
    };

    const todayArchive = findDataByTime(idxArchive, timeToday);
    const todaySisa = findDataByTime(idxSisa, timeToday);
    const yestSisa = findDataByTime(idxSisa, timeYest);

    const hasInputToday = Object.keys(todayArchive).length > 0 || Object.keys(todaySisa).length > 0;
    
    let totalSisaSebelumnya = 0, totalProduksi = 0, totalSisaAkhir = 0, totalRusak = 0, totalTerjual = 0;

    allKueList.forEach(kue => {
      const prodBaru = toNum(todayArchive[kue]?.stokBaru);
      const sisaAkhir = toNum(todaySisa[kue]?.sisa);
      const rusak = toNum(todaySisa[kue]?.rusak);
      const sisaLalu = toNum(yestSisa[kue]?.sisa);
      
      if (prodBaru === 0 && sisaAkhir === 0 && rusak === 0 && sisaLalu === 0) return;
      
      const rawLaku = (sisaLalu + prodBaru) - sisaAkhir - rusak;
      const laku = rawLaku > 0 ? rawLaku : 0;
      
      totalSisaSebelumnya += sisaLalu; 
      totalProduksi += prodBaru; 
      totalSisaAkhir += sisaAkhir; 
      totalRusak += rusak; 
      totalTerjual += laku; 
    });

    return { totalSisaSebelumnya, totalProduksi, totalSisaAkhir, totalRusak, totalTerjual, hasInputToday };
  }, [todayObj, idxArchive, idxSisa, allKueList]);

  // 📈 TRAFFIC DATA
  const { dashboardTrafficData, totalAvgVisits } = useMemo(() => {
    const hourlySum = Array.from({ length: 15 }, (_, i) => ({ hour: i + 7, total: 0 }));
    const uniqueDatesWithTrafficSet = new Set();

    for (let i = 0; i < filteredVisits.length; i++) {
        if(filteredVisits[i].tanggal) {
            const normTgl = normalizeDate(filteredVisits[i].tanggal);
            if (parseNormalizedToDate(normTgl).getDay() === targetDayOfWeek) {
              uniqueDatesWithTrafficSet.add(normTgl);
              const h = getHourFromJam(filteredVisits[i].jam);
              const entry = hourlySum.find(item => item.hour === h);
              if (entry) entry.total += toNum(filteredVisits[i].jumlah);
            }
        }
    }
    
    if (filterMode === 'all' || filterMode === 'harian') uniqueDatesWithTrafficSet.add(normalizeDate(localDate));
    const uniqueDaysSize = Math.max(1, uniqueDatesWithTrafficSet.size);

    const avgData = hourlySum.map(item => ({ hour: item.hour, total: Math.round(item.total / uniqueDaysSize) }));
    return { dashboardTrafficData: avgData, totalAvgVisits: avgData.reduce((a,b) => a+b.total, 0) };
  }, [filteredVisits, localDate, targetDayOfWeek, filterMode, normalizeDate]);

  const peakTrafficText = useMemo(() => {
    if (!dashboardTrafficData || dashboardTrafficData.length === 0 || totalAvgVisits === 0) return null; 
    let maxRangeTotal = 0, busyStart = dashboardTrafficData[0].hour, busyEnd = dashboardTrafficData[0].hour;
    for (let i = 0; i <= dashboardTrafficData.length - 3; i++) {
      const windowTotal = dashboardTrafficData[i].total + dashboardTrafficData[i+1].total + dashboardTrafficData[i+2].total;
      if (windowTotal > maxRangeTotal) { maxRangeTotal = windowTotal; busyStart = dashboardTrafficData[i].hour; busyEnd = dashboardTrafficData[i+2].hour; }
    }
    return `🔥 Ramai ${String(busyStart).padStart(2, '0')}:00 - ${String(busyEnd).padStart(2, '0')}:00`;
  }, [dashboardTrafficData, totalAvgVisits]);

  return {
    snapshotHariIni, marketShareData, targetBesokList, tomorrowDateStr, tomorrowDayName,
    trafficData: dashboardTrafficData, totalAvgVisits, currentDayName, peakTrafficText
  };
};
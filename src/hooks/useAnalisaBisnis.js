import { useMemo } from 'react';
import { useBIEngine } from './useBIEngine';

export const useAnalisaBisnis = (props) => {
  // Amankan penggabungan props agar tidak memicu deteksi perubahan palsu
  const engineProps = useMemo(() => ({
    ...props,
    baseDate: props.localSelectedDate
  }), [props]); 

  const engine = useBIEngine(engineProps);

  // 🔥 KUNCI MUTLAK: Memoisasi objek return agar tidak merusak pelindung React.memo di komponen UI (AnalisaPage)
  return useMemo(() => ({ 
    trendData: engine.trendData, 
    profitData: engine.profitData,
    dayTrendData: engine.dayTrendData, 
    insightCerdas: engine.insightCerdas,
    trafficData: engine.trafficData, 
    peakTrafficText: engine.peakTrafficText,
    formatRp: engine.formatRp, 
    // JSON Export bisa ditambahkan kembali kelak jika butuh
    aiReadyData: {} 
  }), [
    engine.trendData,
    engine.profitData,
    engine.dayTrendData,
    engine.insightCerdas,
    engine.trafficData,
    engine.peakTrafficText,
    engine.formatRp
  ]);
};
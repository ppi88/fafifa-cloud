import { useBIEngine } from './useBIEngine';

export const useDashboardStats = (props) => {
  const engineProps = { ...props, baseDate: props.localDate };
  const engine = useBIEngine(engineProps);

  return {
    snapshotHariIni: engine.snapshotHariIni,
    marketShareData: engine.marketShareData,
    targetBesokList: engine.targetBesokList,
    tomorrowDateStr: engine.tomorrowDateStr,
    tomorrowDayName: engine.tomorrowDayName,
    trafficData: engine.trafficData,
    totalAvgVisits: engine.totalAvgVisits,
    currentDayName: engine.currentDayName,
    peakTrafficText: engine.peakTrafficText
  };
};
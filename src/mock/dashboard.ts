import type { MonitorPoint, ProjectRecord, StationRecord, VehicleTypeMetric } from '../types/dashboard';

// 固定、可复现的模拟业务数据，仅用于前端界面开发；接入真实接口时由数据适配层整体替换。

export const roadMetrics = [
  { label: '全县公路总里程', value: '2,386', unit: '公里' },
  { label: '全县公路网密度', value: '151.4', unit: '公里/百平方公里' },
  { label: '全县高速公路总里程', value: '96.8', unit: '公里' },
] as const;

export const vehicleOverview = {
  companyCount: 126,
  totalCount: 3842,
  onlineCount: 2947,
};

export const vehicleTypes: VehicleTypeMetric[] = [
  { key: 'bus', label: '中心城区公交车', shortLabel: '公交车', count: 326, color: '#35d78a' },
  { key: 'taxi', label: '巡游出租车', shortLabel: '巡游出租', count: 842, color: '#25b8ff' },
  { key: 'rideHailing', label: '网约车', shortLabel: '网约车', count: 1436, color: '#ffc933' },
  { key: 'dangerous', label: '危险品运输车辆', shortLabel: '危险品', count: 218, color: '#9b7aff' },
  { key: 'scheduled', label: '班线客运车辆', shortLabel: '班线客运', count: 664, color: '#ff8f35' },
  { key: 'tour', label: '旅游包车', shortLabel: '旅游包车', count: 356, color: '#ff5e64' },
];

export const projects: ProjectRecord[] = [
  { key: 'p1', name: '国道 G108 蒲城段改扩建工程', startDate: '2025-03-18', finishDate: '2027-10-30', investment: '18.60 亿元' },
  { key: 'p2', name: '重点县乡道品质提升工程', startDate: '2025-06-08', finishDate: '2026-12-20', investment: '6.20 亿元' },
  { key: 'p3', name: '蒲城县客运枢纽改造项目', startDate: '2025-09-12', finishDate: '2026-11-15', investment: '2.40 亿元' },
  { key: 'p4', name: '农村公路安全生命防护工程', startDate: '2026-02-22', finishDate: '2026-12-18', investment: '1.80 亿元' },
  { key: 'p5', name: '重点桥梁维修加固项目', startDate: '2026-04-06', finishDate: '2027-06-30', investment: '3.10 亿元' },
  { key: 'p6', name: '公交场站充电设施建设项目', startDate: '2026-05-20', finishDate: '2027-02-28', investment: '0.96 亿元' },
];

export const freightQuarterly = [42.6, 49.8, 46.2, 55.4];
export const passengerQuarterly = [118.4, 142.8, 136.6, 158.2];

export const alarmMetrics = {
  total: 1286,
  confirmedEvents: 184,
  overLimit: 96,
  confirmationRate: 14.3,
};

export const hotlineMetrics = {
  total: 3218,
  accepted: 3062,
  acceptanceRate: 95.2,
  averageCloseHours: 18.6,
  categories: [
    { label: '信息咨询类', value: 62, color: '#25b8ff' },
    { label: '意见建议类', value: 21, color: '#ffc933' },
    { label: '投诉举报类', value: 17, color: '#ff5e64' },
  ],
};

export const urbanMetrics = {
  busCount: 326,
  taxiCount: 842,
  rideHailingCount: 1436,
  yesterdayCardSwipes: 48620,
  electronicSignRate: 78.6,
};

export const stations: StationRecord[] = [
  { key: 's1', area: '中心城区', stops: 86, shelters: 42, signs: 128 },
  { key: 's2', area: '城东片区', stops: 34, shelters: 18, signs: 49 },
  { key: 's3', area: '城南片区', stops: 29, shelters: 14, signs: 43 },
  { key: 's4', area: '城北片区', stops: 31, shelters: 16, signs: 46 },
  { key: 's5', area: '高新区', stops: 22, shelters: 11, signs: 32 },
];

export const monitorPoints: MonitorPoint[] = [
  { key: 'm1', name: '蒲城客运中心', region: '城关街道', type: '客运站', status: 'online' },
  { key: 'm2', name: '东风街与迎宾路口', region: '城关街道', type: '重点路段', status: 'online' },
  { key: 'm3', name: '中心公交场站', region: '城关街道', type: '公交场站', status: 'online' },
  { key: 'm4', name: '孙镇治超站', region: '孙镇', type: '治超站', status: 'fault' },
  { key: 'm5', name: '荆姚客运站', region: '荆姚镇', type: '客运站', status: 'online' },
  { key: 'm6', name: '罕井镇重点路段', region: '罕井镇', type: '重点路段', status: 'offline' },
  { key: 'm7', name: '桥陵镇公交首末站', region: '桥陵镇', type: '公交场站', status: 'online' },
  { key: 'm8', name: '党睦镇治超站', region: '党睦镇', type: '治超站', status: 'online' },
];

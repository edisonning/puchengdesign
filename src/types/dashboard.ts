export type VehicleCategory =
  | 'bus'
  | 'taxi'
  | 'rideHailing'
  | 'dangerous'
  | 'scheduled'
  | 'tour';

export type MonitorStatus = 'online' | 'offline' | 'fault';

export interface VehicleTypeMetric {
  key: VehicleCategory;
  label: string;
  shortLabel: string;
  count: number;
  color: string;
}

export interface VehiclePosition {
  id: string;
  plateNo: string;
  category: VehicleCategory;
  company: string;
  lng: number;
  lat: number;
  speed: number;
  direction: string;
  status: '运行' | '停运';
  routePhase: number;
}

export interface ProjectRecord {
  key: string;
  name: string;
  startDate: string;
  finishDate: string;
  investment: string;
}

export interface StationRecord {
  key: string;
  area: string;
  stops: number;
  shelters: number;
  signs: number;
}

export interface MonitorPoint {
  key: string;
  name: string;
  region: string;
  type: string;
  status: MonitorStatus;
}

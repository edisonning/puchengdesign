import type { VehicleCategory, VehiclePosition } from '../types/dashboard';
import { vehicleTypes } from './dashboard';

// 固定种子生成的模拟车辆轨迹，仅用于前端地图开发，不代表真实车辆或企业。

const COMPANIES = ['蒲城畅运', '渭北客运', '蒲城公交', '秦东物流', '龙源运输', '顺达出行'];
const DIRECTIONS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];
const CENTER = { lng: 109.5863, lat: 34.9559 };

function createRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function createVehicles(count = 800): VehiclePosition[] {
  const random = createRandom(20260812);
  const weightedCategories: VehicleCategory[] = vehicleTypes.flatMap((type) => {
    const weight = Math.max(1, Math.round(type.count / 60));
    return Array.from({ length: weight }, () => type.key);
  });

  return Array.from({ length: count }, (_, index) => {
    const category = weightedCategories[Math.floor(random() * weightedCategories.length)];
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random());
    const lng = CENTER.lng + Math.cos(angle) * radius * 0.27;
    const lat = CENTER.lat + Math.sin(angle) * radius * 0.2;
    const speed = Math.round(12 + random() * 68);
    return {
      id: `vehicle-${index + 1}`,
      plateNo: `陕E·${String(12000 + index).padStart(5, '0')}`,
      category,
      company: COMPANIES[index % COMPANIES.length],
      lng,
      lat,
      speed,
      direction: DIRECTIONS[Math.floor(random() * DIRECTIONS.length)],
      status: speed > 16 ? '运行' : '停运',
      routePhase: random() * Math.PI * 2,
    };
  });
}

export function moveVehicles(vehicles: VehiclePosition[], tick: number): VehiclePosition[] {
  return vehicles.map((vehicle, index) => {
    if (index % 4 !== tick % 4) return vehicle;
    const phase = vehicle.routePhase + tick * 0.09;
    return {
      ...vehicle,
      lng: vehicle.lng + Math.cos(phase) * 0.0007,
      lat: vehicle.lat + Math.sin(phase) * 0.0005,
      speed: Math.max(8, Math.min(86, vehicle.speed + ((tick + index) % 3) - 1)),
      direction: DIRECTIONS[(Math.floor((phase % (Math.PI * 2)) / (Math.PI / 4)) + 8) % 8],
    };
  });
}

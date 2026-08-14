import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cluster from '@bmapgl-plugin/cluster';
import {
  CloseOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { createVehicles, moveVehicles } from '../mock/vehicles';
import { vehicleTypes } from '../mock/dashboard';
import type { VehicleCategory, VehiclePosition } from '../types/dashboard';

declare global {
  interface Window {
    BMapGL?: any;
    __initPuchengBMap?: () => void;
  }
}

type MapState = 'loading' | 'ready' | 'fallback';
type MapLoadingPhase = 'service' | 'style' | 'tiles';
type MapThemeState = 'loading' | 'ready' | 'fallback';
type RegionBoundaryState = 'loading' | 'ready' | 'fallback';

type PopupPosition = {
  left: number;
  top: number;
};

type MapPoint = {
  lng: number;
  lat: number;
};

type VehicleClusterClickEvent = {
  isCluster?: boolean;
  properties?: {
    vehicle?: VehiclePosition;
    vehicleId?: string;
  };
};

const VEHICLE_ICON_PATHS: Record<VehicleCategory, string> = {
  bus: '/assets/map/vehicles/bus.png',
  taxi: '/assets/map/vehicles/taxi.png',
  rideHailing: '/assets/map/vehicles/ride-hailing.png',
  dangerous: '/assets/map/vehicles/dangerous.png',
  scheduled: '/assets/map/vehicles/scheduled.png',
  tour: '/assets/map/vehicles/tour.png',
};

const VEHICLE_CLUSTER_PATHS: Record<VehicleCategory, string> = {
  bus: '/assets/map/clusters/green.png',
  taxi: '/assets/map/clusters/blue.png',
  rideHailing: '/assets/map/clusters/yellow.png',
  dangerous: '/assets/map/clusters/purple.png',
  scheduled: '/assets/map/clusters/orange.png',
  tour: '/assets/map/clusters/red.png',
};

const VEHICLE_TYPE_BY_CATEGORY = new Map(vehicleTypes.map((type) => [type.key, type]));

const VEHICLE_CATEGORY_OFFSETS: Record<VehicleCategory, [number, number]> = {
  bus: [-5, -5],
  taxi: [5, -5],
  rideHailing: [-5, 5],
  dangerous: [5, 5],
  scheduled: [0, -7],
  tour: [0, 7],
};

const MAP_RENDER_TIMEOUT = 15_000;
const MAP_STYLE_VALIDATION_TIMEOUT = 6_000;
const REGION_BOUNDARY_TIMEOUT = 8_000;
const PUCHENG_MAP_VIEW = { lng: 109.5863, lat: 34.9559, zoom: 12 };

const MAP_LOADING_COPY: Record<MapLoadingPhase, { title: string; detail: string }> = {
  service: {
    title: '正在连接百度地图服务',
    detail: '正在建立地图运行环境',
  },
  style: {
    title: '正在加载深色地图主题',
    detail: '道路与行政区图层正在绘制',
  },
  tiles: {
    title: '正在完成地图底图',
    detail: '完成后自动显示，15 秒无响应将提示重试',
  },
};

let baiduMapPromise: Promise<any> | null = null;

function loadBaiduMap(ak: string) {
  if (window.BMapGL) return Promise.resolve(window.BMapGL);
  if (baiduMapPromise) return baiduMapPromise;
  baiduMapPromise = new Promise((resolve, reject) => {
    const callbackName = '__initPuchengBMap';
    const timer = window.setTimeout(() => reject(new Error('地图服务响应超时')), 5000);
    window[callbackName] = () => {
      window.clearTimeout(timer);
      if (window.BMapGL) resolve(window.BMapGL);
      else reject(new Error('地图服务未正确加载'));
    };
    const script = document.createElement('script');
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${encodeURIComponent(ak)}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('地图服务连接失败'));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    baiduMapPromise = null;
    throw error;
  });
  return baiduMapPromise;
}

type BaiduStyleValidationResponse = {
  content?: {
    message?: string;
    status?: number;
  };
};

function validateBaiduMapStyle(ak: string, styleId: string) {
  return new Promise<{ valid: boolean; message?: string }>((resolve) => {
    const callbackName = `__validatePuchengMapStyle_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const callbackHost = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    let completed = false;

    const finish = (result: { valid: boolean; message?: string }) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timer);
      script.remove();
      delete callbackHost[callbackName];
      resolve(result);
    };

    const timer = window.setTimeout(() => {
      finish({ valid: false, message: '深色地图主题校验超时' });
    }, MAP_STYLE_VALIDATION_TIMEOUT);

    callbackHost[callbackName] = (response: BaiduStyleValidationResponse) => {
      const status = response?.content?.status;
      if (status === 0) {
        finish({ valid: true });
        return;
      }
      finish({
        valid: false,
        message: status === 6
          ? '深色地图主题不存在或不属于当前 AK'
          : response?.content?.message || '深色地图主题不可用',
      });
    };
    script.src = `https://api.map.baidu.com/?qt=custom_map&v=3.0&style_id=${encodeURIComponent(styleId)}&type=publish&ak=${encodeURIComponent(ak)}&callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    script.async = true;
    script.onerror = () => finish({ valid: false, message: '深色地图主题校验失败' });
    document.head.appendChild(script);
  });
}

function toClusterFeatures(vehicles: VehiclePosition[]) {
  return vehicles.map((vehicle) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [vehicle.lng, vehicle.lat],
    },
    properties: {
      vehicleId: vehicle.id,
      category: vehicle.category,
      vehicle,
    },
  }));
}

function getVehicleCategory(category: unknown): VehicleCategory | null {
  return typeof category === 'string' && VEHICLE_TYPE_BY_CATEGORY.has(category as VehicleCategory)
    ? category as VehicleCategory
    : null;
}

function getClusterTypeKey(properties: { category?: unknown; vehicleId?: unknown }) {
  const category = getVehicleCategory(properties.category);
  // 未知类型保持为单车，既不混入已知类型，也不会彼此聚合。
  return category ?? `unknown-${String(properties.vehicleId)}`;
}

function getNorthwestBoundaryAnchor(paths: string[]): MapPoint | null {
  const points = paths.flatMap((path) => path.split(';').flatMap((coordinate) => {
    const [lng, lat] = coordinate.split(',').map(Number);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [{ lng, lat }] : [];
  }));
  if (!points.length) return null;

  const minLng = Math.min(...points.map((point) => point.lng));
  const maxLat = Math.max(...points.map((point) => point.lat));
  const lngRange = Math.max(...points.map((point) => point.lng)) - minLng || 1;
  const latRange = maxLat - Math.min(...points.map((point) => point.lat)) || 1;
  return points.reduce((northwest, point) => (
    ((point.lng - minLng) / lngRange) + ((maxLat - point.lat) / latRange)
      < ((northwest.lng - minLng) / lngRange) + ((maxLat - northwest.lat) / latRange)
      ? point
      : northwest
  ));
}

type ClusterMarkerDataset = {
  pointCount?: number;
  reduces?: { divide_type?: unknown };
};

function applyCategoryMarkerStyle(marker: HTMLElement, category: VehicleCategory) {
  const type = VEHICLE_TYPE_BY_CATEGORY.get(category)!;
  const [offsetX, offsetY] = VEHICLE_CATEGORY_OFFSETS[category];
  marker.style.setProperty('--vehicle-color', type.color);
  marker.style.setProperty('--vehicle-cluster-image', `url(${VEHICLE_CLUSTER_PATHS[category]})`);
  marker.style.setProperty('--vehicle-offset-x', `${offsetX}px`);
  marker.style.setProperty('--vehicle-offset-y', `${offsetY}px`);
  marker.dataset.category = category;
  return type;
}

function createClusterMarker(dataset: ClusterMarkerDataset) {
  const count = dataset.pointCount ?? 0;
  const category = getVehicleCategory(dataset.reduces?.divide_type);
  // clusterPointType 只允许已知类别进入聚合；防御性回退不让异常数据伪装成任一类型。
  if (!category) return createVehicleMarker({});

  const type = VEHICLE_TYPE_BY_CATEGORY.get(category)!;
  const size = 48;
  const marker = document.createElement('div');
  marker.className = 'native-cluster-marker';
  marker.style.width = `${size}px`;
  marker.style.height = `${size}px`;
  marker.style.fontSize = count >= 100 ? '12px' : '13px';
  applyCategoryMarkerStyle(marker, category);

  const value = document.createElement('strong');
  value.className = 'native-cluster-marker-count';
  value.textContent = String(count);
  marker.append(value);
  marker.dataset.count = String(count);
  marker.setAttribute('role', 'button');
  marker.setAttribute('tabindex', '0');
  marker.setAttribute('aria-label', `${type.label}聚合点，${count} 辆；按回车键展开`);
  marker.title = `${type.label}：${count} 辆`;
  marker.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      marker.click();
    }
  });
  return marker;
}

function createVehicleMarker(dataset: { category?: VehicleCategory }) {
  const marker = document.createElement('span');
  const category = getVehicleCategory(dataset.category);
  marker.className = 'native-vehicle-marker';
  if (category) {
    applyCategoryMarkerStyle(marker, category);
    marker.style.backgroundImage = `url(${VEHICLE_ICON_PATHS[category]})`;
  } else {
    marker.classList.add('is-unknown');
  }
  marker.setAttribute('role', 'img');
  marker.setAttribute('aria-label', category
    ? `${VEHICLE_TYPE_BY_CATEGORY.get(category)!.label}车辆位置`
    : '未知类型车辆位置');
  return marker;
}

export function BaiduVehicleMap() {
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);
  const visibleVehiclesRef = useRef<VehiclePosition[]>([]);
  const selectedVehicleRef = useRef<VehiclePosition | null>(null);
  const regionAnchorRef = useRef<MapPoint | null>(null);
  const mapLifecycleCleanupRef = useRef<() => void>(() => undefined);
  const retryMapThemeRef = useRef<() => void>(() => undefined);
  const mapAttemptRef = useRef(0);
  const tickRef = useRef(0);
  const [mapState, setMapState] = useState<MapState>('loading');
  const [mapLoadingPhase, setMapLoadingPhase] = useState<MapLoadingPhase>('service');
  const [mapThemeState, setMapThemeState] = useState<MapThemeState>('loading');
  const [regionBoundaryState, setRegionBoundaryState] = useState<RegionBoundaryState>('loading');
  const [mapError, setMapError] = useState('');
  const [mapThemeError, setMapThemeError] = useState('');
  const [vehicles, setVehicles] = useState(() => createVehicles());
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [regionAnchorPosition, setRegionAnchorPosition] = useState<PopupPosition | null>(null);
  const [mapDensity, setMapDensity] = useState({ clusters: 0, vehicles: 0 });
  const [selectedCategories, setSelectedCategories] = useState<Set<VehicleCategory>>(
    () => new Set(vehicleTypes.map((type) => type.key)),
  );
  const visibleVehicles = useMemo(
    () => vehicles.filter((vehicle) => selectedCategories.has(vehicle.category)),
    [selectedCategories, vehicles],
  );
  const selectedVehicleType = selectedVehicle
    ? vehicleTypes.find((item) => item.key === selectedVehicle.category)
    : null;
  useEffect(() => {
    const timer = window.setInterval(() => {
      tickRef.current += 1;
      setVehicles((current) => moveVehicles(current, tickRef.current));
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  visibleVehiclesRef.current = visibleVehicles;
  selectedVehicleRef.current = selectedVehicle;

  const positionPopup = useCallback((vehicle: VehiclePosition) => {
    const BMapGL = window.BMapGL;
    const map = mapRef.current;
    const mapElement = mapElementRef.current;
    if (!BMapGL || !map || !mapElement) return;
    const pixel = map.pointToOverlayPixel(new BMapGL.Point(vehicle.lng, vehicle.lat));
    const popupWidth = 346;
    const left = Math.max(popupWidth / 2 + 14, Math.min(mapElement.clientWidth - popupWidth / 2 - 14, pixel.x));
    // 浮层直接约束在地图可视区域内，不再等待自动平移完成后才显示。
    const top = Math.max(232, pixel.y - 44);
    setPopupPosition((current) => (
      current && Math.abs(current.left - left) < 0.5 && Math.abs(current.top - top) < 0.5
        ? current
        : { left, top }
    ));
  }, []);

  const positionRegionAnchor = useCallback((anchor = regionAnchorRef.current) => {
    const BMapGL = window.BMapGL;
    const map = mapRef.current;
    const mapElement = mapElementRef.current;
    if (!BMapGL || !map || !mapElement || !anchor) return;
    const pixel = map.pointToOverlayPixel(new BMapGL.Point(anchor.lng, anchor.lat));
    // 锚点离屏后贴到安全边缘，仍提供“复位全县”的唯一主动入口。
    const left = Math.max(18, Math.min(mapElement.clientWidth - 174, pixel.x + 14));
    const top = Math.max(94, Math.min(mapElement.clientHeight - 144, pixel.y + 14));
    const next = { left, top };
    setRegionAnchorPosition((current) => (
      current && Math.abs(current.left - next.left) < 0.5 && Math.abs(current.top - next.top) < 0.5
        ? current
        : next
    ));
  }, []);

  const openVehicleDetails = useCallback((event: VehicleClusterClickEvent) => {
    if (event.isCluster) return;
    // Cluster 会原样回传 GeoJSON properties；保留车辆快照可避免地图重绘时再按 ID 查找失败。
    const vehicle = event.properties?.vehicle
      ?? visibleVehiclesRef.current.find((item) => item.id === event.properties?.vehicleId);
    if (!vehicle) return;
    selectedVehicleRef.current = vehicle;
    setSelectedVehicle(vehicle);
    window.requestAnimationFrame(() => positionPopup(vehicle));
  }, [positionPopup]);

  const disposeMapInstance = useCallback(() => {
    mapLifecycleCleanupRef.current();
    mapLifecycleCleanupRef.current = () => undefined;
    retryMapThemeRef.current = () => undefined;
    clusterRef.current?.destroy?.();
    clusterRef.current = null;
    mapRef.current?.destroy?.();
    mapRef.current = null;
    regionAnchorRef.current = null;
    setRegionAnchorPosition(null);
    mapShellRef.current?.classList.remove('is-vehicle-hover');
    mapElementRef.current?.replaceChildren();
  }, []);

  const initializeMap = useCallback(async () => {
    const attempt = ++mapAttemptRef.current;
    disposeMapInstance();
    setMapState('loading');
    setMapLoadingPhase('service');
    setMapThemeState('loading');
    setRegionBoundaryState('loading');
    setMapError('');
    setMapThemeError('');
    const ak = import.meta.env.VITE_BAIDU_MAP_AK?.trim();
    const styleId = import.meta.env.VITE_BAIDU_MAP_STYLE_ID?.trim();
    if (!ak) {
      setMapError('未配置地图访问密钥');
      setMapState('fallback');
      return;
    }
    try {
      const BMapGL = await loadBaiduMap(ak);
      if (attempt !== mapAttemptRef.current || !mapElementRef.current) return;
      const map = new BMapGL.Map(mapElementRef.current, { enableMapClick: false });
      mapRef.current = map;

      let settled = false;
      let tilesReady = false;
      let themeSettled = false;
      let themeRequestPending = false;
      let themeStyleApplied = false;
      let themeRequestVersion = 0;
      let operationalLayersInitialized = false;
      let revealTimer: number | null = null;
      let themeTimer: number | null = null;
      let boundaryTimer: number | null = null;
      let boundarySettled = false;

      const removeReadinessListeners = () => {
        map.removeEventListener?.('style_loaded', handleStyleLoaded);
        map.removeEventListener?.('style_loaded_error', handleStyleFailure);
        map.removeEventListener?.('style_loaded_timeout', handleStyleTimeout);
        map.removeEventListener?.('tilesloaded', handleTilesLoaded);
        window.clearTimeout(renderTimeout);
        if (themeTimer !== null) window.clearTimeout(themeTimer);
        if (revealTimer !== null) window.clearTimeout(revealTimer);
        if (boundaryTimer !== null) window.clearTimeout(boundaryTimer);
      };

      const finishReady = () => {
        if (settled || !themeSettled || !tilesReady || attempt !== mapAttemptRef.current) return;
        settled = true;
        // style_loaded 早于最后一帧深色底图提交；过早创建聚合 WebGL 图层会把
        // 百度底图重置为默认浅色。等待样式帧稳定后再挂载车辆与行政区覆盖物。
        revealTimer = window.setTimeout(() => {
          if (attempt !== mapAttemptRef.current) return;
          window.clearTimeout(renderTimeout);
          initializeOperationalLayers();
          setMapState('ready');
        }, 1_200);
      };

      const failMap = (message: string) => {
        if (settled || attempt !== mapAttemptRef.current) return;
        settled = true;
        removeReadinessListeners();
        setMapError(message);
        setMapState('fallback');
      };

      const finishThemeFallback = (message: string, requestVersion = themeRequestVersion) => {
        if (
          !themeRequestPending
          || requestVersion !== themeRequestVersion
          || attempt !== mapAttemptRef.current
        ) return;
        themeRequestPending = false;
        themeStyleApplied = false;
        themeSettled = true;
        if (themeTimer !== null) window.clearTimeout(themeTimer);
        setMapThemeError(message);
        setMapThemeState('fallback');
        finishReady();
      };

      const applyMapTheme = async () => {
        if (attempt !== mapAttemptRef.current) return;
        const requestVersion = ++themeRequestVersion;
        setMapLoadingPhase('style');
        setMapThemeState('loading');
        setMapThemeError('');
        themeSettled = false;
        themeRequestPending = true;
        themeStyleApplied = false;
        if (themeTimer !== null) window.clearTimeout(themeTimer);

        if (!styleId) {
          finishThemeFallback('未配置深色地图主题');
          return;
        }

        themeTimer = window.setTimeout(() => {
          finishThemeFallback('深色地图主题加载超时', requestVersion);
        }, MAP_RENDER_TIMEOUT);

        const validation = await validateBaiduMapStyle(ak, styleId);
        if (
          requestVersion !== themeRequestVersion
          || !themeRequestPending
          || attempt !== mapAttemptRef.current
        ) return;
        if (!validation.valid) {
          finishThemeFallback(validation.message || '深色地图主题不可用', requestVersion);
          return;
        }

        try {
          // 标准底图可能已经触发过 tilesloaded；应用主题后必须等待新一轮瓦片。
          tilesReady = false;
          themeStyleApplied = true;
          map.setMapStyleV2({ styleId });
        } catch {
          finishThemeFallback('当前地图版本无法加载深色主题', requestVersion);
        }
      };

      function handleStyleLoaded() {
        if (
          !themeRequestPending
          || !themeStyleApplied
          || attempt !== mapAttemptRef.current
        ) return;
        // CSS 等比缩放画布中，百度 GL 可能只派发 style_loaded 而不派发 tilesloaded。
        // 此时个性化样式的 WebGL 资源已经可用，可作为底图完成信号。
        tilesReady = true;
        themeRequestPending = false;
        themeStyleApplied = false;
        themeSettled = true;
        if (themeTimer !== null) window.clearTimeout(themeTimer);
        setMapThemeState('ready');
        setMapThemeError('');
        setMapLoadingPhase('tiles');
        finishReady();
      }

      function handleTilesLoaded() {
        tilesReady = true;
        if (themeRequestPending && themeStyleApplied) {
          themeRequestPending = false;
          themeStyleApplied = false;
          themeSettled = true;
          if (themeTimer !== null) window.clearTimeout(themeTimer);
          setMapThemeState('ready');
          setMapThemeError('');
          setMapLoadingPhase('tiles');
        }
        finishReady();
      }

      function handleStyleFailure() {
        finishThemeFallback('深色地图主题加载失败');
      }

      function handleStyleTimeout() {
        finishThemeFallback('深色地图主题加载超时');
      }

      // 必须在异步校验前注册。这样标准底图的早期事件会被
      // themeStyleApplied 守卫过滤，而不会在主题调用后被误认成深色主题完成。
      map.addEventListener('style_loaded', handleStyleLoaded);
      map.addEventListener('style_loaded_error', handleStyleFailure);
      map.addEventListener('style_loaded_timeout', handleStyleTimeout);
      map.addEventListener('tilesloaded', handleTilesLoaded);

      const renderTimeout = window.setTimeout(() => {
        if (tilesReady) {
          finishThemeFallback('深色地图主题加载超时');
          return;
        }
        failMap('地图底图加载超时，请检查网络后重试');
      }, MAP_RENDER_TIMEOUT);
      mapLifecycleCleanupRef.current = removeReadinessListeners;
      retryMapThemeRef.current = () => void applyMapTheme();

      map.centerAndZoom(new BMapGL.Point(PUCHENG_MAP_VIEW.lng, PUCHENG_MAP_VIEW.lat), PUCHENG_MAP_VIEW.zoom);
      map.enableScrollWheelZoom(true);
      map.setDefaultCursor?.('grab');
      map.addControl(new BMapGL.ScaleControl({ anchor: BMapGL.BMAP_ANCHOR_BOTTOM_LEFT }));
      const initializeOperationalLayers = () => {
        if (operationalLayersInitialized || attempt !== mapAttemptRef.current) return;
        operationalLayersInitialized = true;
        const cluster = new Cluster.View(map, {
        minZoom: 8,
        maxZoom: 18,
        clusterRadius: 52,
        clusterMinPoints: 3,
        clusterMaxZoom: 14,
        // 插件会以此分组键过滤相邻点，确保不同车型不会被合并为同一个聚合点。
        clusterPointType: getClusterTypeKey,
        fitViewOnClick: true,
        updateRealTime: false,
        waitTime: 120,
        renderClusterStyle: {
          type: Cluster.ClusterRender.DOM,
          style: { anchors: [0.5, 0.5], fixBottom: false },
          inject: createClusterMarker,
          },
          renderSingleStyle: {
            // PointIconLayer 在当前运行环境无法拾取单车；DOM 覆盖物可稳定回传点击事件。
            type: Cluster.ClusterRender.DOM,
            style: {
              anchors: [0.5, 1],
              fixBottom: false,
            },
            inject: createVehicleMarker,
          },
        });
        clusterRef.current = cluster;
        cluster.on(Cluster.ClusterEvent.CHANGE, (result: [unknown[], unknown[]]) => {
          setMapDensity({ vehicles: result[0]?.length ?? 0, clusters: result[1]?.length ?? 0 });
        });
        cluster.on(Cluster.ClusterEvent.MOUSE_OVER, (event: VehicleClusterClickEvent) => {
          if (!event.isCluster) {
            map.setDefaultCursor?.('pointer');
            mapShellRef.current?.classList.add('is-vehicle-hover');
          }
        });
        cluster.on(Cluster.ClusterEvent.MOUSE_OUT, (event: VehicleClusterClickEvent) => {
          if (!event.isCluster) {
            map.setDefaultCursor?.('grab');
            mapShellRef.current?.classList.remove('is-vehicle-hover');
          }
        });
        cluster.on(Cluster.ClusterEvent.CLICK, openVehicleDetails);
        cluster.setData(toClusterFeatures(visibleVehiclesRef.current));

        map.addEventListener('zoomend', () => {
          if (selectedVehicleRef.current) positionPopup(selectedVehicleRef.current);
          positionRegionAnchor();
        });
        map.addEventListener('moveend', () => {
          if (selectedVehicleRef.current) positionPopup(selectedVehicleRef.current);
          positionRegionAnchor();
        });

        const boundary = new BMapGL.Boundary();
        const finishBoundary = (state: RegionBoundaryState) => {
          if (boundarySettled || attempt !== mapAttemptRef.current || mapRef.current !== map) return;
          boundarySettled = true;
          if (boundaryTimer !== null) window.clearTimeout(boundaryTimer);
          if (state === 'fallback') {
            regionAnchorRef.current = null;
            setRegionAnchorPosition(null);
          }
          setRegionBoundaryState(state);
        };
        boundaryTimer = window.setTimeout(() => finishBoundary('fallback'), REGION_BOUNDARY_TIMEOUT);
        try {
          boundary.get('渭南市蒲城县', (result: { boundaries?: string[] }) => {
            const paths = result.boundaries?.filter(Boolean) ?? [];
            if (boundarySettled || !paths.length || attempt !== mapAttemptRef.current || mapRef.current !== map) {
              finishBoundary('fallback');
              return;
            }
            try {
              paths.forEach((path) => {
                map.addOverlay(new BMapGL.Polygon(path, {
                  strokeColor: '#164e73', strokeWeight: 4, strokeOpacity: 0.7, fillOpacity: 0,
                  enableClicking: false,
                }));
                map.addOverlay(new BMapGL.Polygon(path, {
                  strokeColor: '#45d5ff', strokeWeight: 2, strokeOpacity: 0.95,
                  fillColor: '#0b5b88', fillOpacity: 0.1,
                  enableClicking: false,
                }));
              });
              regionAnchorRef.current = getNorthwestBoundaryAnchor(paths);
              finishBoundary('ready');
              window.requestAnimationFrame(() => positionRegionAnchor());
            } catch {
              finishBoundary('fallback');
            }
          });
        } catch {
          finishBoundary('fallback');
        }
      };
      void applyMapTheme();
    } catch (error) {
      if (attempt !== mapAttemptRef.current) return;
      setMapError(error instanceof Error ? error.message : '地图服务连接失败');
      setMapState('fallback');
    }
  }, [disposeMapInstance, openVehicleDetails, positionPopup, positionRegionAnchor]);

  useEffect(() => {
    void initializeMap();
    return () => {
      mapAttemptRef.current += 1;
      disposeMapInstance();
    };
  }, [disposeMapInstance, initializeMap]);

  useEffect(() => {
    if (mapState === 'ready' && clusterRef.current) {
      clusterRef.current.setData(toClusterFeatures(visibleVehicles));
    }
  }, [mapState, visibleVehicles]);

  useEffect(() => {
    if (selectedVehicle && !visibleVehicles.some((vehicle) => vehicle.id === selectedVehicle.id)) {
      selectedVehicleRef.current = null;
      setSelectedVehicle(null);
      setPopupPosition(null);
    }
  }, [selectedVehicle, visibleVehicles]);

  function toggleCategory(key: VehicleCategory) {
    setSelectedCategories((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetPuchengView() {
    const BMapGL = window.BMapGL;
    const map = mapRef.current;
    if (!BMapGL || !map) return;
    map.centerAndZoom(new BMapGL.Point(PUCHENG_MAP_VIEW.lng, PUCHENG_MAP_VIEW.lat), PUCHENG_MAP_VIEW.zoom);
  }

  function changeZoom(delta: number) {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(Math.max(8, Math.min(18, map.getZoom() + delta)));
  }

  return (
    <div
      ref={mapShellRef}
      className="vehicle-map-shell"
      data-cluster-count={mapDensity.clusters}
      data-individual-count={mapDensity.vehicles}
      data-map-state={mapState}
      data-map-loading-phase={mapState === 'loading' ? mapLoadingPhase : undefined}
      data-map-theme-state={mapThemeState}
      data-map-theme-source="style-id"
      data-map-renderer="bmapgl-cluster"
      aria-busy={mapState === 'loading'}
    >
      <div ref={mapElementRef} className="baidu-map" aria-label="蒲城县实时车辆位置地图" />
      <div className="map-tone" aria-hidden="true" />
      {mapState !== 'ready' && (
        <div className={`map-fallback is-${mapState}`} aria-live="polite" role="status">
          <div className="fallback-map-grid" aria-hidden="true">
            {Array.from({ length: 72 }, (_, index) => {
              const vehicle = vehicles[index * 7];
              return (
                <i
                  key={vehicle.id}
                  className="fallback-vehicle"
                  style={{
                    left: `${12 + ((vehicle.lng - 109.3163) / 0.54) * 76}%`,
                    top: `${12 + ((35.1559 - vehicle.lat) / 0.4) * 76}%`,
                    backgroundImage: `url(${VEHICLE_ICON_PATHS[vehicle.category]})`,
                  }}
                />
              );
            })}
          </div>
          <div className="map-state-message">
            {mapState === 'loading' ? <span className="map-loading-mark" /> : <ReloadOutlined />}
            <strong>{mapState === 'loading' ? MAP_LOADING_COPY[mapLoadingPhase].title : '地图底图暂未连接'}</strong>
            <span>{mapState === 'loading' ? MAP_LOADING_COPY[mapLoadingPhase].detail : mapError}</span>
            {mapState === 'fallback' && <Button size="small" onClick={() => void initializeMap()}>重新连接</Button>}
          </div>
        </div>
      )}
      {mapState === 'ready' && mapThemeState !== 'ready' && (
        <div className={`map-theme-notice is-${mapThemeState}`} role="status" aria-live="polite">
          {mapThemeState === 'loading' ? <span className="map-loading-mark" /> : <ExclamationCircleOutlined />}
          <span>{mapThemeState === 'loading' ? '正在重新加载深色主题' : `${mapThemeError}，当前显示标准底图`}</span>
          {mapThemeState === 'fallback' && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => retryMapThemeRef.current()}
            >
              重新加载主题
            </Button>
          )}
        </div>
      )}
      {mapState === 'ready' && regionBoundaryState === 'fallback' && (
        <div className="map-region-notice" role="status" aria-live="polite">
          <ExclamationCircleOutlined />
          <span>行政范围暂未加载</span>
        </div>
      )}
      <div className="map-topline">
        <div>
          <span className="map-kicker">实时运行车辆</span>
          <strong>{visibleVehicles.length}</strong>
          <small> / 800 辆</small>
        </div>
        <div className="map-live-state">
          <span className="map-density-state">{mapDensity.clusters} 组聚合 · {mapDensity.vehicles} 辆单车</span>
          <span className="map-update"><i />每 5 秒更新</span>
        </div>
      </div>
      {mapState === 'ready' && regionBoundaryState === 'ready' && regionAnchorPosition && (
        <Tooltip title="点击复位全县视角">
          <button
            type="button"
            className="map-region-anchor"
            style={{ left: regionAnchorPosition.left, top: regionAnchorPosition.top }}
            onClick={resetPuchengView}
            aria-label="蒲城县，全县运行态势；点击复位全县视角"
          >
            <EnvironmentOutlined aria-hidden="true" />
            <span><strong>蒲城县</strong><small>全县运行态势</small></span>
          </button>
        </Tooltip>
      )}
      {selectedVehicle && selectedVehicleType && popupPosition && (
        <aside
          className="vehicle-popup"
          style={{ left: popupPosition.left, top: popupPosition.top }}
          aria-label={`${selectedVehicle.plateNo} 车辆运行信息`}
        >
          <header className="vehicle-popup-head">
            <span className="vehicle-popup-symbol"><EnvironmentOutlined /></span>
            <div>
              <span>车辆运行信息</span>
              <strong>{selectedVehicle.plateNo}</strong>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              aria-label="关闭车辆信息"
              onClick={() => {
                selectedVehicleRef.current = null;
                setSelectedVehicle(null);
                setPopupPosition(null);
              }}
            />
          </header>
          <div className="vehicle-popup-metrics">
            <div>
              <span>运行状态</span>
              <strong data-status={selectedVehicle.status}>{selectedVehicle.status}</strong>
            </div>
            <div>
              <span>当前速度</span>
              <strong>{selectedVehicle.speed}<small> km/h</small></strong>
            </div>
            <div>
              <span>行驶方向</span>
              <strong>{selectedVehicle.direction}</strong>
            </div>
          </div>
          <dl className="vehicle-popup-details">
            <dt>车辆类型</dt><dd>{selectedVehicleType.label}</dd>
            <dt>所属企业</dt><dd>{selectedVehicle.company}</dd>
          </dl>
        </aside>
      )}
      <div className="map-legend" aria-label="车辆类型筛选">
        {vehicleTypes.map((type) => {
          const active = selectedCategories.has(type.key);
          return (
            <Tooltip key={type.key} title={`${type.label} ${type.count} 辆`}>
              <button
                type="button"
                className={active ? 'active' : ''}
                aria-pressed={active}
                onClick={() => toggleCategory(type.key)}
              >
                <i style={{ backgroundColor: type.color }} />
                <span>{type.shortLabel}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
      <div className="map-zoom-controls" aria-label="地图缩放">
        <Button aria-label="放大地图" icon={<PlusOutlined />} onClick={() => changeZoom(1)} disabled={mapState !== 'ready'} />
        <Button aria-label="缩小地图" icon={<MinusOutlined />} onClick={() => changeZoom(-1)} disabled={mapState !== 'ready'} />
      </div>
      <div className="map-coordinate">中心坐标 109.5863°E / 34.9559°N</div>
    </div>
  );
}

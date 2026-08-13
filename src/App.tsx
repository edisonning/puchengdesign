import { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Progress, Table, theme } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  AlertOutlined,
  BuildOutlined,
  CarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  RadarChartOutlined,
  NodeIndexOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Panel } from './components/Panel';
import { QuarterChart } from './components/QuarterChart';
import { ProjectTable } from './components/ProjectTable';
import { BaiduVehicleMap } from './components/BaiduVehicleMap';
import { VideoMonitor } from './components/VideoMonitor';
import {
  alarmMetrics,
  freightQuarterly,
  hotlineMetrics,
  passengerQuarterly,
  roadMetrics,
  stations,
  urbanMetrics,
  vehicleOverview,
  vehicleTypes,
} from './mock/dashboard';
import type { StationRecord } from './types/dashboard';

function formatDateTime(date: Date) {
  const dateText = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).format(date);
  const timeText = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
  return { dateText, timeText };
}

function RoadPanel() {
  return (
    <Panel title="路网运行" icon={<NodeIndexOutlined />} className="road-panel">
      <div className="road-metrics">
        {roadMetrics.map((item) => (
          <article className="metric-slab" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.unit}</small>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function VehiclePanel() {
  return (
    <Panel
      title="两客一危与营运车辆"
      icon={<CarOutlined />}
      className="vehicle-panel"
      extra={<span className="online-summary"><i />在线 {vehicleOverview.onlineCount.toLocaleString()}</span>}
    >
      <div className="vehicle-overview">
        <div><span>企业总数</span><strong>{vehicleOverview.companyCount}</strong><small>家</small></div>
        <div><span>车辆总数</span><strong>{vehicleOverview.totalCount.toLocaleString()}</strong><small>辆</small></div>
      </div>


      <div className="vehicle-groups">
        <div className="vehicle-group-heading"><span>城市客运</span><i /></div>
        <div className="vehicle-type-grid">
          {vehicleTypes.slice(0, 3).map((type) => (
            <div className="vehicle-type" key={type.key}>
              <i style={{ backgroundColor: type.color }} />
              <span>{type.shortLabel}</span>
              <strong>{type.count.toLocaleString()}</strong>
              <small>辆</small>
            </div>
          ))}
        </div>
        <div className="vehicle-group-heading"><span>两客一危</span><i /></div>
        <div className="vehicle-type-grid">
          {vehicleTypes.slice(3).map((type) => (
            <div className="vehicle-type" key={type.key}>
              <i style={{ backgroundColor: type.color }} />
              <span>{type.shortLabel}</span>
              <strong>{type.count.toLocaleString()}</strong>
              <small>辆</small>
            </div>
          ))}
        </div>
      </div>


    </Panel>
  );
}

function AlarmPanel() {
  return (
    <Panel
      title="报警事件与 12328 热线"
      icon={<AlertOutlined />}
      className="alarm-panel"
      extra={<span className="duty-state"><i />值守中</span>}
    >
      <div className="alarm-hotline-layout">
        <div className="alarm-zone alarm-zone--priority alarm-zone--rate-two-line">
          <div className="alarm-cards alarm-cards--priority">
            <article className="alarm-critical">
              <span>报警总数</span>
              <strong>{alarmMetrics.total.toLocaleString()}</strong>
              <small>条原始报警</small>
            </article>
            <article>
              <span>事件报警数</span>
              <strong>{alarmMetrics.confirmedEvents}</strong>
              <small>人工确认</small>
            </article>
            <article>
              <span>超限报警数</span>
              <strong>{alarmMetrics.overLimit}</strong>
              <small>可能与事件重叠</small>
            </article>
          </div>
          <div className="confirmation-rate confirmation-rate--two-line">
            <span>事件确认率</span>
            <Progress percent={alarmMetrics.confirmationRate} showInfo={false} strokeColor="#ff9d3d" railColor="#17334e" />
            <strong>{alarmMetrics.confirmationRate}%</strong>
          </div>
        </div>
        <div className="hotline-zone hotline-zone--matrix">
          <div className="hotline-heading"><PhoneOutlined /><span>12328 服务热线</span></div>
          <div className="hotline-core hotline-core--matrix">
            <div><span>业务总量</span><strong>{hotlineMetrics.total.toLocaleString()}</strong></div>
            <div><span>受理量</span><strong>{hotlineMetrics.accepted.toLocaleString()}</strong></div>
            <div><span>受理率</span><strong>{hotlineMetrics.acceptanceRate}%</strong></div>
            <div><span>平均办结</span><strong>{hotlineMetrics.averageCloseHours}</strong><small>小时</small></div>
          </div>
          <div className="hotline-categories hotline-categories--row">
            {hotlineMetrics.categories.map((item) => (
              <div key={item.label}>
                <span><i style={{ backgroundColor: item.color }} />{item.label}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

const stationColumns: TableColumnsType<StationRecord> = [
  { title: '区域', dataIndex: 'area', width: '34%' },
  { title: '站点', dataIndex: 'stops', align: 'right' },
  { title: '站亭', dataIndex: 'shelters', align: 'right' },
  { title: '站牌', dataIndex: 'signs', align: 'right' },
];

function UrbanPanel() {
  return (
    <Panel title="城市交通" icon={<EnvironmentOutlined />} className="urban-panel">
      <div className="urban-layout">
        <div className="urban-metrics urban-metrics--service-first">
          <div className="urban-service-row urban-service-row--primary">
            <div><span>昨日累计刷卡量</span><strong>{urbanMetrics.yesterdayCardSwipes.toLocaleString()}</strong><small>人次</small></div>
            <div><span>电子站牌占比</span><strong>{urbanMetrics.electronicSignRate}%</strong></div>
          </div>
          <div className="urban-vehicle-row urban-vehicle-row--secondary">
            <span>中心城区公交<strong>{urbanMetrics.busCount}</strong><small>辆</small></span>
            <span>巡游出租车<strong>{urbanMetrics.taxiCount}</strong><small>辆</small></span>
            <span>网约车<strong>{urbanMetrics.rideHailingCount.toLocaleString()}</strong><small>辆</small></span>
          </div>
        </div>
        <div className="urban-stations">
          <div className="subsection-title">区域站点设施</div>
          <Table<StationRecord>
            className="dashboard-table station-table"
            columns={stationColumns}
            dataSource={stations}
            pagination={false}
            size="small"
            rowKey="key"
          />
        </div>
        <div className="urban-chart">
          <div className="subsection-title">客运运输季度统计</div>
          <QuarterChart data={passengerQuarterly} unit="万人次" compact />
        </div>
      </div>
    </Panel>
  );
}

function App() {
  const [now, setNow] = useState(new Date());
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const clock = useMemo(() => formatDateTime(now), [now]);
  const dashboardScale = Math.min(viewport.width / 3840, viewport.height / 1080, 1);
  const dashboardLeft = Math.max(0, (viewport.width - 3840 * dashboardScale) / 2);
  const dashboardTop = Math.max(0, (viewport.height - 1080 * dashboardScale) / 2);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#25b8ff', colorInfo: '#25b8ff', colorSuccess: '#35d78a',
          colorWarning: '#ffc933', colorError: '#ff5e64', colorBgBase: '#061327',
          colorTextBase: '#dff4ff', borderRadius: 0, fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        },
        components: {
          Table: {
            headerBg: '#0b2948', headerColor: '#70d8ff', rowHoverBg: '#0b3154',
            borderColor: '#1b5278', colorBgContainer: 'transparent', cellPaddingBlockSM: 7,
          },
          Tree: { nodeHoverBg: '#0b3154', nodeSelectedBg: '#0b4268' },
          Button: { defaultBg: '#0b3154', defaultBorderColor: '#1d8dbe', defaultColor: '#dff4ff' },
        },
      }}
    >
      <main className="dashboard-viewport">
        <div
          className="dashboard-page"
          style={{ left: dashboardLeft, top: dashboardTop, transform: `scale(${dashboardScale})` }}
        >
          <div className="dashboard-frame">
          <header className="command-header">
            <div className="header-left"><span className="city-mark">渭南市</span><i /></div>
            <div className="title-block">
              <span className="title-wing left" aria-hidden="true" />
              <h1>蒲城县交通运输运行监测总览</h1>
              <span className="title-wing right" aria-hidden="true" />
            </div>
            <div className="header-right">
              <div className="system-state"><i />系统运行正常</div>
              <div className="clock-block"><strong>{clock.timeText}</strong><span>{clock.dateText}</span></div>
            </div>
          </header>

          <div className="dashboard-grid">
            <div className="dashboard-left-column">
              <RoadPanel />
              <VehiclePanel />
              <Panel title="工程建设" icon={<BuildOutlined />} className="project-panel" extra={<span>重点项目 6 项</span>}>
                <ProjectTable />
              </Panel>
              <Panel title="货物运输" icon={<RadarChartOutlined />} className="freight-panel" extra={<span>本年度 · 万吨</span>}>
                <QuarterChart data={freightQuarterly} unit="万吨" />
              </Panel>
            </div>

            <section className="map-command-center" aria-label="全县车辆实时态势">
              <header className="map-panel-title">
                <div><EnvironmentOutlined /><h2>全县车辆实时态势</h2></div>
                <span>实时定位 · 分类筛选 · 聚合展示</span>
              </header>
              <BaiduVehicleMap />
            </section>

            <div className="dashboard-right-column">
              <AlarmPanel />
              <Panel title="全县交通运输视频监控" icon={<VideoCameraOutlined />} className="video-panel" extra={<span>8 个接入点位</span>}>
                <VideoMonitor />
              </Panel>
              <UrbanPanel />
            </div>
          </div>
            <footer className="dashboard-footer">
              <span>PUCHENG TRANSPORTATION OPERATIONS COORDINATION CENTER</span>
              <span>数据更新时间 {clock.timeText}</span>
            </footer>
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
}

export default App;

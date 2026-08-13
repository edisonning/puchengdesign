import { useEffect, useMemo, useState } from 'react';
import { Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { EnvironmentOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { monitorPoints } from '../mock/dashboard';
import type { MonitorPoint, MonitorStatus } from '../types/dashboard';

const statusLabels: Record<MonitorStatus, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
};

function PointTitle({ point }: { point: MonitorPoint }) {
  return (
    <span className="tree-point-title">
      <span className={`status-dot ${point.status}`} />
      <span>{point.name}</span>
      <small>{statusLabels[point.status]}</small>
    </span>
  );
}

function buildTree(): DataNode[] {
  const regions = [...new Set(monitorPoints.map((point) => point.region))];
  return regions.map((region) => {
    const regionPoints = monitorPoints.filter((point) => point.region === region);
    const types = [...new Set(regionPoints.map((point) => point.type))];
    return {
      key: `region-${region}`,
      title: region,
      icon: <EnvironmentOutlined />,
      children: types.map((type) => ({
        key: `type-${region}-${type}`,
        title: type,
        children: regionPoints
          .filter((point) => point.type === type)
          .map((point) => ({ key: point.key, title: <PointTitle point={point} />, isLeaf: true })),
      })),
    };
  });
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function VideoMonitor() {
  const treeData = useMemo(buildTree, []);
  const [selectedKey, setSelectedKey] = useState(monitorPoints[0].key);
  const [clock, setClock] = useState(new Date());
  const selectedPoint = monitorPoints.find((point) => point.key === selectedKey) ?? monitorPoints[0];

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="video-monitor-layout">
      <div className="monitor-tree-wrap">
        <div className="monitor-summary">
          <span><i className="status-dot online" />在线 6</span>
          <span><i className="status-dot offline" />离线 1</span>
          <span><i className="status-dot fault" />故障 1</span>
        </div>
        <Tree
          className="monitor-tree"
          treeData={treeData}
          showIcon
          defaultExpandedKeys={['region-城关街道']}
          selectedKeys={[selectedKey]}
          onSelect={(keys) => {
            const key = String(keys[0] ?? '');
            if (monitorPoints.some((point) => point.key === key)) setSelectedKey(key);
          }}
        />
      </div>
      <div className={`video-stage ${selectedPoint.status}`}>
        <div className="video-hud top">
          <span className="live-badge"><VideoCameraOutlined /> 监控点位</span>
          <span>{formatTime(clock)}</span>
        </div>
        <div className={`video-unavailable ${selectedPoint.status === 'online' ? 'no-signal' : ''}`}>
          <VideoCameraOutlined />
          <strong>{selectedPoint.status === 'online' ? '暂无视频信号' : statusLabels[selectedPoint.status]}</strong>
          <span>
            {selectedPoint.status === 'online'
              ? '当前点位未接入实时视频流'
              : selectedPoint.status === 'fault'
                ? '设备链路异常，请联系运维人员'
                : '监控点当前未连接'}
          </span>
        </div>
        <div className="video-hud bottom">
          <strong>{selectedPoint.name}</strong>
          <span>{selectedPoint.region} · {selectedPoint.type}</span>
        </div>
      </div>
    </div>
  );
}

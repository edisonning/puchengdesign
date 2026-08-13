import { useEffect, useMemo, useState } from 'react';
import { Table, Tooltip } from 'antd';
import type { TableColumnsType } from 'antd';
import { projects } from '../mock/dashboard';
import type { ProjectRecord } from '../types/dashboard';

const columns: TableColumnsType<ProjectRecord> = [
  {
    title: '项目名称',
    dataIndex: 'name',
    width: '43%',
    ellipsis: true,
    render: (value: string) => <Tooltip title={value}><span>{value}</span></Tooltip>,
  },
  { title: '开工时间', dataIndex: 'startDate', width: '20%' },
  { title: '竣工时间', dataIndex: 'finishDate', width: '20%' },
  { title: '总投资', dataIndex: 'investment', width: '17%', align: 'right' },
];

export function ProjectTable() {
  const [offset, setOffset] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setOffset((value) => (value + 1) % projects.length), 3600);
    return () => window.clearInterval(timer);
  }, [paused]);

  const visibleRows = useMemo(
    () => Array.from({ length: 4 }, (_, index) => projects[(offset + index) % projects.length]),
    [offset],
  );

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Table<ProjectRecord>
        className="dashboard-table project-table"
        columns={columns}
        dataSource={visibleRows}
        pagination={false}
        size="small"
        rowKey="key"
        tableLayout="fixed"
      />
    </div>
  );
}

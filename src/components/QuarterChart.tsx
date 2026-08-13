import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface QuarterChartProps {
  data: number[];
  unit: string;
  compact?: boolean;
}

export function QuarterChart({ data, unit, compact = false }: QuarterChartProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetRef.current) return;
    const chart = echarts.init(targetRef.current, undefined, { renderer: 'canvas' });
    chart.setOption({
      animationDuration: 650,
      animationEasing: 'cubicOut',
      grid: { left: compact ? 44 : 52, right: 16, top: 28, bottom: 34 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#071a31',
        borderColor: '#1aaee8',
        textStyle: { color: '#eaf7ff', fontSize: 16 },
        formatter: (params: unknown) => {
          const item = (params as Array<{ name: string; value: number }>)[0];
          return `${item.name}<br/><strong>${item.value}</strong> ${unit}`;
        },
      },
      xAxis: {
        type: 'category',
        data: ['第一季度', '第二季度', '第三季度', '第四季度'],
        axisLine: { lineStyle: { color: '#275174' } },
        axisTick: { show: false },
        axisLabel: { color: '#a9c7df', fontSize: compact ? 13 : 15, interval: 0 },
      },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: '#7fa9ca', fontSize: 13, align: 'right' },
        splitNumber: 3,
        axisLabel: { color: '#7fa9ca', fontSize: 13 },
        splitLine: { lineStyle: { color: 'rgba(74, 130, 172, 0.24)' } },
      },
      series: [
        {
          type: 'bar',
          data,
          barWidth: compact ? 23 : 32,
          itemStyle: {
            color: '#25b8ff',
            borderColor: '#65d8ff',
            borderWidth: 1,
          },
          emphasis: { itemStyle: { color: '#ffc933' } },
          label: {
            show: true,
            position: 'top',
            color: '#eaf7ff',
            fontSize: compact ? 13 : 15,
            formatter: '{c}',
          },
        },
      ],
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(targetRef.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [compact, data, unit]);

  return <div className="quarter-chart" ref={targetRef} role="img" aria-label={`季度统计图，单位${unit}`} />;
}

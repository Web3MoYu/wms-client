import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CountVo } from '../../../../api/count/CountService';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
]);

interface RoseChartProps {
  data: CountVo[];
  height?: string | number;
  title?: string;
}

const RoseChart: React.FC<RoseChartProps> = ({
  data,
  height = '400px',
  title = '产品分类数量统计',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    // 初始化图表
    if (chartRef.current && !chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 处理窗口大小变化
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current && data?.length) {
      // 准备图表数据并按产品数量从大到小排序
      const seriesData = data
        .map((item) => ({
          name: item.name || '未分类',
          value: item.count || 0,
        }))
        .sort((a, b) => b.value - a.value);

      // 设置图表选项
      const option = {
        title: {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 14
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: {
            fontSize: 10
          },
          data: seriesData.map((item) => item.name),
        },
        series: [
          {
            name: '产品数量',
            type: 'pie',
            radius: ['30%', '70%'],
            center: ['50%', '60%'],
            roseType: 'radius', // 设置为南丁格尔玫瑰图
            itemStyle: {
              borderRadius: 4,
            },
            label: {
              show: true,
              formatter: '{b}: {c}',
              fontSize: 10
            },
            data: seriesData,
            emphasis: {
              itemStyle: {
                shadowBlur: 5,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.3)',
              },
            },
          },
        ],
      };

      // 设置图表选项
      chartInstance.current.setOption(option);
    }
  }, [data, title]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: height,
        marginBottom: '0'
      }}
    />
  );
};

export default RoseChart;

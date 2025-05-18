import { useState, useEffect, useRef } from 'react';
import { Card, Spin, Button, Select } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import {
  getInspectionStatistics,
  InspectStatisticsVo,
} from '../../../../api/order-service/InspectController';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer,
]);

interface InspectionChartProps {
  data: InspectStatisticsVo[];
  height?: number;
}

// 获取状态对应的颜色
const getStatusColor = (status: number) => {
  switch (status) {
    case 0: // 未质检
      return '#5470c6';
    case 1: // 通过
      return '#91cc75';
    case 2: // 不通过
      return '#ee6666';
    case 3: // 部分异常
      return '#fac858';
    default:
      return '#909399';
  }
};

// 所有可能的质检状态及其描述
const allStatuses = [
  { status: 0, statusVo: '未质检' },
  { status: 1, statusVo: '通过' },
  { status: 2, statusVo: '不通过' },
  { status: 3, statusVo: '部分异常' },
];

// 确保显示所有可能的质检状态
const getAllPossibleStatuses = (data: InspectStatisticsVo[]) => {
  // 创建一个Map存储现有数据中的状态
  const existingStatuses = new Map();
  data.forEach((item) => {
    existingStatuses.set(item.status, item);
  });

  // 构建完整的数据集，包括缺失的状态（数量为0）
  const completeData = allStatuses.map((status) => {
    if (existingStatuses.has(status.status)) {
      return existingStatuses.get(status.status);
    } else {
      return {
        status: status.status,
        statusVo: status.statusVo,
        count: 0,
      };
    }
  });

  return completeData;
};

// 质检统计图表组件
const InspectionChart: React.FC<InspectionChartProps> = ({
  data,
  height = 400,
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
      // 确保所有可能的状态都在图表中显示
      const completeData = getAllPossibleStatuses(data);

      // 数据排序：按状态顺序排序
      const sortedData = [...completeData].sort((a, b) => a.status - b.status);

      // 准备图表数据
      const statusNames = sortedData.map(
        (item) =>
          allStatuses.find((s) => s.status === item.status)?.statusVo ||
          '未知状态'
      );
      const counts = sortedData.map((item) => item.count);

      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: function (params: any) {
            const dataIndex = params[0].dataIndex;
            const item = sortedData[dataIndex];
            return `${
              allStatuses.find((s) => s.status === item.status)?.statusVo ||
              '未知状态'
            }<br/>
                    质检单数：${item.count}`;
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '8%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: statusNames,
          axisLabel: {
            interval: 0,
            rotate: 0,
            fontSize: 12,
          },
        },
        yAxis: {
          type: 'value',
          name: '质检单数',
          nameTextStyle: {
            fontSize: 12,
          },
          axisLabel: {
            fontSize: 12,
          },
        },
        series: [
          {
            name: '质检单数',
            type: 'bar',
            data: counts,
            itemStyle: {
              color: function (params: any) {
                // 使用对应状态的颜色
                const status = sortedData[params.dataIndex].status;
                return getStatusColor(status);
              },
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 12,
            },
          },
        ],
      };

      // 设置图表选项
      chartInstance.current.setOption(option);
    }
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: `${height}px`,
      }}
    />
  );
};

const { Option } = Select;

const InspectionStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [inspectionData, setInspectionData] = useState<InspectStatisticsVo[]>(
    []
  );
  // 默认显示入库类型
  const [type, setType] = useState<string>('all');
  // 默认显示最近一周的数据
  const [range, setRange] = useState<string>('1week');

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getInspectionStatistics(range, type);

      if (result?.code === 200 && result.data) {
        setInspectionData(result.data);
      } else {
        console.error('获取质检统计数据失败:', result?.msg || '未知错误');
        setInspectionData([]);
      }
    } catch (error) {
      console.error('获取质检统计数据失败:', error);
      setInspectionData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type, range]);

  // 处理时间范围变化
  const handleRangeChange = (value: string) => {
    setRange(value);
  };

  // 处理类型变化
  const handleTypeChange = (value: string) => {
    setType(value);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchData();
  };

  const renderExtra = () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Select
        value={type}
        onChange={handleTypeChange}
        style={{ width: 80, marginRight: 8 }}
        size='small'
      >
        <Option value='out'>出库</Option>
        <Option value='in'>入库</Option>
        <Option value='all'>全部</Option>
      </Select>
      <Select
        value={range}
        onChange={handleRangeChange}
        style={{ width: 100, marginRight: 8 }}
        size='small'
      >
        <Option value='1day'>最近一天</Option>
        <Option value='1week'>最近一周</Option>
        <Option value='1month'>最近一月</Option>
        <Option value='3months'>最近三月</Option>
        <Option value='6months'>最近半年</Option>
      </Select>
      <Button
        icon={<ReloadOutlined />}
        onClick={handleRefresh}
        loading={loading}
        size='small'
      >
        刷新
      </Button>
    </div>
  );

  // 获取当前卡片标题
  const getCardTitle = () => {
    return `${
      type === 'out' ? '出库' : type === 'in' ? '入库' : '全部'
    }质检状态统计`;
  };

  if (loading && inspectionData.length === 0) {
    return (
      <Card
        title={getCardTitle()}
        size='small'
        style={{ marginBottom: '12px' }}
        extra={renderExtra()}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size='small' tip='正在加载数据...' />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={getCardTitle()}
      size='small'
      style={{ marginBottom: '12px' }}
      extra={renderExtra()}
    >
      {inspectionData.length > 0 ? (
        <InspectionChart data={inspectionData} height={400} />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          暂无质检数据
        </div>
      )}
    </Card>
  );
};

export default InspectionStats;

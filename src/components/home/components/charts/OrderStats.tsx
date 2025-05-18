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
  getOrderStatistics, 
  OrderStatisticsVo 
} from '../../../../api/order-service/OrderController';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer,
]);

interface OrderChartProps {
  data: OrderStatisticsVo[];
  height?: number;
}

// 获取状态对应的颜色
const getStatusColor = (status: number) => {
  switch (status) {
    case 0: // 待审核
      return '#5470c6';
    case 1: // 审批通过
      return '#91cc75';
    case 2: // 入库中/出库中
      return '#fac858';
    case 3: // 已完成
      return '#73c0de';
    case -1: // 已取消
      return '#ee6666';
    case -2: // 审批拒绝
      return '#9a60b4';
    default:
      return '#909399';
  }
};

// 确保显示所有可能的订单状态
const getAllPossibleStatuses = (data: OrderStatisticsVo[]) => {
  // 所有可能的订单状态及其描述
  const allStatuses = [
    { status: -2, statusVo: '审批拒绝' },
    { status: -1, statusVo: '已取消' },
    { status: 0, statusVo: '待审核' },
    { status: 1, statusVo: '审批通过' },
    { status: 2, statusVo: '入库中/出库中' },
    { status: 3, statusVo: '已完成' },
  ];
  
  // 创建一个Map存储现有数据中的状态
  const existingStatuses = new Map();
  data.forEach(item => {
    existingStatuses.set(item.status, item);
  });
  
  // 构建完整的数据集，包括缺失的状态（数量为0）
  const completeData = allStatuses.map(status => {
    if (existingStatuses.has(status.status)) {
      return existingStatuses.get(status.status);
    } else {
      return {
        status: status.status,
        statusVo: status.statusVo,
        count: 0,
        totalAmount: 0,
        totalQuantity: 0
      };
    }
  });
  
  return completeData;
};

// 订单统计图表组件
const OrderChart: React.FC<OrderChartProps> = ({ data, height = 400 }) => {
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
      
      // 数据排序：按状态顺序排序（已完成、进行中、待处理、已取消）
      const sortedData = [...completeData].sort((a, b) => {
        // 特殊排序逻辑：让正数状态在前，负数状态在后
        if (a.status >= 0 && b.status < 0) return -1;
        if (a.status < 0 && b.status >= 0) return 1;
        return a.status - b.status;
      });
      
      // 准备图表数据
      const statusNames = sortedData.map(item => item.statusVo);
      const counts = sortedData.map(item => item.count);
      
      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params: any) {
            const dataIndex = params[0].dataIndex;
            const item = sortedData[dataIndex];
            return `${item.statusVo}<br/>
                    订单数：${item.count}<br/>
                    订单总金额：${item.totalAmount}<br/>
                    商品总数量：${item.totalQuantity}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: statusNames,
          axisLabel: {
            interval: 0,
            rotate: 0, // 修改为水平显示
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          name: '订单数',
          nameTextStyle: {
            fontSize: 12
          },
          axisLabel: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '订单数',
            type: 'bar',
            data: counts,
            itemStyle: {
              color: function(params: any) {
                // 使用对应状态的颜色
                const status = sortedData[params.dataIndex].status;
                return getStatusColor(status);
              }
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 12
            }
          }
        ]
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

const OrderStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [orderData, setOrderData] = useState<OrderStatisticsVo[]>([]);
  // 默认显示入库类型(1)
  const [type, setType] = useState<number>(1);
  // 默认显示最近一周的数据
  const [range, setRange] = useState<string>('1week');

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getOrderStatistics(type, range);
      
      if (result?.code === 200 && result.data) {
        setOrderData(result.data);
      } else {
        console.error('获取订单统计数据失败:', result?.msg || '未知错误');
        setOrderData([]);
      }
    } catch (error) {
      console.error('获取订单统计数据失败:', error);
      setOrderData([]);
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
  const handleTypeChange = (value: number) => {
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
        size="small"
      >
        <Option value={0}>出库</Option>
        <Option value={1}>入库</Option>
      </Select>
      <Select
        value={range}
        onChange={handleRangeChange}
        style={{ width: 100, marginRight: 8 }}
        size="small"
      >
        <Option value="1day">最近一天</Option>
        <Option value="1week">最近一周</Option>
        <Option value="1month">最近一月</Option>
        <Option value="3months">最近三月</Option>
        <Option value="6months">最近半年</Option>
      </Select>
      <Button 
        icon={<ReloadOutlined />} 
        onClick={handleRefresh}
        loading={loading}
        size="small"
      >
        刷新
      </Button>
    </div>
  );

  // 获取当前卡片标题
  const getCardTitle = () => {
    return `${type === 0 ? '出库' : '入库'}订单状态统计`;
  };

  if (loading && orderData.length === 0) {
    return (
      <Card 
        title={getCardTitle()} 
        size="small"
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
      size="small"
      style={{ marginBottom: '12px' }}
      extra={renderExtra()}
    >
      {orderData.length > 0 ? (
        <OrderChart data={orderData} height={400} />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          暂无订单数据
        </div>
      )}
    </Card>
  );
};

export default OrderStats; 
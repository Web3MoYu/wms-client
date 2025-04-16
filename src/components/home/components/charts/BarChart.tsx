import { Row, Col, Card, Tabs } from 'antd';
import { useRef, useEffect } from 'react';
import * as echarts from 'echarts/core';
import { BarChart as EChartsBarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  ToolboxComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { CountVo } from '../../../../api/count/CountService';

// 注册必要的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  ToolboxComponent,
  EChartsBarChart,
  CanvasRenderer
]);

interface StockData {
  name: string; // 产品名称
  batchCount: CountVo[]; // 批次数据
}

interface BarChartProps {
  data: StockData[];
  height?: string | number;
  title?: string;
}

// 单个产品的图表组件
const ProductChart = ({ product, height }: { product: StockData, height: number }) => {
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
    if (chartInstance.current && product?.batchCount?.length) {
      // 准备图表数据
      const sortedBatches = [...product.batchCount].sort((a, b) => b.count - a.count);
      
      // 提取批次名和数量
      const batchNames = sortedBatches.map(batch => batch.name);
      const batchCounts = sortedBatches.map(batch => batch.count);

      // 设置图表选项
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
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
          data: batchNames,
          axisLabel: {
            interval: 0,
            rotate: 30,
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          name: '数量',
          nameTextStyle: {
            fontSize: 10
          },
          axisLabel: {
            fontSize: 10
          }
        },
        series: [
          {
            name: '批次数量',
            type: 'bar',
            data: batchCounts,
            itemStyle: {
              color: '#1890ff'
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 10
            }
          }
        ]
      };

      // 设置图表选项
      chartInstance.current.setOption(option);
    }
  }, [product]);

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

// 将产品分组，每4个一组
const groupProducts = (products: StockData[], groupSize = 4) => {
  const groups = [];
  for (let i = 0; i < products.length; i += groupSize) {
    groups.push(products.slice(i, i + groupSize));
  }
  return groups;
};

const BarChart: React.FC<BarChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return <div>暂无数据</div>;
  }

  // 过滤掉没有批次数据的产品
  const validProducts = data.filter(product => product.batchCount && product.batchCount.length > 0);
  
  // 如果产品数量少于等于8个，使用普通布局
  if (validProducts.length <= 8) {
    return (
      <Row gutter={[8, 8]}>
        {validProducts.map((product, index) => (
          <Col key={index} xs={24} sm={12} md={8} lg={6}>
            <Card 
              size="small"
              title={<div style={{ fontSize: '14px' }}>{product.name}</div>}
              bordered={true}
              style={{ marginBottom: '8px' }}
            >
              <ProductChart product={product} height={150} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
  
  // 如果产品数量多于8个，使用标签页布局
  const productGroups = groupProducts(validProducts);
  
  return (
    <Tabs
      defaultActiveKey="0"
      type="card"
      size="small"
      items={productGroups.map((group, groupIndex) => ({
        label: `组 ${groupIndex + 1}`,
        key: `${groupIndex}`,
        children: (
          <Row gutter={[8, 8]}>
            {group.map((product, index) => (
              <Col key={index} xs={24} sm={12} lg={6}>
                <Card 
                  size="small"
                  title={<div style={{ fontSize: '14px' }}>{product.name}</div>}
                  bordered={true}
                  style={{ marginBottom: '8px' }}
                >
                  <ProductChart product={product} height={150} />
                </Card>
              </Col>
            ))}
          </Row>
        )
      }))}
    />
  );
};

export default BarChart; 
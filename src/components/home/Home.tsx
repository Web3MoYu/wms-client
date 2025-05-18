import { Row, Col, Typography } from 'antd';
import BasicStats from './components/BasicStats';
import CategoryStats from './components/charts/CategoryStats';
import StockStats from './components/charts/StockStats';
import OrderStats from './components/charts/OrderStats';
import PickingStats from './components/charts/PickingStats';

const { Title } = Typography;

export default function Home() {
  return (
    <div className='home-container' style={{ padding: '12px 8px' }}>
      <Title level={4} style={{ marginBottom: '12px' }}>
        系统概览
      </Title>

      {/* 基础数据统计 - 占据整行 */}
      <BasicStats />

      {/* 图表区域 */}
      <Row gutter={[12, 12]}>
        {/* 左侧列 - 产品分类统计 */}
        <Col xs={24} lg={12}>
          <CategoryStats />
        </Col>

        {/* 右侧列 - 产品库存批次统计 */}
        <Col xs={24} lg={12}>
          <StockStats />
        </Col>
      </Row>
      {/* 订单统计 - 占据整行 */}
      <OrderStats />
      
      {/* 拣货统计 - 占据整行 */}
      <PickingStats />
    </div>
  );
}

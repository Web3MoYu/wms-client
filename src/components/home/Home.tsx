import { Row, Col, Typography } from 'antd';
import BasicStats from './components/BasicStats';
import CategoryStats from './components/charts/CategoryStats';
import StockStats from './components/charts/StockStats';

const { Title } = Typography;

export default function Home() {
  return (
    <div className='home-container' style={{ padding: '16px 12px' }}>
      <Title level={3} style={{ marginBottom: '16px', fontSize: '20px' }}>
        系统概览
      </Title>

      <Row gutter={[16, 16]}>
        {/* 左侧列 - 基础数据统计和产品分类统计 */}
        <Col xs={24} lg={12}>
          {/* 基础数据统计 */}
          <BasicStats />
          
          {/* 间隔 */}
          <div style={{ marginBottom: '16px' }} />
          
          {/* 产品分类统计 */}
          <CategoryStats />
        </Col>
        
        {/* 右侧列 - 产品库存批次统计 */}
        <Col xs={24} lg={12}>
          {/* 产品库存批次统计 */}
          <StockStats />
        </Col>
      </Row>
    </div>
  );
}

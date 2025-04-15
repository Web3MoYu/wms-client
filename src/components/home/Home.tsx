import { Typography } from 'antd';
import BasicStats from './components/BasicStats';
import CategoryStats from './components/charts/CategoryStats';

const { Title } = Typography;

export default function Home() {
  return (
    <div className='home-container' style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        系统概览
      </Title>

      {/* 基础数据统计 */}
      <BasicStats />

      {/* 产品分类统计 */}
      <CategoryStats />
    </div>
  );
}

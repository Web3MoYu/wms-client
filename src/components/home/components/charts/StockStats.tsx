import { useState, useEffect } from 'react';
import { Card, Spin, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { countStock } from '../../../../api/count/CountService';
import BarChart from './BarChart';

const StockStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stockData, setStockData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const stockResult = await countStock();
      
      // 库存统计
      if (stockResult?.code === 200 && stockResult.data) {
        setStockData(stockResult.data);
      }
    } catch (error) {
      console.error('获取库存统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <Card 
        title='产品库存批次统计' 
        style={{ marginBottom: '32px' }}
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh} 
            loading={loading}
            disabled={loading}
          >
            刷新
          </Button>
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size='small' tip='正在加载数据...' />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title='产品库存批次统计' 
      style={{ marginBottom: '32px' }}
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
        >
          刷新
        </Button>
      }
    >
      {stockData.length > 0 ? (
        <BarChart data={stockData} height={400} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          暂无库存数据
        </div>
      )}
    </Card>
  );
};

export default StockStats; 
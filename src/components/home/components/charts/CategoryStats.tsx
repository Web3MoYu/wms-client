import { useState, useEffect } from 'react';
import { Card, Spin, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { countCat, ProductCatCountVo } from '../../../../api/count/CountService';
import RoseChart from './RoseChart';

const CategoryStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryData, setCategoryData] = useState<ProductCatCountVo[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const catResult = await countCat();
      
      // 产品分类统计
      if (catResult?.code === 200 && catResult.data) {
        setCategoryData(catResult.data);
      }
    } catch (error) {
      console.error('获取分类统计数据失败:', error);
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
        title='产品分类统计' 
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
      title='产品分类统计' 
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
      {categoryData.length > 0 ? (
        <RoseChart data={categoryData} height={400} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          暂无分类数据
        </div>
      )}
    </Card>
  );
};

export default CategoryStats; 
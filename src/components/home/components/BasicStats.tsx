import { Card, Row, Col, Statistic, Spin, Progress, Tooltip } from 'antd';
import {
  UserOutlined,
  InboxOutlined,
  AppstoreOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  countUser,
  countProduct,
  countStockCat,
  getOrderCount,
  countStorage,
  StorageCountVo
} from '../../../api/count/CountService';

const BasicStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [userCount, setUserCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [stockCatCount, setStockCatCount] = useState<number>(0);
  const [inOrderCount, setInOrderCount] = useState<number>(0);
  const [outOrderCount, setOutOrderCount] = useState<number>(0);
  const [storageData, setStorageData] = useState<StorageCountVo>({
    totalCount: 0,
    freeCount: 0,
    occupiedCount: 0,
    disabledCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行请求数据
        const [userResult, productResult, stockCatResult, orderCountResult, storageResult] = await Promise.all([
          countUser(),
          countProduct(),
          countStockCat(),
          getOrderCount(),
          countStorage()
        ]);

        // 用户数量
        if (userResult?.code === 200 && userResult.data !== undefined) {
          setUserCount(userResult.data);
        }

        // 产品数量
        if (productResult?.code === 200 && productResult.data !== undefined) {
          setProductCount(productResult.data);
        }

        // 库存种类数
        if (stockCatResult?.code === 200 && stockCatResult.data !== undefined) {
          setStockCatCount(stockCatResult.data);
        }

        // 订单数量统计 [入库订单数量, 出库订单数量]
        if (orderCountResult?.code === 200 && orderCountResult.data) {
          if (orderCountResult.data.length >= 2) {
            setInOrderCount(orderCountResult.data[0] || 0);
            setOutOrderCount(orderCountResult.data[1] || 0);
          }
        }

        // 库位统计信息
        if (storageResult?.code === 200 && storageResult.data) {
          setStorageData(storageResult.data);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Row gutter={[12, 12]} style={{ marginBottom: '12px' }}>
        <Col span={24} style={{ textAlign: 'center', padding: '12px 0' }}>
          <Spin size='small' tip='正在加载数据...' />
        </Col>
      </Row>
    );
  }

  // 计算库位使用率
  const usageRate = storageData.totalCount > 0 
    ? Math.round((storageData.occupiedCount / storageData.totalCount) * 100) 
    : 0;

  // 确定使用率进度条的颜色
  const getProgressColor = (rate: number) => {
    if (rate >= 90) return '#f5222d'; // 红色
    if (rate >= 70) return '#fa8c16'; // 橙色
    return '#52c41a'; // 绿色
  };

  // 统一的卡片样式
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  };

  return (
    <Row gutter={[12, 12]} style={{ marginBottom: '12px' }}>
      {/* 第一行：常规统计 */}
      <Col span={24}>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} md={4}>
            <Card size='small' bordered={true} bodyStyle={{ padding: '12px 8px', height: '100px' }} style={cardStyle}>
              <Statistic
                title={<div style={{ fontSize: '13px' }}>用户数量</div>}
                value={userCount}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4}>
            <Card size='small' bordered={true} bodyStyle={{ padding: '12px 8px', height: '100px' }} style={cardStyle}>
              <Statistic
                title={<div style={{ fontSize: '13px' }}>产品数量</div>}
                value={productCount}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4}>
            <Card size='small' bordered={true} bodyStyle={{ padding: '12px 8px', height: '100px' }} style={cardStyle}>
              <Statistic
                title={<div style={{ fontSize: '13px' }}>库存种类</div>}
                value={stockCatCount}
                valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4}>
            <Card size='small' bordered={true} bodyStyle={{ padding: '12px 8px', height: '100px' }} style={cardStyle}>
              <Statistic
                title={<div style={{ fontSize: '13px' }}>入库订单</div>}
                value={inOrderCount}
                valueStyle={{ color: '#722ed1', fontSize: '24px' }}
                prefix={<ImportOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4}>
            <Card size='small' bordered={true} bodyStyle={{ padding: '12px 8px', height: '100px' }} style={cardStyle}>
              <Statistic
                title={<div style={{ fontSize: '13px' }}>出库订单</div>}
                value={outOrderCount}
                valueStyle={{ color: '#eb2f96', fontSize: '24px' }}
                prefix={<ExportOutlined />}
              />
            </Card>
          </Col>
          
          {/* 库位统计 */}
          <Col xs={12} sm={12} md={4}>
            <Card
              size='small'
              bordered={true}
              bodyStyle={{ padding: '8px', height: '100px' }}
              style={cardStyle}
              title={
                <div style={{ fontSize: '13px', textAlign: 'center', margin: 0, padding: 0, height: '22px', lineHeight: '22px' }}>
                  <DatabaseOutlined style={{ marginRight: '4px' }} />
                  库位统计
                </div>
              }
              headStyle={{ padding: '4px 0', minHeight: '22px' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <span>空闲:<b style={{ color: '#52c41a' }}>{storageData.freeCount}</b></span>
                    <span>占用:<b style={{ color: '#fa8c16' }}>{storageData.occupiedCount}</b></span>
                    <span>禁用:<b style={{ color: '#f5222d' }}>{storageData.disabledCount}</b></span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '12px' }}>
                  <span>总库位:</span>
                  <span style={{ fontWeight: 'bold' }}>{storageData.totalCount}</span>
                </div>
                <Tooltip title={`使用率: ${usageRate}%`}>
                  <Progress 
                    percent={usageRate} 
                    size="small" 
                    status={usageRate >= 90 ? 'exception' : 'normal'}
                    strokeColor={getProgressColor(usageRate)}
                    style={{ marginBottom: 0, marginTop: '4px' }}
                  />
                </Tooltip>
              </div>
            </Card>
          </Col>
        </Row>
      </Col>
    </Row>
  );
};

export default BasicStats;

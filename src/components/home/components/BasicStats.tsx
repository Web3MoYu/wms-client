import { Card, Row, Col, Statistic, Spin } from 'antd';
import {
  UserOutlined,
  InboxOutlined,
  AppstoreOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  countUser,
  countProduct,
  countStockCat,
  getOrderCount
} from '../../../api/count/CountService';

const BasicStats: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [userCount, setUserCount] = useState<number>(0);
  const [productCount, setProductCount] = useState<number>(0);
  const [stockCatCount, setStockCatCount] = useState<number>(0);
  const [inOrderCount, setInOrderCount] = useState<number>(0);
  const [outOrderCount, setOutOrderCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 并行请求数据
        const [userResult, productResult, stockCatResult, orderCountResult] = await Promise.all([
          countUser(),
          countProduct(),
          countStockCat(),
          getOrderCount()
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
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col span={24} style={{ textAlign: 'center', padding: '12px 0' }}>
          <Spin size='small' tip='正在加载数据...' />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <Card size='small' bordered={true}>
          <Statistic
            title='用户数量'
            value={userCount}
            prefix={<UserOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <Card size='small' bordered={true}>
          <Statistic
            title='产品数量'
            value={productCount}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <Card size='small' bordered={true}>
          <Statistic
            title='库存种类数'
            value={stockCatCount}
            prefix={<InboxOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <Card size='small' bordered={true}>
          <Statistic
            title='入库订单数'
            value={inOrderCount}
            prefix={<ImportOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={8} xl={4}>
        <Card size='small' bordered={true}>
          <Statistic
            title='出库订单数'
            value={outOrderCount}
            prefix={<ExportOutlined />}
            valueStyle={{ color: '#eb2f96' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default BasicStats;

import React, { useState } from 'react';
import { Drawer, Descriptions, Typography, Card, List, Space, Tag, Button } from 'antd';
import { StockVo } from '../../../api/stock-service/StockController';
import StockQuantityEdit from './StockQuantityEdit';

const { Item } = Descriptions;
const { Text, Title } = Typography;

interface StockDetailProps {
  visible: boolean;
  onClose: () => void;
  stock: StockVo | null;
  onRefresh?: () => void; // 添加刷新回调
}

const StockDetail: React.FC<StockDetailProps> = ({ visible, onClose, stock, onRefresh }) => {
  // 添加编辑数量的状态
  const [quantityEditVisible, setQuantityEditVisible] = useState(false);

  // 渲染预警状态标签
  const renderAlertStatusTag = (status: number) => {
    if (status === 0) {
      return <Tag color="green">正常</Tag>;
    } else if (status === 1) {
      return <Tag color="orange">低于最小库存</Tag>;
    } else if (status === 2) {
      return <Tag color="red">超过最大库存</Tag>;
    }
    return <Tag color="default">未知</Tag>;
  };

  // 编辑数量成功后刷新
  const handleEditSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // 如果没有库存数据，不渲染内容
  if (!stock) {
    return (
      <Drawer
        title="库存详情"
        width={700}
        onClose={onClose}
        open={visible}
      >
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text type="secondary">暂无库存数据</Text>
        </div>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        title="库存详情"
        width={700}
        onClose={onClose}
        open={visible}
        extra={
          <Button type="primary" onClick={() => setQuantityEditVisible(true)}>
            编辑数量
          </Button>
        }
      >
        <Title level={5} style={{ marginBottom: 16 }}>基本信息</Title>
        <Descriptions bordered column={2}>
          <Item label="商品名称">{stock.productName}</Item>
          <Item label="商品编码">{stock.productCode}</Item>
          <Item label="批次号">{stock.batchNumber}</Item>
          <Item label="生产日期">{stock.productionDate}</Item>
          <Item label="数量">{stock.quantity}</Item>
          <Item label="可用数量">{stock.availableQuantity}</Item>
          <Item label="预警状态">{renderAlertStatusTag(stock.alertStatus)}</Item>
          <Item label="区域">{stock.areaName}</Item>
          <Item label="创建时间">{stock.createTime}</Item>
          <Item label="更新时间">{stock.updateTime}</Item>
        </Descriptions>

        <Title level={5} style={{ marginBottom: 16, marginTop: 24 }}>存放位置</Title>
        
        {stock.locationVo && stock.locationVo.length > 0 ? (
          <List
            grid={{ gutter: 16, column: 1 }}
            dataSource={stock.locationVo}
            renderItem={(item, index) => (
              <List.Item>
                <Card 
                  title={`位置${index + 1}: ${item.shelfName}`} 
                  size="small"
                  style={{ marginBottom: 8 }}
                >
                  <div style={{ padding: '8px 0' }}>
                    <Space direction="vertical">
                      <Text strong>库位:</Text>
                      <div style={{ paddingLeft: 16 }}>
                        {item.storageNames.map((name, i) => (
                          <Tag key={i} color="blue" style={{ margin: '0 8px 8px 0' }}>
                            {name}
                          </Tag>
                        ))}
                      </div>
                    </Space>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">暂无位置信息</Text>
          </div>
        )}
      </Drawer>

      {/* 编辑数量的模态框 */}
      <StockQuantityEdit
        visible={quantityEditVisible}
        onClose={() => setQuantityEditVisible(false)}
        onSuccess={handleEditSuccess}
        stock={stock}
      />
    </>
  );
};

export default StockDetail; 
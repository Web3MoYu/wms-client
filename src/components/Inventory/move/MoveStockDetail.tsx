import React from 'react';
import { Drawer, Descriptions, Typography, Card, List, Space, Tag } from 'antd';
import { StockVo } from '../../../api/stock-service/StockController';
import { renderAlertStatus } from '../components/StockStatusComponents';

const { Item } = Descriptions;
const { Text, Title } = Typography;

interface StockDetailProps {
  visible: boolean;
  onClose: () => void;
  stock: StockVo | null;
  onRefresh?: () => void; 
}

const MoveStockDetail: React.FC<StockDetailProps> = ({ visible, onClose, stock }) => {
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
    <Drawer
      title="库存详情"
      width={900}
      onClose={onClose}
      open={visible}
    >
      <Title level={5} style={{ marginBottom: 16 }}>基本信息</Title>
      <Descriptions bordered column={2}>
        <Item label="商品名称">{stock.productName}</Item>
        <Item label="商品编码">{stock.productCode}</Item>
        <Item label="批次号">{stock.batchNumber}</Item>
        <Item label="生产日期">{stock.productionDate}</Item>
        <Item label="数量">{stock.quantity}</Item>
        <Item label="可用数量">{stock.availableQuantity}</Item>
        <Item label="预警状态">{renderAlertStatus(stock.alertStatus)}</Item>
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
  );
};

export default MoveStockDetail; 
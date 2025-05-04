import React from 'react';
import { Drawer, Typography, Descriptions, Tag, Card, Space, Divider, Row, Col } from 'antd';
import { renderMoveStatus } from '../components/MoveStatusComponents';
import { MovementVo } from '../../../api/stock-service/MoveController';

const { Title, Text } = Typography;

interface MoveDetailProps {
  visible: boolean;
  onClose: () => void;
  movement: MovementVo;
}

const MoveDetail: React.FC<MoveDetailProps> = ({ visible, onClose, movement }) => {
  // 渲染库位位置
  const renderLocations = (locations: any[]) => {
    if (!locations || locations.length === 0) {
      return <Text type="secondary">无位置信息</Text>;
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {locations.map((loc, idx) => (
          <Card 
            key={idx} 
            size="small" 
            title={`位置 ${idx + 1}: ${loc.shelfName}`}
            style={{ marginBottom: 8 }}
          >
            <div style={{ paddingLeft: 8 }}>
              {loc.storageNames.map((name: string, i: number) => (
                <Tag key={i} color="blue" style={{ margin: '0 4px 4px 0' }}>
                  {name}
                </Tag>
              ))}
            </div>
          </Card>
        ))}
      </Space>
    );
  };

  if (!movement) return null;

  return (
    <Drawer
      title="库存移动详情"
      placement="right"
      width={1200}
      onClose={onClose}
      open={visible}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>基本信息</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="变动编号" span={2}>{movement.movementNo}</Descriptions.Item>
          <Descriptions.Item label="商品名称">{movement.stock?.productName || '-'}</Descriptions.Item>
          <Descriptions.Item label="批次号">{movement.stock?.batchNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="状态">{renderMoveStatus(movement.status)}</Descriptions.Item>
          <Descriptions.Item label="操作人">{movement.operatorUser?.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="审批人">{movement.approverUser?.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="操作时间">{movement.movementTime || '-'}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      <Title level={4} style={{ marginBottom: 16 }}>位置变更信息</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="变更前" bordered={false} style={{ background: '#f5f5f5' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="区域" span={1}>
                {movement.beforeArea?.areaName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="位置" span={1}>
                {renderLocations(movement.beforeLocationVo || [])}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="变更后" bordered={false} style={{ background: '#f5f5f5' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="区域" span={1}>
                {movement.afterArea?.areaName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="位置" span={1}>
                {renderLocations(movement.afterLocationVo || [])}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {movement.remark && (
        <>
          <Divider />
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ marginBottom: 8 }}>备注</Title>
            <Card>
              <Text>{movement.remark}</Text>
            </Card>
          </div>
        </>
      )}
    </Drawer>
  );
};

export default MoveDetail; 
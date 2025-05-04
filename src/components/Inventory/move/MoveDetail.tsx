import React from 'react';
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  Card,
  Space,
  Row,
  Col,
} from 'antd';
import { renderMoveStatus } from '../components/MoveStatusComponents';
import { MovementVo } from '../../../api/stock-service/MoveController';

const { Title, Text } = Typography;

interface MoveDetailProps {
  visible: boolean;
  onClose: () => void;
  movement: MovementVo;
}

const MoveDetail: React.FC<MoveDetailProps> = ({
  visible,
  onClose,
  movement,
}) => {
  // 渲染库位位置
  const renderLocations = (locations: any[]) => {
    if (!locations || locations.length === 0) {
      return (
        <Text type='secondary' italic>
          无位置信息
        </Text>
      );
    }

    return (
      <Space direction='vertical' style={{ width: '100%' }}>
        {locations.map((loc, idx) => (
          <Card
            key={idx}
            size='small'
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Tag color='cyan' style={{ marginRight: 8, fontSize: '12px' }}>
                  位置 {idx + 1}
                </Tag>
                <Text strong>{loc.shelfName}</Text>
              </div>
            }
            style={{
              marginBottom: 8,
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
            headStyle={{
              backgroundColor: '#f0f5ff',
              borderBottom: '1px solid #d6e4ff',
            }}
          >
            <div style={{ padding: '4px 8px' }}>
              {loc.storageNames.map((name: string, i: number) => (
                <Tag
                  key={i}
                  color='blue'
                  style={{
                    margin: '0 4px 4px 0',
                    borderRadius: '4px',
                    padding: '2px 8px',
                  }}
                >
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
      title={
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          库存移动详情
          <Text
            type='secondary'
            style={{
              fontSize: '14px',
              marginLeft: '12px',
              fontWeight: 'normal',
            }}
          >
            {movement.movementNo}
          </Text>
        </div>
      }
      placement='right'
      width={1200}
      onClose={onClose}
      open={visible}
      bodyStyle={{ padding: '24px', backgroundColor: '#f8f9fa' }}
    >
      <div
        style={{
          marginBottom: 32,
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Title
          level={4}
          style={{
            marginBottom: 20,
            fontSize: '16px',
            borderLeft: '4px solid #1890ff',
            paddingLeft: '12px',
          }}
        >
          基本信息
        </Title>
        <Descriptions
          bordered
          column={2}
          labelStyle={{ backgroundColor: '#fafafa', width: '120px' }}
          contentStyle={{ backgroundColor: '#fff' }}
        >
          <Descriptions.Item label='商品名称' span={1}>
            <Text strong>{movement.stock?.productName || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label='批次号' span={1}>
            {movement.stock?.batchNumber || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='状态' span={1}>
            {renderMoveStatus(movement.status)}
          </Descriptions.Item>
          <Descriptions.Item label='操作时间' span={1}>
            {movement.movementTime || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='操作人' span={1}>
            {movement.operatorUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='审批人' span={1}>
            {movement.approverUser?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='备注' span={2}>
            {movement.remark || '-'}
          </Descriptions.Item>
          {movement.status === -1 && (
            <Descriptions.Item label='拒绝原因' span={2}>
              {movement.reason || '-'}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <div
        style={{
          marginBottom: 32,
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Title
          level={4}
          style={{
            marginBottom: 20,
            fontSize: '16px',
            borderLeft: '4px solid #1890ff',
            paddingLeft: '12px',
          }}
        >
          位置变更信息
        </Title>
        <Row gutter={24}>
          <Col span={12}>
            <Card
              title={
                <Text strong style={{ fontSize: '15px', color: '#666' }}>
                  变更前
                </Text>
              }
              bordered
              style={{ borderRadius: '8px', height: '100%' }}
              headStyle={{ backgroundColor: '#f5f7fa' }}
            >
              <Descriptions
                column={1}
                bordered
                size='small'
                labelStyle={{ width: '80px', backgroundColor: '#fafafa' }}
              >
                <Descriptions.Item label='区域' span={1}>
                  <Text strong>{movement.beforeArea?.areaName || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label='位置' span={1}>
                  {renderLocations(movement.beforeLocationVo || [])}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={
                <Text strong style={{ fontSize: '15px', color: '#666' }}>
                  变更后
                </Text>
              }
              bordered
              style={{ borderRadius: '8px', height: '100%' }}
              headStyle={{ backgroundColor: '#f5f7fa' }}
            >
              <Descriptions
                column={1}
                bordered
                size='small'
                labelStyle={{ width: '80px', backgroundColor: '#fafafa' }}
              >
                <Descriptions.Item label='区域' span={1}>
                  <Text strong>{movement.afterArea?.areaName || '-'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label='位置' span={1}>
                  {renderLocations(movement.afterLocationVo || [])}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>

      {movement.remark && (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Title
            level={4}
            style={{
              marginBottom: 16,
              fontSize: '16px',
              borderLeft: '4px solid #1890ff',
              paddingLeft: '12px',
            }}
          >
            备注
          </Title>
          <Card
            style={{
              borderRadius: '8px',
              backgroundColor: '#fafafa',
              border: '1px dashed #d9d9d9',
            }}
          >
            <Text>{movement.remark}</Text>
          </Card>
        </div>
      )}
    </Drawer>
  );
};

export default MoveDetail;

import React, { useState } from 'react';
import {
  Drawer,
  Table,
  Typography,
  Space,
  Tag,
  InputNumber,
  Form,
  Button,
  message,
} from 'antd';
import { PickingItemVo } from '../../../../../api/order-service/PickingController';
import { renderPickingStatus } from '../../../components/StatusComponents';

const { Title } = Typography;

interface PickingOperationDrawerProps {
  visible: boolean;
  onClose: () => void;
  orderNo: string;
  pickingItems: PickingItemVo[];
  isAllNotPicked: boolean; // 是否所有商品都未拣货
}

const PickingOperationDrawer: React.FC<PickingOperationDrawerProps> = ({
  visible,
  onClose,
  orderNo,
  pickingItems,
  isAllNotPicked,
}) => {
  const [form] = Form.useForm();
  const [editingItems, setEditingItems] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 处理拣货数量变更
  const handleQuantityChange = (value: number | null, record: PickingItemVo) => {
    setEditingItems({
      ...editingItems,
      [record.id]: {
        ...editingItems[record.id],
        actualQuantity: value,
      },
    });
  };

  // 提交拣货数据
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 这里实际项目中需要调用API保存拣货数据
      // const result = await savePickingData(orderNo, editingItems);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('拣货数据已保存');
      onClose();
    } catch (error) {
      console.error('保存拣货数据失败:', error);
      message.error('保存拣货数据失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Typography.Text
          ellipsis={{ tooltip: text }}
          style={{ width: 200, display: 'block' }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '商品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 120,
      render: (text: string) => <Tag color="blue">{text || '-'}</Tag>,
    },
    {
      title: '货位',
      dataIndex: 'locationName',
      key: 'locationName',
      width: 180,
      render: (locationName: any[]) => (
        <Space size={[0, 4]} wrap>
          {locationName?.map((loc, idx) => (
            <Tag key={idx} color="cyan" style={{ marginBottom: 4 }}>
              {`${loc.shelfName}: ${loc.storageNames.join(', ')}`}
            </Tag>
          ))}
          {(!locationName || locationName.length === 0) && '-'}
        </Space>
      ),
    },
    {
      title: '预期数量',
      dataIndex: 'expectedQuantity',
      key: 'expectedQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 120,
      render: (text: number, record: PickingItemVo) => (
        <InputNumber
          min={0}
          max={record.expectedQuantity * 2}
          defaultValue={text || 0}
          onChange={(value) => handleQuantityChange(value, record)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => renderPickingStatus(status),
    },
  ];

  return (
    <Drawer
      title={
        <Title level={4} style={{ margin: 0 }}>
          {isAllNotPicked ? '开始拣货' : '继续拣货'} - 订单 {orderNo}
        </Title>
      }
      placement="right"
      width="80%"
      onClose={onClose}
      open={visible}
      closable={true}
      destroyOnClose={true}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Table
          dataSource={pickingItems}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
        />
      </Form>
    </Drawer>
  );
};

export default PickingOperationDrawer; 
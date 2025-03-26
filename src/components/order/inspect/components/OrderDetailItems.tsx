import React from 'react';
import { Table, Card } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
  OrderDetailVo,
  OrderInItem,
  OrderOutItem,
} from '../../../../api/order-service/OrderController';
import { LocationVo } from '../../../../api/stock-service/StockController';

interface OrderDetailItemsProps {
  data: OrderDetailVo<OrderInItem | OrderOutItem>[];
  inspectionType?: number;
  onSelectProduct: (
    productId: string,
    areaId: string,
    locations: LocationVo[]
  ) => void;
}

const OrderDetailItems: React.FC<OrderDetailItemsProps> = ({
  data,
  inspectionType,
  onSelectProduct,
}) => {
  if (!data || data.length === 0) {
    return (
      <div>
        <FileTextOutlined />
        <span>暂无订单详情数据</span>
      </div>
    );
  }

  // 入库订单列
  const inColumns = [
    {
      title: '商品名称',
      dataIndex: ['product', 'productName'],
      key: 'productName',
      render: (text: string, record: OrderDetailVo<OrderInItem>) => (
        <a
          onClick={() =>
            onSelectProduct(
              record.product.id,
              record.orderItems.areaId,
              record.locationName || []
            )
          }
        >
          {text}
        </a>
      ),
    },
    {
      title: '商品编码',
      dataIndex: ['product', 'productCode'],
      key: 'productCode',
    },
    {
      title: '预期数量',
      dataIndex: ['orderItems', 'expectedQuantity'],
      key: 'expectedQuantity',
    },
    {
      title: '单价',
      dataIndex: ['orderItems', 'price'],
      key: 'price',
      render: (price: number) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '金额',
      dataIndex: ['orderItems', 'amount'],
      key: 'amount',
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '批次号',
      dataIndex: ['orderItems', 'batchNumber'],
      key: 'batchNumber',
    },
    {
      title: '生产日期',
      dataIndex: ['orderItems', 'productionDate'],
      key: 'productionDate',
      render: (date: Date) => (date ? moment(date).format('YYYY-MM-DD') : '-'),
    },
  ];

  // 出库订单列（与入库订单列基本相同，可以根据需要调整）
  const outColumns = [...inColumns];

  return (
    <Card title='订单详情' bordered={false}>
      <Table
        dataSource={data}
        columns={inspectionType === 1 ? inColumns : outColumns}
        rowKey={(record) => record.orderItems.id}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default OrderDetailItems;

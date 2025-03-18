import { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Tag,
  Card,
  Divider,
  Spin,
  message,
  Tabs,
  Badge,
} from 'antd';
import moment from 'moment';
import { inDetail, outDetail, OrderVo, OrderInItem, OrderOutItem, OrderDetailVo } from '../../api/order-service/OrderController';

interface OrderDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  order: OrderVo;
}

export default function OrderDetailDrawer({
  visible,
  onClose,
  order,
}: OrderDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<OrderDetailVo<OrderInItem | OrderOutItem>[]>([]);

  // 获取订单详情
  const fetchOrderDetail = async () => {
    if (!order?.id) return;

    try {
      setLoading(true);
      let result;
      if (order.type === 1) {
        // 入库订单
        result = await inDetail(order.id);
        if (result.code === 200) {
          setDetailData(result.data);
        }
      } else {
        // 出库订单
        result = await outDetail(order.id);
        if (result.code === 200) {
          setDetailData(result.data);
        }
      }

      if (result.code !== 200) {
        message.error(result.msg || '获取订单详情失败');
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 监听visible变化，当抽屉打开时获取详情
  useEffect(() => {
    if (visible) {
      fetchOrderDetail();
    }
  }, [visible, order]);

  // 订单状态渲染
  const renderOrderStatus = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color='blue'>待审核</Tag>;
      case 1:
        return <Tag color='green'>已审核</Tag>;
      case 2:
        return <Tag color='orange'>入库中</Tag>;
      case 3:
        return <Tag color='green'>已完成</Tag>;
      case -1:
        return <Tag color='red'>已取消</Tag>;
      default:
        return <Tag color='default'>未知状态</Tag>;
    }
  };

  // 质检状态渲染
  const renderQualityStatus = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color='default'>未质检</Tag>;
      case 1:
        return <Tag color='green'>质检通过</Tag>;
      case 2:
        return <Tag color='red'>质检不通过</Tag>;
      default:
        return <Tag color='default'>未知状态</Tag>;
    }
  };

  // 订单类型渲染
  const renderOrderType = (type: number) => {
    return type === 1 ? (
      <Tag color='blue'>入库订单</Tag>
    ) : (
      <Tag color='orange'>出库订单</Tag>
    );
  };

  // 渲染基本信息选项卡内容
  const renderBasicInfo = () => {
    return (
      <Card title='基本信息' size='small'>
        <Descriptions column={3} bordered>
          <Descriptions.Item label='订单编号' span={1}>{order?.orderNo}</Descriptions.Item>
          <Descriptions.Item label='订单类型' span={1}>
            {renderOrderType(order?.type)}
          </Descriptions.Item>
          <Descriptions.Item label='创建时间' span={1}>
            {order?.createTime
              ? moment(order.createTime).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='创建人' span={1}>
            {order?.creator?.realName}
          </Descriptions.Item>
          <Descriptions.Item label='创建人手机号' span={2}>
            {order?.creator?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='审批人' span={1}>
            {order?.approver?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='审批人手机号' span={2}>
            {order?.approver?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='质检员' span={1}>
            {order?.inspector?.realName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='质检员手机号' span={2}>
            {order?.inspector?.phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='订单状态' span={1}>
            {renderOrderStatus(order?.status)}
          </Descriptions.Item>
          <Descriptions.Item label='质检状态' span={1}>
            {renderQualityStatus(order?.qualityStatus)}
          </Descriptions.Item>
          <Descriptions.Item label='总金额' span={1}>
            ¥{order?.totalAmount?.toFixed(2) || '0.00'}
          </Descriptions.Item>
          <Descriptions.Item label='备注' span={3}>
            {order?.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 渲染商品明细选项卡内容
  const renderProductDetails = () => {
    return (
      <>
        {detailData.map((detail, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <Card 
              title={`商品 ${index + 1}: ${detail.product.productName}`}
              size='small' 
              bordered
              style={{ marginBottom: 8 }}
              type="inner"
            >
              <Descriptions column={4} bordered size="small">
                <Descriptions.Item label='商品名称' span={2}>
                  {detail.product.productName}
                </Descriptions.Item>
                <Descriptions.Item label='商品编码' span={2}>
                  {detail.product.productCode}
                </Descriptions.Item>
                <Descriptions.Item label='品牌' span={1}>
                  {detail.product.brand}
                </Descriptions.Item>
                <Descriptions.Item label='型号' span={1}>
                  {detail.product.model}
                </Descriptions.Item>
                <Descriptions.Item label='规格' span={1}>
                  {detail.product.spec}
                </Descriptions.Item>
                <Descriptions.Item label='单价' span={1}>
                  ¥{detail.product.price}
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '12px 0' }} />

              <Descriptions column={4} bordered size="small">
                <Descriptions.Item label='预期数量' span={1}>
                  {detail.orderItems.expectedQuantity}
                </Descriptions.Item>
                <Descriptions.Item label='实际数量' span={1}>
                  {detail.orderItems.actualQuantity}
                </Descriptions.Item>
                <Descriptions.Item label='单价' span={1}>
                  ¥{detail.orderItems.price?.toFixed(2) || '0.00'}
                </Descriptions.Item>
                <Descriptions.Item label='金额' span={1}>
                  ¥{detail.orderItems.amount?.toFixed(2) || '0.00'}
                </Descriptions.Item>
                <Descriptions.Item label='库区' span={2}>
                  {detail.orderItems.areaId || '-'}
                </Descriptions.Item>
                <Descriptions.Item label='货位' span={2}>
                  {detail.orderItems.location?.join(', ') || '-'}
                </Descriptions.Item>
                <Descriptions.Item label='批次号' span={2}>
                  {detail.orderItems.batchNumber || '-'}
                </Descriptions.Item>
                <Descriptions.Item label='生产日期' span={2}>
                  {detail.orderItems.productionDate ? moment(detail.orderItems.productionDate).format('YYYY-MM-DD') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        ))}
      </>
    );
  };

  // 定义选项卡项
  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: renderBasicInfo(),
    },
    {
      key: 'products',
      label: (
        <Badge count={detailData.length} offset={[10, 0]}>
          商品明细
        </Badge>
      ),
      children: renderProductDetails(),
    },
  ];

  return (
    <Drawer
      title='订单详情'
      placement='right'
      width={1200}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Tabs 
          defaultActiveKey="basic" 
          items={tabItems}
          style={{ marginBottom: 32 }}
          size="large"
          type="card"
        />
      </Spin>
    </Drawer>
  );
} 
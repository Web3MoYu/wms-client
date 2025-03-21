import { useEffect, useState } from 'react';
import {
  Drawer,
  Descriptions,
  Card,
  Divider,
  Spin,
  message,
  Tabs,
  Badge,
  Button,
  Space,
  Tag,
} from 'antd';
import moment from 'moment';
import { inDetail, outDetail, OrderVo, OrderInItem, OrderOutItem, OrderDetailVo } from '../../../api/order-service/OrderController';
import { renderOrderStatus, renderQualityStatus, renderOrderType } from '../components/StatusComponents';

interface OrderDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  order: OrderVo;
  showApprovalButton?: boolean;
  onApproval?: (order: OrderVo) => void;
}

export default function OrderDetailDrawer({
  visible,
  onClose,
  order,
  showApprovalButton = false,
  onApproval,
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
            {renderQualityStatus(order?.qualityStatus, true)}
          </Descriptions.Item>
          <Descriptions.Item label='总金额' span={1}>
            ¥{order?.totalAmount?.toFixed(2) || '0.00'}
          </Descriptions.Item>
          <Descriptions.Item label='备注' span={3}>
            {order?.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
        
        {showApprovalButton && order?.status === 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button type="primary" onClick={() => onApproval && onApproval(order)} size="large">
              审批
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // 渲染商品明细选项卡内容
  const renderProductDetails = () => {
    return (
      <>
        {detailData.map((detail, index) => {
          // 检查状态值并确保是数字类型
          const itemStatus = Number(detail.orderItems.status);
            
          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <Card 
                title={
                  <span>
                    {`商品 ${index + 1}: ${detail.product.productName} `}
                    <span style={{ marginLeft: 8 }}>
                      {renderOrderStatus(itemStatus)}
                    </span>
                    <span style={{ marginLeft: 8 }}>
                      {renderQualityStatus(detail.orderItems.qualityStatus, false)}
                    </span>
                  </span>
                }
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
                    <Tag color="blue">{detail.areaName || '-'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label='货位' span={2}>
                    <Space size={[0, 4]} wrap>
                      {detail.locationName?.map((loc, idx) => (
                        <Tag 
                          key={idx} 
                          color="cyan"
                          style={{ marginBottom: 4 }}
                        >
                          {`${loc.shelfName}: ${loc.storageNames.join(', ')}`}
                        </Tag>
                      ))}
                      {(!detail.locationName || detail.locationName.length === 0) && '-'}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label='批次号' span={2}>
                    {detail.orderItems.batchNumber || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label='生产日期' span={2}>
                    {detail.orderItems.productionDate ? moment(detail.orderItems.productionDate).format('YYYY-MM-DD') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label='质检状态' span={2}>
                    {renderQualityStatus(detail.orderItems.qualityStatus, false)}
                  </Descriptions.Item>
                  <Descriptions.Item label='备注' span={2}>
                    {detail.orderItems.remark || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </div>
          );
        })}
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
      extra={
        showApprovalButton && order?.status === 0 ? (
          <Button 
            type="primary" 
            onClick={() => onApproval && onApproval(order)}
          >
            审批
          </Button>
        ) : null
      }
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
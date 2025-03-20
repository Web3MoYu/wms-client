import { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  message,
  Form,
  Radio,
  Card,
  Descriptions,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { OrderVo } from '../../../api/order-service/OrderController';
import {
  approve,
  reject,
  approveInbound,
} from '../../../api/order-service/ApprovalController';
import OrderRejectForm from './OrderRejectForm';
import InboundApproveForm from './InboundApproveForm';
import OutboundApproveForm from './OutboundApproveForm';

interface OrderApprovalDrawerProps {
  visible: boolean;
  order: OrderVo | null;
  onClose: () => void;
  onSuccess: (orderNo?: string) => void;
  onReject?: () => void;
}

export default function OrderApprovalDrawer({
  visible,
  order,
  onClose,
  onSuccess,
  onReject,
}: OrderApprovalDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [approvalType, setApprovalType] = useState<'approve' | 'reject'>(
    'approve'
  );

  // 处理审批结果
  const handleApproval = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (approvalType === 'approve') {
        let result;
        // 根据订单类型处理审批
        if (order?.type === 1) {
          // 入库订单
          const approvalItems = values.approvalItems || [];
          // 调用入库订单批准API
          result = await approveInbound(approvalItems, order.id);
        } else {
          // 出库订单
          // 暂时使用旧的approve接口
          result = await approve(order?.id as string);
        }

        if (result.code === 200) {
          message.success('订单审批通过');
          // 先关闭抽屉
          onClose();
          // 然后调用成功回调，并传递当前订单编号，以便父组件更新查询条件
          onSuccess(order?.orderNo);
        } else {
          message.error(result.msg || '审批失败');
        }
      } else {
        if (!values.rejectReason?.trim()) {
          message.error('请输入拒绝理由');
          setLoading(false);
          return;
        }
        // 调用拒绝API - 状态将变为-2（审批拒绝）
        const result = await reject(
          order?.id as string,
          order?.type as number,
          values.rejectReason
        );
        if (result.code === 200) {
          message.success('已拒绝该订单');
          // 如果存在拒绝回调，则调用拒绝回调，不再调用成功回调
          if (onReject) {
            onReject();
          } else {
            // 否则调用成功回调并关闭当前抽屉
            onClose();
            onSuccess();
          }
        } else {
          message.error(result.msg || '拒绝失败');
        }
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('审批失败:', error);
      message.error('操作失败，请稍后重试');
    }
  };

  // 当抽屉关闭时重置表单
  const handleClose = () => {
    form.resetFields();
    setApprovalType('approve');
    onClose();
  };

  // 确保每次渲染都使用最新的order数据
  const renderForm = () => {
    if (!order) return null;

    if (approvalType === 'reject') {
      return <OrderRejectForm form={form} order={order} />;
    } else {
      // 根据订单类型显示不同的审批表单
      return order.type === 1 ? (
        <InboundApproveForm
          form={form}
          order={order}
          key={`inbound-${order.id}`}
        />
      ) : (
        <OutboundApproveForm
          form={form}
          order={order}
          key={`outbound-${order.id}`}
        />
      );
    }
  };

  return (
    <Drawer
      title='订单审批'
      width={1000}
      open={visible}
      onClose={handleClose}
      destroyOnClose={true}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type='primary'
              loading={loading}
              onClick={handleApproval}
              icon={
                approvalType === 'approve' ? (
                  <CheckCircleOutlined />
                ) : (
                  <CloseCircleOutlined />
                )
              }
              danger={approvalType === 'reject'}
            >
              {approvalType === 'approve' ? '确认通过' : '确认拒绝'}
            </Button>
          </Space>
        </div>
      }
    >
      {order && (
        <div>
          <Card title='订单基本信息' bordered={false}>
            <Descriptions column={1}>
              <Descriptions.Item label='订单编号'>
                {order.orderNo}
              </Descriptions.Item>
              <Descriptions.Item label='订单类型'>
                {order.type === 1 ? '入库订单' : '出库订单'}
              </Descriptions.Item>
              <Descriptions.Item label='创建人'>
                {order.creator?.realName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label='创建时间'>
                {order.createTime || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title='审批决定' bordered={false} style={{ marginTop: 16 }}>
            <Form form={form} layout='vertical'>
              <Form.Item name='approvalType' initialValue='approve'>
                <Radio.Group
                  onChange={(e) => setApprovalType(e.target.value)}
                  value={approvalType}
                >
                  <Radio value='approve'>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 通过
                  </Radio>
                  <Radio value='reject'>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 拒绝
                  </Radio>
                </Radio.Group>
              </Form.Item>

              {renderForm()}
            </Form>
          </Card>
        </div>
      )}
    </Drawer>
  );
}

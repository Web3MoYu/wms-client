import { useState } from 'react';
import {
  Drawer,
  Button,
  Space,
  message,
  Form,
  Radio,
  Input,
  Typography,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { OrderVo } from '../../../api/order-service/OrderController';
import { approve, reject } from '../../../api/order-service/ApprovalController';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface OrderApprovalDrawerProps {
  visible: boolean;
  order: OrderVo | null;
  onClose: () => void;
  onSuccess: () => void;
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
        // 调用审批通过API
        const result = await approve(order?.id as string);
        if (result.code === 200) {
          message.success('订单审批通过');
          // 先调用成功回调刷新列表数据
          onSuccess();
          // 然后关闭抽屉
          onClose();
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
        const result = await reject(order?.id as string, order?.type as number, values.rejectReason);
        if (result.code === 200) {
          message.success('已拒绝该订单');
          // 如果存在拒绝回调，则调用拒绝回调，不再调用成功回调
          if (onReject) {
            onReject();
          } else {
            // 否则调用成功回调并关闭当前抽屉
            onSuccess();
            onClose();
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

  return (
    <Drawer
      title='订单审批'
      width={500}
      open={visible}
      onClose={handleClose}
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
          <Title level={4}>订单信息</Title>
          <div style={{ marginBottom: 16 }}>
            <Text strong>订单编号：</Text> {order.orderNo}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>订单类型：</Text>{' '}
            {order.type === 1 ? '入库订单' : '出库订单'}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>创建人：</Text> {order.creator?.realName || '-'}
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>创建时间：</Text> {order.createTime || '-'}
          </div>

          <Title level={4} style={{ marginTop: 24 }}>
            审批决定
          </Title>

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

            {approvalType === 'reject' && (
              <Form.Item
                name='rejectReason'
                label='拒绝理由'
                rules={[{ required: true, message: '请输入拒绝理由' }]}
              >
                <TextArea rows={4} placeholder='请输入拒绝理由' />
              </Form.Item>
            )}
          </Form>
        </div>
      )}
    </Drawer>
  );
}

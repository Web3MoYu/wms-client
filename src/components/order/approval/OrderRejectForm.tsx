import React from 'react';
import { Form, Input } from 'antd';
import { OrderVo } from '../../../api/order-service/OrderController';

const { TextArea } = Input;

interface OrderRejectFormProps {
  form: any;
  order: OrderVo;
}

// 拒绝订单组件
const OrderRejectForm: React.FC<OrderRejectFormProps> = ({ form, order }) => {
  // form和order参数当前作为占位符，在后续开发中将会使用到
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unused = { form, order };

  return (
    <Form.Item
      name='rejectReason'
      label='拒绝理由'
      rules={[{ required: true, message: '请输入拒绝理由' }]}
    >
      <TextArea rows={4} placeholder='请输入拒绝理由' />
    </Form.Item>
  );
};

export default OrderRejectForm; 
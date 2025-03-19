import React from 'react';
import { Card, Typography } from 'antd';
import { OrderVo } from '../../../api/order-service/OrderController';

const { Text } = Typography;

interface OutboundApproveFormProps {
  form: any;
  order: OrderVo;
}

// 出库订单同意组件
const OutboundApproveForm: React.FC<OutboundApproveFormProps> = ({ form, order }) => {
  // form和order参数当前作为占位符，在后续开发中将会使用到
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const unused = { form, order };

  return (
    <Card title="出库订单审批表单" bordered={false} style={{ marginTop: 16 }}>
      <Text type="secondary">此处为出库订单审批的特定内容占位，后续会根据业务需求添加出库订单专属的审批字段。</Text>
    </Card>
  );
};

export default OutboundApproveForm; 
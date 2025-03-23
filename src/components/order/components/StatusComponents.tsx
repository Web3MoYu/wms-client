import { Tag, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';

const { Option } = Select;

// 订单状态渲染
export const renderOrderStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color='blue'>待审核</Tag>;
    case 1:
      return <Tag color='green'>审批通过</Tag>;
    case 2:
      return <Tag color='orange'>入库中</Tag>;
    case 3:
      return <Tag color='green'>已完成</Tag>;
    case -1:
      return <Tag color='red'>已取消</Tag>;
    case -2:
      return <Tag color='red'>审批拒绝</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

// 质检状态渲染
export const renderQualityStatus = (
  status: number,
  isOrderLevel: boolean = true
) => {
  switch (status) {
    case 0:
      return <Tag color='default'>未质检</Tag>;
    case 1:
      return <Tag color='green'>质检通过</Tag>;
    case 2:
      return <Tag color='red'>质检不通过</Tag>;
    case 3:
      return <Tag color='orange'>{isOrderLevel ? '部分异常' : '质检异常'}</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

// 订单类型渲染
export const renderOrderType = (type: number) => {
  return type === 1 ? (
    <Tag color='blue'>入库订单</Tag>
  ) : (
    <Tag color='orange'>出库订单</Tag>
  );
};

// 订单状态选择器组件
export const OrderStatusSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择订单状态' allowClear>
      <Option value={0}>待审核</Option>
      <Option value={1}>审批通过</Option>
      <Option value={2}>入库中</Option>
      <Option value={3}>已完成</Option>
      <Option value={-1}>已取消</Option>
      <Option value={-2}>审批拒绝</Option>
    </Select>
  );
};

// 质检状态选择器组件
export const QualityStatusSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择质检状态' allowClear>
      <Option value={0}>未质检</Option>
      <Option value={1}>质检通过</Option>
      <Option value={2}>质检不通过</Option>
      <Option value={3}>部分异常</Option>
    </Select>
  );
};

// 订单类型选择器组件
export const OrderTypeSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择订单类型' allowClear>
      <Option value={1}>入库订单</Option>
      <Option value={0}>出库订单</Option>
    </Select>
  );
};

// 质检类型选择器组件
export const InspectionTypeSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择质检类型' allowClear>
      <Option value={1}>入库质检</Option>
      <Option value={2}>出库质检</Option>
      <Option value={3}>库存质检</Option>
    </Select>
  );
};

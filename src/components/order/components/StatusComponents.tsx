import { Tag, Select } from 'antd';
import { SelectProps } from 'antd/lib/select';

const { Option } = Select;

// 订单状态渲染
export const renderOrderStatus = (status: number, type: number) => {
  switch (status) {
    case 0:
      return <Tag color='blue'>待审核</Tag>;
    case 1:
      return <Tag color='green'>审批通过</Tag>;
    case 2:
      return <Tag color='orange'>{type === 1 ? '入库中' : '出库中'}</Tag>;
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
  status: number | null,
  isOrderLevel: boolean = true
) => {
  switch (status) {
    case 0:
      return <Tag color='default'>未质检</Tag>;
    case 1:
      return <Tag color='green'>通过</Tag>;
    case 2:
      return <Tag color='red'>不通过</Tag>;
    case 3:
      return <Tag color='orange'>{isOrderLevel ? '部分异常' : '质检异常'}</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

// 渲染商品质检状态（基于审核结果）
export const renderItemInspectionResult = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color='default'>-</Tag>;
    case 1:
      return <Tag color='green'>合格</Tag>;
    case 2:
      return <Tag color='red'>不合格</Tag>;
  }
};

export const renderReceiveStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color='warning'>未上架</Tag>;
    case 1:
      return <Tag color='green'>已完成</Tag>;
    case 2:
      return <Tag color='processing'>进行中</Tag>;
    default:
      return <Tag color='default'>未知</Tag>;
  }
};

// 拣货状态渲染
export const renderPickingStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color='default'>待拣货</Tag>;
    case 1:
      return <Tag color='processing'>拣货中</Tag>;
    case 2:
      return <Tag color='success'>已完成</Tag>;
    case 3:
      return <Tag color='error'>异常</Tag>;
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
      <Option value={2}>入库中/出库中</Option>
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
      <Option value={1}>通过</Option>
      <Option value={2}>不通过</Option>
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

// 收货状态选择器组件
export const ReceiveStatusSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择收货状态' allowClear>
      <Option value={0}>未上架</Option>
      <Option value={1}>已完成</Option>
      <Option value={2}>进行中</Option>
    </Select>
  );
};

// 拣货状态选择器组件
export const PickingStatusSelect: React.FC<Omit<SelectProps, 'options'>> = (
  props
) => {
  return (
    <Select {...props} placeholder='请选择拣货状态' allowClear>
      <Option value={0}>待拣货</Option>
      <Option value={1}>拣货中</Option>
      <Option value={2}>已完成</Option>
    </Select>
  );
};

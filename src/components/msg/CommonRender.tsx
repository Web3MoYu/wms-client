import { Tag, Select } from 'antd';
import React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Msg } from '../../api/msg-service/MsgController';

const { Option } = Select;

// 消息优先级样式
export const getPriorityStyle = (priority: number) => {
  switch (priority) {
    case 2:
      return { color: '#ff4d4f' }; // 紧急
    case 1:
      return { color: '#faad14' }; // 重要
    default:
      return { color: '#52c41a' }; // 普通
  }
};

// 消息优先级文本
export const getPriorityText = (priority: number) => {
  switch (priority) {
    case 2:
      return '紧急';
    case 1:
      return '重要';
    default:
      return '普通';
  }
};

// 消息优先级标签
export const renderPriority = (priority: number) => {
  switch (priority) {
    case 2:
      return <Tag color='red'>紧急</Tag>;
    case 1:
      return <Tag color='orange'>重要</Tag>;
    default:
      return <Tag color='green'>普通</Tag>;
  }
};

// 业务类型文本
export const getBizTypeText = (bizType: number) => {
  switch (bizType) {
    case 1:
      return '入库单';
    case 2:
      return '出库单';
    case 3:
      return '质检单';
    case 4:
      return '库位变更';
    case 5:
      return '库存预警';
    case 6:
      return '库存盘点';
    default:
      return '未知类型';
  }
};

// 业务类型标签
export const renderBizType = (type: number) => {
  switch (type) {
    case 1:
      return <Tag color='purple'>入库单</Tag>;
    case 2:
      return <Tag color='geekblue'>出库单</Tag>;
    case 3:
      return <Tag color='cyan'>质检单</Tag>;
    case 4:
      return <Tag color='blue'>库位变更</Tag>;
    case 5:
      return <Tag color='orange'>库存预警</Tag>;
    case 6:
      return <Tag color='green'>库存盘点</Tag>;
    default:
      return <Tag color='default'>未知类型</Tag>;
  }
};

// 消息类型标签
export const renderMsgType = (type: number) => {
  switch (type) {
    case 1:
      return <Tag color='orange'>库存预警</Tag>;
    case 2:
      return <Tag color='cyan'>质检通知</Tag>;
    case 3:
      return <Tag color='purple'>订单状态</Tag>;
    case 4:
      return <Tag color='blue'>库位变更</Tag>;
    case 5:
      return <Tag color='green'>库存盘点</Tag>;
    case 6:
      return <Tag color='default'>其他</Tag>;
    default:
      return <Tag color='default'>未知类型</Tag>;
  }
};

// 读取状态标签
export const renderReadStatus = (status: number) => {
  return status === 1 ? (
    <Tag color='green'>已读</Tag>
  ) : (
    <Tag color='red'>未读</Tag>
  );
};

// 优先级选择器
export const PrioritySelect: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = '请选择优先级' }) => (
  <Select
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    allowClear
  >
    <Option value={0}>普通</Option>
    <Option value={1}>重要</Option>
    <Option value={2}>紧急</Option>
  </Select>
);

// 消息类型选择器
export const MsgTypeSelect: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = '请选择消息类型' }) => (
  <Select
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    allowClear
  >
    <Option value={1}>库存预警</Option>
    <Option value={2}>质检通知</Option>
    <Option value={3}>订单状态</Option>
    <Option value={4}>库位变更</Option>
    <Option value={5}>库存盘点</Option>
    <Option value={6}>其他</Option>
  </Select>
);

// 读取状态选择器
export const ReadStatusSelect: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = '请选择读取状态' }) => (
  <Select
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    allowClear
  >
    <Option value={0}>未读</Option>
    <Option value={1}>已读</Option>
  </Select>
);

// 处理消息导航/跳转函数
export const handleMessageNavigation = (
  msg: Msg,
  navigate: NavigateFunction
) => {
  // 如果没有关联的业务ID，则不跳转
  if (!msg.relatedBizId) {
    return false;
  }

  // 根据业务类型跳转到不同页面
  switch (msg.relatedBizType) {
    case 1: // 入库单
      // 跳转到审批页面，设置订单编号为业务ID，订单状态为null
      navigate(`/order/approval?orderNo=${msg.relatedBizId}&status=null`);
      break;
    case 2: // 出库单
      // 跳转到审批页面，设置订单编号为业务ID，订单状态为null
      navigate(`/order/approval?orderNo=${msg.relatedBizId}&status=null`);
      break;
    case 3: // 质检单
      // 跳转到质检页面，设置质检编号为业务ID
      navigate(`/order/inspect?inspectionNo=${msg.relatedBizId}`);
      break;
    case 4: // 库位变更
      // 跳转到库位变更页面，设置库位编号为业务ID
      navigate(`/inventory/move?moveNo=${msg.relatedBizId}`);
      break;
    case 5: // 库存预警
      // 跳转到库存预警页面，设置预警编号为业务ID
      navigate(`/inventory/alert?alertNo=${msg.relatedBizId}`);
      break;
    case 6: // 库存盘点
      // 跳转到库存盘点页面，设置盘点单号为业务ID
      navigate(`/inventory/check?checkNo=${msg.relatedBizId}`);
      break;
    default:
      console.log('未知业务类型：', msg.relatedBizType);
      return false;
  }

  return true; // 返回true表示已处理导航
};

import React from 'react';
import { Tag, Select } from 'antd';

const { Option } = Select;

// 渲染预警类型标签
export const renderAlertType = (type: number) => {
  switch (type) {
    case 0:
      return <Tag color="green">正常</Tag>;
    case 1:
      return <Tag color="red">低于最小库存</Tag>;
    case 2:
      return <Tag color="orange">超过最大库存</Tag>;
    default:
      return <Tag color="default">未知状态</Tag>;
  }
};

// 渲染处理状态标签
export const renderHandleStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="red">未处理</Tag>;
    case 1:
      return <Tag color="green">已处理</Tag>;
    default:
      return <Tag color="default">未知状态</Tag>;
  }
};

// 预警类型下拉框
export const AlertTypeSelect: React.FC<{ value?: number; onChange?: (value: number) => void }> = ({
  value,
  onChange
}) => (
  <Select
    placeholder="请选择预警类型"
    value={value}
    onChange={onChange}
    allowClear
    style={{ width: '100%' }}
  >
    <Option value={1}>低于最小库存</Option>
    <Option value={2}>超过最大库存</Option>
  </Select>
);

// 处理状态下拉框
export const HandleStatusSelect: React.FC<{ value?: number; onChange?: (value: number) => void }> = ({
  value,
  onChange
}) => (
  <Select
    placeholder="请选择处理状态"
    value={value}
    onChange={onChange}
    allowClear
    style={{ width: '100%' }}
  >
    <Option value={0}>未处理</Option>
    <Option value={1}>已处理</Option>
  </Select>
);

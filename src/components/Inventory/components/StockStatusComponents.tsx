import React from 'react';
import { Tag, Select } from 'antd';

const { Option } = Select;

// 渲染预警状态标签
export const renderAlertStatus = (status: number) => {
  if (status === 0) {
    return <Tag color='green'>正常</Tag>;
  } else if (status === 1) {
    return <Tag color='orange'>低于最小库存</Tag>;
  } else if (status === 2) {
    return <Tag color='red'>超过最大库存</Tag>;
  }
  return <Tag color='default'>未知</Tag>;
};

// 预警状态下拉框
export const AlertStatusSelect: React.FC<{ value?: number; onChange?: (value: number) => void }> = ({
  value,
  onChange
}) => (
  <Select 
    placeholder="请选择预警状态"
    value={value}
    onChange={onChange}
    allowClear
  >
    <Option value={null}>全部</Option>
    <Option value={0}>正常</Option>
    <Option value={1}>低于最小库存</Option>
    <Option value={2}>超过最大库存</Option>
  </Select>
);

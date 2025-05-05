import React from 'react';
import { Tag, Select } from 'antd';

const { Option } = Select;

// 渲染盘点状态标签
export const renderCheckStatus = (status: number) => {
  switch (status) {
    case -1:
      return <Tag color='default'>已废弃</Tag>;
    case 0:
      return <Tag color='orange'>待盘点</Tag>;
    case 1:
      return <Tag color='cyan'>待确认</Tag>;
    case 2:
      return <Tag color='green'>已完成</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

// 盘点状态下拉框
export const CheckStatusSelect: React.FC<{
  value?: number;
  onChange?: (value: number) => void;
}> = ({ value, onChange }) => (
  <Select
    placeholder='请选择盘点状态'
    value={value}
    onChange={onChange}
    allowClear
    style={{ width: '100%' }}
  >
    <Option value={-1}>已废弃</Option>
    <Option value={0}>待盘点</Option>
    <Option value={1}>待确认</Option>
    <Option value={2}>已完成</Option>
  </Select>
);

// 渲染盘点项状态标签
export const renderCheckItemStatus = (status: number) => {
  switch (status) {
    case -1:
      return <Tag color='default'>已废弃</Tag>;
    case 0:
      return <Tag color='orange'>待盘点</Tag>;
    case 2:
      return <Tag color='green'>已盘点</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

// 渲染盘点差异状态标签
export const renderDifferenceStatus = (isDifference: number) => {
  switch (isDifference) {
    case 0:
      return <Tag color='green'>无差异</Tag>;
    case 1:
      return <Tag color='red'>有差异</Tag>;
    default:
      return <Tag color='default'>未知状态</Tag>;
  }
};

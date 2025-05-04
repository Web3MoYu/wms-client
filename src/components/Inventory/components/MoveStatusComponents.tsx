import React from 'react';
import { Tag, Select } from 'antd';

const { Option } = Select;

// 渲染移动状态标签
export const renderMoveStatus = (status: number) => {
  switch (status) {
    case 0:
      return <Tag color="orange">待审批</Tag>;
    case 1:
      return <Tag color="green">已完成</Tag>;
    case 2:
      return <Tag color="red">已拒绝</Tag>;
    default:
      return <Tag color="default">未知状态</Tag>;
  }
};

// 移动状态下拉框
export const MoveStatusSelect: React.FC<{ value?: number; onChange?: (value: number) => void }> = ({
  value,
  onChange
}) => (
  <Select
    placeholder="请选择移动状态"
    value={value}
    onChange={onChange}
    allowClear
    style={{ width: '100%' }}
  >
    <Option value={0}>待审批</Option>
    <Option value={1}>已完成</Option>
    <Option value={2}>已拒绝</Option>
  </Select>
); 
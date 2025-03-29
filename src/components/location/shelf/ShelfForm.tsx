import React from 'react';
import { Form, Input, Select, Switch, Alert, Space } from 'antd';
import { Area } from '../../../api/location-service/AreaController';
import { Shelf } from '../../../api/location-service/ShelfController';

const { Option } = Select;

interface ShelfFormProps {
  form: any;
  areaList: Area[];
  editingShelf: Shelf | null;
  validateShelfCode: (rule: any, value: string) => Promise<void>;
  validateShelfName: (rule: any, value: string) => Promise<void>;
}

const ShelfForm: React.FC<ShelfFormProps> = ({
  form,
  areaList,
  editingShelf,
  validateShelfCode,
  validateShelfName,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
    >
      <Alert
        message="所有带 * 的字段均为必填项"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Form.Item
        name="areaId"
        label={<Space><span style={{ color: '#ff4d4f' }}>*</span>所属区域</Space>}
        rules={[{ required: true, message: '请选择所属区域' }]}
      >
        <Select placeholder="请选择区域">
          {areaList.map(area => (
            <Option key={area.id} value={area.id}>{area.areaName}</Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="shelfName"
        label={<Space><span style={{ color: '#ff4d4f' }}>*</span>货架名称</Space>}
        rules={[
          { required: true, message: '请输入货架名称' },
          { validator: validateShelfName }
        ]}
        validateTrigger="blur"
        tooltip="货架名称在同一区域内不能重复"
      >
        <Input placeholder="请输入货架名称" />
      </Form.Item>
      
      <Form.Item
        name="shelfCode"
        label={<Space><span style={{ color: '#ff4d4f' }}>*</span>货架编码</Space>}
        rules={[
          { required: true, message: '请输入货架编码' },
          { validator: validateShelfCode }
        ]}
        validateTrigger="blur"
        tooltip="货架编码在同一区域内不能重复"
      >
        <Input placeholder="请输入货架编码" disabled={!!editingShelf} />
      </Form.Item>
      
      <Form.Item
        name="status"
        label="状态"
        valuePropName="checked"
        initialValue={true}
      >
        <Switch
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      </Form.Item>
    </Form>
  );
};

export default ShelfForm; 
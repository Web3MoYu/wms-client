import React from 'react';
import { Form, Input, Select, Switch } from 'antd';
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
  validateShelfCode,
  validateShelfName,
}) => {
  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="areaId"
        label="所属区域"
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
        label="货架名称"
        rules={[
          { required: true, message: '请输入货架名称' },
          { validator: validateShelfName }
        ]}
      >
        <Input placeholder="请输入货架名称" />
      </Form.Item>
      <Form.Item
        name="shelfCode"
        label="货架编码"
        rules={[
          { required: true, message: '请输入货架编码' },
          { validator: validateShelfCode }
        ]}
      >
        <Input placeholder="请输入货架编码" />
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
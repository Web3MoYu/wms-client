import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';

const { TextArea } = Input;

const RoleForm: React.FC<{
  visible: boolean;
  role: any;
  onCancel: () => void;
  onSave: (role) => void;
}> = ({ visible, role, onCancel, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      form.setFieldsValue(role || { roleName: '', roleType: '', remark: '' });
    }
  }, [visible, role, form]);

  return (
    <Modal
      title={role ? '编辑角色' : '新增角色'}
      visible={visible}
      onOk={() => {
        form.validateFields().then((values) => {
          onSave({ ...role, ...values });
          form.resetFields();
        });
      }}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
    >
      <Form form={form} layout='vertical' initialValues={role}>
        <Form.Item
          name='roleName'
          label='角色名称'
          rules={[{ required: true, message: '请输入角色名称' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name='remark' label='备注'>
          <TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleForm;

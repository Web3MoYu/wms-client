import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';

const { TextArea } = Input;

const RoleForm: React.FC<{
  visible: boolean;
  role: any;
  onCancel: () => void;
  onSave: (role: any) => void;
}> = ({ visible, role, onCancel, onSave }) => {
  const [form] = Form.useForm();

  // 当模态框显示或角色数据变化时，重置表单数据
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
        // 表单验证通过后，合并现有角色数据和表单数据
        form.validateFields().then((values) => {
          onSave({ ...role, ...values });
          form.resetFields();
        });
      }}
      onCancel={() => {
        form.resetFields(); // 取消时重置表单
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

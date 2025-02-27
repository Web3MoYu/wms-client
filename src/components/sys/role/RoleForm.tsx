import React, { useEffect, useCallback } from 'react';
import { Modal, Form, Input, Typography, Divider, Space } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

// 接口定义
interface RoleFormProps {
  visible: boolean;
  role: any;
  onCancel: () => void;
  onSave: (role: any) => void;
}

// 样式常量
const styles = {
  formItem: {
    marginBottom: '20px',
  },
  modal: {
    minWidth: '480px',
  },
  divider: {
    margin: '12px 0',
  },
  input: {
    borderRadius: '4px',
  },
  textarea: {
    borderRadius: '4px',
    minHeight: '100px',
  },
  formContainer: {
    marginTop: '12px',
  }
};

/**
 * 角色表单组件
 * 用于创建和编辑角色信息
 */
const RoleForm: React.FC<RoleFormProps> = ({ visible, role, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const isEditMode = !!role;

  // 当模态框显示或角色数据变化时，重置表单数据
  useEffect(() => {
    if (visible) {
      form.setFieldsValue(role || { roleName: '', roleType: '', remark: '' });
    }
  }, [visible, role, form]);

  // 处理表单提交
  const handleSubmit = useCallback(() => {
    form.validateFields()
      .then((values) => {
        onSave({ ...role, ...values });
        form.resetFields();
      })
      .catch(() => {
        // 表单验证失败时的处理
      });
  }, [form, onSave, role]);

  // 处理取消
  const handleCancel = useCallback(() => {
    form.resetFields(); // 取消时重置表单
    onCancel();
  }, [form, onCancel]);

  return (
    <Modal
      title={<Text strong>{isEditMode ? '编辑角色' : '新增角色'}</Text>}
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      maskClosable={false}
      width={520}
      okText="确认"
      cancelText="取消"
      centered
      style={styles.modal}
    >
      <Divider style={styles.divider} />
      
      <Form 
        form={form} 
        layout='vertical' 
        initialValues={role}
        style={styles.formContainer}
      >
        <Space direction="vertical" style={{width: '100%'}}>
          <Form.Item
            name='roleName'
            label='角色名称'
            style={styles.formItem}
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input 
              prefix={<TeamOutlined />}
              placeholder='请输入角色名称'
              style={styles.input}
            />
          </Form.Item>
          
          <Form.Item 
            name='remark' 
            label='备注' 
            style={styles.formItem}
          >
            <TextArea 
              placeholder='请输入备注信息' 
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={styles.textarea}
            />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default RoleForm;

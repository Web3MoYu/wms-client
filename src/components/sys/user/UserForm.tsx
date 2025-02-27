import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Modal, Select, Switch, message, Typography, Space, Divider } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  ManOutlined
} from '@ant-design/icons';
import {
  User,
  checkUsername,
  checkPhone,
  checkEmail,
} from '../../../api/sys-service/UserController';
import { getRoleList } from '../../../api/sys-service/RoleController';

const { Text } = Typography;

// 常量定义
const GENDER_OPTIONS = [
  { label: '女', value: 0 },
  { label: '男', value: 1 },
];

// 表单样式配置
const styles = {
  formItem: {
    marginBottom: '20px',
  },
  formLabel: {
    fontWeight: 500,
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
  select: {
    width: '100%',
    borderRadius: '4px',
  },
  switch: {
    marginTop: '4px',
  }
};

// 接口定义
interface UserFormProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  initialValues?: User;
  title: string;
  confirmLoading: boolean;
}

interface Role {
  roleId: string;
  roleName: string;
  [key: string]: any;
}

/**
 * 用户表单组件
 * 用于创建和编辑用户信息
 */
const UserForm: React.FC<UserFormProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  title,
  confirmLoading,
}) => {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<Role[]>([]); // 角色列表数据
  const isEditMode = !!initialValues;

  // 当模态框打开时，获取角色列表并设置表单初始值
  useEffect(() => {
    if (open) {
      fetchRoles();
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  // 获取角色列表
  const fetchRoles = useCallback(async () => {
    try {
      const resp: any = await getRoleList();
      if (resp.code === 200) {
        setRoles(resp.data);
      } else {
        message.error({
          content: resp.msg || '获取角色列表失败',
          icon: <TeamOutlined />
        });
      }
    } catch (error: any) {
      console.log('获取角色列表失败', error);
      message.error({
        content: '获取角色列表失败',
        icon: <TeamOutlined />
      });
    }
  }, []);

  // 处理表单提交
  const handleSubmit = useCallback(() => {
    form.validateFields()
      .then((values) => {
        onSubmit(values);
      })
      .catch(() => {
        message.warning('请检查表单填写是否正确');
      });
  }, [form, onSubmit]);

  // 用户名验证器 - 验证唯一性
  const validateUsername = useCallback(async (_: any, value: string) => {
    if (!value || (initialValues && initialValues.username === value)) {
      return Promise.resolve();
    }
    
    try {
      const resp: any = await checkUsername(value);
      if (resp.code !== 200 || resp.data) {
        return Promise.reject(new Error('用户名已存在'));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('验证失败，请重试'));
    }
  }, [initialValues]);

  // 手机号验证器 - 验证唯一性
  const validatePhone = useCallback(async (_: any, value: string) => {
    if (!value || (initialValues && initialValues.phone === value)) {
      return Promise.resolve();
    }
    
    try {
      const resp: any = await checkPhone(value);
      if (resp.code !== 200 || resp.data) {
        return Promise.reject(new Error('手机号已存在'));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('验证失败，请重试'));
    }
  }, [initialValues]);

  // 邮箱验证器 - 验证唯一性
  const validateEmail = useCallback(async (_: any, value: string) => {
    if (!value || (initialValues && initialValues.email === value)) {
      return Promise.resolve();
    }
    
    try {
      const resp: any = await checkEmail(value);
      if (resp.code !== 200 || resp.data) {
        return Promise.reject(new Error('邮箱已存在'));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error('验证失败，请重试'));
    }
  }, [initialValues]);

  return (
    <Modal
      open={open}
      title={<Text strong>{title}</Text>}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={confirmLoading}
      width={520}
      okText="确认"
      cancelText="取消"
      centered
      style={styles.modal}
      maskClosable={false}
    >
      <Divider style={styles.divider} />
      
      <Form form={form} layout='vertical' requiredMark={true}>
        {/* 基本信息 */}
        <Space direction="vertical" style={{width: '100%'}}>
          {/* 用户名输入框，包含唯一性验证 */}
          <Form.Item
            name='username'
            label='用户名'
            style={styles.formItem}
            rules={[
              { required: true, message: '请输入用户名' },
              { validator: validateUsername },
            ]}
          >
            <Input 
              placeholder='请输入用户名'
              disabled={isEditMode}
              prefix={<UserOutlined />}
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name='nickName'
            label='昵称'
            style={styles.formItem}
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input 
              placeholder='请输入昵称'
              prefix={<UserOutlined />}
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name='roleId'
            label='角色'
            style={styles.formItem}
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder='请选择角色'
              options={roles.map((role: Role) => ({
                label: role.roleName,
                value: role.roleId,
              }))}
              style={styles.select}
              suffixIcon={<TeamOutlined />}
            />
          </Form.Item>

          <Form.Item
            name='phone'
            label='手机号'
            style={styles.formItem}
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              { validator: validatePhone },
            ]}
          >
            <Input 
              placeholder='请输入手机号'
              prefix={<PhoneOutlined />}
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name='email'
            label='邮箱'
            style={styles.formItem}
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
              { validator: validateEmail },
            ]}
          >
            <Input 
              placeholder='请输入邮箱'
              prefix={<MailOutlined />}
              style={styles.input}
            />
          </Form.Item>

          <Form.Item
            name='sex'
            label='性别'
            style={styles.formItem}
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select
              placeholder='请选择性别'
              options={GENDER_OPTIONS}
              style={styles.select}
              suffixIcon={<ManOutlined />}
            />
          </Form.Item>

          {isEditMode && (
            <Form.Item
              name='resetPassword'
              label='重置密码'
              valuePropName='checked'
              style={styles.formItem}
            >
              <Switch 
                checkedChildren="是" 
                unCheckedChildren="否"
                style={styles.switch}
              />
            </Form.Item>
          )}
        </Space>
      </Form>
    </Modal>
  );
};

export default UserForm;

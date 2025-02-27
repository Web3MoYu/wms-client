import { Form, Input, Modal, Select, Switch, message } from 'antd';
import { useEffect, useState } from 'react';
import {
  User,
  checkUsername,
  checkPhone,
  checkEmail,
} from '../../../api/sys-service/UserController';
import { getRoleList } from '../../../api/sys-service/RoleController';

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
  const fetchRoles = async () => {
    try {
      const resp: any = await getRoleList();
      if (resp.code === 200) {
        setRoles(resp.data);
      } else {
        message.error(resp.msg);
      }
    } catch (_: any) {
      console.log('获取角色列表失败', _);
      message.error('获取角色列表失败');
    }
  };

  // 处理表单提交
  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      open={open}
      title={title}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={confirmLoading}
    >
      <Form form={form} layout='vertical'>
        {/* 用户名输入框，包含唯一性验证 */}
        <Form.Item
          name='username'
          label='用户名'
          rules={[
            { required: true, message: '请输入用户名' },
            {
              validator: async (_, value) => {
                if (
                  !value ||
                  (initialValues && initialValues.username === value)
                ) {
                  return Promise.resolve();
                }
                const resp: any = await checkUsername(value);
                if (resp.code !== 200 || resp.data) {
                  return Promise.reject(new Error('用户名已存在'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder='请输入用户名' disabled={!!initialValues} />
        </Form.Item>

        <Form.Item
          name='nickName'
          label='昵称'
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input placeholder='请输入昵称' />
        </Form.Item>

        <Form.Item
          name='roleId'
          label='角色'
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select
            placeholder='请选择角色'
            options={roles.map((role: Role) => ({
              label: role.roleName,
              value: role.roleId,
            }))}
          />
        </Form.Item>

        <Form.Item
          name='phone'
          label='手机号'
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            {
              validator: async (_, value) => {
                if (
                  !value ||
                  (initialValues && initialValues.phone === value)
                ) {
                  return Promise.resolve();
                }
                const resp: any = await checkPhone(value);
                if (resp.code !== 200 || resp.data) {
                  return Promise.reject(new Error('手机号已存在'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder='请输入手机号' />
        </Form.Item>

        <Form.Item
          name='email'
          label='邮箱'
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' },
            {
              validator: async (_, value) => {
                if (
                  !value ||
                  (initialValues && initialValues.email === value)
                ) {
                  return Promise.resolve();
                }
                const resp: any = await checkEmail(value);
                if (resp.code !== 200 || resp.data) {
                  return Promise.reject(new Error('邮箱已存在'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input placeholder='请输入邮箱' />
        </Form.Item>

        <Form.Item
          name='sex'
          label='性别'
          rules={[{ required: true, message: '请选择性别' }]}
        >
          <Select
            placeholder='请选择性别'
            options={[
              { label: '女', value: 0 },
              { label: '男', value: 1 },
            ]}
          />
        </Form.Item>

        {initialValues && (
          <Form.Item
            name='resetPassword'
            label='重置密码'
            valuePropName='checked'
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default UserForm;

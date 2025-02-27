import React from 'react';
import { Form, Input, Space, Typography } from 'antd';
import { LockOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';

const { Text } = Typography;

/**
 * 组件属性类型定义
 */
interface ChangePasswordFormProps {
  form: FormInstance;
}

/**
 * 修改密码表单组件
 * @param form 表单实例
 */
const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ form }) => {
  // 表单项样式
  const formItemStyle = { marginBottom: 24 };
  
  return (
    <Form form={form} layout='vertical'>
      <Form.Item
        name='oldPassword'
        label={<Space><LockOutlined /> <Text strong>当前密码</Text></Space>}
        rules={[
          { required: true, message: '请输入当前密码' },
          { min: 8, message: '密码长度至少8位' },
          {
            pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
            message: '需字母开头，包含数字和.号',
          },
        ]}
        style={formItemStyle}
      >
        <Input.Password 
          prefix={<SafetyOutlined />} 
          placeholder='请输入当前密码'
          autoComplete='current-password'
        />
      </Form.Item>

      <Form.Item
        name='newPassword'
        label={<Space><LockOutlined /> <Text strong>新密码</Text></Space>}
        dependencies={['oldPassword']}
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 8, message: '密码长度至少8位' },
          {
            pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
            message: '需字母开头，包含数字和.号',
          },
          ({ getFieldValue }: any) => ({
            validator(_: any, value: any) {
              if (value && getFieldValue('oldPassword') === value) {
                return Promise.reject(new Error('新密码不能与当前密码相同'));
              }
              return Promise.resolve();
            },
          }),
        ]}
        style={formItemStyle}
        tooltip='密码需要字母开头，至少8位，包含数字和.号'
      >
        <Input.Password 
          prefix={<SafetyOutlined />} 
          placeholder='请输入新密码'
          autoComplete='new-password'
        />
      </Form.Item>

      <Form.Item
        name='confirmPassword'
        label={<Space><CheckCircleOutlined /> <Text strong>确认新密码</Text></Space>}
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }: any) => ({
            validator(_: any, value: any) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
        style={formItemStyle}
      >
        <Input.Password
          prefix={<SafetyOutlined />}
          placeholder='请再次输入新密码'
          autoComplete='new-password'
        />
      </Form.Item>
    </Form>
  );
};

export default ChangePasswordForm;

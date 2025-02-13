import { Form, Input } from 'antd';
import { LockOutlined } from '@ant-design/icons';

interface ChangePasswordFormProps {
  form: any;
}

const ChangePasswordForm = ({ form }: ChangePasswordFormProps) => (
  <Form form={form} layout='vertical'>
    <Form.Item
      name='oldPassword'
      label='当前密码'
      rules={[
        { required: true, message: '请输入当前密码' },
        { min: 8, message: '密码长度至少8位' },
        {
          pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
          message: '需字母开头，包含数字和.号',
        },
      ]}
    >
      <Input.Password prefix={<LockOutlined />} placeholder='请输入当前密码' />
    </Form.Item>

    <Form.Item
      name='newPassword'
      label='新密码'
      rules={[
        { required: true, message: '请输入新密码' },
        { min: 8, message: '密码长度至少8位' },
        {
          pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
          message: '需字母开头，包含数字和.号',
        },
      ]}
    >
      <Input.Password prefix={<LockOutlined />} placeholder='请输入新密码' />
    </Form.Item>

    <Form.Item
      name='confirmPassword'
      label='确认新密码'
      dependencies={['newPassword']}
      rules={[
        { required: true, message: '请确认新密码' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue('newPassword') === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('两次输入的密码不一致'));
          },
        }),
      ]}
    >
      <Input.Password
        prefix={<LockOutlined />}
        placeholder='请再次输入新密码'
      />
    </Form.Item>
  </Form>
);

export default ChangePasswordForm;

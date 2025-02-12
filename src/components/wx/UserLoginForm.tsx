import { Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';

interface LoginFormProps {
  onFinish: (values: any) => void; // 表单提交回调函数
  loading?: boolean;             // 加载状态，用于控制提交按钮的loading效果
  extraFields?: React.ReactNode;  // 可扩展的额外表单项
  submitText?: string;            // 自定义提交按钮文字（默认'立即登录'）
}

const UserLoginForm = ({ onFinish, loading, extraFields, submitText = '立即登录' }: LoginFormProps) => {
  return (
    <Form name="loginForm" onFinish={onFinish} layout="vertical" autoComplete="off">
      {/* 用户名输入项 */}
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入手机号或邮箱' },
          // 同时匹配手机号和邮箱的正则验证
          { pattern: /^(1\d{10}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/, 
            message: '格式不正确(请输入11位手机号或有效邮箱)' }
        ]}
      >
        <Input placeholder="手机号/邮箱" prefix={<UserOutlined />} allowClear />
      </Form.Item>

      {/* 密码输入项 */}
      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 8, message: '密码长度至少8位' },
          // 密码格式要求：字母开头，必须包含数字和.号
          { pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
            message: '需字母开头，包含数字和.号' }
        ]}
      >
        <Input.Password placeholder="密码" prefix={<LockOutlined />} />
      </Form.Item>

      {/* 提交按钮 */}
      <Form.Item style={{ marginTop: 32 }}>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={loading}
        >
          {submitText}
        </Button>
      </Form.Item>

      {/* 可扩展区域：用于插入第三方登录方式等额外内容 */}
      {extraFields}
    </Form>
  );
};

export default UserLoginForm; 
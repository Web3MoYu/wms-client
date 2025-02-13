import { Button, Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import userStore from '../../store/userStore';

const ChangePassword = observer(() => {
  const [form] = Form.useForm();
  const user = new userStore();

  const handleSubmit = async (values: any) => {
    try {
      // 这里需要调用修改密码的API
      // await changePassword({
      //   oldPassword: values.oldPassword,
      //   newPassword: values.newPassword
      // });
      message.success('密码修改成功');
      form.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    }
  };

  return (
    <div className='p-4 max-w-md mx-auto'>
      <Form form={form} onFinish={handleSubmit}>
        <Form.Item
          name='oldPassword'
          rules={[{ required: true, message: '请输入旧密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder='旧密码' />
        </Form.Item>

        <Form.Item
          name='newPassword'
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码长度至少8位' },
            {
              pattern: /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/,
              message: '需字母开头，包含数字和.号',
            },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder='新密码' />
        </Form.Item>

        <Form.Item
          name='confirmPassword'
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认密码' },
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
          <Input.Password prefix={<LockOutlined />} placeholder='确认新密码' />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block>
            提交修改
          </Button>
          <Button block style={{ marginTop: 16 }}>
            返回首页
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
});

export default ChangePassword;

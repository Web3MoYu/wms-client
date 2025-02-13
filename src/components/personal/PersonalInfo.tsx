import { useState } from 'react';
import { Avatar, Button, Form, Input, Upload, message } from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import userStore from '../../store/userStore';
import { observer } from 'mobx-react-lite';

// 添加onBack属性

const PersonalInfo = observer(() => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const user = new userStore();

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      // 这里需要调用更新用户信息的API
      // await updateUserInfo({ ...values, avatar: /* 处理上传的图片 */ });
      message.success('信息更新成功');
      setEditing(false);
    } catch (error) {
      message.error('更新失败');
    }
  };

  return (
    <div className='p-4 max-w-2xl mx-auto'>
      <div className='text-center mb-8'>
        <Upload
          disabled={!editing}
          showUploadList={false}
          // 需要实现上传逻辑
        >
          <Avatar
            size={128}
            src={user.user?.avatar}
            icon={<UserOutlined />}
            className='cursor-pointer'
          />
          {editing && (
            <CameraOutlined className='text-2xl absolute bottom-0 right-0 bg-white p-1 rounded-full' />
          )}
        </Upload>
      </div>

      <Form
        form={form}
        initialValues={{
          username: user.user?.username,
          nickName: user.user?.nickName,
          phone: user.user?.phone,
          email: user.user?.email,
          wxBind: user.user?.wxId ? '已绑定' : '未绑定',
        }}
        onFinish={handleSubmit}
      >
        <Form.Item label='用户名' name='username'>
          <Input disabled />
        </Form.Item>

        <Form.Item
          label='昵称'
          name='nickName'
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input disabled={!editing} />
        </Form.Item>

        <Form.Item label='手机号' name='phone'>
          <Input disabled />
        </Form.Item>

        <Form.Item
          label='邮箱'
          name='email'
          rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
        >
          <Input disabled={!editing} />
        </Form.Item>

        <Form.Item label='微信绑定状态' name='wxBind'>
          <Input disabled />
        </Form.Item>

        <div className='text-center'>
          {editing ? (
            <>
              <Button type='primary' htmlType='submit' className='mr-4'>
                保存修改
              </Button>
            </>
          ) : (
            <Button type='primary' onClick={() => setEditing(true)}>
              修改信息
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
});

export default PersonalInfo;

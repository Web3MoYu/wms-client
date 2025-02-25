import { useState } from 'react';
import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Card,
  Typography,
  Descriptions,
  Modal,
  Upload,
  Row,
  Col,
} from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import userStore from '../../store/userStore';
import { observer } from 'mobx-react-lite';
import ChangePasswordForm from './ChangePasswordForm';
import { updatePassword } from '../../api/auth-service/AuthController';
import { useNavigate } from 'react-router-dom';
const { Title } = Typography;

const PersonalInfo = observer(() => {
  const navigate = useNavigate();
  const user = new userStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatar, setAvatar] = useState(user.user.avatar);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  const [uploaded, setUploaded] = useState(0);

  // 处理头像上传
  const handleAvatarChange = async (info: any) => {
    if (info.file.status === 'done') {
      try {
        const avatarUrl = info.file.response.data; // 假设后端返回的是这个格式
        setUploaded(1);
        user.user.avatar = avatarUrl;
        setAvatar(avatarUrl);
        message.success('头像更新成功');
      } catch (error: any) {
        message.error('头像更新失败');
      }
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      user
        .updateUserInfo({ nickName: values.nickName, avatar: avatar }, uploaded)
        .then((data: any) => {
          if (data.code == 200) {
            message.success(data.msg);
            setEditing(false);
            // 强制更新store引用
            user.user = data.data;
            setUploaded(0);
          }
        });
    } catch (error) {
      message.error('修改失败');
    }
  };

  // 处理修改密码
  const handlePasswordChange = async () => {
    try {
      const values = await passwordForm.validateFields();
      // 转换参数名称以匹配接口要求
      const params = {
        oldPass: values.oldPassword,
        newPass: values.newPassword,
      };

      const resp: any = await updatePassword(params);

      if (resp.code === 200) {
        message.success(resp.msg);
        setPasswordModalVisible(false);
        passwordForm.resetFields();
        sessionStorage.clear();
        navigate('/login');
      } else {
        message.error(resp.msg);
      }
    } catch (error: any) {
      // 显示后端返回的具体错误信息
      message.error(error.msg || '密码修改失败');
    }
  };

  return (
    <div>
      <Title level={4} className='mb-6'>
        个人信息
      </Title>

      <Row gutter={[24, 24]} justify='space-between'>
        {/* 信息卡片（左侧） */}
        <Col xs={24} md={16} xl={18}>
          <Card>
            {!editing ? (
              <>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label='用户名'>
                    {user.user?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label='昵称'>
                    {user.user?.nickName}
                  </Descriptions.Item>
                  <Descriptions.Item label='邮箱'>
                    {user.user?.email || '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label='手机号码'>
                    {user.user?.phone || '未设置'}
                  </Descriptions.Item>
                  <Descriptions.Item label='微信'>
                    {user.user?.wxId ? '已绑定' : '未绑定'}
                  </Descriptions.Item>
                </Descriptions>
                <div className='flex justify-center mt-6 space-x-4'>
                  <Button
                    type='primary'
                    onClick={() => setEditing(true)}
                    className='min-w-[120px]'
                  >
                    修改信息
                  </Button>
                  <Button
                    onClick={() => setPasswordModalVisible(true)}
                    className='min-w-[120px]'
                  >
                    修改密码
                  </Button>
                </div>
              </>
            ) : (
              // 编辑模式：使用Form表单
              <Form
                form={form}
                layout='vertical'
                initialValues={{
                  username: user.user?.username,
                  nickName: user.user?.nickName,
                  email: user.user?.email,
                  phone: user.user?.phone,
                }}
                onFinish={handleSubmit}
              >
                <Form.Item label='用户名'>
                  <Input value={user.user?.username} disabled />
                </Form.Item>

                <Form.Item
                  label='昵称'
                  name='nickName'
                  rules={[{ required: true, message: '请输入昵称' }]}
                >
                  <Input placeholder='请输入新的昵称' />
                </Form.Item>

                <Form.Item label='邮箱'>
                  <Input value={user.user?.email || '未设置'} disabled />
                </Form.Item>

                <Form.Item label='手机号码'>
                  <Input value={user.user?.phone || '未设置'} disabled />
                </Form.Item>

                <Form.Item label='微信绑定'>
                  <Input
                    value={user.user?.wxId ? '已绑定' : '未绑定'}
                    disabled
                  />
                </Form.Item>

                <div className='flex justify-center space-x-4'>
                  <Button
                    type='primary'
                    htmlType='submit'
                    className='min-w-[120px]'
                  >
                    保存修改
                  </Button>
                  <Button
                    className='min-w-[120px]'
                    onClick={() => setEditing(false)}
                  >
                    取消
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </Col>

        {/* 头像卡片（右侧） */}
        <Col xs={24} md={8} xl={6}>
          <Card className='h-full'>
            <div className='flex flex-col items-center'>
              <Upload
                name='file'
                accept='image/*'
                headers={{
                  token: user.token,
                  before: avatar,
                }}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  const isLt2M = file.size / 1024 / 1024 < 2;

                  if (!isImage) {
                    message.error('只能上传图片文件！');
                    return false;
                  }
                  if (!isLt2M) {
                    message.error('图片大小不能超过2MB！');
                    return false;
                  }
                  return isImage && isLt2M;
                }}
                onChange={handleAvatarChange}
                action='/api/sys/img/avatar'
                disabled={!editing}
                showUploadList={false}
              >
                <div className='relative mb-4'>
                  <Avatar
                    size={160}
                    src={avatar}
                    icon={<UserOutlined className='text-4xl' />}
                    style={{
                      backgroundColor: '#f0f2f5',
                      border: '4px solid #fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                  {editing && (
                    <CameraOutlined
                      style={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        fontSize: 24,
                        color: 'white',
                        backgroundColor: '#1890ff',
                        borderRadius: '50%',
                        padding: 4,
                      }}
                    />
                  )}
                </div>
              </Upload>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {user.user?.nickName || user.user?.username}
                </div>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                  {user.user?.email || '未设置邮箱'}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 修改密码弹窗 */}
      <Modal
        title='修改密码'
        open={passwordModalVisible}
        onOk={handlePasswordChange}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        okText='确认修改'
        cancelText='取消'
      >
        <ChangePasswordForm form={passwordForm} />
      </Modal>
    </div>
  );
});

export default PersonalInfo;

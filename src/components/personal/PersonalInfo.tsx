import React, { useState, useCallback, useMemo } from 'react';
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
  Space,
  Divider,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  WechatOutlined,
  EditOutlined,
  LockOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import userStore from '../../store/userStore';
import { observer } from 'mobx-react-lite';
import ChangePasswordForm from './ChangePasswordForm';
import { updatePassword } from '../../api/auth-service/AuthController';
import { useNavigate } from 'react-router-dom';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile } from 'antd/es/upload/interface';

const { Title } = Typography;

// 样式常量
const styles = {
  pageTitle: {
    marginBottom: 24,
  },
  mainCard: {
    height: '100%',
    borderRadius: '8px',
    boxShadow:
      '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12)',
  },
  descriptions: {
    marginBottom: 24,
  },
  profileAvatar: {
    backgroundColor: '#f0f2f5',
    border: '4px solid #fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  avatarUploadIcon: {
    position: 'absolute' as const,
    right: '8px',
    bottom: '8px',
    fontSize: '24px',
    color: 'white',
    backgroundColor: '#1890ff',
    borderRadius: '50%',
    padding: '4px',
    cursor: 'pointer',
  },
  actionButton: {
    minWidth: '120px',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  profileEmail: {
    color: 'rgba(0,0,0,0.45)',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  formSection: {
    marginBottom: 24,
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative' as const,
    marginBottom: '16px',
  },
};

/**
 * 个人信息组件 - 显示和编辑用户个人资料
 */
const PersonalInfo: React.FC = observer(() => {
  const navigate = useNavigate();
  const user = useMemo(() => new userStore(), []);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatar, setAvatar] = useState(user.user.avatar);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  // 使用本地状态管理关键用户信息
  const [nickName, setNickName] = useState(user.user.nickName);
  const [realName, setRealName] = useState(user.user.realName);

  // 处理头像上传
  const handleAvatarChange = useCallback(
    (info: UploadChangeParam<UploadFile>) => {
      if (info.file.status === 'done') {
        try {
          const avatarUrl = info.file.response.data; // 假设后端返回的是这个格式
          setUploaded(1);
          user.user.avatar = avatarUrl;
          setAvatar(avatarUrl);
          message.success('头像更新成功');
        } catch (error: any) {
          console.log(error);
          message.error('头像更新失败');
        }
      }
    },
    [user]
  );

  // 验证上传文件
  const beforeUpload = useCallback((file: RcFile) => {
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
  }, []);

  // 处理表单提交
  const handleSubmit = useCallback(
    async (values: any) => {
      try {
        const result: any = await user.updateUserInfo(
          {
            nickName: values.nickName,
            avatar: avatar,
            realName: values.realName, // 添加真实姓名字段
          },
          uploaded
        );

        if (result.code === 200) {
          message.success(result.msg);
          setEditing(false);
          // 更新用户信息到store
          user.user = { ...user.user, ...result.data };
          // 更新本地状态
          setNickName(values.nickName);
          setRealName(values.realName);
          setUploaded(0);
        } else {
          message.error(result.msg || '修改失败');
        }
      } catch (error) {
        console.log(error);
        message.error('修改失败');
      }
    },
    [avatar, uploaded, user]
  );

  // 处理修改密码
  const handlePasswordChange = useCallback(async () => {
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
  }, [passwordForm, navigate]);

  // 切换到编辑模式
  const handleEdit = useCallback(() => {
    form.setFieldsValue({
      username: user.user?.username,
      nickName: nickName,
      realName: realName,
      email: user.user?.email,
      phone: user.user?.phone,
    });
    setEditing(true);
  }, [form, user.user, nickName, realName]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditing(false);
    form.resetFields();
  }, [form]);

  // 打开密码修改模态框
  const showPasswordModal = useCallback(() => {
    setPasswordModalVisible(true);
    passwordForm.resetFields();
  }, [passwordForm]);

  // 关闭密码修改模态框
  const hidePasswordModal = useCallback(() => {
    setPasswordModalVisible(false);
    passwordForm.resetFields();
  }, [passwordForm]);

  // 渲染基本信息描述列表（非编辑模式）
  const renderInfoDescriptions = useCallback(
    () => (
      <>
        <Descriptions
          column={1}
          bordered
          style={styles.descriptions}
          labelStyle={{ fontWeight: 500, width: '120px' }}
        >
          <Descriptions.Item
            label={
              <Space>
                <UserOutlined /> 用户名
              </Space>
            }
          >
            {user.user?.username}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <UserOutlined /> 昵称
              </Space>
            }
          >
            {nickName}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <IdcardOutlined /> 真实姓名
              </Space>
            }
          >
            {realName || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <MailOutlined /> 邮箱
              </Space>
            }
          >
            {user.user?.email || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <PhoneOutlined /> 手机号码
              </Space>
            }
          >
            {user.user?.phone || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <WechatOutlined /> 微信
              </Space>
            }
          >
            {user.user?.wxId ? '已绑定' : '未绑定'}
          </Descriptions.Item>
        </Descriptions>
        <div style={styles.buttonsContainer}>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={handleEdit}
            style={styles.actionButton}
          >
            修改信息
          </Button>
          <Button
            icon={<LockOutlined />}
            onClick={showPasswordModal}
            style={styles.actionButton}
          >
            修改密码
          </Button>
        </div>
      </>
    ),
    [user.user, handleEdit, showPasswordModal, nickName, realName]
  );

  // 渲染编辑表单（编辑模式）
  const renderEditForm = useCallback(
    () => (
      <Form
        form={form}
        layout='vertical'
        initialValues={{
          username: user.user?.username,
          nickName: user.user?.nickName,
          realName: user.user?.realName, // 添加真实姓名字段
          email: user.user?.email,
          phone: user.user?.phone,
        }}
        onFinish={handleSubmit}
      >
        <Form.Item
          label={
            <Space>
              <UserOutlined /> 用户名
            </Space>
          }
          style={styles.formSection}
        >
          <Input value={user.user?.username} disabled />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <UserOutlined /> 昵称
            </Space>
          }
          name='nickName'
          rules={[{ required: true, message: '请输入昵称' }]}
          style={styles.formSection}
        >
          <Input placeholder='请输入新的昵称' />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <IdcardOutlined /> 真实姓名
            </Space>
          }
          name='realName'
          rules={[{ required: false, message: '请输入真实姓名' }]}
          style={styles.formSection}
        >
          <Input placeholder='请输入真实姓名' />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <MailOutlined /> 邮箱
            </Space>
          }
          style={styles.formSection}
        >
          <Input value={user.user?.email || '未设置'} disabled />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <PhoneOutlined /> 手机号码
            </Space>
          }
          style={styles.formSection}
        >
          <Input value={user.user?.phone || '未设置'} disabled />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <WechatOutlined /> 微信绑定
            </Space>
          }
          style={styles.formSection}
        >
          <Input value={user.user?.wxId ? '已绑定' : '未绑定'} disabled />
        </Form.Item>

        <Divider />

        <div style={styles.buttonsContainer}>
          <Button type='primary' htmlType='submit' style={styles.actionButton}>
            保存修改
          </Button>
          <Button style={styles.actionButton} onClick={handleCancelEdit}>
            取消
          </Button>
        </div>
      </Form>
    ),
    [form, user.user, handleSubmit, handleCancelEdit]
  );

  // 渲染头像部分
  const renderAvatarSection = useCallback(
    () => (
      <div style={styles.avatarContainer}>
        <Upload
          name='file'
          accept='image/*'
          headers={{
            token: user.token,
            before: avatar,
          }}
          beforeUpload={beforeUpload}
          onChange={handleAvatarChange}
          action='/api/sys/user/img/avatar'
          disabled={!editing}
          showUploadList={false}
        >
          <div style={styles.avatarWrapper}>
            <Avatar
              size={160}
              src={avatar}
              icon={<UserOutlined style={{ fontSize: '64px' }} />}
              style={styles.profileAvatar}
            />
            {editing && <CameraOutlined style={styles.avatarUploadIcon} />}
          </div>
        </Upload>

        <div style={styles.profileName}>
          {nickName || user.user?.username}
        </div>

        <div style={styles.profileEmail}>
          {user.user?.email || '未设置邮箱'}
        </div>
      </div>
    ),
    [avatar, editing, handleAvatarChange, beforeUpload, user, nickName]
  );

  return (
    <div>
      <Title level={4} style={styles.pageTitle}>
        个人信息
      </Title>

      <Row gutter={[24, 24]} justify='space-between'>
        {/* 信息卡片（左侧） */}
        <Col xs={24} md={16} xl={18}>
          <Card style={styles.mainCard}>
            {!editing ? renderInfoDescriptions() : renderEditForm()}
          </Card>
        </Col>

        {/* 头像卡片（右侧） */}
        <Col xs={24} md={8} xl={6}>
          <Card style={styles.mainCard}>{renderAvatarSection()}</Card>
        </Col>
      </Row>

      {/* 修改密码弹窗 */}
      <Modal
        title={
          <Space>
            <LockOutlined /> 修改密码
          </Space>
        }
        open={passwordModalVisible}
        onOk={handlePasswordChange}
        onCancel={hidePasswordModal}
        okText='确认修改'
        cancelText='取消'
        maskClosable={false}
        centered
      >
        <ChangePasswordForm form={passwordForm} />
      </Modal>
    </div>
  );
});

export default PersonalInfo;

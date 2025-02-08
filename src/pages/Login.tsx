import {
  Button,
  Form,
  FormProps,
  message,
  Input,
  Layout,
  Typography,
} from 'antd';
import { GithubOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Footer } from 'antd/es/layout/layout';
import { LoginDto } from '../api/auth-service/AuthController';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import userStore from '../store/userStore';
import { Content } from 'antd/es/layout/layout';
import { useState } from 'react';

const { Title, Text } = Typography;

function Login() {
  const marginX = 20;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const onFinish: FormProps<LoginDto>['onFinish'] = (values: LoginDto) => {
    // 发起请求的过程 在mobx中的action中进行
    setLoading(true);
    const user = new userStore();
    user
      .login(values)
      .then((data: any) => {
        if (data.code == 200) {
          message.success(data.msg);
          navigate('/index');
        } else {
          message.warning(data.msg);
        }
      })
      .catch((err: any) => {
        message.error(err.msg);
      });
      setLoading(false);
  };

  return (
    <Layout
      style={{
        minHeight: '100vh', // 强制撑满视口高度
        background: '#F0F2F5',
        display: 'flex', // 启用 flex 布局
        flexDirection: 'column', // 垂直方向排列
      }}
    >
      <Content
        style={{
          flex: 1, // 占据剩余空间
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px', // 避免内容贴边
        }}
      >
        <div
          style={{
            width: 280,
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 400,
              width: '100%',
              padding: '0 20px',
            }}
          >
            {/* Logo 标题 */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <Title
                level={2}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate('/')}
              >
                WMS
              </Title>
            </div>
            <Form
              name='basic'
              style={{ width: 300 }}
              onFinish={onFinish}
              layout='vertical'
              autoComplete='off'
            >
              <Form.Item
                name='username'
                rules={[{ required: true, message: '请输入手机号/邮箱' }]}
              >
                <Input
                  placeholder='请输入手机号/邮箱'
                  prefix={<UserOutlined />}
                />
              </Form.Item>
              <Form.Item
                name='password'
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder='密码' prefix={<LockOutlined />} />
              </Form.Item>
              <Form.Item>
                <Button
                  type='primary'
                  htmlType='submit'
                  style={{ width: '100%' }}
                  loading={loading}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Content>
      {/* 底部 Footer */}
      <Footer
        style={{
          marginTop: 'auto',
          textAlign: 'center',
          padding: '16px',
          backgroundColor: '#F0F2F5',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 5,
          }}
        >
          <Text
            type='secondary'
            style={{ marginLeft: marginX, marginRight: marginX }}
          >
            lsh
          </Text>
          <GithubOutlined
            style={{
              color: 'rgba(0,0,0,0.45)',
              marginLeft: marginX,
              marginRight: marginX,
            }}
            onClick={() => {
              window.open('https://github.com/Web3MoYu/wms-client');
            }}
          />
          <Text
            type='secondary'
            style={{ marginLeft: marginX, marginRight: marginX }}
          >
            WMS
          </Text>
        </div>
        <Text type='secondary'>Copyright ©202 Produced by lsh</Text>
      </Footer>
    </Layout>
  );
}

export default observer(Login);

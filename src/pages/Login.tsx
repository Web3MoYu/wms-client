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
import styles from './login.module.css';

const { Title, Text } = Typography;

// 在组件外部定义正则表达式常量
const USERNAME_REGEX =
  /^(1\d{10}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
const PASSWORD_REGEX = /^[A-Za-z](?=.*\d)(?=.*[.]).{7,}$/;

const Login = observer(() => {
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
    <Layout className={styles.loginLayout}>
      <Content className={styles.loginContent}>
        <div className={styles.formContainer}>
          <Title 
            level={2} 
            className={styles.loginTitle}
            onClick={() => navigate('/')}
          >
            WMS 管理系统
          </Title>
          
          <Form
            name="loginForm"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name='username'
              rules={[
                {
                  required: true,
                  message: '请输入手机号或邮箱',
                },
                {
                  pattern: USERNAME_REGEX,
                  message: '格式不正确(请输入11位手机号或有效邮箱)',
                },
              ]}
            >
              <Input
                placeholder='手机号/邮箱'
                prefix={<UserOutlined />}
                allowClear
              />
            </Form.Item>
            <Form.Item
              name='password'
              rules={[
                {
                  required: true,
                  message: '请输入密码',
                },
                {
                  min: 8,
                  message: '密码长度至少8位',
                },
                {
                  pattern: PASSWORD_REGEX,
                  message: '需字母开头，包含数字和.号',
                },
              ]}
            >
              <Input.Password
                placeholder='密码'
                prefix={<LockOutlined />}
              />
            </Form.Item>
            <Form.Item style={{ marginTop: 32 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
              >
                立即登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>

      <Footer className={styles.loginFooter}>
        <div className={styles.footerContent}>
          <GithubOutlined 
            className={styles.footerIcon}
            onClick={() => window.open('https://github.com/Web3MoYu/wms-client')}
          />
          <Text type="secondary" style={{ fontSize: 14 }}>
            Copyright ©{new Date().getFullYear()} Produced by lsh
          </Text>
        </div>
      </Footer>
    </Layout>
  );
});

export default Login;

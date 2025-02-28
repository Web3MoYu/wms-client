import React, { useEffect, useState } from 'react';
import {
  Form,
  message,
  Input,
  Layout,
  Typography,
  Modal,
  Spin,
  Divider,
  ConfigProvider,
} from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { LoginDto } from '../api/auth-service/AuthController';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import userStore from '../store/userStore';
import { validateToken } from '../api/auth-service/AuthController';
import styles from './css/login.module.css';
import WechatLoginButton from '../components/wx/WechatLoginButton';
import UserLoginForm from '../components/wx/UserLoginForm';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

/**
 * 登录页面组件
 * 提供用户名密码登录和微信登录功能
 */
const Login: React.FC = observer(() => {
  // 状态管理
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [bindVisible, setBindVisible] = useState<boolean>(false);
  const [wxid, setWxid] = useState<string>('');
  const [initializing, setInitializing] = useState<boolean>(true);
  const user = new userStore();

  // 处理常规登录
  const handleLogin = async (values: LoginDto) => {
    setLoading(true);
    try {
      const data: any = await user.login(values);
      
      if (data.code === 200) {
        if (user.menu.length === 0) {
          message.warning('当前用户没有权限，请联系管理员');
        } else {
          message.success(data.msg);
          navigate('/index');
        }
      } else {
        message.warning(data.msg);
      }
    } catch (err: any) {
      message.error(err.msg || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理微信绑定
  const handleBindSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await user.bindWechat(values, wxid);
      
      if (res.code === 200) {
        message.success(res.msg);
        navigate('/index');
      } else {
        message.warning(res.msg);
      }
    } catch (error: any) {
      message.error(error.msg || '绑定失败，请稍后重试');
    } finally {
      setLoading(false);
      setBindVisible(false);
    }
  };

  // 页面初始化：验证token和处理微信登录回调
  useEffect(() => {
    const initialize = async () => {
      // 1. 验证现有token
      try {
        const storedToken = user.token;
        if (storedToken) {
          const response: any = await validateToken();

          if (response.code === 200) {
            user.user = response.data.user;
            if (user.menu.length === 0) {
              message.warning('当前用户没有权限，请联系管理员');
            } else {
              message.success(response.msg);
              navigate(user.menu[0].children[0].menu.menuUrl);
              return; // 提前返回，避免执行后续逻辑
            }
          }
        }
      } catch (error) {
        console.log('Token验证失败:', error);
      }

      // 2. 处理URL参数（微信登录回调）
      const urlParams = new URLSearchParams(window.location.search);
      const binding = urlParams.get('binding');
      const userInfoStr = urlParams.get('userInfo');
      const wxIdParam = urlParams.get('wxId');

      if (wxIdParam) {
        setWxid(wxIdParam);
        if (binding && userInfoStr === 'null') {
          message.warning('当前用户没有权限，请联系管理员');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }

      // 微信绑定逻辑
      if (binding === 'false' && wxIdParam) {
        setBindVisible(true);
      } else if (binding === 'true' && userInfoStr) {
        // 微信授权成功自动登录
        const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
        user.userInfo = {
          user: userInfo.user,
          token: userInfo.token,
          menu: userInfo.menuTree,
        };
        message.success('微信登录成功');
        navigate('/index');
      }
      
      setInitializing(false);
    };

    initialize();
  }, [navigate]);

  // 渲染登录页面
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <Layout className={styles.loginLayout}>
        {initializing ? (
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="初始化中..." />
          </div>
        ) : (
          <>
            {/* 页头 */}
            <Header className={styles.loginHeader}>
              <div className={styles.logo} onClick={() => navigate('/')}>
                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                  WMS 管理系统
                </Title>
              </div>
            </Header>

            {/* 主内容区 */}
            <Content className={styles.loginContent}>
              <div className={styles.loginCard}>
                <div className={styles.formContainer}>
                  <Title level={2} className={styles.loginTitle}>
                    系统登录
                  </Title>
                  <Paragraph type="secondary" className={styles.loginSubtitle}>
                    欢迎使用WMS管理系统，请登录您的账户
                  </Paragraph>

                  {/* 主登录表单 */}
                  <UserLoginForm
                    onFinish={handleLogin}
                    loading={loading}
                    extraFields={
                      <>
                        <Divider plain>
                          <Text type="secondary">其他登录方式</Text>
                        </Divider>
                        <WechatLoginButton loading={loading} />
                      </>
                    }
                  />
                </div>
              </div>
            </Content>

            {/* 页脚 */}
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

            {/* 微信绑定弹窗 */}
            <Modal
              title="绑定账户"
              open={bindVisible}
              onCancel={() => setBindVisible(false)}
              footer={null}
              destroyOnClose
              centered
              maskClosable={false}
              className={styles.bindModal}
            >
              <Paragraph className={styles.modalTip}>
                请输入您的账号密码，完成与微信账号的绑定
              </Paragraph>
              <UserLoginForm
                onFinish={handleBindSubmit}
                submitText="绑定并登录"
                loading={loading}
                extraFields={
                  <Form.Item name="wxid" hidden initialValue={wxid}>
                    <Input type="hidden" />
                  </Form.Item>
                }
              />
            </Modal>
          </>
        )}
      </Layout>
    </ConfigProvider>
  );
});

export default Login;

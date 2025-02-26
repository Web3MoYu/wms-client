import {
  Form,
  FormProps,
  message,
  Input,
  Layout,
  Typography,
  Modal,
} from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { Footer } from 'antd/es/layout/layout';
import { LoginDto } from '../api/auth-service/AuthController';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import userStore from '../store/userStore';
import { Content } from 'antd/es/layout/layout';
import { useEffect, useState } from 'react';
import styles from './css/login.module.css';
import WechatLoginButton from '../components/wx/WechatLoginButton';
import UserLoginForm from '../components/wx/UserLoginForm';
import { validateToken } from '../api/auth-service/AuthController';

const { Title, Text } = Typography;

// 在组件外部定义正则表达式常量
const Login = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // 登录按钮加载状态
  const [bindVisible, setBindVisible] = useState(false); // 微信绑定弹窗可见性
  const [wxid, setWxid] = useState(''); // 微信ID状态
  const user = new userStore();

  // 处理登录表单提交
  const onFinish: FormProps<LoginDto>['onFinish'] = (values: LoginDto) => {
    setLoading(true);
    user
      .login(values)
      .then((data: any) => {
        if (data.code == 200) {
          if (user.menu.length == 0) {
            message.warning('当前用户没有权限，请联系管理员');
          } else {
            message.success(data.msg);
            navigate('/index'); // 登录成功跳转到首页
          }
        } else {
          message.warning(data.msg);
        }
      })
      .catch((err: any) => {
        message.error(err.msg);
      });
    setLoading(false);
  };

  // 页面加载时解析URL参数（处理微信登录回调）
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        // 检查sessionStorage中是否存在token
        const storedToken = user.token;
        if (storedToken) {
          const response: any = await validateToken();
          console.log(response);

          if (response.code === 200) {
            user.user = response.data.user;
            if (user.menu.length == 0) {
              message.warning('当前用户没有权限，请联系管理员');
            } else {
              message.success(response.msg);
              navigate('/index');
            }
          }
        }
      } catch (error) {
        // token验证失败不处理，保持当前页面
        console.log(error);
      }
    };

    const parseUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const binding = urlParams.get('binding'); // 是否绑定模式
      const userInfoStr = urlParams.get('userInfo'); // 用户信息
      const wxIdParam = urlParams.get('wxId'); // 微信ID

      if (wxIdParam) {
        setWxid(wxIdParam);
      }

      // 处理微信绑定逻辑
      if (binding === 'false' && wxIdParam) {
        setBindVisible(true); // 显示绑定弹窗
      } else if (binding === 'true' && userInfoStr) {
        // 自动登录逻辑（微信授权成功）
        const userInfo = JSON.parse(decodeURIComponent(userInfoStr));
        user.userInfo = {
          user: userInfo.user,
          token: userInfo.token,
          menu: userInfo.menuTree,
        };
        message.success('微信登录成功');
        navigate('/index');
      }
    };

    // 先执行token检查
    checkTokenValidity();
    // 然后执行原有参数解析
    parseUrlParams();
  }, [navigate]);

  // 处理微信绑定提交
  const handleBindSubmit = async (values: any) => {
    try {
      user.bindWechat(values, wxid).then((res: any) => {
        if (res.code == 200) {
          message.success(res.msg);
          navigate('/index'); // 登录成功跳转到首页
        } else {
          message.warning(res.msg);
        }
      });
    } catch (error: any) {
      message.error(error.msg);
    }
  };

  return (
    <Layout className={styles.loginLayout}>
      {/* 登录表单区域 */}
      <Content className={styles.loginContent}>
        <div className={styles.formContainer}>
          <Title
            level={2}
            className={styles.loginTitle}
            onClick={() => navigate('/')}
          >
            WMS 管理系统
          </Title>

          {/* 主登录表单 */}
          <UserLoginForm
            onFinish={onFinish}
            loading={loading}
            extraFields={
              <>
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                  <Text type='secondary'>或使用其他方式登录</Text>
                </div>
                <WechatLoginButton loading={loading} />
              </>
            }
          />
        </div>
      </Content>

      {/* 页脚 */}
      <Footer className={styles.loginFooter}>
        <div className={styles.footerContent}>
          <GithubOutlined
            className={styles.footerIcon}
            onClick={() =>
              window.open('https://github.com/Web3MoYu/wms-client')
            }
          />
          <Text type='secondary' style={{ fontSize: 14 }}>
            Copyright ©{new Date().getFullYear()} Produced by lsh
          </Text>
        </div>
      </Footer>

      {/* 微信绑定弹窗 */}
      <Modal
        title='绑定账户'
        open={bindVisible}
        onCancel={() => setBindVisible(false)}
        footer={null}
        destroyOnClose
        centered={true}
      >
        {/* 绑定专用表单（复用登录表单组件） */}
        <UserLoginForm
          onFinish={handleBindSubmit}
          submitText='提交'
          extraFields={
            <Form.Item name='wxid' hidden initialValue={wxid}>
              <Input type='hidden' />
            </Form.Item>
          }
        />
      </Modal>
    </Layout>
  );
});

export default Login;

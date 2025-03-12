/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Button,
  theme,
  Breadcrumb,
  Space,
  Dropdown,
  MenuProps,
  message,
  Avatar,
} from 'antd';
import LeftMenu from '../components/LeftMenu';
import { Outlet } from 'react-router-dom';
import useBreadcrumb from '../hooks/useBreadcrumb';
import { logout as authLogout } from '../api/auth-service/AuthController';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import userStore from '../store/userStore';
import MessageNotifier from '../components/notice/MessageNotifier';
const { Header, Sider, Content } = Layout;

const Index = observer(() => {
  const [collapsed, setCollapsed] = useState(false);
  const user = new userStore();
  const breadcrumbItems = useBreadcrumb();
  const {
    token: { colorBgContainer, borderRadiusLG, boxShadowSecondary },
  } = theme.useToken();

  function logout(): void {
    authLogout().then((data: any) => {
      if (data.code == 200) {
        sessionStorage.clear();
        message.success('退出成功');
        window.location.href = '/login';
      }
    });
  }

  // 在Index组件内添加下拉菜单配置（放在return语句之前）
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'userInfo',
      label: (
        <Link to='/personal'>
          <Space>
            <UserOutlined />
            <span>个人信息</span>
          </Space>
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          <span>退出登录</span>
        </Space>
      ),
      onClick: () => logout(),
    },
  ];

  // 当组件挂载时，添加样式来防止滚动条引起的布局抖动
  useEffect(() => {
    // 添加全局样式，确保滚动条始终存在，并处理顶部导航栏
    const style = document.createElement('style');
    style.innerHTML = `
      html {
        overflow-y: scroll;
      }
      
      body {
        padding-right: calc(100vw - 100%);
        margin: 0;
        overflow-x: hidden;
      }
      
      /* 防止头像区域抖动 */
      .ant-layout-header {
        width: calc(100% - ${collapsed ? '80px' : '220px'});
        transition: width 0.2s;
        padding-right: calc(24px + (100vw - 100%));
      }
    `;
    document.head.appendChild(style);
    
    // 监听滚动条变化，动态调整Header宽度
    const updateHeaderWidth = () => {
      const header = document.querySelector('.ant-layout-header') as HTMLElement;
      if (header) {
        header.style.width = `calc(100% - ${collapsed ? '80px' : '220px'})`;
      }
    };
    
    window.addEventListener('resize', updateHeaderWidth);
    
    return () => {
      document.head.removeChild(style);
      window.removeEventListener('resize', updateHeaderWidth);
    };
  }, [collapsed]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 侧边栏：调整宽度和阴影，添加固定宽度和溢出隐藏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
          zIndex: 2, // 增加z-index确保在Header之上
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          overflowY: 'auto',
          transition: 'all 0.2s'
        }}
      >
        <div className='demo-logo-vertical' />
        <LeftMenu />
      </Sider>

      {/* 主内容区域：添加左侧margin来适应固定侧边栏 */}
      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        {/* Header：固定在顶部 */}
        <Header
          style={{
            height: 64,
            padding: '0 24px',
            background: colorBgContainer,
            boxShadow: boxShadowSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'fixed',
            top: 0,
            zIndex: 1,
            right: 0,
            transition: 'all 0.2s'
          }}
        >
          <Space>
            <Button
              type='text'
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
          </Space>

          {/* 用户操作栏 */}
          <Space size="large">
            <MessageNotifier />
            <Dropdown menu={{ items: userMenuItems }} trigger={['hover']}>
              <div style={{ cursor: 'pointer', padding: '0 16px' }}>
                <Space>
                  <Avatar
                    src={user.user?.avatar}
                    icon={!user.user?.avatar && <UserOutlined />}
                    style={{
                      backgroundColor: user.user?.avatar
                        ? 'transparent'
                        : '#1890ff',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                    {user.user.realName}
                  </span>
                </Space>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* 面包屑：放在 Header 下方，固定位置 */}
        <div
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            position: 'fixed',
            top: 64, // Header高度
            left: collapsed ? 80 : 220,
            right: 0,
            zIndex: 1,
            transition: 'all 0.2s'
          }}
        >
          <Breadcrumb items={breadcrumbItems} style={{ padding: '16px 0' }} />
        </div>

        {/* 内容区域：添加足够的顶部margin来避免被固定的Header和面包屑遮挡 */}
        <Content
          style={{
            margin: '24px 16px',
            padding: '24px',
            minHeight: 'calc(100vh - 176px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            boxShadow: boxShadowSecondary,
            marginTop: '130px', // 为固定的Header和面包屑留出空间
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
});

export default Index;

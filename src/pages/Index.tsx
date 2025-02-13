/* eslint-disable react-hooks/exhaustive-deps */
import { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LockOutlined,
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
} from 'antd';
import LeftMenu from '../components/LeftMenu';
import { Outlet } from 'react-router-dom';
import UserAvatar from '../components/common/UserAvatar';
import useBreadcrumb from '../hooks/useBreadcrumb';
import { logout as authLogout } from '../api/auth-service/AuthController';
import { Link } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const Index = () => {
  const [collapsed, setCollapsed] = useState(false);
  const breadcrumbItems = useBreadcrumb();
  const {
    token: { colorBgContainer, borderRadiusLG, boxShadowSecondary },
  } = theme.useToken();

  function logout(): void {
    authLogout().then((data: any) => {
      console.log(data);

      if (data.code == 200) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('menu');
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

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 侧边栏：调整宽度和阴影 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        style={{
          boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
          zIndex: 1,
        }}
      >
        <div className='demo-logo-vertical' />
        <LeftMenu />
      </Sider>

      {/* 主内容区域 */}
      <Layout>
        {/* Header：增加高度、阴影和间距 */}
        <Header
          style={{
            height: 64,
            padding: '0 24px',
            background: colorBgContainer,
            boxShadow: boxShadowSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1,
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
          <Space>
            <Dropdown menu={{ items: userMenuItems }} trigger={['hover']}>
              <div style={{ cursor: 'pointer', padding: '0 16px' }}>
                <UserAvatar />
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* 面包屑：放在 Header 下方 */}
        <div
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Breadcrumb items={breadcrumbItems} style={{ padding: '16px 0' }} />
        </div>

        {/* Content：优化内边距和背景 */}
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 'calc(100vh - 176px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            boxShadow: boxShadowSecondary,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Index;

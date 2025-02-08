/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, Button, theme, Breadcrumb, Space } from 'antd';
import LeftMenu from '../component/LeftMenu';
import { Outlet, useLocation, Link } from 'react-router-dom';
import userStore from '../store/userStore';

const { Header, Sider, Content } = Layout;

function Index() {
  const user = new userStore();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG, boxShadowSecondary },
  } = theme.useToken();
  const location = useLocation();
  const [breadcrumbItems, setBreadcrumbItems] = useState<
    { key: string; title: React.ReactNode }[]
  >([]);

  // 生成面包屑的逻辑（保持不变）
  useEffect(() => {
    const generateBreadcrumb = (menuTree: any[], path: string) => {
      const breadcrumb: { key: string; title: React.ReactNode }[] = [];
      const findPath = (tree: any[], targetPath: string): boolean => {
        for (const item of tree) {
          if (item.menu.menuUrl === targetPath) {
            breadcrumb.unshift({
              key: item.menu.menuUrl,
              title: item.menu.title,
            });
            return true;
          }
          if (item.children && findPath(item.children, targetPath)) {
            breadcrumb.unshift({
              key: item.menu.menuUrl,
              title: item.menu.title,
            });
            return true;
          }
        }
        return false;
      };
      findPath(menuTree, path);
      return breadcrumb;
    };

    const menuTree = user.menu;
    if (menuTree) {
      const breadcrumb = generateBreadcrumb(menuTree, location.pathname);
      setBreadcrumbItems(breadcrumb);
    }
  }, [location.pathname, JSON.stringify(user.menu)]);

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

          {/* 可在此处添加用户操作栏（如用户头像、通知按钮等） */}
          <Space>
            <span>欢迎回来，管理员</span>
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
            minHeight: 'calc(100vh - 176px)', // 动态高度（减去 Header 和面包屑高度）
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
}

export default Index;

import { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { logout } from '../api/auth-service/AuthController';

export const userMenuItems: MenuProps['items'] = [
  {
    key: 'userInfo',
    label: (
      <span>
        <UserOutlined /> 个人信息
      </span>
    ),
    disabled: true,
  },
  { type: 'divider' },
  {
    key: 'logout',
    label: (
      <span>
        <LogoutOutlined /> 退出登录
      </span>
    ),
    onClick: () => {
      logout().then((data: any) => {
        if (data.code === 200) {
          sessionStorage.clear();
          window.location.href = '/login';
        }
      });
    },
  },
]; 
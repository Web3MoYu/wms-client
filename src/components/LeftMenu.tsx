import { Menu } from 'antd';
import { observer } from 'mobx-react';
import userStore from '../store/userStore';
import * as Icon from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { JSX } from 'react/jsx-runtime';
import { useMemo } from 'react';

interface MenuItem {
  menu: {
    menuId: number;
    title: string;
    menuUrl: string;
    icon: string;
    componentPath?: string;
  };
  children?: MenuItem[];
}

const createMenu = (menuList: MenuItem[]): MenuProps['items'] => {
  const arr: { key: any; icon: JSX.Element; label: any; children?: any[] }[] =
    [];
  if (menuList && menuList.length > 0) {
    menuList.map((item: any) => {
      // 从所有的里面选出图标
      const menu = item.menu;
        const ICON = Icon[menu.icon];
      if (item.children && item.children.length > 0) {
        arr.push({
          key: menu.menuId,
          icon: <ICON />,
          label: menu.title,
          children: [...createMenu(item.children)],
        });
      } else {
        arr.push({
          key: menu.menuId,
          icon: <ICON />,
          label: <Link to={menu.menuUrl}>{menu.title}</Link>,
        });
      }
    });
  }
  return arr;
};

const LeftMenu = observer(() => {
  const location = useLocation();
  
  // 1.拿到mobx中user存储的menuInfo
  // 2.menuinfo数组，生成对应菜单要求的数组
  const user = new userStore();

  // 新增查找当前路径对应菜单ID的方法
  const findSelectedKey = (menuList: any[]): string[] => {
    if (!menuList) return [];
    
    const findKey = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.menu.menuUrl === location.pathname) {
          return item.menu.menuId.toString();
        }
        if (item.children) {
          const childKey = findKey(item.children);
          if (childKey) return childKey;
        }
      }
    };
    
    return [findKey(user.menu) || '1']; // 保持默认值防止报错
  };

  // 使用useMemo优化性能
  const menuItems = useMemo(() => createMenu(user.menu), [user.menu]);

  return (
    <Menu
      theme='dark'
      mode='inline'
      selectedKeys={findSelectedKey(user.menu)}
      items={menuItems}
    />
  );
});

export default LeftMenu;

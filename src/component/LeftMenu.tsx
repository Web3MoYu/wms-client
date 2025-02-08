import { Menu } from 'antd';
import { observer } from 'mobx-react';
import userStore from '../store/userStore';
import * as Icon from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { JSX } from 'react/jsx-runtime';

function LeftMenu() {
  // 1.拿到mobx中user存储的menuInfo
  // 2.menuinfo数组，生成对应菜单要求的数组
  const user = new userStore();
  const createMenu = (menuList: any) => {
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

  return (
    <Menu
      theme='dark'
      mode='inline'
      defaultSelectedKeys={['1']}
      items={createMenu(user.menu)}
    />
  );
}

export default observer(LeftMenu);

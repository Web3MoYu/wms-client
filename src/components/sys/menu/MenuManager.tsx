import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, message, Tag } from 'antd';
import * as ICONS from '@ant-design/icons/';
import MenuModal from './MenuModal';
import {
  getMenuList,
  updateMenu,
  addMenu,
  deleteMenu,
  MenuItem,
} from '../../../api/sys-service/MenuController';

const MenuManagement: React.FC = () => {
  // 菜单类型
  const menuType = ['目录', '菜单', '按钮'];
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  // 显示菜单图标
  const antICONS: any = ICONS;
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);

  const formatMenus = (menus: any) => {
    return menus.map((menu: any) => ({
      parentId: menu.menu.parentId == 0 ? null : menu.menu.parentId,
      menuId: menu.menu.menuId,
      icon: menu.menu.icon || '',
      title: menu.menu.title || '',
      code: menu.menu.code || '',
      name: menu.menu.name || '',
      menuUrl: menu.menu.menuUrl || '',
      routePath: menu.menu.routePath || '',
      componentPath: menu.menu.componentPath || '',
      type: menu.menu.type,
      orderNum: menu.menu.orderNum,
      children: menu.children ? formatMenus(menu.children) : '',
    }));
  };

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const response: any = await getMenuList();
      if (response.code === 200) {
        setMenuData(formatMenus(response.data));
      } else {
        message.error(response.msg);
      }
    } catch (error: any) {
      message.error(error.data.msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleAddClick = () => {
    setCurrentMenu(null);
    setIsModalVisible(true);
  };

  const handleEditClick = (menu: MenuItem) => {
    setCurrentMenu(menu);
    setIsModalVisible(true);
  };

  const handleDeleteClick = async (menuId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '你确定要删除这个菜单吗？',
      onOk: async () => {
        const resp: any = await deleteMenu(menuId);
        if (resp.code === 200) {
          fetchMenuData();
          message.success(resp.msg);
        } else {
          message.error(resp.msg);
        }
      },
    });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleModalOk = async (values: MenuItem) => {
    try {
      if (currentMenu) {
        const resp: any = await updateMenu(values, currentMenu.menuId);
        if (resp.code === 200) {
          message.success(resp.msg);
        } else {
          message.error(resp.msg);
        }
      } else {
        const resp: any = await addMenu(values);
        if (resp.code === 200) {
          message.success(resp.msg);
        } else {
          message.error(resp.msg);
        }
      }
      setIsModalVisible(false);
      fetchMenuData();
    } catch (error: any) {
      message.error(error.data.msg);
    }
  };

  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (text: string) => {
        if (text === '') {
          return <></>;
        }
        const Icon = antICONS[text];
        return <Icon />;
      },
      width: '4%',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => {
        const color = ['geekblue', 'green', 'volcano'];
        return (
          <Tag color={color[type]} key={menuType[type]}>
            {menuType[type]}
          </Tag>
        );
      },
      width: '4%',
    },
    {
      title: '权限字段',
      dataIndex: 'code',
      key: 'code',
      width: '10%',
    },
    {
      title: '菜单路径',
      dataIndex: 'menuUrl',
      key: 'menuUrl',
    },
    {
      title: '路由名称',
      dataIndex: 'name',
      key: 'name',
      width: '10%',
    },
    {
      title: '路由地址',
      dataIndex: 'routePath',
      key: 'routePath',
      width: '10%',
    },
    {
      title: '组件路径',
      dataIndex: 'componentPath',
      key: 'componentPath',
      width: '10%',
    },
    {
      title: '操作',
      key: 'action',
      width: '11%',
      render: (text: string, record: MenuItem) => (
        <span>
          <Button
            type='link'
            onClick={() => handleEditClick(record)}
            style={{
              marginRight: 8,
              backgroundColor: '#1890ff',
              color: 'white',
            }}
          >
            编辑
          </Button>
          <Button
            type='link'
            danger
            onClick={() => handleDeleteClick(record.menuId)}
            style={{ backgroundColor: '#ff4d4f', color: 'white' }}
          >
            删除
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <Button type='primary' onClick={handleAddClick}>
        新增
      </Button>
      <Table
        columns={columns}
        dataSource={menuData}
        loading={loading}
        rowKey={(record) => record.menuId}
        style={{ marginTop: 20 }}
      />
      <MenuModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        currentMenu={currentMenu}
      />
    </div>
  );
};

export default MenuManagement;

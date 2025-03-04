import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, message, Tag, Typography, Card, Space, Divider } from 'antd';
import * as ICONS from '@ant-design/icons/';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined,
  MinusSquareOutlined,
  PlusSquareOutlined
} from '@ant-design/icons';
import MenuModal from './MenuModal';
import {
  getMenuList,
  updateMenu,
  addMenu,
  deleteMenu,
  MenuItem,
} from '../../../api/sys-service/MenuController';

const { Title, Text } = Typography;

// 菜单类型常量
const MENU_TYPES = ['目录', '菜单', '按钮'];
const TYPE_COLORS = ['geekblue', 'green', 'volcano'];
// 图标颜色常量
const ICON_COLORS = {
  directory: '#1890ff', // 目录图标颜色
  menu: '#52c41a',      // 菜单图标颜色
  button: '#fa8c16',    // 按钮图标颜色
  default: '#8c8c8c'    // 默认图标颜色
};

// 样式常量
const styles = {
  card: {
    boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12)',
    borderRadius: '8px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
  },
  addButton: {
    borderRadius: '4px',
  },
  table: {
    marginTop: '16px',
  },
  editButton: {
    marginRight: '8px',
    backgroundColor: '#1890ff',
    color: 'white',
    borderColor: '#1890ff',
    borderRadius: '4px',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    color: 'white',
    borderColor: '#ff4d4f',
    borderRadius: '4px',
  },
  iconCell: {
    textAlign: 'center' as const,
  }
};

// 本地菜单项接口定义，确保与API类型兼容
interface LocalMenuItem extends Omit<MenuItem, 'icon'> {
  icon?: string;
  children?: LocalMenuItem[];
  level?: number;
}

/**
 * 菜单管理组件
 */
const MenuManagement: React.FC = () => {
  const [menuData, setMenuData] = useState<LocalMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentMenu, setCurrentMenu] = useState<LocalMenuItem | null>(null);

  // 格式化菜单数据
  const formatMenus = useCallback((menus: any, level = 0) => {
    return menus.map((menu: any) => ({
      parentId: menu.menu.parentId === 0 ? null : menu.menu.parentId,
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
      level: level,
      children: menu.children ? formatMenus(menu.children, level + 1) : [],
    }));
  }, []);

  // 获取菜单数据
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await getMenuList();
      if (response.code === 200) {
        setMenuData(formatMenus(response.data));
      } else {
        message.error(response.msg || '获取菜单列表失败');
      }
    } catch (error: any) {
      message.error(error.data?.msg || '获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  }, [formatMenus]);

  // 组件初始化时获取数据
  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // 处理添加按钮点击
  const handleAddClick = useCallback(() => {
    setCurrentMenu(null);
    setIsModalVisible(true);
  }, []);

  // 处理编辑按钮点击
  const handleEditClick = useCallback((menu: LocalMenuItem) => {
    setCurrentMenu(menu);
    setIsModalVisible(true);
  }, []);

  // 处理删除按钮点击
  const handleDeleteClick = useCallback(async (menuId: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <span>
          您确定要删除<Text strong>{title}</Text>菜单吗？此操作不可恢复！
        </span>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const resp: any = await deleteMenu(menuId);
          if (resp.code === 200) {
            fetchMenuData();
            message.success(resp.msg || '删除成功');
          } else {
            message.error(resp.msg || '删除失败');
          }
        } catch (error: any) {
          message.error(error.data?.msg || '删除失败');
        }
      },
    });
  }, [fetchMenuData]);

  // 处理模态框取消
  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // 处理模态框确认 - 修复类型
  const handleModalOk = useCallback(async (values: any) => {
    try {
      let resp: any;
      if (currentMenu) {
        // 更新已有菜单
        resp = await updateMenu(values, currentMenu.menuId);
      } else {
        // 添加新菜单
        resp = await addMenu(values);
      }

      if (resp.code === 200) {
        message.success(resp.msg || (currentMenu ? '更新成功' : '添加成功'));
        setIsModalVisible(false);
        fetchMenuData();
      } else {
        message.error(resp.msg || '操作失败');
      }
    } catch (error: any) {
      message.error(error.data?.msg || '操作失败');
    }
  }, [currentMenu, fetchMenuData]);

  // 简洁的菜单标题渲染
  const renderMenuTitle = (text: string, record: LocalMenuItem) => {
    const level = record.level || 0;
    const style = level === 0 ? { fontWeight: 'bold' } : {};
    
    // 根据菜单类型选择图标颜色
    const getIconColor = (type: number) => {
      switch(type) {
        case 0: return ICON_COLORS.directory;
        case 1: return ICON_COLORS.menu;
        case 2: return ICON_COLORS.button;
        default: return ICON_COLORS.default;
      }
    };
    
    const iconColor = getIconColor(record.type);
    
    return (
      <span style={style}>
        {record.icon && ((ICONS as { [key: string]: any })[record.icon] ? 
          React.createElement((ICONS as { [key: string]: any })[record.icon], { 
            style: { marginRight: '8px', color: iconColor } 
          }) : null)}
        {text}
      </span>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '菜单名称',
      dataIndex: 'title',
      key: 'title',
      width: '160px', // 设置菜单名称列宽度
      ellipsis: true,
      render: renderMenuTitle,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => (
        <Tag color={TYPE_COLORS[type]} key={MENU_TYPES[type]}>
          {MENU_TYPES[type]}
        </Tag>
      ),
      width: '80px',
      align: 'center' as const,
    },
    {
      title: '权限字段',
      dataIndex: 'code',
      key: 'code',
      width: '150px',
      ellipsis: true,
    },
    {
      title: '菜单路径',
      dataIndex: 'menuUrl',
      key: 'menuUrl',
      width: '120px', // 缩小菜单路径列宽度
      ellipsis: true,
    },
    {
      title: '路由地址',
      dataIndex: 'routePath',
      key: 'routePath',
      width: '150px',
      ellipsis: true,
    },
    {
      title: '组件路径',
      dataIndex: 'componentPath',
      key: 'componentPath',
      width: '200px', // 增大组件路径列宽度
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: '250px',
      render: (_: any, record: LocalMenuItem) => (
        <Space wrap>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => handleEditClick(record)}
            style={styles.editButton}
            size="middle"
          >
            编辑
          </Button>
          <Button
            danger
            type='primary'
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteClick(record.menuId, record.title)}
            style={styles.deleteButton}
            size="middle"
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card style={styles.card}>
      <div style={styles.header}>
        <Title level={4} style={styles.title}>
          <Space>
            <AppstoreOutlined />
            菜单管理
          </Space>
        </Title>
        
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={handleAddClick}
          style={styles.addButton}
        >
          新增菜单
        </Button>
      </div>
      
      <Divider />
      
      <Table
        columns={columns}
        dataSource={menuData}
        loading={loading}
        rowKey={(record) => record.menuId}
        style={styles.table}
        bordered
        size="middle"
        pagination={false}
        scroll={{ x: 1200 }}
        expandable={{
          rowExpandable: (record) => 
            record.children !== undefined && 
            record.children.length > 0,
          defaultExpandAllRows: true,
          expandIcon: ({ expanded, onExpand, record }) => {
            if (record.children && record.children.length > 0) {
              return expanded ? 
                <MinusSquareOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#1890ff' }} /> : 
                <PlusSquareOutlined onClick={e => onExpand(record, e)} style={{ cursor: 'pointer', color: '#1890ff' }} />;
            }
            return null;
          }
        }}
        indentSize={25}
        className="menu-tree-table"
        rowClassName={(record) => {
          const level = record.level || 0;
          return level === 0 ? 'menu-parent-row' : '';
        }}
      />
      
      <MenuModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        currentMenu={currentMenu}
      />
    </Card>
  );
};

export default MenuManagement;

import React, { useEffect, useState, useCallback } from 'react';
import { Modal, Form, Input, Select, TreeSelect, message, Space, Divider, Typography } from 'antd';
import * as ICONS from '@ant-design/icons/';
import { getContentList } from '../../../api/sys-service/MenuController';
import { KeyOutlined, FolderOutlined, MenuOutlined, AppstoreOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

// 菜单项接口定义
interface MenuItem {
  menuId: string;
  icon?: string;
  title: string;
  code: string;
  name?: string;
  menuUrl?: string;
  routePath?: string;
  componentPath?: string;
  type: number;
  parentId?: string | null;
  orderNum?: number | string;
}

// 格式化后的菜单项
interface FormattedMenuItem {
  menuId: string;
  title: string;
  children: FormattedMenuItem[];
}

// 模态框属性接口定义
interface MenuModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: MenuItem) => void;
  currentMenu: MenuItem | null;
}

// 菜单类型常量
const MENU_TYPES = [
  { value: 0, label: '目录', icon: <FolderOutlined /> },
  { value: 1, label: '菜单', icon: <MenuOutlined /> },
  { value: 2, label: '按钮', icon: <KeyOutlined /> }
];

// 样式常量
const styles = {
  formItem: {
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  modalTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    margin: '8px 0 16px',
  },
  treeSelect: {
    width: '100%',
  },
  modal: {
    maxWidth: '650px',
  }
};

/**
 * 菜单模态框组件
 * 用于创建和编辑菜单项
 */
const MenuModal: React.FC<MenuModalProps> = ({
  visible,
  onCancel,
  onOk,
  currentMenu,
}) => {
  const [form] = Form.useForm();
  const [menus, setMenus] = useState<FormattedMenuItem[]>([]);

  // 格式化菜单数据为树形结构
  const formatMenus = useCallback((menuData: any[]): FormattedMenuItem[] => {
    if (!menuData || menuData.length === 0) {
      return [];
    }
    return menuData.map((menu: any) => ({
      menuId: menu.menu.menuId,
      title: menu.menu.title || '',
      children: menu.children ? formatMenus(menu.children) : [],
    }));
  }, []);

  // 验证菜单图标是否存在
  const validateIcon = useCallback((_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    // 使用索引类型断言解决类型错误
    if ((ICONS as { [key: string]: any })[value]) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入正确的菜单图标'));
  }, []);

  // 初始化数据和表单
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const resp: any = await getContentList();
        if (resp.code === 200) {
          setMenus(formatMenus(resp.data));
        } else {
          message.error(resp.msg || '获取菜单数据失败');
        }
      } catch (error) {
        console.error('获取菜单列表失败', error);
        message.error('获取菜单列表失败');
      }
    };

    if (visible) {
      fetchMenus();
      
      if (currentMenu) {
        form.setFieldsValue(currentMenu);
      } else {
        form.resetFields();
      }
    }
  }, [currentMenu, form, visible, formatMenus]);

  // 处理表单提交
  const handleOk = useCallback(async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      console.error('表格验证失败', error);
    }
  }, [form, onOk]);

  // 根据菜单类型显示不同的表单项
  const renderTypeSpecificFields = useCallback(() => {
    const type = form.getFieldValue('type');
    if (type === 2) return null; // 按钮类型不需要显示额外字段

    return (
      <>
        <Form.Item
          name='icon'
          label='菜单图标'
          rules={[
            {
              required: true,
              message: '请输入正确的菜单图标',
              validator: validateIcon,
            },
          ]}
          style={styles.formItem}
          tooltip="输入antd图标组件名称，如 UserOutlined"
        >
          <Input prefix={<AppstoreOutlined />} placeholder="输入图标名称，如 UserOutlined" />
        </Form.Item>
        
        <Form.Item 
          name='menuUrl' 
          label='菜单路径'
          style={styles.formItem}
        >
          <Input placeholder="请输入菜单路径" />
        </Form.Item>
        
        <Form.Item 
          name='name' 
          label='路由名称'
          style={styles.formItem}
        >
          <Input placeholder="请输入路由名称" />
        </Form.Item>
        
        <Form.Item
          name='routePath'
          label='路由地址'
          rules={[{ required: true, message: '请输入路由地址' }]}
          style={styles.formItem}
        >
          <Input placeholder="请输入路由地址" />
        </Form.Item>
        
        <Form.Item
          name='componentPath'
          label='组件路径'
          rules={[{ required: true, message: '请输入组件路径' }]}
          style={styles.formItem}
        >
          <Input placeholder="请输入组件路径" />
        </Form.Item>
      </>
    );
  }, [form, validateIcon]);

  return (
    <Modal
      title={
        <div style={styles.modalTitle}>
          {currentMenu ? <MenuOutlined /> : <PlusOutlined />}
          <Title level={5} style={{ margin: 0 }}>
            {currentMenu ? '编辑菜单' : '新增菜单'}
          </Title>
        </div>
      }
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={550}
      maskClosable={false}
      destroyOnClose
      okText="确认"
      cancelText="取消"
      style={styles.modal}
    >
      <Divider style={styles.divider} />
      
      <Form 
        form={form} 
        layout='vertical'
        initialValues={{ type: 0 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 基本信息部分 */}
          <Form.Item
            name='parentId'
            label='上级菜单'
            rules={[
              {
                required: false,
                validator(rule, value) {
                  if (value && value === currentMenu?.menuId) {
                    return Promise.reject('无法选择自己作为父节点');
                  }
                  return Promise.resolve();
                },
              },
            ]}
            style={styles.formItem}
          >
            <TreeSelect
              treeData={menus}
              placeholder='请选择上级菜单'
              treeDefaultExpandAll
              allowClear
              style={styles.treeSelect}
              fieldNames={{
                label: 'title',
                value: 'menuId',
                children: 'children',
              }}
            />
          </Form.Item>
          
          <Form.Item
            name='title'
            label='菜单名称'
            rules={[{ required: true, message: '请输入菜单名称' }]}
            style={styles.formItem}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>

          <Form.Item
            name='code'
            label='权限字段'
            rules={[{ required: true, message: '请输入权限字段' }]}
            style={styles.formItem}
            tooltip="权限字段用于权限控制，例如：sys:user:add"
          >
            <Input placeholder="请输入权限字段" />
          </Form.Item>

          <Form.Item
            name='type'
            label='菜单类型'
            rules={[{ required: true, message: '请选择菜单类型' }]}
            style={styles.formItem}
          >
            <Select placeholder="请选择菜单类型">
              {MENU_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  <Space>
                    {type.icon}
                    {type.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 根据菜单类型渲染不同的表单项 */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {() => renderTypeSpecificFields()}
          </Form.Item>
          
          <Form.Item 
            name='orderNum' 
            label='排序字段'
            style={styles.formItem}
            tooltip="数字越小越靠前"
          >
            <Input type="number" placeholder="请输入排序字段" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default MenuModal;

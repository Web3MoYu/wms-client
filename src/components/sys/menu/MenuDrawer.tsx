import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  TreeSelect,
  Space,
  Radio,
  Divider,
  message,
  InputNumber,
} from 'antd';
import * as ICONS from '@ant-design/icons/';
import { getContentList } from '../../../api/sys-service/MenuController';
import { InfoCircleOutlined, AppstoreOutlined } from '@ant-design/icons';

// 复用 MenuModal 中的类型定义
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

interface FormattedMenuItem {
  menuId: string;
  title: string;
  children: FormattedMenuItem[];
}

// 组件 Props
interface MenuDrawerProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: MenuItem) => void;
  currentMenu: MenuItem | null;
}

// 样式
const styles = {
  drawer: {
    paddingBottom: 50,
  },
  divider: {
    margin: '8px 0 16px',
  },
  formItem: {
    marginBottom: 16,
  },
  treeSelect: {
    width: '100%',
  },
  iconInput: {
    borderRadius: 4,
  },
};

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  visible,
  onCancel,
  onOk,
  currentMenu,
}) => {
  const [form] = Form.useForm();
  const [menus, setMenus] = useState<FormattedMenuItem[]>([]);
  const [menuType, setMenuType] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // 加载菜单数据
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res: any = await getContentList();
      if (res.code === 200 && res.data) {
        // 格式化菜单数据
        const formattedData = formatMenus(res.data);
        // 直接使用格式化后的数据，不添加根目录选项
        setMenus(formattedData);
      } else {
        message.error(res.msg || '获取菜单失败');
      }
    } catch (error) {
      console.error('获取菜单出错:', error);
      message.error('获取菜单失败');
    } finally {
      setLoading(false);
    }
  };

  // 确保获取到初始数据
  useEffect(() => {
    if (visible) {
      fetchMenus();
    }
  }, [visible]);

  // 验证并设置表单初始值
  useEffect(() => {
    // 抽屉打开时设置表单初始值
    if (visible) {
      // 如果是编辑，设置表单初始值
      if (currentMenu) {
        // 如果parentId为"0"，设置为null
        const formValues = {
          ...currentMenu,
          parentId: currentMenu.parentId === "0" ? null : currentMenu.parentId || null,
        };
        form.setFieldsValue(formValues);
        setMenuType(currentMenu.type);
      } else {
        // 新增时，重置表单
        form.resetFields();
        form.setFieldsValue({ type: 0 });
        setMenuType(0);
      }
    }
  }, [visible, currentMenu, form]);

  // 格式化菜单数据
  const formatMenus = (data: any[]): FormattedMenuItem[] => {
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((menu: any) => ({
      menuId: menu.menu.menuId,
      title: menu.menu.title || '',
      children: menu.children ? formatMenus(menu.children) : [],
    }));
  };

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

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 如果parentId为null或空字符串，设置为"0"
      const submittedValues = {
        ...values,
        parentId: values.parentId || "0"
      };
      
      onOk(submittedValues);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 监听菜单类型变化
  const handleTypeChange = (e: any) => {
    setMenuType(e.target.value);
  };

  return (
    <Drawer
      title={currentMenu ? '编辑菜单' : '新增菜单'}
      open={visible}
      onClose={onCancel}
      width={550}
      maskClosable={true}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button type='primary' onClick={handleSubmit} loading={loading}>
              确认
            </Button>
          </Space>
        </div>
      }
    >
      <Divider style={styles.divider} />

      <Form form={form} layout='vertical' initialValues={{ type: 0 }}>
        <Space direction='vertical' style={{ width: '100%' }}>
          {/* 基本信息部分 */}
          <Form.Item
            name='parentId'
            label='上级菜单'
            rules={[
              {
                required: false,
                validator(_rule, value) {
                  if (value && value === currentMenu?.menuId) {
                    return Promise.reject('无法选择自己作为父节点');
                  }
                  return Promise.resolve();
                },
              },
            ]}
            style={styles.formItem}
          >
            {menus.length > 0 ? (
              <TreeSelect
                treeData={menus}
                placeholder='请选择上级菜单'
                treeDefaultExpandAll={false}
                defaultOpen={false}
                allowClear
                style={styles.treeSelect}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                dropdownMatchSelectWidth={false}
                fieldNames={{
                  label: 'title',
                  value: 'menuId',
                  children: 'children',
                }}
              />
            ) : (
              <TreeSelect
                placeholder='加载中...'
                disabled
                style={styles.treeSelect}
              />
            )}
          </Form.Item>

          <Form.Item
            name='type'
            label='菜单类型'
            rules={[{ required: true, message: '请选择菜单类型' }]}
            style={styles.formItem}
          >
            <Radio.Group onChange={handleTypeChange}>
              <Radio value={0}>目录</Radio>
              <Radio value={1}>菜单</Radio>
              <Radio value={2}>按钮</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name='title'
            label='菜单名称'
            rules={[{ required: true, message: '请输入菜单名称' }]}
            style={styles.formItem}
          >
            <Input placeholder='请输入菜单名称' />
          </Form.Item>

          {/* 图标输入框，只有目录和菜单才显示 */}
          {menuType !== 2 && (
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
              tooltip={{
                title: '输入antd图标组件名称，如 UserOutlined',
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input
                placeholder='输入图标名称，如 UserOutlined'
                style={styles.iconInput}
                prefix={<AppstoreOutlined />}
              />
            </Form.Item>
          )}

          {/* 所有类型都需要权限字段 */}
          <Form.Item
            name='code'
            label='权限字段'
            rules={[{ required: true, message: '请输入权限字段' }]}
            style={styles.formItem}
            tooltip={{
              title: '权限字段用于权限控制，例如：sys:user:add',
              icon: <InfoCircleOutlined />,
            }}
          >
            <Input placeholder='请输入权限字段' />
          </Form.Item>

          {/* 路由相关信息，目录和菜单都需要 */}
          {menuType !== 2 && (
            <>
              <Form.Item
                name='menuUrl'
                label='菜单路径'
                rules={[{ required: true, message: '请输入菜单路径' }]}
                style={styles.formItem}
                tooltip={{
                  title: '菜单路径用于路由跳转，例如：/sys/user',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <Input placeholder='请输入菜单路径' />
              </Form.Item>

              <Form.Item
                name='routePath'
                label='路由地址'
                rules={[{ required: true, message: '请输入路由地址' }]}
                style={styles.formItem}
                tooltip={{
                  title: '路由地址用于路由跳转，取值为菜单路径的最后一个词',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <Input placeholder='请输入路由地址' />
              </Form.Item>

              <Form.Item
                name='componentPath'
                label='组件路径'
                rules={[{ required: true, message: '请输入组件路径' }]}
                style={styles.formItem}
                tooltip={{
                  title: '组件路径用于渲染TSX,为该组件在components目录下的路径',
                  icon: <InfoCircleOutlined />,
                }}
              >
                <Input placeholder='请输入组件路径' />
              </Form.Item>
            </>
          )}

          <Form.Item
            name='orderNum'
            label='排序'
            style={styles.formItem}
            tooltip={{ title: '数字越小越靠前', icon: <InfoCircleOutlined /> }}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder='请输入排序号'
            />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
};

export default MenuDrawer;

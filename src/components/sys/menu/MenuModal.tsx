import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, TreeSelect, message } from 'antd';
import * as ICONS from '@ant-design/icons/';
import { getContentList } from '../../../api/sys-service/MenuController';
interface MenuItem {
  menuId: string;
  icon: string;
  title: string;
  code: string;
  name: string;
  menuUrl: string;
  routePath: string;
  componentPath: string;
  type: number;
}

interface MenuModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: MenuItem) => void;
  currentMenu: MenuItem | null;
}

const { Option } = Select;

const MenuModal: React.FC<MenuModalProps> = ({
  visible,
  onCancel,
  onOk,
  currentMenu,
}) => {
  const [form] = Form.useForm();
  // 显示菜单图标
  const antICONS: any = ICONS;
  const [menus, setMenus] = useState<any>();

  // 格式化菜单
  const formatMenus = (menus: any) => {
    return menus.map((menu: any) => ({
      menuId: menu.menu.menuId,
      title: menu.menu.title || '',
      children: menu.children ? formatMenus(menu.children) : '',
    }));
  };

  // 验证菜单图标
  const validateIcon = (_: any, value: string) => {
    if (!value || ICONS[value]) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('请输入正确的菜单图标'));
  };

  useEffect(() => {
    getContentList().then((resp: any) => {
      if (resp.code === 200) {
        setMenus(formatMenus(resp.data));
      } else {
        message.error(resp.msg);
      }
    });

    if (currentMenu) {
      form.setFieldsValue(currentMenu);
    } else {
      form.resetFields();
    }
  }, [currentMenu, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
    } catch (error) {
      console.error('表格验证失败', error);
    }
  };

  return (
    <Modal
      title={currentMenu ? '编辑菜单' : '新增菜单'}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
    >
      <Form form={form} layout='vertical'>
        <Form.Item
          name='parentId'
          label='上级菜单'
          rules={[
            {
              required: false,
              message: '请选择上级菜单',
              validator(rule: any, value: any, callback: any) {
                if (value && value === currentMenu?.menuId) {
                  rule.message = '无法选择自己作为父节点';
                  return Promise.reject();
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <TreeSelect
            treeData={menus}
            placeholder='请选择上级菜单'
            treeDefaultExpandAll
            allowClear
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
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='code'
          label='权限字段'
          rules={[{ required: true, message: '请输入权限字段' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name='type'
          label='菜单类型'
          rules={[{ required: true, message: '请选择菜单类型' }]}
        >
          <Select>
            <Option value={0}>目录</Option>
            <Option value={1}>菜单</Option>
            <Option value={2}>按钮</Option>
          </Select>
        </Form.Item>

        {/* 根据不同的类型显示不同的信息 */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.type !== currentValues.type
          }
        >
          {({ getFieldValue }) =>
            getFieldValue('type') !== 2 && (
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
                >
                  <Input />
                </Form.Item>
                <Form.Item name='menuUrl' label='菜单路径'>
                  <Input />
                </Form.Item>
                <Form.Item name='name' label='路由名称'>
                  <Input />
                </Form.Item>
                <Form.Item
                  name='routePath'
                  label='路由地址'
                  rules={[{ required: true, message: '请输入路由地址' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name='componentPath'
                  label='组件路径'
                  rules={[{ required: true, message: '请输入组件路径' }]}
                >
                  <Input />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
        <Form.Item name='orderNum' label='排序字段'>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MenuModal;

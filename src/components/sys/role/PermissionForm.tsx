// 权限分配表单组件：用于角色权限分配的模态框组件
import React, { useEffect, useState } from 'react';
import { Modal, Form, Checkbox, Tree, TreeProps } from 'antd';
import { listById } from '../../../api/sys-service/MenuController';
import useMessage from 'antd/es/message/useMessage';

// 组件接口定义
const PermissionForm: React.FC<{
  visible: boolean;          // 控制模态框是否可见
  role: any;                 // 当前编辑的角色对象
  permissions: any[];        // 所有可用的权限数据
  onCancel: () => void;      // 取消操作的回调函数
  onSave: (permissions: any) => void;  // 保存权限设置的回调函数
}> = ({ visible, role, permissions, onCancel, onSave }) => {
  // 表单实例
  const [form] = Form.useForm();
  // 消息提示API
  const [messageApi, contextHolder] = useMessage();
  // 当前选中的节点键值（未使用但保留）
  const [selectedKeys] = useState<React.Key[]>([]);
  // 当前选中的复选框键值（实际权限数据）
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  /**
   * 格式化权限数据为Tree组件所需的树形结构
   * @param permissions 服务器返回的权限数据
   * @returns 格式化后的树形结构数据
   */
  const formatPermissions = (permissions: any) => {
    if (!permissions || permissions.length === 0) {
      return [];
    }
    return permissions.map((perm: any) => ({
      title: perm.menu.title,
      key: perm.menu.menuId,
      children: perm.children ? formatPermissions(perm.children) : [],
    }));
  };

  /**
   * 获取指定角色的权限列表
   * @param roleId 角色ID
   */
  const fetchRolePermissions = async (roleId: any) => {
    const response: any = await listById(roleId);
    if (response.code === 200) {
      setCheckedKeys(response.data);
    } else {
      messageApi.error(response.msg);
    }
  };

  /**
   * 处理Tree组件复选框选中状态变化
   * @param checkedKeysValue 新的选中状态
   */
  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue as React.Key[]);
  };

  // 当模态框显示或角色变化时，获取最新的角色权限数据
  useEffect(() => {
    if (visible) {
      fetchRolePermissions(role.roleId);
    }
  }, [visible, role]);
  
  return (
    <Modal
      title={`为 ${role?.roleName || '角色'} 分配权限`}
      visible={visible}
      onOk={() => {
        // 表单验证通过后调用保存回调
        form.validateFields().then(() => {
          onSave(checkedKeys);
          form.resetFields();
        });
      }}
      onCancel={() => {
        // 取消操作时重置表单
        form.resetFields();
        onCancel();
      }}
    >
      {/* 消息提示上下文 */}
      {contextHolder}
      <Form
        form={form}
        layout='vertical'
        initialValues={{ permissions: role?.permissions }}
      >
        <Form.Item name='permissions'>
          {/* 使用Checkbox.Group作为权限选择的容器 */}
          <Checkbox.Group>
            {/* 树形控件用于展示和选择权限层级 */}
            <Tree
              checkable
              defaultExpandAll
              treeData={formatPermissions(permissions)}
              onCheck={onCheck}
              checkedKeys={checkedKeys}
              selectedKeys={selectedKeys}
            />
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionForm;

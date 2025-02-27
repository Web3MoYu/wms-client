import React, { useEffect, useState } from 'react';
import { Modal, Form, Checkbox, Tree, TreeProps } from 'antd';
import { listById } from '../../../api/sys-service/MenuController';
import useMessage from 'antd/es/message/useMessage';

const PermissionForm: React.FC<{
  visible: boolean;
  role: any;
  permissions: any[];
  onCancel: () => void;
  onSave: (permissions: any) => void;
}> = ({ visible, role, permissions, onCancel, onSave }) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = useMessage();
  const [selectedKeys] = useState<React.Key[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const formatPermissions = (permissions: any) => {
    if (permissions.length === 0) {
      return [];
    }
    return permissions.map((perm: any) => ({
      title: perm.menu.title,
      key: perm.menu.menuId,
      children: perm.children ? formatPermissions(perm.children) : [],
    }));
  };

  const fetchRolePermissions = async (roleId: any) => {
    const response: any = await listById(roleId);
    if (response.code === 200) {
      setCheckedKeys(response.data);
    } else {
      messageApi.error(response.msg);
    }
  };

  const onCheck: TreeProps['onCheck'] = (checkedKeysValue) => {
    setCheckedKeys(checkedKeysValue as React.Key[]);
  };

  // 确保每次打开都是最新的数据
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
        form.validateFields().then(() => {
          onSave(checkedKeys);
          form.resetFields();
        });
      }}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
    >
      {contextHolder}
      <Form
        form={form}
        layout='vertical'
        initialValues={{ permissions: role?.permissions }}
      >
        <Form.Item name='permissions'>
          <Checkbox.Group>
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

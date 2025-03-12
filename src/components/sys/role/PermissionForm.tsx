// 权限分配表单组件：用于角色权限分配的模态框组件
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Checkbox,
  Tree,
  TreeProps,
  Typography,
  Divider,
  Space,
} from 'antd';
import { KeyOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { listById } from '../../../api/sys-service/MenuController';
import useMessage from 'antd/es/message/useMessage';

const { Text } = Typography;

// 接口定义
interface PermissionFormProps {
  visible: boolean; // 控制模态框是否可见
  role: any; // 当前编辑的角色对象
  permissions: any[]; // 所有可用的权限数据
  onCancel: () => void; // 取消操作的回调函数
  onSave: (permissions: any) => void; // 保存权限设置的回调函数
}

// 样式常量
const styles = {
  modal: {
    minWidth: '520px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  divider: {
    margin: '12px 0 20px',
  },
  treeContainer: {
    maxHeight: '500px',
    overflow: 'auto',
    padding: '12px',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    marginTop: '8px',
  },
  formItem: {
    marginBottom: '20px',
  },
};

/**
 * 权限分配表单组件
 * 用于分配角色的菜单权限
 */
const PermissionForm: React.FC<PermissionFormProps> = ({
  visible,
  role,
  permissions,
  onCancel,
  onSave,
}) => {
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
  const formatPermissions = useCallback((permissions: any) => {
    if (!permissions || permissions.length === 0) {
      return [];
    }
    return permissions.map((perm: any) => ({
      title: (
        <Space>
          <KeyOutlined />
          <Text>{perm.menu.title}</Text>
        </Space>
      ),
      key: perm.menu.menuId,
      children: perm.children ? formatPermissions(perm.children) : [],
    }));
  }, []);

  /**
   * 获取指定角色的权限列表
   * @param roleId 角色ID
   */
  const fetchRolePermissions = useCallback(
    async (roleId: any) => {
      try {
        const response: any = await listById(roleId);
        if (response.code === 200) {
          setCheckedKeys(response.data);
        } else {
          messageApi.error({
            content: response.msg || '获取角色权限失败',
            icon: <ExclamationCircleOutlined />,
          });
        }
      } catch (error) {
        messageApi.error({
          content: '获取角色权限失败',
          icon: <ExclamationCircleOutlined />,
        });
        console.error('获取角色权限失败', error);
      }
    },
    [messageApi]
  );

  /**
   * 处理Tree组件复选框选中状态变化
   * @param checkedKeysValue 新的选中状态
   */
  const onCheck: TreeProps['onCheck'] = useCallback((checkedKeysValue: any) => {
    setCheckedKeys(checkedKeysValue as React.Key[]);
  }, []);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback(() => {
    form
      .validateFields()
      .then(() => {
        onSave(checkedKeys);
        form.resetFields();
      })
      .catch(() => {
        messageApi.warning('请检查表单是否正确填写');
      });
  }, [form, onSave, checkedKeys, messageApi]);

  /**
   * 处理取消操作
   */
  const handleCancel = useCallback(() => {
    form.resetFields();
    onCancel();
  }, [form, onCancel]);

  // 当模态框显示或角色变化时，获取最新的角色权限数据
  useEffect(() => {
    if (visible && role?.roleId) {
      fetchRolePermissions(role.roleId);
    }
  }, [visible, role, fetchRolePermissions]);

  // 格式化后的权限数据
  const formattedPermissions = formatPermissions(permissions);

  return (
    <Modal
      title={
        <div style={styles.header}>
          <KeyOutlined />
          <Text strong>{`为 ${role?.roleName || '角色'} 分配权限`}</Text>
        </div>
      }
      visible={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      width={650}
      okText='确认'
      cancelText='取消'
      centered
      style={styles.modal}
      maskClosable={false}
      bodyStyle={{ padding: '20px' }}
    >
      {/* 消息提示上下文 */}
      {contextHolder}

      <Divider style={styles.divider} />

      <Form
        form={form}
        layout='vertical'
        initialValues={{ permissions: role?.permissions }}
      >
        <Form.Item
          name='permissions'
          label={<Text strong>请选择权限：</Text>}
          style={styles.formItem}
        >
          {/* 使用Checkbox.Group作为权限选择的容器 */}
          <Checkbox.Group>
            <div style={styles.treeContainer}>
              {/* 树形控件用于展示和选择权限层级 */}
              <Tree
                checkable
                defaultExpandAll={false}
                treeData={formattedPermissions}
                onCheck={onCheck}
                checkedKeys={checkedKeys}
                selectedKeys={selectedKeys}
                blockNode
                showLine={{ showLeafIcon: false }}
              />
            </div>
          </Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionForm;

import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, message, Input } from 'antd';
import RoleForm from './RoleForm';
import PermissionForm from './PermissionForm';
import {
  pageSearch,
  updateRole,
  deleteRole,
  addRole,
  assignRolePermission,
  Role,
} from '../../../api/sys-service/RoleController';
import { getMenuList } from '../../../api/sys-service/MenuController';

const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  // 控制编辑或新增的窗口
  const [isModalVisible, setIsModalVisible] = useState(false);
  // 控制分配权限的窗口
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [searchText, setSearchText] = useState<string>('');
  // 默认的页数
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  useEffect(() => {
    fetchRoles(pagination.current, pagination.pageSize, searchText);
    fetchPermissions();
  }, [editingRole, pagination.current, pagination.pageSize, pagination.total]);

  const fetchRoles = async (
    page: number,
    pageSize: number,
    searchText: string
  ) => {
    const resp: any = await pageSearch(page, pageSize, searchText);
    const data = resp.data;

    setRoles(data.records);
    setPagination({ ...pagination, total: data.total });
  };

  const fetchPermissions = async () => {
    const response: any = await getMenuList();
    setPermissions(response.data);
  };

  const showAddModal = () => {
    setEditingRole(null);
    setIsModalVisible(true);
  };

  const showEditModal = (role: Role) => {
    setEditingRole(role);
    setIsModalVisible(true);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchRoles(1, pagination.pageSize, value);
  };

  const handleDelete = (roleId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '你确定要删除这个角色吗？',
      onOk: async () => {
        const resp: any = await deleteRole(roleId);
        if (resp.code === 200) {
          message.success(resp.msg);
          fetchRoles(pagination.current, pagination.pageSize, searchText);
        } else {
          message.error(resp.msg);
        }
      },
    });
  };

  // 处理分页改变的函数
  const handleTableChange = (arg: any) => {
    setPagination(arg);
  };

  const handleAddOrUpdate = async (role: Role) => {
    if (editingRole) {
      const resp: any = await updateRole(role, role.roleId);
      if (resp.code === 200) {
        message.success(resp.msg);
      } else {
        message.error(resp.msg);
      }
    } else {
      const resp: any = await addRole(role);
      if (resp.code === 200) {
        message.success(resp.msg);
      } else {
        message.error(resp.msg);
      }
    }
    fetchRoles(pagination.current, pagination.pageSize, searchText);
    setIsModalVisible(false);
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Role) => (
        <>
          <Button
            type='link'
            onClick={() => showEditModal(record)}
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
            onClick={async () => {
              setEditingRole(record);
              setIsPermissionModalVisible(true);
            }}
            style={{
              marginRight: 8,
              backgroundColor: '#1890ff',
              color: 'white',
            }}
          >
            分配权限
          </Button>
          <Button
            type='link'
            danger
            onClick={() => handleDelete(record.roleId)}
            style={{ backgroundColor: '#ff4d4f', color: 'white' }}
          >
            删除
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <Button type='primary' onClick={showAddModal}>
        新增
      </Button>
      <Input.Search
        placeholder='输入名称进行搜索'
        onSearch={handleSearch}
        style={{ width: 200 }}
        allowClear
      />
      <Table
        columns={columns}
        dataSource={roles}
        rowKey='roleId'
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true, // 显示每页大小选择器
          pageSizeOptions: [5, 10, 15, 20],
          showQuickJumper: true, // 显示快速跳转
        }}
        onChange={handleTableChange}
      />

      <RoleForm
        visible={isModalVisible}
        role={editingRole}
        onCancel={() => setIsModalVisible(false)}
        onSave={handleAddOrUpdate}
      />

      <PermissionForm
        visible={isPermissionModalVisible}
        role={editingRole || {}}
        permissions={permissions}
        onCancel={() => setIsPermissionModalVisible(false)}
        onSave={async (permissions) => {
          if (editingRole) {
            const resp: any = await assignRolePermission(
              editingRole.roleId,
              permissions
            );
            if (resp.code === 200) {
              message.success('权限分配成功');
              setIsPermissionModalVisible(false);
            } else {
              message.error(resp.msg);
            }
          }
        }}
      />
    </div>
  );
};

export default RoleManager;

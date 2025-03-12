import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Table,
  Modal,
  message,
  Input,
  Card,
  Space,
  Typography,
  Divider,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
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
import type { TablePaginationConfig } from 'antd/es/table';

const { Title } = Typography;

// 常量定义
const PAGE_SIZE_OPTIONS = ['5', '10', '15', '20'];
const DEFAULT_PAGE_SIZE = 5;

// 角色类型常量
const ROLE_TYPES = [
  { value: 0, label: '超级管理员', color: 'red' },
  { value: 1, label: '管理员', color: 'blue' },
  { value: 2, label: '员工', color: 'green' },
];

// 获取角色类型标签
const getRoleTypeTag = (type: number) => {
  const roleType = ROLE_TYPES.find((item) => item.value === type);
  return roleType ? (
    <Tag color={roleType.color}>{roleType.label}</Tag>
  ) : (
    <Tag color='default'>未知类型</Tag>
  );
};

// 样式常量
const styles = {
  card: {
    boxShadow:
      '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
    borderRadius: '8px',
  },
  header: {
    marginBottom: 24,
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  searchInput: {
    width: 250,
  },
  actionButton: {
    borderRadius: '4px',
  },
  editButton: {
    backgroundColor: '#1890ff',
    color: 'white',
    borderColor: '#1890ff',
  },
  permissionButton: {
    backgroundColor: '#52c41a',
    color: 'white',
    borderColor: '#52c41a',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    color: 'white',
    borderColor: '#ff4d4f',
  },
  tableContainer: {
    marginTop: 16,
  },
};

// 扩展Role接口，添加type属性
interface ExtendedRole extends Role {
  type: number;
}

/**
 * 角色管理组件
 */
const RoleManager: React.FC = () => {
  // 状态定义
  const [roles, setRoles] = useState<ExtendedRole[]>([]); // 角色列表数据
  const [permissions, setPermissions] = useState<any[]>([]); // 权限列表数据
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制角色编辑模态框
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false); // 控制权限分配模态框
  const [editingRole, setEditingRole] = useState<ExtendedRole | null>(null); // 当前编辑的角色
  const [searchText, setSearchText] = useState<string>(''); // 搜索关键词
  const [loading, setLoading] = useState<boolean>(false); // 加载状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });

  // 初始化数据和数据更新时的处理
  useEffect(() => {
    fetchRoles(pagination.current, pagination.pageSize, searchText);
    fetchPermissions();
  }, [editingRole, pagination.current, pagination.pageSize, pagination.total]);

  // 获取角色列表数据
  const fetchRoles = useCallback(
    async (page: number, pageSize: number, searchText: string) => {
      try {
        setLoading(true);
        const resp: any = await pageSearch(page, pageSize, searchText);
        const data = resp.data;

        setRoles(data.records);
        setPagination({ ...pagination, total: data.total });
      } catch (error) {
        message.error('获取角色列表失败');
        console.error('获取角色列表失败', error);
      } finally {
        setLoading(false);
      }
    },
    [pagination]
  );

  // 获取权限列表数据
  const fetchPermissions = useCallback(async () => {
    try {
      const response: any = await getMenuList();
      setPermissions(response.data);
    } catch (error) {
      message.error('获取权限列表失败');
      console.error('获取权限列表失败', error);
    }
  }, []);

  // 显示新增角色模态框
  const showAddModal = useCallback(() => {
    setEditingRole(null);
    setIsModalVisible(true);
  }, []);

  // 显示编辑角色模态框
  const showEditModal = useCallback((role: ExtendedRole) => {
    setEditingRole(role);
    setIsModalVisible(true);
  }, []);

  // 处理搜索
  const handleSearch = useCallback(
    (value: string) => {
      setSearchText(value);
      fetchRoles(1, pagination.pageSize, value);
    },
    [fetchRoles, pagination.pageSize]
  );

  // 处理删除角色
  const handleDelete = useCallback(
    (roleId: string, roleName: string) => {
      Modal.confirm({
        title: '确认删除',
        icon: <ExclamationCircleOutlined />,
        content: `你确定要删除角色 "${roleName}" 吗？此操作不可恢复！`,
        okText: '确认',
        cancelText: '取消',
        okType: 'danger',
        onOk: async () => {
          try {
            const resp: any = await deleteRole(roleId);
            if (resp.code === 200) {
              message.success(resp.msg || '删除成功');
              fetchRoles(pagination.current, pagination.pageSize, searchText);
            } else {
              message.error(resp.msg || '删除失败');
            }
          } catch (error) {
            message.error('删除失败');
            console.error('删除失败', error);
          }
        },
      });
    },
    [fetchRoles, pagination.current, pagination.pageSize, searchText]
  );

  // 处理表格分页变化
  const handleTableChange = useCallback(
    (newPagination: TablePaginationConfig) => {
      setPagination({
        current: newPagination.current || 1,
        pageSize: newPagination.pageSize || DEFAULT_PAGE_SIZE,
        total: pagination.total,
      });
    },
    [pagination.total]
  );

  // 处理角色新增或更新
  const handleAddOrUpdate = useCallback(
    async (role: ExtendedRole) => {
      try {
        if (editingRole) {
          // 更新现有角色
          const resp: any = await updateRole(role, role.roleId);
          if (resp.code === 200) {
            message.success(resp.msg || '更新成功');
          } else {
            message.error(resp.msg || '更新失败');
          }
        } else {
          // 新增角色
          const resp: any = await addRole(role);
          if (resp.code === 200) {
            message.success(resp.msg || '新增成功');
          } else {
            message.error(resp.msg || '新增失败');
          }
        }
        fetchRoles(pagination.current, pagination.pageSize, searchText);
        setIsModalVisible(false);
      } catch (error) {
        message.error(editingRole ? '更新失败' : '新增失败');
        console.error('操作失败', error);
      }
    },
    [
      editingRole,
      fetchRoles,
      pagination.current,
      pagination.pageSize,
      searchText,
    ]
  );

  // 处理分配权限
  const handleAssignPermission = useCallback(
    async (roleId: string, permissions: any[]) => {
      try {
        const resp: any = await assignRolePermission(roleId, permissions);
        if (resp.code === 200) {
          message.success('权限分配成功');
          setIsPermissionModalVisible(false);
        } else {
          message.error(resp.msg || '权限分配失败');
        }
      } catch (error) {
        message.error('权限分配失败');
        console.error('权限分配失败', error);
      }
    },
    []
  );

  // 显示分配权限模态框
  const showPermissionModal = useCallback((role: ExtendedRole) => {
    setEditingRole(role);
    setIsPermissionModalVisible(true);
  }, []);

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key: 'roleName',
      ellipsis: true,
    },
    {
      title: '角色类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: number) => getRoleTypeTag(type),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 360,
      render: (_: any, record: ExtendedRole) => (
        <Space size={8} wrap>
          <Button
            type='primary'
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            style={{ ...styles.actionButton, ...styles.editButton }}
            size="middle"
          >
            编辑
          </Button>
          <Button
            type='primary'
            icon={<KeyOutlined />}
            onClick={() => showPermissionModal(record)}
            style={{ ...styles.actionButton, ...styles.permissionButton }}
            size="middle"
          >
            分配权限
          </Button>
          <Button
            type='primary'
            danger={record.type !== 0}
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.roleId, record.roleName)}
            style={{
              ...styles.actionButton,
              ...(record.type === 0
                ? {
                    backgroundColor: '#d9d9d9',
                    borderColor: '#d9d9d9',
                    color: 'rgba(0, 0, 0, 0.25)',
                  }
                : styles.deleteButton),
            }}
            disabled={record.type === 0}
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
      <Title level={4} style={styles.header}>
        角色管理
      </Title>
      <Divider />

      <div style={styles.actionBar}>
        <Button type='primary' icon={<PlusOutlined />} onClick={showAddModal}>
          新增角色
        </Button>

        <Input.Search
          placeholder='输入角色名称搜索'
          onSearch={handleSearch}
          style={styles.searchInput}
          allowClear
          enterButton
          prefix={<SearchOutlined />}
        />
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        rowKey='roleId'
        loading={loading}
        style={styles.tableContainer}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        bordered
        size='middle'
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
        onSave={(permissions) => {
          if (editingRole) {
            handleAssignPermission(editingRole.roleId, permissions);
          }
        }}
      />
    </Card>
  );
};

export default RoleManager;

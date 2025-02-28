import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Space,
  Button,
  Input,
  Form,
  Card,
  message,
  Avatar,
  Modal,
  Typography
} from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import {
  getUsers,
  User,
  addUser,
  updateUser,
  deleteUser,
} from '../../../api/sys-service/UserController';
import type { TableProps, TablePaginationConfig } from 'antd';
import UserForm from './UserForm';

const { Title } = Typography;

// 常量定义
const GENDER_LABELS = ['女', '男'];
const PAGE_SIZE_OPTIONS = ['5', '10', '20'];
const DEFAULT_PAGE_SIZE = 5;

// 接口定义
interface Params {
  current?: number;
  pageSize?: number;
  nickName?: string;
  realName?: string;
}

// 样式常量
const styles = {
  card: {
    boxShadow: '0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09)',
    borderRadius: '8px'
  },
  searchForm: {
    marginBottom: '24px'
  },
  table: {
    marginTop: '16px',
  },
  avatar: (hasAvatar: boolean) => ({
    backgroundColor: hasAvatar ? 'transparent' : '#1890ff',
    cursor: 'pointer',
  }),
  actionButton: {
    fontSize: '14px',
  }
};

const UserManager: React.FC = () => {
  // 状态定义
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  });
  const [searchForm] = Form.useForm();

  // 获取用户数据
  const fetchData = useCallback(async (params: Params = {}) => {
    try {
      setLoading(true);
      const response: any = await getUsers(
        params.current || pagination.current,
        params.pageSize || pagination.pageSize,
        params.nickName || '',
        params.realName || ''
      );

      if (response.code === 200) {
        setData(response.data.records);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
          current: params.current || prev.current,
          pageSize: params.pageSize || prev.pageSize,
        }));
      }
    } catch (error: any) {
      console.log('获取用户数据失败', error);
      message.error('获取用户数据失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理搜索
  const handleSearch = useCallback((values: { nickName?: string, realName?: string }) => {
    fetchData({
      current: 1,
      pageSize: pagination.pageSize,
      ...values,
    });
  }, [fetchData, pagination.pageSize]);

  // 处理表格分页变化
  const handleTableChange: TableProps<User>['onChange'] = useCallback((
    newPagination: TablePaginationConfig
  ) => {
    fetchData({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      nickName: searchForm.getFieldValue('nickName'),
      realName: searchForm.getFieldValue('realName'),
    });
  }, [fetchData, searchForm]);

  // 添加用户
  const handleAdd = useCallback(() => {
    setModalTitle('添加用户');
    setCurrentUser(undefined);
    setModalVisible(true);
  }, []);

  // 编辑用户
  const handleEdit = useCallback((record: User) => {
    setModalTitle('编辑用户');
    setCurrentUser(record);
    setModalVisible(true);
  }, []);

  // 表单提交
  const handleFormSubmit = useCallback(async (values: any) => {
    try {
      setConfirmLoading(true);
      const response: any = await (currentUser
        ? updateUser({ ...values }, currentUser.userId)
        : addUser(values));

      if (response.code === 200) {
        message.success({
          content: currentUser ? '更新成功' : '创建成功',
          icon: <UserOutlined />,
        });
        setModalVisible(false);
        fetchData();
      } else {
        message.error(response.msg);
      }
    } catch (error: any) {
      console.log('操作失败', error);
      message.error(currentUser ? '更新失败' : '创建失败');
    } finally {
      setConfirmLoading(false);
    }
  }, [currentUser, fetchData]);

  // 删除用户
  const handleDelete = useCallback((record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${record.nickName}" 吗？此操作不可恢复！`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response: any = await deleteUser(record.userId);
          if (response.code === 200) {
            message.success({
              content: '删除成功',
              icon: <DeleteOutlined />,
            });
            fetchData();
          } else {
            message.error(response.msg || '删除失败');
          }
        } catch (error: any) {
          console.log('删除失败', error);
          message.error('删除失败');
        }
      },
    });
  }, [fetchData]);

  // 表格列定义
  const columns: TableProps<User>['columns'] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      render: (avatar) => (
        <Avatar
          size="large"
          src={avatar}
          icon={!avatar && <UserOutlined />}
          style={styles.avatar(!!avatar)}
        />
      ),
      width: '8%',
      align: 'center',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      width: '10%',
      ellipsis: true,
      render: (text) => text || '未设置'
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      width: '10%',
      ellipsis: true,
    },
    {
      title: '性别',
      dataIndex: 'sex',
      width: '8%',
      render: (value: number) => GENDER_LABELS[value],
      align: 'center',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={styles.actionButton}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record)}
            style={styles.actionButton}
          >
            删除
          </Button>
        </Space>
      ),
      width: '15%',
      align: 'center',
    },
  ];

  return (
    <Card style={styles.card}>
      <Title level={4} style={{ marginBottom: 24 }}>用户管理</Title>
      
      <Form 
        form={searchForm} 
        layout="inline" 
        onFinish={handleSearch}
        style={styles.searchForm}
      >
        <Form.Item name="nickName" label="昵称">
          <Input 
            placeholder="请输入昵称" 
            allowClear 
            prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
          />
        </Form.Item>
        <Form.Item name="realName" label="真实姓名">
          <Input 
            placeholder="请输入真实姓名" 
            allowClear 
            prefix={<IdcardOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              htmlType="submit"
              loading={loading}
            >
              搜索
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              添加用户
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        style={styles.table}
        columns={columns}
        rowKey="userId"
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          showTotal: (total) => `共 ${total} 条`,
          size: "default",
          showQuickJumper: true,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
        rowClassName={() => 'table-row'}
      />

      <UserForm
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        initialValues={currentUser}
        title={modalTitle}
        confirmLoading={confirmLoading}
      />
    </Card>
  );
};

export default UserManager;

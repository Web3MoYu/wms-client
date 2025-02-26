import { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Form, Card, message, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import {
  getUsers,
  User,
  addUser,
  updateUser,
} from '../../../api/sys-service/UserController';
import type { TableProps } from 'antd';
import UserForm from './UserForm';

interface Params {
  current?: number;
  pageSize?: number;
  nickName?: string;
}

const UserManager = () => {
  const tsex = ['女', '男'];
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [searchForm] = Form.useForm();

  const fetchData = async (params: Params = {}) => {
    try {
      setLoading(true);
      const response: any = await getUsers(
        params.current || pagination.current,
        params.pageSize || pagination.pageSize,
        params.nickName || ''
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
    } catch (error) {
      message.error('获取用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (values: { nickName?: string }) => {
    fetchData({
      current: 1,
      pageSize: pagination.pageSize,
      ...values,
    });
  };

  const handleTableChange: TableProps<User>['onChange'] = (pagination) => {
    fetchData({
      current: pagination.current,
      pageSize: pagination.pageSize,
      nickName: searchForm.getFieldValue('nickName'),
    });
  };

  const handleAdd = () => {
    setModalTitle('添加用户');
    setCurrentUser(undefined);
    setModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setModalTitle('编辑用户');
    setCurrentUser(record);
    setModalVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setConfirmLoading(true);
      const response = await (currentUser
        ? updateUser({ ...values }, currentUser.userId)
        : addUser(values));

      if (response.code === 200) {
        message.success(currentUser ? '更新成功' : '创建成功');
        setModalVisible(false);
        fetchData();
      }
    } catch {
      message.error(currentUser ? '更新失败' : '创建失败');
    } finally {
      setConfirmLoading(false);
    }
  };

  const columns: TableProps<User>['columns'] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      render: (avatar) => (
        <Avatar
          src={avatar}
          icon={avatar && <UserOutlined />}
          style={{
            backgroundColor: avatar ? 'transparent' : '#1890ff',
            cursor: 'pointer',
          }}
        />
      ),
      width: '10%',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: '10%',
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      width: '10%',
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      width: '10%',
    },
    {
      title: '性别',
      dataIndex: 'sex',
      width: '10%',
      render: (value: any) => <>{tsex[value]}</>,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: '10%',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: '10%',
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button type='link' onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type='link' danger>
            删除
          </Button>
        </Space>
      ),
      width: '10%',
    },
  ];

  return (
    <Card>
      <Form form={searchForm} layout='inline' onFinish={handleSearch}>
        <Form.Item name='nickName' label='昵称'>
          <Input placeholder='请输入昵称' allowClear />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type='primary'
              icon={<SearchOutlined />}
              htmlType='submit'
              loading={loading}
            >
              搜索
            </Button>
            <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
              添加用户
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        style={{ marginTop: 16 }}
        columns={columns}
        rowKey='userId'
        dataSource={data}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
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

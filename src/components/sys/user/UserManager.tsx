import { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Form, Card, message, Avatar } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { getUsers, User } from '../../../api/sys-service/UserController';
import type { TableProps } from 'antd';

interface Params {
  current?: number;
  pageSize?: number;
  nickName?: string;
}

const UserManager = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
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
      render: () => (
        <Space>
          <Button type='link'>编辑</Button>
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
          <Button
            type='primary'
            icon={<SearchOutlined />}
            htmlType='submit'
            loading={loading}
          >
            搜索
          </Button>
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
    </Card>
  );
};

export default UserManager;

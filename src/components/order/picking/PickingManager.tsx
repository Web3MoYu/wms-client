import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Form,
  Input,
  Button,
  Select,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
import {
  PickingOrder,
  PickingOrderVo,
  pickingPage,
} from '../../../api/order-service/PickingController';
import { getUsersByName, User } from '../../../api/sys-service/UserController';
import userStore from '../../../store/userStore';
import {
  renderPickingStatus,
  PickingStatusSelect,
} from '../../order/components/StatusComponents';
import PickingDetailDrawer from './components/PickingDetailDrawer';

// 创建store实例
const userStoreInstance = new userStore();

const { Option } = Select;

const PickingManager: React.FC = () => {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [pickingData, setPickingData] = useState<PickingOrder[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();

  // 用户搜索相关状态
  const [pickerOptions, setPickerOptions] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    realName: string;
  } | null>(null);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 抽屉相关状态
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [selectedPickingOrder, setSelectedPickingOrder] =
    useState<PickingOrderVo | null>(null);
  const [activeTab, setActiveTab] = useState<string>('1');

  // 初始化 - 获取当前登录用户信息
  useEffect(() => {
    // 从userStore中获取真实的当前用户信息
    const storeUser = userStoreInstance.user;
    const currentUserInfo = {
      userId: storeUser.userId,
      realName: storeUser.realName || userStoreInstance.username,
    };

    setCurrentUser(currentUserInfo);

    // 设置当前用户为可选项
    setPickerOptions([currentUserInfo as unknown as User]);

    // 设置默认值：拣货员为当前用户
    const initialValues: any = {
      picker: currentUserInfo.userId,
      createTimeAsc: false,
    };

    // 设置表单初始值
    form.setFieldsValue(initialValues);

    // 执行第一次查询
    fetchPickingData();
  }, [form]);

  // 监听分页变化
  useEffect(() => {
    fetchPickingData();
  }, [pagination.current, pagination.pageSize]);

  // 查询拣货数据
  const fetchPickingData = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();

      const queryDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        pickingNo: values.pickingNo || '',
        picker: values.picker || '',
        status: values.status !== undefined ? values.status : null,
        totalOrdersAsc:
          values.totalOrdersAsc !== undefined ? values.totalOrdersAsc : false,
        totalItemsAsc:
          values.totalItemsAsc !== undefined ? values.totalItemsAsc : false,
        totalQuantityAsc:
          values.totalQuantityAsc !== undefined
            ? values.totalQuantityAsc
            : false,
        createTimeAsc:
          values.createTimeAsc !== undefined ? values.createTimeAsc : false,
        _t: new Date().getTime(),
      };

      const result = await pickingPage(queryDto);

      if (result.code === 200) {
        const data = result.data || { records: [], total: 0 };
        // 确保records数据中包含pickingUser字段
        const records = data.records.map((item: any) => ({
          ...item,
          pickingUser: item.pickingUser || {},
        })) as PickingOrderVo[];

        setPickingData(records);
        setTotal(data.total);
      } else {
        message.error(result.msg || '获取拣货列表失败');
      }
    } catch (error) {
      console.error('获取拣货列表失败:', error);
      message.error('获取拣货列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格分页、排序、筛选变化时的回调
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    // 处理排序
    if (sorter && sorter.field) {
      // 重置所有排序字段为null
      form.setFieldsValue({
        createTimeAsc: null,
        totalOrdersAsc: null,
        totalItemsAsc: null,
        totalQuantityAsc: null,
      });

      // 设置当前排序字段
      const field = sorter.field;
      if (field === 'createTime') {
        form.setFieldsValue({ createTimeAsc: sorter.order === 'ascend' });
      } else if (field === 'totalOrders') {
        form.setFieldsValue({ totalOrdersAsc: sorter.order === 'ascend' });
      } else if (field === 'totalItems') {
        form.setFieldsValue({ totalItemsAsc: sorter.order === 'ascend' });
      } else if (field === 'totalQuantity') {
        form.setFieldsValue({ totalQuantityAsc: sorter.order === 'ascend' });
      }
    }

    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });

    // 只有切换分页时才会自动触发fetchPickingData，排序时需要手动触发
    if (sorter && sorter.field) {
      fetchPickingData();
    }
  };

  // 防抖搜索拣货员
  const handlePickerSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      // 当搜索框为空时，仍然保留当前用户作为选项
      setPickerOptions(currentUser ? [currentUser as User] : []);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setPickerOptions(res.data);
      }
    } catch (error) {
      console.error('搜索拣货员失败:', error);
    }
  }, 500);

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchPickingData();
  };

  // 重置表单
  const handleReset = () => {
    // 先重置表单（清空所有表单值）
    form.resetFields();

    // 设置默认值
    form.setFieldsValue({
      createTimeAsc: false,
      totalOrdersAsc: false,
      totalItemsAsc: false,
      totalQuantityAsc: false,
    });

    // 如果当前用户存在，设置为默认拣货员
    if (currentUser) {
      form.setFieldsValue({
        picker: currentUser.userId,
      });
    }

    // 重置分页
    setPagination({
      current: 1,
      pageSize: 10,
    });

    // 最后获取数据
    fetchPickingData();
  };

  // 打开抽屉查看详情
  const handleViewDetail = (record: PickingOrderVo, tabKey: string = '1') => {
    setSelectedPickingOrder(record);
    setActiveTab(tabKey);
    setDrawerVisible(true);
  };

  // 处理关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedPickingOrder(null);
    setActiveTab('1'); // 重置为默认标签页
  };

  // 刷新拣货数据
  const refreshData = () => {
    fetchPickingData();
  };

  // 表格列定义
  const columns = [
    {
      title: '拣货单号',
      dataIndex: 'pickingNo',
      key: 'pickingNo',
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: '订单数量',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: true,
    },
    {
      title: '商品种类',
      dataIndex: 'totalItems',
      key: 'totalItems',
      sorter: true,
    },
    {
      title: '总数量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      sorter: true,
    },
    {
      title: '拣货员',
      dataIndex: 'pickingUser',
      key: 'pickingUser',
      render: (pickingUser: User) => pickingUser?.realName || '-',
    },
    {
      title: '拣货状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => renderPickingStatus(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      sorter: true,
      render: (text: string) =>
        text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size='middle'>
          <a onClick={() => handleViewDetail(record)}>查看详情</a>
          {record.status === 0 && (
            <a onClick={() => handleViewDetail(record, '2')}>开始拣货</a>
          )}
          {record.status === 1 && (
            <a onClick={() => handleViewDetail(record, '2')}>继续拣货</a>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='picking-manager'>
      <Card>
        <Form form={form} layout='horizontal' onFinish={handleSearch}>
          {/* 隐藏的排序字段 */}
          <Form.Item name='createTimeAsc' hidden>
            <Input />
          </Form.Item>
          <Form.Item name='totalOrdersAsc' hidden>
            <Input />
          </Form.Item>
          <Form.Item name='totalItemsAsc' hidden>
            <Input />
          </Form.Item>
          <Form.Item name='totalQuantityAsc' hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='pickingNo' label='拣货单号'>
                <Input placeholder='请输入拣货单号' allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='status' label='拣货状态'>
                <PickingStatusSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='picker' label='拣货员'>
                <Select
                  showSearch
                  placeholder='请输入拣货员姓名'
                  filterOption={false}
                  onSearch={handlePickerSearch}
                  allowClear
                >
                  {pickerOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type='primary'
                  htmlType='submit'
                  icon={<SearchOutlined />}
                >
                  查询
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={pickingData}
          rowKey='id'
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            pageSizeOptions: [5, 10, 20, 50, 100],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 拣货详情抽屉 */}
      <PickingDetailDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        pickingOrder={selectedPickingOrder}
        activeTab={activeTab}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default PickingManager;

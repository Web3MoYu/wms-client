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
  DatePicker,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
// 导入中文语言包
import locale from 'antd/es/date-picker/locale/zh_CN';
import { queryOrders, OrderVo } from '../../api/order-service/OrderController';
import { getUsersByName, User } from '../../api/sys-service/UserController';
import OrderDrawer from './OrderDrawer';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 修改 OrderQueryDto 类型，使日期字段为字符串类型
interface OrderQueryDtoWithStringDates {
  page: number;
  pageSize: number;
  orderType: number;
  orderNo: string;
  inspectionStatus: number;
  creatorId: string;
  approverId: string;
  inspectorId: string;
  startTime: string; // 改为字符串类型
  endTime: string; // 改为字符串类型
  createTimeAsc: boolean;
}

export default function OrderManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();

  // 用户搜索相关状态
  const [creatorOptions, setCreatorOptions] = useState<User[]>([]);
  const [approverOptions, setApproverOptions] = useState<User[]>([]);
  const [inspectorOptions, setInspectorOptions] = useState<User[]>([]);

  // 新增订单抽屉状态
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 初始化
  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize]);

  // 监听orders状态变化，确保UI更新
  useEffect(() => {
  }, [orders]);

  // 查询订单数据
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();
      // 处理日期范围
      let startTime: string = '1970-01-01 00:00:00'; // 默认起始时间
      let endTime: string = moment().format('YYYY-MM-DD HH:mm:ss'); // 默认当前时间

      if (values.dateRange && values.dateRange.length === 2) {
        // 直接格式化为字符串，格式为 yyyy-MM-dd HH:mm:ss
        startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      const queryDto: OrderQueryDtoWithStringDates = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        orderType: values.orderType !== undefined ? values.orderType : null,
        orderNo: values.orderNo || '',
        inspectionStatus:
          values.inspectionStatus !== undefined
            ? values.inspectionStatus
            : null,
        creatorId: values.creatorId || '',
        approverId: values.approverId || '',
        inspectorId: values.inspectorId || '',
        startTime: startTime, // 直接使用字符串格式
        endTime: endTime, // 直接使用字符串格式
        createTimeAsc: false, // 默认降序，最新的在前面
      };

      const result = await queryOrders(queryDto as any); // 类型断言为任意类型，以兼容原接口

      if (result.code === 200) {
        setOrders(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取订单列表失败');
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      message.error('获取订单列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格分页、排序、筛选变化时的回调
  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // 防抖搜索创建人
  const handleCreatorSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setCreatorOptions([]);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setCreatorOptions(res.data);
      }
    } catch (error) {
      console.error('搜索创建人失败:', error);
    }
  }, 500);

  // 防抖搜索审批人
  const handleApproverSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setApproverOptions([]);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setApproverOptions(res.data);
      }
    } catch (error) {
      console.error('搜索审批人失败:', error);
    }
  }, 500);

  // 防抖搜索质检员
  const handleInspectorSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setInspectorOptions([]);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setInspectorOptions(res.data);
      }
    } catch (error) {
      console.error('搜索质检员失败:', error);
    }
  }, 500);

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchOrders();
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setPagination({
      current: 1,
      pageSize: 10,
    });
    fetchOrders();
  };

  // 打开新增订单抽屉
  const handleAddOrder = () => {
    setDrawerVisible(true);
  };

  // 关闭新增订单抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    // 在抽屉关闭后，延迟500ms再次刷新表格数据
    fetchOrders();
  };

  // 新增订单成功后刷新列表
  const handleOrderSuccess = () => {
    fetchOrders();
  };

  // 订单状态渲染
  const renderOrderStatus = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color='blue'>待审核</Tag>;
      case 1:
        return <Tag color='green'>已审核</Tag>;
      case 2:
        return <Tag color='orange'>部分完成</Tag>;
      case 3:
        return <Tag color='green'>已完成</Tag>;
      case -1:
        return <Tag color='red'>已取消</Tag>;
      default:
        return <Tag color='default'>未知状态</Tag>;
    }
  };

  // 质检状态渲染
  const renderQualityStatus = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color='default'>未质检</Tag>;
      case 1:
        return <Tag color='green'>质检通过</Tag>;
      case 2:
        return <Tag color='red'>质检不通过</Tag>;
      default:
        return <Tag color='default'>未知状态</Tag>;
    }
  };

  // 订单类型渲染
  const renderOrderType = (type: number) => {
    return type === 1 ? (
      <Tag color='blue'>入库订单</Tag>
    ) : (
      <Tag color='orange'>出库订单</Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      render: renderOrderType,
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator: User) => creator?.realName || '-',
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
      render: (approver: User) => approver?.realName || '-',
    },
    {
      title: '质检员',
      dataIndex: 'inspector',
      key: 'inspector',
      render: (inspector: User) => inspector?.realName || '-',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '总数量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: renderOrderStatus,
    },
    {
      title: '质检状态',
      dataIndex: 'qualityStatus',
      key: 'qualityStatus',
      render: renderQualityStatus,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) =>
        text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size='middle'>
          <a>查看详情</a>
        </Space>
      ),
    },
  ];

  return (
    <div className='order-manager'>
      <Card>
        <Form form={form} layout='horizontal' onFinish={handleSearch}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='orderNo' label='订单编号'>
                <Input placeholder='请输入订单编号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='orderType' label='订单类型'>
                <Select placeholder='请选择订单类型' allowClear>
                  <Option value={1}>入库订单</Option>
                  <Option value={0}>出库订单</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='inspectionStatus' label='质检状态'>
                <Select placeholder='请选择质检状态' allowClear>
                  <Option value={0}>未质检</Option>
                  <Option value={1}>质检通过</Option>
                  <Option value={2}>质检不通过</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='dateRange' label='创建时间'>
                <RangePicker
                  style={{ width: '100%' }}
                  locale={locale}
                  placeholder={['开始日期', '结束日期']}
                  showTime={{ format: 'HH:mm:ss' }}
                  format='YYYY-MM-DD HH:mm:ss'
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='creatorId' label='创建人'>
                <Select
                  showSearch
                  placeholder='请输入创建人姓名'
                  filterOption={false}
                  onSearch={handleCreatorSearch}
                  allowClear
                >
                  {creatorOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='approverId' label='审批人'>
                <Select
                  showSearch
                  placeholder='请输入审批人姓名'
                  filterOption={false}
                  onSearch={handleApproverSearch}
                  allowClear
                >
                  {approverOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='inspectorId' label='质检员'>
                <Select
                  showSearch
                  placeholder='请输入质检员姓名'
                  filterOption={false}
                  onSearch={handleInspectorSearch}
                  allowClear
                >
                  {inspectorOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'right' }}>
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
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type='primary'
            icon={<PlusOutlined />}
            onClick={handleAddOrder}
          >
            新增订单
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={orders}
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

      {/* 新增订单抽屉 */}
      <OrderDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        onSuccess={handleOrderSuccess}
        currentUserId='admin' // 这里应该传入当前登录用户的ID
      />
    </div>
  );
}

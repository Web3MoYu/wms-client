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
  Modal,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
// 导入中文语言包
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  queryOrders,
  OrderVo,
  cancel,
  receiveGoods,
  doneOutBound,
} from '../../../api/order-service/OrderController';
import {
  batchAddPickings,
  BatchAddPickingDto,
} from '../../../api/order-service/PickingController';
import { getUsersByName, User } from '../../../api/sys-service/UserController';
import AddOrderDrawer from './AddOrderDrawer';
import OrderDetailDrawer from './OrderDetailDrawer';
import {
  renderOrderStatus,
  renderQualityStatus,
  renderOrderType,
  OrderStatusSelect,
  QualityStatusSelect,
  OrderTypeSelect,
} from '../components/StatusComponents';
import { useLocation } from 'react-router-dom';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Text } = Typography;

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
  status: number; // 状态：0-待审核，1-审批通过，2-部分完成，3-已完成，-1-已取消
}

export default function OrderManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [orders, setOrders] = useState<OrderVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();
  const location = useLocation();

  // 用户搜索相关状态
  const [creatorOptions, setCreatorOptions] = useState<User[]>([]);
  const [approverOptions, setApproverOptions] = useState<User[]>([]);
  const [inspectorOptions, setInspectorOptions] = useState<User[]>([]);
  const [pickerOptions, setPickerOptions] = useState<User[]>([]);
  const [selectedPicker, setSelectedPicker] = useState<string>('');
  const [pickingRemark, setPickingRemark] = useState<string>(''); // 新增备注状态

  // 新增订单抽屉状态
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

  // 订单详情抽屉状态
  const [detailDrawerVisible, setDetailDrawerVisible] =
    useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<OrderVo | null>(null);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 添加选择行的状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 添加Modal显示状态
  const [batchPickingModalVisible, setBatchPickingModalVisible] =
    useState<boolean>(false);
  const [singlePickingModalVisible, setSinglePickingModalVisible] =
    useState<boolean>(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [modalConfirmLoading, setModalConfirmLoading] =
    useState<boolean>(false);

  // 初始化
  useEffect(() => {
    // 设置默认状态为待审核(0)
    form.setFieldsValue({
      status: null,
      createTimeAsc: false,
    });

    // 从URL中获取查询参数
    const query = new URLSearchParams(location.search);
    const orderNoFromQuery = query.get('orderNo');

    // 如果URL中有orderNo参数，则填入表单并执行搜索
    if (orderNoFromQuery) {
      form.setFieldsValue({
        orderNo: orderNoFromQuery,
      });
    }

    fetchOrders();

    // 如果是从其他页面点击进来的（有参数），则修改URL但不触发导航
    if (orderNoFromQuery) {
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, [location]);

  // 监听orders状态变化，确保UI更新
  useEffect(() => {}, [orders]);

  // 监听分页变化
  useEffect(() => {
    fetchOrders();
  }, [pagination.current, pagination.pageSize]);

  // 查询订单数据
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();
      // 处理日期范围
      let startTime = null;
      let endTime = null;

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
        startTime: startTime,
        endTime: endTime,
        createTimeAsc:
          values.createTimeAsc !== undefined ? values.createTimeAsc : false,
        status: values.status !== undefined ? values.status : null, // 允许status为null
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
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    // 处理排序
    if (sorter && sorter.field === 'createTime') {
      // 设置createTimeAsc表单值
      form.setFieldsValue({
        createTimeAsc: sorter.order === 'ascend',
      });
    }

    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });

    // 只有切换分页时才会自动触发fetchOrders，排序时需要手动触发
    if (sorter && sorter.field === 'createTime') {
      fetchOrders();
    }
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

  // 防抖搜索分拣人员 - 保留模糊搜索功能
  const handlePickerSearch = debounce(async (name: string) => {
    // 确保即使是空字符串也触发搜索
    try {
      const res = await getUsersByName(name);

      if (res.code === 200) {
        setPickerOptions(res.data);
      }
    } catch (error) {
      console.error('搜索分拣人员失败:', error);
    }
  }, 300); // 减少延迟时间以提高响应速度

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
    // 先重置表单（清空所有表单值）
    form.resetFields();
    // 然后设置默认值
    form.setFieldsValue({
      status: null,
      createTimeAsc: false,
    });
    // 重置分页
    setPagination({
      current: 1,
      pageSize: 10,
    });
    // 最后获取数据
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

  // 打开订单详情抽屉
  const handleViewDetail = (order: OrderVo) => {
    setCurrentOrder(order);
    setDetailDrawerVisible(true);
  };

  // 关闭订单详情抽屉
  const handleCloseDetailDrawer = () => {
    setDetailDrawerVisible(false);
    setCurrentOrder(null);
  };

  // 取消订单
  const handleCancelOrder = (record: OrderVo) => {
    // 只有待审核、审批通过或入库中的订单可以取消
    if (record.status !== 0 && record.status !== 1 && record.status !== 2) {
      message.error('只有待审核、审批通过或入库中的订单可以取消');
      return;
    }

    // 弹出确认取消对话框
    let remark = '';
    Modal.confirm({
      title: '确定要取消该订单吗？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Text type='warning'>警告：订单取消后将无法恢复，请谨慎操作！</Text>
          <div style={{ marginTop: 10 }}>
            <TextArea
              rows={3}
              placeholder='请输入取消原因（必填）'
              onChange={(e) => (remark = e.target.value)}
            />
          </div>
        </div>
      ),
      okText: '确认取消',
      cancelText: '返回',
      onOk: async () => {
        if (!remark.trim()) {
          message.error('请输入取消原因');
          return Promise.reject('请输入取消原因');
        }

        try {
          setLoading(true);
          const result = await cancel(record.id, record.type, remark);
          if (result.code === 200) {
            message.success('订单已成功取消');
            // 刷新订单列表
            fetchOrders();
          } else {
            message.error(result.msg || '取消订单失败');
          }
        } catch (error) {
          console.error('取消订单失败:', error);
          message.error('取消订单失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 处理收货
  const handleReceiveGoods = (record: OrderVo) => {
    // 只有审批通过的订单才能收货
    if (record.status !== 1) {
      message.error('只有审批通过的订单才能收货');
      return;
    }

    // 弹出确认收货对话框
    Modal.confirm({
      title: '确定要收货吗？',
      icon: <InboxOutlined />,
      content: (
        <div>
          <Text type='warning'>
            警告：一旦提交不可修改，请确认货物已全部到达！
          </Text>
        </div>
      ),
      okText: '确认收货',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await receiveGoods(record.id, record.type);
          if (result.code === 200) {
            message.success('收货成功');
            // 刷新订单列表
            fetchOrders();
          } else {
            message.error(result.msg || '收货失败');
          }
        } catch (error) {
          console.error('收货失败:', error);
          message.error('收货失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 处理批量拣货
  const handleBatchPicking = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要拣货的订单');
      return;
    }

    // 验证所选订单都符合拣货条件（出库且已审批通过）
    const invalidOrders = orders.filter(
      (order) =>
        selectedRowKeys.includes(order.id) &&
        (order.type !== 0 || order.status !== 1)
    );

    if (invalidOrders.length > 0) {
      message.error('只能对审批通过的出库订单进行拣货操作');
      return;
    }

    // 重置选择的分拣人员
    setSelectedPicker('');
    setPickerOptions([]);

    // 打开批量拣货Modal
    setBatchPickingModalVisible(true);
  };

  // 处理单个订单拣货
  const handleSinglePicking = (orderId: string) => {
    // 重置选择的分拣人员
    setSelectedPicker('');
    setPickerOptions([]);
    setCurrentOrderId(orderId);

    // 打开单个拣货Modal
    setSinglePickingModalVisible(true);
  };

  // 提交批量拣货
  const handleSubmitBatchPicking = async () => {
    if (!selectedPicker) {
      message.error('请选择分拣人员');
      return;
    }

    try {
      setModalConfirmLoading(true);

      // 构建BatchAddPickingDto对象
      const pickingDto: BatchAddPickingDto = {
        ids: selectedRowKeys as string[],
        picker: selectedPicker,
        remark: pickingRemark, // 添加备注
      };

      const result = await batchAddPickings(pickingDto);

      if (result.code === 200) {
        message.success('拣货单创建成功');
        // 清空选择
        setSelectedRowKeys([]);
        setPickingRemark(''); // 清空备注
        // 关闭Modal
        setBatchPickingModalVisible(false);
        // 刷新列表
        fetchOrders();
      } else {
        message.error(result.msg || '创建拣货单失败');
      }
    } catch (error) {
      console.error('批量创建拣货单失败:', error);
      message.error('创建拣货单失败，请稍后重试');
    } finally {
      setModalConfirmLoading(false);
    }
  };

  // 提交单个拣货
  const handleSubmitSinglePicking = async () => {
    if (!selectedPicker) {
      message.error('请选择分拣人员');
      return;
    }

    try {
      setModalConfirmLoading(true);

      // 构建BatchAddPickingDto对象
      const pickingDto: BatchAddPickingDto = {
        ids: [currentOrderId],
        picker: selectedPicker,
        remark: pickingRemark, // 添加备注
      };

      const result = await batchAddPickings(pickingDto);

      if (result.code === 200) {
        message.success('拣货单创建成功');
        // 清空备注
        setPickingRemark('');
        // 关闭Modal
        setSinglePickingModalVisible(false);
        // 刷新列表
        fetchOrders();
      } else {
        message.error(result.msg || '创建拣货单失败');
      }
    } catch (error) {
      console.error('创建拣货单失败:', error);
      message.error('创建拣货单失败，请稍后重试');
    } finally {
      setModalConfirmLoading(false);
    }
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: OrderVo) => ({
      disabled: record.type !== 0 || record.status !== 1, // 只允许选择出库且状态为审批通过的订单
    }),
  };

  // 完成出库
  const handleDoneOutBound = (id: string) => {
    Modal.confirm({
      title: '确定要完成出库吗？',
      icon: <InboxOutlined />,
      content: '完成出库后，订单将无法修改，请确认所有商品已出库。',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await doneOutBound(id);
          if (result.code === 200) {
            message.success('出库完成');
            fetchOrders();
          } else {
            message.error(result.msg || '出库失败');
          }
        } catch (error) {
          console.error('出库失败:', error);
          message.error('出库失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: '订单类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: number) => renderOrderType(type),
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
      render: (status: number, record: OrderVo) =>
        renderOrderStatus(status, record.type),
    },
    {
      title: '质检状态',
      dataIndex: 'qualityStatus',
      key: 'qualityStatus',
      render: (status: number) => renderQualityStatus(status, true),
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
      render: (_text: string, record: OrderVo) => (
        <Space size='middle'>
          <a onClick={() => handleViewDetail(record)}>查看详情</a>
          {record.status === 0 && (
            <a onClick={() => handleCancelOrder(record)}>取消订单</a>
          )}
          {record.status === 1 &&
            record.type === 1 &&
            record.actualTime === null && (
              <a onClick={() => handleReceiveGoods(record)}>收货</a>
            )}
          {record.status === 1 && record.type === 0 && (
            <a onClick={() => handleSinglePicking(record.id)}>拣货</a>
          )}
          {record.status === 2 &&
            record.type === 0 &&
            (record.qualityStatus === 1 || record.qualityStatus === 3) && (
              <a onClick={() => handleDoneOutBound(record.id)}>完成出库</a>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div className='order-manager'>
      <Card>
        <Form form={form} layout='horizontal' onFinish={handleSearch}>
          {/* 隐藏的排序字段 */}
          <Form.Item name='createTimeAsc' hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='orderNo' label='订单编号'>
                <Input placeholder='请输入订单编号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='orderType' label='订单类型'>
                <OrderTypeSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='status' label='订单状态'>
                <OrderStatusSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='inspectionStatus' label='质检状态'>
                <QualityStatusSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
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
          </Row>
          <Row gutter={16}>
            <Col span={24}>
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
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAddOrder}
            >
              新增订单
            </Button>
            <Button
              type='primary'
              icon={<ShoppingOutlined />}
              onClick={handleBatchPicking}
              disabled={selectedRowKeys.length === 0}
              style={{ marginLeft: 8 }}
            >
              批量拣货
            </Button>
          </div>
          <div>
            <span style={{ marginRight: 8 }}>
              {selectedRowKeys.length > 0
                ? `已选择 ${selectedRowKeys.length} 项`
                : ''}
            </span>
          </div>
        </div>
        <Table
          rowSelection={rowSelection}
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
      <AddOrderDrawer
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        onSuccess={handleOrderSuccess}
        currentUserId='admin' // 这里应该传入当前登录用户的ID
      />

      {/* 订单详情抽屉 */}
      {currentOrder && (
        <OrderDetailDrawer
          visible={detailDrawerVisible}
          onClose={handleCloseDetailDrawer}
          order={currentOrder}
        />
      )}

      {/* 批量拣货Modal */}
      <Modal
        title='确认批量拣货'
        open={batchPickingModalVisible}
        onOk={handleSubmitBatchPicking}
        onCancel={() => {
          setBatchPickingModalVisible(false);
          setPickingRemark(''); // 清空备注
        }}
        confirmLoading={modalConfirmLoading}
      >
        <div>
          <p>确定为选中的 {selectedRowKeys.length} 个订单创建拣货单吗？</p>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>选择分拣人员</div>
            <Select
              showSearch
              placeholder='请选择分拣人员'
              style={{ width: '100%' }}
              filterOption={false}
              defaultActiveFirstOption={false}
              showArrow={false}
              onSearch={handlePickerSearch}
              onChange={(value) => setSelectedPicker(value)}
              value={selectedPicker}
              notFoundContent={null}
            >
              {pickerOptions.map((user) => (
                <Option key={user.userId} value={user.userId}>
                  {user.realName}
                </Option>
              ))}
            </Select>
          </div>

          {/* 新增备注字段 */}
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>拣货备注</div>
            <TextArea
              rows={3}
              placeholder='请输入拣货备注（选填）'
              value={pickingRemark}
              onChange={(e) => setPickingRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* 单个拣货Modal */}
      <Modal
        title='确认创建拣货单'
        open={singlePickingModalVisible}
        onOk={handleSubmitSinglePicking}
        onCancel={() => {
          setSinglePickingModalVisible(false);
          setPickingRemark(''); // 清空备注
        }}
        confirmLoading={modalConfirmLoading}
      >
        <div>
          <p>确定为该订单创建拣货单吗？</p>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>选择分拣人员</div>
            <Select
              showSearch
              placeholder='请选择分拣人员'
              style={{ width: '100%' }}
              filterOption={false}
              defaultActiveFirstOption={false}
              showArrow={false}
              onSearch={handlePickerSearch}
              onChange={(value) => setSelectedPicker(value)}
              value={selectedPicker}
              notFoundContent={null}
            >
              {pickerOptions.map((user) => (
                <Option key={user.userId} value={user.userId}>
                  {user.realName}
                </Option>
              ))}
            </Select>
          </div>

          {/* 新增备注字段 */}
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8 }}>拣货备注</div>
            <TextArea
              rows={3}
              placeholder='请输入拣货备注（选填）'
              value={pickingRemark}
              onChange={(e) => setPickingRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

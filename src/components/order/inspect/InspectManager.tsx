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
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  pageList,
  InspectionVo,
} from '../../../api/order-service/InspectController';
import { getUsersByName, User } from '../../../api/sys-service/UserController';
import {
  renderQualityStatus,
  QualityStatusSelect,
  InspectionTypeSelect,
} from '../components/StatusComponents';
import userStore from '../../../store/userStore';
import { useNavigate, useLocation } from 'react-router-dom';
import InspectDetailDrawer from './components/InspectDetailDrawer';

// 创建store实例
const userStoreInstance = new userStore();

const { Option } = Select;
const { RangePicker } = DatePicker;

// 修改 InspectionDto 类型，使日期字段为字符串类型
interface InspectionDtoWithStringDates {
  page: number;
  pageSize: number;
  inspectionNo: string;
  inspectionType: number;
  relatedOrderNo: string;
  inspector: string;
  startTime: string;
  endTime: string;
  status: number;
  createTimeAsc: boolean;
  _t: number;
}

export default function InspectManager() {
  // 获取navigate函数用于路由跳转
  const navigate = useNavigate();
  // 获取location对象用于处理URL参数
  const location = useLocation();

  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [inspections, setInspections] = useState<InspectionVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();

  // 用户搜索相关状态
  const [inspectorOptions, setInspectorOptions] = useState<User[]>([]);
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
  const [currentInspection, setCurrentInspection] =
    useState<InspectionVo | null>(null);

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
    setInspectorOptions([currentUserInfo as unknown as User]);

    // 从URL中获取查询参数
    const query = new URLSearchParams(location.search);
    const inspectionNoFromQuery = query.get('inspectionNo');

    // 设置默认值：质检员为当前用户
    const initialValues: any = {
      inspector: currentUserInfo.userId,
      createTimeAsc: false,
    };

    // 如果URL中有inspectionNo参数，则设置质检编号
    if (inspectionNoFromQuery) {
      initialValues.inspectionNo = inspectionNoFromQuery;
    }

    // 设置表单初始值
    form.setFieldsValue(initialValues);

    // 执行第一次查询
    fetchInspections();

    // 如果是从消息点击进来的（有inspectionNo参数），则修改URL但不触发导航
    if (inspectionNoFromQuery) {
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    }
  }, [form, location]);

  // 监听inspections状态变化，确保UI更新
  useEffect(() => {}, [inspections]);

  // 监听分页变化
  useEffect(() => {
    fetchInspections();
  }, [pagination.current, pagination.pageSize]);

  // 查询质检数据
  const fetchInspections = async () => {
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

      const queryDto: InspectionDtoWithStringDates = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        inspectionNo: values.inspectionNo || '',
        inspectionType:
          values.inspectionType !== undefined ? values.inspectionType : null,
        relatedOrderNo: values.relatedOrderNo || '',
        inspector: values.inspector || '',
        startTime: startTime,
        endTime: endTime,
        createTimeAsc:
          values.createTimeAsc !== undefined ? values.createTimeAsc : false,
        status: values.status !== undefined ? values.status : null,
        _t: new Date().getTime()
      };

      const result = await pageList(queryDto as any); // 类型断言为任意类型，以兼容原接口

      if (result.code === 200) {
        setInspections(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取质检列表失败');
      }
    } catch (error) {
      console.error('获取质检列表失败:', error);
      message.error('获取质检列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 跳转到订单管理页面并搜索指定订单
  const handleNavigateToOrder = (orderNo: string) => {
    navigate(`/order/in-out?orderNo=${orderNo}`);
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

    // 只有切换分页时才会自动触发fetchInspections，排序时需要手动触发
    if (sorter && sorter.field === 'createTime') {
      fetchInspections();
    }
  };

  // 防抖搜索质检员
  const handleInspectorSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      // 当搜索框为空时，仍然保留当前用户作为选项
      setInspectorOptions(currentUser ? [currentUser as User] : []);
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
    fetchInspections();
  };

  // 重置表单
  const handleReset = () => {
    // 先重置表单（清空所有表单值）
    form.resetFields();

    // 设置默认值
    form.setFieldsValue({
      createTimeAsc: false,
    });

    // 如果当前用户存在，设置为默认质检员
    if (currentUser) {
      form.setFieldsValue({
        inspector: currentUser.userId,
      });
    }

    // 重置分页
    setPagination({
      current: 1,
      pageSize: 10,
    });

    // 最后获取数据
    fetchInspections();
  };

  // 打开详情抽屉
  const handleOpenDetail = (record: InspectionVo) => {
    setCurrentInspection(record);
    setDrawerVisible(true);
  };

  // 关闭详情抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setCurrentInspection(null);
  };

  // 延迟获取质检列表，添加一定延迟以确保服务器数据已更新
  const delayedFetchInspections = () => {
    // 先显示loading状态
    setLoading(true);
    // 延迟500ms再获取数据，给服务器处理时间
    setTimeout(() => {
      fetchInspections();
    }, 500);
  };

  // 表格列定义
  const columns = [
    {
      title: '质检编号',
      dataIndex: 'inspectionNo',
      key: 'inspectionNo',
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: '关联订单编号',
      dataIndex: 'relatedOrderNo',
      key: 'relatedOrderNo',
      render: (text: string) => (
        <a onClick={() => handleNavigateToOrder(text)}>{text}</a>
      ),
    },
    {
      title: '质检类型',
      dataIndex: 'inspectionType',
      key: 'inspectionType',
      render: (type: number) => {
        switch (type) {
          case 1:
            return <span>入库质检</span>;
          case 2:
            return <span>出库质检</span>;
          case 3:
            return <span>库存质检</span>;
          default:
            return <span>未知类型</span>;
        }
      },
    },
    {
      title: '质检员',
      dataIndex: 'inspectorInfo',
      key: 'inspectorInfo',
      render: (inspector: User) => inspector?.realName || '-',
    },
    {
      title: '质检状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => renderQualityStatus(status, true),
    },
    {
      title: '质检时间',
      dataIndex: 'inspectionTime',
      key: 'inspectionTime',
      render: (text: string) =>
        text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
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
      render: (_: any, record: InspectionVo) => (
        <Space size='middle'>
          <a onClick={() => handleOpenDetail(record)}>查看详情</a>
        </Space>
      ),
    },
  ];

  return (
    <div className='inspect-manager'>
      <Card>
        <Form form={form} layout='horizontal' onFinish={handleSearch}>
          {/* 隐藏的排序字段 */}
          <Form.Item name='createTimeAsc' hidden>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='inspectionNo' label='质检编号'>
                <Input placeholder='请输入质检编号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='relatedOrderNo' label='订单编号'>
                <Input placeholder='请输入订单编号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='inspectionType' label='质检类型'>
                <InspectionTypeSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='status' label='质检状态'>
                <QualityStatusSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='dateRange' label='质检时间'>
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
              <Form.Item name='inspector' label='质检员'>
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
            <Col span={12} style={{ textAlign: 'right' }}>
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
          dataSource={inspections}
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

      {/* 详情抽屉 */}
      {currentInspection && (
        <InspectDetailDrawer
          visible={drawerVisible}
          onClose={handleCloseDrawer}
          inspection={currentInspection}
          onSuccess={() => delayedFetchInspections()}
        />
      )}
    </div>
  );
}

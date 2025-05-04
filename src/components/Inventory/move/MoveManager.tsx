import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Form,
  Button,
  Space,
  message,
  DatePicker,
  Row,
  Col,
  Select,
  Input,
  Popconfirm,
  Modal,
  Tooltip,
  Dropdown,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { useLocation } from 'react-router-dom';
import {
  pageMovement,
  MovementDto,
  approveMovement,
  rejectMovement,
} from '../../../api/stock-service/MoveController';
import { getUsersByName } from '../../../api/sys-service/UserController';
import {
  renderMoveStatus,
  MoveStatusSelect,
} from '../components/MoveStatusComponents';
import {
  getAllAreas,
  Area,
} from '../../../api/location-service/AreaController';
import MoveAddDrawer from './MoveAddDrawer';
import MoveDetail from './MoveDetail';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

export default function MoveManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();
  // 新增区域数据状态
  const [areas, setAreas] = useState<Area[]>([]);
  // 新增抽屉状态
  const [addDrawerVisible, setAddDrawerVisible] = useState<boolean>(false);
  // 详情抽屉状态
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [currentMovement, setCurrentMovement] = useState<any>(null);
  // 拒绝弹窗状态
  const [rejectModalVisible, setRejectModalVisible] = useState<boolean>(false);
  const [rejectForm] = Form.useForm();
  const [rejectingId, setRejectingId] = useState<string>('');
  // 操作加载状态
  const [rejecting, setRejecting] = useState<boolean>(false);
  const location = useLocation();
  
  // URL参数解析
  const query = new URLSearchParams(location.search);
  const moveNoFromQuery = query.get('moveNo');

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 操作人和审批人选项
  const [operatorOptions, setOperatorOptions] = useState<any[]>([]);
  const [approverOptions, setApproverOptions] = useState<any[]>([]);

  // 处理URL参数
  useEffect(() => {
    // 如果URL中有moveNo参数，则设置到表单中
    if (moveNoFromQuery) {
      form.setFieldsValue({
        movementNo: moveNoFromQuery
      });
      
      // 重置分页，确保在第一页查询
      setPagination({
        current: 1,
        pageSize: 10,
      });
      
      // 立即查询数据
      fetchMovements();
    }
  }, [moveNoFromQuery, form]);

  // 初始化
  useEffect(() => {
    if (!moveNoFromQuery) {
      fetchMovements();
    }
    fetchAreas(); // 加载所有区域
  }, [pagination.current, pagination.pageSize]);

  // 获取所有区域
  const fetchAreas = async () => {
    try {
      const res = await getAllAreas();
      if (res.code === 200) {
        setAreas(res.data);
      }
    } catch (error) {
      console.error('获取区域列表失败', error);
    }
  };

  // 查询移动数据
  const fetchMovements = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();

      // 处理日期范围
      let startDate = null;
      let endDate = null;

      if (values.dateRange && values.dateRange.length === 2) {
        startDate = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        endDate = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      const queryDto: MovementDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        movementNo: values.movementNo || '',
        beforeAreaId: values.beforeAreaId || '',
        afterAreaId: values.afterAreaId || '',
        operator: values.operator || '',
        approver: values.approver || '',
        startDate: startDate,
        endDate: endDate,
        status: values.status !== undefined ? values.status : null,
      };

      const result = await pageMovement(queryDto);

      if (result.code === 200) {
        setMovements(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取移动记录失败');
      }
    } catch (error) {
      console.error('获取移动记录失败:', error);
      message.error('获取移动记录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格分页变化时的回调
  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // 防抖搜索操作人
  const handleOperatorSearch = debounce(async (name: string) => {
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setOperatorOptions(res.data);
      }
    } catch (error) {
      console.error('搜索操作人失败:', error);
    }
  }, 300);

  // 防抖搜索审批人
  const handleApproverSearch = debounce(async (name: string) => {
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setApproverOptions(res.data);
      }
    } catch (error) {
      console.error('搜索审批人失败:', error);
    }
  }, 300);

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchMovements();
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setPagination({
      current: 1,
      pageSize: 10,
    });
    fetchMovements();
  };

  // 新增库存移动
  const handleAdd = () => {
    setAddDrawerVisible(true);
  };

  // 新增抽屉关闭
  const handleAddDrawerClose = () => {
    setAddDrawerVisible(false);
  };

  // 新增成功回调
  const handleAddSuccess = () => {
    setAddDrawerVisible(false);
    fetchMovements(); // 刷新数据
    message.success('新增库存移动成功');
  };

  // 查看详情
  const handleViewDetail = (record: any) => {
    setCurrentMovement(record);
    setDetailVisible(true);
  };

  // 关闭详情抽屉
  const handleDetailClose = () => {
    setDetailVisible(false);
    setCurrentMovement(null);
  };

  // 处理审批
  const handleApprove = async (id: string) => {
    try {
      setLoading(true);
      const res = await approveMovement(id);
      if (res.code === 200) {
        message.success('审批成功');
        fetchMovements(); // 刷新列表
      } else {
        message.error(res.msg || '审批失败');
      }
    } catch (error) {
      console.error('审批失败:', error);
      message.error('审批失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 打开拒绝弹窗
  const showRejectModal = (id: string) => {
    setRejectingId(id);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };
  
  // 关闭拒绝弹窗
  const handleRejectCancel = () => {
    setRejectModalVisible(false);
    setRejectingId('');
  };
  
  // 提交拒绝
  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields();
      setRejecting(true);
      
      const res = await rejectMovement(rejectingId, values.reason);
      if (res.code === 200) {
        message.success('已拒绝该变更申请');
        setRejectModalVisible(false);
        fetchMovements(); // 刷新列表
      } else {
        message.error(res.msg || '操作失败');
      }
    } catch (error) {
      console.error('拒绝失败:', error);
      message.error('操作失败，请稍后重试');
    } finally {
      setRejecting(false);
    }
  };
  
  // 渲染操作栏
  const renderOperationColumn = (record: any) => {
    // 判断是否为待审批状态
    const isPending = record.status === 0;
    
    // 详情按钮始终显示
    const viewDetailButton = (
      <Button 
        type="link" 
        icon={<EyeOutlined />} 
        onClick={() => handleViewDetail(record)}
      >
        详情
      </Button>
    );
    
    // 如果不是待审批状态，只显示详情按钮
    if (!isPending) {
      return viewDetailButton;
    }
    
    // 审批操作下拉菜单项
    const items = [
      {
        key: 'approve',
        label: (
          <Popconfirm
            title="确认审批"
            description="确定要同意这个变更申请吗？"
            onConfirm={() => handleApprove(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>同意</span>
            </Space>
          </Popconfirm>
        ),
      },
      {
        key: 'reject',
        label: (
          <div onClick={() => showRejectModal(record.id)}>
            <Space>
              <CloseCircleOutlined style={{ color: '#f5222d' }} />
              <span>拒绝</span>
            </Space>
          </div>
        ),
      },
    ];
    
    return (
      <Space>
        {viewDetailButton}
        <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
          <Tooltip title="审批操作">
            <Button type="text" icon={<MoreOutlined />} />
          </Tooltip>
        </Dropdown>
      </Space>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '变动编号',
      dataIndex: 'movementNo',
      key: 'movementNo',
    },
    {
      title: '商品名称',
      dataIndex: ['stock', 'productName'],
      key: 'productName',
    },
    {
      title: '批次号',
      dataIndex: ['stock', 'batchNumber'],
      key: 'batchNumber',
      render: (text: string) => text || '-',
    },
    {
      title: '变更前区域',
      dataIndex: ['beforeArea', 'areaName'],
      key: 'beforeAreaName',
    },
    {
      title: '变更后区域',
      dataIndex: ['afterArea', 'areaName'],
      key: 'afterAreaName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => renderMoveStatus(status),
    },
    {
      title: '操作人',
      dataIndex: ['operatorUser', 'realName'],
      key: 'operator',
      render: (text: string) => text || '-',
    },
    {
      title: '审批人',
      dataIndex: ['approverUser', 'realName'],
      key: 'approver',
      render: (text: string) => text || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'operateTime',
      key: 'operateTime',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: renderOperationColumn,
    },
  ];

  return (
    <div className='move-manager'>
      <Card title='库存移动管理'>
        <Form form={form} layout='vertical'>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label='变动编号' name='movementNo'>
                <Input placeholder='请输入变动编号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='变更前区域' name='beforeAreaId'>
                <Select placeholder='请选择变更前区域' allowClear>
                  {areas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='变更后区域' name='afterAreaId'>
                <Select placeholder='请选择变更后区域' allowClear>
                  {areas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='状态' name='status'>
                <MoveStatusSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label='操作人' name='operator'>
                <Select
                  showSearch
                  placeholder='请输入操作人姓名'
                  filterOption={false}
                  defaultActiveFirstOption={false}
                  onSearch={handleOperatorSearch}
                  notFoundContent={null}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {operatorOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='审批人' name='approver'>
                <Select
                  showSearch
                  placeholder='请输入审批人姓名'
                  filterOption={false}
                  defaultActiveFirstOption={false}
                  onSearch={handleApproverSearch}
                  notFoundContent={null}
                  style={{ width: '100%' }}
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
              <Form.Item label='日期范围' name='dateRange'>
                <RangePicker
                  style={{ width: '100%' }}
                  locale={locale}
                  showTime={{ format: 'HH:mm:ss' }}
                  format='YYYY-MM-DD HH:mm:ss'
                />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type='primary'
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                >
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button type='primary' icon={<PlusOutlined />} onClick={handleAdd}>
            新增变动
          </Button>
        </div>

        <Table
          dataSource={movements}
          columns={columns}
          rowKey='id'
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          loading={loading}
          onChange={handleTableChange}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 新增变动抽屉组件 */}
      <MoveAddDrawer
        visible={addDrawerVisible}
        onClose={handleAddDrawerClose}
        onSuccess={handleAddSuccess}
      />

      {/* 详情抽屉组件 */}
      {currentMovement && (
        <MoveDetail
          visible={detailVisible}
          onClose={handleDetailClose}
          movement={currentMovement}
        />
      )}
      
      {/* 拒绝原因弹窗 */}
      <Modal
        title="拒绝申请"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={handleRejectCancel}
        confirmLoading={rejecting}
        okText="确认拒绝"
        cancelText="取消"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

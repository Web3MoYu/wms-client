import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Pagination,
  Typography,
  Form,
  Select,
  Button,
  Space,
  message,
  Modal,
  Tooltip,
  Switch,
} from 'antd';
import {
  Notice,
  NoticePageDTO,
  pageList,
  publish,
  abandon,
} from '../../api/msg-service/NoticeController';
import { Page, Result } from '../../api/Model';
import { getAdminList } from '../../api/sys-service/UserController';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  SendOutlined, 
  EditOutlined, 
  StopOutlined,
  ExclamationCircleOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import NoticeDetailModal from './NoticeDetailModal';
import NoticeFormModal from './NoticeFormModal';

const { Title } = Typography;
const { Option } = Select;

// 状态常量
const STATUS_MAP = [
  { value: 0, label: '未发布', color: 'default' },
  { value: 1, label: '已发布', color: 'green' },
  { value: 2, label: '废弃', color: 'red' },
];

// 优先级常量
const PRIORITY_MAP = [
  { value: 0, label: '普通', color: 'default' },
  { value: 1, label: '重要', color: 'orange' },
  { value: 2, label: '紧急', color: 'red' },
];

// 置顶常量
const IS_TOP_MAP = [
  { value: 0, label: '不置顶', color: 'default' },
  { value: 1, label: '置顶', color: 'blue' },
];

export default function NoticeManager() {
  // 状态
  const [loading, setLoading] = useState<boolean>(false);
  const [noticeList, setNoticeList] = useState<Notice[]>([]);
  const [adminList, setAdminList] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  
  // 详情弹窗相关状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);
  
  // 表单弹窗相关状态
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // 查询参数
  const [queryParams, setQueryParams] = useState<
    NoticePageDTO & { publisher?: string }
  >({
    page: 1,
    pageSize: 5,
    status: null as any, // null表示全部
    priority: null as any, // null表示全部
    isTop: null as any, // null表示全部
    publisher: null as any, // 发布人ID
    showDelete: 0, // 默认不显示已删除的
  });

  // 获取管理员列表
  const fetchAdminList = async () => {
    try {
      const res = (await getAdminList()) as Result<any[]>;
      if (res.code === 200) {
        setAdminList(res.data);
      }
    } catch (error) {
      console.error('获取管理员列表失败', error);
    }
  };

  // 获取公告列表
  const fetchNoticeList = async () => {
    try {
      setLoading(true);
      const res = (await pageList(queryParams)) as Result<Page<Notice>>;

      if (res.code === 200) {
        setNoticeList(res.data.records);
        setPagination({
          ...pagination,
          current: res.data.current,
          total: res.data.total,
        });
      } else {
        message.error(res.msg);
      }
    } catch (error) {
      console.error('获取公告列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理表单搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    setQueryParams({
      ...queryParams,
      page: 1, // 搜索时重置到第一页
      ...values,
    });
  };

  // 处理是否显示已删除通知的开关
  const handleShowDeleteChange = (checked: boolean) => {
    // 如果关闭开关，并且当前状态选择为"已废弃"(2)，则清除状态选择
    if (!checked && form.getFieldValue('status') === 2) {
      form.setFieldValue('status', null);
    }
    
    setQueryParams({
      ...queryParams,
      showDelete: checked ? 1 : 0,
      // 如果关闭开关，并且当前状态为已废弃，则将状态设为null
      status: (!checked && queryParams.status === 2) ? (null as any) : queryParams.status
    });
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setQueryParams({
      page: 1,
      pageSize: 5,
      status: null as any,
      priority: null as any,
      isTop: null as any,
      publisher: null as any,
      showDelete: 0,
    });
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    setQueryParams({
      ...queryParams,
      page: page,
      pageSize: pageSize || 5,
    });
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchNoticeList();
  }, [queryParams]);

  // 组件挂载时获取管理员列表
  useEffect(() => {
    fetchAdminList();
  }, []);

  // 显示公告详情
  const showNoticeDetail = (record: Notice) => {
    setCurrentNotice(record);
    setDetailVisible(true);
  };

  // 关闭公告详情
  const handleCloseDetail = () => {
    setDetailVisible(false);
  };

  // 显示新增弹窗
  const showAddModal = () => {
    setCurrentNotice(null);
    setFormMode('add');
    setFormVisible(true);
  };

  // 显示编辑弹窗
  const handleEdit = (record: Notice) => {
    setCurrentNotice(record);
    setFormMode('edit');
    setFormVisible(true);
  };

  // 关闭表单弹窗
  const handleCloseForm = () => {
    setFormVisible(false);
  };

  // 表单提交成功回调
  const handleFormSuccess = () => {
    fetchNoticeList();
  };

  // 发布公告
  const handlePublish = (id: string, title: string) => {
    Modal.confirm({
      title: '确认发布',
      icon: <ExclamationCircleOutlined />,
      content: `确定要发布 "${title}" 吗？`,
      onOk: async () => {
        try {
          const res = await publish(id) as Result<string>;
          if (res.code === 200) {
            message.success('发布成功');
            fetchNoticeList(); // 刷新列表
          } else {
            message.error(res.msg || '发布失败');
          }
        } catch (error) {
          console.error('发布公告失败', error);
          message.error('发布失败');
        }
      },
    });
  };

  // 废弃公告
  const handleAbandon = (id: string, title: string) => {
    Modal.confirm({
      title: '确认废弃',
      icon: <ExclamationCircleOutlined />,
      content: `确定要废弃 "${title}" 吗？废弃后将无法恢复！`,
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await abandon(id) as Result<string>;
          if (res.code === 200) {
            message.success('废弃成功');
            fetchNoticeList(); // 刷新列表
          } else {
            message.error(res.msg || '废弃失败');
          }
        } catch (error) {
          console.error('废弃公告失败', error);
          message.error('废弃失败');
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 160,
      ellipsis: true,
      render: (title: string, record: Notice) => (
        <a onClick={() => showNoticeDetail(record)}>
          {title}
        </a>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'publisherName',
      key: 'publisherName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => {
        const statusInfo =
          STATUS_MAP.find((item) => item.value === status) || STATUS_MAP[0];
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => {
        const priorityInfo =
          PRIORITY_MAP.find((item) => item.value === priority) ||
          PRIORITY_MAP[0];
        return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
      },
    },
    {
      title: '是否置顶',
      dataIndex: 'isTop',
      key: 'isTop',
      width: 100,
      render: (isTop: number) => {
        const isTopInfo =
          IS_TOP_MAP.find((item) => item.value === isTop) || IS_TOP_MAP[0];
        return <Tag color={isTopInfo.color}>{isTopInfo.label}</Tag>;
      },
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 120,
    },
    {
      title: '废弃时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Notice) => {
        const isDiscarded = record.status === 2; // 已废弃
        const isPublished = record.status === 1; // 已发布
        
        return (
          <Space size={8}>
            <Tooltip title={isDiscarded ? '已废弃的公告无法发布' : (isPublished ? '已发布的公告无法再次发布' : '发布公告')}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                disabled={isDiscarded || isPublished}
                onClick={() => handlePublish(record.id.toString(), record.title)}
              >
                发布
              </Button>
            </Tooltip>
            
            <Tooltip title={isDiscarded ? '已废弃的公告无法编辑' : '编辑公告'}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                disabled={isDiscarded}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
            </Tooltip>
            
            <Tooltip title={isDiscarded ? '已废弃的公告无法再次废弃' : '废弃公告'}>
              <Button
                danger
                icon={<StopOutlined />}
                size="small"
                disabled={isDiscarded}
                onClick={() => handleAbandon(record.id.toString(), record.title)}
              >
                废弃
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>公告管理</Title>
        </div>
      }
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
    >
      {/* 筛选表单 */}
      <Form form={form} layout='inline' style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%', marginBottom: '16px' }}>
          <Form.Item name='publisher' label='发布人' style={{ minWidth: '220px', marginBottom: '8px' }}>
            <Select
              placeholder='请选择发布人'
              allowClear
              showSearch
              optionFilterProp='children'
              style={{ width: '150px' }}
            >
              {adminList.map((admin) => (
                <Option key={`admin-${admin.userId}`} value={admin.userId}>
                  {admin.realName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name='status' label='状态' style={{ minWidth: '180px', marginBottom: '8px' }}>
            <Select placeholder='请选择状态' allowClear style={{ width: '120px' }}>
              {STATUS_MAP.filter(status => queryParams.showDelete === 1 || status.value !== 2).map((status) => (
                <Option key={`status-${status.value}`} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name='priority' label='优先级' style={{ minWidth: '180px', marginBottom: '8px' }}>
            <Select placeholder='请选择优先级' allowClear style={{ width: '120px' }}>
              {PRIORITY_MAP.map((priority) => (
                <Option
                  key={`priority-${priority.value}`}
                  value={priority.value}
                >
                  {priority.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name='isTop' label='是否置顶' style={{ minWidth: '180px', marginBottom: '8px' }}>
            <Select placeholder='请选择是否置顶' allowClear style={{ width: '120px' }}>
              {IS_TOP_MAP.map((isTop) => (
                <Option key={`isTop-${isTop.value}`} value={isTop.value}>
                  {isTop.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
              style={{ marginRight: '16px' }}
            >
              新增公告
            </Button>
            <span style={{ marginLeft: '16px' }}>
              显示已废弃通知：
              <Switch 
                checked={queryParams.showDelete === 1} 
                onChange={handleShowDeleteChange}
                size="small"
                style={{ marginLeft: '8px' }}
              />
            </span>
          </div>
          
          <div>
            <Button
              type='primary'
              icon={<SearchOutlined />}
              onClick={handleSearch}
              style={{ marginRight: '8px' }}
            >
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
      </Form>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={noticeList}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={['5', '10', '15', '20']}
          showQuickJumper
          showTotal={(total) => `共 ${total} 条记录`}
        />
      </div>
      
      {/* 公告详情弹窗 */}
      <NoticeDetailModal
        visible={detailVisible}
        notice={currentNotice}
        onClose={handleCloseDetail}
      />
      
      {/* 公告表单弹窗 */}
      <NoticeFormModal
        visible={formVisible}
        notice={currentNotice}
        mode={formMode}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />
    </Card>
  );
}

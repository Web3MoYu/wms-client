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
  Row,
  Col,
  Space,
  message,
} from 'antd';
import {
  Notice,
  NoticePageDTO,
  pageList,
} from '../../api/msg-service/NoticeController';
import { Page, Result } from '../../api/Model';
import { getAdminList } from '../../api/sys-service/UserController';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';

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
        message.success(res.msg);
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
      publisher: values.publisher,
      status: values.status,
      priority: values.priority,
      isTop: values.isTop,
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

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
      render: (content: string) => {
        // 只显示前30个字符，后面用省略号
        return content && content.length > 30
          ? `${content.substring(0, 30)}...`
          : content;
      },
    },
    {
      title: '发布人',
      dataIndex: 'publisherName',
      key: 'publisherName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
    },
  ];

  return (
    <Card
      title={<Title level={4}>公告管理</Title>}
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
    >
      {/* 筛选表单 */}
      <Form form={form} layout='horizontal' style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name='publisher' label='发布人'>
              <Select
                placeholder='请选择发布人'
                allowClear
                showSearch
                optionFilterProp='children'
              >
                {adminList.map((admin) => (
                  <Option key={`admin-${admin.userId}`} value={admin.userId}>
                    {admin.realName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name='status' label='状态'>
              <Select placeholder='请选择状态' allowClear>
                {STATUS_MAP.map((status) => (
                  <Option key={`status-${status.value}`} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name='priority' label='优先级'>
              <Select placeholder='请选择优先级' allowClear>
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
          </Col>
          <Col span={6}>
            <Form.Item name='isTop' label='是否置顶'>
              <Select placeholder='请选择是否置顶' allowClear>
                {IS_TOP_MAP.map((isTop) => (
                  <Option key={`isTop-${isTop.value}`} value={isTop.value}>
                    {isTop.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type='primary'
                icon={<SearchOutlined />}
                onClick={handleSearch}
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

      <Table
        rowKey='id'
        columns={columns}
        dataSource={noticeList}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
      <div
        style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}
      >
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
    </Card>
  );
}

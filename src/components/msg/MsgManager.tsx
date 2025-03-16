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
  Modal,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
// 导入中文语言包
import locale from 'antd/es/date-picker/locale/zh_CN';
import { page, Msg, MsgPageDto, readMsg } from '../../api/msg-service/MsgController';
import { getUsersByName, User } from '../../api/sys-service/UserController';
import { useLocation } from 'react-router-dom';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 从URL获取查询参数
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function MsgManager() {
  // 获取URL查询参数
  const query = useQuery();
  const readStatusParam = query.get('readStatus');
  
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();

  // 用户搜索相关状态
  const [senderOptions, setSenderOptions] = useState<User[]>([]);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 初始化
  useEffect(() => {
    // 如果URL中包含readStatus参数，设置表单的初始值
    if (readStatusParam !== null) {
      form.setFieldsValue({ readStatus: parseInt(readStatusParam) });
    }
    
    fetchMessages();
  }, [pagination.current, pagination.pageSize, readStatusParam]);

  // 查询消息数据
  const fetchMessages = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();

      // 处理日期范围和构建查询参数对象
      const dto: Partial<MsgPageDto> = {
        senderId: values.senderId || '',
        type: values.type || '',
        title: values.title || '',
        readStatus: values.readStatus !== undefined ? values.readStatus : null,
        priority: values.priority !== undefined ? values.priority : null,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      // 如果选择了日期范围，则添加到查询条件
      if (values.dateRange && values.dateRange.length === 2) {
        dto.startTime = values.dateRange[0].toDate();
        dto.endTime = values.dateRange[1].toDate();
      }

      // 调用接口进行查询
      const result = await page(dto as MsgPageDto);

      if (result.code === 200) {
        setMessages(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取消息列表失败');
      }
    } catch (error) {
      console.error('获取消息列表失败:', error);
      message.error('获取消息列表失败，请稍后重试');
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

  // 发送人搜索功能恢复原状，删除注释
  const handleSenderSearch = debounce(async (name: string) => {
    if (!name || name.length < 1) {
      setSenderOptions([]);
      return;
    }

    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setSenderOptions(res.data);
      }
    } catch (error) {
      console.error('搜索发送人失败:', error);
    }
  }, 500);

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchMessages();
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    // 重置后设置默认显示未读消息
    form.setFieldsValue({ readStatus: 0 });
    setPagination({
      current: 1,
      pageSize: 10,
    });
    fetchMessages();
  };

  // 标记消息为已读
  const handleReadMsg = async (msgId: string) => {
    Modal.confirm({
      title: '确认标记已读',
      content: '确定要将此消息标记为已读吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await readMsg(msgId);
          if (result.code === 200) {
            message.success('消息已标记为已读');
            // 刷新消息列表
            fetchMessages();
          } else {
            message.error(result.msg || '标记消息已读失败');
          }
        } catch (error) {
          console.error('标记消息已读失败:', error);
          message.error('操作失败，请稍后重试');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 渲染消息优先级
  const renderPriority = (priority: number) => {
    switch (priority) {
      case 2:
        return <Tag color='red'>紧急</Tag>;
      case 1:
        return <Tag color='orange'>重要</Tag>;
      default:
        return <Tag color='green'>普通</Tag>;
    }
  };

  // 渲染消息类型
  const renderType = (type: number) => {
    switch (type) {
      case 1:
        return <Tag color='blue'>库存预警</Tag>;
      case 2:
        return <Tag color='cyan'>质检通知</Tag>;
      case 3:
        return <Tag color='green'>订单通知</Tag>;
      case 4:
        return <Tag color='red'>异常通知</Tag>;
      case 5:
        return <Tag color='orange'>补货通知</Tag>;
      case 6:
        return <Tag color='purple'>其他</Tag>;
      default:
        return <Tag color='default'>未知类型</Tag>;
    }
  };

  // 渲染读取状态
  const renderReadStatus = (status: number) => {
    return status === 1 ? (
      <Tag color='green'>已读</Tag>
    ) : (
      <Tag color='red'>未读</Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontWeight: 'bold' }}>{text}</span>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '发送人',
      dataIndex: 'senderName',
      key: 'senderName',
      render: (text: string) => text || '-',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: renderType,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: renderPriority,
    },
    {
      title: '状态',
      dataIndex: 'readStatus',
      key: 'readStatus',
      render: renderReadStatus,
    },
    {
      title: '业务ID',
      dataIndex: 'relatedBizId',
      key: 'relatedBizId',
      render: (text: string) => text || '-',
    },
    {
      title: '业务类型',
      dataIndex: 'relatedBizType',
      key: 'relatedBizType',
      render: (type: number) => {
        switch (type) {
          case 1:
            return <Tag color='purple'>入库单</Tag>;
          case 2:
            return <Tag color='geekblue'>出库单</Tag>;
          case 3:
            return <Tag color='cyan'>质检单</Tag>;
          case 4:
            return <Tag color='red'>异常标记</Tag>;
          case 5:
            return <Tag color='orange'>库存预警</Tag>;
          default:
            return <Tag color='default'>未知类型</Tag>;
        }
      },
    },
    {
      title: '发送时间',
      dataIndex: 'sendTime',
      key: 'sendTime',
      render: (text: string) =>
        text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Msg) => (
        <Space size='middle'>
          {record.readStatus === 0 ? (
            <Button 
              type="link" 
              size="small" 
              onClick={() => handleReadMsg(record.id)}
            >
              标记已读
            </Button>
          ) : (
            <Button 
              type="link" 
              size="small" 
              disabled
              style={{ color: '#d9d9d9', cursor: 'not-allowed' }}
            >
              已读
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='msg-manager'>
      <Card>
        <Form form={form} layout='horizontal' onFinish={handleSearch}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='title' label='消息标题'>
                <Input placeholder='请输入消息标题' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='type' label='消息类型'>
                <Select placeholder='请选择消息类型' allowClear>
                  <Option value={1}>库存预警</Option>
                  <Option value={2}>质检通知</Option>
                  <Option value={3}>订单状态</Option>
                  <Option value={4}>异常通知</Option>
                  <Option value={5}>补货通知</Option>
                  <Option value={6}>其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='readStatus' label='读取状态'>
                <Select placeholder='请选择读取状态' allowClear>
                  <Option value={0}>未读</Option>
                  <Option value={1}>已读</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='priority' label='优先级'>
                <Select placeholder='请选择优先级' allowClear>
                  <Option value={0}>普通</Option>
                  <Option value={1}>重要</Option>
                  <Option value={2}>紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name='senderId' label='发送人'>
                <Select
                  showSearch
                  placeholder='请输入发送人姓名'
                  filterOption={false}
                  onSearch={handleSenderSearch}
                  allowClear
                >
                  {senderOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name='dateRange' label='发送时间'>
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
        <Table
          columns={columns}
          dataSource={messages}
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
    </div>
  );
}

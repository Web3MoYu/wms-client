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
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import moment from 'moment';
// 导入中文语言包
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  page,
  Msg,
  MsgPageDto,
  readMsg,
} from '../../api/msg-service/MsgController';
import { getUsersByName, User } from '../../api/sys-service/UserController';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  renderPriority, 
  renderMsgType, 
  renderReadStatus, 
  renderBizType,
  PrioritySelect,
  MsgTypeSelect,
  ReadStatusSelect,
  handleMessageNavigation
} from './CommonRender';

const { RangePicker } = DatePicker;

// 从URL获取查询参数
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function MsgManager() {
  // 获取URL查询参数
  const query = useQuery();
  const readStatusParam = query.get('readStatus');
  const navigate = useNavigate();

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
    pageSize: 5,
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
        readStatus: values.readStatus,
        priority: values.priority !== undefined ? values.priority : null,
        page: pagination.current,
        pageSize: pagination.pageSize,
      };

      // 如果选择了日期范围，则添加到查询条件
      if (values.dateRange && values.dateRange.length === 2) {
        dto.startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        dto.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss');
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
    setPagination({
      current: 1,
      pageSize: 5,
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
      },
    });
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
      width: 90,
      render: renderMsgType,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: renderPriority,
    },
    {
      title: '状态',
      dataIndex: 'readStatus',
      key: 'readStatus',
      width: 90,
      render: renderReadStatus,
    },
    {
      title: '业务ID',
      dataIndex: 'relatedBizId',
      key: 'relatedBizId',
      render: (text: string, record: Msg) => {
        if (!text) return '-';
        
        // 判断是否可导航的业务类型
        const canNavigate = [1, 2, 3, 4, 5, 6].includes(record.relatedBizType || 0);
        
        return canNavigate ? (
          <a onClick={() => handleMessageNavigation(record, navigate)}>{text}</a>
        ) : text;
      },
    },
    {
      title: '业务类型',
      dataIndex: 'relatedBizType',
      key: 'relatedBizType',
      width: 90,
      render: renderBizType,
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
      render: (_text: string, record: Msg) => (
        <Space size='middle'>
          {record.readStatus === 0 ? (
            <Button
              type='link'
              size='small'
              onClick={() => handleReadMsg(record.id)}
            >
              标记已读
            </Button>
          ) : (
            <Button
              type='link'
              size='small'
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
                <MsgTypeSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='readStatus' label='读取状态'>
                <ReadStatusSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name='priority' label='优先级'>
                <PrioritySelect />
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
                    <Select.Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Select.Option>
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

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
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  alertPages,
  AlertQueryDto,
} from '../../../api/stock-service/AlertController';
import { getUsersByName } from '../../../api/sys-service/UserController';
import {
  renderAlertType,
  renderHandleStatus,
  AlertTypeSelect,
  HandleStatusSelect,
} from '../components/StatusComponents';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AlertManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 处理人员选项
  const [handlerOptions, setHandlerOptions] = useState<any[]>([]);

  // 初始化
  useEffect(() => {
    fetchAlerts();
  }, [pagination.current, pagination.pageSize]);

  // 查询预警数据
  const fetchAlerts = async () => {
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

      const queryDto: AlertQueryDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        alertType: values.alertType !== undefined ? values.alertType : null,
        startDate: startDate,
        endDate: endDate,
        isHandled: values.isHandled !== undefined ? values.isHandled : null,
        handler: values.handler || '',
      };

      const result = await alertPages(queryDto);

      if (result.code === 200) {
        setAlerts(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取预警列表失败');
      }
    } catch (error) {
      console.error('获取预警列表失败:', error);
      message.error('获取预警列表失败，请稍后重试');
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

  // 防抖搜索处理人
  const handleHandlerSearch = debounce(async (name: string) => {
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setHandlerOptions(res.data);
      }
    } catch (error) {
      console.error('搜索处理人失败:', error);
    }
  }, 300); // 减少延迟时间以提高响应速度

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchAlerts();
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setPagination({
      current: 1,
      pageSize: 10,
    });
    fetchAlerts();
  };

  // 表格列定义
  const columns = [
    {
      title: '产品名称',
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
      title: '预警类型',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (type: number) => renderAlertType(type),
    },
    {
      title: '当前库存',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
    },
    {
      title: '预警阈值',
      dataIndex: 'alertType',
      key: 'thresholdQuantity',
      render: (type: number, record: any) => {
        return type === 2 ? record.maxStock : record.minStock;
      },
    },
    {
      title: '处理状态',
      dataIndex: 'isHandled',
      key: 'isHandled',
      render: (status: number) => renderHandleStatus(status),
    },
    {
      title: '处理人',
      dataIndex: ['handlerUser', 'realName'],
      key: 'handlerName',
      render: (text: string) => text || '-',
    },
    {
      title: '处理时间',
      dataIndex: 'handlingTime',
      key: 'handlingTime',
      render: (text: string) => text || '-',
    },
    {
      title: '预警时间',
      dataIndex: 'alertTime',
      key: 'alertTime',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <div className='alert-manager'>
      <Card title='库存预警管理'>
        <Form form={form} layout='vertical'>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label='预警类型' name='alertType'>
                <AlertTypeSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='处理状态' name='isHandled'>
                <HandleStatusSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='处理人' name='handler'>
                <Select
                  showSearch
                  placeholder='请输入处理人姓名'
                  filterOption={false}
                  defaultActiveFirstOption={false}
                  onSearch={handleHandlerSearch}
                  notFoundContent={null}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {handlerOptions.map((user) => (
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
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
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

        <Table
          dataSource={alerts}
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
    </div>
  );
}

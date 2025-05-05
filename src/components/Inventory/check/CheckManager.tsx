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
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { useLocation } from 'react-router-dom';
import {
  pageCheck,
  CheckQueryDto,
  CheckVo,
} from '../../../api/stock-service/CheckController';
import { getUsersByName } from '../../../api/sys-service/UserController';
import {
  renderCheckStatus,
  CheckStatusSelect,
} from '../components/CheckStatusComponents';
import {
  getAllAreas,
  Area,
} from '../../../api/location-service/AreaController';
import CheckAddDrawer from './CheckAddDrawer';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function CheckManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [checks, setChecks] = useState<CheckVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();
  // 新增区域数据状态
  const [areas, setAreas] = useState<Area[]>([]);
  const location = useLocation();
  
  // URL参数解析
  const query = new URLSearchParams(location.search);
  const checkNoFromQuery = query.get('checkNo');

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 创建人和盘点人选项
  const [creatorOptions, setCreatorOptions] = useState<any[]>([]);
  const [checkerOptions, setCheckerOptions] = useState<any[]>([]);
  const [addDrawerVisible, setAddDrawerVisible] = useState<boolean>(false);

  // 处理URL参数
  useEffect(() => {
    // 如果URL中有checkNo参数，则设置到表单中
    if (checkNoFromQuery) {
      form.setFieldsValue({
        checkNo: checkNoFromQuery
      });
      
      // 重置分页，确保在第一页查询
      setPagination({
        current: 1,
        pageSize: 10,
      });
      
      // 立即查询数据
      fetchChecks();
    }
  }, [checkNoFromQuery, form]);

  // 初始化
  useEffect(() => {
    if (!checkNoFromQuery) {
      fetchChecks();
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

  // 查询盘点数据
  const fetchChecks = async () => {
    try {
      setLoading(true);

      // 获取表单数据
      const values = form.getFieldsValue();

      // 处理日期范围 - 计划时间
      let planStartTime = null;
      let planEndTime = null;
      if (values.planDateRange && values.planDateRange.length === 2) {
        planStartTime = values.planDateRange[0].format('YYYY-MM-DD HH:mm:ss');
        planEndTime = values.planDateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      // 处理日期范围 - 实际时间
      let actualStartTime = null;
      let actualEndTime = null;
      if (values.actualDateRange && values.actualDateRange.length === 2) {
        actualStartTime = values.actualDateRange[0].format('YYYY-MM-DD HH:mm:ss');
        actualEndTime = values.actualDateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }

      const queryDto: CheckQueryDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        checkNo: values.checkNo || '',
        areaId: values.areaId || '',
        creator: values.creator || '',
        checker: values.checker || '',
        planStartTime: planStartTime,
        planEndTime: planEndTime,
        actualStartTime: actualStartTime,
        actualEndTime: actualEndTime,
        status: values.status !== undefined ? values.status : null,
      };

      const result = await pageCheck(queryDto);

      if (result.code === 200) {
        setChecks(result.data.records);
        setTotal(result.data.total);
      } else {
        message.error(result.msg || '获取盘点记录失败');
      }
    } catch (error) {
      console.error('获取盘点记录失败:', error);
      message.error('获取盘点记录失败，请稍后重试');
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

  // 防抖搜索创建人
  const handleCreatorSearch = debounce(async (name: string) => {
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setCreatorOptions(res.data);
      }
    } catch (error) {
      console.error('搜索创建人失败:', error);
    }
  }, 300);

  // 防抖搜索盘点人
  const handleCheckerSearch = debounce(async (name: string) => {
    try {
      const res = await getUsersByName(name);
      if (res.code === 200) {
        setCheckerOptions(res.data);
      }
    } catch (error) {
      console.error('搜索盘点人失败:', error);
    }
  }, 300);

  // 搜索表单提交
  const handleSearch = () => {
    setPagination({
      ...pagination,
      current: 1, // 搜索时重置为第一页
    });
    fetchChecks();
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setPagination({
      current: 1,
      pageSize: 10,
    });
    fetchChecks();
  };

  // 打开新增抽屉
  const showAddDrawer = () => {
    setAddDrawerVisible(true);
  };

  // 关闭新增抽屉
  const hideAddDrawer = () => {
    setAddDrawerVisible(false);
  };

  // 新增盘点成功后刷新列表
  const handleAddSuccess = () => {
    hideAddDrawer();
    fetchChecks();
  };

  // 表格列定义
  const columns = [
    {
      title: '盘点单号',
      dataIndex: 'checkNo',
      key: 'checkNo',
    },
    {
      title: '区域',
      dataIndex: ['area', 'areaName'],
      key: 'areaName',
    },
    {
      title: '盘点状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => renderCheckStatus(status),
    },
    {
      title: '计划开始时间',
      dataIndex: 'planStartTime',
      key: 'planStartTime',
      render: (text: string) => text || '-',
    },
    {
      title: '计划结束时间',
      dataIndex: 'planEndTime',
      key: 'planEndTime',
      render: (text: string) => text || '-',
    },
    {
      title: '实际开始时间',
      dataIndex: 'actualStartTime',
      key: 'actualStartTime',
      render: (text: string) => text || '-',
    },
    {
      title: '实际结束时间',
      dataIndex: 'actualEndTime',
      key: 'actualEndTime',
      render: (text: string) => text || '-',
    },
    {
      title: '创建人',
      dataIndex: ['creatorUser', 'realName'],
      key: 'creator',
      render: (text: string) => text || '-',
    },
    {
      title: '盘点人',
      dataIndex: ['checkerUser', 'realName'],
      key: 'checker',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => {
        // 根据不同状态显示不同操作按钮
        return (
          <Button 
            type="link" 
            onClick={() => message.info('详情功能待实现')}
          >
            详情
          </Button>
        );
      },
    },
  ];

  return (
    <div className='check-manager'>
      <Card title='库存盘点管理'>
        <Form form={form} layout='vertical'>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label='盘点单号' name='checkNo'>
                <Input placeholder='请输入盘点单号' />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='区域' name='areaId'>
                <Select placeholder='请选择区域' allowClear>
                  {areas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='盘点状态' name='status'>
                <CheckStatusSelect />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='创建人' name='creator'>
                <Select
                  showSearch
                  placeholder='请输入创建人姓名'
                  filterOption={false}
                  defaultActiveFirstOption={false}
                  onSearch={handleCreatorSearch}
                  notFoundContent={null}
                  style={{ width: '100%' }}
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
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label='盘点人' name='checker'>
                <Select
                  showSearch
                  placeholder='请输入盘点人姓名'
                  filterOption={false}
                  defaultActiveFirstOption={false}
                  onSearch={handleCheckerSearch}
                  notFoundContent={null}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {checkerOptions.map((user) => (
                    <Option key={user.userId} value={user.userId}>
                      {user.realName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='计划时间' name='planDateRange'>
                <RangePicker
                  style={{ width: '100%' }}
                  locale={locale}
                  showTime={{ format: 'HH:mm:ss' }}
                  format='YYYY-MM-DD HH:mm:ss'
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label='实际时间' name='actualDateRange'>
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddDrawer}
            style={{ marginBottom: 16 }}
          >
            新增盘点
          </Button>
        </div>

        <Table
          dataSource={checks}
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
          scroll={{ x: 'max-content' }}
        />
      </Card>
      <CheckAddDrawer
        visible={addDrawerVisible}
        onClose={hideAddDrawer}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}

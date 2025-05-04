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
  Tag,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import debounce from 'lodash/debounce';
import locale from 'antd/es/date-picker/locale/zh_CN';
import {
  pageMovement,
  MovementDto,
} from '../../../api/stock-service/MoveController';
import { getUsersByName } from '../../../api/sys-service/UserController';
import { renderMoveStatus, MoveStatusSelect } from '../components/MoveStatusComponents';
import { getAllAreas, Area } from '../../../api/location-service/AreaController';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function MoveManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [form] = Form.useForm();
  // 新增区域数据状态
  const [areas, setAreas] = useState<Area[]>([]);

  // 分页配置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 操作人和审批人选项
  const [operatorOptions, setOperatorOptions] = useState<any[]>([]);
  const [approverOptions, setApproverOptions] = useState<any[]>([]);

  // 初始化
  useEffect(() => {
    fetchMovements();
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

  // 渲染库位位置
  const renderLocations = (locations: any[]) => {
    if (!locations || locations.length === 0) {
      return '-';
    }

    return (
      <Space size={[0, 4]} wrap>
        {locations.map((loc, idx) => (
          <Tag key={idx} color="cyan" style={{ marginBottom: 4 }}>
            {`${loc.shelfName}: ${loc.storageNames.join(', ')}`}
          </Tag>
        ))}
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
      title: '变更前位置',
      dataIndex: 'beforeLocationVo',
      key: 'beforeLocations',
      render: renderLocations,
    },
    {
      title: '变更后区域',
      dataIndex: ['afterArea', 'areaName'],
      key: 'afterAreaName',
    },
    {
      title: '变更后位置',
      dataIndex: 'afterLocationVo',
      key: 'afterLocations',
      render: renderLocations,
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
  ];

  return (
    <div className="move-manager">
      <Card title="库存移动管理">
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="变动编号" name="movementNo">
                <Input placeholder="请输入变动编号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="变更前区域" name="beforeAreaId">
                <Select
                  placeholder="请选择变更前区域"
                  allowClear
                >
                  {areas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="变更后区域" name="afterAreaId">
                <Select
                  placeholder="请选择变更后区域"
                  allowClear
                >
                  {areas.map((area) => (
                    <Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="状态" name="status">
                <MoveStatusSelect />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="操作人" name="operator">
                <Select
                  showSearch
                  placeholder="请输入操作人姓名"
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
              <Form.Item label="审批人" name="approver">
                <Select
                  showSearch
                  placeholder="请输入审批人姓名"
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
              <Form.Item label="日期范围" name="dateRange">
                <RangePicker
                  style={{ width: '100%' }}
                  locale={locale}
                  showTime={{ format: 'HH:mm:ss' }}
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </Form.Item>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="primary"
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
          dataSource={movements}
          columns={columns}
          rowKey="id"
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

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
  Tooltip,
  Typography,
  Popconfirm,
  Tag,
  Drawer,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd/es/table';
import {
  pageAreas,
  AreaVo,
  AreaDto,
  addArea,
  updateArea,
  deleteArea,
  AreaInspector,
} from '../../../api/location-service/AreaController';
import { getAdminList, User, getAllUsers } from '../../../api/sys-service/UserController';
import AreaForm from './AreaForm';

const { Title } = Typography;
const { Option } = Select;

// 查询条件类型定义
interface QueryParams {
  areaName: string;
  areaManager: string;
  status: number | null;
  page: number;
  pageSize: number;
}

export default function AreaManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [areas, setAreas] = useState<AreaVo[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    areaName: '',
    areaManager: '',
    status: 1, // 默认查询启用状态
    page: 1,
    pageSize: 10,
  });
  const [adminOptions, setAdminOptions] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [form] = Form.useForm();

  // 抽屉和表单状态
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isViewMode, setIsViewMode] = useState<boolean>(true); // 是否是查看模式
  const [currentArea, setCurrentArea] = useState<Partial<AreaDto>>({});

  // 初始化
  useEffect(() => {
    fetchAreas();
    fetchAdmins();
    fetchAllUsers();
  }, []);

  // 加载区域数据
  const fetchAreas = async (params: QueryParams = queryParams) => {
    try {
      setLoading(true);
      const result = await pageAreas(
        params.page,
        params.pageSize,
        params.areaName,
        params.areaManager,
        params.status
      );

      if (result.code === 200 && result.data) {
        setAreas(result.data.records || []);
        setTotal(result.data.total || 0);
      } else {
        message.error(result.msg || '获取区域列表失败');
      }
    } catch (error) {
      console.error('获取区域列表出错:', error);
      message.error('获取区域列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载管理员列表
  const fetchAdmins = async () => {
    try {
      const result = await getAdminList();
      if (result.code === 200 && result.data) {
        setAdminOptions(result.data);
      } else {
        message.error(result.msg || '获取管理员列表失败');
      }
    } catch (error) {
      console.error('获取管理员列表出错:', error);
      message.error('获取管理员列表失败');
    }
  };

  // 获取所有用户
  const fetchAllUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.code === 200 && result.data) {
        setAllUsers(result.data);
      } else {
        message.error(result.msg || '获取用户列表失败');
      }
    } catch (error) {
      console.error('获取用户列表出错:', error);
      message.error('获取用户列表失败');
    }
  };

  // 处理查询表单提交
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newParams = {
      ...queryParams,
      page: 1, // 重置到第一页
      areaName: values.areaName || '',
      areaManager: values.areaManager || '',
      status: values.status,
    };
    setQueryParams(newParams);
    fetchAreas(newParams);
  };

  // 处理重置查询
  const handleReset = () => {
    form.resetFields();
    const newParams = {
      areaName: '',
      areaManager: '',
      status: 1,  // 重置为启用状态
      page: 1,
      pageSize: queryParams.pageSize,
    };
    setQueryParams(newParams);
    fetchAreas(newParams);
  };

  // 处理分页变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    const newParams = {
      ...queryParams,
      page: pagination.current || 1,
      pageSize: pagination.pageSize || 10,
    };
    setQueryParams(newParams);
    fetchAreas(newParams);
  };

  // 打开添加区域抽屉
  const handleAddArea = () => {
    setIsEdit(false);
    setIsViewMode(false); // 新增直接进入编辑模式
    setCurrentArea({
      status: 1, // 默认启用
      primaryUser: undefined,
      secondaryUsers: [],
    });
    setDrawerVisible(true);
  };

  // 打开查看区域抽屉
  const handleViewArea = (record: AreaVo) => {
    setIsEdit(true);
    setIsViewMode(true); // 详情默认是查看模式
    
    // 创建符合 AreaDto 的对象
    const areaData: Partial<AreaDto> = {
      ...record,
      // 如果有 inspectors 数据，处理主要负责人和次要负责人
      primaryUser: undefined,
      secondaryUsers: [],
    };
    
    // 处理质检员数据
    if (record.inspectors && record.inspectors.length > 0) {
      // 寻找主要负责人
      const primaryInspector = record.inspectors.find(i => i.isPrimary === 1);
      const secondaryInspectors = record.inspectors.filter(i => i.isPrimary === 0);
      
      // 如果找到主要负责人，设置 primaryUser
      if (primaryInspector) {
        const primaryUser = allUsers.find(u => u.userId === primaryInspector.inspectorId);
        if (primaryUser) {
          areaData.primaryUser = primaryUser;
        }
      }
      
      // 设置次要负责人
      if (secondaryInspectors.length > 0) {
        areaData.secondaryUsers = secondaryInspectors.map(inspector => {
          const user = allUsers.find(u => u.userId === inspector.inspectorId);
          return user as User;
        }).filter(Boolean);
      }
    }
    
    setCurrentArea(areaData);
    setDrawerVisible(true);
  };

  // 切换到编辑模式
  const handleEdit = () => {
    setIsViewMode(false);
  };

  // 处理禁用区域
  const handleDeleteArea = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteArea(id);
      if (result.code === 200) {
        message.success('禁用成功');
        fetchAreas();
      } else {
        message.error(result.msg || '禁用失败');
      }
    } catch (error) {
      console.error('禁用出错:', error);
      message.error('禁用失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交（新增或编辑）
  const handleFormSubmit = async (values: AreaDto) => {
    try {
      setSubmitLoading(true);
      
      let result;
      if (isEdit) {
        // 编辑模式
        result = await updateArea(currentArea.id as string, values);
      } else {
        // 新增模式
        result = await addArea(values);
      }
      
      if (result.code === 200) {
        // API成功返回，result.data可能是操作成功后的区域ID
        message.success(isEdit ? '更新区域成功' : '添加区域成功');
        setDrawerVisible(false);
        fetchAreas();
      } else {
        message.error(result.msg || (isEdit ? '更新区域失败' : '添加区域失败'));
      }
    } catch (error) {
      console.error(isEdit ? '更新区域出错:' : '添加区域出错:', error);
      message.error(isEdit ? '更新区域失败' : '添加区域失败');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 关闭抽屉
  const handleCancel = () => {
    setDrawerVisible(false);
  };

  // 渲染状态
  const renderStatus = (status: number) => {
    return status === 1 ? (
      <span style={{ color: 'green' }}>启用</span>
    ) : (
      <span style={{ color: 'red' }}>禁用</span>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '区域名称',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '区域编码',
      dataIndex: 'areaCode',
      key: 'areaCode',
      width: 120,
    },
    {
      title: '负责人',
      dataIndex: 'areaManagerName',
      key: 'areaManagerName',
      width: 120,
    },
    {
      title: '质检员',
      dataIndex: 'inspectors',
      key: 'inspectors',
      width: 200,
      render: (inspectors: AreaInspector[]) => {
        if (!inspectors || inspectors.length === 0) return '-';
        return (
          <Space size={[0, 4]} wrap>
            {inspectors.map((inspector) => (
              <Tag 
                color={inspector.isPrimary === 1 ? 'red' : 'green'} 
                key={inspector.id}
              >
                {inspector.inspectorName}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string) => {
        if (!text) return '-';
        const displayText =
          text.length > 10 ? `${text.substring(0, 10)}...` : text;
        return <Tooltip title={text}>{displayText}</Tooltip>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: AreaVo) => (
        <Space size='small'>
          <Button 
            type='link' 
            size='small'
            icon={<EyeOutlined />}
            onClick={() => handleViewArea(record)}
          >
            详情
          </Button>
          <Popconfirm
            title='确定要删除这个区域吗?'
            onConfirm={() => handleDeleteArea(record.id)}
            okText='确定'
            cancelText='取消'
          >
            <Button type='link' size='small' danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 更新列定义
  const updatedColumns = columns;

  return (
    <Card title={<Title level={4}>区域管理</Title>}>
      {/* 查询表单 */}
      <Form form={form} layout='inline' style={{ marginBottom: '20px' }}>
        <Form.Item name='areaName' label='区域名称'>
          <Input placeholder='请输入区域名称' allowClear />
        </Form.Item>
        <Form.Item name='areaManager' label='负责人'>
          <Select placeholder='请选择负责人' style={{ width: 200 }} allowClear>
            {adminOptions.map((admin) => (
              <Option key={admin.userId} value={admin.userId}>
                {admin.realName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name='status' label='状态' initialValue={1}>
          <Select style={{ width: 120 }}>
            <Option value={null}>全部</Option>
            <Option value={1}>启用</Option>
            <Option value={0}>禁用</Option>
          </Select>
        </Form.Item>
        <Form.Item>
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
        </Form.Item>
      </Form>

      {/* 操作按钮 */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={handleAddArea}>
          新增区域
        </Button>
      </div>

      {/* 区域表格 */}
      <Table
        rowKey='id'
        columns={updatedColumns}
        dataSource={areas}
        loading={loading}
        pagination={{
          current: queryParams.page,
          pageSize: queryParams.pageSize,
          total: total,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50'],
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />

      {/* 区域表单抽屉 */}
      <Drawer
        title={
          isEdit 
            ? (isViewMode ? '区域详情' : '编辑区域') 
            : '新增区域'
        }
        width={700}
        open={drawerVisible}
        onClose={handleCancel}
        destroyOnClose
        extra={
          isEdit && isViewMode ? (
            <Button type="primary" onClick={handleEdit}>
              编辑
            </Button>
          ) : null
        }
      >
        <AreaForm
          initialValues={currentArea}
          onFinish={handleFormSubmit}
          onCancel={handleCancel}
          adminOptions={adminOptions}
          userOptions={allUsers}
          loading={submitLoading}
          isEdit={isEdit}
          disabled={isViewMode} // 详情模式时禁用表单
        />
      </Drawer>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Shelf,
  ShelfVo,
  pageShelf,
  deleteShelf,
  checkShelfCode,
  checkShelfName,
} from '../../../api/location-service/ShelfController';
import { getAllAreas } from '../../../api/location-service/AreaController';
import { Area } from '../../../api/location-service/AreaController';
import ShelfDrawer from './ShelfDrawer';
import styles from './ShelfManager.module.css';

const { Option } = Select;
const { Title } = Typography;

export default function ShelfManager() {
  // 状态定义
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [shelfList, setShelfList] = useState<(Shelf & ShelfVo)[]>([]);
  const [areaList, setAreaList] = useState<Area[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [drawerTitle, setDrawerTitle] = useState<string>('');
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  
  // 搜索表单
  const [searchForm] = Form.useForm();
  // 抽屉表单
  const [drawerForm] = Form.useForm();

  // 加载区域数据
  useEffect(() => {
    loadAreas();
  }, []);

  // 加载货架数据
  useEffect(() => {
    loadShelfList();
  }, [current, pageSize, refreshFlag]);

  // 加载区域数据方法
  const loadAreas = async () => {
    try {
      const res = await getAllAreas();
      if (res.code === 200) {
        setAreaList(res.data);
      } else {
        message.error(res.msg || '获取区域数据失败');
      }
    } catch (error) {
      console.error('获取区域数据出错:', error);
      message.error('获取区域数据出错');
    }
  };

  // 加载货架列表方法
  const loadShelfList = async () => {
    try {
      setLoading(true);
      const formValues = searchForm.getFieldsValue();
      const res = await pageShelf(
        current,
        pageSize,
        formValues.shelfName || '',
        formValues.areaId || '',
        formValues.status === undefined ? 1 : formValues.status
      );
      
      if (res.code === 200) {
        setShelfList(res.data.records as (Shelf & ShelfVo)[]);
        setTotal(res.data.total);
      } else {
        message.error(res.msg || '获取货架数据失败');
      }
    } catch (error) {
      console.error('获取货架数据出错:', error);
      message.error('获取货架数据出错');
    } finally {
      setLoading(false);
    }
  };

  // 查询按钮点击
  const handleSearch = () => {
    setCurrent(1); // 重置到第一页
    setRefreshFlag(!refreshFlag);
  };

  // 重置按钮点击
  const handleReset = () => {
    searchForm.resetFields();
    setCurrent(1);
    setRefreshFlag(!refreshFlag);
  };

  // 打开新增抽屉
  const handleAdd = () => {
    setDrawerTitle('新增货架');
    setEditingShelf(null);
    drawerForm.resetFields();
    setDrawerVisible(true);
  };

  // 打开编辑抽屉
  const handleEdit = (record: Shelf) => {
    setDrawerTitle('编辑货架');
    setEditingShelf(record);
    drawerForm.setFieldsValue({
      ...record,
      status: record.status === 1
    });
    setDrawerVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    drawerForm.resetFields();
  };

  // 抽屉操作成功回调
  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    drawerForm.resetFields();
    setRefreshFlag(!refreshFlag);
  };

  // 删除(禁用)货架
  const handleDisable = async (id: string) => {
    try {
      const res = await deleteShelf(id);
      if (res.code === 200) {
        message.success('禁用货架成功');
        // 如果当前页只有一条数据且不是第一页，则跳转到上一页
        if (shelfList.length === 1 && current > 1) {
          setCurrent(current - 1);
        } else {
          setRefreshFlag(!refreshFlag);
        }
      } else {
        message.error(res.msg || '禁用货架失败');
      }
    } catch (error) {
      console.error('禁用货架出错:', error);
      message.error('禁用货架出错');
    }
  };

  // 校验货架编码
  const validateShelfCode = async (_: any, value: string) => {
    if (!value) return Promise.reject(new Error('请输入货架编码'));
    
    const areaId = drawerForm.getFieldValue('areaId');
    if (!areaId) return Promise.reject(new Error('请先选择区域'));
    
    try {
      // 如果是编辑状态且编码未修改，则不需要校验
      if (editingShelf && editingShelf.shelfCode === value && editingShelf.areaId === areaId) {
        return Promise.resolve();
      }
      
      const res = await checkShelfCode(areaId, value);
      if (res.code === 200) {
        if (res.data === false) {
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('货架编码已存在'));
        }
      } else {
        return Promise.reject(new Error(res.msg || '校验货架编码失败'));
      }
    } catch (error) {
      console.error('校验货架编码出错:', error);
      return Promise.reject(new Error('校验货架编码出错'));
    }
  };

  // 校验货架名称
  const validateShelfName = async (_: any, value: string) => {
    if (!value) return Promise.reject(new Error('请输入货架名称'));
    
    const areaId = drawerForm.getFieldValue('areaId');
    if (!areaId) return Promise.reject(new Error('请先选择区域'));
    
    try {
      // 如果是编辑状态且名称未修改，则不需要校验
      if (editingShelf && editingShelf.shelfName === value && editingShelf.areaId === areaId) {
        return Promise.resolve();
      }
      
      const res = await checkShelfName(areaId, value);
      if (res.code === 200) {
        if (res.data === false) {
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('货架名称已存在'));
        }
      } else {
        return Promise.reject(new Error(res.msg || '校验货架名称失败'));
      }
    } catch (error) {
      console.error('校验货架名称出错:', error);
      return Promise.reject(new Error('校验货架名称出错'));
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '货架名称',
      dataIndex: 'shelfName',
      key: 'shelfName',
    },
    {
      title: '货架编码',
      dataIndex: 'shelfCode',
      key: 'shelfCode',
    },
    {
      title: '所属区域',
      dataIndex: 'areaName',
      key: 'areaName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <span style={{ color: status === 1 ? 'green' : 'red' }}>
          {status === 1 ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shelf) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要禁用这个货架吗?"
            onConfirm={() => handleDisable(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={record.status === 0}
          >
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              disabled={record.status === 0}
            >
              禁用
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.shelfManager}>
      <Card>
        <Title level={4}>货架管理</Title>
        
        {/* 搜索表单 */}
        <Form form={searchForm} layout="inline" className={styles.searchForm}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="shelfName" label="货架名称">
                <Input placeholder="请输入货架名称" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="areaId" label="所属区域">
                <Select placeholder="请选择区域" allowClear>
                  {areaList.map(area => (
                    <Option key={area.id} value={area.id}>{area.areaName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="状态" initialValue={1}>
                <Select placeholder="请选择状态">
                  <Option value={null}>全部</Option>
                  <Option value={1}>启用</Option>
                  <Option value={0}>禁用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleSearch}
                  >
                    查询
                  </Button>
                  <Button icon={<UndoOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                  >
                    新增
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        {/* 数据表格 */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={shelfList}
          loading={loading}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size);
            },
          }}
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* 抽屉表单 */}
      <ShelfDrawer
        visible={drawerVisible}
        title={drawerTitle}
        onClose={handleCloseDrawer}
        onSuccess={handleDrawerSuccess}
        areaList={areaList}
        editingShelf={editingShelf}
        validateShelfCode={validateShelfCode}
        validateShelfName={validateShelfName}
        drawerForm={drawerForm}
      />
    </div>
  );
}


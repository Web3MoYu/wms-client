import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Select,
  Button,
  Row,
  Col,
  Space,
  Form,
  Tag,
  Input,
  Popconfirm,
  message,
} from 'antd';
import {
  getAllAreas,
  Area,
} from '../../../api/location-service/AreaController';
import {
  getShelfListByAreaId,
  Shelf,
} from '../../../api/location-service/ShelfController';
import {
  pageStorages,
  StorageVo,
  deleteStorage,
} from '../../../api/location-service/StorageController';
import {
  searchProducts,
  Product,
} from '../../../api/product-service/ProductController';
import {
  SearchOutlined,
  ClearOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import debounce from 'lodash/debounce';
import StorageDrawer from './StorageDrawer';

export default function StorageManager() {
  // 状态定义
  const [areas, setAreas] = useState<Area[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [storages, setStorages] = useState<StorageVo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [editingStorage, setEditingStorage] = useState<StorageVo | null>(null);

  // 查询参数
  const [form] = Form.useForm();
  // 抽屉表单
  const [drawerForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 初始化加载区域数据
  useEffect(() => {
    fetchAreas();
  }, []);

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

  // 根据区域ID获取货架列表
  const fetchShelves = async (areaId: string) => {
    if (!areaId) {
      setShelves([]);
      return;
    }

    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves(res.data);
      }
    } catch (error) {
      console.error('获取货架列表失败', error);
    }
  };

  // 当区域变化时，重新获取货架列表，并清空已选择的货架
  const handleAreaChange = (areaId: string) => {
    form.setFieldsValue({ shelfId: undefined });
    fetchShelves(areaId);
  };

  // 模糊搜索产品
  const handleProductSearch = debounce(async (productName: string) => {
    if (!productName || productName.length < 1) {
      setProducts([]);
      return;
    }

    try {
      const res = await searchProducts(productName);
      if (res.code === 200) {
        setProducts(res.data);
      }
    } catch (error) {
      console.error('搜索产品失败', error);
    }
  }, 500);

  // 查询库位
  const fetchStorages = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const res = await pageStorages(
        pagination.current,
        pagination.pageSize,
        values.areaId || '',
        values.shelfId || '',
        values.status === undefined ? 1 : values.status, // 默认查询空闲状态(1)
        values.locationName || '', // 使用表单中的locationName进行模糊查询
        values.productId || ''
      );

      if (res.code === 200) {
        setStorages(res.data.records);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('查询库位失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 分页变化
  const handleTableChange = (pagination: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  };

  // 监听分页变化，重新获取数据
  useEffect(() => {
    fetchStorages();
  }, [pagination.current, pagination.pageSize]);

  // 处理新增库位
  const handleAdd = () => {
    setDrawerTitle('新增库位');
    setEditingStorage(null);
    // 清空表单
    drawerForm.resetFields();
    // 打开抽屉
    setDrawerVisible(true);
  };

  // 处理编辑库位
  const handleEdit = (record: StorageVo) => {
    setDrawerTitle('编辑库位');
    setEditingStorage(record);
    // 设置表单值
    drawerForm.setFieldsValue({
      ...record,
    });
    // 打开抽屉
    setDrawerVisible(true);
  };

  // 处理删除库位
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteStorage(id);
      if (result.code === 200) {
        message.success(result.msg || '禁用库位成功');
        fetchStorages(); // 刷新列表
      } else {
        message.error(result.msg || '禁用库位失败');
      }
    } catch (error) {
      console.error('禁用库位失败:', error);
      message.error('禁用库位失败');
    } finally {
      setLoading(false);
    }
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  // 抽屉操作成功
  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    fetchStorages(); // 刷新数据
  };

  // 表格列定义
  const columns = [
    {
      title: '库位编码',
      dataIndex: 'locationCode',
      key: 'locationCode',
    },
    {
      title: '库位名称',
      dataIndex: 'locationName',
      key: 'locationName',
    },
    {
      title: '区域',
      dataIndex: 'areaName',
      key: 'areaName',
    },
    {
      title: '货架',
      dataIndex: 'shelfName',
      key: 'shelfName',
    },
    {
      title: '产品',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        if (status === 0) {
          return <Tag color='red'>占用</Tag>;
        } else if (status === 1) {
          return <Tag color='green'>空闲</Tag>;
        } else {
          return <Tag color='gray'>禁用</Tag>;
        }
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StorageVo) => (
        <Space size='middle'>
          <Button
            type='link'
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title='确定要禁用此库位吗？'
            onConfirm={() => handleDelete(record.id)}
            okText='确定'
            cancelText='取消'
          >
            <Button type='link' danger icon={<DeleteOutlined />}>
              禁用
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title='库位管理' style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout='horizontal'
          initialValues={{ status: 1 }} // 默认选择空闲状态
          onFinish={fetchStorages}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name='areaId'
                label='区域'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Select
                  placeholder='请选择区域'
                  allowClear
                  onChange={handleAreaChange}
                >
                  {areas.map((area) => (
                    <Select.Option key={area.id} value={area.id}>
                      {area.areaName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name='shelfId'
                label='货架'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Select
                  placeholder='请选择货架'
                  allowClear
                  disabled={!form.getFieldValue('areaId')}
                >
                  {shelves.map((shelf) => (
                    <Select.Option key={shelf.id} value={shelf.id}>
                      {shelf.shelfName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name='locationName'
                label='库位名称'
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
              >
                <Input placeholder='请输入库位名称' allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name='status'
                label='状态'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Select placeholder='请选择状态'>
                  <Select.Option value={null}>全部</Select.Option>
                  <Select.Option value={1}>空闲</Select.Option>
                  <Select.Option value={0}>占用</Select.Option>
                  <Select.Option value={2}>禁用</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item
                name='productId'
                label='产品'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Select
                  placeholder='请输入产品名称搜索'
                  allowClear
                  showSearch
                  filterOption={false}
                  onSearch={handleProductSearch}
                >
                  {products.map((product) => (
                    <Select.Option key={product.id} value={product.id}>
                      {product.productName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={0} sm={0} md={0} lg={12}></Col>
            <Col
              xs={24}
              sm={12}
              md={8}
              lg={6}
              style={{
                textAlign: 'right',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type='primary'
                  htmlType='submit'
                  icon={<SearchOutlined />}
                  style={{ marginRight: 8, borderRadius: '4px' }}
                >
                  查询
                </Button>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => {
                    form.resetFields();
                    setShelves([]);
                  }}
                  style={{ borderRadius: '4px' }}
                >
                  重置
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Space>
            <Button
              type='primary'
              ghost
              onClick={fetchStorages}
              icon={<SearchOutlined />}
              style={{ borderRadius: '4px' }}
            >
              刷新数据
            </Button>
          </Space>
          <Space>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ borderRadius: '4px' }}
            >
              新增库位
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={storages}
          rowKey='id'
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            pageSizeOptions: ['5', '10', '20', '50', '100'],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 库位抽屉组件 */}
      <StorageDrawer
        visible={drawerVisible}
        title={drawerTitle}
        onClose={handleCloseDrawer}
        onSuccess={handleDrawerSuccess}
        areaList={areas}
        editingStorage={editingStorage}
        drawerForm={drawerForm}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Form,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
  Tag,
  ConfigProvider,
  Modal,
  Input,
  InputNumber,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { SortOrder } from 'antd/es/table/interface';
import debounce from 'lodash/debounce';
import {
  StockVo,
  StockDto,
  getStockList,
  getBatchNumber,
  getStockByProductIdAndBatchNumber,
} from '../../../api/stock-service/StockController';
import {
  Area,
  getAllAreas,
} from '../../../api/location-service/AreaController';
import {
  searchProducts,
  Product,
} from '../../../api/product-service/ProductController';
import StockDrawer from './StockDrawer';
import StockDetail from './StockDetail';
import zhCN from 'antd/es/locale/zh_CN';
import { updateAlertConfig } from '../../../api/stock-service/AlertController';

// 组件主体
export default function StockManager() {
  // 状态管理
  const [stocks, setStocks] = useState<StockVo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');

  // 详情抽屉状态
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailStock, setDetailStock] = useState<StockVo | null>(null);

  // 表单和分页
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // 排序状态
  const [sortConfig, setSortConfig] = useState<{
    prodDate?: boolean;
    quantity?: boolean;
    availableQuantity?: boolean;
  }>({});

  // 预警配置Modal状态
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [currentStock, setCurrentStock] = useState<StockVo | null>(null);
  const [minStock, setMinStock] = useState<number | null>(null);
  const [maxStock, setMaxStock] = useState<number | null>(null);

  // 初始化加载
  useEffect(() => {
    fetchAreas();
  }, []);

  // 监听分页改变，重新加载数据
  useEffect(() => {
    fetchStocks();
  }, [pagination.current, pagination.pageSize, sortConfig]);

  // 获取所有区域
  const fetchAreas = async () => {
    try {
      const res = await getAllAreas();
      if (res.code === 200) {
        setAreas(res.data);
      }
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  };

  // 获取库存列表
  const fetchStocks = async () => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();

      const stockDto: StockDto = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        productId: values.productId || '',
        areaId: values.areaId || '',
        status: values.status === undefined ? null : values.status,
        batchNumber: values.batchNumber || '',
        ascSortByProdDate:
          sortConfig.prodDate === undefined ? null : sortConfig.prodDate,
        ascSortByQuantity:
          sortConfig.quantity === undefined ? null : sortConfig.quantity,
        ascSortByAvailableQuantity:
          sortConfig.availableQuantity === undefined
            ? null
            : sortConfig.availableQuantity,
      };

      const res = await getStockList(stockDto);
      if (res.code === 200) {
        setStocks(res.data.records);
        setTotal(res.data.total);
      } else {
        message.error(res.msg || '获取库存列表失败');
      }
    } catch (error) {
      console.error('获取库存列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 产品搜索（防抖）
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
      console.error('搜索产品失败:', error);
    }
  }, 500);

  // 批次号搜索（防抖）
  const handleBatchNumberSearch = debounce(async (batchNumber: string) => {
    if (!batchNumber || batchNumber.length < 1) {
      setBatchNumbers([]);
      return;
    }

    try {
      const res = await getBatchNumber(batchNumber);
      if (res.code === 200 && res.data) {
        const batchList = Array.isArray(res.data)
          ? res.data
          : typeof res.data === 'string'
          ? res.data.split(',')
          : [String(res.data)];

        setBatchNumbers(batchList);
      } else {
        setBatchNumbers([]);
      }
    } catch (error) {
      console.error('搜索批次号失败:', error);
      setBatchNumbers([]);
    }
  }, 500);

  // 分页变化处理
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    setPagination({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });

    // 清空之前的排序状态
    const newSortConfig: {
      prodDate?: boolean;
      quantity?: boolean;
      availableQuantity?: boolean;
    } = {};

    // 根据当前排序字段设置排序状态
    if (sorter.field) {
      switch (sorter.field) {
        case 'productionDate':
          newSortConfig.prodDate = sorter.order === 'ascend';
          break;
        case 'quantity':
          newSortConfig.quantity = sorter.order === 'ascend';
          break;
        case 'availableQuantity':
          newSortConfig.availableQuantity = sorter.order === 'ascend';
          break;
      }
    }

    setSortConfig(newSortConfig);
  };

  // 处理新增库存
  const handleAdd = () => {
    setDrawerTitle('新增库存');
    setDrawerVisible(true);
  };

  // 处理查看详情
  const handleViewDetail = (record: StockVo) => {
    setDetailStock(record);
    setDetailVisible(true);
  };

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false);
  };

  // 抽屉操作成功
  const handleDrawerSuccess = () => {
    setDrawerVisible(false);
    fetchStocks();
  };

  // 详情刷新
  const handleDetailRefresh = async () => {
    // 先刷新库存列表保持列表数据最新
    await fetchStocks();

    // 如果当前有正在查看的详情，直接通过API重新获取最新数据
    if (detailStock && detailVisible) {
      try {
        // 使用批次号和商品ID直接从API获取最新数据
        const res = await getStockByProductIdAndBatchNumber(
          detailStock.productId,
          detailStock.batchNumber
        );

        if (res.code === 200 && res.data) {
          // 更新详情数据
          setDetailStock(res.data);
        } else {
          message.warning('获取最新库存数据失败，请重新打开详情查看');
        }
      } catch (error) {
        console.error('刷新详情数据失败:', error);
        message.error('获取最新库存数据出错，请重新打开详情查看');
      }
    }
  };

  // 打开预警配置Modal
  const handleConfigAlert = (record: StockVo) => {
    setCurrentStock(record);
    setMinStock(record.minStock || null);
    setMaxStock(record.maxStock || null);
    setAlertModalVisible(true);
  };

  // 关闭预警配置Modal
  const handleAlertModalCancel = () => {
    setAlertModalVisible(false);
    setCurrentStock(null);
    setMinStock(null);
    setMaxStock(null);
  };

  // 保存预警配置
  const handleAlertConfigSave = async () => {
    if (!currentStock) return;

    try {
      const stock = {
        id: currentStock.id,
        productId: currentStock.productId,
        productCode: currentStock.productCode,
        areaId: currentStock.areaId,
        location: currentStock.location || [],
        quantity: currentStock.quantity,
        availableQuantity: currentStock.availableQuantity,
        batchNumber: currentStock.batchNumber,
        minStock,
        maxStock,
        alertStatus: currentStock.alertStatus,
        productionDate: currentStock.productionDate,
        createTime: currentStock.createTime,
        updateTime: currentStock.updateTime,
      };

      const res = await updateAlertConfig(stock);
      if (res.code === 200) {
        message.success('预警配置更新成功');
        setAlertModalVisible(false);
        fetchStocks(); // 刷新列表
      } else {
        message.error(res.msg || '预警配置更新失败');
      }
    } catch (error) {
      console.error('预警配置更新失败:', error);
      message.error('预警配置更新失败，请稍后重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '所属区域',
      dataIndex: 'areaName',
      key: 'areaName',
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: '可用数量',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: '预警状态',
      dataIndex: 'alertStatus',
      key: 'alertStatus',
      render: (status: number) => {
        if (status === 0) {
          return <Tag color='green'>正常</Tag>;
        } else if (status === 1) {
          return <Tag color='orange'>低于最小库存</Tag>;
        } else if (status === 2) {
          return <Tag color='red'>超过最大库存</Tag>;
        }
        return <Tag color='default'>未知</Tag>;
      },
    },
    {
      title: '最小库存',
      dataIndex: 'minStock',
      key: 'minStock',
      render: (minStock: number) => minStock || '-',
    },
    {
      title: '最大库存',
      dataIndex: 'maxStock',
      key: 'maxStock',
      render: (maxStock: number) => maxStock || '-',
    },
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      key: 'productionDate',
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: StockVo) => (
        <Space size='middle'>
          <Button type='link' onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type='link' onClick={() => handleConfigAlert(record)}>
            预警
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <div>
        <Card title='库存管理' style={{ marginBottom: 16 }}>
          <Form form={form} layout='horizontal' onFinish={fetchStocks}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name='areaId'
                  label='区域'
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Select placeholder='请选择区域' allowClear>
                    <Select.Option value=''>全部</Select.Option>
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
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name='batchNumber'
                  label='批次号'
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                >
                  <Select
                    placeholder='请输入批次号搜索'
                    allowClear
                    showSearch
                    filterOption={false}
                    onSearch={handleBatchNumberSearch}
                  >
                    {batchNumbers.map((batch) => (
                      <Select.Option key={batch} value={batch}>
                        {batch}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Form.Item
                  name='status'
                  label='预警状态'
                  labelCol={{ span: 8 }}
                  wrapperCol={{ span: 16 }}
                >
                  <Select placeholder='请选择预警状态'>
                    <Select.Option value={null}>全部</Select.Option>
                    <Select.Option value={0}>正常</Select.Option>
                    <Select.Option value={1}>低于最小库存</Select.Option>
                    <Select.Option value={2}>超过最大库存</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={0} sm={0} md={0} lg={12}></Col>
              <Col
                span={24}
                style={{
                  textAlign: 'right',
                  marginTop: 8,
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
                      fetchStocks();
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
                onClick={fetchStocks}
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
                新增库存
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={stocks}
            rowKey='id'
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: total,
              pageSizeOptions: ['5', '10', '20', '50'],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={handleTableChange}
          />
        </Card>

        {/* 库存抽屉组件 */}
        <StockDrawer
          visible={drawerVisible}
          title={drawerTitle}
          onClose={handleCloseDrawer}
          onSuccess={handleDrawerSuccess}
        />

        {/* 库存详情组件 */}
        <StockDetail
          visible={detailVisible}
          onClose={handleCloseDetail}
          stock={detailStock}
          onRefresh={handleDetailRefresh}
        />

        {/* 预警配置Modal */}
        <Modal
          title='库存预警配置'
          open={alertModalVisible}
          onCancel={handleAlertModalCancel}
          onOk={handleAlertConfigSave}
          destroyOnClose
        >
          <Form layout='vertical'>
            <Form.Item label='商品名称'>
              <Input value={currentStock?.productName} disabled />
            </Form.Item>
            <Form.Item label='批次号'>
              <Input value={currentStock?.batchNumber} disabled />
            </Form.Item>
            <Form.Item label='最小库存'>
              <InputNumber
                style={{ width: '100%' }}
                value={minStock}
                onChange={(value) =>
                  setMinStock(value === undefined ? null : value)
                }
                placeholder='请输入最小库存数量'
                min={0}
              />
            </Form.Item>
            <Form.Item label='最大库存'>
              <InputNumber
                style={{ width: '100%' }}
                value={maxStock}
                onChange={(value) =>
                  setMaxStock(value === undefined ? null : value)
                }
                placeholder='请输入最大库存数量'
                min={0}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}

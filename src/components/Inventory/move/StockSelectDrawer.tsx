import { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Table,
  Form,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { SortOrder } from 'antd/es/table/interface';
import debounce from 'lodash/debounce';
import {
  StockVo,
  StockDto,
  getStockList,
} from '../../../api/stock-service/StockController';
import {
  Area,
  getAllAreas,
} from '../../../api/location-service/AreaController';
import {
  searchProducts,
  Product,
} from '../../../api/product-service/ProductController';
import { getBatchNumber } from '../../../api/stock-service/StockController';
import StockDetail from './StockDetail';
import { renderAlertStatus, AlertStatusSelect } from '../components/StockStatusComponents';

interface StockSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (stock: StockVo) => void;
}

export default function StockSelectDrawer({
  visible,
  onClose,
  onSelect,
}: StockSelectDrawerProps) {
  // 状态管理
  const [stocks, setStocks] = useState<StockVo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

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

  // 初始化加载
  useEffect(() => {
    if (visible) {
      fetchAreas();
      fetchStocks();
    }
  }, [visible, pagination.current, pagination.pageSize, sortConfig]);

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

  // 处理查看详情
  const handleViewDetail = (record: StockVo) => {
    setDetailStock(record);
    setDetailVisible(true);
  };

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false);
  };

  // 选择库存
  const handleSelectStock = (record: StockVo) => {
    onSelect(record);
    onClose();
  };

  // 详情刷新
  const handleDetailRefresh = () => {
    fetchStocks();
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
      render: renderAlertStatus,
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
          <Button
            type='primary'
            size='small'
            onClick={() => handleSelectStock(record)}
          >
            选择
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title='选择要变更的库存'
      open={visible}
      onClose={onClose}
      width={900}
      destroyOnClose
    >
      <Card>
        <Form form={form} layout='horizontal' onFinish={fetchStocks}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
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
            <Col xs={24} sm={12} md={8}>
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
            <Col xs={24} sm={12} md={8}>
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
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name='status'
                label='预警状态'
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <AlertStatusSelect />
              </Form.Item>
            </Col>
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

      {/* 库存详情组件 */}
      <StockDetail
        visible={detailVisible}
        onClose={handleCloseDetail}
        stock={detailStock}
        onRefresh={handleDetailRefresh}
      />
    </Drawer>
  );
}

import { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Card,
  Form,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
  ConfigProvider,
  InputNumber,
  Typography,
  Badge,
  Divider,
  Tag,
  Alert,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ClearOutlined,
  CheckOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  PlusOutlined,
  AppstoreOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { SortOrder } from 'antd/es/table/interface';
import debounce from 'lodash/debounce';
import {
  StockVo,
  StockDto,
  getStockList,
  getBatchNumber,
} from '../../../../api/stock-service/StockController';
import {
  Area,
  getAllAreas,
} from '../../../../api/location-service/AreaController';
import {
  searchProducts,
  Product,
  getProductById,
} from '../../../../api/product-service/ProductController';
import zhCN from 'antd/es/locale/zh_CN';

const { Text } = Typography;

// 选择的库存数据结构，增加了expectedQuantity和price字段
interface SelectedStock extends StockVo {
  expectedQuantity: number;
  price: number; // 添加价格字段
}

interface StockSelectDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectStock: (selectedStocks: SelectedStock[]) => void;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

const StockSelectDrawer: React.FC<StockSelectDrawerProps> = ({
  visible,
  onClose,
  onSelectStock,
  placement = 'bottom',
}) => {
  // 状态管理
  const [stocks, setStocks] = useState<StockVo[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 选择的库存和数量 - 改为Map存储多个选择
  const [selectedStocks, setSelectedStocks] = useState<
    Map<string, SelectedStock>
  >(new Map());
  // 产品价格加载状态
  const [loadingPrices, setLoadingPrices] = useState<Map<string, boolean>>(
    new Map()
  );

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
      // 每次打开抽屉时重置已选状态
      setSelectedStocks(new Map());
      setLoadingPrices(new Map());
    }
  }, [visible]);

  // 监听分页改变，重新加载数据
  useEffect(() => {
    if (visible) {
      fetchStocks();
    }
  }, [pagination.current, pagination.pageSize, sortConfig, visible]);

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
        batchNumber: values.batchNumber || '',
        status: 0, // 使用0表示全部状态
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

  // 获取产品价格
  const fetchProductPrice = async (productId: string, stockId: string) => {
    if (!productId) return 0;

    // 设置加载状态
    setLoadingPrices((prev) => new Map(prev).set(stockId, true));

    try {
      const res = await getProductById(productId);
      if (res.code === 200 && res.data) {
        const price = Number(res.data.price) || 0;

        // 更新选中项的价格
        setSelectedStocks((prev) => {
          const newMap = new Map(prev);
          if (newMap.has(stockId)) {
            const stock = newMap.get(stockId);
            if (stock) {
              newMap.set(stockId, {
                ...stock,
                price: price,
              });
            }
          }
          return newMap;
        });

        return price;
      }
      return 0;
    } catch (error) {
      console.error('获取产品价格失败:', error);
      return 0;
    } finally {
      setLoadingPrices((prev) => {
        const newMap = new Map(prev);
        newMap.delete(stockId);
        return newMap;
      });
    }
  };

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

  // 处理选择库存
  const handleSelectStock = async (record: StockVo) => {
    // 获取当前选择Map的复制
    const newSelectedStocks = new Map(selectedStocks);

    // 如果已经选中了该记录，取消选中
    if (newSelectedStocks.has(record.id)) {
      newSelectedStocks.delete(record.id);
      setSelectedStocks(newSelectedStocks);
      return;
    }

    // 获取产品价格
    const price = await fetchProductPrice(record.productId, record.id);

    // 添加到选中列表，默认数量为1和获取到的价格
    const stockToAdd: SelectedStock = {
      ...record,
      expectedQuantity: Math.min(1, record.availableQuantity),
      price: price,
    };

    newSelectedStocks.set(record.id, stockToAdd);

    // 更新选中状态
    setSelectedStocks(newSelectedStocks);
  };

  // 处理数量变化
  const handleQuantityChange = (stockId: string, value: number | null) => {
    if (value === null) return;

    // 获取当前选中的库存
    const newSelectedStocks = new Map(selectedStocks);
    const selectedStock = newSelectedStocks.get(stockId);

    if (!selectedStock) return;

    // 确保数量不超过可用数量
    if (value > selectedStock.availableQuantity) {
      message.warning('出库数量不能超过可用数量！');
      // 设置为最大可用数量
      newSelectedStocks.set(stockId, {
        ...selectedStock,
        expectedQuantity: selectedStock.availableQuantity,
      });
    } else {
      // 更新数量
      newSelectedStocks.set(stockId, {
        ...selectedStock,
        expectedQuantity: value,
      });
    }

    setSelectedStocks(newSelectedStocks);
  };

  // 确认选择
  const handleConfirmSelect = () => {
    if (selectedStocks.size === 0) {
      message.warning('请至少选择一项库存！');
      return;
    }

    // 将Map转换为数组
    const selectedStocksArray = Array.from(selectedStocks.values());

    // 校验每个选中项的数量
    for (const stock of selectedStocksArray) {
      if (stock.expectedQuantity <= 0) {
        message.warning(`商品 ${stock.productName} 的出库数量必须大于0！`);
        return;
      }

      if (stock.expectedQuantity > stock.availableQuantity) {
        message.warning(
          `商品 ${stock.productName} 的出库数量不能超过可用数量！`
        );
        return;
      }
    }

    // 传递选中的库存数组给父组件
    onSelectStock(selectedStocksArray);

    // 重置选择状态并关闭抽屉
    setSelectedStocks(new Map());
    onClose();
  };

  // 取消选择并关闭抽屉
  const handleCancel = () => {
    setSelectedStocks(new Map());
    onClose();
  };

  // 移除选中的商品
  const handleRemoveSelected = (stockId: string) => {
    const newSelectedStocks = new Map(selectedStocks);
    newSelectedStocks.delete(stockId);
    setSelectedStocks(newSelectedStocks);
  };

  // 清空所有选中商品
  const handleClearSelected = () => {
    setSelectedStocks(new Map());
  };

  // 渲染已选商品列表
  const renderSelectedStocksList = () => {
    if (selectedStocks.size === 0) return null;

    return (
      <Card
        className='selected-stocks-card'
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>已选商品</span>
            <Badge
              count={selectedStocks.size}
              style={{ backgroundColor: '#52c41a' }}
            />
          </Space>
        }
        extra={
          <Button
            type='link'
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearSelected}
          >
            清空
          </Button>
        }
        style={{ marginBottom: 16 }}
        size='small'
        bodyStyle={{
          padding: '12px 16px',
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {Array.from(selectedStocks.values()).map((stock, index) => (
          <div key={stock.id}>
            {index > 0 && <Divider style={{ margin: '8px 0' }} />}
            <Row gutter={16} align='middle'>
              <Col span={10}>
                <Space direction='vertical' size={0} style={{ width: '100%' }}>
                  <Text strong ellipsis>
                    {stock.productName}
                  </Text>
                  <Space size={4}>
                    <Tag color='blue'>{stock.batchNumber}</Tag>
                    <Tag color='cyan'>{stock.areaName}</Tag>
                  </Space>
                </Space>
              </Col>
              <Col span={10}>
                <Space>
                  {loadingPrices.has(stock.id) ? (
                    <Text type='secondary'>价格加载中...</Text>
                  ) : (
                    <Text type='secondary'>
                      单价: ¥{stock.price.toFixed(2)}
                    </Text>
                  )}
                  <Divider type='vertical' />
                  <InputNumber
                    min={1}
                    max={stock.availableQuantity}
                    value={stock.expectedQuantity}
                    onChange={(value) => handleQuantityChange(stock.id, value)}
                    size='small'
                    controls
                    style={{ width: 100 }}
                    addonAfter={
                      <Text type='secondary'>/ {stock.availableQuantity}</Text>
                    }
                  />
                </Space>
              </Col>
              <Col span={4} style={{ textAlign: 'right' }}>
                <Button
                  type='link'
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveSelected(stock.id)}
                  size='small'
                />
              </Col>
            </Row>
          </div>
        ))}
      </Card>
    );
  };

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    let icon = null;

    switch (field) {
      case 'productionDate':
        if (sortConfig.prodDate !== undefined) {
          icon = sortConfig.prodDate ? (
            <SortAscendingOutlined />
          ) : (
            <SortDescendingOutlined />
          );
        }
        break;
      case 'quantity':
        if (sortConfig.quantity !== undefined) {
          icon = sortConfig.quantity ? (
            <SortAscendingOutlined />
          ) : (
            <SortDescendingOutlined />
          );
        }
        break;
      case 'availableQuantity':
        if (sortConfig.availableQuantity !== undefined) {
          icon = sortConfig.availableQuantity ? (
            <SortAscendingOutlined />
          ) : (
            <SortDescendingOutlined />
          );
        }
        break;
    }

    return icon ? <span style={{ marginLeft: 4 }}>{icon}</span> : null;
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '所属区域',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 140,
      ellipsis: true,
      render: (text: string) => <Tag color='blue'>{text}</Tag>,
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 140,
      ellipsis: true,
      render: (text: string) => <Tag color='cyan'>{text}</Tag>,
    },
    {
      title: <>数量{renderSortIcon('quantity')}</>,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: <>可用数量{renderSortIcon('availableQuantity')}</>,
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: 120,
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
      render: (availableQuantity: number) => (
        <span
          style={{
            color:
              availableQuantity <= 0
                ? '#ff4d4f'
                : availableQuantity < 10
                ? '#faad14'
                : '#52c41a',
            fontWeight: 'bold',
          }}
        >
          {availableQuantity}
        </span>
      ),
    },
    {
      title: <>生产日期{renderSortIcon('productionDate')}</>,
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 140,
      sorter: true,
      sortDirections: ['ascend', 'descend'] as SortOrder[],
    },
    {
      title: '选择',
      key: 'select',
      width: 80,
      render: (_: any, record: StockVo) => (
        <Button
          type={selectedStocks.has(record.id) ? 'primary' : 'default'}
          icon={<CheckOutlined />}
          size='small'
          disabled={record.availableQuantity <= 0}
          onClick={() => handleSelectStock(record)}
          loading={loadingPrices.has(record.id)}
          style={{ padding: '0 8px' }}
        >
          {selectedStocks.has(record.id) ? '已选' : '选择'}
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <Drawer
        title={
          <Space>
            <AppstoreOutlined />
            <span>选择出库商品</span>
            {selectedStocks.size > 0 && (
              <Badge
                count={selectedStocks.size}
                style={{ backgroundColor: '#52c41a' }}
              />
            )}
          </Space>
        }
        placement={placement}
        height={700}
        width={1000}
        onClose={handleCancel}
        open={visible}
        extra={
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button
              type='primary'
              onClick={handleConfirmSelect}
              disabled={selectedStocks.size === 0}
              icon={<PlusOutlined />}
            >
              确认选择
            </Button>
          </Space>
        }
        className='stock-select-drawer'
      >
        <Card size='small' className='search-card' style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout='horizontal'
            onFinish={fetchStocks}
            size='small'
            initialValues={{ areaId: '', productId: '', batchNumber: '' }}
          >
            <Row gutter={[16, 16]} align='middle'>
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item
                  name='areaId'
                  label='区域'
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                  style={{ marginBottom: 0 }}
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
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item
                  name='productId'
                  label='产品'
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                  style={{ marginBottom: 0 }}
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
              <Col xs={24} sm={12} md={6} lg={6}>
                <Form.Item
                  name='batchNumber'
                  label='批次号'
                  labelCol={{ span: 6 }}
                  wrapperCol={{ span: 18 }}
                  style={{ marginBottom: 0 }}
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
              <Col xs={24} sm={12} md={6} lg={6} style={{ textAlign: 'center' }}>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Space size="middle" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type='primary'
                      htmlType='submit'
                      icon={<SearchOutlined />}
                    >
                      查询
                    </Button>
                    <Button
                      icon={<ClearOutlined />}
                      onClick={() => {
                        form.resetFields();
                        fetchStocks();
                      }}
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 库存数量提示 */}
        {stocks.length > 0 && (
          <Alert
            message={
              <Space>
                <Text strong>库存说明：</Text>
                <Text type='success'>绿色</Text>
                <Text>表示库存充足，</Text>
                <Text type='warning'>黄色</Text>
                <Text>表示库存较低，</Text>
                <Text type='danger'>红色</Text>
                <Text>表示无可用库存</Text>
              </Space>
            }
            type='info'
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Table
          columns={columns}
          dataSource={stocks}
          rowKey='id'
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            size: 'small',
          }}
          onChange={handleTableChange}
          rowClassName={(record) =>
            record.availableQuantity <= 0
              ? 'disabled-row'
              : selectedStocks.has(record.id)
              ? 'selected-row'
              : ''
          }
          size='small'
          scroll={{ y: 'calc(100vh - 480px)' }}
          bordered
        />
        {/* 渲染已选商品列表 */}
        {renderSelectedStocksList()}
      </Drawer>
    </ConfigProvider>
  );
};

export default StockSelectDrawer;

import { useEffect, useState } from 'react';
import {
  Drawer,
  Typography,
  Descriptions,
  Tag,
  message,
  Spin,
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  Form,
  Modal,
  Space,
  Table,
  Splitter,
} from 'antd';
import {
  SyncOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  CheckOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  InspectionVo,
  inInspectDetail,
  InspectionItem,
} from '../../../../api/order-service/InspectController';
import { stockIn } from '../../../../api/order-service/OrderController';
import {
  OrderDetailVo,
  OrderInItem,
  OrderOutItem,
  StockInDto,
} from '../../../../api/order-service/OrderController';
import {
  ProductVo,
  getProductById,
} from '../../../../api/product-service/ProductController';
import { getShelfListByAreaId } from '../../../../api/location-service/ShelfController';
import { getStoragesByShelfId } from '../../../../api/location-service/StorageController';
import { Location } from '../../../../api/stock-service/StockController';
import OrderDetailItems from './OrderDetailItems';
import './css/InspectDetailDrawer.css';
import { renderQualityStatus } from '../../components/StatusComponents';

const { Title, Text } = Typography;
const { Option } = Select;

interface StockInDrawerProps {
  visible: boolean;
  onClose: () => void;
  inspection: InspectionVo | null;
  onSuccess?: () => void;
}

export default function StockInDrawer({
  visible,
  onClose,
  inspection,
  onSuccess,
}: StockInDrawerProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductVo | null>(
    null
  );
  const [detailData, setDetailData] = useState<
    OrderDetailVo<OrderInItem | OrderOutItem>[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [submitModalVisible, setSubmitModalVisible] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [stockInItems, setStockInItems] = useState<Map<string, StockInDto>>(
    new Map()
  );
  const [shelves, setShelves] = useState<any[]>([]);
  const [storagesByShelf, setStoragesByShelf] = useState<{
    [shelfId: string]: any[];
  }>({});

  // 获取订单详情数据
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!visible || !inspection) {
        return;
      }

      setLoading(true);
      try {
        // 使用入库质检详情接口获取数据
        const result = await inInspectDetail(inspection.id);
        if (result.code === 200) {
          // 直接使用返回的orderDetail数据
          setDetailData(result.data.orderDetail);
          // 存储inspectionItems数据
          setInspectionItems(result.data.inspectionItems || []);
        } else {
          message.error(result.msg || '获取质检详情失败');
          setDetailData([]);
          setInspectionItems([]);
        }
      } catch (error) {
        console.error('获取订单详情失败:', error);
        message.error('获取订单详情失败，请稍后重试');
        setDetailData([]);
        setInspectionItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible && inspection) {
      fetchDetailData();
    } else {
      // 重置数据
      setSelectedProduct(null);
      setSelectedAreaName(null);
      setDetailData([]);
      setInspectionItems([]);
      setStockInItems(new Map());
    }
  }, [visible, inspection]);

  // 重置选中的商品
  useEffect(() => {
    setSelectedProduct(null);
    setSelectedAreaName(null);
  }, [detailData]);

  // 当选择产品时，获取产品详情
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!selectedProduct?.id) return;

      try {
        const result = await getProductById(selectedProduct.id);
        if (result.code === 200) {
          setSelectedProduct(result.data);
        } else {
          message.error('获取产品详情失败');
        }
      } catch (error) {
        console.error('获取产品详情失败:', error);
        message.error('获取产品详情失败，请稍后重试');
      }
    };

    // 只有当商品没有完整信息时才获取详情
    if (selectedProduct?.id && !selectedProduct.categoryName) {
      fetchProductDetail();
    }
  }, [selectedProduct?.id]);

  // 当选择产品时，自动加载已存在的上架数据和位置信息
  useEffect(() => {
    if (!selectedProduct) return;

    // 查找当前选中的商品详情
    const orderDetail = detailData.find(
      (item) => item.product?.id === selectedProduct.id
    );

    if (!orderDetail) return;

    // 查找商品在列表中的索引
    const index = detailData.findIndex(
      (item) => item.product?.id === selectedProduct.id
    );
    if (index !== -1) {
      setCurrentIndex(index);
    }

    // 查看是否有已存在的上架数据
    const existingStockIn = stockInItems.get(orderDetail.orderItems.id);

    // 获取对应的质检结果项
    const inspectionItem = inspectionItems.find(
      (item) => item.productId === selectedProduct.id
    );

    if (existingStockIn) {
      // 自动加载已存在的上架数据到表单
      form.setFieldsValue({
        locations: existingStockIn.locations,
        stockInQuantity: existingStockIn.count,
      });
    } else if (orderDetail.orderItems.areaId) {
      // 否则加载默认值 - 从订单详情中获取位置信息
      // 加载货架信息
      loadShelvesByAreaId(orderDetail.orderItems.areaId);

      // 准备位置数据
      const locationData: Location[] = [];
      if (
        orderDetail.orderItems.location &&
        orderDetail.orderItems.location.length > 0
      ) {
        for (const location of orderDetail.orderItems.location) {
          if (location.shelfId) {
            // 加载该货架下的库位信息
            loadStoragesByShelfId(location.shelfId);

            locationData.push({
              shelfId: location.shelfId,
              storageIds: location.storageIds || [],
            });
          }
        }
      }

      form.setFieldsValue({
        locations:
          locationData.length > 0
            ? locationData
            : [{ shelfId: undefined, storageIds: [] }],
        stockInQuantity: inspectionItem ? inspectionItem.qualifiedQuantity : 0,
      });
    } else {
      // 无位置信息时的默认值
      form.setFieldsValue({
        locations: [{ shelfId: undefined, storageIds: [] }],
        stockInQuantity: inspectionItem ? inspectionItem.qualifiedQuantity : 0,
      });
    }

    setSelectedAreaName(orderDetail.areaName || null);
  }, [selectedProduct, detailData, stockInItems, form, inspectionItems]);

  // 导航到下一个或上一个商品
  const navigateToProduct = (direction: 'prev' | 'next') => {
    if (detailData.length === 0) return;

    let newIndex = currentIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % detailData.length;
    } else {
      newIndex = (currentIndex - 1 + detailData.length) % detailData.length;
    }

    // 获取目标商品
    const targetProduct = detailData[newIndex].product as ProductVo;
    const targetAreaName = detailData[newIndex].areaName;

    if (targetProduct) {
      setSelectedProduct(targetProduct);
      setSelectedAreaName(targetAreaName || null);
      setCurrentIndex(newIndex);
    }
  };

  const loadShelvesByAreaId = async (areaId: string) => {
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves(res.data);
      } else {
        setShelves([]);
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
      setShelves([]);
    }
  };

  const loadStoragesByShelfId = async (shelfId: string) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setStoragesByShelf((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  const handleShelfChange = (shelfId: string, index: number) => {
    loadStoragesByShelfId(shelfId);

    // 清空当前位置的库位选择
    const locations = form.getFieldValue('locations');
    if (locations && locations[index]) {
      locations[index].storageIds = [];
      form.setFieldsValue({ locations });
    }
  };

  // 获取当前选中商品的订单项
  const getSelectedOrderDetail = () => {
    return selectedProduct
      ? detailData.find((item) => item.product?.id === selectedProduct.id)
      : null;
  };

  // 检查当前商品是否已上架处理
  const isItemProcessed = () => {
    const orderDetail = getSelectedOrderDetail();
    return orderDetail && stockInItems.has(orderDetail.orderItems.id);
  };

  // 处理提交当前商品上架结果
  const handleSubmitItem = async () => {
    const orderDetail = getSelectedOrderDetail();
    if (!selectedProduct || !orderDetail) return;

    try {
      const values = await form.validateFields();

      // 创建上架项
      const stockInItem: StockInDto = {
        itemId: orderDetail.orderItems.id,
        productId: selectedProduct.id,
        count: values.stockInQuantity || 0,
        locations: values.locations,
      };

      // 更新已处理项目集合
      const newStockInItems = new Map(stockInItems);
      newStockInItems.set(orderDetail.orderItems.id, stockInItem);
      setStockInItems(newStockInItems);

      const isProcessed = isItemProcessed();
      message.success(`${isProcessed ? '更新' : '提交'}成功`);

      // 检查是否所有商品都已处理
      if (newStockInItems.size === detailData.length) {
        setSubmitModalVisible(true);
      } else if (!isProcessed) {
        // 如果是新完成的上架项且还有未处理商品，自动跳转到下一个未处理商品
        const nextUnProcessedIndex = findNextUnProcessedIndex();
        if (nextUnProcessedIndex !== -1) {
          const nextProduct = detailData[nextUnProcessedIndex]
            .product as ProductVo;
          const nextAreaName = detailData[nextUnProcessedIndex].areaName;

          setSelectedProduct(nextProduct);
          setSelectedAreaName(nextAreaName || null);
          setCurrentIndex(nextUnProcessedIndex);
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 查找下一个未处理的商品索引
  const findNextUnProcessedIndex = () => {
    for (let i = 0; i < detailData.length; i++) {
      const nextIndex = (currentIndex + i + 1) % detailData.length;
      const detail = detailData[nextIndex];
      if (
        detail &&
        detail.orderItems &&
        !stockInItems.has(detail.orderItems.id)
      ) {
        return nextIndex;
      }
    }
    return -1; // 没有找到未处理的商品
  };

  if (!inspection) {
    return null;
  }

  // 渲染上架基本信息卡片
  const renderStockInInfo = () => {
    // 获取质检结果项
    const inspectionItem = inspectionItems.find(
      (item) => item.productId === selectedProduct?.id
    );

    // 获取当前商品序号和总数
    const getProductNavText = () => {
      if (!selectedProduct || detailData.length === 0) return '';
      return `${currentIndex + 1} / ${detailData.length}`;
    };

    return (
      <Card
        title={
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>上架基本信息: {renderQualityStatus(inspection.status)}</span>
            <Space>
              {detailData.length > 1 && (
                <>
                  <Text type='secondary'>{getProductNavText()}</Text>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={() => navigateToProduct('prev')}
                    size='small'
                  />
                  <Button
                    icon={<RightOutlined />}
                    onClick={() => navigateToProduct('next')}
                    size='small'
                  />
                </>
              )}
            </Space>
          </div>
        }
        size='small'
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        bodyStyle={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          <Descriptions column={2} bordered size='small'>
            <Descriptions.Item label='质检编号'>
              {inspection.inspectionNo}
            </Descriptions.Item>
            <Descriptions.Item label='上架数量'>
              {inspectionItem?.qualifiedQuantity || '暂无数据'}
            </Descriptions.Item>
            <Descriptions.Item label='质检员'>
              {inspection.inspectorInfo?.realName ||
                inspection.inspector ||
                '-'}
            </Descriptions.Item>
            <Descriptions.Item label='质检合格数量'>
              {inspectionItem?.qualifiedQuantity || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='区域'>
              {selectedAreaName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='质检不合格数量'>
              {inspectionItem?.unqualifiedQuantity || '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Card>
    );
  };

  // 渲染商品详情
  const renderProductDetails = () => {
    // 查找已选择商品的订单项
    const orderItem = selectedProduct
      ? detailData.find((item) => item.product?.id === selectedProduct.id)
          ?.orderItems
      : null;

    return (
      <Card
        title={
          <>
            <TagsOutlined /> 商品详情
          </>
        }
        size='small'
      >
        <Descriptions column={2} bordered size='small'>
          <Descriptions.Item label='商品名称'>
            {selectedProduct?.productName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='商品编码'>
            {selectedProduct?.productCode || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='规格型号'>
            {selectedProduct?.spec || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='类别'>
            {selectedProduct?.categoryName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='品牌'>
            {selectedProduct?.brand || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='单价'>
            {selectedProduct?.price ? `¥${selectedProduct.price}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='型号'>
            {selectedProduct?.model || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='批次号'>
            {orderItem?.batchNumber || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // 获取质检类型文本
  const getInspectionTypeText = (type: number) => {
    switch (type) {
      case 1:
        return '入库检验';
      case 2:
        return '出库检验';
      case 3:
        return '库存检验';
      default:
        return '未知类型';
    }
  };

  // 提交最终上架结果
  const handleSubmitStockIn = async () => {
    if (stockInItems.size !== detailData.length) {
      message.warning('请完成所有商品的上架处理');
      return;
    }

    setSubmitting(true);
    try {
      const stockInItemsArray = Array.from(stockInItems.values());

      const result = await stockIn(stockInItemsArray);
      if (result.code === 200) {
        message.success('上架提交成功');
        setSubmitModalVisible(false);

        // 延迟执行回调和关闭操作，给服务器足够的时间处理数据
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          // 等待一段时间后再关闭抽屉，确保数据加载完成
          setTimeout(() => {
            onClose(); // 关闭抽屉
          }, 300);
        }, 300);
      } else {
        message.error(result.msg || '上架提交失败');
      }
    } catch (error) {
      console.error('上架提交失败:', error);
      message.error('上架提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        title={
          <Title level={4} style={{ margin: 0, lineHeight: '32px' }}>
            商品上架
            <Tag color='blue' style={{ marginLeft: 8 }}>
              {getInspectionTypeText(inspection.inspectionType)}
            </Tag>
          </Title>
        }
        placement='right'
        width='calc(100vw - 256px)'
        onClose={onClose}
        open={visible}
        closable={true}
        destroyOnClose={true}
        bodyStyle={{ overflowY: 'auto', height: 'calc(100% - 55px)' }}
      >
        <Spin spinning={loading} tip='加载中...'>
          <div className='inspect-detail-container'>
            {/* 使用Splitter替换上半部分的Row/Col布局 */}
            <Splitter layout='vertical' style={{ height: '100%' }}>
              <Splitter.Panel>
                <Splitter
                  style={{ height: '100%', border: '1px solid #f0f0f0' }}
                >
                  <Splitter.Panel defaultSize='45%'>
                    {/* 左侧 - 上架基本信息 */}
                    {renderStockInInfo()}
                  </Splitter.Panel>
                  <Splitter.Panel>
                    {/* 右侧 - 商品详情与位置信息 */}
                    {renderProductDetails()}

                    {/* 位置信息表单 */}
                    {selectedProduct && (
                      <Card
                        title={
                          <>
                            <TagsOutlined /> 位置信息
                          </>
                        }
                      >
                        <Form
                          form={form}
                          layout='vertical'
                          initialValues={{
                            stockInQuantity: 0,
                            locations: [{ shelfId: undefined, storageIds: [] }],
                          }}
                        >
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item
                                name='stockInQuantity'
                                label='上架数量'
                                tooltip='默认为质检合格数量，可调整'
                                rules={[
                                  {
                                    required: true,
                                    message: '请输入上架数量',
                                  },
                                ]}
                              >
                                <Input disabled />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.List name='locations'>
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(
                                  ({ key, name, ...restField }, index) => (
                                    <div
                                      key={key}
                                      style={{
                                        marginBottom: 16,
                                        border: '1px dashed #d9d9d9',
                                        padding: 16,
                                        borderRadius: 4,
                                      }}
                                    >
                                      <Row gutter={16}>
                                        <Col span={10}>
                                          <Form.Item
                                            {...restField}
                                            name={[name, 'shelfId']}
                                            label='货架'
                                            rules={[
                                              {
                                                required: true,
                                                message: '请选择货架',
                                              },
                                            ]}
                                          >
                                            <Select
                                              placeholder='请选择货架'
                                              onChange={(value) =>
                                                handleShelfChange(value, index)
                                              }
                                            >
                                              {shelves.map((shelf) => (
                                                <Option
                                                  key={shelf.id}
                                                  value={shelf.id}
                                                >
                                                  {shelf.shelfName}
                                                </Option>
                                              ))}
                                            </Select>
                                          </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                          <Form.Item
                                            {...restField}
                                            name={[name, 'storageIds']}
                                            label='库位'
                                            rules={[
                                              {
                                                required: true,
                                                message: '请选择至少一个库位',
                                              },
                                            ]}
                                          >
                                            <Select
                                              mode='multiple'
                                              disabled={
                                                !form.getFieldValue([
                                                  'locations',
                                                  index,
                                                  'shelfId',
                                                ])
                                              }
                                              style={{ width: '100%' }}
                                              placeholder='请选择库位'
                                            >
                                              {form.getFieldValue([
                                                'locations',
                                                index,
                                                'shelfId',
                                              ]) &&
                                              storagesByShelf[
                                                form.getFieldValue([
                                                  'locations',
                                                  index,
                                                  'shelfId',
                                                ])
                                              ]
                                                ? storagesByShelf[
                                                    form.getFieldValue([
                                                      'locations',
                                                      index,
                                                      'shelfId',
                                                    ])
                                                  ]
                                                    .filter(
                                                      (storage) =>
                                                        storage.status === 1
                                                    ) // 只显示可用的库位
                                                    .map((storage) => (
                                                      <Option
                                                        key={storage.id}
                                                        value={storage.id}
                                                      >
                                                        {storage.locationName ||
                                                          storage.id}
                                                      </Option>
                                                    ))
                                                : []}
                                            </Select>
                                          </Form.Item>
                                        </Col>
                                        <Col
                                          span={2}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingTop: 30,
                                          }}
                                        >
                                          {fields.length > 1 && (
                                            <Button
                                              type='text'
                                              danger
                                              icon={<PlusOutlined />}
                                              onClick={() => remove(name)}
                                            />
                                          )}
                                        </Col>
                                      </Row>
                                    </div>
                                  )
                                )}

                                <Form.Item>
                                  <Button
                                    type='dashed'
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                  >
                                    添加位置
                                  </Button>
                                </Form.Item>
                              </>
                            )}
                          </Form.List>

                          {inspection?.orderStatus === 2 && selectedProduct && (
                            <Row>
                              <Col span={24} style={{ textAlign: 'right' }}>
                                <Button
                                  type='primary'
                                  onClick={handleSubmitItem}
                                  icon={
                                    isItemProcessed() ? (
                                      <EditOutlined />
                                    ) : (
                                      <CheckOutlined />
                                    )
                                  }
                                >
                                  {isItemProcessed() ? '更新' : '提交'}
                                </Button>
                              </Col>
                            </Row>
                          )}
                        </Form>
                      </Card>
                    )}
                  </Splitter.Panel>
                </Splitter>
              </Splitter.Panel>
              <Splitter.Panel>
                {/* 下半部分 - 商品列表 */}
                <Row>
                  <Col span={24}>
                    {/* 商品明细表格 */}
                    {detailData.length > 0 ? (
                      <div>
                        <OrderDetailItems
                          data={detailData}
                          inspectionType={inspection.inspectionType}
                          onSelectProduct={(productId) => {
                            const product = detailData.find(
                              (item) => item.product?.id === productId
                            )?.product as ProductVo;
                            const areaName = detailData.find(
                              (item) => item.product?.id === productId
                            )?.areaName;

                            if (product) {
                              setSelectedProduct(product);
                              setSelectedAreaName(areaName || null);

                              // 找到选中商品的索引
                              const index = detailData.findIndex(
                                (item) => item.product?.id === productId
                              );
                              if (index !== -1) {
                                setCurrentIndex(index);
                              }
                            }
                          }}
                        />

                        {inspection?.orderStatus === 2 &&
                          stockInItems.size > 0 &&
                          stockInItems.size < detailData.length && (
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <Text type='warning'>
                                已完成 {stockInItems.size}/{detailData.length}{' '}
                                件商品的上架处理
                              </Text>
                            </div>
                          )}

                        {inspection?.orderStatus === 2 &&
                          stockInItems.size === detailData.length && (
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <Button
                                type='primary'
                                icon={<CheckCircleOutlined />}
                                onClick={() => setSubmitModalVisible(true)}
                              >
                                提交上架
                              </Button>
                            </div>
                          )}
                      </div>
                    ) : (
                      <Card>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <SyncOutlined
                            spin
                            style={{ fontSize: 24, marginBottom: 16 }}
                          />
                          <p>暂无商品详情数据</p>
                        </div>
                      </Card>
                    )}
                  </Col>
                </Row>
              </Splitter.Panel>
            </Splitter>
          </div>
        </Spin>
      </Drawer>

      {/* 最终提交确认对话框 */}
      <Modal
        title='确认上架'
        open={submitModalVisible}
        onCancel={() => setSubmitModalVisible(false)}
        width={700}
        footer={
          <Space>
            <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
            <Button
              type='primary'
              onClick={handleSubmitStockIn}
              loading={submitting}
            >
              确认上架
            </Button>
          </Space>
        }
      >
        <p>所有商品已完成上架处理，提交后不可修改，确定提交上架吗？</p>

        <div
          style={{ maxHeight: '400px', overflow: 'auto', marginTop: '16px' }}
        >
          <Table
            size='small'
            dataSource={Array.from(stockInItems.entries()).map(
              ([key, item]) => {
                const product = detailData.find(
                  (detail) => detail.orderItems.id === key
                )?.product;
                return {
                  key,
                  productName: product?.productName || '未知商品',
                  productCode: product?.productCode || '-',
                  count: item.count,
                  locations: item.locations,
                };
              }
            )}
            columns={[
              {
                title: '商品名称',
                dataIndex: 'productName',
                key: 'productName',
              },
              {
                title: '商品编码',
                dataIndex: 'productCode',
                key: 'productCode',
              },
              {
                title: '上架数量',
                dataIndex: 'count',
                key: 'count',
              },
              {
                title: '货架信息',
                dataIndex: 'locations',
                key: 'locations',
                render: (locations: Location[]) => (
                  <div>
                    {locations.map((loc, index) => {
                      const shelfName =
                        shelves.find((shelf) => shelf.id === loc.shelfId)
                          ?.shelfName || loc.shelfId;
                      const storageNames = loc.storageIds
                        .map((storageId) => {
                          const storage = storagesByShelf[loc.shelfId]?.find(
                            (s) => s.id === storageId
                          );
                          return storage?.locationName || storageId;
                        })
                        .join(', ');

                      return (
                        <div
                          key={index}
                          style={{
                            marginBottom:
                              index < locations.length - 1 ? '8px' : 0,
                          }}
                        >
                          <Tag color='blue'>{shelfName}</Tag>: {storageNames}
                        </div>
                      );
                    })}
                  </div>
                ),
              },
            ]}
            pagination={false}
          />
        </div>
      </Modal>
    </>
  );
}

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
import {
  stockAll,
  stockOne,
} from '../../../../api/order-service/OrderController';
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
import { getStorageByIdAndItemId } from '../../../../api/location-service/StorageController';
import { Location } from '../../../../api/stock-service/StockController';
import OrderDetailItems from './OrderDetailItems';
import './css/InspectDetailDrawer.css';
import {
  renderItemInspectionResult,
  renderQualityStatus,
  renderReceiveStatus,
} from '../../components/StatusComponents';

const { Title, Text } = Typography;
const { Option } = Select;

interface StockInDrawerProps {
  visible: boolean;
  onClose: () => void;
  inspection: InspectionVo | null;
  onSuccess?: () => void;
}

// 添加ProductDetail接口定义
interface ProductDetail extends ProductVo {
  batchNumber: string;
}

export default function StockInDrawer({
  visible,
  onClose,
  inspection,
  onSuccess,
}: StockInDrawerProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [detailData, setDetailData] = useState<
    OrderDetailVo<OrderInItem | OrderOutItem>[]
  >([]);
  const [filteredDetailData, setFilteredDetailData] = useState<
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
  const [shelvesMap, setShelvesMap] = useState<{ [shelfId: string]: any }>({});
  const [storagesByShelf, setStoragesByShelf] = useState<{
    [shelfId: string]: any[];
  }>({});

  // 货架数据变化时，更新shelvesMap
  useEffect(() => {
    const newShelvesMap: { [shelfId: string]: any } = {};
    shelves.forEach((shelf) => {
      newShelvesMap[shelf.id] = shelf;
    });
    setShelvesMap(newShelvesMap);
  }, [shelves]);

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

          // 预加载所有区域的货架信息
          const areaIds = new Set<string>();
          for (const detail of result.data.orderDetail) {
            if (detail.orderItems.areaId) {
              areaIds.add(detail.orderItems.areaId);
            }
          }

          // 并行加载所有区域的货架信息
          const loadPromises = Array.from(areaIds).map(async (areaId) => {
            try {
              const res = await getShelfListByAreaId(areaId);
              if (res.code === 200) {
                setShelves((prev) => {
                  // 合并货架列表，避免重复
                  const currentIds = new Set(prev.map((shelf) => shelf.id));
                  const newShelves = [...prev];

                  for (const shelf of res.data) {
                    if (!currentIds.has(shelf.id)) {
                      newShelves.push(shelf);
                    }
                  }

                  return newShelves;
                });
              }
            } catch (error) {
              console.error(`获取区域 ${areaId} 的货架列表失败:`, error);
            }
          });

          // 等待所有货架信息加载完成
          await Promise.all(loadPromises);
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
      setFilteredDetailData([]);
      setInspectionItems([]);
      setStockInItems(new Map());
    }
  }, [visible, inspection]);

  // 过滤出合格的产品
  useEffect(() => {
    if (detailData.length > 0 && inspectionItems.length > 0) {
      // 根据质检结果过滤出质检合格(qualityStatus为1)的商品
      const qualifiedProducts = detailData.filter((item) => {
        const inspectionItem = inspectionItems.find(
          (inspItem) => inspItem.productId === item.product?.id
        );
        return (
          inspectionItem &&
          inspectionItem.qualityStatus === 1 &&
          inspectionItem.receiveStatus === 0
        );
      });

      setFilteredDetailData(qualifiedProducts);

      // 如果已选择的商品不在合格列表中，自动选择第一个合格商品
      if (
        selectedProduct &&
        !qualifiedProducts.some(
          (item) =>
            item.product?.id === selectedProduct.id &&
            item.orderItems.batchNumber === selectedProduct.batchNumber
        ) &&
        qualifiedProducts.length > 0
      ) {
        const firstQualifiedProduct = qualifiedProducts[0].product as ProductVo;
        const areaName = qualifiedProducts[0].areaName;
        const batchNumber = qualifiedProducts[0].orderItems.batchNumber || '';

        setSelectedProduct({
          ...firstQualifiedProduct,
          batchNumber,
        });
        setSelectedAreaName(areaName || null);
        setCurrentIndex(0);
      }
    } else {
      setFilteredDetailData([]);
    }
  }, [detailData, inspectionItems, selectedProduct]);

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
          setSelectedProduct({
            ...result.data,
            batchNumber: selectedProduct.batchNumber,
          });
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
  }, [selectedProduct?.id, selectedProduct?.batchNumber]);

  // 当选择产品时，自动加载已存在的上架数据和位置信息
  useEffect(() => {
    if (!selectedProduct) return;

    // 查找当前选中的商品详情
    const orderDetail = detailData.find(
      (item) =>
        item.product?.id === selectedProduct.id &&
        item.orderItems.batchNumber === selectedProduct.batchNumber
    );

    if (!orderDetail) return;

    // 查找商品在列表中的索引
    const index = detailData.findIndex(
      (item) =>
        item.product?.id === selectedProduct.id &&
        item.orderItems.batchNumber === selectedProduct.batchNumber
    );
    if (index !== -1) {
      setCurrentIndex(index);
    }

    // 查看是否有已存在的上架数据
    const existingStockIn = stockInItems.get(orderDetail.orderItems.id);

    // 获取对应的质检结果项
    const inspectionItem = inspectionItems.find(
      (item) =>
        item.productId === selectedProduct.id &&
        item.batchNumber === selectedProduct.batchNumber
    );

    if (existingStockIn) {
      // 自动加载已存在的上架数据到表单
      form.setFieldsValue({
        locations: existingStockIn.locations,
        stockInQuantity: existingStockIn.count,
      });

      // 为每个货架预加载库位信息
      if (existingStockIn.locations && existingStockIn.locations.length > 0) {
        existingStockIn.locations.forEach((location) => {
          if (location.shelfId) {
            loadStoragesByShelfId(location.shelfId);
          }
        });
      }
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
    if (filteredDetailData.length === 0) return;

    let newIndex = currentIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % filteredDetailData.length;
    } else {
      newIndex =
        (currentIndex - 1 + filteredDetailData.length) %
        filteredDetailData.length;
    }

    // 获取目标商品
    const targetDetail = filteredDetailData[newIndex];
    const targetProduct = targetDetail.product as ProductVo;
    const targetAreaName = targetDetail.areaName;
    const targetBatchNumber = targetDetail.orderItems.batchNumber || '';

    if (targetProduct) {
      // 在设置新商品前，先加载货架和库位信息
      if (targetDetail?.orderItems.areaId) {
        // 预加载货架信息
        loadShelvesByAreaId(targetDetail.orderItems.areaId);

        // 获取对应的检验项
        const inspItem = inspectionItems.find(
          (item) =>
            item.productId === targetProduct.id &&
            item.batchNumber === targetBatchNumber
        );

        // 如果此商品已有上架信息，预加载其库位信息
        if (
          targetDetail.orderItems.id &&
          stockInItems.has(targetDetail.orderItems.id)
        ) {
          const stockInItem = stockInItems.get(targetDetail.orderItems.id);
          if (stockInItem && stockInItem.locations) {
            stockInItem.locations.forEach((location) => {
              if (location.shelfId && inspItem && inspItem.id) {
                // 加载库位信息
                (async () => {
                  try {
                    const res = await getStorageByIdAndItemId(
                      location.shelfId,
                      inspItem.id
                    );
                    if (res.code === 200) {
                      const storageKey = `${location.shelfId}_${targetProduct.id}_${targetBatchNumber}`;
                      setStoragesByShelf((prev) => ({
                        ...prev,
                        [storageKey]: res.data,
                      }));
                    }
                  } catch (error) {
                    console.error('加载库位信息失败:', error);
                  }
                })();
              }
            });
          }
        }
      }

      // 设置新商品
      setSelectedProduct({
        ...targetProduct,
        batchNumber: targetBatchNumber,
      });
      setSelectedAreaName(targetAreaName || null);
      setCurrentIndex(newIndex);
    }
  };

  const loadShelvesByAreaId = async (areaId: string) => {
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves((prev) => {
          // 合并货架列表，避免替换已有的货架信息
          const currentIds = new Set(prev.map((shelf) => shelf.id));
          const newShelves = [...prev];

          for (const shelf of res.data) {
            if (!currentIds.has(shelf.id)) {
              newShelves.push(shelf);
            }
          }

          return newShelves;
        });
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
    }
  };

  const loadStoragesByShelfId = async (shelfId: string) => {
    try {
      // 确保我们有selectedProduct信息
      if (!selectedProduct) return;

      // 获取当前选中商品的检验项
      const currentInspectionItem = inspectionItems.find(
        (item) =>
          item.productId === selectedProduct.id &&
          item.batchNumber === selectedProduct.batchNumber
      );

      if (!currentInspectionItem || !currentInspectionItem.id) {
        console.error('未找到当前商品的检验项信息');
        return;
      }

      const res = await getStorageByIdAndItemId(
        shelfId,
        currentInspectionItem.id
      );
      if (res.code === 200) {
        // 使用组合键（shelfId + productId + batchNumber）来缓存库位信息
        const storageKey = `${shelfId}_${selectedProduct.id}_${selectedProduct.batchNumber}`;
        setStoragesByShelf((prev) => ({
          ...prev,
          [storageKey]: res.data,
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  const handleShelfChange = (shelfId: string, index: number) => {
    // 修改以确保在提取inspectionItem时同时使用productId和batchNumber
    loadStoragesByShelfId(shelfId);

    // 清空当前位置的库位选择
    const locations = form.getFieldValue('locations');
    if (locations && locations[index]) {
      locations[index].storageIds = [];
      form.setFieldsValue({ locations });
    }
  };

  // 获取同一商品已选择的所有货架ID
  const getAllSelectedShelfIds = (currentLocationIndex: number) => {
    const locations = form.getFieldValue('locations');
    if (!locations) {
      return new Set<string>();
    }

    const selectedIds = new Set<string>();

    // 遍历所有位置
    locations.forEach((loc: any, locIndex: number) => {
      // 跳过当前正在编辑的位置
      if (locIndex === currentLocationIndex) {
        return;
      }

      if (!loc || !loc.shelfId) {
        return;
      }

      // 将该位置选择的货架ID添加到集合中
      selectedIds.add(loc.shelfId);
    });

    return selectedIds;
  };

  // 获取当前选中商品的订单项
  const getSelectedOrderDetail = () => {
    return selectedProduct
      ? detailData.find(
          (item) =>
            item.product?.id === selectedProduct.id &&
            item.orderItems.batchNumber === selectedProduct.batchNumber
        )
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
        itemId:
          inspectionItems.find(
            (item) =>
              item.productId === selectedProduct.id &&
              item.batchNumber === selectedProduct.batchNumber
          )?.id || '',
        productId: selectedProduct.id,
        count: values.stockInQuantity || 0,
        locations: values.locations,
      };

      // 调用单个商品上架接口
      const result = await stockOne(stockInItem);
      if (result.code !== 200) {
        message.error(result.msg || '上架提交失败');
        return;
      }

      // 更新已处理项目集合
      const newStockInItems = new Map(stockInItems);
      newStockInItems.set(orderDetail.orderItems.id, stockInItem);
      setStockInItems(newStockInItems);

      const isProcessed = isItemProcessed();
      message.success(`${isProcessed ? '更新' : '提交'}成功`);

      // 检查是否所有合格商品都已处理
      if (newStockInItems.size === filteredDetailData.length) {
        setSubmitModalVisible(true);
      } else if (!isProcessed) {
        // 如果是新完成的上架项且还有未处理商品，自动跳转到下一个未处理商品
        const nextUnProcessedIndex = findNextUnProcessedIndex();
        if (nextUnProcessedIndex !== -1) {
          const nextProduct = filteredDetailData[nextUnProcessedIndex]
            .product as ProductVo;
          const nextAreaName =
            filteredDetailData[nextUnProcessedIndex].areaName;
          const nextBatchNumber =
            filteredDetailData[nextUnProcessedIndex].orderItems.batchNumber ||
            '';

          setSelectedProduct({
            ...nextProduct,
            batchNumber: nextBatchNumber,
          });
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
    for (let i = 0; i < filteredDetailData.length; i++) {
      const nextIndex = (currentIndex + i + 1) % filteredDetailData.length;
      const detail = filteredDetailData[nextIndex];
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
      (item) =>
        item.productId === selectedProduct?.id &&
        item.batchNumber === selectedProduct?.batchNumber
    );

    // 获取当前商品序号和总数
    const getProductNavText = () => {
      if (!selectedProduct || filteredDetailData.length === 0) return '';
      return `${currentIndex + 1} / ${filteredDetailData.length}`;
    };
    // 获取当前商品的质检详情信息
    const getInspectionItem = inspectionItems.find(
      (item) =>
        item.productId === selectedProduct?.id &&
        item.batchNumber === selectedProduct?.batchNumber
    );
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
            <span>
              上架基本信息: {renderQualityStatus(inspection.status)},详情信息:
              {inspection.status !== 0
                ? renderItemInspectionResult(
                    getInspectionItem?.qualityStatus || 0
                  )
                : '-'}
              , 上架状态:{' '}
              {selectedProduct
                ? renderReceiveStatus(getInspectionItem?.receiveStatus || 0)
                : '-'}
            </span>
            <Space>
              {filteredDetailData.length > 1 && (
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
              {inspectionItem?.unqualifiedQuantity ||
              inspectionItem?.unqualifiedQuantity === 0
                ? '0'
                : inspectionItem?.unqualifiedQuantity || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='备注'>
              {inspectionItem?.remark || '-'}
            </Descriptions.Item>
          </Descriptions>

          {selectedProduct && (
            <Form
              form={form}
              layout='vertical'
              initialValues={{
                stockInQuantity: inspectionItem?.qualifiedQuantity || 0,
                locations: [{ shelfId: undefined, storageIds: [] }],
              }}
            >
              <Form.Item
                name='stockInQuantity'
                label='上架数量'
                tooltip='默认为质检合格数量'
                rules={[
                  {
                    required: true,
                    message: '请输入上架数量',
                  },
                ]}
                style={{ marginTop: 16 }}
              >
                <Input disabled />
              </Form.Item>
            </Form>
          )}
        </div>
      </Card>
    );
  };

  // 渲染商品详情
  const renderProductDetails = () => {
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
            {selectedProduct?.batchNumber || '-'}
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
    if (stockInItems.size !== filteredDetailData.length) {
      message.warning('请完成所有合格商品的上架处理');
      return;
    }

    setSubmitting(true);
    try {
      if (!inspection || !inspection.inspectionNo) {
        message.error('质检单号不存在，无法完成上架');
        return;
      }

      // 调用确认上架接口
      const result = await stockAll(inspection.inspectionNo);
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

  // 显示确认提交对话框
  const showSubmitModal = async () => {
    // 预加载所有上架商品的货架和库位信息
    const loadAllStorageInfo = async () => {
      // 收集所有需要的区域ID和货架ID
      const areaIds = new Set<string>();
      const shelfIds = new Set<string>();

      // 收集所有区域ID和货架ID
      for (const [itemId, stockInItem] of stockInItems.entries()) {
        // 获取该商品的区域ID
        const detail = detailData.find((item) => item.orderItems.id === itemId);
        if (detail?.orderItems.areaId) {
          areaIds.add(detail.orderItems.areaId);
        }

        // 收集所有货架ID
        if (stockInItem.locations) {
          for (const location of stockInItem.locations) {
            if (location.shelfId) {
              shelfIds.add(location.shelfId);
            }
          }
        }
      }

      // 并行加载所有区域的货架信息
      const loadShelvesPromises = Array.from(areaIds).map(async (areaId) => {
        try {
          const res = await getShelfListByAreaId(areaId);
          if (res.code === 200) {
            setShelves((prev) => {
              const currentIds = new Set(prev.map((shelf) => shelf.id));
              const newShelves = [...prev];

              for (const shelf of res.data) {
                if (!currentIds.has(shelf.id)) {
                  newShelves.push(shelf);
                }
              }

              return newShelves;
            });
          }
        } catch (error) {
          console.error(`预加载货架信息失败:`, error);
        }
      });

      // 等待所有货架加载完成
      await Promise.all(loadShelvesPromises);

      // 手动更新shelvesMap确保Modal渲染时能访问到最新的货架信息
      const newShelvesMap: { [shelfId: string]: any } = {};
      shelves.forEach((shelf) => {
        newShelvesMap[shelf.id] = shelf;
      });
      setShelvesMap(newShelvesMap);

      // 并行加载所有商品的库位信息
      const loadPromises = [];

      for (const [itemId, stockInItem] of stockInItems.entries()) {
        const detail = detailData.find((item) => item.orderItems.id === itemId);
        if (!detail || !detail.product) continue;

        const inspItem = inspectionItems.find(
          (item) =>
            item.productId === detail.product?.id &&
            item.batchNumber === detail.orderItems.batchNumber
        );

        if (!inspItem || !inspItem.id) continue;

        // 加载每个货架位置的库位信息
        for (const location of stockInItem.locations) {
          if (!location.shelfId) continue;

          const loadPromise = (async () => {
            try {
              const storageKey = `${location.shelfId}_${detail.product.id}_${detail.orderItems.batchNumber}`;

              // 避免重复加载
              if (storagesByShelf[storageKey]) {
                return;
              }

              const res = await getStorageByIdAndItemId(
                location.shelfId,
                inspItem.id
              );

              if (res.code === 200) {
                setStoragesByShelf((prev) => ({
                  ...prev,
                  [storageKey]: res.data,
                }));
              }
            } catch (error) {
              console.error(`预加载库位信息失败:`, error);
            }
          })();

          loadPromises.push(loadPromise);
        }
      }

      // 等待所有异步加载完成
      await Promise.all(loadPromises);
    };

    // 加载所有库位信息
    await loadAllStorageInfo();

    // 显示确认对话框
    setSubmitModalVisible(true);
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
                            locations: [{ shelfId: undefined, storageIds: [] }],
                          }}
                        >
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
                                              {shelves.map((shelf) => {
                                                // 检查是否已被同一商品的其他位置选择
                                                const selectedShelfIds =
                                                  getAllSelectedShelfIds(index);
                                                const isUsed =
                                                  selectedShelfIds.has(
                                                    shelf.id
                                                  );

                                                return (
                                                  <Option
                                                    key={shelf.id}
                                                    value={shelf.id}
                                                    disabled={isUsed}
                                                  >
                                                    {isUsed
                                                      ? `${shelf.shelfName} (已选择)`
                                                      : shelf.shelfName}
                                                  </Option>
                                                );
                                              })}
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
                                              selectedProduct &&
                                              storagesByShelf[
                                                `${form.getFieldValue([
                                                  'locations',
                                                  index,
                                                  'shelfId',
                                                ])}_${selectedProduct.id}_${
                                                  selectedProduct.batchNumber
                                                }`
                                              ]
                                                ? storagesByShelf[
                                                    `${form.getFieldValue([
                                                      'locations',
                                                      index,
                                                      'shelfId',
                                                    ])}_${selectedProduct.id}_${
                                                      selectedProduct.batchNumber
                                                    }`
                                                  ].map((storage) => (
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
                                              onClick={() => {
                                                remove(name);
                                                // 删除位置后，强制刷新表单，触发重新渲染
                                                setTimeout(() => {
                                                  const currentValues =
                                                    form.getFieldsValue();
                                                  form.setFieldsValue({
                                                    ...currentValues,
                                                  });
                                                }, 0);
                                              }}
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
                                    onClick={() => {
                                      add();
                                      // 添加新位置后，强制刷新表单，触发重新渲染
                                      setTimeout(() => {
                                        const currentValues =
                                          form.getFieldsValue();
                                        form.setFieldsValue({
                                          ...currentValues,
                                        });
                                      }, 0);
                                    }}
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
                    {filteredDetailData.length > 0 ? (
                      <div>
                        <OrderDetailItems
                          data={filteredDetailData}
                          inspectionType={inspection.inspectionType}
                          onSelectProduct={(
                            productId,
                            _areaId,
                            _locations,
                            batchNumber
                          ) => {
                            const product = filteredDetailData.find(
                              (item) =>
                                item.product?.id === productId &&
                                item.orderItems.batchNumber === batchNumber
                            )?.product as ProductVo;
                            const areaName = filteredDetailData.find(
                              (item) =>
                                item.product?.id === productId &&
                                item.orderItems.batchNumber === batchNumber
                            )?.areaName;

                            if (product) {
                              // 获取商品详情
                              const orderDetail = filteredDetailData.find(
                                (item) =>
                                  item.product?.id === productId &&
                                  item.orderItems.batchNumber === batchNumber
                              );

                              if (orderDetail?.orderItems.areaId) {
                                // 加载货架信息
                                loadShelvesByAreaId(
                                  orderDetail.orderItems.areaId
                                );

                                // 获取检验项
                                const inspItem = inspectionItems.find(
                                  (item) =>
                                    item.productId === productId &&
                                    item.batchNumber === batchNumber
                                );

                                // 预加载库位信息
                                if (
                                  orderDetail.orderItems.id &&
                                  stockInItems.has(orderDetail.orderItems.id)
                                ) {
                                  const stockInItem = stockInItems.get(
                                    orderDetail.orderItems.id
                                  );
                                  if (stockInItem && stockInItem.locations) {
                                    stockInItem.locations.forEach(
                                      (location) => {
                                        if (
                                          location.shelfId &&
                                          inspItem &&
                                          inspItem.id
                                        ) {
                                          (async () => {
                                            try {
                                              const res =
                                                await getStorageByIdAndItemId(
                                                  location.shelfId,
                                                  inspItem.id
                                                );
                                              if (res.code === 200) {
                                                const storageKey = `${location.shelfId}_${productId}_${batchNumber}`;
                                                setStoragesByShelf((prev) => ({
                                                  ...prev,
                                                  [storageKey]: res.data,
                                                }));
                                              }
                                            } catch (error) {
                                              console.error(
                                                '加载库位信息失败:',
                                                error
                                              );
                                            }
                                          })();
                                        }
                                      }
                                    );
                                  }
                                }
                              }

                              // 设置选中商品
                              setSelectedProduct({
                                ...product,
                                batchNumber: batchNumber || '',
                              });
                              setSelectedAreaName(areaName || null);

                              // 更新索引
                              const index = filteredDetailData.findIndex(
                                (item) =>
                                  item.product?.id === productId &&
                                  item.orderItems.batchNumber === batchNumber
                              );
                              if (index !== -1) {
                                setCurrentIndex(index);
                              }
                            }
                          }}
                        />

                        {inspection?.orderStatus === 2 &&
                          stockInItems.size > 0 &&
                          stockInItems.size < filteredDetailData.length && (
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <Text type='warning'>
                                已完成 {stockInItems.size}/
                                {filteredDetailData.length} 件商品的上架处理
                              </Text>
                            </div>
                          )}

                        {inspection?.orderStatus === 2 &&
                          stockInItems.size === filteredDetailData.length &&
                          filteredDetailData.length > 0 && (
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                              <Button
                                type='primary'
                                icon={<CheckCircleOutlined />}
                                onClick={showSubmitModal}
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
                          <p>没有合格的商品可以上架</p>
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
                render: (locations: Location[], record: any) => (
                  <div>
                    {locations.map((loc, index) => {
                      // 查找货架名称
                      const shelfName =
                        shelvesMap[loc.shelfId]?.shelfName ||
                        shelves.find((shelf) => shelf.id === loc.shelfId)
                          ?.shelfName ||
                        loc.shelfId;

                      // 获取商品信息
                      const currentDetail = detailData.find(
                        (detail) => detail.orderItems.id === record.key
                      );

                      const productId = currentDetail?.product?.id || '';
                      const batchNumber =
                        currentDetail?.orderItems.batchNumber || '';

                      // 组合键
                      const storageKey = `${loc.shelfId}_${productId}_${batchNumber}`;

                      // 获取库位名称
                      const storageNames = loc.storageIds
                        .map((storageId) => {
                          // 三级查找策略

                          // 1. 精确匹配 - 当前商品的组合键
                          let storage = storagesByShelf[storageKey]?.find(
                            (s) => s.id === storageId
                          );

                          if (storage) {
                            return storage.locationName || storageId;
                          }

                          // 2. 同货架查找 - 相同货架下的所有库位
                          const relevantStorageKeys = Object.keys(
                            storagesByShelf
                          ).filter((key) => key.startsWith(`${loc.shelfId}_`));

                          for (const key of relevantStorageKeys) {
                            storage = storagesByShelf[key]?.find(
                              (s) => s.id === storageId
                            );
                            if (storage) {
                              return storage.locationName || storageId;
                            }
                          }

                          // 3. 全局查找 - 所有库位
                          for (const key in storagesByShelf) {
                            storage = storagesByShelf[key]?.find(
                              (s) => s.id === storageId
                            );
                            if (storage) {
                              return storage.locationName || storageId;
                            }
                          }

                          return storageId;
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

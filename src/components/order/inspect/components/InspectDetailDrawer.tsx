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
  Divider,
  Empty,
} from 'antd';
import {
  SyncOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { InspectionVo } from '../../../../api/order-service/InspectController';
import { LocationVo } from '../../../../api/stock-service/StockController';
import {
  OrderDetailVo,
  OrderInItem,
  OrderOutItem,
  inDetail,
  outDetail,
} from '../../../../api/order-service/OrderController';
import { ProductVo, getProductById } from '../../../../api/product-service/ProductController';
import OrderDetailItems from './OrderDetailItems';
import './css/InspectDetailDrawer.css';

const { Title } = Typography;

interface InspectDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  inspection: InspectionVo | null;
}


export default function InspectDetailDrawer({
  visible,
  onClose,
  inspection,
}: InspectDetailDrawerProps) {
  const [selectedLocations, setSelectedLocations] = useState<LocationVo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductVo | null>(
    null
  );
  const [detailData, setDetailData] = useState<
    OrderDetailVo<OrderInItem | OrderOutItem>[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);

  // 获取订单详情数据
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!visible || !inspection || !inspection.relatedOrderId) {
        return;
      }

      setLoading(true);
      try {
        // 质检类型：1-入库质检，2-出库质检，3-库存质检
        if (inspection.inspectionType === 1) {
          // 入库质检使用inDetail
          const result = await inDetail(inspection.relatedOrderId);
          if (result.code === 200) {
            setDetailData(result.data);
          } else {
            message.error(result.msg || '获取入库订单详情失败');
            setDetailData([]);
          }
        } else if (inspection.inspectionType === 2) {
          // 出库质检使用outDetail
          const result = await outDetail(inspection.relatedOrderId);
          if (result.code === 200) {
            setDetailData(result.data);
          } else {
            message.error(result.msg || '获取出库订单详情失败');
            setDetailData([]);
          }
        } else {
          // 库存质检暂不实现
          message.info('库存质检详情功能暂未实现');
          setDetailData([]);
        }
      } catch (error) {
        console.error('获取订单详情失败:', error);
        message.error('获取订单详情失败，请稍后重试');
        setDetailData([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible && inspection) {
      fetchDetailData();
    } else {
      // 重置数据
      setSelectedLocations([]);
      setSelectedProduct(null);
      setSelectedAreaName(null);
      setDetailData([]);
    }
  }, [visible, inspection]);

  // 重置选中的商品和位置
  useEffect(() => {
    setSelectedProduct(null);
    setSelectedLocations([]);
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

    // 如果selectedProduct存在但可能不完整，则获取详细信息
    if (selectedProduct?.id && !selectedProduct.categoryName) {
      fetchProductDetail();
    }
  }, [selectedProduct?.id]);

  if (!inspection) {
    return null;
  }

  // 渲染质检基本信息卡片
  const renderInspectionInfo = () => {
    // 获取对应选中商品的订单项
    const orderDetail = selectedProduct
      ? detailData.find((item) => item.product?.id === selectedProduct.id)
      : null;

    // 获取订单项
    const orderItem = orderDetail?.orderItems;

    // 格式化位置信息
    const formatLocations = () => {
      if (!selectedLocations || selectedLocations.length === 0) {
        return '请在下方选择商品查看位置信息';
      }

      return selectedLocations.map((loc, index) => (
        <div key={index} style={{ marginBottom: '4px' }}>
          {loc.shelfName}: {loc.storageNames.join(', ')}
        </div>
      ));
    };

    return (
      <Card title='质检基本信息' size='small'>
        <Descriptions column={2} bordered size='small'>
          <Descriptions.Item label='质检编号'>
            {inspection.inspectionNo}
          </Descriptions.Item>
          <Descriptions.Item label='预期数量'>
            {orderItem?.expectedQuantity || '请选择商品'}
          </Descriptions.Item>
          <Descriptions.Item label='质检员'>
            {inspection.inspectorInfo?.realName || inspection.inspector || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='区域' span={orderDetail ? 1 : 2}>
            {selectedAreaName || '-'}
          </Descriptions.Item>
          {orderDetail && (
            <Descriptions.Item label='货位' span={1}>
              {formatLocations()}
            </Descriptions.Item>
          )}
        </Descriptions>
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
        className='product-info-card'
      >
        {selectedProduct ? (
          <Descriptions column={2} bordered size='small'>
            <Descriptions.Item label='商品名称' span={2}>
              {selectedProduct.productName}
            </Descriptions.Item>
            <Descriptions.Item label='商品编码'>
              {selectedProduct.productCode}
            </Descriptions.Item>
            <Descriptions.Item label='规格型号'>
              {selectedProduct.spec || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='类别'>
              {selectedProduct.categoryName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='品牌'>
              {selectedProduct.brand || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='单价'>
              {selectedProduct.price ? `¥${selectedProduct.price}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='型号'>
              {selectedProduct.model || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='批次号'>
              {orderItem?.batchNumber || '-'}
            </Descriptions.Item>
            <Descriptions.Item label='预期数量'>
              {orderItem?.expectedQuantity || '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty
            description='请在下方选择商品查看详情'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
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

  return (
    <Drawer
      title={
        <Title level={4}>
          质检单详情
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
      className='inspect-detail-drawer'
    >
      <Spin spinning={loading} tip='加载中...'>
        <div className='inspect-detail-container'>
          {/* 上半部分 - 左右布局 */}
          <Row gutter={16} className='inspect-detail-top'>
            <Col span={8}>
              {/* 左侧 - 质检基本信息和区域信息 */}
              {renderInspectionInfo()}
            </Col>
            <Col span={16}>
              {/* 右侧 - 商品详情 */}
              {renderProductDetails()}
            </Col>
          </Row>

          <Divider />

          {/* 下半部分 - 商品列表 */}
          <div className='inspect-detail-bottom'>
            <Row>
              <Col span={24}>
                {/* 商品明细表格 */}
                {detailData.length > 0 ? (
                  <OrderDetailItems
                    data={detailData}
                    inspectionType={inspection.inspectionType}
                    onSelectProduct={(productId, _areaId, locations) => {
                      const product = detailData.find(
                        (item) => item.product?.id === productId
                      )?.product as ProductVo;
                      const areaName = detailData.find(
                        (item) => item.product?.id === productId
                      )?.areaName;

                      if (product) {
                        setSelectedProduct(product);
                        setSelectedLocations(locations);
                        setSelectedAreaName(areaName || null);
                      }
                    }}
                  />
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
          </div>
        </div>
      </Spin>
    </Drawer>
  );
}

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
  InputNumber,
  Modal,
  Space,
  Splitter,
} from 'antd';
import {
  SyncOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  InspectionVo,
  inBoundCheck,
  ItemInspect,
  InBoundInspectDto,
  inInspectDetail,
  InspectionItem,
  outInspectDetail,
} from '../../../../api/order-service/InspectController';
import { LocationVo } from '../../../../api/stock-service/StockController';
import {
  OrderDetailVo,
  OrderInItem,
  OrderOutItem,
} from '../../../../api/order-service/OrderController';
import {
  ProductVo,
  getProductById,
} from '../../../../api/product-service/ProductController';
import OrderDetailItems from './OrderDetailItems';
import {
  renderQualityStatus,
  renderItemInspectionResult,
  renderReceiveStatus,
} from '../../components/StatusComponents';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface InspectDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  inspection: InspectionVo | null;
  onSuccess?: () => void;
}

interface ProductDetail extends ProductVo {
  batchNumber: string;
}

export default function InspectDetailDrawer({
  visible,
  onClose,
  inspection,
  onSuccess,
}: InspectDetailDrawerProps) {
  const [selectedLocations, setSelectedLocations] = useState<LocationVo[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(
    null
  );
  const [detailData, setDetailData] = useState<
    OrderDetailVo<OrderInItem | OrderOutItem>[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAreaName, setSelectedAreaName] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [inspectedItems, setInspectedItems] = useState<
    Map<string, ItemInspect>
  >(new Map());
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [submitModalVisible, setSubmitModalVisible] = useState<boolean>(false);
  const [finalRemark, setFinalRemark] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  // 获取订单详情数据
  useEffect(() => {
    const fetchDetailData = async () => {
      if (!visible || !inspection) {
        return;
      }

      setLoading(true);
      try {
        // 质检类型：1-入库质检，2-出库质检，3-库存质检
        if (inspection.inspectionType === 1) {
          // 使用新的入库质检详情接口
          const result = await inInspectDetail(inspection.id);
          if (result.code === 200) {
            // 直接使用返回的orderDetail数据，因为它已经是OrderDetailVo<OrderInItem>[]类型
            setDetailData(result.data.orderDetail);
            // 存储inspectionItems数据
            setInspectionItems(result.data.inspectionItems || []);
          } else {
            message.error(result.msg || '获取质检详情失败');
            setDetailData([]);
            setInspectionItems([]);
          }
        } else if (inspection.inspectionType === 2) {
          // 使用新的出库质检详情接口
          const result = await outInspectDetail(inspection.id);
          if (result.code === 200) {
            // 直接使用返回的orderDetail数据，因为它已经是OrderDetailVo<OrderOutItem>[]类型
            setDetailData(result.data.orderDetail);
            // 存储inspectionItems数据
            setInspectionItems(result.data.inspectionItems || []);
          } else {
            message.error(result.msg || '获取质检详情失败');
            setDetailData([]);
            setInspectionItems([]);
          }
        } else {
          // 库存质检暂不实现
          message.info('库存质检详情功能暂未实现');
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
      setSelectedLocations([]);
      setSelectedProduct(null);
      setSelectedAreaName(null);
      setDetailData([]);
      setInspectionItems([]);
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
      if (!selectedProduct?.id || !selectedProduct.batchNumber) return;

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

  // 当选择产品时，自动加载已存在的质检数据
  useEffect(() => {
    if (!selectedProduct) return;

    // 查找当前选中的商品详情
    const orderDetail = detailData.find(
      (item) =>
        item.product?.id === selectedProduct.id &&
        item.orderItems.batchNumber === selectedProduct.batchNumber
    );

    if (!orderDetail) return;

    // 查看是否有已存在的质检数据
    const existingInspect = inspectedItems.get(
      selectedProduct.id + '_' + selectedProduct.batchNumber
    );

    if (existingInspect) {
      // 自动加载已存在的质检数据到表单
      form.setFieldsValue({
        actualQuantity: existingInspect.actualQuantity,
        qualifiedQuantity: existingInspect.count,
        approval: existingInspect.approval ? 'true' : 'false',
        itemRemark: existingInspect.remark,
      });
    } else {
      // 否则加载默认值
      form.setFieldsValue({
        actualQuantity: orderDetail.orderItems.expectedQuantity || 0,
        qualifiedQuantity: null,
        approval: 'true',
        itemRemark: '',
      });
    }
  }, [selectedProduct, detailData, inspectedItems, form]);

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

    // 判断是否可以操作（未质检状态）
    const canOperate =
      inspection?.status === 0 && selectedProduct && orderDetail;

    // 检查当前商品是否已质检
    const isInspected =
      orderDetail &&
      inspectedItems.has(
        selectedProduct?.id + '_' + selectedProduct?.batchNumber
      );

    // 获取当前商品的质检详情信息
    const getInspectionItem = inspectionItems.find(
      (item) =>
        item.productId === selectedProduct?.id &&
        item.batchNumber === selectedProduct?.batchNumber
    );

    // 处理提交当前商品质检结果
    const handleSubmitItem = async () => {
      if (!selectedProduct || !orderDetail) return;

      try {
        const values = await form.validateFields();

        // 查找对应的质检详情项
        const inspectionItem = inspectionItems.find(
          (item) =>
            item.productId === selectedProduct.id &&
            item.batchNumber === selectedProduct.batchNumber
        );

        if (!inspectionItem && inspection.status !== 0) {
          message.error('未找到对应的质检详情，无法提交');
          return;
        }

        // 创建质检项
        const itemInspect: ItemInspect = {
          itemId: inspectionItem?.id || '',
          productId: selectedProduct.id,
          actualQuantity: values.actualQuantity,
          count: values.qualifiedQuantity,
          approval: values.approval === 'true',
          remark: values.itemRemark || '',
        };

        // 更新已质检项目集合
        const newInspectedItems = new Map(inspectedItems);
        newInspectedItems.set(
          selectedProduct.id + '_' + selectedProduct.batchNumber,
          itemInspect
        );
        setInspectedItems(newInspectedItems);

        message.success(`${isInspected ? '更新' : '提交'}成功`);

        // 检查是否所有商品都已质检
        if (newInspectedItems.size === detailData.length) {
          setSubmitModalVisible(true);
        } else {
          // 寻找下一个未质检的商品
          const findNextProduct = () => {
            // 获取当前所有商品的ID和批次号组合列表
            const allProductKeys = detailData.map(
              (item) => item.product?.id + '_' + item.orderItems.batchNumber
            );

            // 获取当前选中商品的索引
            const currentIndex = allProductKeys.indexOf(
              selectedProduct.id + '_' + selectedProduct.batchNumber
            );

            // 从当前位置开始查找下一个未质检的商品
            if (currentIndex !== -1) {
              for (let i = 1; i < allProductKeys.length; i++) {
                const nextIndex = (currentIndex + i) % allProductKeys.length;
                const nextKey = allProductKeys[nextIndex];

                // 如果该商品未质检，则选择它
                if (!newInspectedItems.has(nextKey)) {
                  // 分割产品ID和批次号
                  const nextProductId = nextKey.split('_')[0];
                  const nextDetail = detailData[nextIndex];
                  const nextBatchNumber =
                    nextDetail.orderItems.batchNumber || '';
                  const nextAreaName = nextDetail.areaName;

                  // 清空原有位置信息，使用空数组
                  const nextLocations: LocationVo[] = [];

                  // 选择下一个商品
                  if (nextDetail.product) {
                    // 获取产品所有信息
                    getProductById(nextProductId).then((result) => {
                      if (result.code === 200) {
                        // 设置选中的产品
                        setSelectedProduct({
                          ...result.data,
                          batchNumber: nextBatchNumber,
                        });

                        // 更新位置和区域信息
                        setSelectedLocations(nextLocations);
                        setSelectedAreaName(nextAreaName || null);

                        // 重置表单内容
                        form.setFieldsValue({
                          actualQuantity:
                            nextDetail.orderItems.expectedQuantity || 0,
                          qualifiedQuantity: null,
                          approval: 'true',
                          itemRemark: '',
                        });
                      }
                    });
                  }
                  return;
                }
              }
            }
          };

          // 执行查找下一个商品的逻辑
          findNextProduct();
        }
      } catch (error) {
        console.error('表单验证失败:', error);
      }
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
            <span>
              质检基本信息: {renderQualityStatus(inspection.status)},详情信息:
              {inspection.status !== 0
                ? renderItemInspectionResult(
                    getInspectionItem?.qualityStatus || 0
                  )
                : '-'}
              {inspection.inspectionType === 1 && (
                <>
                  ,上架状态:
                  {selectedProduct
                    ? renderReceiveStatus(getInspectionItem?.receiveStatus || 0)
                    : '-'}
                </>
              )}
            </span>
            <Space>
              {canOperate && (
                <Button
                  type='primary'
                  onClick={handleSubmitItem}
                  icon={isInspected ? <EditOutlined /> : <CheckOutlined />}
                  size='small'
                >
                  {isInspected ? '更新' : '提交'}
                </Button>
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
            <Descriptions.Item label='质检员'>
              {inspection.inspectorInfo?.realName ||
                inspection.inspector ||
                '-'}
            </Descriptions.Item>
            <Descriptions.Item label='预期数量'>
              {orderItem?.expectedQuantity || '请选择商品'}
            </Descriptions.Item>
            <Descriptions.Item label='实际数量'>
              {inspection.status !== 0
                ? getInspectionItem?.inspectionQuantity
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='合格数量'>
              {inspection.status !== 0
                ? getInspectionItem?.qualifiedQuantity
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='不合格数量'>
              {inspection.status !== 0
                ? getInspectionItem?.unqualifiedQuantity
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label='备注'>
              {getInspectionItem?.remark || '-'}
            </Descriptions.Item>
          </Descriptions>

          {canOperate && (
            <div style={{ marginTop: 16 }}>
              <Form
                form={form}
                layout='vertical'
                initialValues={{
                  actualQuantity: orderItem?.expectedQuantity || 0,
                  approval: 'true',
                  itemRemark: '',
                }}
              >
                <Row gutter={16}>
                  <Col span={4}>
                    <Form.Item
                      name='actualQuantity'
                      label='实际数量'
                      rules={[{ required: true, message: '请输入实际数量' }]}
                    >
                      <InputNumber
                        min={0}
                        max={orderItem?.expectedQuantity || 0}
                        style={{ width: '100%' }}
                        onChange={(value) => {
                          // 当实际数量发生变化时，重置合格数量
                          const currentQualified =
                            form.getFieldValue('qualifiedQuantity');
                          if (
                            value &&
                            currentQualified &&
                            currentQualified > value
                          ) {
                            form.setFieldsValue({ qualifiedQuantity: value });
                          } else if (!value) {
                            form.setFieldsValue({ qualifiedQuantity: null });
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name='qualifiedQuantity'
                      label='合格数量'
                      dependencies={['actualQuantity']}
                      rules={[
                        { required: true, message: '请输入合格数量' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const actualQuantity =
                              getFieldValue('actualQuantity');
                            if (
                              actualQuantity === undefined ||
                              actualQuantity === null
                            ) {
                              return Promise.reject(
                                new Error('请先输入实际数量')
                              );
                            }
                            if (value > actualQuantity) {
                              return Promise.reject(
                                new Error('合格数量不能大于实际数量')
                              );
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <InputNumber
                        min={0}
                        max={form.getFieldValue('actualQuantity') || 0}
                        style={{ width: '100%' }}
                        disabled={!form.getFieldValue('actualQuantity')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name='approval'
                      label='是否通过'
                      rules={[{ required: true, message: '请选择是否通过' }]}
                    >
                      <Select>
                        <Option value='true'>通过</Option>
                        <Option value='false'>不通过</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name='itemRemark' label='质检备注'>
                      <Input
                        placeholder='请输入商品质检备注'
                        onPressEnter={handleSubmitItem}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </div>
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
          <Descriptions.Item label='区域'>
            {selectedAreaName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='货位' span={2}>
            {formatLocations()}
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

  // 提交最终质检结果
  const handleSubmitInspection = async () => {
    if (inspectedItems.size !== detailData.length) {
      message.warning('请完成所有商品的质检');
      return;
    }

    setSubmitting(true);
    try {
      const dto: InBoundInspectDto = {
        itemInspects: Array.from(inspectedItems.values()),
        remark: finalRemark,
        inspectionNo: inspection?.inspectionNo || '',
      };

      const result = await inBoundCheck(dto);
      if (result.code === 200) {
        message.success('质检提交成功');
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
        message.error(result.msg || '质检提交失败');
      }
    } catch (error) {
      console.error('质检提交失败:', error);
      message.error('质检提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        title={
          <Title level={4} style={{ margin: 0, lineHeight: '32px' }}>
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
      >
        <Spin spinning={loading} tip='加载中...'>
          <div className='inspect-detail-container'>
            <Splitter layout='vertical' style={{ height: '100%' }}>
              <Splitter.Panel defaultSize='40%'>
                <Splitter style={{ height: '100%' }}>
                  {/* 上半部分 - 左右布局 */}
                  <Splitter.Panel defaultSize='45%'>
                    {/* 左侧 - 质检基本信息和区域信息 */}
                    {renderInspectionInfo()}
                  </Splitter.Panel>
                  <Splitter.Panel>
                    {/* 右侧 - 商品详情 */}
                    {renderProductDetails()}
                  </Splitter.Panel>
                </Splitter>
              </Splitter.Panel>
              <Splitter.Panel>
                {/* 下半部分 - 商品列表 */}
                {/* 商品明细表格 */}
                {detailData.length > 0 ? (
                  <div>
                    <OrderDetailItems
                      data={detailData}
                      inspectionType={inspection.inspectionType}
                      onSelectProduct={(
                        productId,
                        _areaId,
                        locations,
                        batchNumber
                      ) => {
                        const product = detailData.find(
                          (item) =>
                            item.product?.id === productId &&
                            item.orderItems.batchNumber === batchNumber
                        )?.product as ProductVo;
                        const areaName = detailData.find(
                          (item) =>
                            item.product?.id === productId &&
                            item.orderItems.batchNumber === batchNumber
                        )?.areaName;

                        if (product) {
                          setSelectedProduct({
                            ...product,
                            batchNumber: batchNumber || '',
                          });
                          setSelectedLocations(locations);
                          setSelectedAreaName(areaName || null);
                        }
                      }}
                    />

                    {inspection?.status === 0 &&
                      inspectedItems.size > 0 &&
                      inspectedItems.size < detailData.length && (
                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                          <Text type='warning'>
                            已完成 {inspectedItems.size}/{detailData.length}{' '}
                            件商品的质检
                          </Text>
                        </div>
                      )}

                    {inspection?.status === 0 &&
                      inspectedItems.size === detailData.length && (
                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                          <Button
                            type='primary'
                            icon={<CheckCircleOutlined />}
                            onClick={() => setSubmitModalVisible(true)}
                          >
                            提交质检结果
                          </Button>
                        </div>
                      )}
                  </div>
                ) : (
                  <Card>
                    <SyncOutlined
                      spin
                      style={{ fontSize: 24, marginBottom: 16 }}
                    />
                    <p>暂无商品详情数据</p>
                  </Card>
                )}
              </Splitter.Panel>
            </Splitter>
          </div>
        </Spin>
      </Drawer>

      {/* 最终提交确认对话框 */}
      <Modal
        title='提交质检结果'
        open={submitModalVisible}
        onOk={handleSubmitInspection}
        onCancel={() => setSubmitModalVisible(false)}
        confirmLoading={submitting}
        footer={null}
      >
        <p>所有商品已完成质检，确定提交质检结果？</p>
        <Form layout='vertical'>
          <Form.Item label='质检备注'>
            <TextArea
              rows={4}
              placeholder='请输入质检备注（可选）'
              value={finalRemark}
              onChange={(e) => setFinalRemark(e.target.value)}
            />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setSubmitModalVisible(false)}>取消</Button>
              <Button
                type='primary'
                onClick={handleSubmitInspection}
                loading={submitting}
              >
                提交质检
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
}

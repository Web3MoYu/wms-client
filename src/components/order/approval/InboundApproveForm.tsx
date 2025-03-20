import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Form,
  Select,
  Row,
  Col,
  message,
  Tag,
  Space,
  Button,
  Alert,
  Spin,
  Badge,
  Tooltip,
  Collapse,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  InfoCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { OrderVo } from '../../../api/order-service/OrderController';
import {
  Area,
  getAllAreas,
} from '../../../api/location-service/AreaController';
import {
  Shelf,
  getShelfListByAreaId,
} from '../../../api/location-service/ShelfController';
import { getStoragesByShelfId } from '../../../api/location-service/StorageController';
import {
  inDetail,
  OrderInItem,
} from '../../../api/order-service/OrderController';
import { ApprovalDto } from '../../../api/order-service/ApprovalController';

const { Text, Title } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface InboundApproveFormProps {
  form: any;
  order: OrderVo;
}

// 入库订单同意组件
const InboundApproveForm: React.FC<InboundApproveFormProps> = ({
  form,
  order,
}) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [shelves, setShelves] = useState<{ [areaId: string]: Shelf[] }>({});
  const [storages, setStorages] = useState<{ [shelfId: string]: any[] }>({});
  const [orderDetails, setOrderDetails] = useState<OrderInItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableShelves, setAvailableShelves] = useState<{
    [areaId: string]: Set<string>;
  }>({});
  const [initialized, setInitialized] = useState(false);
  // 当前激活的面板
  const [activeKey, setActiveKey] = useState<string | string[]>([]);

  // 组件加载时获取订单详情和区域列表
  useEffect(() => {
    // 重置状态
    setOrderDetails([]);
    setInitialized(false);
    setShelves({});
    setStorages({});
    setAvailableShelves({});
    setActiveKey([]);

    // 获取数据
    fetchOrderDetails();
    fetchAreas();
  }, [order.id]);

  // 获取订单详情
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      if (order?.id) {
        const res = await inDetail(order.id);
        if (res.code === 200) {
          // 提取订单明细项
          const details: OrderInItem[] = res.data.map(
            (item) => item.orderItems
          );
          setOrderDetails(details);

          // 初始化表单数据
          initFormData(details);
          setInitialized(true);

          // 默认全部关闭，不展开任何项目
          setActiveKey([]);
        }
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化表单数据
  const initFormData = (details: OrderInItem[]) => {
    const approvalItems: ApprovalDto[] = details.map((item) => ({
      id: item.id,
      areaId: item.areaId || '',
      productId: item.productId || '',
      location: [
        {
          shelfId: '',
          storageIds: [],
        },
      ],
    }));

    form.setFieldsValue({ approvalItems });
  };

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

  // 加载货架列表
  const loadShelves = async (areaId: string) => {
    if (!areaId || shelves[areaId]) return;

    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        // 更新货架列表
        setShelves((prev) => ({
          ...prev,
          [areaId]: res.data,
        }));

        // 初始化该区域的可用货架集合
        setAvailableShelves((prev) => ({
          ...prev,
          [areaId]: new Set<string>(),
        }));

        // 对每个货架检查是否有可用库位
        for (const shelf of res.data) {
          checkShelfAvailability(areaId, shelf.id);
        }
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
    }
  };

  // 检查货架是否有可用库位
  const checkShelfAvailability = async (areaId: string, shelfId: string) => {
    try {
      // 加载库位列表
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        // 更新库位列表
        setStorages((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));

        // 检查是否有状态为1的可用库位
        const hasAvailableStorage = res.data.some(
          (storage) => storage.status === 1
        );

        // 如果有可用库位，将此货架ID添加到可用货架集合中
        if (hasAvailableStorage) {
          setAvailableShelves((prev) => {
            const updatedSet = new Set(prev[areaId] || []);
            updatedSet.add(shelfId);
            return {
              ...prev,
              [areaId]: updatedSet,
            };
          });
        }
      }
    } catch (error) {
      console.error('检查货架可用性失败:', error);
    }
  };

  // 加载库位列表
  const loadStorages = async (shelfId: string) => {
    if (!shelfId || storages[shelfId]) return;

    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setStorages((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  // 处理区域变更
  const handleAreaChange = (areaId: string, index: number) => {
    // 清空当前项的货架和库位选择
    const approvalItems = form.getFieldValue('approvalItems');
    if (approvalItems && approvalItems[index]) {
      // 设置新的位置
      approvalItems[index].location = [
        {
          shelfId: '',
          storageIds: [],
        },
      ];
      form.setFieldsValue({ approvalItems });
    }

    // 加载该区域的货架列表
    loadShelves(areaId);
  };

  // 处理货架变更
  const handleShelfChange = (
    shelfId: string,
    indexItem: number,
    indexLocation: number
  ) => {
    // 清空当前项的库位选择
    const approvalItems = form.getFieldValue('approvalItems');
    if (
      approvalItems &&
      approvalItems[indexItem] &&
      approvalItems[indexItem].location[indexLocation]
    ) {
      // 清空库位选择
      approvalItems[indexItem].location[indexLocation].storageIds = [];
      form.setFieldsValue({ approvalItems });
    }

    // 加载该货架的库位列表
    loadStorages(shelfId);
  };

  // 检查库位是否已经被选择
  const checkStorageUsed = (
    storageId: string,
    currentItemIndex: number,
    currentLocationIndex: number
  ) => {
    const approvalItems = form.getFieldValue('approvalItems');
    if (!approvalItems) return null;

    // 检查所有订单项
    for (let itemIndex = 0; itemIndex < approvalItems.length; itemIndex++) {
      const item = approvalItems[itemIndex];
      if (!item || !item.location) continue;

      // 检查该订单项的所有位置
      for (let locIndex = 0; locIndex < item.location.length; locIndex++) {
        // 跳过当前正在检查的位置
        if (itemIndex === currentItemIndex && locIndex === currentLocationIndex)
          continue;

        const loc = item.location[locIndex];
        if (!loc || !loc.storageIds) continue;

        // 检查是否包含要查找的库位ID
        if (loc.storageIds.includes(storageId)) {
          // 返回冲突信息
          return {
            itemIndex,
            locationIndex: locIndex,
            isSameItem: itemIndex === currentItemIndex,
          };
        }
      }
    }

    // 没有找到冲突
    return null;
  };

  // 处理库位选择变化
  const handleStorageChange = (
    selectedIds: string[],
    indexItem: number,
    indexLocation: number
  ) => {
    console.log('库位选择变化:', selectedIds, indexItem, indexLocation);

    // 获取当前位置之前的选择
    const approvalItems = form.getFieldValue('approvalItems');
    const previousSelectedIds =
      approvalItems[indexItem]?.location[indexLocation]?.storageIds || [];

    // 找出新添加的库位IDs
    const newlyAdded = selectedIds.filter(
      (id) => !previousSelectedIds.includes(id)
    );

    // 检查每个新添加的库位是否已被选择
    const validSelections = [...previousSelectedIds];

    for (const storageId of newlyAdded) {
      const conflict = checkStorageUsed(storageId, indexItem, indexLocation);

      if (!conflict) {
        // 没有冲突，添加到有效选择中
        validSelections.push(storageId);
      }
    }

    // 更新表单数据，只保留有效的选择
    approvalItems[indexItem].location[indexLocation].storageIds =
      validSelections;
    form.setFieldsValue({ approvalItems });
  };

  // 获取所有已选择的库位ID，用于在下拉框中禁用
  const getAllSelectedStorageIds = (
    currentItemIndex: number,
    currentLocationIndex: number
  ) => {
    const approvalItems = form.getFieldValue('approvalItems');
    if (!approvalItems) return new Set<string>();

    const selectedIds = new Set<string>();

    approvalItems.forEach((item: any, itemIndex: number) => {
      if (!item || !item.location) return;

      item.location.forEach((loc: any, locIndex: number) => {
        // 跳过当前正在编辑的位置
        if (itemIndex === currentItemIndex && locIndex === currentLocationIndex)
          return;

        if (!loc || !loc.storageIds) return;

        loc.storageIds.forEach((id: string) => selectedIds.add(id));
      });
    });

    return selectedIds;
  };

  // 处理面板变化
  const handleCollapseChange = (key: string | string[]) => {
    setActiveKey(key);
  };

  // 商品信息头部
  const renderProductHeader = (detail: OrderInItem) => (
    <Row align='middle' gutter={16} style={{ width: '100%' }}>
      <Col flex='auto'>
        <Space>
          <Badge status='processing' />
          <Text strong style={{ fontSize: 16 }}>
            {detail?.productName || '商品'}
          </Text>
          <Text type='secondary'>
            (ID: {detail?.productId || '-'})
          </Text>
        </Space>
      </Col>
      <Col>
        <Space>
          <Text>预期数量:</Text>
          <Text strong>{detail?.expectedQuantity || 0}</Text>
        </Space>
      </Col>
    </Row>
  );

  return (
    <Card bordered={false} className='inbound-approve-form'>
      <Row gutter={[0, 16]}>
        <Col span={24}>
          <Title level={4}>入库订单审批</Title>
          <Alert
            message={
              <Space>
                <InfoCircleOutlined />
                <Text strong>
                  库位分配规则：同一个库位只能分配给一个商品的一个位置，不能重复选择相同的库位
                </Text>
              </Space>
            }
            type='info'
            showIcon={false}
            style={{
              marginBottom: 16,
              backgroundColor: '#f0f5ff',
              border: '1px solid #d6e4ff',
            }}
          />
        </Col>

        {loading ? (
          <Col span={24}>
            <Spin tip='加载中...' size='large'>
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              ></div>
            </Spin>
          </Col>
        ) : !initialized || orderDetails.length === 0 ? (
          <Col span={24}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Text type='secondary'>正在加载订单数据，请稍候...</Text>
            </div>
          </Col>
        ) : (
          <Col span={24}>
            <Form.List name='approvalItems'>
              {(fields) => (
                <Collapse
                  activeKey={activeKey}
                  onChange={handleCollapseChange}
                  expandIcon={({ isActive }) => (
                    <RightOutlined
                      rotate={isActive ? 90 : 0}
                    />
                  )}
                  className='product-items-collapse'
                >
                  {fields.map(({ name, ...restField }, index) => {
                    const detail = orderDetails[index];
                    const areaId = form.getFieldValue([
                      'approvalItems',
                      index,
                      'areaId',
                    ]);

                    return (
                      <Panel
                        key={index.toString()}
                        header={renderProductHeader(detail)}
                        className='product-item-panel'
                      >
                        <Row gutter={[16, 16]}>
                          {/* 区域选择 */}
                          <Col span={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'areaId']}
                              label={<Text strong>选择区域</Text>}
                              rules={[{ required: true, message: '请选择区域' }]}
                              style={{ marginBottom: 16 }}
                            >
                              <Select
                                placeholder='请选择区域'
                                onChange={(value) =>
                                  handleAreaChange(value, index)
                                }
                                loading={loading}
                                style={{ width: '100%' }}
                                showSearch
                                optionFilterProp='children'
                              >
                                {areas.map((area) => (
                                  <Option key={area.id} value={area.id}>
                                    {area.areaName}
                                  </Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>

                          {/* 位置分配列表 */}
                          <Col span={24}>
                            <div className='location-allocation-section'>
                              <Text
                                strong
                                style={{
                                  marginBottom: 8,
                                  display: 'block',
                                }}
                              >
                                库位分配
                              </Text>

                              <Form.List name={[name, 'location']}>
                                {(locationFields, { add, remove }) => (
                                  <>
                                    {locationFields.map(
                                      (
                                        {
                                          key: locationKey,
                                          name: locationName,
                                          ...restLocationField
                                        },
                                        locationIndex
                                      ) => {
                                        const shelfId = form.getFieldValue([
                                          'approvalItems',
                                          index,
                                          'location',
                                          locationIndex,
                                          'shelfId',
                                        ]);
                                        // 获取当前查看的所有已选择的库位ID
                                        const selectedIds =
                                          getAllSelectedStorageIds(
                                            index,
                                            locationIndex
                                          );

                                        return (
                                          <div
                                            key={locationKey}
                                            className='location-item'
                                            style={{
                                              marginBottom: 12,
                                              padding: 12,
                                              backgroundColor: '#fafafa',
                                              borderRadius: 4,
                                              position: 'relative',
                                            }}
                                          >
                                            <Row gutter={16} align='middle'>
                                              <Col span={8}>
                                                <Form.Item
                                                  {...restLocationField}
                                                  name={[
                                                    locationName,
                                                    'shelfId',
                                                  ]}
                                                  label={<Text strong>货架</Text>}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message: '请选择货架',
                                                    },
                                                  ]}
                                                  style={{ marginBottom: 0 }}
                                                >
                                                  <Select
                                                    placeholder='请选择货架'
                                                    onChange={(value) =>
                                                      handleShelfChange(
                                                        value,
                                                        index,
                                                        locationIndex
                                                      )
                                                    }
                                                    disabled={!areaId}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    optionFilterProp='children'
                                                  >
                                                    {(
                                                      shelves[areaId] || []
                                                    ).map((shelf) => {
                                                      // 只显示有可用库位的货架
                                                      if (
                                                        availableShelves[
                                                          areaId
                                                        ]?.has(shelf.id)
                                                      ) {
                                                        return (
                                                          <Option
                                                            key={shelf.id}
                                                            value={shelf.id}
                                                          >
                                                            {shelf.shelfName}
                                                          </Option>
                                                        );
                                                      }
                                                      return null;
                                                    })}
                                                  </Select>
                                                </Form.Item>
                                              </Col>
                                              <Col span={14}>
                                                <Form.Item
                                                  {...restLocationField}
                                                  name={[
                                                    locationName,
                                                    'storageIds',
                                                  ]}
                                                  label={<Text strong>库位</Text>}
                                                  rules={[
                                                    {
                                                      required: true,
                                                      message:
                                                        '请选择至少一个库位',
                                                    },
                                                  ]}
                                                  style={{ marginBottom: 0 }}
                                                >
                                                  <Select
                                                    mode='multiple'
                                                    placeholder='请选择库位'
                                                    disabled={!shelfId}
                                                    style={{ width: '100%' }}
                                                    showSearch
                                                    optionFilterProp='children'
                                                    onChange={(value) =>
                                                      handleStorageChange(
                                                        value,
                                                        index,
                                                        locationIndex
                                                      )
                                                    }
                                                    tagRender={(props) => {
                                                      const storage =
                                                        storages[
                                                          shelfId
                                                        ]?.find(
                                                          (s) =>
                                                            s.id ===
                                                            props.value
                                                        );
                                                      const displayName =
                                                        storage
                                                          ? storage.locationName
                                                          : props.value;

                                                      return (
                                                        <Tag
                                                          color='blue'
                                                          closable={
                                                            props.closable
                                                          }
                                                          onClose={
                                                            props.onClose
                                                          }
                                                          style={{
                                                            marginRight: 3,
                                                          }}
                                                        >
                                                          {displayName}
                                                        </Tag>
                                                      );
                                                    }}
                                                  >
                                                    {(
                                                      storages[shelfId] || []
                                                    ).map((storage) => {
                                                      const displayName =
                                                        storage.locationName ||
                                                        storage.id;
                                                      const isUsed =
                                                        selectedIds.has(
                                                          storage.id
                                                        );

                                                      // 只显示空闲状态的库位
                                                      if (
                                                        storage.status === 1
                                                      ) {
                                                        return (
                                                          <Option
                                                            key={storage.id}
                                                            value={storage.id}
                                                            label={
                                                              displayName
                                                            }
                                                            disabled={isUsed}
                                                          >
                                                            {isUsed
                                                              ? `${displayName} (已被占用)`
                                                              : displayName}
                                                          </Option>
                                                        );
                                                      }
                                                      return null;
                                                    })}
                                                  </Select>
                                                </Form.Item>
                                              </Col>
                                              <Col
                                                span={2}
                                                style={{
                                                  textAlign: 'center',
                                                }}
                                              >
                                                {locationFields.length >
                                                  1 && (
                                                  <Tooltip title='删除此位置'>
                                                    <Button
                                                      type='link'
                                                      danger
                                                      icon={
                                                        <MinusCircleOutlined />
                                                      }
                                                      onClick={() => {
                                                        remove(locationIndex);
                                                        // 删除位置后，强制刷新表单，触发重新渲染和库位占用状态更新
                                                        setTimeout(() => {
                                                          const currentValues =
                                                            form.getFieldsValue();
                                                          form.setFieldsValue(
                                                            {
                                                              ...currentValues,
                                                            }
                                                          );
                                                        }, 0);
                                                      }}
                                                    />
                                                  </Tooltip>
                                                )}
                                              </Col>
                                            </Row>
                                          </div>
                                        );
                                      }
                                    )}

                                    <Button
                                      type='dashed'
                                      onClick={() => add()}
                                      block
                                      icon={<PlusOutlined />}
                                      style={{ marginBottom: 8 }}
                                    >
                                      添加更多位置
                                    </Button>
                                  </>
                                )}
                              </Form.List>
                            </div>
                          </Col>
                        </Row>
                      </Panel>
                    );
                  })}
                </Collapse>
              )}
            </Form.List>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default InboundApproveForm;

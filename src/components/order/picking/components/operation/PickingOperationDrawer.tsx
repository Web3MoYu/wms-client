import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Table,
  Typography,
  Space,
  Tag,
  InputNumber,
  Form,
  Button,
  message,
  Cascader,
  Spin,
  Modal,
  Checkbox,
  Card,
  Row,
  Col,
  Input,
} from 'antd';
import {
  PickingItemVo,
  getPickingLocation,
  PickingLocation,
  PickingOneDto,
  pickingOne,
} from '../../../../../api/order-service/PickingController';
import { LocationInfo } from '../../../../../api/stock-service/StockController';
import { renderPickingStatus } from '../../../components/StatusComponents';

const { Title } = Typography;
const { TextArea } = Input;

interface PickingOperationDrawerProps {
  visible: boolean;
  onClose: () => void;
  orderNo: string;
  orderId: string; // 订单ID
  pickingItems: PickingItemVo[];
  isAllNotPicked: boolean; // 是否所有商品都未拣货
}

// 级联选择器选项格式
interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

const PickingOperationDrawer: React.FC<PickingOperationDrawerProps> = ({
  visible,
  onClose,
  orderNo,
  orderId,
  pickingItems,
  isAllNotPicked,
}) => {
  const [form] = Form.useForm();
  const [editingItems, setEditingItems] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<
    Record<string, PickingLocation>
  >({});
  const [locationOptions, setLocationOptions] = useState<
    Record<string, CascaderOption[]>
  >({});
  const [confirmModalVisible, setConfirmModalVisible] =
    useState<boolean>(false);
  const [selectedStorages, setSelectedStorages] = useState<
    Record<string, { locationInfo: LocationInfo[]; emptyIds: Set<string> }>
  >({});
  const [processingData, setProcessingData] = useState<PickingOneDto[]>([]);
  const [deletedStorages, setDeletedStorages] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [itemRemarks, setItemRemarks] = useState<Record<string, string>>({});

  // 获取拣货位置信息
  useEffect(() => {
    if (visible && pickingItems.length > 0) {
      fetchLocationData();
    }
  }, [visible, pickingItems]);

  // 获取位置信息
  const fetchLocationData = async () => {
    if (!orderId) return;

    setLocationLoading(true);
    try {
      const result = await getPickingLocation(orderId);
      if (result.code === 200 && result.data) {
        // 将位置数据按itemId进行索引
        const locationMap: Record<string, PickingLocation> = {};
        const optionsMap: Record<string, CascaderOption[]> = {};

        result.data.forEach((location) => {
          locationMap[location.itemId] = location;

          // 转换为级联选择器需要的格式
          if (location.locations && location.locations.length > 0) {
            const options: CascaderOption[] = [];
            const locations = location.locations;
            // 按货架分组
            const shelfMap = new Map<string, Storage[]>();
            locations.forEach((loc) => {
              if (!shelfMap.has(loc.shelf.id)) {
                shelfMap.set(loc.shelf.id, loc.storages);
              } else {
                shelfMap.get(loc.shelf.id)?.push(...loc.storages);
              }
            });
            // 生成级联选择器选项
            shelfMap.forEach((storages, shelfId) => {
              const option: CascaderOption = {
                value: shelfId,
                label: locations.filter((item) => item.shelf.id === shelfId)[0]
                  .shelf.shelfName,
                children: storages.map((storage: any) => ({
                  value: storage.id || '',
                  label: storage.locationName || '',
                })),
              };
              options.push(option);
            });

            optionsMap[location.itemId] = options;
          }
        });

        setLocationData(locationMap);
        setLocationOptions(optionsMap);
      } else {
        message.error(result.msg || '获取拣货位置信息失败');
      }
    } catch (error) {
      console.error('获取拣货位置信息失败:', error);
      message.error('获取拣货位置信息失败，请重试');
    } finally {
      setLocationLoading(false);
    }
  };

  // 处理拣货数量变更
  const handleQuantityChange = (
    value: number | null,
    record: PickingItemVo
  ) => {
    setEditingItems({
      ...editingItems,
      [record.id]: {
        ...editingItems[record.id],
        actualQuantity: value,
      },
    });
  };

  // 获取商品的实际数量，如果没有设置则使用预期数量
  const getItemActualQuantity = (itemId: string): number => {
    const item = editingItems[itemId];
    // 如果用户手动设置了数量，使用设置的数量
    if (item && item.actualQuantity !== undefined && item.actualQuantity !== null) {
      return item.actualQuantity;
    }
    // 否则使用预期数量
    const pickingItem = pickingItems.find(item => item.id === itemId);
    return pickingItem?.expectedQuantity || 0;
  };

  // 获取商品对应的区域ID
  const getItemAreaId = (itemId: string): string => {
    const location = locationData[itemId];
    return location?.area?.id || '';
  };

  // 处理货位选择变更
  const handleLocationChange = (value: any[], record: PickingItemVo) => {
    // 提取所选货架和库位信息
    const selectedLocations = value.map((item) => {
      const shelf = item[0];
      const storage = item[1];
      return { shelf, storage };
    });

    setEditingItems({
      ...editingItems,
      [record.id]: {
        ...editingItems[record.id],
        selectedLocations,
      },
    });
  };

  // 处理商品备注变更
  const handleRemarkChange = (itemId: string, remark: string) => {
    setItemRemarks(prev => ({
      ...prev,
      [itemId]: remark
    }));
  };

  // 打开确认Modal
  const openConfirmModal = () => {
    // 准备所需数据
    const itemsWithLocations: Record<
      string,
      { locationInfo: LocationInfo[]; emptyIds: Set<string> }
    > = {};
    const dataToProcess: PickingOneDto[] = [];

    // 初始化空备注状态
    const initialRemarks: Record<string, string> = {};

    // 处理每个商品的选择库位
    Object.keys(editingItems).forEach((itemId) => {
      const item = editingItems[itemId];
      if (item.selectedLocations && item.selectedLocations.length > 0) {
        // 按货架分组库位
        const locationMap = new Map<string, any[]>();

        item.selectedLocations.forEach((loc: any) => {
          const shelfId = loc.shelf;
          const storageId = loc.storage;

          // 查找完整的货架和库位信息
          const shelfInfo = locationOptions[itemId]?.find(
            (opt) => opt.value === shelfId
          );
          const storageInfo = shelfInfo?.children?.find(
            (child) => child.value === storageId
          );

          if (shelfInfo && storageInfo) {
            if (!locationMap.has(shelfId)) {
              locationMap.set(shelfId, []);
            }

            locationMap.get(shelfId)?.push({
              id: storageId,
              locationName: storageInfo.label,
            });
          }
        });

        // 转换为LocationInfo格式
        const locationInfos: LocationInfo[] = [];

        locationMap.forEach((storages, shelfId) => {
          const shelfInfo = locationOptions[itemId]?.find(
            (opt) => opt.value === shelfId
          );
          if (shelfInfo) {
            locationInfos.push({
              shelf: {
                id: shelfId,
                shelfName: shelfInfo.label as string,
                areaId: '', // 补充必需字段
                shelfCode: '', // 补充必需字段
                status: 1, // 补充必需字段
                createTime: '', // 补充必需字段
                updateTime: '', // 补充必需字段
              },
              storages: storages,
            });
          }
        });

        // 为每个商品准备数据
        itemsWithLocations[itemId] = {
          locationInfo: locationInfos,
          emptyIds: new Set<string>(),
        };

        // 获取实际数量和区域ID
        const actualQuantity = getItemActualQuantity(itemId);
        const areaId = getItemAreaId(itemId);
        
        // 初始化此商品的备注为空
        initialRemarks[itemId] = '';

        // 准备提交数据
        dataToProcess.push({
          itemId: itemId,
          location: locationInfos,
          set: [] as string[],
          count: actualQuantity,
          areaId: areaId,
          remark: '', // 初始备注为空
        });
      }
    });

    // 设置数据并打开Modal
    setSelectedStorages(itemsWithLocations);
    setProcessingData(dataToProcess);
    setItemRemarks(initialRemarks); // 设置初始空备注
    setConfirmModalVisible(true);
  };

  // 处理删除库位选择
  const handleEmptyStorageChange = (
    itemId: string,
    storageId: string,
    checked: boolean
  ) => {
    setDeletedStorages((prevState) => {
      // 创建一个新的Map来更新状态
      const newMap = new Map(prevState);

      // 获取当前库位ID的集合，如果不存在则创建新的
      const storageSet = newMap.has(itemId)
        ? new Set<string>(newMap.get(itemId) as Set<string>)
        : new Set<string>();

      if (checked) {
        // 添加到空位集合
        console.log('添加库位', storageId);
        storageSet.add(storageId);
      } else {
        // 从空位集合中移除
        console.log('移除库位', storageId);
        storageSet.delete(storageId);
      }

      // 无论如何都设置新的集合
      newMap.set(itemId, storageSet);

      return newMap;
    });
  };

  // 检查库位是否被选中
  const isStorageSelected = (itemId: string, storageId: string): boolean => {
    const itemSet = deletedStorages.get(itemId);
    return !!itemSet && itemSet.has(storageId);
  };

  // 提交拣货数据
  const handleSubmit = async () => {
    // 验证所有商品是否都选择了库位
    const unselectedItems = pickingItems.filter(
      (item) =>
        !editingItems[item.id] ||
        !editingItems[item.id].selectedLocations ||
        editingItems[item.id].selectedLocations.length === 0
    );

    if (unselectedItems.length > 0) {
      // 获取未选择库位的商品名称列表
      const itemNames = unselectedItems
        .map((item) => item.productName)
        .join('、');
      message.warning(`请为所有商品选择货位，以下商品未选择货位：${itemNames}`);
      return;
    }

    // 打开确认Modal
    openConfirmModal();
  };

  // 确认提交
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      console.log('deletedStorages', deletedStorages); // 处理 processingData
      // 调用API保存拣货数据
      const result = await pickingOne(
        processingData.map((item) => {
          // 准备库位ID数组
          const emptyStorageIds: string[] = [];

          // 如果此商品有选中的需要移除的库位，将其添加到数组中
          const emptyStorages = deletedStorages.get(item.itemId);
          if (emptyStorages && emptyStorages.size > 0) {
            emptyStorages.forEach((storageId) => {
              emptyStorageIds.push(storageId);
            });
          }

          // 返回符合接口的数据格式
          return {
            itemId: item.itemId,
            location: [...item.location],
            set: emptyStorageIds, // 直接使用数组
            count: item.count || getItemActualQuantity(item.itemId), // 确保有实际数量
            areaId: item.areaId || getItemAreaId(item.itemId), // 确保有区域ID
            remark: itemRemarks[item.itemId] || '', // 使用对应商品的备注
          };
        })
      );

      if (result.code === 200) {
        message.success('拣货数据已保存');
        setConfirmModalVisible(false);
        onClose();
      } else {
        message.error(result.msg || '保存拣货数据失败');
      }
    } catch (error) {
      console.error('保存拣货数据失败:', error);
      message.error('保存拣货数据失败，请重试');
    } finally {
      setSubmitting(false);
      // 清理状态
      setDeletedStorages(new Map());
      setItemRemarks({}); // 清空备注
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Typography.Text
          ellipsis={{ tooltip: text }}
          style={{ width: 200, display: 'block' }}
        >
          {text}
        </Typography.Text>
      ),
    },
    {
      title: '商品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
    },
    {
      title: '批次号',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 120,
    },
    {
      title: '区域',
      dataIndex: 'id',
      key: 'area',
      width: 120,
      render: (itemId: string) => {
        const location = locationData[itemId];
        return location ? (
          <Tag color='blue'>{location.area?.areaName || '-'}</Tag>
        ) : locationLoading ? (
          <Spin size='small' />
        ) : (
          <Tag color='default'>-</Tag>
        );
      },
    },
    {
      title: '货位选择',
      dataIndex: 'id',
      key: 'location',
      width: 220,
      render: (itemId: string, record: PickingItemVo) => {
        const options = locationOptions[itemId];
        return locationLoading ? (
          <Spin size='small' />
        ) : options && options.length > 0 ? (
          <Cascader
            options={options}
            multiple
            showCheckedStrategy='SHOW_CHILD'
            maxTagCount='responsive'
            placeholder='请选择货架和库位'
            displayRender={(labels) => labels.join(' / ')}
            onChange={(value) => handleLocationChange(value, record)}
            style={{ width: '100%' }}
          />
        ) : (
          <span>无可用货位</span>
        );
      },
    },
    {
      title: '预期数量',
      dataIndex: 'expectedQuantity',
      key: 'expectedQuantity',
      width: 100,
    },
    {
      title: '实际数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 120,
      render: (_text: number, record: PickingItemVo) => (
        <InputNumber
          min={0}
          max={record.expectedQuantity * 2}
          defaultValue={record.expectedQuantity}
          onChange={(value) => handleQuantityChange(value, record)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => renderPickingStatus(status),
    },
  ];

  return (
    <>
      <Drawer
        title={
          <Title level={4} style={{ margin: 0 }}>
            {isAllNotPicked ? '开始拣货' : '继续拣货'} - 订单 {orderNo}
          </Title>
        }
        placement='right'
        width='80%'
        onClose={onClose}
        open={visible}
        closable={true}
        destroyOnClose={true}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type='primary'
              onClick={handleSubmit}
              loading={submitting || locationLoading}
              disabled={locationLoading}
            >
              {locationLoading ? '加载位置信息中...' : '提交'}
            </Button>
          </Space>
        }
      >
        {locationLoading ? (
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <Spin tip='正在加载拣货位置信息...' />
          </div>
        ) : (
          <Form form={form} layout='vertical'>
            <Table
              dataSource={pickingItems}
              columns={columns}
              rowKey='id'
              pagination={false}
              scroll={{ x: 'max-content', y: 'calc(100vh - 250px)' }}
            />
          </Form>
        )}
      </Drawer>

      {/* 库位确认Modal */}
      <Modal
        title='请选择需要移除的库位信息'
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          setItemRemarks({}); // 清空备注
        }}
        width={800}
        footer={[
          <Button key='back' onClick={() => {
            setConfirmModalVisible(false);
            setItemRemarks({}); // 清空备注
          }}>
            返回修改
          </Button>,
          <Button
            key='submit'
            type='primary'
            loading={submitting}
            onClick={handleConfirmSubmit}
          >
            确认提交
          </Button>,
        ]}
      >
        <div style={{ maxHeight: 'calc(80vh - 200px)', overflow: 'auto' }}>
          {Object.keys(selectedStorages).map((itemId) => {
            const item = pickingItems.find((item) => item.id === itemId);
            const actualQuantity = processingData.find(p => p.itemId === itemId)?.count || 0;
            
            return (
              <Card
                key={itemId}
                title={
                  <div>
                    <div>{`${item?.productName || '商品'} (${
                      item?.productCode || '编码'
                    })`}</div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      预期数量: {item?.expectedQuantity || 0} | 实际数量: {actualQuantity}
                    </div>
                  </div>
                }
                style={{ marginBottom: 16 }}
              >
                {selectedStorages[itemId].locationInfo.map(
                  (location, locIndex) => (
                    <div
                      key={`${itemId}-${locIndex}`}
                      style={{ marginBottom: 16 }}
                    >
                      <Typography.Text strong>
                        货架: {location.shelf.shelfName}
                      </Typography.Text>
                      <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                        {location.storages.map((storage: any) => (
                          <Col span={8} key={storage.id}>
                            <Checkbox
                              onChange={(e) =>
                                handleEmptyStorageChange(
                                  itemId,
                                  storage.id,
                                  e.target.checked
                                )
                              }
                              checked={isStorageSelected(itemId, storage.id)}
                            >
                              {storage.locationName}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )
                )}
                
                {/* 为每个商品添加备注输入框 */}
                <div style={{ marginTop: 16 }}>
                  <Typography.Text strong>商品备注：</Typography.Text>
                  <TextArea
                    rows={2}
                    placeholder='请输入该商品的拣货备注（选填）'
                    value={itemRemarks[itemId] || ''}
                    onChange={(e) => handleRemarkChange(itemId, e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </Modal>
    </>
  );
};

export default PickingOperationDrawer;

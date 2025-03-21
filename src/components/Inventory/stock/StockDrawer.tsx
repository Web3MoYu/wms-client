import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Form,
  Input,
  Button,
  Space,
  Select,
  DatePicker,
  InputNumber,
  message,
  Row,
  Col,
  Typography,
  Tag,
  AutoComplete,
} from 'antd';
import debounce from 'lodash/debounce';
import moment from 'moment';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  addStock,
  getBatchNumberByCode,
} from '../../../api/stock-service/StockController';
import { searchProducts } from '../../../api/product-service/ProductController';
import { getAllAreas } from '../../../api/location-service/AreaController';
import { getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import {
  getStoragesByShelfId,
  getStoragesByIds,
} from '../../../api/location-service/StorageController';
import { getStockByProductIdAndBatchNumber } from '../../../api/stock-service/StockController';

const { Option } = Select;
const { Text } = Typography;

interface StockDrawerProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSuccess: () => void;
}

const StockDrawer: React.FC<StockDrawerProps> = ({
  visible,
  title,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<any[]>([]);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [storagesByShelf, setStoragesByShelf] = useState<{
    [shelfId: string]: any[];
  }>({});
  const [originalStock, setOriginalStock] = useState<any>(null);
  const [additionalQuantity, setAdditionalQuantity] = useState<number>(0);
  const [hasSelectedProduct, setHasSelectedProduct] = useState<boolean>(false);
  const [availableShelves, setAvailableShelves] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setOriginalStock(null);
      setHasSelectedProduct(false);
      setBatchNumbers([]);
      setAvailableShelves(new Set());
      fetchAreas();
    }
  }, [visible, form]);

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

  const handleAreaChange = (areaId: string) => {
    form.setFieldValue('location', [{ shelfId: undefined, storageIds: [] }]);
    loadShelvesByAreaId(areaId);
  };

  const loadShelvesByAreaId = async (areaId: string) => {
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves(res.data);
        setAvailableShelves(new Set());
        
        for (const shelf of res.data) {
          checkShelfAvailability(shelf.id);
        }
      } else {
        setShelves([]);
      }
    } catch (error) {
      console.error('获取货架列表失败:', error);
      setShelves([]);
    }
  };

  const checkShelfAvailability = async (shelfId: string) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setStoragesByShelf((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));

        const hasAvailableStorage = res.data.some(
          (storage) => storage.status === 1
        );

        if (hasAvailableStorage) {
          setAvailableShelves((prev) => {
            const newSet = new Set(prev);
            newSet.add(shelfId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('检查货架可用性失败:', error);
    }
  };

  const handleShelfChange = (shelfId: string, index: number) => {
    const location = form.getFieldValue('location');
    location[index].storageIds = [];
    form.setFieldsValue({ location });
    
    loadStoragesByShelfId(shelfId);

    if (originalStock && originalStock.location) {
      const matchingLocation = originalStock.location.find(
        (loc: any) => loc.shelfId === shelfId
      );
      if (
        matchingLocation &&
        matchingLocation.storageIds &&
        matchingLocation.storageIds.length > 0
      ) {
        loadStoragesByIds(shelfId, matchingLocation.storageIds);
      }
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

  const loadStoragesByIds = async (shelfId: string, storageIds: string[]) => {
    try {
      const occupiedStoragesRes = await getStoragesByIds(storageIds);
      const allShelfStoragesRes = await getStoragesByShelfId(shelfId);

      if (
        occupiedStoragesRes.code === 200 &&
        allShelfStoragesRes.code === 200
      ) {
        const occupiedStorages = occupiedStoragesRes.data || [];
        const allShelfStorages = allShelfStoragesRes.data || [];
        const storageMap = new Map();

        allShelfStorages.forEach((storage) => {
          storageMap.set(storage.id, storage);
        });

        occupiedStorages.forEach((storage) => {
          storageMap.set(storage.id, storage);
        });

        if (originalStock && originalStock.locationVo) {
          const storageIdToNameMap = new Map<string, string>();
          
          originalStock.location.forEach((location: any, locIndex: number) => {
            if (
              originalStock.locationVo[locIndex] && 
              location.shelfId === shelfId &&
              location.storageIds && 
              originalStock.locationVo[locIndex].storageNames
            ) {
              const locationVoItem = originalStock.locationVo[locIndex];
              
              location.storageIds.forEach((storageId: string, idx: number) => {
                if (locationVoItem.storageNames[idx]) {
                  storageIdToNameMap.set(storageId, locationVoItem.storageNames[idx]);
                }
              });
            }
          });
          
          storageIdToNameMap.forEach((name, id) => {
            const storage = storageMap.get(id);
            if (storage) {
              storageMap.set(id, {
                ...storage,
                locationName: name
              });
            }
          });
        }

        const mergedStorages = Array.from(storageMap.values());

        setStoragesByShelf((prev) => ({
          ...prev,
          [shelfId]: mergedStorages,
        }));
      }
    } catch (error) {
      console.error('获取特定库位失败:', error);
    }
  };

  const handleProductSearch = useCallback(
    debounce(async (productName: string) => {
      if (!productName || productName.length < 1) {
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
    }, 500),
    []
  );

  const handleBatchNumberSearch = useCallback(
    debounce(async (batchNumber: string) => {
      if (!batchNumber || batchNumber.length < 1) {
        setBatchNumbers([]);
        return;
      }

      if (!hasSelectedProduct) {
        message.warning('请先选择产品');
        setBatchNumbers([batchNumber]);
        return;
      }

      const productCode = form.getFieldValue('productCode');

      if (!productCode) {
        message.warning('产品编码获取失败，请重新选择产品');
        setBatchNumbers([batchNumber]);
        return;
      }

      try {
        const res = await getBatchNumberByCode(productCode, batchNumber);

        if (res.code === 200 && res.data) {
          const batchList = Array.isArray(res.data)
            ? res.data
            : typeof res.data === 'string'
            ? res.data.split(',')
            : [String(res.data)];

          if (batchNumber && !batchList.includes(batchNumber)) {
            batchList.unshift(batchNumber);
          }

          setBatchNumbers(batchList);
        } else {
          setBatchNumbers([batchNumber]);
        }
      } catch (error) {
        console.error('搜索批次号失败:', error);
        setBatchNumbers([batchNumber]);
      }
    }, 500),
    [hasSelectedProduct, form]
  );

  const handleProductChange = (productId: string) => {
    form.setFieldsValue({ 
      batchNumber: undefined,
      areaId: undefined,
      location: [{ shelfId: undefined, storageIds: [] }],
      quantity: 0,
      availableQuantity: 0,
      alertStatus: 0,
    });
    
    setBatchNumbers([]);
    setOriginalStock(null);
    setAdditionalQuantity(0);
    setShelves([]);
    setStoragesByShelf({});
    setAvailableShelves(new Set());

    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setFieldsValue({ productCode: product.productCode });
      setHasSelectedProduct(true);
    } else {
      form.setFieldsValue({ productCode: '' });
      setHasSelectedProduct(false);
    }
  };

  const handleBatchNumberChange = async (batchNumber: string) => {
    if (!batchNumber) {
      return;
    }

    if (!hasSelectedProduct) {
      message.warning('请先选择产品');
      return;
    }

    const productId = form.getFieldValue('productId');

    if (!productId) {
      message.warning('产品ID获取失败，请重新选择产品');
      return;
    }

    const { data: existingStock } = await getStockByProductIdAndBatchNumber(
      productId,
      batchNumber
    );

    setOriginalStock(existingStock);

    if (existingStock) {
      message.info(`已存在该商品的批次库存，将在原有基础上增加库存`);

      const enhancedLocation = existingStock.location.map((loc, index) => {
        if (existingStock.locationVo && existingStock.locationVo[index]) {
          return {
            ...loc,
            shelfDisplayName: existingStock.locationVo[index].shelfName,
            storageDisplayNames: loc.storageIds.reduce<Record<string, string>>((acc, id, idx) => {
              if (existingStock.locationVo[index].storageNames[idx]) {
                acc[id] = existingStock.locationVo[index].storageNames[idx];
              }
              return acc;
            }, {})
          };
        }
        return loc;
      });

      form.setFieldsValue({
        id: existingStock.id,
        productCode: existingStock.productCode,
        alertStatus: existingStock.alertStatus,
        quantity: existingStock.quantity,
        availableQuantity: existingStock.availableQuantity,
        productionDate: existingStock.productionDate
          ? moment(existingStock.productionDate)
          : null,
        areaId: existingStock.areaId,
        location: enhancedLocation,
      });

      setAdditionalQuantity(0);

      if (existingStock.areaId) {
        await loadShelvesByAreaId(existingStock.areaId);
        setStoragesByShelf({});

        if (existingStock.location && existingStock.location.length > 0) {
          const loadPromises = existingStock.location.map(
            async (location: any) => {
              if (
                location.shelfId &&
                location.storageIds &&
                location.storageIds.length > 0
              ) {
                await loadStoragesByIds(location.shelfId, location.storageIds);
              }
            }
          );

          await Promise.all(loadPromises);
        }
      }
    } else {
      setOriginalStock(null);
      form.setFieldsValue({ batchNumber });
    }
  };

  const debouncedHandleBatchNumberChange = useCallback(
    debounce(handleBatchNumberChange, 500),
    [hasSelectedProduct]
  );

  const handleAdditionalQuantityChange = (value: number | null) => {
    if (value === null) return;
    setAdditionalQuantity(value);

    if (originalStock) {
      const originalQuantity = originalStock.quantity;
      const originalAvailable = originalStock.availableQuantity;

      form.setFieldsValue({
        quantity: originalQuantity + value,
        availableQuantity: originalAvailable + value,
      });
    }
  };

  const handleQuantityChange = (value: number | null) => {
    if (value === null) return;

    form.setFieldsValue({ availableQuantity: value });

    if (originalStock) {
      const originalQuantity = originalStock.quantity;
      const originalAvailable = originalStock.availableQuantity;

      const quantityDiff = value - originalQuantity;

      if (quantityDiff >= 0) {
        form.setFieldsValue({
          availableQuantity: originalAvailable + quantityDiff,
        });
      }
    }
  };

  const getAllSelectedShelfIds = (currentLocationIndex: number) => {
    const location = form.getFieldValue('location');
    if (!location) return new Set<string>();

    const selectedIds = new Set<string>();

    location.forEach((loc: any, locIndex: number) => {
      if (locIndex === currentLocationIndex) return;
      if (!loc || !loc.shelfId) return;
      selectedIds.add(loc.shelfId);
    });

    return selectedIds;
  };

  const handleStorageChange = (selectedIds: string[], index: number) => {
    const location = form.getFieldValue('location');
    location[index].storageIds = selectedIds;
    form.setFieldsValue({ location });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.batchNumber) {
        message.error('请选择或输入批次号');
        return;
      }

      if (
        originalStock &&
        (additionalQuantity === 0 || additionalQuantity === null)
      ) {
        message.error('请输入新增数量');
        return;
      }

      if (values.productionDate) {
        values.productionDate = values.productionDate.format('YYYY-MM-DD');
      }

      if (originalStock) {
        values.quantity = originalStock.quantity + additionalQuantity;
        values.availableQuantity = originalStock.availableQuantity + additionalQuantity;
      }

      const result = await addStock({
        ...values,
        productId: values.productId,
      });

      if (result.code === 200) {
        message.success('操作成功');
        onSuccess();
        onClose();
      } else {
        message.error(result.msg || '操作失败');
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Drawer
      title={title}
      width={720}
      onClose={onClose}
      open={visible}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} type="primary">
            提交
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          alertStatus: 0,
          productionDate: moment(),
          quantity: 0,
          availableQuantity: 0,
          location: [{ shelfId: undefined, storageIds: [] }],
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productId"
              label="产品"
              rules={[{ required: true, message: '请选择产品' }]}
            >
              <Select
                showSearch
                placeholder="请输入产品名称搜索"
                optionFilterProp="children"
                onChange={handleProductChange}
                onSearch={handleProductSearch}
                filterOption={false}
              >
                {products.map((product) => (
                  <Option key={product.id} value={product.id}>
                    {product.productName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="productCode" label="产品编码">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="batchNumber"
              label="批次号"
              rules={[{ required: true, message: '请输入或选择批次号' }]}
              extra="请先选择产品后再选择或输入批次号，不存在的批次号将作为新批次号使用"
            >
              <AutoComplete
                placeholder="请输入批次号"
                options={batchNumbers.map((batch) => ({ value: batch }))}
                onSearch={handleBatchNumberSearch}
                onChange={(value) => {
                  if (value) {
                    debouncedHandleBatchNumberChange(value);
                  }
                }}
                allowClear
                backfill
                style={{ width: '100%' }}
                disabled={!hasSelectedProduct}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productionDate"
              label="生产日期"
              rules={[{ required: true, message: '请选择生产日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                locale={locale}
                format="YYYY-MM-DD"
                placeholder="请选择生产日期"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="总数量"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                onChange={handleQuantityChange}
                disabled={!!originalStock}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="availableQuantity" label="可用数量">
              <InputNumber min={0} style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
        </Row>

        {originalStock && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="additionalQuantity"
                label="新增数量"
                rules={[{ required: true, message: '请输入新增数量' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  value={additionalQuantity}
                  onChange={handleAdditionalQuantityChange}
                />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="areaId"
              label="区域"
              rules={[{ required: true, message: '请选择区域' }]}
            >
              <Select
                placeholder="请选择区域"
                onChange={handleAreaChange}
                disabled={!!originalStock}
              >
                {areas.map((area) => (
                  <Option key={area.id} value={area.id}>
                    {area.areaName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="alertStatus" label="预警状态">
              <Select disabled={!!originalStock}>
                <Option value={0}>正常</Option>
                <Option value={1}>低于最小库存</Option>
                <Option value={2}>超过最大库存</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 24 }}>
          位置信息
        </Typography.Title>
        {!form.getFieldValue('areaId') && !originalStock && (
          <div
            style={{
              marginBottom: 16,
              padding: 8,
              backgroundColor: '#f0f2f5',
              borderRadius: 4,
            }}
          >
            <Text type="secondary">
              请先选择区域，然后才能添加货架和库位信息
            </Text>
          </div>
        )}
        <Form.List name="location">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
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
                        label="货架"
                        rules={[{ required: true, message: '请选择货架' }]}
                      >
                        <Select
                          placeholder="请选择货架"
                          onChange={(value) => handleShelfChange(value, index)}
                          disabled={!form.getFieldValue('areaId')}
                        >
                          {shelves.map((shelf) => {
                            const isAvailable = availableShelves.has(shelf.id);
                            const selectedShelfIds = getAllSelectedShelfIds(index);
                            const isUsed = selectedShelfIds.has(shelf.id);

                            if (isAvailable && !isUsed) {
                              let displayName = shelf.shelfName;
                              if (originalStock && originalStock.locationVo) {
                                const matchingLocation = originalStock.location?.find(
                                  (loc: any) => loc.shelfId === shelf.id
                                );
                                if (matchingLocation && matchingLocation.shelfDisplayName) {
                                  displayName = matchingLocation.shelfDisplayName;
                                }
                              }
                              
                              return (
                                <Option key={shelf.id} value={shelf.id}>
                                  {displayName}
                                </Option>
                              );
                            }
                            return null;
                          })}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'storageIds']}
                        label="库位"
                        rules={[
                          { required: true, message: '请选择至少一个库位' },
                        ]}
                      >
                        <Select
                          mode="multiple"
                          disabled={
                            !form.getFieldValue(['location', index, 'shelfId'])
                          }
                          style={{ width: '100%' }}
                          onChange={(value) => {
                            handleStorageChange(value, index);
                          }}
                          tagRender={(props) => {
                            const shelfId = form.getFieldValue([
                              'location',
                              index,
                              'shelfId',
                            ]);
                            const locationItem = form.getFieldValue([
                              'location',
                              index,
                            ]);
                            
                            if (locationItem && locationItem.storageDisplayNames && 
                                locationItem.storageDisplayNames[props.value]) {
                              return (
                                <Tag
                                  closable={props.closable}
                                  onClose={props.onClose}
                                  style={{ marginRight: 3 }}
                                >
                                  {locationItem.storageDisplayNames[props.value]}
                                </Tag>
                              );
                            }
                            
                            const storage = storagesByShelf[shelfId]?.find(
                              (s) => s.id === props.value
                            );
                            const displayName = storage
                              ? storage.locationName
                              : props.value;

                            return (
                              <Tag
                                closable={props.closable}
                                onClose={props.onClose}
                                style={{ marginRight: 3 }}
                              >
                                {displayName}
                              </Tag>
                            );
                          }}
                        >
                          {form.getFieldValue(['location', index, 'shelfId']) &&
                          storagesByShelf[
                            form.getFieldValue(['location', index, 'shelfId'])
                          ]
                            ? storagesByShelf[
                                form.getFieldValue([
                                  'location',
                                  index,
                                  'shelfId',
                                ])
                              ].map((storage) => {
                                const shelfId = form.getFieldValue([
                                  'location',
                                  index,
                                  'shelfId',
                                ]);
                                const isOccupiedByOriginal =
                                  originalStock &&
                                  originalStock.location &&
                                  originalStock.location.some(
                                    (loc: any) =>
                                      loc.shelfId === shelfId &&
                                      loc.storageIds &&
                                      loc.storageIds.includes(storage.id)
                                  );

                                const displayName =
                                  storage.locationName || storage.id;

                                return (
                                  <Option
                                    key={storage.id}
                                    value={storage.id}
                                    label={displayName}
                                    title={`ID: ${
                                      storage.id
                                    }, 名称: ${displayName}${
                                      isOccupiedByOriginal ? ' (已占用)' : ''
                                    }`}
                                  >
                                    {displayName}
                                  </Option>
                                );
                              })
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
                      {fields.length > 1 ? (
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      ) : null}
                    </Col>
                  </Row>
                </div>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={!form.getFieldValue('areaId')}
                >
                  添加位置
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
};

export default StockDrawer;

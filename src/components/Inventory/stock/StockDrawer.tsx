import React, { useState, useEffect } from 'react';
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
import { addStock } from '../../../api/stock-service/StockController';
import { searchProducts } from '../../../api/product-service/ProductController';
import { getAllAreas } from '../../../api/location-service/AreaController';
import { getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import { getStoragesByShelfId, getStoragesByIds } from '../../../api/location-service/StorageController';
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
  const [storagesByShelf, setStoragesByShelf] = useState<{[shelfId: string]: any[]}>({});
  const [originalStock, setOriginalStock] = useState<any>(null);
  const [additionalQuantity, setAdditionalQuantity] = useState<number>(0);

  // 初始化表单
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setOriginalStock(null);
      fetchAreas();
    }
  }, [visible, form]);

  // 获取全部区域
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

  // 区域变更
  const handleAreaChange = (areaId: string) => {
    // 清空货架和库位
    form.setFieldValue('location', [{ shelfId: undefined, storageIds: [] }]);

    // 加载该区域下的货架
    loadShelvesByAreaId(areaId);
  };

  // 加载货架
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

  // 货架变更
  const handleShelfChange = (shelfId: string, index: number) => {
    // 清空所选库位
    const location = form.getFieldValue('location');
    location[index].storageIds = [];
    form.setFieldsValue({ location });
    
    // 加载该货架下的库位
    loadStoragesByShelfId(shelfId);

    // 如果存在原始库存的货架数据，尝试加载对应的库位
    if (originalStock && originalStock.location) {
      const matchingLocation = originalStock.location.find((loc: any) => loc.shelfId === shelfId);
      if (matchingLocation && matchingLocation.storageIds && matchingLocation.storageIds.length > 0) {
        // 使用loadStoragesByIds加载库位信息
        loadStoragesByIds(shelfId, matchingLocation.storageIds);
      }
    }
  };

  // 加载库位
  const loadStoragesByShelfId = async (shelfId: string) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        // 更新Map中对应货架的库位信息
        setStoragesByShelf(prev => ({
          ...prev,
          [shelfId]: res.data
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  // 加载特定库位
  const loadStoragesByIds = async (shelfId: string, storageIds: string[]) => {
    try {
      // 获取已占用的库位信息
      const occupiedStoragesRes = await getStoragesByIds(storageIds);
      // 获取该货架下的所有库位
      const allShelfStoragesRes = await getStoragesByShelfId(shelfId);
      
      if (occupiedStoragesRes.code === 200 && allShelfStoragesRes.code === 200) {
        // 获取已占用库位和该货架下的所有库位
        const occupiedStorages = occupiedStoragesRes.data || [];
        const allShelfStorages = allShelfStoragesRes.data || [];
        
        // 创建一个Map来存储所有库位信息，确保ID到名称的映射是正确的
        const storageMap = new Map();
        
        // 先添加所有货架下的库位
        allShelfStorages.forEach(storage => {
          storageMap.set(storage.id, storage);
        });
        
        // 然后添加或更新已占用的库位信息（以确保已占用库位的信息是最新的）
        occupiedStorages.forEach(storage => {
          storageMap.set(storage.id, storage);
        });
        
        // 将Map转换回数组
        const mergedStorages = Array.from(storageMap.values());
        
        // 记录库位信息
        if (occupiedStorages.length > 0) {
          console.log('已占用的库位:', occupiedStorages.map(s => `${s.id}:${s.locationName}`).join(', '));
        } else {
          console.log(`警告: 未找到已占用的库位，storageIds: ${storageIds.join(',')}`);
        }
        
        // 将库位数据设置到表单中，更新Map中对应货架的库位信息
        setStoragesByShelf(prev => ({
          ...prev,
          [shelfId]: mergedStorages
        }));
      }
    } catch (error) {
      console.error('获取特定库位失败:', error);
    }
  };

  // 产品搜索（防抖）
  const handleProductSearch = debounce(async (productName: string) => {
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
  }, 500);

  // 批次号搜索（防抖）
  // 注意：批次号只能选择或输入一个
  const handleBatchNumberSearch = debounce(async (batchNumber: string) => {
    if (!batchNumber || batchNumber.length < 1) {
      setBatchNumbers([]);
      return;
    }

    try {
      // 这里使用查询批次号的API
      const res = await import(
        '../../../api/stock-service/StockController'
      ).then((module) => module.getBatchNumber(batchNumber));

      if (res.code === 200 && res.data) {
        const batchList = Array.isArray(res.data)
          ? res.data
          : typeof res.data === 'string'
          ? res.data.split(',')
          : [String(res.data)];

        // 确保当前输入的批次号也在列表中
        if (batchNumber && !batchList.includes(batchNumber)) {
          batchList.unshift(batchNumber);
        }

        setBatchNumbers(batchList);
      } else {
        // 如果没有找到匹配的批次号，仍然允许用户使用当前输入的值
        setBatchNumbers([batchNumber]);
      }
    } catch (error) {
      console.error('搜索批次号失败:', error);
      // 出错时也允许用户使用当前输入的值
      setBatchNumbers([batchNumber]);
    }
  }, 500);

  // 商品选择变更
  const handleProductChange = (productId: string) => {
    // 清空批次号
    form.setFieldsValue({ batchNumber: undefined });

    // 获取选中的产品信息
    const product = products.find((p) => p.id === productId);
    if (product) {
      form.setFieldsValue({ productCode: product.productCode });
    } else {
      form.setFieldsValue({ productCode: '' });
    }
  };

  // 批次号变更
  const handleBatchNumberChange = async (batchNumber: string) => {
    if (!batchNumber || !form.getFieldValue('productId')) {
      return;
    }

    // 查询该批次是否已存在库存
    const productId = form.getFieldValue('productId');
    const { data: existingStock } = await getStockByProductIdAndBatchNumber(
      productId,
      batchNumber
    );

    setOriginalStock(existingStock);

    if (existingStock) {
      // 提示用户已存在该库存
      message.info(`已存在该商品的批次库存，将在原有基础上增加库存`);

      // 自动填充数量信息和位置信息
      form.setFieldsValue({
        id: existingStock.id,
        productCode: existingStock.productCode,
        alertStatus: existingStock.alertStatus,
        quantity: existingStock.quantity,
        availableQuantity: existingStock.availableQuantity,
        productionDate: existingStock.productionDate
          ? moment(existingStock.productionDate)
          : null,
        // 保留原有位置信息，允许用户修改
        areaId: existingStock.areaId,
        location: existingStock.location,
      });
      
      // 重置新增数量
      setAdditionalQuantity(0);

      // 如果位置信息有区域，加载对应的货架
      if (existingStock.areaId) {
        await loadShelvesByAreaId(existingStock.areaId);
        
        // 清空货架库位映射，准备重新加载
        setStoragesByShelf({});
        
        // 加载原有的位置信息
        if (existingStock.location && existingStock.location.length > 0) {
          // 收集所有已占用的库位ID
          const allOccupiedStorageIds: string[] = [];
          
          // 为每个位置加载对应的库位
          const loadPromises = existingStock.location.map(async (location: any) => {
            if (location.shelfId && location.storageIds && location.storageIds.length > 0) {
              // 收集该位置的库位ID
              allOccupiedStorageIds.push(...location.storageIds);
              
              // 加载货架对应的库位（包括已占用库位和可用库位）
              await loadStoragesByIds(location.shelfId, location.storageIds);
            }
          });
          
          // 等待所有加载完成
          await Promise.all(loadPromises);
          
          console.log('该批次商品已占用的所有库位ID:', allOccupiedStorageIds.join(', '));
        }
      }

      // 如果存在 locationVo，确保显示位置信息的名称而不是ID
      if (existingStock.locationVo && existingStock.locationVo.length > 0) {
        console.log('位置信息：', existingStock.locationVo);
        
        // 使用locationVo显示货架和库位的名称
        existingStock.locationVo.forEach((location, index) => {
          console.log(`位置${index+1}: ${location.shelfName}, 库位: ${location.storageNames.join(', ')}`);
        });
      }
    } else {
      // 清除原始库存，表示这是一个新的批次号
      setOriginalStock(null);
      message.info(`您输入的是新批次号：${batchNumber}，将创建新的库存记录`);

      // 确保批次号值被正确设置
      form.setFieldsValue({ batchNumber });
    }
  };

  // 处理新增数量变更
  const handleAdditionalQuantityChange = (value: number | null) => {
    if (value === null) return;
    setAdditionalQuantity(value);
    
    // 如果存在原始库存，需要计算并更新数量和可用数量
    if (originalStock) {
      const originalQuantity = originalStock.quantity;
      const originalAvailable = originalStock.availableQuantity;
      
      // 更新表单中的数量和可用数量
      form.setFieldsValue({ 
        quantity: originalQuantity + value,
        availableQuantity: originalAvailable + value
      });
    }
  };

  // 数量变化
  const handleQuantityChange = (value: number | null) => {
    if (value === null) return;
    
    // 设置可用数量跟随总数量变化
    form.setFieldsValue({ availableQuantity: value });
    
    // 如果存在原始库存，需要计算与原数量的差值
    if (originalStock) {
      const originalQuantity = originalStock.quantity;
      const originalAvailable = originalStock.availableQuantity;
      
      const quantityDiff = value - originalQuantity;
      
      if (quantityDiff >= 0) {
        form.setFieldsValue({ availableQuantity: originalAvailable + quantityDiff });
      }
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证是否选择了批次号
      if (!values.batchNumber) {
        message.error('请选择或输入批次号');
        return;
      }

      // 如果存在原有库存，验证新增数量
      if (originalStock && (additionalQuantity === 0 || additionalQuantity === null)) {
        message.error('请输入新增数量');
        return;
      }

      // 处理生产日期格式
      if (values.productionDate) {
        values.productionDate = values.productionDate.format('YYYY-MM-DD');
      }

      // 根据是否存在原有库存，计算总数量和可用数量
      if (originalStock) {
        values.quantity = originalStock.quantity + additionalQuantity;
        values.availableQuantity = originalStock.availableQuantity + additionalQuantity;
      }

      // 提交表单
      const result = await addStock({
        ...values,
        productId: values.productId
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
          <Button onClick={handleSubmit} type='primary' loading={false}>
            提交
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout='vertical'
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
              name='productId'
              label='产品'
              rules={[{ required: true, message: '请选择产品' }]}
            >
              <Select
                showSearch
                placeholder='请输入产品名称搜索'
                optionFilterProp='children'
                filterOption={false}
                onSearch={handleProductSearch}
                onChange={handleProductChange}
                labelInValue={false}
                optionLabelProp='label'
                tagRender={(props) => {
                  const product = products.find((p) => p.id === props.value);
                  return (
                    <Tag
                      closable={props.closable}
                      onClose={props.onClose}
                      style={{ marginRight: 3 }}
                    >
                      {product?.productName || props.value}
                    </Tag>
                  );
                }}
              >
                {products.map((product) => (
                  <Option
                    key={product.id}
                    value={product.id}
                    label={product.productName}
                  >
                    {product.productName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name='productCode' label='产品编码'>
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='batchNumber'
              label='批次号'
              rules={[{ required: true, message: '请输入或选择批次号' }]}
              extra='批次号只能选择或输入一个，不存在的批次号将作为新批次号使用'
            >
              <AutoComplete
                placeholder='请输入批次号'
                options={batchNumbers.map((batch) => ({ value: batch }))}
                onSearch={handleBatchNumberSearch}
                onChange={(value) => {
                  if (value) {
                    handleBatchNumberChange(value);
                  }
                }}
                allowClear
                backfill
                autoFocus={false}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name='productionDate'
              label='生产日期'
              rules={[{ required: true, message: '请选择生产日期' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                locale={locale}
                format='YYYY-MM-DD'
                placeholder='请选择生产日期'
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
            <Form.Item
              name="availableQuantity"
              label="可用数量"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 存在原库存时显示新增数量 */}
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
            <Form.Item
              name="alertStatus"
              label="预警状态"
            >
              <Select disabled={!!originalStock}>
                <Option value={0}>正常</Option>
                <Option value={1}>低于最小库存</Option>
                <Option value={2}>超过最大库存</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* 位置信息 */}
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
            <Text type='secondary'>
              请先选择区域，然后才能添加货架和库位信息
            </Text>
          </div>
        )}
        <Form.List name='location'>
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
                        label='货架'
                        rules={[{ required: true, message: '请选择货架' }]}
                      >
                        <Select
                          placeholder='请选择货架'
                          onChange={(value) => handleShelfChange(value, index)}
                          disabled={!form.getFieldValue('areaId')}
                        >
                          {shelves.map((shelf) => (
                            <Option key={shelf.id} value={shelf.id}>
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
                        rules={[{ required: true, message: '请选择至少一个库位' }]}
                      >
                        <Select
                          mode="multiple"
                          disabled={!form.getFieldValue(['location', index, 'shelfId'])}
                          style={{ width: '100%' }}
                          onChange={(value) => {
                            const location = form.getFieldValue('location');
                            location[index].storageIds = value;
                            form.setFieldsValue({ location });
                          }}
                          tagRender={(props) => {
                            const shelfId = form.getFieldValue(['location', index, 'shelfId']);
                            // 从对应货架的库位中查找名称
                            const storage = storagesByShelf[shelfId]?.find(s => s.id === props.value);
                            const displayName = storage ? storage.locationName : props.value;
                            
                            console.log(`渲染库位标签: 货架=${shelfId}, ID=${props.value}, 名称=${displayName}`);
                            
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
                          {(form.getFieldValue(['location', index, 'shelfId']) && 
                            storagesByShelf[form.getFieldValue(['location', index, 'shelfId'])]) ? 
                            storagesByShelf[form.getFieldValue(['location', index, 'shelfId'])].map((storage) => {
                              const shelfId = form.getFieldValue(['location', index, 'shelfId']);
                              // 检查是否为已占用库位
                              const isOccupied = originalStock && 
                                originalStock.location && 
                                originalStock.location.some((loc: any) => 
                                  loc.shelfId === shelfId && 
                                  loc.storageIds && 
                                  loc.storageIds.includes(storage.id)
                                );
                              
                              // 确保选项显示的是库位名称
                              const displayName = storage.locationName || storage.id;
                              console.log(`渲染库位选项: 货架=${shelfId}, ID=${storage.id}, 名称=${displayName}, 是否占用=${isOccupied}`);
                              
                              return (
                                <Option
                                  key={storage.id}
                                  value={storage.id}
                                  label={displayName}
                                  title={`ID: ${storage.id}, 名称: ${displayName}${isOccupied ? ' (已占用)' : ''}`}
                                >
                                  {isOccupied ? `${displayName} (已占用)` : displayName}
                                </Option>
                              );
                            }) : []
                          }
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
                  type='dashed'
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

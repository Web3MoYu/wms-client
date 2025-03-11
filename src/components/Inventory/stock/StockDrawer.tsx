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
import { Stock, addStock, StockVo } from '../../../api/stock-service/StockController';
import { searchProducts } from '../../../api/product-service/ProductController';
import { getAllAreas } from '../../../api/location-service/AreaController';
import { getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import { getStoragesByShelfId } from '../../../api/location-service/StorageController';
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
  const [submitting, setSubmitting] = useState(false);

  // 状态
  const [areas, setAreas] = useState<any[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [batchNumbers, setBatchNumbers] = useState<string[]>([]);
  const [availableStorages, setAvailableStorages] = useState<{
    [key: string]: any[];
  }>({});
  const [originalStock, setOriginalStock] = useState<Stock | null>(null);

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
  };

  // 加载库位
  const loadStoragesByShelfId = async (shelfId: string) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setAvailableStorages((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));
      }
    } catch (error) {
      console.error('获取库位列表失败:', error);
    }
  };

  // 加载特定库位
  const loadStoragesByIds = async (shelfId: string, storageIds: string[]) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        // 找出匹配的库位并记录
        const matchedStorages = res.data.filter(storage => 
          storageIds.includes(storage.id)
        );
        
        if (matchedStorages.length > 0) {
          console.log('匹配到的库位:', matchedStorages.map(s => `${s.id}:${s.locationName}`).join(', '));
        } else {
          console.log(`警告: 未找到匹配的库位，shelfId: ${shelfId}, storageIds: ${storageIds.join(',')}`);
        }
        
        // 确保库位数据在表单中正确显示
        setAvailableStorages(prev => ({
          ...prev,
          [shelfId]: res.data
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
  // 注意：批次号只能选择或输入一个
  const handleBatchNumberChange = async (batchNumber: string) => {
    const productId = form.getFieldValue('productId');
    if (!productId || !batchNumber) return;

    try {
      const res = await getStockByProductIdAndBatchNumber(
        productId,
        batchNumber
      );
      if (res.code === 200 && res.data) {
        const existingStock = res.data;
        setOriginalStock(existingStock);

        // 提示用户已存在该库存
        message.info(`已存在该商品的批次库存，将在原有基础上增加库存`);

        // 自动填充已有的库存信息
        form.setFieldsValue({
          id: existingStock.id,
          areaId: existingStock.areaId,
          productCode: existingStock.productCode,
          alertStatus: existingStock.alertStatus,
          productionDate: existingStock.productionDate
            ? moment(existingStock.productionDate)
            : null,
          location: existingStock.location,
          lockedQuantity: existingStock.lockedQuantity,
        });

        // 加载区域对应的货架
        if (existingStock.areaId) {
          loadShelvesByAreaId(existingStock.areaId);
        }

        // 加载库位信息
        for (const location of existingStock.location) {
          if (
            location.shelfId &&
            location.storageIds &&
            location.storageIds.length > 0
          ) {
            // 使用 loadStoragesByIds 加载库位信息
            await loadStoragesByIds(location.shelfId, location.storageIds);
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
    } catch (error) {
      console.error('获取库存信息失败:', error);
      // 清除原始库存，表示这是一个新的批次号
      setOriginalStock(null);
      message.info(`您输入的是新批次号：${batchNumber}，将创建新的库存记录`);

      // 确保批次号值被正确设置
      form.setFieldsValue({ batchNumber });
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
        form.setFieldsValue({
          availableQuantity: originalAvailable + quantityDiff,
        });
      }
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 验证批次号是否为单个值
      if (!values.batchNumber) {
        message.error('请选择或输入批次号');
        setSubmitting(false);
        return;
      }

      // 格式化日期
      if (values.productionDate) {
        values.productionDate = values.productionDate.format('YYYY-MM-DD');
      }

      // 如果存在原始库存，则累加数量
      if (originalStock && originalStock.id) {
        values.id = originalStock.id;

        // 计算新的数量和可用数量
        const newQuantity =
          Number(originalStock.quantity) + Number(values.quantity);
        const newAvailableQuantity =
          Number(originalStock.availableQuantity) +
          Number(values.availableQuantity);

        values.quantity = newQuantity;
        values.availableQuantity = newAvailableQuantity;

        // 更新库存
        const res = await addStock(values);
        if (res.code === 200) {
          message.success('更新库存成功');
          onSuccess();
        } else {
          message.error(res.msg || '更新库存失败');
        }
      } else {
        // 新增库存
        const res = await addStock(values);
        if (res.code === 200) {
          message.success('新增库存成功');
          onSuccess();
        } else {
          message.error(res.msg || '新增库存失败');
        }
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error(`表单验证失败: ${error.errorFields[0]?.errors[0]}`);
      } else {
        message.error('提交失败，请检查表单');
      }
      console.error('提交表单出错:', error);
    } finally {
      setSubmitting(false);
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
          <Button onClick={handleSubmit} type='primary' loading={submitting}>
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
          <Col span={8}>
            <Form.Item
              name='quantity'
              label='数量'
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={0}
                disabled={!!originalStock}
                onChange={handleQuantityChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name='availableQuantity'
              label='可用数量'
              rules={[{ required: true, message: '请输入可用数量' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={0}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name='lockedQuantity' label='锁定数量'>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={0}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        {originalStock && (
          <Row gutter={16}>
            <Col span={24}>
              <div
                style={{
                  background: '#f0f2f5',
                  padding: '10px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              >
                <Text strong>原有库存信息：</Text>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <div>数量: {originalStock.quantity}</div>
                  <div>可用数量: {originalStock.availableQuantity}</div>
                  <div>锁定数量: {originalStock.lockedQuantity}</div>
                </Space>
              </div>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name='areaId'
              label='区域'
              rules={[{ required: true, message: '请选择区域' }]}
            >
              <Select
                placeholder='请选择区域'
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
            <Form.Item name='alertStatus' label='预警状态'>
              <Select>
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
                          disabled={
                            !form.getFieldValue('areaId') || !!originalStock
                          }
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
                        rules={[
                          { required: true, message: '请选择至少一个库位' },
                        ]}
                      >
                        <Select
                          mode='multiple'
                          placeholder='请选择库位'
                          disabled={
                            !form.getFieldValue([
                              'location',
                              index,
                              'shelfId',
                            ]) || !!originalStock
                          }
                          labelInValue={false}
                          optionLabelProp='label'
                          tagRender={(props) => {
                            const shelfId = form.getFieldValue([
                              'location',
                              index,
                              'shelfId',
                            ]);
                            // 尝试从availableStorages中查找库位信息
                            const storage = availableStorages[shelfId]?.find(
                              (s) => s.id === props.value
                            );
                            
                            // 如果找到库位信息，显示名称；否则从原始库存中查找
                            let displayName = storage?.locationName;
                            
                            // 如果在availableStorages中没找到，并且存在原始库存
                            if (!displayName && originalStock) {
                              // 尝试从原始库存的locationVo中查找
                              const stockWithLocation = originalStock as unknown as StockVo;
                              if (stockWithLocation.locationVo) {
                                for (const loc of stockWithLocation.locationVo) {
                                  // 检查该库位ID是否在库位名称数组中的相同位置
                                  const storageIndex = originalStock.location.findIndex(
                                    l => l.shelfId === shelfId && l.storageIds.includes(props.value)
                                  );
                                  
                                  if (storageIndex >= 0 && loc.storageNames[storageIndex]) {
                                    displayName = loc.storageNames[storageIndex];
                                    break;
                                  }
                                }
                              }
                            }
                            
                            return (
                              <Tag
                                closable={props.closable}
                                onClose={props.onClose}
                                style={{ marginRight: 3 }}
                              >
                                {displayName || props.value}
                              </Tag>
                            );
                          }}
                        >
                          {availableStorages[
                            form.getFieldValue(['location', index, 'shelfId'])
                          ]?.map((storage) => (
                            <Option
                              key={storage.id}
                              value={storage.id}
                              label={storage.locationName}
                              title={`ID: ${storage.id}, 名称: ${storage.locationName}`}
                            >
                              {storage.locationName}
                            </Option>
                          ))}
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
                  disabled={!!originalStock || !form.getFieldValue('areaId')}
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

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Form,
  Button,
  Space,
  Input,
  Select,
  Typography,
  message,
  Tag,
  Row,
  Col,
  Divider,
  Card,
  List,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { StockVo } from '../../../api/stock-service/StockController';
import { Area, getAllAreas } from '../../../api/location-service/AreaController';
import { getShelfListByAreaId } from '../../../api/location-service/ShelfController';
import { getStoragesByShelfId } from '../../../api/location-service/StorageController';
import { addMovement } from '../../../api/stock-service/MoveController';
import StockSelectDrawer from './StockSelectDrawer';

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

interface MoveAddDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MoveAddDrawer: React.FC<MoveAddDrawerProps> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [areas, setAreas] = useState<Area[]>([]);
  const [shelves, setShelves] = useState<any[]>([]);
  const [storagesByShelf, setStoragesByShelf] = useState<{
    [shelfId: string]: any[];
  }>({});
  const [availableShelves, setAvailableShelves] = useState<Set<string>>(
    new Set()
  );
  const [selectedStock, setSelectedStock] = useState<StockVo | null>(null);
  const [stockSelectVisible, setStockSelectVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 在抽屉打开时初始化
  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedStock(null);
      fetchAreas();
    }
  }, [visible, form]);

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

  // 处理区域变更
  const handleAreaChange = (areaId: string) => {
    form.setFieldValue('locations', [{ shelfId: undefined, storageIds: [] }]);
    loadShelvesByAreaId(areaId);
  };

  // 根据区域ID加载货架
  const loadShelvesByAreaId = async (areaId: string) => {
    try {
      const res = await getShelfListByAreaId(areaId);
      if (res.code === 200) {
        setShelves(res.data);
        setAvailableShelves(new Set());
        
        // 检查每个货架的可用性
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

  // 检查货架可用性
  const checkShelfAvailability = async (shelfId: string) => {
    try {
      const res = await getStoragesByShelfId(shelfId);
      if (res.code === 200) {
        setStoragesByShelf((prev) => ({
          ...prev,
          [shelfId]: res.data,
        }));

        // 检查是否有可用库位
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

  // 处理货架变更
  const handleShelfChange = (shelfId: string, index: number) => {
    const locations = form.getFieldValue('locations');
    locations[index].storageIds = [];
    form.setFieldsValue({ locations });
    loadStoragesByShelfId(shelfId);
  };

  // 根据货架ID加载库位
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

  // 获取所有已选择的货架ID
  const getAllSelectedShelfIds = (currentLocationIndex: number) => {
    const locations = form.getFieldValue('locations');
    if (!locations) return new Set<string>();

    const selectedIds = new Set<string>();

    locations.forEach((loc: any, locIndex: number) => {
      if (locIndex === currentLocationIndex) return;
      if (!loc || !loc.shelfId) return;
      selectedIds.add(loc.shelfId);
    });

    return selectedIds;
  };

  // 处理库位变更
  const handleStorageChange = (selectedIds: string[], index: number) => {
    const locations = form.getFieldValue('locations');
    locations[index].storageIds = selectedIds;
    form.setFieldsValue({ locations });
  };

  // 打开库存选择抽屉
  const handleOpenStockSelect = () => {
    setStockSelectVisible(true);
  };

  // 选择库存
  const handleStockSelect = (stock: StockVo) => {
    setSelectedStock(stock);
    form.setFieldsValue({
      stockId: stock.id,
    });
  };

  // 渲染已选库存信息
  const renderSelectedStockInfo = () => {
    if (!selectedStock) return null;

    return (
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>已选择库存</Title>
        <Row gutter={[16, 8]}>
          <Col span={8}>
            <Text strong>商品名称：</Text> {selectedStock.productName}
          </Col>
          <Col span={8}>
            <Text strong>批次号：</Text> {selectedStock.batchNumber}
          </Col>
          <Col span={8}>
            <Text strong>可用数量：</Text> {selectedStock.availableQuantity}
          </Col>
          <Col span={8}>
            <Text strong>所属区域：</Text> {selectedStock.areaName}
          </Col>
          <Col span={16}>
            <Text strong>当前位置：</Text>
            <div style={{ marginTop: 4 }}>
              {selectedStock.locationVo && selectedStock.locationVo.length > 0 ? (
                <List
                  size="small"
                  dataSource={selectedStock.locationVo}
                  renderItem={(item) => (
                    <List.Item>
                      <Text>{item.shelfName}：</Text>
                      {item.storageNames.map((name, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: '0 4px' }}>
                          {name}
                        </Tag>
                      ))}
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">无位置信息</Text>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedStock) {
        message.error('请先选择需要变更的库存');
        return;
      }

      setLoading(true);

      // 准备提交数据
      const submitData = {
        stockId: values.stockId,
        areaId: values.areaId,
        locations: values.locations,
        remark: values.remark || '',
      };

      const result = await addMovement(submitData);

      if (result.code === 200) {
        message.success('新增变动成功');
        onSuccess();
      } else {
        message.error(result.msg || '操作失败');
      }
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('表单验证失败，请检查填写内容');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Drawer
        title="新增库存变动"
        width={1300}
        onClose={onClose}
        open={visible}
        bodyStyle={{ paddingBottom: 80 }}
        extra={
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              onClick={handleSubmit}
              type="primary"
              loading={loading}
            >
              提交
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            locations: [{ shelfId: undefined, storageIds: [] }],
          }}
        >
          <Form.Item
            name="stockId"
            label="选择库存"
            rules={[{ required: true, message: '请选择需要变更的库存' }]}
          >
            <Input
              hidden
              style={{ display: 'none' }}
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={handleOpenStockSelect}>
              选择库存
            </Button>
          </div>

          {renderSelectedStockInfo()}

          <Divider />

          <Form.Item
            name="areaId"
            label="变更后区域"
            rules={[{ required: true, message: '请选择变更后的区域' }]}
          >
            <Select
              placeholder="请选择变更后的区域"
              onChange={handleAreaChange}
            >
              {areas.map((area) => (
                <Option key={area.id} value={area.id}>
                  {area.areaName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Title level={5} style={{ marginBottom: 16, marginTop: 24 }}>
            变更后位置信息
          </Title>
          {!form.getFieldValue('areaId') && (
            <div
              style={{
                marginBottom: 16,
                padding: 8,
                backgroundColor: '#f0f2f5',
                borderRadius: 4,
              }}
            >
              <Text type="secondary">
                请先选择变更后区域，然后才能添加货架和库位信息
              </Text>
            </div>
          )}
          <Form.List name="locations">
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
                                return (
                                  <Option key={shelf.id} value={shelf.id}>
                                    {shelf.shelfName}
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
                              !form.getFieldValue(['locations', index, 'shelfId'])
                            }
                            style={{ width: '100%' }}
                            onChange={(value) => {
                              handleStorageChange(value, index);
                            }}
                          >
                            {form.getFieldValue(['locations', index, 'shelfId']) &&
                            storagesByShelf[
                              form.getFieldValue(['locations', index, 'shelfId'])
                            ]
                              ? storagesByShelf[
                                  form.getFieldValue([
                                    'locations',
                                    index,
                                    'shelfId',
                                  ])
                                ]
                                .filter(storage => storage.status === 1) // 只显示可用库位
                                .map((storage) => (
                                  <Option
                                    key={storage.id}
                                    value={storage.id}
                                    label={storage.locationName || storage.id}
                                    title={`ID: ${storage.id}, 名称: ${storage.locationName || storage.id}`}
                                  >
                                    {storage.locationName || storage.id}
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

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入变更备注信息"
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 库存选择抽屉 */}
      <StockSelectDrawer
        visible={stockSelectVisible}
        onClose={() => setStockSelectVisible(false)}
        onSelect={handleStockSelect}
      />
    </>
  );
};

export default MoveAddDrawer; 